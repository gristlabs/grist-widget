"use strict";

/* global grist, window, L, DOMPurify */

// ---------------------------------------------------------------------------
// Tile-layer presets
// ---------------------------------------------------------------------------
const TILE_PRESETS = [
  {
    id: "esri-street",
    label: "Esri Street Map",
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}",
    attribution: "Tiles &copy; Esri &mdash; Source: Esri, DeLorme, NAVTEQ, USGS, Intermap, iPC, NRCAN, Esri Japan, METI, Esri China (Hong Kong), Esri (Thailand), TomTom, 2012",
    maxZoom: 17,
  },
  {
    id: "osm-standard",
    label: "OpenStreetMap Standard",
    url: "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution: "&copy; <a href=\"https://openstreetmap.org/copyright\">OpenStreetMap contributors</a>",
    maxZoom: 19,
  },
  {
    id: "osm-france",
    label: "OpenStreetMap France (détaillée)",
    url: "https://{s}.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png",
    attribution: "&copy; OpenStreetMap France | &copy; <a href=\"https://openstreetmap.org/copyright\">OpenStreetMap contributors</a>",
    maxZoom: 20,
  },
  {
    id: "osm-hot",
    label: "OpenStreetMap Humanitaire (HOT)",
    url: "https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png",
    attribution: "&copy; <a href=\"https://openstreetmap.org/copyright\">OpenStreetMap contributors</a>, tiles by <a href=\"https://hot.openstreetmap.org\">HOT</a>",
    maxZoom: 19,
  },
  {
    id: "opentopomap",
    label: "OpenTopoMap (relief / courbes de niveau)",
    url: "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
    attribution: "Map data: &copy; <a href=\"https://openstreetmap.org/copyright\">OpenStreetMap contributors</a> | Map style: &copy; <a href=\"https://opentopomap.org\">OpenTopoMap</a> (CC-BY-SA)",
    maxZoom: 17,
  },
  {
    id: "esri-satellite",
    label: "Esri Satellite (imagerie aérienne)",
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution: "Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community",
    maxZoom: 18,
  },
  {
    id: "esri-topo",
    label: "Esri World Topo Map",
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}",
    attribution: "Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ, TomTom, Intermap, iPC, USGS, FAO, NPS, NRCAN, GeoBase, Kadaster NL, Ordnance Survey, Esri Japan, METI, Esri China (Hong Kong), and the GIS User Community",
    maxZoom: 18,
  },
  {
    id: "custom",
    label: "Personnalisée (URL manuelle)",
    url: "",
    attribution: "",
    maxZoom: 19,
  },
];

const DEFAULT_PRESET_ID = "esri-street";
const DEFAULT_ZOOM = 13;

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------
let amap;
let popups = {};
let selectedTableId = null;
let selectedRowId = null;
let selectedRecords = null;
let mode = 'multi';

let activePresetId = DEFAULT_PRESET_ID;
let customMapSource = '';
let customMapCopyright = '';

// Zoom persistence
let lockedZoom = null;
let lockedCenter = null;
let defaultZoom = DEFAULT_ZOOM;
let lockZoom = false;

// Popup/label options
let showPopup = true;       // show popup on selection
let popupDuration = 0;      // 0 = permanent; >0 = seconds before auto-close
let popupTimer = null;      // active setTimeout handle

// Column names
const Name = "Name";
const Longitude = "Longitude";
const Latitude = "Latitude";
const Description = "Description"; // optional second field
const Geocode = 'Geocode';
const Address = 'Address';
const GeocodedAddress = 'GeocodedAddress';

let lastRecord;
let lastRecords;

// ---------------------------------------------------------------------------
// Icons
// ---------------------------------------------------------------------------
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

