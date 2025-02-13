"use strict";

/* global grist, window, L */ // Make sure L is declared as a global

function createPopupContent({name, propertyType, tenants, secondaryType, imageUrl, costarLink, countyLink, gisLink}) {
  return `
    <div style="font-size: 12px; line-height: 1.3; padding: 8px; max-width: 160px;">
      <h3>${name}</h3>
      ${imageUrl ? `<img src="${imageUrl}" alt="Property Image" style="width: 100%; height: auto; border-radius: 4px; margin-bottom: 6px;" />` : `<p style="margin: 0;">No Image Available</p>`}
      <p style="margin: 4px 0;"><strong>Type:</strong> ${propertyType}</p>
      <p style="margin: 4px 0;"><strong>Secondary:</strong> ${secondaryType}</p>
      <p style="margin: 4px 0;"><strong>Tenants:</strong> ${tenants}</p>
      <div class="popup-buttons">
        <a href="${costarLink}" class="popup-button" target="_blank">CoStar</a>
        <a href="${countyLink}" class="popup-button" target="_blank">County</a>
        <a href="${gisLink}" class="popup-button" target="_blank">GIS</a>
      </div>
    </div>`;
}

let amap;
let popups = {};
let selectedTableId = null;
let selectedRowId = null;
let selectedRecords = null;
let mode = 'multi';
let mapSource = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}';
let mapCopyright = 'Tiles © Esri — Source: Esri, DeLorme, NAVTEQ, USGS, Intermap, iPC, NRCAN, Esri Japan, METI, Esri China (Hong Kong), Esri (Thailand), TomTom, 2012';
// Required, Label value
const Name = "Name";
// Required
const Longitude = "Longitude";
// Required
const Latitude = "Latitude";
// Optional - switch column to trigger geocoding
// Columns used in page.js
const Property_Type = 'Property_Type';
const Tenants = 'Tenants';
const Secondary_Type = 'Secondary_Type';
const ImageURL = 'ImageURL';
const CoStar_URL = 'CoStar_URL';
const County_Hyper = 'County_Hyper';
const GIS = 'GIS';
const Geocode = 'Geocode';
// Optional - but required for geocoding. Field with address to find (might be formula)
const Address = 'Address';
// Optional - but useful for geocoding. Blank field which map uses
//            to store last geocoded Address. Enables map widget
//            to automatically update the geocoding if Address is changed
const GeocodedAddress = 'GeocodedAddress';
let lastRecord;
let lastRecords;


//Color markers downloaded from leaflet repo, color-shifted to green
//Used to show currently selected pin
const selectedIcon =  new L.Icon({
  iconUrl: 'marker-icon-green.png',
  iconRetinaUrl: 'marker-icon-green-2x.png',
  shadowUrl: 'marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});
const defaultIcon =  new L.Icon.Default();


// Creates clusterIcons that highlight if they contain selected row
const selectedRowClusterIconFactory = function (selectedMarkerGetter) {
  return function(cluster) {
    var childCount = cluster.getChildCount();

    let isSelected = false;
    try {
      const selectedMarker = selectedMarkerGetter();
      isSelected = cluster.getAllChildMarkers().filter((m) => m == selectedMarker).length > 0;
    } catch (e) {
      console.error("WARNING: Error in clusterIconFactory in map widget");
      console.error(e);
    }

    var c = ' marker-cluster-';
    if (childCount < 10) {
      c += 'small';
    } else if (childCount < 100) {
      c += 'medium';
    } else {
      c += 'large';
    }

    return new L.DivIcon({
        html: '<div><span>'
            + childCount
            + ' <span aria-label="markers"></span>'
            + '</span></div>',
        className: 'marker-cluster' + c + (isSelected ? ' marker-cluster-selected' : ''),
        iconSize: new L.Point(40, 40)
    });
  }
};

const geocoder = L.Control.Geocoder && L.Control.Geocoder.nominatim();
if (URLSearchParams && location.search && geocoder) {
  const c = new URLSearchParams(location.search).get('geocoder');
  if (c && L.Control.Geocoder[c]) {
    console.log('Using geocoder', c);
    geocoder = L.Control.Geocoder[c]();
  } else if (c) {
    console.warn('Unsupported geocoder', c);
  }
  const m = new URLSearchParams(location.search).get('mode');
  if (m) { mode = m; }
}

async function geocode(address) {
  return new Promise((resolve, reject) => {
    try {
      geocoder.geocode(address, (v) => {
        v = v[0];
        if (v) { v = v.center; }
        resolve(v);
      });
    } catch (e) {
      console.log("Problem:", e);
      reject(e);
    }
  });
}

async function delay(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
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

let markers; // Declare markers outside updateMap for wider scope

// --- Base Layers from Grist-GIS.js ---
const baseLayers = {
  "Google Hybrid": L.tileLayer('http://mt0.google.com/vt/lyrs=y&hl=en&x={x}&y={y}&z={z}', {
    attribution: 'Google Hybrid'
  }),
  "MapTiler Satellite": L.tileLayer('https://api.maptiler.com/tiles/satellite-v2/{z}/{x}/{y}.jpg?key=TbsQ5qLxJHC20Jv4Th7E', {
    attribution: ''
  }),
  "ArcGIS": L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}', {
    attribution: ''
  }),
  "OpenStreetMap": L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: ''
  })
};

