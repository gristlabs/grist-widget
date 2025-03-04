"use strict";

let amap;
let markersLayer; // Global variable to store markers
let originalData; // Store the original GeoJSON data
let currentFilters = {
  propertyTypes: [],
  secondaryTypes: [],
  markerColors: []
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
    center: [44.0, -120.5],  // Center of Oregon
    zoom: 7,  // More zoomed in over Oregon
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
    div.style.padding = '16px';
    div.style.borderRadius = '8px';
    div.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.15)';
    div.style.maxWidth = '280px';
    div.style.maxHeight = '400px';
    div.style.overflowY = 'auto';

    const legendContent = `
      <h4 style="margin: 0 0 8px 0;">Marker Colors</h4>
      <div id="markerColors" style="display: flex; flex-direction: column; gap: 4px;">
        <label style="display: block; padding: 10px; margin: 4px 0; border-radius: 6px; transition: background-color 0.2s; font-size: 14px; cursor: pointer;">
          <input type="checkbox" value="Not Interested/DNC" style="width: 18px; height: 18px; margin-right: 10px; cursor: pointer;"><span style="color: #FF0000;">🔴</span> Not Interested/DNC
        </label>
        <label style="display: block; padding: 10px; margin: 4px 0; border-radius: 6px; transition: background-color 0.2s; font-size: 14px; cursor: pointer;">
          <input type="checkbox" value="IPA" style="width: 18px; height: 18px; margin-right: 10px; cursor: pointer;"><span style="color: #9370DB;">🟣</span> IPA
        </label>
        <label style="display: block; padding: 10px; margin: 4px 0; border-radius: 6px; transition: background-color 0.2s; font-size: 14px; cursor: pointer;">
          <input type="checkbox" value="Eric" style="width: 18px; height: 18px; margin-right: 10px; cursor: pointer;"><span style="color: #FFA500;">🟠</span> Eric
        </label>
        <label style="display: block; padding: 10px; margin: 4px 0; border-radius: 6px; transition: background-color 0.2s; font-size: 14px; cursor: pointer;">
          <input type="checkbox" value="Broker/Eh" style="width: 18px; height: 18px; margin-right: 10px; cursor: pointer;"><span style="color: #808080;">⚪</span> Broker/Eh
        </label>
        <label style="display: block; padding: 10px; margin: 4px 0; border-radius: 6px; transition: background-color 0.2s; font-size: 14px; cursor: pointer;">
          <input type="checkbox" value="Never" style="width: 18px; height: 18px; margin-right: 10px; cursor: pointer;"><span style="color: #ADD8E6;">🔵</span> Never
        </label>
        <label style="display: block; padding: 10px; margin: 4px 0; border-radius: 6px; transition: background-color 0.2s; font-size: 14px; cursor: pointer;">
          <input type="checkbox" value="Call Relationship" style="width: 18px; height: 18px; margin-right: 10px; cursor: pointer;"><span style="color: #FFD700;">🟡</span> Call Relationship
        </label>
        <label style="display: block; padding: 10px; margin: 4px 0; border-radius: 6px; transition: background-color 0.2s; font-size: 14px; cursor: pointer;">
          <input type="checkbox" value="Contact" style="width: 18px; height: 18px; margin-right: 10px; cursor: pointer;"><span style="color: #90EE90;">🟢</span> Contact
        </label>
        <label style="display: block; padding: 10px; margin: 4px 0; border-radius: 6px; transition: background-color 0.2s; font-size: 14px; cursor: pointer;">
          <input type="checkbox" value="Call Again" style="width: 18px; height: 18px; margin-right: 10px; cursor: pointer;"><span style="color: #90EE90;">🟢</span> Call Again
        </label>
      </div>
      <hr style="margin: 10px 0;">
      <button id="clearMarkerFilters" style="width: 100%; padding: 12px; background: #4a90e2; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 500; font-size: 14px; transition: all 0.2s;">
        Clear Marker Filters
      </button>
    `;
    div.innerHTML = legendContent;
    
    // Add event listeners for marker color checkboxes
    const markerColorsContainer = div.querySelector('#markerColors');
    const clearMarkerFiltersBtn = div.querySelector('#clearMarkerFilters');
    
    markerColorsContainer.querySelectorAll('label').forEach(label => {
      label.addEventListener('mouseover', () => {
        label.style.backgroundColor = '#f0f9ff';
      });
      label.addEventListener('mouseout', () => {
        label.style.backgroundColor = 'transparent';
      });
    });

    markerColorsContainer.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
      checkbox.addEventListener('change', function() {
        if (this.checked) {
          currentFilters.markerColors.push(this.value);
        } else {
          currentFilters.markerColors = currentFilters.markerColors.filter(c => c !== this.value);
        }
        updateMap(originalData);
      });
    });
    
    clearMarkerFiltersBtn.addEventListener('click', function() {
      currentFilters.markerColors = [];
      markerColorsContainer.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = false);
      updateMap(originalData);
    });
    
    return div;
  };
  legend.addTo(amap);

  // Add legend toggle button
  const legendToggle = L.control({ position: 'bottomleft' });
  legendToggle.onAdd = function() {
    const button = L.DomUtil.create('button', 'legend-toggle');
    button.innerHTML = '🎨';
    button.style.padding = '12px';
    button.style.cursor = 'pointer';
    button.style.backgroundColor = 'white';
    button.style.border = 'none';
    button.style.borderRadius = '8px';
    button.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.15)';
    button.style.fontSize = '24px';
    button.style.marginBottom = '10px';
    button.style.width = '48px';
    button.style.height = '48px';
    button.style.display = 'flex';
    button.style.alignItems = 'center';
    button.style.justifyContent = 'center';
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
  searchDiv.style.margin = '10px';
  
  // Create toggle button - this is the only button visible initially
  const toggleButton = L.DomUtil.create('button', 'toggle-search-button', searchDiv);
  toggleButton.innerHTML = '🔍';
  toggleButton.style.padding = '10px';
  toggleButton.style.cursor = 'pointer';
  toggleButton.style.backgroundColor = 'rgba(255, 255, 255, 0.5)';
  toggleButton.style.border = 'none';
  toggleButton.style.borderRadius = '8px';
  toggleButton.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.15)';
  toggleButton.style.fontSize = '18px';
  toggleButton.style.width = '36px';
  toggleButton.style.height = '36px';
  toggleButton.style.display = 'flex';
  toggleButton.style.alignItems = 'center';
  toggleButton.style.justifyContent = 'center';
  toggleButton.title = 'Search';
  
  // Create the search container (initially hidden)
  const searchContainer = L.DomUtil.create('div', 'search-container', searchDiv);
  searchContainer.style.display = 'none';
  searchContainer.style.alignItems = 'center';
  searchContainer.style.padding = '4px';
  searchContainer.style.borderRadius = '8px';
  searchContainer.style.backgroundColor = 'white';
  searchContainer.style.boxShadow = '0 2px 6px rgba(0, 0, 0, 0.2)';
  searchContainer.style.minWidth = '300px';

  // Create and style search input
  const searchInput = L.DomUtil.create('input', 'search-input', searchContainer);
  searchInput.type = 'text';
  searchInput.placeholder = 'Search address...';
  searchInput.style.fontSize = '16px';
  searchInput.style.padding = '12px 16px';
  searchInput.style.width = '100%';
  searchInput.style.border = 'none';
  searchInput.style.borderRadius = '4px';
  searchInput.style.backgroundColor = '#f5f5f5';
  searchInput.style.transition = 'all 0.3s ease';

  // Create button container for search and close buttons
  const buttonContainer = L.DomUtil.create('div', 'button-container', searchContainer);
  buttonContainer.style.display = 'flex';
  buttonContainer.style.marginLeft = '4px';

  // Create search button
  const searchButton = L.DomUtil.create('button', 'search-button', buttonContainer);
  searchButton.innerHTML = '🔍';
  searchButton.style.width = '36px';
  searchButton.style.height = '36px';
  searchButton.style.padding = '8px';
  searchButton.style.fontSize = '16px';
  searchButton.style.borderRadius = '4px';
  searchButton.style.backgroundColor = 'transparent';
  searchButton.style.color = '#64748b';
  searchButton.style.border = 'none';
  searchButton.style.cursor = 'pointer';
  searchButton.style.display = 'flex';
  searchButton.style.alignItems = 'center';
  searchButton.style.justifyContent = 'center';
  
  // Add close button
  const closeButton = L.DomUtil.create('button', 'close-search-button', buttonContainer);
  closeButton.innerHTML = '✖';
  closeButton.style.width = '36px';
  closeButton.style.height = '36px';
  closeButton.style.padding = '8px';
  closeButton.style.fontSize = '16px';
  closeButton.style.borderRadius = '4px';
  closeButton.style.backgroundColor = 'transparent';
  closeButton.style.color = '#64748b';
  closeButton.style.border = 'none';
  closeButton.style.cursor = 'pointer';
  closeButton.style.display = 'flex';
  closeButton.style.alignItems = 'center';
  closeButton.style.justifyContent = 'center';
  
  // Toggle search container visibility
  L.DomEvent.on(toggleButton, 'click', function() {
    if (searchContainer.style.display === 'none') {
      searchContainer.style.display = 'flex';
      searchContainer.style.opacity = '0';
      setTimeout(() => {
        searchContainer.style.opacity = '1';
      }, 50);
      toggleButton.style.display = 'none';
      searchInput.focus();
    }
  });
  
  L.DomEvent.on(closeButton, 'click', function() {
    searchContainer.style.display = 'none';
    toggleButton.style.display = 'block';
  });
  
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
  
  // Prevent map clicks from propagating through the control
  L.DomEvent.disableClickPropagation(searchDiv);
  
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
  const propertyTypesControl = L.control({ position: 'bottomleft' });
  propertyTypesControl.onAdd = function() {
    const div = L.DomUtil.create('div', 'filter-container');
    div.style.display = 'none';
    div.style.backgroundColor = 'white';
    div.style.padding = '16px';
    div.style.borderRadius = '8px';
    div.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.15)';
    div.style.maxWidth = '280px';
    div.style.maxHeight = '400px';
    div.style.overflowY = 'auto';
    div.style.marginBottom = '12px';
    div.style.zIndex = '1000';
    
    div.innerHTML = `
      <h4 style="margin: 0 0 8px 0;">Property Types</h4>
      <div id="propertyTypes" style="display: flex; flex-direction: column; gap: 4px;">
      </div>
      <hr style="margin: 10px 0;">
      <button id="clearPropertyFilters" style="width: 100%; padding: 12px; background: #4a90e2; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 500; font-size: 14px; transition: all 0.2s;">
        Clear Property Filters
      </button>
    `;
    
    div.id = 'propertyTypesContainer';
    L.DomEvent.disableClickPropagation(div);
    return div;
  };
  
  // Create Secondary Types filter container
  const secondaryTypesControl = L.control({ position: 'bottomleft' });
  secondaryTypesControl.onAdd = function() {
    const div = L.DomUtil.create('div', 'filter-container');
    div.style.display = 'none';
    div.style.backgroundColor = 'white';
    div.style.padding = '16px';
    div.style.borderRadius = '8px';
    div.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.15)';
    div.style.maxWidth = '280px';
    div.style.maxHeight = '400px';
    div.style.overflowY = 'auto';
    div.style.marginBottom = '12px';
    div.style.zIndex = '1000';
    
    div.innerHTML = `
      <h4 style="margin: 0 0 8px 0;">Secondary Types</h4>
      <div id="secondaryTypes" style="display: flex; flex-direction: column; gap: 4px;">
      </div>
      <hr style="margin: 10px 0;">
      <button id="clearSecondaryFilters" style="width: 100%; padding: 12px; background: #4a90e2; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 500; font-size: 14px; transition: all 0.2s;">
        Clear Secondary Filters
      </button>
    `;
    
    div.id = 'secondaryTypesContainer';
    L.DomEvent.disableClickPropagation(div);
    return div;
  };
  
  // Create Property Types toggle button
  const propertyToggle = L.control({ position: 'bottomleft' });
  propertyToggle.onAdd = function() {
    const button = L.DomUtil.create('button', 'filter-toggle');
    button.innerHTML = '🏢';
    button.style.padding = '12px';
    button.style.cursor = 'pointer';
    button.style.backgroundColor = 'white';
    button.style.border = 'none';
    button.style.borderRadius = '8px';
    button.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.15)';
    button.style.fontSize = '24px';
    button.style.marginBottom = '10px';
    button.style.width = '48px';
    button.style.height = '48px';
    button.style.display = 'flex';
    button.style.alignItems = 'center';
    button.style.justifyContent = 'center';
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
  const secondaryToggle = L.control({ position: 'bottomleft' });
  secondaryToggle.onAdd = function() {
    const button = L.DomUtil.create('button', 'filter-toggle');
    button.innerHTML = '🏗️';
    button.style.padding = '12px';
    button.style.cursor = 'pointer';
    button.style.backgroundColor = 'white';
    button.style.border = 'none';
    button.style.borderRadius = '8px';
    button.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.15)';
    button.style.fontSize = '24px';
    button.style.marginBottom = '10px';
    button.style.width = '48px';
    button.style.height = '48px';
    button.style.display = 'flex';
    button.style.alignItems = 'center';
    button.style.justifyContent = 'center';
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
    label.style.padding = '10px';
    label.style.margin = '4px 0';
    label.style.borderRadius = '6px';
    label.style.transition = 'background-color 0.2s';
    label.style.fontSize = '14px';
    
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.value = type;
    checkbox.style.marginRight = '10px';
    checkbox.style.width = '18px';
    checkbox.style.height = '18px';
    checkbox.style.cursor = 'pointer';
    
    label.appendChild(checkbox);
    label.appendChild(document.createTextNode(type));
    propertyTypesContainer.appendChild(label);

    label.addEventListener('mouseover', () => {
      label.style.backgroundColor = '#f0f9ff';
    });
    
    label.addEventListener('mouseout', () => {
      label.style.backgroundColor = 'transparent';
    });

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
    label.style.padding = '10px';
    label.style.margin = '4px 0';
    label.style.borderRadius = '6px';
    label.style.transition = 'background-color 0.2s';
    label.style.fontSize = '14px';
    
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.value = type;
    checkbox.style.marginRight = '10px';
    checkbox.style.width = '18px';
    checkbox.style.height = '18px';
    checkbox.style.cursor = 'pointer';
    
    label.appendChild(checkbox);
    label.appendChild(document.createTextNode(type));
    secondaryTypesContainer.appendChild(label);

    label.addEventListener('mouseover', () => {
      label.style.backgroundColor = '#f0f9ff';
    });
    
    label.addEventListener('mouseout', () => {
      label.style.backgroundColor = 'transparent';
    });

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
  }

  // Initialize markers layer if not exists
  if (!markersLayer) {
    markersLayer = L.markerClusterGroup();
    amap.addLayer(markersLayer);
    
    // Add the filter controls
    const filterControls = createFilterControl();
    filterControls.propertyTypesControl.addTo(amap);
    filterControls.secondaryTypesControl.addTo(amap);
    filterControls.propertyToggle.addTo(amap);
    filterControls.secondaryToggle.addTo(amap);
    
    updateFilters();
  }

  // Clear existing markers if markersLayer exists
  if (markersLayer) {
    markersLayer.clearLayers();
  } else {
    // Initialize markersLayer if it doesn't exist
    markersLayer = L.markerClusterGroup();
    amap.addLayer(markersLayer);
  }

  const filteredFeatures = data.features.filter(feature => {
    const matchPropertyType = currentFilters.propertyTypes.length === 0 || 
      currentFilters.propertyTypes.includes(feature.properties["Property Type"]);
    const matchSecondaryType = currentFilters.secondaryTypes.length === 0 || 
      currentFilters.secondaryTypes.includes(feature.properties["Secondary Type"]);
    const matchMarkerColor = currentFilters.markerColors.length === 0 ||
      currentFilters.markerColors.includes(feature.properties["Classify Color"]);
    return matchPropertyType && matchSecondaryType && matchMarkerColor;
  });

  filteredFeatures.forEach(feature => {
    const record = feature.properties;
    const coordinates = feature.geometry.coordinates;

    const marker = L.marker([coordinates[1], coordinates[0]], {
      title: record.Name,
      icon: getMarkerIcon(record["Classify Color"])
    });

    const popupContent = `
      <div class="card w-full bg-white p-0 m-0">
        <figure class="relative m-0" onmouseover="showActionButtons(this)" onmouseout="hideActionButtons(this)">
          ${record["Pop-up IMG"] ? `
            <img src="${record["Pop-up IMG"]}" alt="${record.Name}" class="w-full h-33 object-cover"/>
          ` : `
            <div class="w-full h-33 bg-gray-100 flex items-center justify-center">
              <span class="text-gray-400">No Image Available</span>
            </div>
          `}
          <div class="action-buttons" style="position: absolute; bottom: 0; right: 10px; display: none;">
            <div class="button-container" style="display: flex; gap: 8px;">
              <a href="${record["County Prop Search"] || '#'}" class="action-btn" title="County Property Search" target="_blank" style="background: none; color: white; font-size: 18px; display: flex; align-items: center; justify-content: center; width: 32px; height: 32px; border-radius: 50%; text-decoration: none; transition: all 0.2s;">🔍</a>
              <a href="${record.GIS || '#'}" class="action-btn" title="GIS" target="_blank" style="background: none; color: white; font-size: 18px; display: flex; align-items: center; justify-content: center; width: 32px; height: 32px; border-radius: 50%; text-decoration: none; transition: all 0.2s;">🌎</a>
              <button class="action-btn" onclick="copyToClipboard(this)" data-copy="${record["Address Concatenate"]}" title="Copy Address" style="background: none; color: white; font-size: 18px; display: flex; align-items: center; justify-content: center; width: 32px; height: 32px; border-radius: 50%; border: none; cursor: pointer; padding: 0; transition: all 0.2s;">📋</button>
              <a href="https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${coordinates[1]},${coordinates[0]}" class="action-btn" title="Street View" target="_blank" style="background: none; color: white; font-size: 18px; display: flex; align-items: center; justify-content: center; width: 32px; height: 32px; border-radius: 50%; text-decoration: none; transition: all 0.2s;">🛣️</a>
              <a href="${record["CoStar URL"] || '#'}" class="action-btn" title="CoStar" target="_blank" style="background: none; color: white; font-size: 18px; display: flex; align-items: center; justify-content: center; width: 32px; height: 32px; border-radius: 50%; text-decoration: none; transition: all 0.2s;">🏢</a>
            </div>
          </div>
        </figure>
        <div class="card-content">
          <h2 onclick="toggleDetails(this)">${record.Name}</h2>
          <div class="details hidden">
            <p><strong>Address:</strong> <span class="copyable" onclick="copyToClipboard(this)">${record["Address Concatenate"]}</span></p>
            <p><strong>Property ID:</strong> <span class="copyable" onclick="copyToClipboard(this)">${record["Property Id"]}</span></p>
            <div class="ownership-info">
              ${record["Segment"] ? `<p><strong>Segment:</strong> ${record["Segment"]}</p>` : ''}
              ${record["Date"] ? `<p><strong>Date:</strong> ${record["Date"]}</p>` : ''}
              ${record["Last Call Segment"] ? `<p><strong>Last Call Segment:</strong> ${record["Last Call Segment"]}</p>` : ''}
            </div>
          </div>
        </div>
      </div>
    `;

    marker.bindPopup(popupContent, {
      maxWidth: 350,
      minWidth: 350,
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
    tooltip.style.position = 'absolute';
    tooltip.style.backgroundColor = '#4a90e2';
    tooltip.style.color = 'white';
    tooltip.style.padding = '5px 10px';
    tooltip.style.borderRadius = '4px';
    tooltip.style.fontSize = '14px';
    tooltip.style.zIndex = '1000';
    tooltip.style.top = '-30px';
    tooltip.style.left = '50%';
    tooltip.style.transform = 'translateX(-50%)';
    tooltip.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
    
    // Make sure the element has position relative for absolute positioning of tooltip
    if (window.getComputedStyle(element).position === 'static') {
      element.style.position = 'relative';
    }
    
    element.appendChild(tooltip);
    
    // Add a subtle highlight effect to the copied element
    const originalBackground = element.style.backgroundColor;
    const originalTransition = element.style.transition;
    element.style.transition = 'background-color 0.3s ease';
    element.style.backgroundColor = '#e6f7ff';
    
    setTimeout(() => { 
      tooltip.remove();
      element.style.backgroundColor = originalBackground;
      element.style.transition = originalTransition;
    }, 1500);
  });
}

// Function to show action buttons on hover
function showActionButtons(figure) {
  const actionButtons = figure.querySelector('.action-buttons');
  if (actionButtons) {
    actionButtons.style.display = 'block';
  }
}

// Function to hide action buttons when not hovering
function hideActionButtons(figure) {
  const actionButtons = figure.querySelector('.action-buttons');
  if (actionButtons) {
    actionButtons.style.display = 'none';
  }
}

// Initialize map when DOM is loaded
document.addEventListener("DOMContentLoaded", function () {
  fetchGeoJSON(geoJSONUrl, function (data) {
    updateMap(data);
  });
});
