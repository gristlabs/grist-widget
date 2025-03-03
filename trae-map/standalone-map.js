"use strict";

let amap;
let markersLayer; // Global variable to store markers
let originalData; // Store the original GeoJSON data
let currentFilters = {
  propertyTypes: [],
  secondaryTypes: []
};
const geoJSONUrl = "https://raw.githubusercontent.com/sgfroerer/gmaps-grist-widgets/master/geojson/March.geojson";

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

// Define color-coded icons for different classifications
const classifyIcons = {
  "Not Interested/DNC": new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  }),
  "IPA": new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-violet.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  }),
  "Eric": new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-orange.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  }),
  "Broker/Eh": new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-grey.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  }),
  "Never": new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  }),
  "Call Relationship": new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-yellow.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  }),
  "Contact": new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  }),
  "Call Again": new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  })
};

// Helper function to get the appropriate icon based on classification
function getMarkerIcon(classification) {
  return classifyIcons[classification] || defaultIcon;
}

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

  // Add legend control
  const legend = L.control({ position: 'bottomleft' });
  legend.onAdd = function() {
    const div = L.DomUtil.create('div', 'legend');
    div.style.display = 'none';
    div.style.backgroundColor = 'white';
    div.style.padding = '10px';
    div.style.borderRadius = '4px';
    div.style.boxShadow = '0 1px 5px rgba(0,0,0,0.4)';
    div.style.maxWidth = '200px';

    const legendContent = `
      <h4 style="margin: 0 0 8px 0;">Marker Colors</h4>
      <div style="display: flex; flex-direction: column; gap: 4px;">
        <div><span style="color: #FF0000;">🔴</span> Not Interested/DNC</div>
        <div><span style="color: #9370DB;">🟣</span> IPA</div>
        <div><span style="color: #FFA500;">🟠</span> Eric</div>
        <div><span style="color: #808080;">⚪</span> Broker/Eh</div>
        <div><span style="color: #ADD8E6;">🔵</span> Never</div>
        <div><span style="color: #FFD700;">🔵</span> Call Relationship</div>
        <div><span style="color: #90EE90;">🟢</span> Contact</div>
        <div><span style="color: #90EE90;">🟢</span> Call Again</div>
      </div>
    `;
    div.innerHTML = legendContent;
    return div;
  };
  legend.addTo(amap);

  // Add legend toggle button
  const legendToggle = L.control({ position: 'bottomleft' });
  legendToggle.onAdd = function() {
    const button = L.DomUtil.create('button', 'legend-toggle');
    button.innerHTML = '🎨';
    button.style.padding = '8px';
    button.style.cursor = 'pointer';
    button.style.backgroundColor = 'white';
    button.style.border = 'none';
    button.style.borderRadius = '4px';
    button.style.boxShadow = '0 1px 5px rgba(0,0,0,0.4)';
    button.style.fontSize = '20px';
    button.title = 'Toggle Legend';

    button.onclick = function() {
      const legendDiv = document.querySelector('.legend');
      if (legendDiv) {
        legendDiv.style.display = legendDiv.style.display === 'none' ? 'block' : 'none';
      }
    };

    return button;
  };
  legendToggle.addTo(amap);

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
function createFilterControl() {
  // Create Property Types filter container
  const propertyTypesControl = L.control({ position: 'topright' });
  propertyTypesControl.onAdd = function() {
    const div = L.DomUtil.create('div', 'filter-container');
    div.style.display = 'none';
    div.style.backgroundColor = 'white';
    div.style.padding = '10px';
    div.style.borderRadius = '4px';
    div.style.boxShadow = '0 1px 5px rgba(0,0,0,0.4)';
    div.style.maxWidth = '250px';
    div.style.maxHeight = '300px';
    div.style.overflowY = 'auto';
    div.style.marginBottom = '10px';
    div.style.zIndex = '1000';
    
    div.innerHTML = `
      <h4 style="margin: 0 0 8px 0;">Property Types</h4>
      <div id="propertyTypes" style="display: flex; flex-direction: column; gap: 4px;">
      </div>
      <hr style="margin: 10px 0;">
      <button id="clearPropertyFilters" style="width: 100%; padding: 6px; background: #f5f5f5; border: 1px solid #ddd; border-radius: 4px; cursor: pointer; font-weight: 500; transition: all 0.2s;">
        Clear Property Filters
      </button>
    `;
    
    div.id = 'propertyTypesContainer';
    L.DomEvent.disableClickPropagation(div);
    return div;
  };
  
  // Create Secondary Types filter container
  const secondaryTypesControl = L.control({ position: 'topright' });
  secondaryTypesControl.onAdd = function() {
    const div = L.DomUtil.create('div', 'filter-container');
    div.style.display = 'none';
    div.style.backgroundColor = 'white';
    div.style.padding = '10px';
    div.style.borderRadius = '4px';
    div.style.boxShadow = '0 1px 5px rgba(0,0,0,0.4)';
    div.style.maxWidth = '250px';
    div.style.maxHeight = '300px';
    div.style.overflowY = 'auto';
    div.style.marginBottom = '10px';
    div.style.zIndex = '1000';
    
    div.innerHTML = `
      <h4 style="margin: 0 0 8px 0;">Secondary Types</h4>
      <div id="secondaryTypes" style="display: flex; flex-direction: column; gap: 4px;">
      </div>
      <hr style="margin: 10px 0;">
      <button id="clearSecondaryFilters" style="width: 100%; padding: 6px; background: #f5f5f5; border: 1px solid #ddd; border-radius: 4px; cursor: pointer; font-weight: 500; transition: all 0.2s;">
        Clear Secondary Filters
      </button>
    `;
    
    div.id = 'secondaryTypesContainer';
    L.DomEvent.disableClickPropagation(div);
    return div;
  };
  
  // Create Property Types toggle button
  const propertyToggle = L.control({ position: 'topright' });
  propertyToggle.onAdd = function() {
    const button = L.DomUtil.create('button', 'filter-toggle');
    button.innerHTML = '🏢';
    button.style.padding = '8px';
    button.style.cursor = 'pointer';
    button.style.backgroundColor = 'white';
    button.style.border = 'none';
    button.style.borderRadius = '4px';
    button.style.boxShadow = '0 1px 5px rgba(0,0,0,0.4)';
    button.style.fontSize = '20px';
    button.style.marginBottom = '5px';
    button.title = 'Toggle Property Types Filter';

    button.onclick = function() {
      const filterDiv = document.getElementById('propertyTypesContainer');
      if (filterDiv) {
        filterDiv.style.display = filterDiv.style.display === 'none' ? 'block' : 'none';
        // Hide the other filter if this one is shown
        if (filterDiv.style.display === 'block') {
          const otherFilterDiv = document.getElementById('secondaryTypesContainer');
          if (otherFilterDiv) {
            otherFilterDiv.style.display = 'none';
          }
        }
      }
    };

    return button;
  };
  
  // Create Secondary Types toggle button
  const secondaryToggle = L.control({ position: 'topright' });
  secondaryToggle.onAdd = function() {
    const button = L.DomUtil.create('button', 'filter-toggle');
    button.innerHTML = '🏗️';
    button.style.padding = '8px';
    button.style.cursor = 'pointer';
    button.style.backgroundColor = 'white';
    button.style.border = 'none';
    button.style.borderRadius = '4px';
    button.style.boxShadow = '0 1px 5px rgba(0,0,0,0.4)';
    button.style.fontSize = '20px';
    button.title = 'Toggle Secondary Types Filter';

    button.onclick = function() {
      const filterDiv = document.getElementById('secondaryTypesContainer');
      if (filterDiv) {
        filterDiv.style.display = filterDiv.style.display === 'none' ? 'block' : 'none';
        // Hide the other filter if this one is shown
        if (filterDiv.style.display === 'block') {
          const otherFilterDiv = document.getElementById('propertyTypesContainer');
          if (otherFilterDiv) {
            otherFilterDiv.style.display = 'none';
          }
        }
      }
    };

    return button;
  };
  
  // Return all controls as an object
  return {
    propertyTypesControl,
    secondaryTypesControl,
    propertyToggle,
    secondaryToggle
  };
}

