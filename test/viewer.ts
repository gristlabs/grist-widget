import {assert} from 'mocha-webdriver';
import {getGrist} from "./getGrist";

describe('viewer', function () {
  this.timeout(20000);
  const grist = getGrist();
  before(async function () {
    const docId = await grist.upload('test/fixtures/docs/Images.grist');
    await grist.openDoc(docId);
    await grist.toggleSidePanel('right', 'open');
    await grist.clickWidgetPane();
  });

  describe('loading images', function () {
      it('single column, should load image from that column without mapping', async function () {
         await grist.fillCell('Image', 1,'https://www.testimage.com/image.jpg');
          await grist.waitToPass(async () => {
            const img = await grist.getCustomWidgetElementParameter('img','src');
            assert.equal(img, 'https://www.testimage.com/image.jpg');
          });
      });
      it('multiple columns, no mapping, should show error', async function () {

      });
      it('multiple columns, with mapping, should load image from mapped column', async function () {

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
});
