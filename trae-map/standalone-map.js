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

const overlayLayers = {};

function initializeMap() {
  // Define base layers with appropriate maxZoom values
  const baseLayers = {
    "Google Hybrid": L.tileLayer('https://{s}.google.com/vt/lyrs=s,h&x={x}&y={y}&z={z}', {
      maxZoom: 20,
      subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
      attribution: '&copy; Google Maps'
    }),
    "Google Streets": L.tileLayer('https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
      maxZoom: 20,
      subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
      attribution: '&copy; Google Maps'
    }),
    "Google Terrain": L.tileLayer('https://{s}.google.com/vt/lyrs=p&x={x}&y={y}&z={z}', {
      maxZoom: 20,
      subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
      attribution: '&copy; Google Maps'
    }),
    "Google Satellite": L.tileLayer('https://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}', {
      maxZoom: 20,
      subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
      attribution: '&copy; Google Maps'
    }),
    "OpenStreetMap": L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    })
  };

  // Define overlay layers
  const overlayLayers = {};

  amap = L.map('map', {
    layers: [baseLayers["Google Hybrid"]],
    center: [44.0, -120.5],  // Center of Oregon
    zoom: 7,  // More zoomed in over Oregon
    wheelPxPerZoomLevel: 90,
    maxZoom: 20,  // Limit maximum zoom to what the base layers support
    zoomSnap: 0.5,  // Allow smoother zooming
    zoomDelta: 0.5  // Smaller zoom increments
  });

  // Add zoom warning event
  amap.on('zoomend', function() {
    const currentZoom = amap.getZoom();
    const maxSupportedZoom = 20;
    
    if (currentZoom > maxSupportedZoom) {
      console.warn(`Current zoom level (${currentZoom}) exceeds maximum supported level (${maxSupportedZoom})`);
    }
  });

  amap.on('load', function () {
    console.log("Map is fully loaded and ready for interaction");
  });

  L.control.layers(baseLayers, overlayLayers, { position: 'topright', collapsed: true }).addTo(amap);

  // Add legend control
  const legend = L.control({ position: 'bottomleft' });
  legend.onAdd = function() {
    const div = L.DomUtil.create('div', 'legend');
    div.style.display = 'block';
    div.style.backgroundColor = 'white';
    div.style.padding = '16px';
    div.style.borderRadius = '8px';
    div.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.15)';
    div.style.maxWidth = '280px';
    div.style.maxHeight = '400px';
    div.style.overflowY = 'auto';

    const legendContent = `
      <h4 style="margin: 0 0 8px 0;">Map Legend</h4>
      <div style="display: flex; flex-direction: column; gap: 8px;">
        <div style="display: flex; align-items: center; gap: 8px;">
          <div style="width: 20px; height: 20px; background-color: red; border-radius: 50%;"></div>
          <span>Not Interested/DNC</span>
        </div>
        <div style="display: flex; align-items: center; gap: 8px;">
          <div style="width: 20px; height: 20px; background-color: violet; border-radius: 50%;"></div>
          <span>IPA</span>
        </div>
        <div style="display: flex; align-items: center; gap: 8px;">
          <div style="width: 20px; height: 20px; background-color: orange; border-radius: 50%;"></div>
          <span>Eric</span>
        </div>
        <div style="display: flex; align-items: center; gap: 8px;">
          <div style="width: 20px; height: 20px; background-color: grey; border-radius: 50%;"></div>
          <span>Broker/Eh</span>
        </div>
        <div style="display: flex; align-items: center; gap: 8px;">
          <div style="width: 20px; height: 20px; background-color: blue; border-radius: 50%;"></div>
          <span>Never</span>
        </div>
        <div style="display: flex; align-items: center; gap: 8px;">
          <div style="width: 20px; height: 20px; background-color: yellow; border-radius: 50%;"></div>
          <span>Call Relationship</span>
        </div>
        <div style="display: flex; align-items: center; gap: 8px;">
          <div style="width: 20px; height: 20px; background-color: green; border-radius: 50%;"></div>
          <span>Contact/Call Again</span>
        </div>
      </div>
    `;
    
    div.innerHTML = legendContent;
    return div;
  };
  
  legend.addTo(amap);

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
    // Configure marker cluster group with more granular settings
    markersLayer = L.markerClusterGroup({
      disableClusteringAtZoom: 18, // Disable clustering at high zoom levels
      maxClusterRadius: 40,        // Reduce cluster radius (default is 80)
      spiderfyOnMaxZoom: true,     // Allow markers to spread out when clicked
      zoomToBoundsOnClick: true    // Zoom to bounds when cluster clicked
    });
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