function updateFilters() {
  const propertyTypes = new Set();
  const secondaryTypes = new Set();

  originalData.features.forEach(feature => {
    if (feature.properties["Property Type"]) {
      propertyTypes.add(feature.properties["Property Type"]);
    }
    if (feature.properties["Secondary Type"]) {
      secondaryTypes.add(feature.properties["Secondary Type"]);
    }
  });

  const propertyTypesContainer = document.getElementById('propertyTypes');
  const secondaryTypesContainer = document.getElementById('secondaryTypes');
  const clearPropertyFiltersBtn = document.getElementById('clearPropertyFilters');
  const clearSecondaryFiltersBtn = document.getElementById('clearSecondaryFilters');

  propertyTypesContainer.innerHTML = '';
  secondaryTypesContainer.innerHTML = '';

  propertyTypes.forEach(type => {
    const label = document.createElement('label');
    label.style.display = 'block';
    label.style.marginBottom = '8px';
    label.style.cursor = 'pointer';
    
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.value = type;
    checkbox.style.marginRight = '8px';
    
    label.appendChild(checkbox);
    label.appendChild(document.createTextNode(type));
    propertyTypesContainer.appendChild(label);

    checkbox.addEventListener('change', function() {
      if (this.checked) {
        currentFilters.propertyTypes.push(this.value);
      } else {
        currentFilters.propertyTypes = currentFilters.propertyTypes.filter(t => t !== this.value);
      }
      updateMap(originalData);
    });
  });

  secondaryTypes.forEach(type => {
    const label = document.createElement('label');
    label.style.display = 'block';
    label.style.marginBottom = '8px';
    label.style.cursor = 'pointer';
    
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.value = type;
    checkbox.style.marginRight = '8px';
    
    label.appendChild(checkbox);
    label.appendChild(document.createTextNode(type));
    secondaryTypesContainer.appendChild(label);

    checkbox.addEventListener('change', function() {
      if (this.checked) {
        currentFilters.secondaryTypes.push(this.value);
      } else {
        currentFilters.secondaryTypes = currentFilters.secondaryTypes.filter(t => t !== this.value);
      }
      updateMap(originalData);
    });
  });

  // Add event listeners to clear filter buttons
  clearPropertyFiltersBtn.addEventListener('click', function() {
    currentFilters.propertyTypes = [];
    propertyTypesContainer.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = false);
    updateMap(originalData);
  });
  
  clearSecondaryFiltersBtn.addEventListener('click', function() {
    currentFilters.secondaryTypes = [];
    secondaryTypesContainer.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = false);
    updateMap(originalData);
  });
}

