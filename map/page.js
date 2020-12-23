"use strict";

/* global grist, window */

let amap;
let popups = {};
let rowId = null;
let prevData = null;

function showProblem(txt) {
  document.getElementById('map').innerHTML = '<div class="error">' + txt + '</div>';
}

// Little extra wrinkle to deal with showing differences.  Should be taken
// care of by Grist once diffing is out of beta.
function parseValue(v) {
  if (typeof(v) === 'object' && v.value && v.value.startsWith('V(')) {
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
  data = data || prevData;
  prevData = data;
  if (!data || data.length === 0) {
    showProblem("No data found yet");
    return;
  }
  if (!(data[0].Longitude && data[0].Latitude && data[0].Name)) {
    showProblem("Table does not yet have all expected columns: Name, Longitude, Latitude");
    return;
  }
  const tiles = L.tileLayer('//server.arcgisonline.com/ArcGIS/rest/services/NatGeo_World_Map/MapServer/tile/{z}/{y}/{x}', {
    maxZoom: 18,
    attribution: 'Tiles &copy; Esri &mdash; National Geographic, Esri, DeLorme, NAVTEQ, UNEP-WCMC, USGS, NASA, ESA, METI, NRCAN, GEBCO, NOAA, iPC'
  });
  const error = document.querySelector('.error');
  if (error) { error.remove(); }
  if (amap) { amap.remove(); }
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
  map.fitBounds(new L.LatLngBounds(points), {maxZoom: 12, padding: [0, 0]});
  amap = map;
  if (rowId && popups[rowId]) {
    var marker = popups[rowId];
    if (!marker._icon) { marker.__parent.spiderfy(); }
    marker.openPopup();
  }
}

function selectOnMap(rec) {
  rowId = rec.id;
  updateMap();
}

grist.onRecord(selectOnMap);
grist.onRecords(updateMap);
grist.ready();