// ---------------------------------------------------------------------------
// Cluster icon factory
// ---------------------------------------------------------------------------
const selectedRowClusterIconFactory = function (selectedMarkerGetter) {
  return function (cluster) {
    var childCount = cluster.getChildCount();
    let isSelected = false;
    try {
      const selectedMarker = selectedMarkerGetter();
      isSelected = cluster.getAllChildMarkers().filter((m) => m == selectedMarker).length > 0;
    } catch (e) {
      console.error(e);
    }
    var c = ' marker-cluster-';
    if (childCount < 10) { c += 'small'; }
    else if (childCount < 100) { c += 'medium'; }
    else { c += 'large'; }
    return new L.DivIcon({
      html: '<div><span>' + childCount + ' <span aria-label="markers"></span></span></div>',
      className: 'marker-cluster' + c + (isSelected ? ' marker-cluster-selected' : ''),
      iconSize: new L.Point(40, 40)
    });
  };
};

// ---------------------------------------------------------------------------
// Geocoding
// ---------------------------------------------------------------------------
let geocoder = L.Control.Geocoder && L.Control.Geocoder.nominatim();
if (URLSearchParams && location.search && geocoder) {
  const c = new URLSearchParams(location.search).get('geocoder');
  if (c && L.Control.Geocoder[c]) {
    geocoder = L.Control.Geocoder[c]();
  } else if (c) {
    console.warn('Unsupported geocoder', c);
  }
  const m = new URLSearchParams(location.search).get('mode');
  if (m) { mode = m; }
}

async function geocode(address) {
  const results = await geocoder.geocode(address);
  let v = results[0];
  if (v) { v = v.center; }
  return v;
}

async function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

let writeAccess = true;
let scanning = null;

