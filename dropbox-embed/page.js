// ... (keep existing code until the map initialization) ...

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

  // Rest of your existing map initialization code...
  // Make sure clusters always show up above points
  map.createPane('selectedMarker').style.zIndex = 620;
  map.createPane('clusters').style.zIndex = 610;
  map.createPane('otherMarkers').style.zIndex = 600;

  // ... rest of your existing code ...
}

// ... (rest of your existing code) ...
