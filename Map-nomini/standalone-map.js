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
    center: [45.5283, -122.8081],
    zoom: 4,
    wheelPxPerZoomLevel: 90
  });

  amap.on('load', function () {
    console.log("Map is fully loaded and ready for interaction");
  });

  L.control.layers(baseLayers, overlayLayers, { position: 'topright', collapsed: true }).addTo(amap);

  // Create a search results layer group
  const searchResultsLayer = L.layerGroup().addTo(amap);
  
  // Create a collapsible search control
  const searchDiv = L.DomUtil.create('div', 'custom-search-control leaflet-control');
  searchDiv.style.backgroundColor = 'white';
  searchDiv.style.padding = '5px';
  searchDiv.style.borderRadius = '4px';
  searchDiv.style.boxShadow = '0 1px 5px rgba(0,0,0,0.4)';
  
  // Create the search container (initially hidden)
  const searchContainer = L.DomUtil.create('div', 'search-container', searchDiv);
  searchContainer.style.display = 'none';
  
  const searchInput = L.DomUtil.create('input', 'search-input', searchContainer);
  searchInput.type = 'text';
  searchInput.placeholder = 'Search address...';
  searchInput.style.width = '200px';
  searchInput.style.padding = '5px';
  searchInput.style.border = '1px solid #ccc';
  searchInput.style.borderRadius = '4px';
  
  const searchButton = L.DomUtil.create('button', 'search-button', searchContainer);
  searchButton.innerHTML = '🔍';
  searchButton.style.marginLeft = '5px';
  searchButton.style.padding = '5px 10px';
  searchButton.style.cursor = 'pointer';
  
  // Create toggle button
  const toggleButton = L.DomUtil.create('button', 'toggle-search-button', searchDiv);
  toggleButton.innerHTML = '🔍';
  toggleButton.style.padding = '5px 10px';
  toggleButton.style.cursor = 'pointer';
  toggleButton.title = 'Search';
  
  // Toggle search container visibility
  L.DomEvent.on(toggleButton, 'click', function() {
    if (searchContainer.style.display === 'none') {
      searchContainer.style.display = 'flex';
      toggleButton.style.display = 'none';
      searchInput.focus();
    }
  });
  
  // Add close button
  const closeButton = L.DomUtil.create('button', 'close-search-button', searchContainer);
  closeButton.innerHTML = '✖';
  closeButton.style.marginLeft = '5px';
  closeButton.style.padding = '5px';
  closeButton.style.cursor = 'pointer';
  
  L.DomEvent.on(closeButton, 'click', function() {
    searchContainer.style.display = 'none';
    toggleButton.style.display = 'block';
  });
  
  // Prevent map clicks from propagating through the control
  L.DomEvent.disableClickPropagation(searchDiv);
  
  // Handle search
  L.DomEvent.on(searchButton, 'click', function() {
    const query = searchInput.value;
    if (query.trim() === '') return;
    
    // Clear previous results
    searchResultsLayer.clearLayers();
    
    // Use fetch to get results from Nominatim
    fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`)
      .then(response => response.json())
      .then(data => {
        if (data && data.length > 0) {
          const result = data[0];
          const lat = parseFloat(result.lat);
          const lon = parseFloat(result.lon);
          
          // Add marker for the result
          const marker = L.marker([lat, lon], {
            icon: searchIcon
          }).addTo(searchResultsLayer);
          
          // Extract just the address and city from the display name
          let displayParts = result.display_name.split(',');
          let simplifiedAddress = displayParts.slice(0, 2).join(', ');
          
          // Add popup with simplified address info
          marker.bindPopup(`<b>${simplifiedAddress}</b>`).openPopup();
          
          // Pan to the result
          amap.setView([lat, lon], 16);
          
          // Close the search container after successful search
          searchContainer.style.display = 'none';
          toggleButton.style.display = 'block';
        } else {
          alert('No results found');
        }
      })
      .catch(error => {
        console.error('Search error:', error);
        alert('Error performing search');
      });
  });
  
  // Also search on Enter key
  L.DomEvent.on(searchInput, 'keypress', function(e) {
    if (e.keyCode === 13) {
      L.DomEvent.stop(e);
      searchButton.click();
    }
  });
  
  // Add the custom control to the map
  const searchControl = L.control({ position: 'topleft' });
  searchControl.onAdd = function() {
    return searchDiv;
  };
  searchControl.addTo(amap);

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
