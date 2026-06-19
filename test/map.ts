import { assert } from 'mocha-webdriver';
import { getGrist } from "./getGrist";

describe('map', function() {
  this.timeout(30000);
  const grist = getGrist();

  it('shows marker labels as tidied-up text', async function() {
    const docId = await grist.upload('test/fixtures/docs/Calendar.grist');
    await grist.openDoc(docId);
    await grist.dismissBehavioralPrompts();
    await grist.toggleSidePanel('right', 'open');

    // A label that happens to contain some HTML. Leaflet popups render their
    // content as HTML, so we tidy it up first. Coordinates are Bourg-en-Bresse,
    // away from 0,0 so the widget doesn't skip the point as a bad import.
    const label = '<img src=x onerror="window.__ran = true">';
    await grist.sendActions([
      ['AddTable', 'Places', [
        {id: 'Name', type: 'Text'},
        {id: 'Latitude', type: 'Numeric'},
        {id: 'Longitude', type: 'Numeric'},
      ]],
      ['AddRecord', 'Places', null, {Name: label, Latitude: 46.2, Longitude: 5.22}],
    ]);

    await grist.addNewSection(/Custom/, /Places/, {dismissTips: true});
    await grist.clickWidgetGallery();
    await grist.selectCustomWidget(/Map/);
    await grist.setCustomWidgetAccess('full');
    await grist.setCustomWidgetMapping('Name', /Name/);
    await grist.setCustomWidgetMapping('Longitude', /Longitude/);
    await grist.setCustomWidgetMapping('Latitude', /Latitude/);

    // Click the marker to open its bound popup.
    await grist.waitToPass(async () => {
      await grist.inCustomWidget(async () => {
        await grist.driver.findWait('.leaflet-marker-icon', 2000).click();
      });
      await grist.inCustomWidget(() => grist.driver.findWait('.leaflet-popup-content', 1000));
    }, 10000);

    // The popup shows, but DOMPurify has tidied the markup: the inline handler
    // and any script tags are gone, so nothing runs on its own.
    const html = (await grist.executeScriptInCustomWidget<string>(
      () => document.querySelector('.leaflet-popup-content')?.innerHTML ?? '')).toLowerCase();
    assert.notInclude(html, 'onerror');
    assert.notInclude(html, '<script');
    assert.notEqual(
      await grist.executeScriptInCustomWidget(() => (window as any).__ran),
      true);
  });
});
