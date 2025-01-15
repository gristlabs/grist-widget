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
    center: [45.5283, -122.8081],
    zoom: 4,
    wheelPxPerZoomLevel: 90
  });

  // Create the layers control and add it directly to the map
  L.control.layers(baseLayers, overlayLayers, {
    position: 'topright',
    collapsed: true // Set to true to allow default collapse behavior
  }).addTo(amap);

  // Add the search control
  const searchControl = L.esri.Geocoding.geosearch({
    providers: [L.esri.Geocoding.arcgisOnlineProvider()],
    position: 'topleft',
    useMapBounds: false,
    zoomToResult: true
  }).addTo(amap);

  // Create a separate layer for search results
  const searchResults = L.layerGroup().addTo(amap);

  // Handle search results
  searchControl.on('results', function (data) {
    searchResults.clearLayers();
    if (data.results && data.results.length > 0) {
      // Add markers for search results
      data.results.forEach(result => {
        L.marker(result.latlng).addTo(searchResults);
      });
      
      // Zoom to the first result
      amap.setView(data.results[0].latlng, 16);
    }
  });

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
      ${record["Pop-up IMG"] ? `<img src="${record["Pop-up IMG"]}" alt="Image" style="width: 100%; height: auto; border-radius: 4px; margin-bottom: 6px;" />` : `<p style="margin: 0;">No Image Available</p>`}
      <p style="margin: 4px 0; font-size: 11px;"><strong>Property Address:</strong> ${record["Property Address"]}</p>
      <p style="margin: 4px 0; font-size: 11px;"><strong>City:</strong> ${record.City}</p>
      <p style="margin: 4px 0; font-size: 11px;"><strong>Property Type:</strong> ${record["Property Type"]}</p>
      <p style="margin: 4px 0; font-size: 11px;"><strong>Tenants:</strong> ${record.Tenants}</p>
      <div class="popup-buttons" style="display: flex; gap: 4px; margin-top: 6px;">
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
  initializeMap();

  // Fetch and display GeoJSON data
  fetchGeoJSON(geoJSONUrl, function (data) {
    updateMap(data);
  });
});
