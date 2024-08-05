"use strict";

/* global grist, window, L */

let amap;
let popups = {};
let selectedTableId = null;
let selectedRowId = null;
let selectedRecords = null;
let mode = 'multi';
let mapSource = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
let mapCopyright = '© OpenStreetMap contributors';
const Name = "Name";
const Longitude = "Longitude";
const Latitude = "Latitude";

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

let clearMarkers = () => {};

async function loadUMapData() {
  const response = await fetch('https://umap.openstreetmap.fr/en/map/grist-802_1100523/geojson/');
  return await response.json();
}

function showProblem(txt) {
  document.getElementById('map').innerHTML = '<div class="error">' + txt + '</div>';
}

async function updateMap(data) {
  if (!data || data.length === 0) {
    showProblem("No data found yet");
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

  map.createPane('selectedMarker').style.zIndex = 620;
  map.createPane('otherMarkers').style.zIndex = 600;

  popups = {};

  const uMapData = await loadUMapData();
  
  uMapData.features.forEach(feature => {
    const {coordinates} = feature.geometry;
    const {name, description} = feature.properties;
    
    const marker = L.marker([coordinates[1], coordinates[0]], {
      title: name,
      icon: defaultIcon,
      pane: "otherMarkers",
    });

    marker.bindPopup(`<b>${name}</b><br>${description}`);
    marker.addTo(map);

    // Assuming the name can be used as an identifier
    popups[name] = marker;
  });

  amap = map;
  
  // Fit the map to show all markers
  const bounds = L.featureGroup(Object.values(popups)).getBounds();
  map.fitBounds(bounds);
}

function selectMarker(name) {
  const previouslyClicked = popups[selectedRowId];
  if (previouslyClicked) {
    previouslyClicked.setIcon(defaultIcon);
    previouslyClicked.options.pane = 'otherMarkers';
  }

  const marker = popups[name];
  if (!marker) { return null; }

  selectedRowId = name;

  marker.setIcon(selectedIcon);
  marker.options.pane = 'selectedMarker';

  marker.openPopup();

  return marker;
}

grist.onRecord((record, mappings) => {
  const mappedRecord = grist.mapColumnNames(record) || record;
  const name = mappedRecord[Name];
  selectMarker(name);
});

grist.onRecords((data, mappings) => {
  const mappedData = grist.mapColumnNames(data) || data;
  updateMap(mappedData);
});

grist.ready({
  columns: [
    "Name",
    { name: "Longitude", type: 'Numeric' },
    { name: "Latitude", type: 'Numeric' },
  ],
  allowSelectBy: true,
});

grist.onOptions((options, interaction) => {
  const newMode = options?.mode ?? mode;
  mode = newMode;
  const newSource = options?.mapSource ?? mapSource;
  mapSource = newSource;
  const newCopyright = options?.mapCopyright ?? mapCopyright;
  mapCopyright = newCopyright;
});
