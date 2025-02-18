"use strict";

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
const Name = "Name";  // ReferenceList to Owners_
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

// Map icons
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

// Helper functions
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

function copyToClipboard(text) {
  const tempInput = document.createElement('input');
  tempInput.style.position = 'absolute';
  tempInput.style.left = '-9999px';
  tempInput.value = text;
  document.body.appendChild(tempInput);
  tempInput.select();
  document.execCommand('copy');
  document.body.removeChild(tempInput);
}

function toggleDetails(element) {
  element.classList.toggle('expanded');
  const details = element.nextElementSibling;
  if (details) {
    details.classList.toggle('expanded');
  }
}

// Map interaction functions
function createPopupContent(record) {
  const address = parseValue(record[Address]) || '';
  const propertyId = parseValue(record[Property_Id]) || '';
  const name = parseValue(record[Name]) || '';
  const imageUrl = parseValue(record[ImageURL]) || '';
  
  return `
    <div class="card">
      <figure>
        ${imageUrl ? `
          <img src="${imageUrl}" alt="${name}" />
        ` : `
          <div class="w-full h-[140px] bg-gray-100 flex items-center justify-center">
            <span class="text-gray-400">No Image</span>
          </div>
        `}
        <div class="action-buttons">
          <div class="button-container">
            ${record[County_Hyper] ? `<a href="${record[County_Hyper]}" class="action-btn" title="County Property Search" target="_blank">🔍</a>` : ''}
            ${record[GIS] ? `<a href="${record[GIS]}" class="action-btn" title="GIS" target="_blank">🌎</a>` : ''}
            ${address ? `<button type="button" class="action-btn" onclick="copyToClipboard('${address.replace(/'/g, "\\'")}')" title="Copy Address">📋</button>` : ''}
            <a href="https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${record[Latitude]},${record[Longitude]}" class="action-btn" title="Street View" target="_blank">🛣️</a>
            ${record[CoStar_URL] ? `<a href="${record[CoStar_URL]}" class="action-btn" title="CoStar" target="_blank">🏢</a>` : ''}
          </div>
        </div>
      </figure>
      <div class="card-content">
        <h2 onclick="toggleDetails(this)">${name}</h2>
        <div class="details">
          ${address ? `<p><strong>Address:</strong> <span class="copyable" onclick="copyToClipboard('${address.replace(/'/g, "\\'")}')">${address}</span></p>` : ''}
          ${propertyId ? `<p><strong>Property ID:</strong> <span class="copyable" onclick="copyToClipboard('${propertyId.replace(/'/g, "\\'")}')">${propertyId}</span></p>` : ''}
        </div>
      </div>
    </div>
  `;
}

function createMarker(record) {
  const lat = record[Latitude];
  const lng = record[Longitude];
  
  if (lat && lng) {
    const marker = L.marker([lat, lng], {
      icon: (record.id === selectedRowId) ? selectedIcon : defaultIcon
    });
    
    marker.record = record;
    const popupContent = createPopupContent(record);
    
    marker.bindPopup(popupContent, {
      maxWidth: 240,
      minWidth: 240,
      className: 'custom-popup'
    });
    
    return marker;
  }
  return null;
}

function onRecordSelection(record) {
  if (!record || !amap) return;
  
  const lat = record[Latitude];
  const lng = record[Longitude];
  
  if (lat && lng) {
    const latlng = L.latLng(lat, lng);
    amap.setView(latlng, 16);
    
    if (markersLayer) {
      markersLayer.eachLayer((layer) => {
        if (layer.getLatLng().equals(latlng)) {
          layer.setIcon(selectedIcon);
          layer.openPopup();
        } else {
          layer.setIcon(defaultIcon);
        }
      });
    }
    
    lastRecord = record;
  }
}

function updateMap(data) {
  if (!amap) {
    amap = initializeMap();
  }

  if (!markersLayer) {
    markersLayer = L.markerClusterGroup();
    amap.addLayer(markersLayer);
  } else {
    markersLayer.clearLayers();
  }

  (data || []).forEach(record => {
    const marker = createMarker(record);
    if (marker) {
      popups[record.id] = marker;
      markersLayer.addLayer(marker);
    }
  });
}

// Grist integration functions
function subscribeToRecords() {
  grist.onRecords(records => {
    lastRecords = records;
    updateMap(records);
  });
  
  grist.onRecord(record => {
    if (record) {
      selectedRowId = record.id;
      onRecordSelection(record);
    } else {
      selectedRowId = null;
    }
  });
}

function initializeMap() {
  amap = L.map('map', {
    layers: [baseLayers["Google Hybrid"]],
    center: [45.5283, -122.8081],
    zoom: 4,
    wheelPxPerZoomLevel: 90
  });

  // Subscribe to records before setting up other features
  subscribeToRecords();

  L.control.layers(baseLayers, overlayLayers, { 
    position: 'topright', 
    collapsed: true 
  }).addTo(amap);

  const searchControl = L.esri.Geocoding.geosearch({
    providers: [L.esri.Geocoding.arcgisOnlineProvider()],
    position: 'topleft',
    attribution: false
  }).addTo(amap);

  const searchResults = L.layerGroup().addTo(amap);

  searchControl.on('results', function(data) {
    searchResults.clearLayers();
    data.results.forEach(result => {
      const marker = L.marker(result.latlng, { icon: searchIcon });
      searchResults.addLayer(marker);
    });
  });

  overlayLayers["Search Results"] = searchResults;

  amap.on('popupopen', function(e) {
    const marker = e.popup._source;
    if (marker && marker.record) {
      grist.selectRecord(marker.record.id);
    }
  });

  return amap;
}

// Settings and options handling
function onEditOptions() {
  const popup = document.getElementById("settings");
  popup.style.display = 'block';
  
  document.getElementById("btnClose").onclick = () => popup.style.display = 'none';
  
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

  ["mapSource", "mapCopyright"].forEach((opt) => {
    const input = document.getElementById(opt);
    input.onchange = async (e) => {
      await grist.setOption(opt, e.target.value);
    };
  });
}

function updateMode() {
  if (mode === 'single' && lastRecord) {
    selectedRowId = lastRecord.id;
    updateMap([lastRecord]);
  } else if (lastRecords) {
    updateMap(lastRecords);
  }
}

// Initialize widget
document.addEventListener("DOMContentLoaded", function() {
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
    allowSelectBy: true,
    onEditOptions
  });

  initializeMap();
});

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