// Add this function after fetchGeoJSON function
function addPropertySearchControl(map) {
  const propertySearchControl = L.control({ position: 'topright' });
  
  propertySearchControl.onAdd = function() {
    const container = L.DomUtil.create('div', 'property-search-control');
    
    // Create toggle button - this is the only button visible initially
    const toggleButton = L.DomUtil.create('button', 'toggle-property-search-button', container);
    toggleButton.innerHTML = '🏢';
    toggleButton.style.padding = '10px';
    toggleButton.style.cursor = 'pointer';
    toggleButton.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
    toggleButton.style.border = 'none';
    toggleButton.style.borderRadius = '8px';
    toggleButton.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)';
    toggleButton.style.fontSize = '18px';
    toggleButton.style.width = '36px';
    toggleButton.style.height = '36px';
    toggleButton.style.display = 'flex';
    toggleButton.style.alignItems = 'center';
    toggleButton.style.justifyContent = 'center';
    toggleButton.title = 'Search Properties';
    
    // Create the search container (initially hidden)
    const searchContainer = L.DomUtil.create('div', 'property-search-container', container);
    searchContainer.style.display = 'none';
    searchContainer.style.backgroundColor = 'white';
    searchContainer.style.padding = '8px';
    searchContainer.style.borderRadius = '4px';
    searchContainer.style.boxShadow = '0 1px 5px rgba(0,0,0,0.4)';
    searchContainer.style.marginTop = '10px';
    searchContainer.style.width = '280px';
    
    searchContainer.innerHTML = `
      <div style="margin-bottom: 8px; font-weight: bold; font-size: 14px;">Search Properties</div>
      <div style="display: flex; margin-bottom: 8px;">
        <input type="text" id="property-search-input" placeholder="Search by ID or Address..." 
               style="flex-grow: 1; padding: 8px; border: 1px solid #ccc; border-radius: 4px; font-size: 14px;">
        <button id="property-search-button" 
                style="margin-left: 4px; padding: 8px; background: #4a90e2; color: white; border: none; border-radius: 4px; cursor: pointer;">
          🔍
        </button>
      </div>
      <div id="property-search-results" style="max-height: 200px; overflow-y: auto; display: none;">
      </div>
      <button id="close-property-search" 
              style="margin-top: 8px; padding: 6px; background: #f0f0f0; color: #666; border: none; border-radius: 4px; cursor: pointer; width: 100%;">
        Close
      </button>
    `;
    
    L.DomEvent.disableClickPropagation(container);
    L.DomEvent.disableScrollPropagation(container);
    
    return container;
  };
  
  propertySearchControl.addTo(map);
  
  // Add event listeners after the control is added to the map
  setTimeout(() => {
    const toggleButton = document.querySelector('.toggle-property-search-button');
    const searchContainer = document.querySelector('.property-search-container');
    const searchInput = document.getElementById('property-search-input');
    const searchButton = document.getElementById('property-search-button');
    const closeButton = document.getElementById('close-property-search');
    const resultsContainer = document.getElementById('property-search-results');
    
    // Toggle search container visibility
    toggleButton.addEventListener('click', function() {
      if (searchContainer.style.display === 'none') {
        searchContainer.style.display = 'block';
        searchInput.focus();
      } else {
        searchContainer.style.display = 'none';
      }
    });
    
    // Close button functionality
    closeButton.addEventListener('click', function() {
      searchContainer.style.display = 'none';
    });
    
    // Search function
    const searchProperties = () => {
      const query = searchInput.value.toLowerCase().trim();
      if (!query || !originalData) return;
      
      const results = originalData.features.filter(feature => {
        const props = feature.properties;
        // Search in Property ID and Address
        return (props["Property Id"] && props["Property Id"].toString().toLowerCase().includes(query)) ||
               (props["Address Concatenate"] && props["Address Concatenate"].toLowerCase().includes(query)) ||
               (props["Name"] && props["Name"].toLowerCase().includes(query));
      });
      
      displaySearchResults(results, resultsContainer);
    };
    
    // Display search results
    const displaySearchResults = (results, container) => {
      // Rest of the function remains the same
      if (results.length === 0) {
        container.innerHTML = '<div style="padding: 8px; color: #666;">No properties found</div>';
        container.style.display = 'block';
        return;
      }
      
      let html = '';
      results.forEach(feature => {
        const props = feature.properties;
        const coords = feature.geometry.coordinates;
        
        html += `
          <div class="property-result" data-lat="${coords[1]}" data-lng="${coords[0]}" 
               style="padding: 8px; border-bottom: 1px solid #eee; cursor: pointer; transition: background-color 0.2s;">
            <div style="font-weight: bold;">${props.Name || 'Unnamed Property'}</div>
            <div style="font-size: 12px; color: #666;">ID: ${props["Property Id"] || 'N/A'}</div>
            <div style="font-size: 12px; color: #666; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
              ${props["Address Concatenate"] || 'No address'}
            </div>
          </div>
        `;
      });
      
      container.innerHTML = html;
      container.style.display = 'block';
      
      // Add click event to results
      const resultElements = container.querySelectorAll('.property-result');
      resultElements.forEach(el => {
        // Hover effect
        el.addEventListener('mouseover', () => {
          el.style.backgroundColor = '#f0f9ff';
        });
        el.addEventListener('mouseout', () => {
          el.style.backgroundColor = 'transparent';
        });
        
        // Click to zoom to location
        el.addEventListener('click', function() {
          const lat = parseFloat(this.dataset.lat);
          const lng = parseFloat(this.dataset.lng);
          
          // Zoom to the location
          map.setView([lat, lng], 18);
          
          // Find and open the marker's popup
          markersLayer.eachLayer(function(layer) {
            const markerLatLng = layer.getLatLng();
            if (markerLatLng.lat === lat && markerLatLng.lng === lng) {
              layer.openPopup();
            }
          });
          
          // Hide results after selection
          container.style.display = 'none';
          searchContainer.style.display = 'none';
          searchInput.value = '';
        });
      });
    };
    
    // Add event listeners
    searchButton.addEventListener('click', searchProperties);
    searchInput.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') {
        searchProperties();
      }
    });
    
    // Close results when clicking outside
    document.addEventListener('click', function(e) {
      if (!searchContainer.contains(e.target) && !toggleButton.contains(e.target)) {
        resultsContainer.style.display = 'none';
      }
    });
    
  }, 100); // Short delay to ensure DOM elements are available
}

