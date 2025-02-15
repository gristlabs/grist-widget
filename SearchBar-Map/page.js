// page.js
"use strict";

let amap;
let markersLayer;
let selectedRowId = null;

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

// Add searchIcon, as in your second example, if you want gold markers for search.
const searchIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-gold.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const baseLayers = {
  "Google Hybrid": L.tileLayer('http://mt0.google.com/vt/lyrs=y&hl=en&x={x}&y={y}&z={z}', {
    attribution: ''
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

function initializeMap() {
  amap = L.map('map', {
    layers: [baseLayers["Google Hybrid"]],
    center: [45.5283, -122.8081], // Default center (USA)
    zoom: 4, // Default zoom level
    wheelPxPerZoomLevel: 90
  });

  L.control.layers(baseLayers, overlayLayers, { position: 'topright', collapsed: true }).addTo(amap);

  const searchControl = L.esri.Geocoding.geosearch({
    providers: [L.esri.Geocoding.arcgisOnlineProvider()],
    position: 'topleft',
    useMapBounds: false // Ensure search is not restricted to current map bounds
  }).addTo(amap);

  const searchResults = L.layerGroup().addTo(amap);

  searchControl.on('results', function (data) {
    searchResults.clearLayers(); // Clear previous results
    if (data.results.length > 0) {
      for (let i = 0; i < data.results.length; i++) {
        const result = data.results[i];
        const marker = L.marker(result.latlng, { icon: searchIcon });  // Use searchIcon
        marker.bindPopup(`<b>${result.text}</b>`).openPopup();
        searchResults.addLayer(marker);
      }
    }
  });

  overlayLayers["Search Results"] = searchResults;

  return amap;
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

  data.forEach(record => {
    const marker = L.marker([record.Latitude, record.Longitude], {
      title: record.Name,
      icon: record.id === selectedRowId ? selectedIcon : defaultIcon
    });

    // Use the popup structure from your second example, adapted for your first example's data:
    const popupContent = `
      <div class="card w-full bg-white p-0 m-0">
        <figure class="relative m-0">
          ${record.ImageURL ? `
            <div class="image-container relative">
              <img src="${record.ImageURL}" alt="${record.Name}" class="w-full h-33 object-cover"/>
            </div>
          ` : `
            <div class="w-full h-33 bg-gray-100 flex items-center justify-center">
              <span class="text-gray-400">No Image Available</span>
            </div>
          `}
          <div class="action-buttons">
            <div class="button-container">
              <a href="${record.County_Hyper || '#'}" class="action-btn" title="County" target="_blank">🔍</a>
              <a href="${record.GIS || '#'}" class="action-btn" title="GIS" target="_blank">🌎</a>
              <button class="action-btn" onclick="copyToClipboard(this)" data-copy="${record.Address}" title="Copy Address">📋</button>
              <a href="https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${record.Latitude},${record.Longitude}" class="action-btn" title="Street View" target="_blank">🛣️</a>
              <a href="${record.CoStar_URL || '#'}" class="action-btn" title="CoStar" target="_blank">🏢</a>
            </div>
          </div>
        </figure>
        <div class="card-content p-2">
          <h2 class="text-lg font-semibold cursor-pointer" onclick="toggleDetails(this)">${record.Name}</h2>
          <div class="details hidden">
            <p><strong>Address:</strong> <span class="copyable" onclick="copyToClipboard(this)">${record.Address}</span></p>
            <p><strong>Property ID:</strong> <span class="copyable" onclick="copyToClipboard(this)">${record.id}</span></p>
          </div>
        </div>
      </div>
    `;

    marker.bindPopup(popupContent, {
      maxWidth: 240,  // Match the second example
      minWidth: 240,
      className: 'custom-popup'
    });

    markersLayer.addLayer(marker);
  });
}
function toggleDetails(header) {
  const details = header.nextElementSibling;
  if (details) {
    details.classList.toggle('hidden');
  }
}

function copyToClipboard(element) {
  const textToCopy = element.dataset.copy || element.innerText;
  navigator.clipboard.writeText(textToCopy).then(() => {
    const tooltip = document.createElement('div');
    tooltip.className = 'copy-tooltip';
    tooltip.textContent = 'Copied!';
    element.appendChild(tooltip);
    setTimeout(() => { tooltip.remove(); }, 1000);
  });
}

grist.ready({
  columns: [
    "Name",
    { name: "Longitude", type: 'Numeric' },
    { name: "Latitude", type: 'Numeric' },
    { name: "Property_Type", type: 'Choice' },
    { name: "Tenants", type: 'ChoiceList' },
    { name: "Secondary_Type", type: 'ChoiceList' },
    { name: "ImageURL", type: 'Text' },
    { name: "CoStar_URL", type: 'Text' },
    { name: "County_Hyper", type: 'Text' },
    { name: "GIS", type: 'Text' },
    { name: "Geocode", type: 'Bool', title: 'Geocode', optional: true },
    { name: "Address", type: 'Text', optional: true },
    { name: "GeocodedAddress", type: 'Text', title: 'Geocoded Address', optional: true },
  ],
  allowSelectBy: true
});

grist.onRecord((record) => {
  selectedRowId = record.id;
  updateMap([record]);
});

grist.onRecords((records) => {
  updateMap(records);
});
