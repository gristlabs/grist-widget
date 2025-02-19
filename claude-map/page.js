"use strict";

// Properly mock tippy.js functions
window.tippy = {
  createSingleton: () => ({
    applyStyles: () => {},
    setInstances: () => {},
    destroy: () => {}
  })
};

// Grist locale registration
if (typeof grist !== 'undefined' && grist.locale) {
  grist.locale.register({
    'menus.Compact': 'Compact',
    'menus.🌎Claude-Map': 'Claude Map',
    'menus.🏬': 'Properties'
  });
}

/* global grist, window */

// State management
let amap;
let markersLayer;
let popups = {};
let selectedTableId = null;
let selectedRowId = null;
let selectedRecords = null;
let lastRecord;
let lastRecords;
let mode = 'multi';
let writeAccess = true;
let scanning = null;

// Map configuration
let mapSource = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}';
let mapCopyright = 'Esri';

// Required column definitions
const Name = "Name";
const Longitude = "Longitude";
const Latitude = "Latitude";
const Property_Id = "Property_Id";
const Property_Address = "Property_Address";
const ImageURL = "ImageURLs";
const CoStar_URL = "CoStar_URL";
const County_Hyper = "County_Hyper";
const GIS = "GIS";
const Geocode = "Geocode";
const Address = "Property_Address";
const GeocodedAddress = "GeocodedAddress";

// Define onEditOptions function
function onEditOptions() {
  const settings = document.getElementById('settings');
  if (settings) {
    settings.style.display = settings.style.display === 'none' ? 'block' : 'none';
  }
}

// Map icons definition (unchanged)
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

const searchIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-gold.png',
  shadowUrl: 'marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Base map layers
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
  "openstreetmap": L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: ''
  })
};

const overlayLayers = {};

// Helper functions (unchanged)
function parseValue(v) {
  if (!v) return '';
  
  if (Array.isArray(v)) {
    return v.map(item => {
      if (item && typeof item === 'object' && item.Name) {
        return item.Name;
      }
      return item;
    }).join(", ");
  }
  
  if (typeof v === 'object') {
    if (v.Name) return v.Name;
    if (v.value && typeof v.value === 'string' && v.value.startsWith('V(')) {
      try {
        const payload = JSON.parse(v.value.slice(2, v.value.length - 1));
        return payload.remote || payload.local || payload.parent || payload;
      } catch (e) {
        return v.value;
      }
    }
    return v.toString();
  }
  
  return v.toString();
}

// Initialize widget with single DOMContentLoaded event
document.addEventListener("DOMContentLoaded", function() {
  createSettingsPanel();
  
  // Initialize map element if it doesn't exist
  if (!document.getElementById('map')) {
    const mapDiv = document.createElement('div');
    mapDiv.id = 'map';
    mapDiv.style.width = '100%';
    mapDiv.style.height = '100%';
    document.body.appendChild(mapDiv);
  }
  
  grist.ready({
    columns: [
      "Name",
      { name: "Longitude", type: "Numeric" },
      { name: "Latitude", type: "Numeric" },
      { name: "Property_Id", type: "Text" },
      { name: "Property_Address", type: "Text" },
      { name: "ImageURLs", type: "Text", optional: true },
      { name: "CoStar_URL", type: "Text", optional: true },
      { name: "County_Hyper", type: "Text", optional: true },
      { name: "GIS", type: "Text", optional: true },
      { name: "Geocode", type: "Bool", title: "Geocode", optional: true },
      { name: "GeocodedAddress", type: "Text", title: "Geocoded Address", optional: true },
    ],
    requiredPermissions: ['read', 'update'],
    allowSelectBy: true,
    onEditOptions
  });

  initializeMap();
});

// Add error handling for map updates
function updateMap(data) {
  if (!amap) {
    try {
      amap = initializeMap();
    } catch (err) {
      console.error('Error initializing map:', err);
      return;
    }
  }

  if (!markersLayer) {
    markersLayer = L.markerClusterGroup();
    amap.addLayer(markersLayer);
  } else {
    markersLayer.clearLayers();
  }

  try {
    (data || []).forEach(record => {
      if (record && record[Latitude] && record[Longitude]) {
        const marker = createMarker(record);
        if (marker) {
          popups[record.id] = marker;
          markersLayer.addLayer(marker);
        }
      }
    });
  } catch (err) {
    console.error('Error updating markers:', err);
  }
}

