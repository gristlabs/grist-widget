import { assert } from 'mocha-webdriver';
import { getGrist } from 'test/getGrist';

describe('flashcards', function() {
  this.timeout(20000);
  const grist = getGrist();

  it('can show a flashcard', async function() {
    const docId = await grist.upload('test/fixtures/docs/SchoolsSample.grist');
    await grist.openDoc(docId);
    await grist.toggleSidePanel('right', 'open');
    await grist.addNewSection(/Custom/, /School/);
    await grist.clickWidgetPane();
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
});
