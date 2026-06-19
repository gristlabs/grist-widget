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

// ---------------------------------------------------------------------------
// Pin colour palette (8 colours)
// ---------------------------------------------------------------------------
const PIN_COLORS = [
  { id: 'yellow',      label: 'Jaune',        hex: '#F5C300', dark: '#a38500' },
  { id: 'orange',      label: 'Orange',       hex: '#FF7A00', dark: '#b35500' },
  { id: 'red',         label: 'Rouge',        hex: '#D32F2F', dark: '#8b0000' },
  { id: 'green-light', label: 'Vert clair',   hex: '#43A047', dark: '#2e6b30' },
  { id: 'green-dark',  label: 'Vert foncé',   hex: '#1B5E20', dark: '#0a2e0b' },
  { id: 'blue-sky',    label: 'Bleu ciel',    hex: '#039BE5', dark: '#01579b' },
  { id: 'blue-navy',   label: 'Bleu marine',  hex: '#1565C0', dark: '#0d3b7a' },
  { id: 'purple',      label: 'Violet',       hex: '#7B1FA2', dark: '#4a0072' },
];

const DEFAULT_PRESET_ID  = "esri-street";
const DEFAULT_ZOOM       = 13;
const DEFAULT_COLOR_ID   = 'blue-navy';

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------
let amap;
let popups = {};
let selectedTableId  = null;
let selectedRowId    = null;
let selectedRecords  = null;
let mode = 'multi';

let activePresetId   = DEFAULT_PRESET_ID;
let customMapSource  = '';
let customMapCopyright = '';

let lockedZoom   = null;
let lockedCenter = null;
let defaultZoom  = DEFAULT_ZOOM;
let lockZoom     = false;

let showPopup      = true;
let popupDuration  = 0;
let popupTimer     = null;

let pinColorId = DEFAULT_COLOR_ID;

const Name            = "Name";
const Longitude       = "Longitude";
const Latitude        = "Latitude";
const Description     = "Description";
const Geocode         = 'Geocode';
const Address         = 'Address';
const GeocodedAddress = 'GeocodedAddress';

let lastRecord;
let lastRecords;

// ---------------------------------------------------------------------------
// SVG pin icons (no external image files needed)
// ---------------------------------------------------------------------------
function makePinSvg(fillColor, borderColor, scale) {
  const w = Math.round(25 * scale);
  const h = Math.round(41 * scale);
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 25 41">` +
    `<path d="M12.5 0C5.596 0 0 5.596 0 12.5c0 8.344 12.5 28.5 12.5 28.5S25 20.844 25 12.5C25 5.596 19.404 0 12.5 0z"` +
    ` fill="${fillColor}" stroke="${borderColor}" stroke-width="1.5"/>` +
    `<circle cx="12.5" cy="12.5" r="4.5" fill="white" opacity="0.9"/>` +
    `</svg>`
  );
}

function makeIcon(hexColor, darkColor, isSelected) {
  const scale  = isSelected ? 1.25 : 1;
  const fill   = isSelected ? hexColor : hexColor;
  const border = isSelected ? '#ffffff' : darkColor;
  const w = Math.round(25 * scale);
  const h = Math.round(41 * scale);
  return L.divIcon({
    html:        makePinSvg(fill, border, scale),
    className:   '',
    iconSize:    [w, h],
    iconAnchor:  [w / 2, h],
    popupAnchor: [0, -h + 4],
  });
}

function getColorDef(colorId) {
  return PIN_COLORS.find(c => c.id === colorId) || PIN_COLORS.find(c => c.id === DEFAULT_COLOR_ID);
}

function buildIcons() {
  const col = getColorDef(pinColorId);
  return {
    normal:   makeIcon(col.hex, col.dark, false),
    selected: makeIcon(col.hex, col.dark, true),
  };
}

