"use strict";

/* global grist, window, mapboxgl */

let map;
let popups = {};
let selectedTableId = null;
let selectedRowId = null;
let selectedRecords = null;
let mode = 'multi';
let mapSource = 'mapbox://styles/mapbox/streets-v11';
let mapCopyright = '© Mapbox, © OpenStreetMap contributors';

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

// Mapbox access token
mapboxgl.accessToken = 'YOUR_MAPBOX_ACCESS_TOKEN';

function initMap() {
  console.log("Initializing map...");
  map = new mapboxgl.Map({
    container: 'map',
    style: mapSource,
    center: [-98, 38.88], // Initial center point (longitude, latitude)
    zoom: 3 // Initial zoom level
  });

  map.on('load', function() {
    console.log("Map loaded.");
    updateMap(selectedRecords);
  });
}

function updateMap(data) {
  console.log("Updating map with data: ", data);
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

  if (!map) {
    console.log("Map not initialized, initializing now...");
    initMap();
  }

  // Remove existing markers
  if (popups) {
    for (const id in popups) {
      popups[id].remove();
    }
  }

  popups = {}; // Reset popups

  for (const rec of data) {
    const {id, name, lng, lat} = getInfo(rec);
    if (String(lng) === '...') { continue; }
    if (Math.abs(lat) < 0.01 && Math.abs(lng) < 0.01) {
      continue;
    }

    console.log("Adding marker for record: ", rec);

    const popup = new mapboxgl.Popup({ offset: 25 }).setText(name);

    const marker = new mapboxgl.Marker({
      color: (id == selectedRowId) ? 'green' : 'red'
    })
    .setLngLat([lng, lat])
    .setPopup(popup)
    .addTo(map);

    marker.getElement().addEventListener('click', () => {
      selectMaker(id);
    });

    popups[id] = marker;
  }

  // Fit map to markers
  const bounds = new mapboxgl.LngLatBounds();
  data.forEach(rec => {
    if (rec[Longitude] && rec[Latitude]) {
      bounds.extend([rec[Longitude], rec[Latitude]]);
    }
  });
  if (bounds.isEmpty()) {
    map.setCenter([-98, 38.88]);
    map.setZoom(3);
  } else {
    map.fitBounds(bounds, { padding: 20 });
  }

  makeSureSelectedMarkerIsShown();
}

function selectMaker(id) {
  const previouslyClicked = popups[selectedRowId];
  if (previouslyClicked) {
    previouslyClicked.setPopup(null).setPopup(new mapboxgl.Popup({ offset: 25 }).setText(previouslyClicked.getElement().title));
  }
  const marker = popups[id];
  if (!marker) { return null; }

  selectedRowId = id;
  marker.setPopup(new mapboxgl.Popup({ offset: 25 }).setText(marker.getElement().title));
  marker.togglePopup();

  grist.setCursorPos?.({rowId: id}).catch(() => {});

  return marker;
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

function makeSureSelectedMarkerIsShown() {
  const rowId = selectedRowId;
  if (rowId && popups[rowId]) {
    map.flyTo({ center: popups[rowId].getLngLat(), essential: true });
  }
}

function parseValue(v) {
  if (typeof(v) === 'object' && v !== null && v.value && v.value.startsWith('V(')) {
    const payload = JSON.parse(v.value.slice(2, v.value.length - 1));
    return payload.remote || payload.local || payload.parent || payload;
  }
  return v;
}

function showProblem(txt) {
  console.error(txt);
  document.getElementById('map').innerHTML = '<div class="error">' + txt + '</div>';
}

grist.on('message', (e) => {
  console.log("Received message: ", e);
  if (e.tableId) { selectedTableId = e.tableId; }
});

grist.onRecord((record, mappings) => {
  console.log("Received record: ", record);
  lastRecord = grist.mapColumnNames(record) || record;
  selectOnMap(lastRecord);
});

grist.onRecords((data, mappings) => {
  console.log("Received records: ", data);
  lastRecords = grist.mapColumnNames(data) || data;
  updateMap(lastRecords);
});

grist.onNewRecord(() => {
  console.log("New record event");
  popups = {};
});

function selectOnMap(rec) {
  if (selectedRowId === rec.id) { return; }
  selectedRowId = rec.id;
  if (mode === 'single') {
    updateMap([rec]);
  } else {
    updateMap();
  }
}

grist.on('message', (e) => {
  if (e.tableId) { selectedTableId = e.tableId; }
});

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
    const ipt = document.getElementById(opt);
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
    { name: "Geocode", type: 'Bool', title: 'Geocode', optional},
    { name: "Address", type: 'Text', optional},
    { name: "GeocodedAddress", type: 'Text', title: 'Geocoded Address', optional},
  ],
  allowSelectBy: true,
  onEditOptions
});

grist.onOptions((options, interaction) => {
  const newMode = options?.mode ?? mode;
  mode = newMode;
  updateMode();
  if (!interaction) {
    mapSource = options?.mapSource ?? mapSource;
    mapCopyright = options?.mapCopyright ?? mapCopyright;
  }
});

function updateMode() {
  const checkbox = document.getElementById('cbxMode');
  if (checkbox) {
    checkbox.checked = mode === 'multi' ? true : false;
  }
}
