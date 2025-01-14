"use strict";

let amap;
const geoJSONUrl = "https://raw.githubusercontent.com/sgfroerer/gmaps-grist-widgets/master/geojson/Refined.geojson"; // Update with your GeoJSON URL

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
  "Street Map": L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
  }),
  "Satellite": L.tileLayer('https://api.maptiler.com/tiles/satellite-v2/{z}/{x}/{y}.jpg?key=TbsQ5qLxJHC20Jv4Th7E', {
    attribution: '&copy; MapTiler Satellite'
  }),
  "Google Hybrid": L.tileLayer('http://mt0.google.com/vt/lyrs=y&hl=en&x={x}&y={y}&z={z}', {
    attribution: '&copy; Google Hybrid'
  })
};

const overlayLayers = {};

function initializeMap() {
  amap = L.map('map', {
    layers: [baseLayers["Street Map"]],
    center: [45.5283, -122.8081], // Default center (USA)
    zoom: 4, // Default zoom level
    wheelPxPerZoomLevel: 90
  });

  L.control.layers(baseLayers, overlayLayers, { position: 'topright', collapsed: false }).addTo(amap);

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

  const markers = L.markerClusterGroup();
  data.features.forEach(feature => {
    const record = feature.properties;
    const marker = L.marker([record.geometry.coordinates[1], record.geometry.coordinates[0]], {
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
    markers.addLayer(marker);
  });

  amap.addLayer(markers);
}

// Load GeoJSON data and update the map
document.addEventListener("DOMContentLoaded", function () {
  initializeMap();

  // Fetch and display combined GeoJSON data
  fetchGeoJSON(geoJSONUrl, function (data) {
    updateMap(data);
  });
});
