import {assert, driver} from 'mocha-webdriver';
import {getGrist} from "./getGrist";

const TEST_IMAGE = 'https://www.testimage.com/image.jpg'
const TEST_IMAGE2 = 'https://www.testimage.com/image2.jpg'
const TEST_IMAGE3 = 'https://www.testimage.com/image3.jpg'


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
        await grist.setCustomWidgetAccess('full');
        //test if error is displayed
        await testIfErrorIsDisplayed()
        //undo create column 
      });


      it('multiple columns, with mapping, should load image from mapped column', async function () {
        //select image widget
        await grist.clickWidgetPane();
        //add mappiing 
        await grist.setCustomWidgetMapping('ImageUrl',/Image/);
        // check if image is showed 
        await testIfImageIsDispalyed(TEST_IMAGE);
      });
  });
  describe('navigation', function () {
    before(async function () {
      //remove all cells from image table 
      await grist.sendActionsAndWaitForServer([['RemoveRecord', 'Data',1]],1000);
    });
    describe('no image', function (){
      it('should have navigation buttons hidden', async function () {
          assert.isFalse(await areNavigationButtonsVisible(), 'navigation buttons should not be visible when there is no image');
      });
      it('should have no image', async function () {
        assert.isFalse(await isImageVisible(), 'image element should not be visible when there is no image to be shown');

      });
    })
    describe('single image', function (){
      before(async function () {
        //go to data table 
        await grist.focusOnWidget(/DATA/);
        await grist.fillCell('Image', 1,TEST_IMAGE);
      });
      it('should have navigation buttons hidden', async function () {
        assert.isFalse(await areNavigationButtonsVisible(), 'navigation buttons should not be visible when there is only one image');
      });
      it('should have image', async function () {
        assert.isTrue(await isImageVisible(), 'image element should be visible when there is image to be shown');
      });
      after(async function () {
        //remove setted cell
        await grist.undo();
      });
    })
    describe('multiple images', function (){
      const nextButtonId = '#calendar-button-next';
      const previousButtonId = '#calendar-button-previous';
      before(async function () {
        await grist.focusOnWidget(/DATA/);
        //input 3 images in the same cell, separated by space
        await grist.fillCell('Image', 1,`${TEST_IMAGE} ${TEST_IMAGE2} ${TEST_IMAGE3}`);
      });
      it('should have navigation buttons visible', async function () {
        assert.isTrue(await areNavigationButtonsVisible(), 'navigation buttons should be visible when there is more than one image');
      });
      it('should have image', async function () {
        assert.isTrue(await isImageVisible(), 'image element should be visible when there is image to be shown');
      });
      it('should navigate to next image by button', async function () {
        await grist.inCustomWidget(async ()=>await driver.find(nextButtonId).click());
        await testIfImageIsDispalyed(TEST_IMAGE2);
        await grist.inCustomWidget(async ()=>await driver.find(nextButtonId).click());
        await testIfImageIsDispalyed(TEST_IMAGE3);
      });
      it('should navigate to previous image by button', async function () {
        await grist.inCustomWidget(async ()=>await driver.find(previousButtonId).click());
        await testIfImageIsDispalyed(TEST_IMAGE2);
        await grist.inCustomWidget(async ()=>await driver.find(previousButtonId).click());
        await testIfImageIsDispalyed(TEST_IMAGE);
      });

      it('should navigate to last image by click next button right on last image', async function () {
      // verify if first image is displayed
      await testIfImageIsDispalyed(TEST_IMAGE);
      // click previous button one time 
      await grist.inCustomWidget(async ()=>await driver.find(previousButtonId).click());
      // verify if first image is displayed
      await testIfImageIsDispalyed(TEST_IMAGE3);
      });

      it('should navigate to first image by click previous button right on first image', async function () {
      // verify if last image is displayed
      await testIfImageIsDispalyed(TEST_IMAGE3);
      // click next button one more time 
      await grist.inCustomWidget(async ()=>await driver.find(nextButtonId).click());
      // verify if first image is displayed
      await testIfImageIsDispalyed(TEST_IMAGE);
      });

      it('should navigate to next image by swipe left', async function () {

      });
      it('should navigate to previous image by swipe right', async function () {

      });

      it ('should filter garbage', async function () {

      });

      after(async function () {
        //remove setted cell
        await grist.undo();
      });
    })
  });

  async function testIfImageIsDispalyed(url: string) {
    await grist.waitToPass(async () => {
      const img = await grist.getCustomWidgetElementParameter('img','src');
      assert.equal(img, 'https://www.testimage.com/image.jpg');
    });
  }

  async function areNavigationButtonsVisible() {
    return await grist.inCustomWidget(async ()=>await driver.find('#navigation-buttons').isDisplayed());
  }
  
  async function isImageVisible(){
    return await grist.inCustomWidget(async ()=>await driver.find('#viewer').isDisplayed());
  }
});

