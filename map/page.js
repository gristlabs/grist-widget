"use strict";

/* global grist, window */

let amap;
let popups = {};
let selectedTableId = null;
let selectedRowId = null;
let selectedRecords = null;
let mode = 'multi';

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

let writeAccess = true;
let scanning = null;

async function scan(tableId, records) {
  if (!writeAccess) { return false; }
  for (const record of records) {
    if (!('Geocode' in record)) { break; }
    if (!record.Geocode) { continue; }
    const address = record.Address;
    if (record.GeocodedAddress && record.GeocodedAddress !== record.Address) {
      record.Longitude = null;
      record.Latitude = null;
    }
    if (address && !record.Longitude) {
      const result = await geocode(address);
      await grist.docApi.applyUserActions([ ['UpdateRecord', tableId, record.id, {
        Longitude: result.lng, Latitude: result.lat,
        ...('GeocodedAddress' in record) ? {GeocodedAddress: address} : undefined
      }] ])
      await delay(1000);
    }
  }
}

function scanOnNeed() {
  if (!scanning && selectedTableId && selectedRecords) {
    scanning = scan(selectedTableId, selectedRecords).then(() => scanning = null).catch(() => scanning = null);
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
    name: parseValue(rec.Name),
    lng: parseValue(rec.Longitude),
    lat: parseValue(rec.Latitude)
  };
  return result;
}

function updateMap(data) {
  data = data || selectedRecords;
  selectedRecords = data;
  if (!data || data.length === 0) {
    showProblem("No data found yet");
    return;
  }
  if (!('Longitude' in data[0] && 'Latitude' in data[0] && 'Name' in data[0])) {
    showProblem("Table does not yet have all expected columns: Name, Longitude, Latitude");
    return;
  }
  const tiles = L.tileLayer('//server.arcgisonline.com/ArcGIS/rest/services/NatGeo_World_Map/MapServer/tile/{z}/{y}/{x}', {
    maxZoom: 18,
    attribution: 'Tiles &copy; Esri &mdash; National Geographic, Esri, DeLorme, NAVTEQ, UNEP-WCMC, USGS, NASA, ESA, METI, NRCAN, GEBCO, NOAA, iPC'
  });
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
  const map = L.map('map', {layers: [tiles]});
  const markers = L.markerClusterGroup();
  const points = [];
  popups = {};
  for (const rec of data) {
    const {id, name, lng, lat} = getInfo(rec);
    if (String(lng) === '...') { continue; }
    if (Math.abs(lat) < 0.01 && Math.abs(lng) < 0.01) {
      // Stuff at 0,0 usually indicates bad imports/geocoding.
      continue;
    }
    const pt = new L.LatLng(lat, lng);
    const title = name;
    const marker = L.marker(pt, { title  });
    points.push(pt);
    marker.bindPopup(title);
    markers.addLayer(marker);
    popups[id] = marker;
  }
  map.addLayer(markers);
  try {
    map.fitBounds(new L.LatLngBounds(points), {maxZoom: 12, padding: [0, 0]});
  } catch (err) {
    console.warn('cannot fit bounds');
  }
  amap = map;
  const rowId = selectedRowId;
  if (rowId && popups[rowId]) {
    var marker = popups[rowId];
    if (!marker._icon) { marker.__parent.spiderfy(); }
    marker.openPopup();
  }
}

function selectOnMap(rec) {
  selectedRowId = rec.id;
  if (mode === 'single') {
    updateMap([rec]);
    scanOnNeed();
  } else {
    updateMap();
  }
}

grist.on('message', (e) => {
  if (e.tableId) { selectedTableId = e.tableId; }
});

grist.onRecord(selectOnMap);
if (mode !== 'single') {
  grist.onRecords((data) => {
    updateMap(data);
    scanOnNeed();
  });
}
grist.ready();
