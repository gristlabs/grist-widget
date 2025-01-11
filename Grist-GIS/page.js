"use strict";

/* global grist, window */
// Map instance and control variables
let amap;
let popups = {};
let selectedTableId = null;
let selectedRowId = null;
let selectedRecords = null;
let mode = 'multi';
let markers = L.markerClusterGroup();
let searchResults;
let searchControl;

// Base layer configurations
const baseLayers = {
  streets: {
    url: 'https://tile.jawg.io/jawg-streets/{z}/{x}/{y}{r}.png?access-token=bs12XjUq7hHD2pgakKp7AcM1Y3Dk7BkLvf162PpbLxMsvgyclXR5HLnYEnI2Zkoa',
    attribution: '',
    name: 'Street Map'
  },
  hybrid: {
    url: 'http://mt0.google.com/vt/lyrs=y&hl=en&x={x}&y={y}&z={z}',
    attribution: 'Google Hybrid',
    name: 'Google Hybrid'
  },
  satellite: {
    url: 'https://api.maptiler.com/tiles/satellite-v2/{z}/{x}/{y}.jpg?key=TbsQ5qLxJHC20Jv4Th7E',
    attribution: 'MapTiler Satellite',
    name: 'Satellite'
  }
};

// Column configurations
const requiredColumns = {
  Name: "Name",
  Longitude: "Longitude",
  Latitude: "Latitude"
};

const optionalColumns = {
  Property_Type: 'Property_Type',
  Tenants: 'Tenants',
  Secondary_Type: 'Secondary_Type',
  ImageURL: 'ImageURL',
  CoStar_URL: 'CoStar_URL',
  County_Hyper: 'County_Hyper',
  GIS: 'GIS',
  Geocode: 'Geocode',
  Address: 'Address',
  GeocodedAddress: 'GeocodedAddress'
};

// Initialize the map
function initializeMap() {
  if (amap) {
    amap.remove();
  }

  amap = L.map('map').setView([44.0, -120.5], 7);
  
  // Create and add base layers
  const mapLayers = {};
  Object.entries(baseLayers).forEach(([key, layer]) => {
    mapLayers[layer.name] = L.tileLayer(layer.url, {
      attribution: layer.attribution
    });
  });
  
  // Add default layer
  mapLayers[baseLayers.streets.name].addTo(amap);

  // Initialize marker cluster group with custom options
  markers = L.markerClusterGroup({
    disableClusteringAtZoom: 18,
    maxClusterRadius: 30,
    showCoverageOnHover: true,
    iconCreateFunction: selectedRowClusterIconFactory(() => popups[selectedRowId])
  });

  // Add layer control
  L.control.layers(mapLayers, { "Locations": markers }, {
    position: 'topright',
    collapsed: false
  }).addTo(amap);

  // Add search control
  const arcgisOnline = L.esri.Geocoding.arcgisOnlineProvider();
  searchControl = L.esri.Geocoding.geosearch({
    providers: [arcgisOnline],
    position: 'topleft'
  }).addTo(amap);

  // Initialize search results layer
  searchResults = L.layerGroup().addTo(amap);

  // Handle search results
  searchControl.on('results', function(data) {
    searchResults.clearLayers();
    data.results.forEach(result => {
      searchResults.addLayer(L.marker(result.latlng));
    });
  });

  return amap;
}

// Update map with new data
function updateMap(data) {
  data = data || selectedRecords;
  selectedRecords = data;

  if (!data || data.length === 0) {
    showProblem("No data found yet");
    return;
  }

  // Verify required columns
  if (!Object.values(requiredColumns).every(col => col in data[0])) {
    showProblem("Missing required columns");
    return;
  }

  // Clear existing markers
  markers.clearLayers();
  popups = {};

  // Add markers for each record
  const points = data.map(rec => {
    const info = getInfo(rec);
    if (!isValidCoordinate(info.lng, info.lat)) {
      return null;
    }

    const marker = createMarker(info);
    if (marker) {
      markers.addLayer(marker);
      popups[info.id] = marker;
    }
    return new L.LatLng(info.lat, info.lng);
  }).filter(Boolean);

  // Add markers to map
  amap.addLayer(markers);

  // Fit bounds if there are points
  if (points.length > 0) {
    try {
      amap.fitBounds(new L.LatLngBounds(points), { maxZoom: 15, padding: [0, 0] });
    } catch (err) {
      console.warn('Cannot fit bounds:', err);
    }
  }

  // Show selected marker if exists
  if (selectedRowId && popups[selectedRowId]) {
    const marker = popups[selectedRowId];
    markers.zoomToShowLayer(marker);
    marker.openPopup();
  }
}