// ---------------------------------------------------------------------------
// Cluster icon factory
// ---------------------------------------------------------------------------
const selectedRowClusterIconFactory = function (selectedMarkerGetter) {
  return function (cluster) {
    var childCount = cluster.getChildCount();
    let isSelected = false;
    try {
      const sm = selectedMarkerGetter();
      isSelected = cluster.getAllChildMarkers().some(m => m === sm);
    } catch (e) { console.error(e); }
    var c = childCount < 10 ? 'small' : childCount < 100 ? 'medium' : 'large';
    return new L.DivIcon({
      html: '<div><span>' + childCount + ' <span aria-label="markers"></span></span></div>',
      className: 'marker-cluster marker-cluster-' + c + (isSelected ? ' marker-cluster-selected' : ''),
      iconSize: new L.Point(40, 40),
    });
  };
};

// ---------------------------------------------------------------------------
// Geocoding
// ---------------------------------------------------------------------------
let geocoder = L.Control.Geocoder && L.Control.Geocoder.nominatim();
if (URLSearchParams && location.search && geocoder) {
  const c = new URLSearchParams(location.search).get('geocoder');
  if (c && L.Control.Geocoder[c]) { geocoder = L.Control.Geocoder[c](); }
  else if (c) { console.warn('Unsupported geocoder', c); }
  const m = new URLSearchParams(location.search).get('mode');
  if (m) { mode = m; }
}

async function geocode(address) {
  const results = await geocoder.geocode(address);
  let v = results[0];
  if (v) { v = v.center; }
  return v;
}

async function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

let writeAccess = true;
let scanning    = null;

async function scan(tableId, records, mappings) {
  if (!writeAccess) { return; }
  for (const record of records) {
    if (!(Geocode in record)) { break; }
    if (!record[Geocode]) { continue; }
    const address = record.Address;
    if (record[GeocodedAddress]) {
      if (record[GeocodedAddress] === record.Address) { continue; }
      record[Longitude] = null;
      record[Latitude]  = null;
    }
    if (address && !record[Longitude]) {
      const result = await geocode(address);
      await grist.docApi.applyUserActions([['UpdateRecord', tableId, record.id, {
        [mappings[Longitude]]: result?.lng ?? null,
        [mappings[Latitude]]:  result?.lat ?? null,
        ...(GeocodedAddress in mappings && mappings[GeocodedAddress])
          ? { [mappings[GeocodedAddress]]: address } : undefined,
      }]]);
      await delay(1000);
    }
  }
}