// Add cleanup function
function cleanup() {
  if (markersLayer) {
    markersLayer.clearLayers();
  }
  if (amap) {
    amap.remove();
  }
  popups = {};
  selectedRowId = null;
  lastRecord = null;
  lastRecords = null;
}

// Add cleanup on widget disposal
window.addEventListener('unload', cleanup);

// Options handling
grist.onOptions((options, interaction) => {
  writeAccess = interaction.accessLevel === 'full';
  
  if (options?.mode !== undefined && options.mode !== mode) {
    mode = options.mode;
    updateMode();
  }

  if (options?.mapSource !== undefined) {
    mapSource = options.mapSource;
    const element = document.getElementById("mapSource");
    if (element) {
      element.value = mapSource;
    }
  }

  if (options?.mapCopyright !== undefined) {
    mapCopyright = options.mapCopyright;
    const element = document.getElementById("mapCopyright");
    if (element) {
      element.value = mapCopyright;
    }
  }
});

// Add these functions to your file

function updateMode() {
  if (mode === 'single' && lastRecord) {
    selectedRowId = lastRecord.id;
    updateMap([lastRecord]);
  } else if (lastRecords) {
    updateMap(lastRecords);
  }
}

// Geocoding functionality
async function geocode(address) {
  // Add your geocoding implementation here if needed
  return new Promise((resolve, reject) => {
    if (!address) reject(new Error('No address provided'));
    
    const geocoder = L.esri.Geocoding.geocodeService();
    geocoder.geocode()
      .text(address)
      .run((err, results) => {
        if (err) {
          reject(err);
        } else if (results && results.results && results.results.length > 0) {
          const location = results.results[0].latlng;
          resolve({ lat: location.lat, lng: location.lng });
        } else {
          reject(new Error('No results found'));
        }
      });
  });
}

async function scan(tableId, records, mappings) {
  if (!writeAccess) { return; }
  for (const record of records) {
    if (!(Geocode in record)) { break; }
    if (!record[Geocode]) { continue; }
    const address = record[Address];
    if (record[GeocodedAddress] && record[GeocodedAddress] !== record[Address]) {
      record[Longitude] = null;
      record[Latitude] = null;
    }
    if (address && !record[Longitude]) {
      try {
        const result = await geocode(address);
        await grist.docApi.applyUserActions([['UpdateRecord', tableId, record.id, {
          [mappings[Longitude]]: result.lng,
          [mappings[Latitude]]: result.lat,
          ...(GeocodedAddress in mappings) ? {[mappings[GeocodedAddress]]: address} : undefined
        }]]);
        await new Promise(resolve => setTimeout(resolve, 1000)); // Delay between geocoding requests
      } catch (err) {
        console.error('Error geocoding address:', err);
      }
    }
  }
}

function scanOnNeed(mappings) {
  if (!scanning && selectedTableId && selectedRecords) {
    scanning = scan(selectedTableId, selectedRecords, mappings)
      .then(() => scanning = null)
      .catch(() => scanning = null);
  }
}

function hasCol(col, anything) {
  return anything && typeof anything === 'object' && col in anything;
}

function defaultMapping(record, mappings) {
  if (!mappings) {
    return {
      [Longitude]: Longitude,
      [Name]: Name,
      [Latitude]: Latitude,
      [Property_Id]: Property_Id,
      [ImageURL]: ImageURL,
      [CoStar_URL]: CoStar_URL,
      [County_Hyper]: County_Hyper,
      [GIS]: GIS,
      [Geocode]: hasCol(Geocode, record) ? Geocode : null,
      [Address]: hasCol(Address, record) ? Address : null,
      [GeocodedAddress]: hasCol(GeocodedAddress, record) ? GeocodedAddress : null,
    };
  }
  return mappings;
}

// Settings panel HTML template - add this to your initialization
function createSettingsPanel() {
  const settingsHtml = `
    <div id="settings" style="display:none">
      <span id="btnClose">×</span>
      <div>
        <label>
          <input type="checkbox" id="cbxMode"> Multiple markers
        </label>
      </div>
      <div>
        <label for="mapSource">Map Source:</label>
        <input type="text" id="mapSource">
      </div>
      <div>
        <label for="mapCopyright">Copyright:</label>
        <input type="text" id="mapCopyright">
      </div>
    </div>
  `;
  
  document.body.insertAdjacentHTML('beforeend', settingsHtml);
}