// If widget has wright access
let writeAccess = true;
// A ongoing scanning promise, to check if we are in progress.
let scanning = null;

async function scan(tableId, records, mappings) {
  if (!writeAccess) { return; }
  for (const record of records) {
    // We can only scan if Geocode column was mapped.
    if (!(Geocode in record)) { break; }
    // And the value in the column is truthy.
    if (!record[Geocode]) { continue; }
    // Get the address to search.
    const address = record.Address;
    // Little caching here. We will set GeocodedAddress to last address we searched,
    // so after next round - we will check if the address is indeed changed.
    // But this field is optional, if it is not in the record (not mapped)
    // we will find the location each time (if coordinates are empty).
    if (record[GeocodedAddress] && record[GeocodedAddress] !== record.Address) {
      // We have caching field, and last address is diffrent.
      // So clear coordinates (as if the record wasn't scanned before)
      record[Longitude] = null;
      record[Latitude] = null;
    }
    // If address is not empty, and coordinates are empty (or were cleared by cache)
    if (address && !record[Longitude]) {
      // Find coordinates.
      const result = await geocode(address);
      // Update them, and update cache (if the field was mapped)
      await grist.docApi.applyUserActions([ ['UpdateRecord', tableId, record.id, {
        [mappings[Longitude]]: result.lng,
        [mappings[Latitude]]: result.lat,
        ...(GeocodedAddress in mappings) ? {[mappings[GeocodedAddress]]: address} : undefined
      }] ]);
      await delay(1000);
    }
  }
}

function scanOnNeed(mappings) {
  if (!scanning && selectedTableId && selectedRecords) {
    scanning = scan(selectedTableId, selectedRecords, mappings).then(() => scanning = null).catch(() => scanning = null);
  }
}

function showProblem(txt) {
  document.getElementById('map').innerHTML = '<div class="error">' + txt + '</div>';
}

// Little extra wrinkle to deal with showing differences.  Should be taken
// care of by Grist once diffing is out of beta.
function parseValue(v) {
  if (typeof(v) === 'object' && v !== null && v.value && v.value.startsWith('V(')) {
    const payload = JSON.parse(v.value.slice(2, v.value.length - 1));
    return payload.remote || payload.local || payload.parent || payload;
  }
  return v;
}

function getInfo(rec) {
  const result = {
    id: rec.id,
    name: parseValue(rec[Name]),
    lng: parseValue(rec[Longitude]),
    lat: parseValue(rec[Latitude]),
    propertyType: parseValue(rec['Property_Type']),  // Add Property Type column
    tenants: parseValue(rec['Tenants']),  // Add Tenants column
    secondaryType: parseValue(rec['Secondary_Type']),  // Add Secondary Type column
    imageUrl: parseValue(rec['ImageURL']),  // Add Image URL column
    costarLink: parseValue(rec['CoStar_URL']),  // Add CoStar link column
    countyLink: parseValue(rec['County_Hyper']),  // Add County link column
    gisLink: parseValue(rec['GIS']),  // Add GIS link column
  };
  return result;
}

// Function to clear last added markers. Used to clear the map when new record is selected.
let clearMakers = () => {};

let markers = [];

