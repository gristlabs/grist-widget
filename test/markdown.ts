import { Key, assert } from 'mocha-webdriver';
import { getGrist } from 'test/getGrist';

describe('markdown', function() {
  this.timeout(200000);
  const gu = getGrist();
  gu.bigScreen();

  it('renders text as markdown', async function() {
    const docId = await gu.upload('test/fixtures/docs/SchoolsSample.grist');
    await gu.openDoc(docId);
    await gu.waitToPass(async () => {
      await gu.dismissBehavioralPrompts();
    });
    await gu.toggleSidePanel('right', 'open');
    await gu.addNewSection(/Custom/, /School/, {dismissTips: true});
    await gu.clickWidgetGallery();
    await gu.selectCustomWidget(/Markdown/);
    await gu.driver.findWait('.test-custom-widget-not-mapped', 6000);
    await gu.setCustomWidgetAccess('full');
    await gu.setCustomWidgetMapping('Content', /School Head/);
    await gu.waitToPass(async () => {
      const paragraph = await gu.getCustomWidgetBody('.editor-preview > p');
      assert.equal(paragraph, 'SUPERINTENDENT - DR. MARGUERITE VANDEN WYNGAARD');
    });
    await gu.inCustomWidget(async () => {
      await gu.driver.find('button.edit').click();
      await gu.driver.sendKeys('# ');
      await gu.driver.find('button.save').click();
    });
    await gu.waitToPass(async () => {
      const heading = await gu.getCustomWidgetBody('.editor-preview > h1');
      assert.equal(heading, 'SUPERINTENDENT - DR. MARGUERITE VANDEN WYNGAARD');
    });
  });

  it('saves on blur', async function() {
    await gu.inCustomWidget(async () => {
      await gu.driver.find('button.edit').click();
      await gu.driver.sendKeys(Key.END, Key.ENTER, Key.ENTER,
        ' - Phone Number: (123) 456-7890');
    });
    await gu.driver.findWait('#grist-tools-heading', 2000).click();
    await gu.waitToPass(async () => {
      const heading = await gu.getCustomWidgetBody('.editor-preview > h1');
      assert.equal(heading, 'SUPERINTENDENT - DR. MARGUERITE VANDEN WYNGAARD');
      const listItem = await gu.getCustomWidgetBody('.editor-preview > ul > li');
      assert.equal(listItem, 'Phone Number: (123) 456-7890');
    });
  });
});
