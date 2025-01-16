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
      searchResults.addLayer(L.marker(data.results[i].latlng));
    }
  });

  overlayLayers["Search Results"] = searchResults;

  // Synchronize with Google Map
  var googleMapIframe = document.getElementById('googleMap');

  // Function to sync Leaflet map with Google MyMap
  function syncMaps() {
    // Sync the Leaflet map with the iframe's view
    amap.on('moveend', function() {
      var center = amap.getCenter();
      var zoom = amap.getZoom();
      var ll = center.lat + ',' + center.lng;
      googleMapIframe.src = "https://www.google.com/maps/d/embed?mid=1XYqZpHKr3L0OGpTWlkUah7Bf4v0tbhA&ll=" + ll + "&z=" + zoom;
    });
  }

  syncMaps();

  // Collapsible minimap logic
  const minimapContainer = document.getElementById('minimap-container');
  const toggleButton = document.getElementById('toggleMinimap');

  if (toggleButton && minimapContainer) {
    toggleButton.addEventListener('click', function () {
      minimapContainer.classList.toggle('collapsed');
    });
  }

  return amap;
}

function fetchGeoJSON(url, callback) {
  fetch(url)
    .then(response => response.json())
    .then(data => callback(data))
    .catch(error => console.error("Error fetching GeoJSON:", error));
}

function updateMap(data) {
  if (!amap) {
    amap = initializeMap();
  }

  // Create marker cluster group if it doesn't exist
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
      <div class="bg-white rounded-lg shadow-lg overflow-hidden" style="max-width: 200px;">
        <!-- Header -->
        <div class="p-3 border-b border-gray-200">
          <h3 class="text-sm font-semibold text-gray-800">${record.Name}</h3>
        </div>

        <!-- Image Section -->
        <div class="relative">
          ${record["Pop-up IMG"] ? `
            <img src="${record["Pop-up IMG"]}" alt="Property Image" class="w-full h-24 object-cover cursor-pointer hover:opacity-90" onclick="openLightbox('${record["Pop-up IMG"]}')" />
          ` : `
            <div class="w-full h-24 bg-gray-100 flex items-center justify-center text-gray-500 text-xs">
              No Image Available
            </div>
          `}
        </div>

        <!-- Property Details -->
        <div class="p-3 space-y-2">
          <div class="text-xs text-gray-700">
            <strong>Address:</strong> ${record["Property Address"]}
          </div>
          <div class="text-xs text-gray-700">
            <strong>City:</strong> ${record.City}
          </div>
          <div class="text-xs text-gray-700">
            <strong>Type:</strong> ${record["Property Type"]}
          </div>

          <!-- Collapsible Tenants Section -->
          <div class="text-xs text-gray-700">
            <div class="flex items-center justify-between cursor-pointer" onclick="toggleTenants(this)">
              <strong>Tenants:</strong>
              <span class="text-gray-500">▼</span>
            </div>
            <div class="mt-1 hidden">
              ${record.Tenants || "No tenants listed"}
            </div>
          </div>
        </div>

        <!-- Buttons -->
        <div class="p-3 bg-gray-50 flex gap-2">
          <a href="${record["CoStar URL"]}" class="popup-button costar-button text-xs px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors" target="_blank">CoStar</a>
          <a href="${record["County Prop Search"]}" class="popup-button county-button text-xs px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition-colors" target="_blank">County</a>
          <a href="${record.GIS}" class="popup-button gis-button text-xs px-2 py-1 bg-yellow-400 text-gray-800 rounded hover:bg-yellow-500 transition-colors" target="_blank">GIS</a>
        </div>
      </div>
    `;

    marker.bindPopup(popupContent);
    markersLayer.addLayer(marker);
  });

  // Initialize Tippy.js for buttons
  tippy('.popup-button', {
    content: (reference) => {
      if (reference.classList.contains('costar-button')) {
        return 'Open in CoStar';
      } else if (reference.classList.contains('county-button')) {
        return 'Open in County Property Search';
      } else if (reference.classList.contains('gis-button')) {
        return 'Open in GIS';
      }
    },
    placement: 'top',
    arrow: true,
    animation: 'fade',
  });
}

// Lightbox function for image preview
function openLightbox(imageUrl) {
  const lightbox = document.createElement('div');
  lightbox.className = 'fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50';
  lightbox.innerHTML = `
    <div class="relative">
      <img src="${imageUrl}" alt="Full-size Image" class="max-w-full max-h-full" />
      <button onclick="this.parentElement.parentElement.remove()" class="absolute top-2 right-2 bg-white rounded-full p-1 hover:bg-gray-200">
        ✕
      </button>
    </div>
  `;
  document.body.appendChild(lightbox);
}

// Toggle tenants section
function toggleTenants(element) {
  const tenantsSection = element.nextElementSibling;
  tenantsSection.classList.toggle('hidden');
}

// Initialize map when DOM is loaded
document.addEventListener("DOMContentLoaded", function () {
  const minimapContainer = document.getElementById('minimap-container');
  const toggleButton = document.getElementById('toggleMinimap');

  // Toggle minimap visibility
  toggleButton.addEventListener('click', function () {
    minimapContainer.classList.toggle('collapsed');
  });

  // Fetch and display GeoJSON data
  fetchGeoJSON(geoJSONUrl, function (data) {
    updateMap(data);
  });
});
