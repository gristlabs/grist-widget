import {assert, driver, Key} from 'mocha-webdriver';
import {getGrist} from 'test/getGrist';

describe('jupyterlite', function () {
  this.timeout(30000);
  const grist = getGrist();
  grist.bigScreen();

  it('can create a basic notebook', async function () {
    // Open fixture doc
    const docId = await grist.upload('test/fixtures/docs/ChartWidgetTest.grist');
    await grist.openDoc(docId);

    // Add a custom notebook widget
    await grist.toggleSidePanel('right', 'open');
    await grist.addNewSection(/Custom/, /Table1/, {dismissTips: true});
    await grist.clickWidgetPane();
    await grist.selectCustomWidget('JupyterLite Notebook');
    await grist.setCustomWidgetAccess('read table');  // required

    // Wait for a blank notebook to load in the widget
    await grist.waitToPass(async () => {
      const txt = await grist.getCustomWidgetBody();
      assert.match(txt, /\[ ]:/);
    }, 10000);

    await grist.inCustomWidget(async () => {
      // Put a callback in a code cell
      await driver.find('.CodeMirror-line').click();
      await driver.sendKeys(`
@grist.on_records
def foo(r):
    print(r)
`);

      // press Shift+Enter to run the code cell
      await driver.actions()
        .keyDown(Key.SHIFT)
        .sendKeys(Key.ENTER)
        .keyUp(Key.SHIFT)
        .perform();

      // Check that the output contains the records
      await grist.waitToPass(async () => {
        assert.equal(
          (await driver.find('.jp-OutputArea-output').getText()).trim(),
          "{choice_list: [[choice A], [choice B], [choice A, choice B]],\n" +
          " num: [1, 2, 3],\n" +
          " id: [1, 2, 3]}",
        );
      }, 10000);
    });
  });

  it('can update automatically when records change', async function () {
    // Change a cell value in `num` from 3 to 4
    await driver.findContent('.gridview_row .field_clip', '3').click();
    await driver.sendKeys('4', Key.ENTER);

    // Check that the code updates automatically
    await grist.inCustomWidget(async () => {
      await grist.waitToPass(async () => {
        assert.equal(
          (await driver.find('.jp-OutputArea-output').getText()).trim(),
          "{choice_list: [[choice A], [choice B], [choice A, choice B]],\n" +
          // num has changed from 3 to 4
          " num: [1, 2, 4],\n" +
          " id: [1, 2, 3]}",
        );
      }, 300);
    });
  });
});