function updateMap(data) {
  data = data || selectedRecords;
  selectedRecords = data;

  // Check if data is valid
  if (!data || data.length === 0) {
    showProblem("No data found yet");
    return;
  }

  // Check if required columns exist
  if (!(Longitude in data[0] && Latitude in data[0] && Name in data[0])) {
    showProblem("Table does not yet have all expected columns: Name, Longitude, Latitude. You can map custom columns in the Creator Panel.");
    return;
  }

  // Remove any existing error messages
  const error = document.querySelector('.error');
  if (error) {
    error.remove();
  }

  // Remove the existing map if it exists
  if (amap) {
    try {
      amap.off();
      amap.remove();
    } catch (e) {
      console.warn(e);
    }
  }

  // Initialize the map and set view to Oregon
        var map = L.map('map').setView([44.0, -120.5], 7);

        // Define base layers
        var jawgStreets = L.tileLayer('https://tile.jawg.io/jawg-streets/{z}/{x}/{y}{r}.png?access-token=bs12XjUq7hHD2pgakKp7AcM1Y3Dk7BkLvf162PpbLxMsvgyclXR5HLnYEnI2Zkoa', {
            attribution: '',
            name: 'Jawg Streets'
        });

        var googleHybrid = L.tileLayer('http://mt0.google.com/vt/lyrs=y&hl=en&x={x}&y={y}&z={z}', {
            attribution: 'Google Hybrid',
            name: 'Google Hybrid'
        });

        var maptilerSatellite = L.tileLayer('https://api.maptiler.com/tiles/satellite-v2/{z}/{x}/{y}.jpg?key=TbsQ5qLxJHC20Jv4Th7E', {
            attribution: 'MapTiler Satellite',
            name: 'MapTiler Satellite'
        });

        // Create base layers object for layer control
        var baseLayers = {
            "Street Map": jawgStreets,
            "Google Hybrid": googleHybrid,
            "Satellite": maptilerSatellite
        };

        // Add default layer to map
        jawgStreets.addTo(map);

  // Create panes for markers and clusters
  map.createPane('selectedMarker').style.zIndex = 620;
  map.createPane('clusters').style.zIndex = 610;
  map.createPane('otherMarkers').style.zIndex = 600;

  // Array to store points for fitting bounds
  const points = [];

  // Clear the popups object
  popups = {};

  // Initialize the marker cluster group
  markers = L.markerClusterGroup({
    disableClusteringAtZoom: 18,
    maxClusterRadius: 30, // Reduce clustering radius
    showCoverageOnHover: true,
    clusterPane: 'clusters',
    iconCreateFunction: selectedRowClusterIconFactory(() => popups[selectedRowId]),
  });

  // Handle marker clicks
  markers.on('click', (e) => {
    const id = e.layer.options.id;
    selectMaker(id);
  });

  // Add markers for each record
  for (const rec of data) {
    const { id, name, lng, lat, propertyType, tenants, secondaryType, imageUrl, costarLink, countyLink, gisLink } = getInfo(rec);

    // Skip invalid coordinates
    if (String(lng) === '...' || (Math.abs(lat) < 0.01 && Math.abs(lng) < 0.01)) {
      continue;
    }

    // Create a LatLng object for the marker
    const pt = new L.LatLng(lat, lng);
    points.push(pt);

    // Create the marker
    const marker = L.marker(pt, {
      title: name,
      id: id,
      icon: (id == selectedRowId) ? selectedIcon : defaultIcon,
      pane: (id == selectedRowId) ? 'selectedMarker' : 'otherMarkers',
    });

    // Build the popup content
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

    // Bind the popup to the marker
    marker.bindPopup(popupContent);

    // Add the marker to the cluster group and popups object
    markers.addLayer(marker);
    popups[id] = marker; // Ensure the marker is added to the popups object
  }

  // Add the marker cluster group to the map
  map.addLayer(markers);

  // Fit the map to the bounds of all markers
  if (points.length > 0) {
    try {
      map.fitBounds(new L.LatLngBounds(points), { maxZoom: 15, padding: [0, 0] });
    } catch (err) {
      console.warn('Cannot fit bounds:', err);
    }
  }

  // Ensure the selected marker is shown
  function makeSureSelectedMarkerIsShown() {
    if (selectedRowId && popups[selectedRowId]) {
      const marker = popups[selectedRowId];
      if (!marker._icon) {
        markers.zoomToShowLayer(marker);
      }
      marker.openPopup();
    }
  }

  // Store the map instance
  amap = map;

  // Ensure the selected marker is visible
  makeSureSelectedMarkerIsShown();
}

function selectMaker(id) {
   // Reset the options from the previously selected marker.
   const previouslyClicked = popups[selectedRowId];
   if (previouslyClicked) {
     previouslyClicked.setIcon(defaultIcon);
     previouslyClicked.pane = 'otherMarkers';
   }
   const marker = popups[id];
   if (!marker) { return null; }

   // Remember the new selected marker.
   selectedRowId = id;

   // Set the options for the newly selected marker.
   marker.setIcon(selectedIcon);
   previouslyClicked.pane = 'selectedMarker';

   // Rerender markers in this cluster
   markers.refreshClusters();

   // Update the selected row in Grist.
   grist.setCursorPos?.({rowId: id}).catch(() => {});

   return marker;
}


grist.on('message', (e) => {
  if (e.tableId) { selectedTableId = e.tableId; }
});

function hasCol(col, anything) {
  return anything && typeof anything === 'object' && col in anything;
}

function defaultMapping(record, mappings) {
  if (!mappings) {
    return {
      [Longitude]: Longitude,
      [Name]: Name,
      [Latitude]: Latitude,
      [Property_Type]: Property_Type,
      [Tenants]: Tenants,
      [Secondary_Type]: Secondary_Type,
      [ImageURL]: ImageURL,
      [CoStar_URL]: CoStar_URL,
      [County_Hyper]: County_Hyper,
      [GIS]: GIS,
      [Address]: hasCol(Address, record) ? Address : null,
      [GeocodedAddress]: hasCol(GeocodedAddress, record) ? GeocodedAddress : null,
      [Geocode]: hasCol(Geocode, record) ? Geocode : null,
    };
  }
  return mappings;
}

