function updateMap(data) {
  data = data || selectedRecords;
  selectedRecords = data;
  if (!data || data.length === 0) {
    showProblem("No data found yet");
    return;
  }
  if (!(Longitude in data[0] && Latitude in data[0] && Name in data[0])) {
    showProblem("Table does not yet have all expected columns: Name, Longitude, Latitude. You can map custom columns"+
    " in the Creator Panel.");
    return;
  }

  const tiles = L.tileLayer(mapSource, { attribution: mapCopyright });

  const error = document.querySelector('.error');
  if (error) { error.remove(); }
  if (amap) {
    try {
      amap.off();
      amap.remove();
    } catch (e) {
      console.warn(e);
    }
  }
  const map = L.map('map', {
    layers: [tiles],
    wheelPxPerZoomLevel: 90,
  });

  // Add the geocoder control
  const searchControl = L.Control.geocoder({
    defaultMarkGeocode: false,
    position: 'topleft',
    placeholder: 'Search for a location...',
    geocoder: geocoder
  }).addTo(map);

  // Handle search results
  searchControl.on('markgeocode', function(e) {
    const bbox = e.geocode.bbox;
    map.fitBounds([
      [bbox.getSouth(), bbox.getWest()],
      [bbox.getNorth(), bbox.getEast()]
    ]);
  });

  // Make sure clusters always show up above points
  map.createPane('selectedMarker').style.zIndex = 620;
  map.createPane('clusters').style.zIndex = 610;
  map.createPane('otherMarkers').style.zIndex = 600;

  const points = []; //L.LatLng[], used for zooming to bounds of all markers

  popups = {}; // Map: {[rowid]: L.marker}
  // Make this before markerClusterGroup so iconCreateFunction
  // can fetch the currently selected marker from popups by function closure

  markers = L.markerClusterGroup({
    disableClusteringAtZoom: 18,
    //If markers are very close together, they'd stay clustered even at max zoom
    //This disables that behavior explicitly for max zoom (18)
    maxClusterRadius: 30, //px, default 80
    // default behavior clusters too aggressively. It's nice to see individual markers
    showCoverageOnHover: true,

    clusterPane: 'clusters', //lets us specify z-index, so cluster icons can be on top
    iconCreateFunction: selectedRowClusterIconFactory(() => popups[selectedRowId]),
  });

  markers.on('click', (e) => {
    const id = e.layer.options.id;
    selectMaker(id);
  });

  for (const rec of data) {
    const {id, name, lng, lat, propertyType, tenants, secondaryType, imageUrl, costarLink, countyLink, gisLink} = getInfo(rec);
    
    if (String(lng) === '...') { continue; }
    if (Math.abs(lat) < 0.01 && Math.abs(lng) < 0.01) {
      continue;
    }

    const pt = new L.LatLng(lat, lng);
    points.push(pt);

    const marker = L.marker(pt, {
      title: name,
      id: id,
      icon: (id == selectedRowId) ?  selectedIcon : defaultIcon,
      pane: (id == selectedRowId) ? "selectedMarker" : "otherMarkers",
    });

    // Build HTML content for the popup, similar to your Mapbox example
    const imageTag = imageUrl ? `<img src="${imageUrl}" alt="Image" style="width: 100%; height: auto;" />` : `<p>No Image Available</p>`;
    const popupContent = `
    <div style="font-size: 12px; line-height: 1.3; padding: 8px; max-width: 160px;">
      <strong style="font-size: 13px; display: block; margin-bottom: 4px;">${name}</strong>
      ${imageUrl ? `<img src="${imageUrl}" alt="Image" style="width: 100%; height: auto; border-radius: 4px; margin-bottom: 6px;" />` : `<p style="margin: 0;">No Image Available</p>`}
      <p style="margin: 4px 0; font-size: 11px;"><strong>Type:</strong> ${propertyType}</p>
      <p style="margin: 4px 0; font-size: 11px;"><strong>Secondary:</strong> ${secondaryType}</p>
      <p style="margin: 4px 0; font-size: 11px;"><strong>Tenants:</strong> ${tenants}</p>
      <div class="popup-buttons" style="display: flex; gap: 4px; margin-top: 6px;">
        <a href="${costarLink}" style="font-size: 10px; padding: 4px 6px; background-color: #007acc; color: white; border-radius: 3px; text-decoration: none;" class="popup-button" target="_blank">CoStar</a>
        <a href="${countyLink}" style="font-size: 10px; padding: 4px 6px; background-color: #28a745; color: white; border-radius: 3px; text-decoration: none;" class="popup-button" target="_blank">County</a>
        <a href="${gisLink}" style="font-size: 10px; padding: 4px 6px; background-color: #ffc107; color: black; border-radius: 3px; text-decoration: none;" class="popup-button" target="_blank">GIS</a>
      </div>
    </div>
  `;

    // Bind the custom HTML content to the marker's popup
    marker.bindPopup(popupContent);
    markers.addLayer(marker);

    popups[id] = marker;
  }
  map.addLayer(markers);

  clearMakers = () => map.removeLayer(markers);

  try {
    map.fitBounds(new L.LatLngBounds(points), {maxZoom: 15, padding: [0, 0]});
  } catch (err) {
    console.warn('cannot fit bounds');
  }
  function makeSureSelectedMarkerIsShown() {
    const rowId = selectedRowId;

    if (rowId && popups[rowId]) {
      var marker = popups[rowId];
      if (!marker._icon) { markers.zoomToShowLayer(marker); }
      marker.openPopup();
    }
  }

  amap = map;

  makeSureSelectedMarkerIsShown();
}
