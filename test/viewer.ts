import {assert, driver} from 'mocha-webdriver';
import {getGrist} from "./getGrist";

const TEST_IMAGE = 'https://www.testimage.com/image.jpg'


describe('viewer', function () {
  this.timeout(30000);
  const grist = getGrist();
  before(async function () {
    const docId = await grist.upload('test/fixtures/docs/Images.grist');
    await grist.openDoc(docId);
    await grist.toggleSidePanel('right', 'open');
    await grist.clickWidgetPane();
  });


  async function testIfErrorIsDisplayed() {
    assert.equal(await grist.inCustomWidget(()=>driver.find('#error').isPresent()), true);
  }

  describe('loading images', function () {
      it('single column, should load image from that column without mapping', async function () {
         await grist.fillCell('Image', 1,TEST_IMAGE);
         await testIfImageIsDispalyed(TEST_IMAGE);
      });

      //in the moment of writing this test, widget has default access only to unmapped columns that was in table at the moment of widget creation
      // that means - if there were more that one column in the momnet of creation, error will be displayed. In other case, widget will still use first column
      it('multiple columns - column added after widget, no mapping, should work based on first column', async function () {
        //add new column
        await grist.addColumn('DATA','Text','description');
        //because widget was displayed, no error should be shown, and data from first column should be displayed
        await testIfImageIsDispalyed(TEST_IMAGE)

        await grist.undo(2);

      });

      it('multiple columns - column added before, no mapping, should show error', async function () {
        // remove custom widget
        await grist.removeWidget(/Image/);
        //add new column
        await grist.addColumn('DATA','Text','description');
        //add widget again
        await grist.addCustomSection("Image",'Image viewer',/Data/);
        //test if error is displayed
        await testIfErrorIsDisplayed()
        //undo create column 
      });



      it('multiple columns, with mapping, should load image from mapped column', async function () {
        //remove custom widget 
        await grist.removeWidget(/Image/);
        //add new column
        await grist.addColumn('DATA','Text','description');
        //add custom widget again 
        await grist.addCustomSection("Image",'Image Viewer');
        //check if error is displayed
      });
  });
  describe('navigation', function () {
    describe('no image', function (){
      it('should have navigation buttons hidden', async function () {

      });
      it('should have no image', async function () {

      });
    })
    describe('single image', function (){
      it('should have navigation buttons hidden', async function () {

      });
      it('should have image', async function () {

      });
    })
    describe('multiple images', function (){
      it('should have navigation buttons visible', async function () {

      });
      it('should have image', async function () {

      });
      it('should navigate to next image by button', async function () {

      });
      it('should navigate to previous image by button', async function () {

      });
      it('should navigate to next image by swipe left', async function () {

      });
      it('should navigate to previous image by swipe right', async function () {

      });
      it ('should filter garbage', async function () {

      });
    })
  });

  async function testIfImageIsDispalyed(url: string) {
    await grist.waitToPass(async () => {
      const img = await grist.getCustomWidgetElementParameter('img','src');
      assert.equal(img, 'https://www.testimage.com/image.jpg');
    });
  }

});
