"use strict";

/* global grist, window */

let amap;
let popups = {};
let selectedTableId = null;
let selectedRowId = null;
let selectedRecords = null;
let mode = 'multi';
let mapSource = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'; // Default OSM tiles
let mapCopyright = '© OpenStreetMap contributors';
// Required, Label value
const Name = "Name";
// Required
const Longitude = "Longitude";
// Required
const Latitude = "Latitude";
// Optional - switch column to trigger geocoding
const Geocode = 'Geocode';
// Optional - but required for geocoding. Field with address to find (might be formula)
const Address = 'Address';
// Optional - but useful for geocoding. Blank field which map uses
//            to store last geocoded Address. Enables map widget
//            to automatically update the geocoding if Address is changed
const GeocodedAddress = 'GeocodedAddress';
let lastRecord;
let lastRecords;


// Color markers downloaded from leaflet repo, color-shifted to green
// Used to show currently selected pin
const selectedIcon = new L.Icon({
  iconUrl: 'marker-icon-green.png',
  iconRetinaUrl: 'marker-icon-green-2x.png',
  shadowUrl: 'marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});
const defaultIcon = new L.Icon.Default();



// Creates clusterIcons that highlight if they contain selected row
// Given a function `() => selectedMarker`, return a cluster icon create function
// that can be passed to MarkerClusterGroup({iconCreateFunction: ... } )
//
// Cluster with selected record gets the '.marker-cluster-selected' class
// (defined in screen.css)
//
// Copied from _defaultIconCreateFunction in ClusterMarkerGroup
//    https://github.com/Leaflet/Leaflet.markercluster/blob/master/src/MarkerClusterGroup.js
const selectedRowClusterIconFactory = function (selectedMarkerGetter) {
  return function (cluster) {
    var childCount = cluster.getChildCount();

    let isSelected = false;
    try {
      const selectedMarker = selectedMarkerGetter();

      // hmm I think this is n log(n) to build all the clusters for the whole map.
      // It's probably fine though, it only fires once when map markers
      // are set up or when selectedRow changes
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

// If widget has write access
let writeAccess = true;
// An ongoing scanning promise, to check if we are in progress.
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
      // We have caching field, and last address is different.
      // So clear coordinates (as if the record wasn't scanned before)
      record[Longitude] = null;
      record[Latitude] = null;
    }
    // If address is not empty, and coordinates are empty (or were cleared by cache)
    if (address && !record[Longitude]) {
      // Find coordinates.
      const result = await geocode(address);
      // Update them, and update cache (if the field was mapped)
      await grist.docApi.applyUserActions([['UpdateRecord', tableId, record.id, {
        [mappings[Longitude]]: result.lng,
        [mappings[Latitude]]: result.lat,
        ...(GeocodedAddress in mappings) ? { [mappings[GeocodedAddress]]: address } : undefined
      }]]);
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
  if (typeof (v) === 'object' && v !== null && v.value && v.value.startsWith('V(')) {
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
    lat: parseValue(rec[Latitude])
  };
  return result;
}

// Function to clear last added markers. Used to clear the map when new record is selected.
let clearMakers = () => { };

let markers = [];

function updateMap(data) {
  data = data || selectedRecords;
  selectedRecords = data;
  if (!data || data.length === 0) {
    showProblem("No data found yet");
    return;
  }
  if (!(Longitude in data[0] && Latitude in data[0] && Name in data[0])) {
    showProblem("Table does not yet have all expected columns: Name, Longitude, Latitude. You can map custom columns" +
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
      // ignore
      console.warn(e);
    }
  }
  const map = L.map('map', {
    layers: [tiles],
    wheelPxPerZoomLevel: 90, //px, default 60, slows scrollwheel zoom
  });

  // Load uMap data
  const umapUrl = "http://u.osmfr.org/m/1100523"; // Replace with your uMap URL
  fetch(umapUrl)
    .then(response => response.json())
    .then(data => {
      L.geoJSON(data).addTo(map);
    })
    .catch(error => console.error("Error loading uMap data:", error));

  // Make sure clusters always show up above points
  // Default z-index for markers is 600, 650 is where tooltipPane z-index starts
  map.createPane('selectedMarker').style.zIndex = 620;
  map.createPane('clusters').style.zIndex = 610;
  map.createPane('defaultMarkers').style.zIndex = 600;

  const markerClusters = L.markerClusterGroup({
    showCoverageOnHover: true,
    disableClusteringAtZoom: 16,
    iconCreateFunction: selectedRowClusterIconFactory(() => selectedMarker),
    pane: 'clusters'
  });
  map.addLayer(markerClusters);
  // Add locate control
  const locateControl = L.control.locate({
    locateOptions: {
      enableHighAccuracy: true,
      maxZoom: 16
    }
  }).addTo(map);

  markers = [];
  clearMakers = () => {
    markerClusters.clearLayers();
    markers = [];
    Object.keys(popups).forEach((k) => delete popups[k]);
  };
  clearMakers();

  let bounds = [];

  for (const row of data) {
    const info = getInfo(row);
    if (!info.lat || !info.lng) { continue; }
    let marker;
    if (info.id === selectedRowId) {
      marker = L.marker(new L.LatLng(info.lat, info.lng), {
        title: info.name,
        icon: selectedIcon,
        pane: 'selectedMarker'
      });
    } else {
      marker = L.marker(new L.LatLng(info.lat, info.lng), {
        title: info.name,
        icon: defaultIcon,
        pane: 'defaultMarkers'
      });
    }

    bounds.push([info.lat, info.lng]);

    const infoHtml = [];
    for (const key of Object.keys(row)) {
      if (key === Longitude || key === Latitude) { continue; }
      infoHtml.push(
        `<dt>${key}</dt><dd>${row[key]}</dd>`
      );
    }
    const popup = L.popup().setContent(`<h3>${info.name}</h3><dl>${infoHtml.join('\n')}</dl>`);
    marker.bindPopup(popup);

    markerClusters.addLayer(marker);
    markers.push(marker);
    popups[info.id] = popup;
  }
  if (bounds.length > 0) {
    map.fitBounds(bounds);
  }
  // allow calling fit bounds for geocoded points too
  amap = map;
}

grist.onRecords((data) => {
  selectedTableId = data.tableId;
  selectedRecords = data.records;
  updateMap(data.records);
  scanOnNeed(data.columnMappings);
});

grist.onRecord((data) => {
  selectedTableId = data.tableId;
  selectedRowId = data.id;
  selectedRecords = [data.record];
  updateMap([data.record]);
  scanOnNeed(data.columnMappings);
});

grist.onOptions((options) => {
  if (options.mode) { mode = options.mode; }
  if (options.mapSource) {
    mapSource = options.mapSource;
    mapCopyright = options.mapCopyright;
  }
});

grist.onSelection(async (data) => {
  const selectedRows = selectedRowId === null ? [] : selectedRecords.filter((record) => {
    return record.id === selectedRowId;
  });
  if (selectedRows.length !== 1) {
    selectedRowId = null;
  }
  if (selectedRows.length === 1) {
    selectedRowId = selectedRows[0].id;
    const info = getInfo(selectedRows[0]);
    if (!info.lat || !info.lng) { return; }
    const selectedMarker = markers.filter((m) => m.getLatLng().lat === info.lat && m.getLatLng().lng === info.lng)[0];
    if (selectedMarker) {
      amap.setView(new L.LatLng(info.lat, info.lng), 16);
      amap.openPopup(selectedMarker._popup);
    }
  }
});

grist.on('onAccessChange', (data) => {
  writeAccess = data;
});

window.addEventListener('unload', () => {
  if (amap) {
    try {
      amap.off();
      amap.remove();
    } catch (e) {
      // ignore
    }
  }
});
