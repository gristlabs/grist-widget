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

    const popupContent = `<div style="font-size: 12px; line-height: 1.3; padding: 8px; max-width: 160px;">
      <strong style="font-size: 13px; display: block; margin-bottom: 4px;">${record.Name}</strong>
      ${record["Pop-up IMG"] ? `<img src="${record["Pop-up IMG"]}" alt="Image" style="width: 100%; height: auto; border-radius: 2px; margin-bottom: 3px;" />` : `<p style="margin: 0;">No Image Available</p>`}
      <p style="margin: 2px 0; font-size: 11px;"><strong>Property Address:</strong> ${record["Property Address"]}</p>
      <p style="margin: 2px 0; font-size: 11px;"><strong>City:</strong> ${record.City}</p>
      <p style="margin: 2px 0; font-size: 11px;"><strong>Property Type:</strong> ${record["Property Type"]}</p>
      <p style="margin: 2px 0; font-size: 11px;"><strong>Tenants:</strong> ${record.Tenants}</p>
      <div class="popup-buttons" style="display: flex; gap: 4px; margin-top: 3px;">
        <a href="${record["CoStar URL"]}" style="font-size: 10px; padding: 4px 6px; background-color: #007acc; color: white; border-radius: 3px; text-decoration: none;" class="popup-button" target="_blank">CoStar</a>
        <a href="${record["County Prop Search"]}" style="font-size: 10px; padding: 4px 6px; background-color: #28a745; color: white; border-radius: 3px; text-decoration: none;" class="popup-button" target="_blank">County</a>
        <a href="${record.GIS}" style="font-size: 10px; padding: 4px 6px; background-color: #ffc107; color: black; border-radius: 3px; text-decoration: none;" class="popup-button" target="_blank">GIS</a>
      </div>`;

    marker.bindPopup(popupContent);
    markersLayer.addLayer(marker);
  });
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
