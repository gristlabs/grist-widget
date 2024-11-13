import {Key, assert, driver} from 'mocha-webdriver';
import {getGrist} from 'test/getGrist';

describe('chart', function () {
  this.timeout(10000);
  const grist = getGrist();
  grist.bigScreen();

  it('can create a basic chart', async function () {
    // Open fixture doc
    const docId = await grist.upload('test/fixtures/docs/ChartWidgetTest.grist');
    await grist.openDoc(docId);

    // Add a custom chart widget
    await grist.toggleSidePanel('right', 'open');
    await grist.addNewSection(/Custom/, /Table1/, {dismissTips: true});
    await grist.clickWidgetPane();
    await grist.selectCustomWidget('Advanced Charts');
    await grist.setCustomWidgetAccess('full');  // required

    // Wait for the widget to load
    await grist.waitToPass(async () => {
      const txt = await grist.getCustomWidgetBody();
      assert.match(txt, /Trace/);
    }, 6000);

    // Configure a pie chart within the widget
    await grist.inCustomWidget(async () => {
      // Click "+ Trace"
      await driver.find('.js-add-button').click();

      // Set the trace type to Pie
      await driver.findWait('.trace-type-select-button', 100).click();
      await driver.findContentWait('.trace-item__label', 'Pie', 200).click();

      async function chooseColumnFromFieldDropdown(label: RegExp, column: RegExp) {
        const field = driver.findContentWait('.field', label, 200);
        const dropdown = field.findWait('.dropdown-container', 200);
        await dropdown.click();
        await driver.findContentWait('.Select__option', column, 200).click();
      }

      // The fixture doc has two columns: `num` and `choice list`.
      await chooseColumnFromFieldDropdown(/Values/, /num/);
      await chooseColumnFromFieldDropdown(/Labels/, /choice list/);

      const result =
        // Percentages inside the pie chart
        '55.6%\n44.4%\n' +
        // Legend
        'choice B\nchoice A';

      assert.equal(
        await driver.findContentWait('.plotly_editor_plot', result, 2000).getText(),
        result
      );
    });
  });

  it('can update automatically when records change', async function () {
    // Change a cell value in `num` from 3 to 4
    await driver.findContent('.gridview_row .field_clip', '3').click();
    await driver.sendKeys('4', Key.ENTER);

    // Check that the chart updates automatically
    await grist.inCustomWidget(async () => {
      await grist.waitToPass(async () => {
        assert.equal(
          await driver.find('.plotly_editor_plot').getText(),
          // These percentages are slightly different from the previous ones.
          '54.5%\n45.5%\n' +
          'choice B\nchoice A',
        );
      }, 200);
    });
  });
});
