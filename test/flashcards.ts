import { assert } from 'mocha-webdriver';
import { getGrist } from 'test/getGrist';

describe('flashcards', function() {
  this.timeout(20000);
  const grist = getGrist();

  it('can show a flashcard', async function() {
    const docId = await grist.upload('test/fixtures/docs/SchoolsSample.grist');
    await grist.openDoc(docId);
    await grist.dismissBehavioralPrompts();
    await grist.toggleSidePanel('right', 'open');
    await grist.addNewSection(/Custom/, /School/, {dismissTips: true});
    await grist.clickWidgetGallery();
    await grist.selectCustomWidget(/Flash/);
    await grist.setCustomWidgetAccess('full');
    await grist.setCustomWidgetMapping('Question', /School Head/);
    await grist.setCustomWidgetMapping('Answer', /School Name/);
    await grist.waitToPass(async () => {
      const txt = await grist.getCustomWidgetBody('#question');
      assert.equal(txt, 'SUPERINTENDENT - DR. MARGUERITE VANDEN WYNGAARD');
    });
    const txt = await grist.getCustomWidgetBody('#answer');
    assert.equal(txt, '');
    await grist.inCustomWidget(async () => {
      await grist.driver.find('#show').click();
    });
    await grist.waitToPass(async () => {
      const txt = await grist.getCustomWidgetBody('#answer');
      assert.equal(txt, 'ALBANY CITY SD');
    });
  });

  it('shows the question and answer as plain text, not markup', async function() {
    const docId = await grist.upload('test/fixtures/docs/Calendar.grist');
    await grist.openDoc(docId);
    await grist.dismissBehavioralPrompts();
    await grist.toggleSidePanel('right', 'open');

    // A label that happens to contain some HTML. We want it shown as text,
    // character for character, rather than turned into real page elements.
    const label = '<img src=x onerror="window.__ran = true">';
    await grist.sendActions([
      ['AddTable', 'Cards', [
        {id: 'Question', type: 'Text'},
        {id: 'Answer', type: 'Text'},
      ]],
      ['AddRecord', 'Cards', null, {Question: label, Answer: label}],
    ]);

    await grist.addNewSection(/Custom/, /Cards/, {dismissTips: true});
    await grist.clickWidgetGallery();
    await grist.selectCustomWidget(/Flash/);
    await grist.setCustomWidgetAccess('full');
    await grist.setCustomWidgetMapping('Question', /Question/);
    await grist.setCustomWidgetMapping('Answer', /Answer/);

    // The question shows up verbatim as text...
    await grist.waitToPass(async () => {
      assert.equal(await grist.getCustomWidgetBody('#question'), label);
    });
    // ...and it didn't turn into an actual element on the page.
    assert.equal(
      await grist.executeScriptInCustomWidget<number>(
        () => document.querySelectorAll('#question img, #question script').length),
      0);

    // Same story once the answer is revealed.
    await grist.inCustomWidget(async () => {
      await grist.driver.find('#show').click();
    });
    await grist.waitToPass(async () => {
      assert.equal(await grist.getCustomWidgetBody('#answer'), label);
    });
    assert.equal(
      await grist.executeScriptInCustomWidget<number>(
        () => document.querySelectorAll('#answer img, #answer script').length),
      0);

    // The inline handler never got a chance to run.
    assert.notEqual(
      await grist.executeScriptInCustomWidget(() => (window as any).__ran),
      true);
  });

  it('handles a table with no records', async function() {
    const docId = await grist.upload('test/fixtures/docs/Calendar.grist');
    await grist.openDoc(docId);
    await grist.dismissBehavioralPrompts();
    await grist.toggleSidePanel('right', 'open');

    // An empty deck must not break the widget (it used to run off the end of
    // an empty list and throw).
    await grist.sendActions([
      ['AddTable', 'EmptyCards', [
        {id: 'Question', type: 'Text'},
        {id: 'Answer', type: 'Text'},
      ]],
    ]);

    await grist.addNewSection(/Custom/, /EmptyCards/, {dismissTips: true});
    await grist.clickWidgetGallery();
    await grist.selectCustomWidget(/Flash/);
    await grist.setCustomWidgetAccess('full');
    await grist.setCustomWidgetMapping('Question', /Question/);
    await grist.setCustomWidgetMapping('Answer', /Answer/);

    // With no cards it stays on its initial prompt; the progress counter stays
    // "?" rather than the "NaN of 0" the off-by-one produced just before it
    // threw.
    await grist.waitToPass(async () => {
      assert.include(await grist.getCustomWidgetBody('#question'), 'Waiting for data...');
      assert.equal(await grist.getCustomWidgetBody('#progress-text'), '?');
    });
  });
});