function fetchGeoJSON(url, callback) {
  fetch(url)
    .then(response => response.json())
    .then(data => callback(data))
    .catch(error => console.error("Error fetching GeoJSON:", error));
}
// Add this function after fetchGeoJSON function
function addPropertySearchControl(map) {
  const propertySearchControl = L.control({ position: 'topright' });
  
  propertySearchControl.onAdd = function() {
    const container = L.DomUtil.create('div', 'property-search-control');
    container.style.margin = '10px';
    
    // Create toggle button - this is the only button visible initially
    const toggleButton = L.DomUtil.create('button', 'toggle-property-search-button', container);
    toggleButton.innerHTML = '🏢';
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
    toggleButton.title = 'Search Properties';
    
    // Create the search container (initially hidden)
    const searchContainer = L.DomUtil.create('div', 'property-search-container', container);
    searchContainer.style.display = 'none';
    searchContainer.style.alignItems = 'center';
    searchContainer.style.padding = '4px';
    searchContainer.style.borderRadius = '8px';
    searchContainer.style.backgroundColor = 'white';
    searchContainer.style.boxShadow = '0 2px 6px rgba(0, 0, 0, 0.2)';
    searchContainer.style.minWidth = '300px';
    
    // Create and style search input
    const searchInput = L.DomUtil.create('input', 'property-search-input', searchContainer);
    searchInput.type = 'text';
    searchInput.placeholder = 'Search properties...';
    searchInput.style.fontSize = '16px';
    searchInput.style.padding = '12px 16px';
    searchInput.style.width = '100%';
    searchInput.style.border = 'none';
    searchInput.style.borderRadius = '4px';
    searchInput.style.backgroundColor = '#f5f5f5';
    searchInput.style.transition = 'all 0.3s ease';
    searchInput.id = 'property-search-input';
    
    // Create button container for search and close buttons
    const buttonContainer = L.DomUtil.create('div', 'button-container', searchContainer);
    buttonContainer.style.display = 'flex';
    buttonContainer.style.marginLeft = '4px';
    
    // Create search button
    const searchButton = L.DomUtil.create('button', 'property-search-button', buttonContainer);
    searchButton.innerHTML = '🔍';
    searchButton.style.width = '36px';
    searchButton.style.height = '36px';
    searchButton.style.padding = '8px';
    searchButton.style.fontSize = '16px';
    searchButton.style.borderRadius = '4px';
    searchButton.style.border = 'none';
    searchButton.style.backgroundColor = '#4a90e2';
    searchButton.style.color = 'white';
    searchButton.style.cursor = 'pointer';
    searchButton.style.transition = 'all 0.3s ease';
    searchButton.id = 'property-search-button';
    
    // Create close button
    const closeButton = L.DomUtil.create('button', 'close-property-search', buttonContainer);
    closeButton.innerHTML = '✕';
    closeButton.style.width = '36px';
    closeButton.style.height = '36px';
    closeButton.style.padding = '8px';
    closeButton.style.fontSize = '16px';
    closeButton.style.borderRadius = '4px';
    closeButton.style.border = 'none';
    closeButton.style.backgroundColor = '#f0f0f0';
    closeButton.style.color = '#666';
    closeButton.style.cursor = 'pointer';
    closeButton.style.marginLeft = '4px';
    closeButton.style.transition = 'all 0.3s ease';
    
    // Create results container
    const resultsContainer = L.DomUtil.create('div', 'property-search-results', container);
    resultsContainer.style.display = 'none';
    resultsContainer.style.position = 'absolute';
    resultsContainer.style.top = '100%';
    resultsContainer.style.left = '0';
    resultsContainer.style.right = '0';
    resultsContainer.style.backgroundColor = 'white';
    resultsContainer.style.borderRadius = '4px';
    resultsContainer.style.boxShadow = '0 2px 6px rgba(0, 0, 0, 0.2)';
    resultsContainer.style.maxHeight = '200px';
    resultsContainer.style.overflowY = 'auto';
    resultsContainer.style.zIndex = '1000';
    resultsContainer.style.marginTop = '4px';
    resultsContainer.id = 'property-search-results';
    
    L.DomEvent.disableClickPropagation(container);
    L.DomEvent.disableScrollPropagation(container);
    
    return container;
  };
  
  propertySearchControl.addTo(map);
  
  // Add event listeners after the control is added to the map
  setTimeout(() => {
    const toggleButton = document.querySelector('.toggle-property-search-button');
    const searchContainer = document.querySelector('.property-search-container');
    const searchInput = document.getElementById('property-search-input');
    const searchButton = document.getElementById('property-search-button');
    const closeButton = document.querySelector('.close-property-search');
    const resultsContainer = document.getElementById('property-search-results');
    
    // Toggle search container visibility
    toggleButton.addEventListener('click', function() {
      if (searchContainer.style.display === 'none') {
        searchContainer.style.display = 'flex';
        searchInput.focus();
        toggleButton.style.display = 'none';
      }
    });
    
    // Close button functionality
    closeButton.addEventListener('click', function() {
      searchContainer.style.display = 'none';
      resultsContainer.style.display = 'none';
      toggleButton.style.display = 'flex';
      searchInput.value = '';
    });
    
    // Search function
    const searchProperties = () => {
      const query = searchInput.value.toLowerCase().trim();
      if (!query || !originalData) return;
      
      const results = originalData.features.filter(feature => {
        const props = feature.properties;
        // Search in Property ID and Address
        return (props["Property Id"] && props["Property Id"].toString().toLowerCase().includes(query)) ||
               (props["Address Concatenate"] && props["Address Concatenate"].toLowerCase().includes(query)) ||
               (props["Name"] && props["Name"].toLowerCase().includes(query));
      });
      
      displaySearchResults(results, resultsContainer);
    };
    
    // Display search results
    const displaySearchResults = (results, container) => {
      if (results.length === 0) {
        container.innerHTML = '<div style="padding: 8px; color: #666;">No properties found</div>';
        container.style.display = 'block';
        return;
      }
      
      let html = '';
      results.forEach(feature => {
        const props = feature.properties;
        const coords = feature.geometry.coordinates;
        
        html += `
          <div class="property-result" data-lat="${coords[1]}" data-lng="${coords[0]}" 
               style="padding: 8px; border-bottom: 1px solid #eee; cursor: pointer; transition: background-color 0.2s;">
            <div style="font-weight: bold;">${props.Name || 'Unnamed Property'}</div>
            <div style="font-size: 12px; color: #666;">ID: ${props["Property Id"] || 'N/A'}</div>
            <div style="font-size: 12px; color: #666; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
              ${props["Address Concatenate"] || 'No address'}
            </div>
          </div>
        `;
      });
      
      container.innerHTML = html;
      container.style.display = 'block';
      
      // Add click event to results
      const resultElements = container.querySelectorAll('.property-result');
      resultElements.forEach(el => {
        // Hover effect
        el.addEventListener('mouseover', () => {
          el.style.backgroundColor = '#f0f9ff';
        });
        el.addEventListener('mouseout', () => {
          el.style.backgroundColor = 'transparent';
        });
        
        // Click to zoom to location
        el.addEventListener('click', function() {
          const lat = parseFloat(this.dataset.lat);
          const lng = parseFloat(this.dataset.lng);
          
          // Zoom to the location
          map.setView([lat, lng], 18);
          
          // Find and open the marker's popup
          markersLayer.eachLayer(function(layer) {
            const markerLatLng = layer.getLatLng();
            if (markerLatLng.lat === lat && markerLatLng.lng === lng) {
              layer.openPopup();
            }
          });
          
          // Hide results after selection
          container.style.display = 'none';
          searchContainer.style.display = 'none';
          toggleButton.style.display = 'flex';
          searchInput.value = '';
        });
      });
    };
    
    // Add event listeners
    searchButton.addEventListener('click', searchProperties);
    searchInput.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') {
        searchProperties();
      }
    });
    
    // Close results when clicking outside
    document.addEventListener('click', function(e) {
      if (!searchContainer.contains(e.target) && !toggleButton.contains(e.target)) {
        resultsContainer.style.display = 'none';
      }
    });
    
  }, 100); // Short delay to ensure DOM elements are available
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
    // Configure marker cluster group with more granular settings
    markersLayer = L.markerClusterGroup({
      disableClusteringAtZoom: 18, // Disable clustering at high zoom levels
      maxClusterRadius: 40,        // Reduce cluster radius (default is 80)
      spiderfyOnMaxZoom: true,     // Allow markers to spread out when clicked
      zoomToBoundsOnClick: true    // Zoom to bounds when cluster clicked
    });
    amap.addLayer(markersLayer);
    
    // Add the filter controls
    const filterControls = createFilterControl();
    filterControls.propertyTypesControl.addTo(amap);
    filterControls.secondaryTypesControl.addTo(amap);
    filterControls.propertyToggle.addTo(amap);
    filterControls.secondaryToggle.addTo(amap);
    
    // Add property search control after data is loaded
    addPropertySearchControl(amap);
    
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
