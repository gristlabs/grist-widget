import { Key, assert } from 'mocha-webdriver';
import { getGrist } from 'test/getGrist';

describe('markdown', function() {
  this.timeout(20000);
  const grist = getGrist();

  it('renders text as markdown', async function() {
    const docId = await grist.upload('test/fixtures/docs/SchoolsSample.grist');
    await grist.openDoc(docId);
    await grist.toggleSidePanel('right', 'open');
    await grist.addNewSection(/Custom/, /School/, {dismissTips: true});
    await grist.clickWidgetPane();
    await grist.selectCustomWidget(/Markdown/);
    await grist.setCustomWidgetAccess('full');
    await grist.setCustomWidgetMapping('Content', /School Head/);
    await grist.waitToPass(async () => {
      const paragraph = await grist.getCustomWidgetBody('.editor-preview > p');
      assert.equal(paragraph, 'SUPERINTENDENT - DR. MARGUERITE VANDEN WYNGAARD');
    });
    await grist.inCustomWidget(async () => {
      await grist.driver.find('button.edit').click();
      await grist.driver.sendKeys('# ');
      await grist.driver.find('button.save').click();
    });
    await grist.waitToPass(async () => {
      const heading = await grist.getCustomWidgetBody('.editor-preview > h1');
      assert.equal(heading, 'SUPERINTENDENT - DR. MARGUERITE VANDEN WYNGAARD');
    });
  });

  it('saves on blur', async function() {
    await grist.inCustomWidget(async () => {
      await grist.driver.find('button.edit').click();
      await grist.driver.sendKeys(Key.END, Key.ENTER, Key.ENTER,
        ' - Phone Number: (123) 456-7890');
    });
    await grist.openAccountMenu();
    await grist.waitToPass(async () => {
      const heading = await grist.getCustomWidgetBody('.editor-preview > h1');
      assert.equal(heading, 'SUPERINTENDENT - DR. MARGUERITE VANDEN WYNGAARD');
      const listItem = await grist.getCustomWidgetBody('.editor-preview > ul > li');
      assert.equal(listItem, 'Phone Number: (123) 456-7890');
    });
  });
});