function updateMap(data) {
  if (!originalData) {
    originalData = data;
  }

  if (!amap) {
    amap = initializeMap();
    
    // Add the new filter controls
    const filterControls = createFilterControl();
    filterControls.propertyTypesControl.addTo(amap);
    filterControls.secondaryTypesControl.addTo(amap);
    filterControls.propertyToggle.addTo(amap);
    filterControls.secondaryToggle.addTo(amap);
    
    updateFilters();
  }

  if (!markersLayer) {
    markersLayer = L.markerClusterGroup();
    amap.addLayer(markersLayer);
  }

  markersLayer.clearLayers();

  const filteredFeatures = data.features.filter(feature => {
    const matchPropertyType = currentFilters.propertyTypes.length === 0 || 
      currentFilters.propertyTypes.includes(feature.properties["Property Type"]);
    const matchSecondaryType = currentFilters.secondaryTypes.length === 0 || 
      currentFilters.secondaryTypes.includes(feature.properties["Secondary Type"]);
    return matchPropertyType && matchSecondaryType;
  });

  filteredFeatures.forEach(feature => {
    const record = feature.properties;
    const coordinates = feature.geometry.coordinates;

    const marker = L.marker([coordinates[1], coordinates[0]], {
      title: record.Name,
      icon: getMarkerIcon(record["Classify Color"])
    });

    const popupContent = `
      <div class="card">
        ${record["Pop-up IMG"] ? `
          <figure>
            <img src="${record["Pop-up IMG"]}" alt="${record.Name}"/>
            <div class="action-buttons">
              <div class="button-container">
                <a href="${record["County Prop Search"] || '#'}" class="action-btn" title="County Property Search" target="_blank">🔍</a>
                <a href="${record.GIS || '#'}" class="action-btn" title="GIS" target="_blank">🌎</a>
                <button class="action-btn" onclick="copyToClipboard(this)" data-copy="${record.Name}" title="Copy Owner Name">📋</button>
                <a href="https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${coordinates[1]},${coordinates[0]}" class="action-btn" title="Street View" target="_blank">🛣️</a>
                <a href="${record["CoStar URL"] || '#'}" class="action-btn" title="CoStar" target="_blank">🏢</a>
              </div>
            </div>
          </figure>
        ` : ''}
        <div class="card-content">
          <h2 onclick="toggleDetails(this)">${record.Name}</h2>
          <div class="details hidden">
            ${record["Segment"] ? `<p><strong>Segment:</strong> <span>${record["Segment"]}</span></p>` : ''}
            ${record["Date"] ? `<p><strong>Date:</strong> <span>${record["Date"]}</span></p>` : ''}
            ${record["Last Call Segment"] ? `<p><strong>Last:</strong> <span>${record["Last Call Segment"]}</span></p>` : ''}
            ${record["Address Concatenate"] ? `
            <hr>
            <p><strong>Address:</strong> <span class="copyable" onclick="copyToClipboard(this)">${record["Address Concatenate"]}</span></p>
            ` : ''}
            ${record["Property Id"] ? `
            <p><strong>Property ID:</strong> <span class="copyable" onclick="copyToClipboard(this)">${record["Property Id"]}</span></p>
            ` : ''}
          </div>
        </div>
      </div>
    `;

    marker.bindPopup(popupContent, {
      maxWidth: 320,
      minWidth: 320,
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