async function scan(tableId, records, mappings) {
  if (!writeAccess) { return; }
  for (const record of records) {
    if (!(Geocode in record)) { break; }
    if (!record[Geocode]) { continue; }
    const address = record.Address;
    if (record[GeocodedAddress]) {
      if (record[GeocodedAddress] == record.Address) { continue; }
      else {
        record[Longitude] = null;
        record[Latitude] = null;
      }
    }
    if (address && !record[Longitude]) {
      const result = await geocode(address);
      await grist.docApi.applyUserActions([['UpdateRecord', tableId, record.id, {
        [mappings[Longitude]]: result?.lng ?? null,
        [mappings[Latitude]]: result?.lat ?? null,
        ...(GeocodedAddress in mappings && mappings[GeocodedAddress]) ? { [mappings[GeocodedAddress]]: address } : undefined
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

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function showProblem(txt) {
  document.getElementById('map').innerHTML = '<div class="error">' + txt + '</div>';
}

function parseValue(v) {
  if (typeof (v) === 'object' && v !== null && v.value && v.value.startsWith('V(')) {
    const payload = JSON.parse(v.value.slice(2, v.value.length - 1));
    return payload.remote || payload.local || payload.parent || payload;
  }
  return v;
}

function getInfo(rec) {
  return {
    id: rec.id,
    name: parseValue(rec[Name]),
    lng: parseValue(rec[Longitude]),
    lat: parseValue(rec[Latitude]),
    description: parseValue(rec[Description]) || '',
  };
}

// Build the HTML content shown inside a popup
function buildPopupContent(name, description) {
  const safeName = DOMPurify.sanitize(String(name || ''), { FORCE_BODY: true });
  const safeDesc = DOMPurify.sanitize(String(description || ''), { FORCE_BODY: true });
  if (safeDesc) {
    return '<div class="popup-title">' + safeName + '</div>'
         + '<div class="popup-desc">' + safeDesc + '</div>';
  }
  return '<div class="popup-title">' + safeName + '</div>';
}

function getActiveLayer() {
  const preset = TILE_PRESETS.find(p => p.id === activePresetId) || TILE_PRESETS[0];
  if (preset.id === 'custom') {
    return {
      url: customMapSource || 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
      attribution: DOMPurify.sanitize(customMapCopyright, { FORCE_BODY: true }),
      maxZoom: 19,
    };
  }
  return {
    url: preset.url,
    attribution: DOMPurify.sanitize(preset.attribution, { FORCE_BODY: true }),
    maxZoom: preset.maxZoom,
  };
}

// ---------------------------------------------------------------------------
// Popup timer
// ---------------------------------------------------------------------------
function clearPopupTimer() {
  if (popupTimer !== null) {
    clearTimeout(popupTimer);
    popupTimer = null;
  }
}

function openPopupWithTimer(marker) {
  if (!showPopup) { return; }
  clearPopupTimer();
  marker.openPopup();
  if (popupDuration > 0) {
    popupTimer = setTimeout(() => {
      marker.closePopup();
      popupTimer = null;
    }, popupDuration * 1000);
  }
}

// ---------------------------------------------------------------------------
// Map rendering
// ---------------------------------------------------------------------------
let clearMarkers = () => {};
let markers = [];

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

  clearPopupTimer();

  // Save current view before destroying the map
  if (amap && lockZoom) {
    lockedZoom = amap.getZoom();
    lockedCenter = amap.getCenter();
  }

  const layer = getActiveLayer();
  const tiles = L.tileLayer(layer.url, { attribution: layer.attribution, maxZoom: layer.maxZoom });

  const error = document.querySelector('.error');
  if (error) { error.remove(); }
  if (amap) {
    try { amap.off(); amap.remove(); } catch (e) { console.warn(e); }
  }

  const map = L.map('map', {
    layers: [tiles],
    wheelPxPerZoomLevel: 90,
    zoomControl: true,
  });

  map.createPane('selectedMarker').style.zIndex = 620;
  map.createPane('clusters').style.zIndex = 610;
  map.createPane('otherMarkers').style.zIndex = 600;

  const points = [];
  popups = {};

  markers = L.markerClusterGroup({
    disableClusteringAtZoom: 18,
    maxClusterRadius: 30,
    showCoverageOnHover: true,
    clusterPane: 'clusters',
    iconCreateFunction: selectedRowClusterIconFactory(() => popups[selectedRowId]),
  });

  markers.on('click', (e) => {
    const id = e.layer.options.id;
    selectMaker(id);
  });

  for (const rec of data) {
    const { id, name, lng, lat, description } = getInfo(rec);
    if (String(lng) === '...') { continue; }
    if (Math.abs(lat) < 0.01 && Math.abs(lng) < 0.01) { continue; }
    const pt = new L.LatLng(lat, lng);
    points.push(pt);
    const marker = L.marker(pt, {
      title: name,
      id: id,
      icon: (id == selectedRowId) ? selectedIcon : defaultIcon,
      pane: (id == selectedRowId) ? "selectedMarker" : "otherMarkers",
    });
    marker.bindPopup(buildPopupContent(name, description), { className: 'map-popup' });
    markers.addLayer(marker);
    popups[id] = marker;
  }
  map.addLayer(markers);
  clearMarkers = () => map.removeLayer(markers);

  // Restore locked zoom, or fit to bounds
  if (lockZoom && lockedZoom !== null && lockedCenter !== null) {
    map.setView(lockedCenter, lockedZoom);
  } else {
    try {
      map.fitBounds(new L.LatLngBounds(points), { maxZoom: defaultZoom, padding: [0, 0] });
    } catch (err) {
      console.warn('cannot fit bounds');
    }
  }

  // Track user zoom/pan
  map.on('zoomend moveend', () => {
    if (lockZoom) {
      lockedZoom = map.getZoom();
      lockedCenter = map.getCenter();
    }
  });

  function makeSureSelectedMarkerIsShown() {
    const rowId = selectedRowId;
    if (rowId && popups[rowId]) {
      const marker = popups[rowId];
      if (!marker._icon) { markers.zoomToShowLayer(marker); }
      if (showPopup) { openPopupWithTimer(marker); }
    }
  }

  amap = map;
  makeSureSelectedMarkerIsShown();
}

// ---------------------------------------------------------------------------
// Selection
// ---------------------------------------------------------------------------
function clearPopupMarker() {
  clearPopupTimer();
  const marker = popups[selectedRowId];
  if (marker) {
    marker.closePopup();
    marker.setIcon(defaultIcon);
    marker.pane = 'otherMarkers';
  }
}

function selectMaker(id) {
  clearPopupTimer();
  const previouslyClicked = popups[selectedRowId];
  if (previouslyClicked) {
    previouslyClicked.setIcon(defaultIcon);
    previouslyClicked.pane = 'otherMarkers';
  }
  const marker = popups[id];
  if (!marker) { return null; }
  selectedRowId = id;
  marker.setIcon(selectedIcon);
  marker.pane = 'selectedMarker';
  markers.refreshClusters();
  grist.setCursorPos?.({ rowId: id }).catch(() => {});
  if (showPopup) { openPopupWithTimer(marker); }
  return marker;
}

// ---------------------------------------------------------------------------
// Grist events
// ---------------------------------------------------------------------------
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
      [Address]: hasCol(Address, record) ? Address : null,
      [GeocodedAddress]: hasCol(GeocodedAddress, record) ? GeocodedAddress : null,
      [Geocode]: hasCol(Geocode, record) ? Geocode : null,
    };
  }
  return mappings;
}

function selectOnMap(rec) {
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
    lastRecord = grist.mapColumnNames(record) || record;
    selectOnMap(lastRecord);
    scanOnNeed(defaultMapping(record, mappings));
  } else {
    const marker = selectMaker(record.id);
    if (!marker) { return; }
    if (!lockZoom) {
      markers.zoomToShowLayer(marker);
    } else if (!marker._icon) {
      markers.zoomToShowLayer(marker);
    }
    if (showPopup) { openPopupWithTimer(marker); }
  }
});

grist.onRecords((data, mappings) => {
  lastRecords = grist.mapColumnNames(data) || data;
  if (mode !== 'single') {
    updateMap(lastRecords);
    if (lastRecord) { selectOnMap(lastRecord); }
    scanOnNeed(defaultMapping(data[0], mappings));
  }
});

grist.onNewRecord(() => {
  if (mode === 'single') {
    clearMarkers();
    clearMarkers = () => {};
  } else {
    clearPopupMarker();
  }
  selectedRowId = null;
});

function updateMode() {
  if (mode === 'single') {
    if (lastRecord) {
      selectedRowId = lastRecord.id;
      updateMap([lastRecord]);
    }
  } else {
    updateMap(lastRecords);
  }
}

// ---------------------------------------------------------------------------
// Settings panel
// ---------------------------------------------------------------------------
function buildPresetOptions() {
  const sel = document.getElementById('mapPreset');
  sel.innerHTML = '';
  for (const p of TILE_PRESETS) {
    const opt = document.createElement('option');
    opt.value = p.id;
    opt.textContent = p.label;
    sel.appendChild(opt);
  }
  sel.value = activePresetId;
  toggleCustomFields(activePresetId === 'custom');
}

function toggleCustomFields(show) {
  document.querySelectorAll('.custom-row').forEach(r => r.style.display = show ? '' : 'none');
}

function updateDurationRow() {
  const row = document.getElementById('durationRow');
  row.style.display = showPopup ? '' : 'none';
}

function formatDuration(sec) {
  if (sec === 0) { return 'Permanente'; }
  if (sec < 60) { return sec + ' s'; }
  return Math.round(sec / 60) + ' min'; // only reached if we extend range
}

function onEditOptions() {
  const popup = document.getElementById("settings");
  popup.style.display = 'block';

  document.getElementById("btnClose").onclick = () => popup.style.display = 'none';

  // Mode
  const checkbox = document.getElementById('cbxMode');
  checkbox.checked = mode === 'multi';
  checkbox.onchange = async (e) => {
    const newMode = e.target.checked ? 'multi' : 'single';
    if (newMode !== mode) {
      mode = newMode;
      await grist.setOption('mode', mode);
      updateMode();
    }
  };

  // Lock zoom
  const cbxLockZoom = document.getElementById('cbxLockZoom');
  cbxLockZoom.checked = lockZoom;
  cbxLockZoom.onchange = async (e) => {
    lockZoom = e.target.checked;
    if (!lockZoom) { lockedZoom = null; lockedCenter = null; }
    await grist.setOption('lockZoom', lockZoom);
  };

  document.getElementById('btnResetZoom').onclick = () => {
    lockedZoom = null;
    lockedCenter = null;
    updateMode();
  };

  // Default zoom slider
  const zoomSlider = document.getElementById('defaultZoom');
  const zoomLabel = document.getElementById('defaultZoomLabel');
  zoomSlider.value = defaultZoom;
  zoomLabel.textContent = defaultZoom;
  zoomSlider.oninput = (e) => {
    defaultZoom = parseInt(e.target.value, 10);
    zoomLabel.textContent = defaultZoom;
  };
  zoomSlider.onchange = async (e) => {
    defaultZoom = parseInt(e.target.value, 10);
    await grist.setOption('defaultZoom', defaultZoom);
  };

  // Show popup
  const cbxShowPopup = document.getElementById('cbxShowPopup');
  cbxShowPopup.checked = showPopup;
  updateDurationRow();
  cbxShowPopup.onchange = async (e) => {
    showPopup = e.target.checked;
    updateDurationRow();
    await grist.setOption('showPopup', showPopup);
    if (!showPopup && amap) {
      // Close any open popup
      amap.closePopup();
      clearPopupTimer();
    }
  };

  // Popup duration slider
  const durSlider = document.getElementById('popupDuration');
  const durLabel = document.getElementById('popupDurationLabel');
  // Slider: 0 = permanent, 1–59 = seconds
  durSlider.value = popupDuration;
  durLabel.textContent = formatDuration(popupDuration);
  durSlider.oninput = (e) => {
    popupDuration = parseInt(e.target.value, 10);
    durLabel.textContent = formatDuration(popupDuration);
  };
  durSlider.onchange = async (e) => {
    popupDuration = parseInt(e.target.value, 10);
    await grist.setOption('popupDuration', popupDuration);
  };

  // Tile preset
  buildPresetOptions();
  const presetSel = document.getElementById('mapPreset');
  presetSel.onchange = async (e) => {
    activePresetId = e.target.value;
    toggleCustomFields(activePresetId === 'custom');
    await grist.setOption('activePresetId', activePresetId);
    updateMode();
  };

  // Custom URL/copyright
  document.getElementById('mapSource').value = customMapSource;
  document.getElementById('mapCopyright').value = customMapCopyright;
  ['mapSource', 'mapCopyright'].forEach((opt) => {
    const ipt = document.getElementById(opt);
    ipt.onchange = async (e) => {
      if (opt === 'mapSource') { customMapSource = e.target.value; }
      else { customMapCopyright = e.target.value; }
      await grist.setOption(opt, e.target.value);
      if (activePresetId === 'custom') { updateMode(); }
    };
  });
}

// ---------------------------------------------------------------------------
// Grist ready / options
// ---------------------------------------------------------------------------
const optional = true;
grist.ready({
  columns: [
    "Name",
    { name: "Longitude", type: 'Numeric' },
    { name: "Latitude", type: 'Numeric' },
    { name: "Description", type: 'Text', title: 'Description (étiquette)', optional },
    { name: "Geocode", type: 'Bool', title: 'Geocode', optional },
    { name: "Address", type: 'Text', optional },
    { name: "GeocodedAddress", type: 'Text', title: 'Geocoded Address', optional },
  ],
  allowSelectBy: true,
  onEditOptions
});

grist.onOptions((options, interaction) => {
  writeAccess = interaction.accessLevel === 'full';
  mode = options?.mode ?? mode;
  activePresetId = options?.activePresetId ?? DEFAULT_PRESET_ID;
  customMapSource = options?.mapSource ?? '';
  customMapCopyright = options?.mapCopyright ?? '';
  lockZoom = options?.lockZoom ?? false;
  defaultZoom = options?.defaultZoom ?? DEFAULT_ZOOM;
  showPopup = options?.showPopup ?? true;
  popupDuration = options?.popupDuration ?? 0;
  if (lastRecords) { updateMode(); }
});
