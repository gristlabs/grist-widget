import { assert } from 'mocha-webdriver';
import { getGrist } from 'test/getGrist';

describe('inspect', function() {
  this.timeout(20000);
  const grist = getGrist();

  it('can show a record', async function() {
    const docId = await grist.upload('test/fixtures/docs/SchoolsSample.grist');
    await grist.openDoc(docId);
    await grist.toggleSidePanel('right', 'open');
    await grist.addNewSection(/Custom/, /School/);
    await grist.clickWidgetPane();
    await grist.selectCustomWidget('Inspect Record');
    await grist.setCustomWidgetAccess('full');
    await grist.waitToPass(async () => {
      const txt = await grist.getCustomWidgetBody();
      assert.match(txt, /SUPERINTENDENT/);
    });
  });
});