function calculateInitialView(points) {
  if (points.length === 0) {
    return { center: [39.8283, -98.5795], zoom: 4 }; // Default to USA center
  }
  
  const bounds = L.latLngBounds(points);
  const center = bounds.getCenter();
  return { bounds, center };
}





function updateMap(data) {
  data = data || selectedRecords;
  selectedRecords = data;
  if (!data || data.length === 0) {
    showProblem("No data found yet");
    return;
  }
  if (!(Longitude in data[0] && Latitude in data[0] && Name in data[0])) {
    showProblem("Table does not yet have all expected columns: Name, Longitude, Latitude. You can map custom columns in the Creator Panel.");
    return;
  }

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

  // Initialize map with default tile layer
  const defaultTiles = L.tileLayer(mapSource, { attribution: mapCopyright });
  amap = L.map('map', {
    layers: [defaultTiles],
    center: [45.5283, -122.8081],
    zoom: 4,
    wheelPxPerZoomLevel: 90
  });

  // Add layer control
  L.control.layers(baseLayers, {}, { position: 'topright', collapsed: true }).addTo(amap);

  // Initialize marker cluster group
  markers = L.markerClusterGroup({
    maxClusterRadius: 80,
    spiderfyOnMaxZoom: true,
    showCoverageOnHover: true,
    zoomToBoundsOnClick: true,
    chunkedLoading: true,
    chunkInterval: 200,
    animate: false
  });

  // Add event handlers
  markers.on('clusterclick', function(e) {
    if (!e.layer) return;
    try {
      e.layer.spiderfy();
    } catch (e) {
      console.warn('Error handling cluster click:', e);
    }
  });

  // Add markers
  data.forEach(record => {
    const {id, name, lng, lat, propertyType, tenants, secondaryType, imageUrl, costarLink, countyLink, gisLink} = getInfo(record);
    
    if (!lng || !lat || String(lng) === '...' || 
        isNaN(lng) || isNaN(lat) || 
        Math.abs(lat) < 0.01 && Math.abs(lng) < 0.01) {
      return;
    }

    const marker = L.marker([lat, lng], {
      title: name,
      id: id,
      icon: (id == selectedRowId) ? selectedIcon : defaultIcon
    });

    marker.on('click', function() {
      selectMaker(this.options.id);
    });

    const popupContent = createPopupContent({name, propertyType, tenants, secondaryType, imageUrl, costarLink, countyLink, gisLink});
    marker.bindPopup(popupContent);
    markers.addLayer(marker);
    popups[id] = marker;
  });

  // Add marker cluster to map
  amap.addLayer(markers);

  // Add search control
  const searchControl = L.esri.Geocoding.geosearch({
    providers: [L.esri.Geocoding.arcgisOnlineProvider()],
    position: 'topleft',
    attribution: false
  }).addTo(amap);

  const searchResults = L.layerGroup().addTo(amap);
  searchControl.on('results', function(data) {
    searchResults.clearLayers();
    for (let i = data.results.length - 1; i >= 0; i--) {
      searchResults.addLayer(L.marker(data.results[i].latlng));
    }
  });

  // Initialize minimap
  const minimapContainer = document.getElementById('minimap-container');
  const toggleButton = document.getElementById('toggleMinimap');
  const googleMapIframe = document.getElementById('googleMap');

  if (minimapContainer && toggleButton && googleMapIframe) {
    try {
      // Initialize minimap in collapsed state
      minimapContainer.classList.add('collapsed');

      // Add toggle functionality with error handling
      toggleButton.addEventListener('click', function() {
        try {
          minimapContainer.classList.toggle('collapsed');
          if (!minimapContainer.classList.contains('collapsed')) {
            // Update minimap when showing
            const center = amap.getCenter();
            const zoom = amap.getZoom();
            const ll = `${center.lat},${center.lng}`;
            googleMapIframe.src = `https://www.google.com/maps/d/embed?mid=1XYqZpHKr3L0OGpTWlkUah7Bf4v0tbhA&ll=${ll}&z=${zoom}&ui=0`;
          }
        } catch (e) {
          console.warn('Error toggling minimap:', e);
        }
      });

      // Sync minimap with main map only when visible
      amap.on('moveend', function() {
        try {
          if (!minimapContainer.classList.contains('collapsed')) {
            const center = amap.getCenter();
            const zoom = amap.getZoom();
            const ll = `${center.lat},${center.lng}`;
            googleMapIframe.src = `https://www.google.com/maps/d/embed?mid=1XYqZpHKr3L0OGpTWlkUah7Bf4v0tbhA&ll=${ll}&z=${zoom}&ui=0`;
          }
        } catch (e) {
          console.warn('Error syncing minimap:', e);
        }
      });

      // Initial sync with error handling
      try {
        const center = amap.getCenter();
        const zoom = amap.getZoom();
        const ll = `${center.lat},${center.lng}`;
        googleMapIframe.src = `https://www.google.com/maps/d/embed?mid=1XYqZpHKr3L0OGpTWlkUah7Bf4v0tbhA&ll=${ll}&z=${zoom}&ui=0`;
      } catch (e) {
        console.warn('Error setting initial minimap state:', e);
        googleMapIframe.src = `https://www.google.com/maps/d/embed?mid=1XYqZpHKr3L0OGpTWlkUah7Bf4v0tbhA&ui=0`;
      }
    } catch (e) {
      console.warn('Error initializing minimap:', e);
    }
  }

  // Add bounds fitting
  const points = data.map(record => {
    const {lat, lng} = getInfo(record);
    if (!lat || !lng || isNaN(lat) || isNaN(lng)) return null;
    return [lat, lng];
  }).filter(point => point !== null);

  if (points.length > 0) {
    try {
      const bounds = L.latLngBounds(points);
      amap.fitBounds(bounds, { padding: [50, 50] });
    } catch (e) {
      console.warn('Error fitting bounds:', e);
      amap.setView([39.8283, -98.5795], 4);
    }
  } else {
    amap.setView([39.8283, -98.5795], 4);
  }

  // Show selected marker if exists
  if (selectedRowId && popups[selectedRowId]) {
    const marker = popups[selectedRowId];
    if (!marker._icon) {
      markers.zoomToShowLayer(marker);
    }
    marker.openPopup();
  }

  clearMakers = () => {
    if (markers) {
      markers.clearLayers();
      amap.removeLayer(markers);
    }
  };
}




function selectMaker(id) {
  // Reset the options from the previously selected marker.
  const previouslyClicked = popups[selectedRowId];
  if (previouslyClicked) {
    previouslyClicked.setIcon(defaultIcon);
  }

  const marker = popups[id];
  if (!marker) { return null; }

  // Remember the new selected marker.
  selectedRowId = id;

  // Set the options for the newly selected marker.
  marker.setIcon(selectedIcon);

  // Open the popup
  marker.openPopup();

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
})

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