function selectOnMap(rec) {
  // If this is already selected row, do nothing (to avoid flickering)
  if (selectedRowId === rec.id) { return; }

  selectedRowId = rec.id;
  if (mode === 'single') {
    updateMap([rec]);
  } else {
    updateMap();
  }
}

// Initialize the map and handle records
grist.onRecords(function (records, mappings) {
  if (!amap) {
    // Initialize the map if it hasn't been initialized yet
    amap = L.map('map').setView([37.7749, -122.4194], 6);

    // Add the tile layer
    L.tileLayer('http://mt0.google.com/vt/lyrs=y&hl=en&x={x}&y={y}&z={z}', {
      attribution: 'Google Satellite',
      maxZoom: 20,
    }).addTo(amap);

    // Add the search control after map initialization
    addSearchControl();
  }

  // Update the map with the new records
  updateMap(records);
});

// Rest of your existing code...
grist.onRecord((record, mappings) => {
  if (mode === 'single') {
    // If mappings are not done, we will assume that table has correct columns.
    // This is done to support existing widgets which where configured by
    // renaming column names.
    lastRecord = grist.mapColumnNames(record) || record;
    selectOnMap(lastRecord);
    scanOnNeed(defaultMapping(record, mappings));
  } else {
    const marker = selectMaker(record.id);
    if (!marker) { return; }
    markers.zoomToShowLayer(marker);
    marker.openPopup();
  }
});

grist.onRecords((data, mappings) => {
  lastRecords = grist.mapColumnNames(data) || data;
  if (mode !== 'single') {
    // If mappings are not done, we will assume that table has correct columns.
    // This is done to support existing widgets which where configured by
    // renaming column names.
    updateMap(lastRecords);
    if (lastRecord) {
      selectOnMap(lastRecord);
    }
    // We need to mimic the mappings for old widgets
    scanOnNeed(defaultMapping(data[0], mappings));
  }
});

grist.onNewRecord(() => {
  clearMakers();
  clearMakers = () => {};
});

function updateMode() {
  if (mode === 'single') {
    selectedRowId = lastRecord.id;
    updateMap([lastRecord]);
  } else {
    updateMap(lastRecords);
  }
}

function onEditOptions() {
  const popup = document.getElementById("settings");
  popup.style.display = 'block';
  const btnClose = document.getElementById("btnClose");
  btnClose.onclick = () => popup.style.display = 'none';
  const checkbox = document.getElementById('cbxMode');
  checkbox.checked = mode === 'multi' ? true : false;
  checkbox.onchange = async (e) => {
    const newMode = e.target.checked ? 'multi' : 'single';
    if (newMode != mode) {
      mode = newMode;
      await grist.setOption('mode', mode);
      updateMode();
    }
  }
  [ "mapSource", "mapCopyright" ].forEach((opt) => {
    const ipt = document.getElementById(opt)
    ipt.onchange = async (e) => {
      await grist.setOption(opt, e.target.value);
    }
  })
}

const optional = true;
grist.ready({
  columns: [
    "Name",
    { name: "Longitude", type: 'Numeric'} ,
    { name: "Latitude", type: 'Numeric'},
    { name: "Property_Type", type: 'Choice'} ,
    { name: "Tenants", type: 'ChoiceList'} ,
    { name: "Secondary_Type", type: 'ChoiceList'} ,
    { name: "ImageURL", type: 'Text'} ,
    { name: "CoStar_URL", type: 'Text'} ,
    { name: "County_Hyper", type: 'Text'} ,
    { name: "GIS", type: 'Text'} ,
    { name: "Geocode", type: 'Bool', title: 'Geocode', optional},
    { name: "Address", type: 'Text', optional, optional},
    { name: "GeocodedAddress", type: 'Text', title: 'Geocoded Address', optional},
  ],
  allowSelectBy: true,
  onEditOptions
});

grist.onOptions((options, interaction) => {
  writeAccess = interaction.accessLevel === 'full';
  const newMode = options?.mode ?? mode;
  mode = newMode;
  if (newMode != mode && lastRecords) {
    updateMode();
  }
  const newSource = options?.mapSource ?? mapSource;
  mapSource = newSource;
  document.getElementById("mapSource").value = mapSource;
  const newCopyright = options?.mapCopyright ?? mapCopyright;
  mapCopyright = newCopyright
  document.getElementById("mapCopyright").value = mapCopyright;
});
