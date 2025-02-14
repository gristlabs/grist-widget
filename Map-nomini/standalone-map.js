"use strict";

let amap;
let markersLayer; // Global variable to store markers
const geoJSONUrl = "https://raw.githubusercontent.com/sgfroerer/gmaps-grist-widgets/master/geojson/Refined.geojson";

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

// Create a custom gold icon for search results
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

  // Attach the load event listener after the map is initialized
  amap.on('load', function () {
    console.log("Map is fully loaded and ready for interaction");
  });

  L.control.layers(baseLayers, overlayLayers, { position: 'topright', collapsed: true }).addTo(amap);

  const searchControl = L.esri.Geocoding.geosearch({
    providers: [L.esri.Geocoding.arcgisOnlineProvider()],
    position: 'topleft'
  }).addTo(amap);

  const searchResults = L.layerGroup().addTo(amap);

  searchControl.on('results', function (data) {
    searchResults.clearLayers();
    for (let i = data.results.length - 1; i >= 0; i--) {
      searchResults.addLayer(L.marker(data.results[i].latlng, { icon: searchIcon }));
    }
  });

  overlayLayers["Search Results"] = searchResults;

  return amap;
}

function fetchGeoJSON(url, callback) {
  fetch(url)
    .then(response => response.json())
    .then(data => callback(data))
    .catch(error => console.error("Error fetching GeoJSON:", error));
}

// Update the popup content generation in updateMap function
function updateMap(data) {
  if (!amap) {
    amap = initializeMap();
  }

  if (!markersLayer) {
    markersLayer = L.markerClusterGroup();
    amap.addLayer(markersLayer);
  }

  data.features.forEach(feature => {
    const record = feature.properties;
    const coordinates = feature.geometry.coordinates;

    const marker = L.marker([coordinates[1], coordinates[0]], {
      title: record.Name,
      icon: defaultIcon
    });

    const popupContent = `
      <div class="card w-full bg-white p-0 m-0">
        <figure class="relative m-0">
          ${record["Pop-up IMG"] ? `
            <div class="image-container relative">
              <img src="${record["Pop-up IMG"]}" alt="${record.Name}" class="w-full h-33 object-cover"/>
            
            </div>
          ` : `
            <div class="w-full h-33 bg-gray-100 flex items-center justify-center">
              <span class="text-gray-400">No Image Available</span>
            </div>
          `}
          <div class="action-buttons">
            <div class="button-container">
              <a href="${record["County Prop Search"] || '#'}" class="action-btn" title="County Property Search" target="_blank">🔍</a>
              <a href="${record.GIS || '#'}" class="action-btn" title="GIS" target="_blank">🌎</a>
              <button class="action-btn" onclick="copyToClipboard(this)" data-copy="${record["Address Concatenate"]}" title="Copy Address">📋</button>
              <a href="https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${coordinates[1]},${coordinates[0]}" class="action-btn" title="Street View" target="_blank">🛣️</a>
              <a href="${record["CoStar URL"] || '#'}" class="action-btn" title="CoStar" target="_blank">🏢</a>
            </div>
          </div>
        </figure>
        <div class="card-content p-2">
          <h2 class="text-lg font-semibold cursor-pointer" onclick="toggleDetails(this)">${record.Name}</h2>
          <div class="details hidden">
            <p><strong>Address:</strong> <span class="copyable" onclick="copyToClipboard(this)">${record["Address Concatenate"]}</span></p>
            <p><strong>Property ID:</strong> <span class="copyable" onclick="copyToClipboard(this)">${record["Property Id"]}</span></p>
          </div>
        </div>
      </div>
    `;

    marker.bindPopup(popupContent, {
      maxWidth: 240,
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


// Initialize map when DOM is loaded
document.addEventListener("DOMContentLoaded", function () {
  fetchGeoJSON(geoJSONUrl, function (data) {
    updateMap(data);
  });
});
