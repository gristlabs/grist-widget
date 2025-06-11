import { assert, driver } from 'mocha-webdriver';
import { getGrist } from "./getGrist";

const TEST_IMAGE = 'http://localhost:9998/test/fixtures/images/image1.jpg'
const TEST_IMAGE2 = 'http://localhost:9998/test/fixtures/images/image2.jpg'
const TEST_IMAGE3 = 'http://localhost:9998/test/fixtures/images/image3.jpg'


describe('viewer', function () {
  this.timeout(30000);
  const gu = getGrist();
  before(async function () {
    const docId = await gu.upload('test/fixtures/docs/Images.grist');
    await gu.openDoc(docId);
    await gu.toggleSidePanel('right', 'open');

    // Disable behavioral prompts for this session.
    await driver.executeScript(() => {
      window.localStorage.setItem(
        'userPrefs:u=1',
        '{"behavioralPrompts":{"dontShowTips":true,"dismissedTips":["pageWidgetPicker"]}}'
      );      
    });

    await driver.find('.custom_view_container').click();
    await gu.setCustomWidgetMapping('ImageUrl', /Image/);

  });

  async function testIfErrorIsDisplayed() {
    assert.equal(await gu.inCustomWidget(() => driver.find('#error').isPresent()), true);
  }

  describe('row transition', function () {
    enum RowData {
      NONE = 1,
      NONE_NEXT = 2,
      SINGLE_IMAGE = 3,
      SINGLE_IMAGE_NEXT = 4,
      MULTIPLE_IMAGES = 5,
      MULTIPLE_IMAGES_NEXT = 6,

    }
    before(async function () {
      //add set of images to the table
      await gu.sendActions(
        [
          ['AddRecord', 'Data', RowData.NONE, { Image: "" }],
          ['AddRecord', 'Data', RowData.NONE_NEXT, { Image: "" }],
          ['AddRecord', 'Data', RowData.SINGLE_IMAGE, { Image: TEST_IMAGE }],
          ['AddRecord', 'Data', RowData.SINGLE_IMAGE_NEXT, { Image: TEST_IMAGE }],
          ['AddRecord', 'Data', RowData.MULTIPLE_IMAGES, { Image: TEST_IMAGE + " " + TEST_IMAGE2 }],
          ['AddRecord', 'Data', RowData.MULTIPLE_IMAGES_NEXT, { Image: TEST_IMAGE + " " + TEST_IMAGE2 }],
        ]
      )
    });
    it('none to none', async function () {
      await selectDataRow(RowData.NONE);
      await selectDataRow(RowData.NONE_NEXT);

      await assertImageElementVisible(false);
      await assertNavigationButtonsVisible(false);
    });

    it('none to single image', async function () {
      await selectDataRow(RowData.NONE);
      await selectDataRow(RowData.SINGLE_IMAGE);

      await assertImageElementVisible(true);
      await assertNavigationButtonsVisible(false);
    });

    it('none to multiple images', async function () {
      await selectDataRow(RowData.NONE);
      await selectDataRow(RowData.MULTIPLE_IMAGES);

      await assertImageElementVisible(true);
      await assertNavigationButtonsVisible(true);
    });

    it('single image to none', async function () {
      await selectDataRow(RowData.SINGLE_IMAGE);
      await selectDataRow(RowData.NONE);

      await assertImageElementVisible(false);
      await assertNavigationButtonsVisible(false);
    });

    it('single image to single image', async function () {
      await selectDataRow(RowData.SINGLE_IMAGE);
      await selectDataRow(RowData.SINGLE_IMAGE_NEXT);

      await assertImageElementVisible(true);
      await assertNavigationButtonsVisible(false);
    });

    it('single image to multiple images', async function () {
      await selectDataRow(RowData.SINGLE_IMAGE);
      await selectDataRow(RowData.MULTIPLE_IMAGES);

      await assertImageElementVisible(true);
      await assertNavigationButtonsVisible(true);
    });

    it('multiple images to none', async function () {
      await selectDataRow(RowData.MULTIPLE_IMAGES);
      await selectDataRow(RowData.NONE);

      await assertImageElementVisible(false);
      await assertNavigationButtonsVisible(false);
    });

    it('multiple images to single image', async function () {
      await selectDataRow(RowData.MULTIPLE_IMAGES);
      await selectDataRow(RowData.SINGLE_IMAGE);

      await assertImageElementVisible(true);
      await assertNavigationButtonsVisible(false);
    });

    it('multiple images to multiple images', async function () {
      await selectDataRow(RowData.MULTIPLE_IMAGES);
      await selectDataRow(RowData.MULTIPLE_IMAGES_NEXT);

      await assertImageElementVisible(true);
      await assertNavigationButtonsVisible(true);
    });

    after(async function () {
      //remove row added in before block
      await gu.sendActions([
        ['RemoveRecord', 'Data', 6],
        ['RemoveRecord', 'Data', 5],
        ['RemoveRecord', 'Data', 4],
        ['RemoveRecord', 'Data', 3],
        ['RemoveRecord', 'Data', 2],
        ['RemoveRecord', 'Data', 1],
      ], 1000);
    });
  });

  describe('loading images', function () {
    it('single column, should load image from that column without mapping', async function () {
      await gu.sendActions([
        ['AddRecord', 'Data', 1, { Image: TEST_IMAGE }],
      ])
      await assertIfImageIsDisplayed(TEST_IMAGE);
    });

    //in the moment of writing this test, widget has default access only to unmapped columns that was in table at the moment of widget creation
    // that means - if there were more that one column in the momnet of creation, error will be displayed. In other case, widget will still use first column
    it('multiple columns - column added after widget, no mapping, should work based on first column', async function () {
      //add new column
      await gu.addColumn('DATA', 'description');
      //because widget was displayed, no error should be shown, and data from first column should be displayed
      await assertIfImageIsDisplayed(TEST_IMAGE)

      await gu.undo(2);

    });

    it('multiple columns - column added before, no mapping, should show error', async function () {
      // remove custom widget
      await gu.removeWidget(/Image/);
      //add new column
      await gu.addColumn('DATA', 'description');
      //add widget again
      await gu.forceDismissTips();
      await gu.addCustomSection("Image", 'Image viewer', /Data/);
      await gu.setCustomWidgetAccess('full');
      await gu.setCustomWidgetMapping('ImageUrl', /Image/);
      //test if error is displayed
      await gu.waitForFrame();
      await testIfErrorIsDisplayed()
    });


    it('multiple columns, with mapping, should load image from mapped column', async function () {
      //select image widget
      await gu.clickWidgetSection();
      //add mappiing 
      await gu.setCustomWidgetMapping('ImageUrl', /Image/);
      // check if image is showed 
      await assertIfImageIsDisplayed(TEST_IMAGE);
    });

    after(async function () {
      //remove setted cell
      await gu.sendActions([
        ['RemoveRecord', 'Data', 1],
      ], 1000);
    });
  });
  describe('navigation', function () {
    before(async function () {
      //remove all cells from image table 
      await gu.sendActions([['RemoveRecord', 'Data', 1]], 1000);
    });
    describe('no image', function () {
      it('should have navigation buttons hidden', async function () {
        await assertNavigationButtonsVisible(false);
      });
      it('should have no image', async function () {
        await assertImageElementVisible(false);
      });
    })
    describe('single image', function () {
      before(async function () {
        //go to data table 
        await gu.selectSectionByTitle(/^DATA$/);
        await gu.sendActions([
          ['AddRecord', 'Data', 1, { Image: TEST_IMAGE }],
        ]);
      });
      it('should have navigation buttons hidden', async function () {
        await assertNavigationButtonsVisible(false);
      });
      it('should have image', async function () {
        await gu.waitToPass(async () => {
          await assertImageElementVisible(true);
        });
      });
      after(async function () {
        //remove setted cell
        await gu.undo();
      });
    })
    describe('multiple images', function () {
      const nextButtonId = '#calendar-button-next';
      const previousButtonId = '#calendar-button-previous';
      before(async function () {
        await gu.selectSectionByTitle(/^DATA$/);
        //input 3 images in the same cell, separated by space
        const longContent = `${TEST_IMAGE} this is some garbage content ` +
          `${TEST_IMAGE2} and event more garbage ` +
          `${TEST_IMAGE3}`;
        await gu.sendActions([
          ['AddRecord', 'Data', 1, { Image: longContent }],
        ]);
      });

      it('should have navigation buttons visible', async function () {
        await assertNavigationButtonsVisible(true);
      });

      it('should have image', async function () {
        await assertImageElementVisible(true);
      });

      it('should navigate to next image by button', async function () {
        await gu.inCustomWidget(async () => await driver.find(nextButtonId).click());
        await assertIfImageIsDisplayed(TEST_IMAGE2);
        await gu.inCustomWidget(async () => await driver.find(nextButtonId).click());
        await assertIfImageIsDisplayed(TEST_IMAGE3);
      });
      it('should navigate to previous image by button', async function () {
        await gu.inCustomWidget(async () => await driver.find(previousButtonId).click());
        await assertIfImageIsDisplayed(TEST_IMAGE2);
        await gu.inCustomWidget(async () => await driver.find(previousButtonId).click());
        await assertIfImageIsDisplayed(TEST_IMAGE);
      });

      it('should navigate to last image by click next button right on last image', async function () {
        // verify if first image is displayed
        await assertIfImageIsDisplayed(TEST_IMAGE);
        // click previous button one time 
        await gu.inCustomWidget(async () => await driver.find(previousButtonId).click());
        // verify if first image is displayed
        await assertIfImageIsDisplayed(TEST_IMAGE3);
      });

      it('should navigate to first image by click previous button right on first image', async function () {
        // verify if last image is displayed
        await assertIfImageIsDisplayed(TEST_IMAGE3);
        // click next button one more time 
        await gu.inCustomWidget(async () => await driver.find(nextButtonId).click());
        // verify if first image is displayed
        await assertIfImageIsDisplayed(TEST_IMAGE);
      });

      it('should navigate to next image by swipe left', async function () {
        await swipeLeft('#viewer')
        await assertIfImageIsDisplayed(TEST_IMAGE2);
        await swipeLeft('#viewer')
        await assertIfImageIsDisplayed(TEST_IMAGE3);
      });

      it('should navigate to previous image by swipe right', async function () {
        await swipeRight('#viewer')
        await assertIfImageIsDisplayed(TEST_IMAGE2);
        await swipeRight('#viewer')
        await assertIfImageIsDisplayed(TEST_IMAGE);
      });

      after(async function () {
        //remove setted cell
        await gu.undo();
      });
    })
  });

  async function swipeLeft(element: string | RegExp) {
    gu.executeScriptInCustomWidget(swipeScript, element, 'left')
  }

  async function swipeRight(element: string | RegExp) {
    gu.executeScriptInCustomWidget(swipeScript, element, 'right')
  }

  function swipeScript(elementTag: string, direction: 'left' | 'right') {
    let mode = direction;
    let element = document.querySelector(elementTag);

    if (!element) {
      console.error("Element was not found.");
    }
    else {

      let touch = new Touch({
        identifier: Date.now(),
        target: element,
        clientX: 0,
      });

      let touchStart = new TouchEvent('touchstart', {
        touches: [touch],
      });

      element.dispatchEvent(touchStart);

      let clientX = (mode === "left") ? -200 : 200;
      touch = new Touch({
        identifier: Date.now(),
        target: element,
        clientX: clientX,
      });

      let touchEnd = new TouchEvent('touchend', {
        changedTouches: [touch]
      });

      element.dispatchEvent(touchEnd);
    }
  }

  async function assertImageElementVisible(expected: boolean) {
    const isVisible = await isImageElementVisible();
    assert.equal(isVisible, expected, `Image was expected to be ${expected ? 'visible' : 'not visible'} but it was not.`);
  }

  async function assertNavigationButtonsVisible(expected: boolean) {
    const isVisible = await areNavigationButtonsVisible();
    assert.equal(isVisible, expected, `Navigation buttons were expected to be ${expected ? 'visible' : 'not visible'} but they were not.`);
  }

  async function assertIfImageIsDisplayed(url: string) {
    await gu.waitToPass(async () => {
      const img = await gu.getCustomWidgetElementParameter('img', 'src');
      assert.equal(img, url);
    });
  }

  async function areNavigationButtonsVisible() {
    return await gu.inCustomWidget(async () => await driver.find('#navigation-buttons').isDisplayed());
  }

  async function isImageElementVisible() {
    return await gu.inCustomWidget(async () => await driver.find('#viewer').isDisplayed());
  }

  async function selectDataRow(row: number) {
    await gu.selectSectionByTitle(/^DATA$/);
    await gu.focusOnCell('Image', row);
  }
});