function scanOnNeed(mappings) {
  if (!scanning && selectedTableId && selectedRecords) {
    scanning = scan(selectedTableId, selectedRecords, mappings)
      .then(() => scanning = null).catch(() => scanning = null);
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function showProblem(txt) {
  document.getElementById('map').innerHTML = '<div class="error">' + txt + '</div>';
}

function parseValue(v) {
  if (typeof v === 'object' && v !== null && v.value && v.value.startsWith('V(')) {
    const p = JSON.parse(v.value.slice(2, v.value.length - 1));
    return p.remote || p.local || p.parent || p;
  }
  return v;
}

function getInfo(rec) {
  return {
    id:          rec.id,
    name:        parseValue(rec[Name]),
    lng:         parseValue(rec[Longitude]),
    lat:         parseValue(rec[Latitude]),
    description: parseValue(rec[Description]) || '',
  };
}

function buildPopupContent(name, description) {
  const safeName = DOMPurify.sanitize(String(name || ''), { FORCE_BODY: true });
  const safeDesc = DOMPurify.sanitize(String(description || ''), { FORCE_BODY: true });
  return safeDesc
    ? `<div class="popup-title">${safeName}</div><div class="popup-desc">${safeDesc}</div>`
    : `<div class="popup-title">${safeName}</div>`;
}

// Inject a <style> for the popup accent colour that matches the pin
function applyPopupColorStyle(hexColor) {
  let el = document.getElementById('popup-color-style');
  if (!el) {
    el = document.createElement('style');
    el.id = 'popup-color-style';
    document.head.appendChild(el);
  }
  el.textContent =
    `.map-popup .leaflet-popup-content-wrapper { border-left: 4px solid ${hexColor}; }` +
    `.map-popup .leaflet-popup-tip { background: ${hexColor}; }`;
}

function getActiveLayer() {
  const preset = TILE_PRESETS.find(p => p.id === activePresetId) || TILE_PRESETS[0];
  if (preset.id === 'custom') {
    return {
      url:         customMapSource || 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
      attribution: DOMPurify.sanitize(customMapCopyright, { FORCE_BODY: true }),
      maxZoom:     19,
    };
  }
  return {
    url:         preset.url,
    attribution: DOMPurify.sanitize(preset.attribution, { FORCE_BODY: true }),
    maxZoom:     preset.maxZoom,
  };
}

// ---------------------------------------------------------------------------
// Popup timer
// ---------------------------------------------------------------------------
function clearPopupTimer() {
  if (popupTimer !== null) { clearTimeout(popupTimer); popupTimer = null; }
}

function openPopupWithTimer(marker) {
  if (!showPopup || !marker) { return; }
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
  if (!data || data.length === 0) { showProblem("No data found yet"); return; }
  if (!(Longitude in data[0] && Latitude in data[0] && Name in data[0])) {
    showProblem("Table does not yet have all expected columns: Name, Longitude, Latitude.");
    return;
  }

  clearPopupTimer();

  if (amap && lockZoom) {
    lockedZoom   = amap.getZoom();
    lockedCenter = amap.getCenter();
  }

  const layer = getActiveLayer();
  const tiles = L.tileLayer(layer.url, { attribution: layer.attribution, maxZoom: layer.maxZoom });

  document.querySelector('.error')?.remove();
  if (amap) { try { amap.off(); amap.remove(); } catch (e) { console.warn(e); } }

  const map = L.map('map', { layers: [tiles], wheelPxPerZoomLevel: 90 });
  map.createPane('selectedMarker').style.zIndex = 620;
  map.createPane('clusters'      ).style.zIndex = 610;
  map.createPane('otherMarkers'  ).style.zIndex = 600;

  const icons  = buildIcons();
  const points = [];
  popups = {};

  // Apply popup accent colour
  applyPopupColorStyle(getColorDef(pinColorId).hex);

  markers = L.markerClusterGroup({
    disableClusteringAtZoom: 18,
    maxClusterRadius:        30,
    showCoverageOnHover:     true,
    clusterPane:             'clusters',
    iconCreateFunction:      selectedRowClusterIconFactory(() => popups[selectedRowId]),
  });

  // User click on a marker — selectMaker handles icon; open popup with timer
  markers.on('click', (e) => {
    const id = e.layer.options.id;
    selectMaker(id, icons);
    // Leaflet already opens the bound popup on click; just (re-)arm the timer
    if (showPopup && popupDuration > 0 && popups[id]) {
      clearPopupTimer();
      popupTimer = setTimeout(() => {
        popups[id]?.closePopup();
        popupTimer = null;
      }, popupDuration * 1000);
    }
  });

  for (const rec of data) {
    const { id, name, lng, lat, description } = getInfo(rec);
    if (String(lng) === '...') { continue; }
    if (Math.abs(lat) < 0.01 && Math.abs(lng) < 0.01) { continue; }
    const pt = new L.LatLng(lat, lng);
    points.push(pt);
    const marker = L.marker(pt, {
      title: name,
      id:    id,
      icon:  id == selectedRowId ? icons.selected : icons.normal,
      pane:  id == selectedRowId ? 'selectedMarker' : 'otherMarkers',
    });
    marker.bindPopup(buildPopupContent(name, description), { className: 'map-popup' });
    markers.addLayer(marker);
    popups[id] = marker;
  }

  map.addLayer(markers);
  clearMarkers = () => map.removeLayer(markers);

  if (lockZoom && lockedZoom !== null && lockedCenter !== null) {
    map.setView(lockedCenter, lockedZoom);
  } else {
    try {
      map.fitBounds(new L.LatLngBounds(points), { maxZoom: defaultZoom, padding: [0, 0] });
    } catch (e) { console.warn('cannot fit bounds'); }
  }

  map.on('zoomend moveend', () => {
    if (lockZoom) { lockedZoom = map.getZoom(); lockedCenter = map.getCenter(); }
  });

  amap = map;

  // Show popup for the currently selected row after the map is ready
  if (selectedRowId && popups[selectedRowId]) {
    const selMarker = popups[selectedRowId];
    if (!selMarker._icon) {
      markers.zoomToShowLayer(selMarker, () => openPopupWithTimer(selMarker));
    } else {
      openPopupWithTimer(selMarker);
    }
  }
}

// ---------------------------------------------------------------------------
// Selection helpers
// ---------------------------------------------------------------------------
function clearPopupMarker() {
  clearPopupTimer();
  const marker = popups[selectedRowId];
  if (marker) { marker.closePopup(); marker.setIcon(buildIcons().normal); }
}

// Only changes the icon; does NOT open a popup (caller decides)
function selectMaker(id, icons) {
  icons = icons || buildIcons();
  const prev = popups[selectedRowId];
  if (prev) { prev.setIcon(icons.normal); }
  const marker = popups[id];
  if (!marker) { return null; }
  selectedRowId = id;
  marker.setIcon(icons.selected);
  markers.refreshClusters();
  grist.setCursorPos?.({ rowId: id }).catch(() => {});
  return marker;
}

// ---------------------------------------------------------------------------
// Grist events
// ---------------------------------------------------------------------------
grist.on('message', (e) => { if (e.tableId) { selectedTableId = e.tableId; } });

function hasCol(col, obj) { return obj && typeof obj === 'object' && col in obj; }

function defaultMapping(record, mappings) {
  if (!mappings) {
    return {
      [Longitude]:       Longitude,
      [Name]:            Name,
      [Latitude]:        Latitude,
      [Address]:         hasCol(Address, record)         ? Address         : null,
      [GeocodedAddress]: hasCol(GeocodedAddress, record) ? GeocodedAddress : null,
      [Geocode]:         hasCol(Geocode, record)         ? Geocode         : null,
    };
  }
  return mappings;
}

function selectOnMap(rec) {
  if (selectedRowId === rec.id) { return; }
  selectedRowId = rec.id;
  if (mode === 'single') { updateMap([rec]); }
  else                   { updateMap(); }
}

grist.onRecord((record, mappings) => {
  if (mode === 'single') {
    lastRecord = grist.mapColumnNames(record) || record;
    selectOnMap(lastRecord);
    scanOnNeed(defaultMapping(record, mappings));
  } else {
    // Multi mode: change icon, then zoom to show, THEN open popup
    const marker = selectMaker(record.id);
    if (!marker) { return; }
    if (!lockZoom || !marker._icon) {
      markers.zoomToShowLayer(marker, () => openPopupWithTimer(marker));
    } else {
      openPopupWithTimer(marker);
    }
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
  if (mode === 'single') { clearMarkers(); clearMarkers = () => {}; }
  else                   { clearPopupMarker(); }
  selectedRowId = null;
});

function updateMode() {
  if (mode === 'single') {
    if (lastRecord) { selectedRowId = lastRecord.id; updateMap([lastRecord]); }
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
    opt.value = p.id; opt.textContent = p.label;
    sel.appendChild(opt);
  }
  sel.value = activePresetId;
  toggleCustomFields(activePresetId === 'custom');
}

function toggleCustomFields(show) {
  document.querySelectorAll('.custom-row').forEach(r => r.style.display = show ? '' : 'none');
}

function buildColorSwatches() {
  const container = document.getElementById('colorSwatches');
  container.innerHTML = '';
  for (const col of PIN_COLORS) {
    const btn = document.createElement('button');
    btn.className = 'swatch' + (col.id === pinColorId ? ' swatch-selected' : '');
    btn.title = col.label;
    btn.style.background = col.hex;
    btn.style.borderColor = col.dark;
    btn.onclick = async () => {
      pinColorId = col.id;
      container.querySelectorAll('.swatch').forEach(b => b.classList.remove('swatch-selected'));
      btn.classList.add('swatch-selected');
      await grist.setOption('pinColorId', pinColorId);
      updateMode();
    };
    container.appendChild(btn);
  }
}

function updateDurationRow() {
  document.getElementById('durationRow').style.display = showPopup ? '' : 'none';
}

function formatDuration(sec) {
  if (sec === 0) { return 'Permanente'; }
  return sec + ' s';
}

function onEditOptions() {
  const panel = document.getElementById("settings");
  panel.style.display = 'block';

  document.getElementById("btnClose").onclick = () => panel.style.display = 'none';

  // Mode
  const cbxMode = document.getElementById('cbxMode');
  cbxMode.checked = mode === 'multi';
  cbxMode.onchange = async (e) => {
    const nm = e.target.checked ? 'multi' : 'single';
    if (nm !== mode) { mode = nm; await grist.setOption('mode', mode); updateMode(); }
  };

  // Lock zoom
  const cbxLockZoom = document.getElementById('cbxLockZoom');
  cbxLockZoom.checked = lockZoom;
  cbxLockZoom.onchange = async (e) => {
    lockZoom = e.target.checked;
    if (!lockZoom) { lockedZoom = null; lockedCenter = null; }
    await grist.setOption('lockZoom', lockZoom);
  };
  document.getElementById('btnResetZoom').onclick = () => { lockedZoom = null; lockedCenter = null; updateMode(); };

  // Default zoom
  const zoomSlider = document.getElementById('defaultZoom');
  const zoomLabel  = document.getElementById('defaultZoomLabel');
  zoomSlider.value = defaultZoom; zoomLabel.textContent = defaultZoom;
  zoomSlider.oninput  = (e) => { defaultZoom = +e.target.value; zoomLabel.textContent = defaultZoom; };
  zoomSlider.onchange = async (e) => { defaultZoom = +e.target.value; await grist.setOption('defaultZoom', defaultZoom); };

  // Show popup
  const cbxShowPopup = document.getElementById('cbxShowPopup');
  cbxShowPopup.checked = showPopup;
  updateDurationRow();
  cbxShowPopup.onchange = async (e) => {
    showPopup = e.target.checked;
    updateDurationRow();
    await grist.setOption('showPopup', showPopup);
    if (!showPopup && amap) { amap.closePopup(); clearPopupTimer(); }
  };

  // Duration slider
  const durSlider = document.getElementById('popupDuration');
  const durLabel  = document.getElementById('popupDurationLabel');
  durSlider.value = popupDuration; durLabel.textContent = formatDuration(popupDuration);
  durSlider.oninput  = (e) => { popupDuration = +e.target.value; durLabel.textContent = formatDuration(popupDuration); };
  durSlider.onchange = async (e) => { popupDuration = +e.target.value; await grist.setOption('popupDuration', popupDuration); };

  // Pin colours
  buildColorSwatches();

  // Tile preset
  buildPresetOptions();
  const presetSel = document.getElementById('mapPreset');
  presetSel.onchange = async (e) => {
    activePresetId = e.target.value;
    toggleCustomFields(activePresetId === 'custom');
    await grist.setOption('activePresetId', activePresetId);
    updateMode();
  };

  document.getElementById('mapSource').value    = customMapSource;
  document.getElementById('mapCopyright').value = customMapCopyright;
  ['mapSource', 'mapCopyright'].forEach(opt => {
    document.getElementById(opt).onchange = async (e) => {
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
    { name: "Longitude",       type: 'Numeric' },
    { name: "Latitude",        type: 'Numeric' },
    { name: "Description",     type: 'Text',  title: 'Description (étiquette)', optional },
    { name: "Geocode",         type: 'Bool',  title: 'Geocode',                 optional },
    { name: "Address",         type: 'Text',                                    optional },
    { name: "GeocodedAddress", type: 'Text',  title: 'Geocoded Address',        optional },
  ],
  allowSelectBy: true,
  onEditOptions,
});

grist.onOptions((options, interaction) => {
  writeAccess    = interaction.accessLevel === 'full';
  mode           = options?.mode          ?? mode;
  activePresetId = options?.activePresetId ?? DEFAULT_PRESET_ID;
  customMapSource    = options?.mapSource    ?? '';
  customMapCopyright = options?.mapCopyright ?? '';
  lockZoom       = options?.lockZoom      ?? false;
  defaultZoom    = options?.defaultZoom   ?? DEFAULT_ZOOM;
  showPopup      = options?.showPopup     ?? true;
  popupDuration  = options?.popupDuration ?? 0;
  pinColorId     = options?.pinColorId    ?? DEFAULT_COLOR_ID;
  if (lastRecords) { updateMode(); }
});
