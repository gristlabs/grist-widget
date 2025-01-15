"use strict";

let amap;
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
  "OpenStreetMap": L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
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

  // Create a custom toggle button
  const toggleButton = L.DomUtil.create('div', 'leaflet-control-layers-toggle');
  toggleButton.style.cursor = 'pointer';
  toggleButton.style.zIndex = 1000; // Ensure it's above other elements
  toggleButton.style.position = 'absolute'; // Position it absolutely
  toggleButton.style.top = '10px'; // Position from the top
  toggleButton.style.right = '10px'; // Position from the right
  toggleButton.style.backgroundColor = 'white'; // Add a background to make it visible
  toggleButton.style.border = '1px solid #ccc'; // Add a border for better visibility
  toggleButton.style.borderRadius = '4px'; // Rounded corners
  toggleButton.style.padding = '5px'; // Add some padding
  toggleButton.style.boxShadow = '0 1px 5px rgba(0, 0, 0, 0.4)'; // Add a shadow for better visibility
  toggleButton.innerHTML = 'Layers'; // Add text to the button

  // Create a container for the layers control
  const layersContainer = L.DomUtil.create('div', 'leaflet-control-layers-expanded');
  layersContainer.style.display = 'none'; // Hide the expanded control by default
  layersContainer.style.position = 'absolute'; // Position it absolutely
  layersContainer.style.top = '50px'; // Position below the toggle button
  layersContainer.style.right = '10px'; // Position from the right
  layersContainer.style.backgroundColor = 'white'; // Add a background to make it visible
  layersContainer.style.border = '1px solid #ccc'; // Add a border for better visibility
  layersContainer.style.borderRadius = '4px'; // Rounded corners
  layersContainer.style.padding = '10px'; // Add some padding
  layersContainer.style.boxShadow = '0 1px 5px rgba(0, 0, 0, 0.4)'; // Add a shadow for better visibility

  // Add the base layers to the layers container
  for (const [name, layer] of Object.entries(baseLayers)) {
    const label = L.DomUtil.create('label');
    const input = L.DomUtil.create('input', '', label);
    input.type = 'radio';
    input.name = 'baseLayer';
    input.value = name;
    input.onchange = () => {
      amap.eachLayer((l) => {
        if (baseLayers[name] !== l) amap.removeLayer(l);
      });
      amap.addLayer(baseLayers[name]);
    };
    label.appendChild(document.createTextNode(name));
    layersContainer.appendChild(label);
  }

  // Add the toggle button and layers container to the map
  amap.getContainer().appendChild(toggleButton);
  amap.getContainer().appendChild(layersContainer);

  // Toggle the layers container visibility on button click
  L.DomEvent.disableClickPropagation(toggleButton); // Prevent map clicks from interfering
  L.DomEvent.on(toggleButton, 'click', function (e) {
    console.log("Toggle button clicked"); // Debugging: Check if the click event is firing
    L.DomEvent.stopPropagation(e); // Stop the event from bubbling up
    if (layersContainer.style.display === 'none') {
      layersContainer.style.display = 'block';
    } else {
      layersContainer.style.display = 'none';
    }
  });

  // Add the search control
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

  console.log("GeoJSON data loaded:", data); // Debug: Check if data is loaded

  const markers = L.markerClusterGroup();
  data.features.forEach(feature => {
    const record = feature.properties;
    const coordinates = feature.geometry.coordinates;
    console.log("Processing feature:", record.Name, "Coordinates:", coordinates); // Debug: Check each feature

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
    markers.addLayer(marker);
  });

  amap.addLayer(markers);
  console.log("Markers added to map"); // Debug: Confirm markers are added
}

// Load GeoJSON data and update the map
document.addEventListener("DOMContentLoaded", function () {
  initializeMap();

  // Fetch and display combined GeoJSON data
  fetchGeoJSON(geoJSONUrl, function (data) {
    updateMap(data);
  });
});
