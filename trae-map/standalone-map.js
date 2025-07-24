"use strict";

let amap;
let markersLayer;
let originalData;
let currentFilters = {
  propertyTypes: [],
  secondaryTypes: [],
  markerColors: []
};
const geoJSONUrl = "https://raw.githubusercontent.com/cleanslatekickz/geojson/master/geojson/May-2025.geojson";

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

const defaultIcon = new L.Icon.Default();
const searchIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-gold.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

function getMarkerIcon(classification) {
  return classifyIcons[classification] || defaultIcon;
}

function showCountyInfo(countyName) {
  const countyNameElement = document.getElementById('county-name');
  const taxButton = document.getElementById('tax-button');
  const gisButton = document.getElementById('gis-button');
  const countyInfo = document.getElementById('county-info');
  
  countyNameElement.textContent = `${countyName} County`;
  
  const urls = countyUrls[countyName] || { taxUrl: '', gisUrl: '' };
  
  taxButton.href = urls.taxUrl || '#';
  taxButton.style.opacity = urls.taxUrl ? '1' : '0.5';
  taxButton.style.pointerEvents = urls.taxUrl ? 'auto' : 'none';
  
  gisButton.href = urls.gisUrl || '#';
  gisButton.style.opacity = urls.gisUrl ? '1' : '0.5';
  gisButton.style.pointerEvents = urls.gisUrl ? 'auto' : 'none';
  
  countyInfo.classList.remove('hidden');
}

function initializeMap() {
  const streetLayer = L.tileLayer('https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
    maxZoom: 20,
    subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
    attribution: ''
  });
  
  const satelliteLayer = L.tileLayer('https://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}', {
    maxZoom: 20,
    subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
    attribution: ''
  });
  
  const hybridLayer = L.tileLayer('https://{s}.google.com/vt/lyrs=s,h&x={x}&y={y}&z={z}', {
    maxZoom: 20,
    subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
    attribution: ''
  });
  
  const layerButtons = {
    'street-layer': streetLayer,
    'satellite-layer': satelliteLayer,
    'hybrid-layer': hybridLayer
  };
  
  amap = L.map('map', {
    layers: [hybridLayer],
    center: [44.0, -120.5],
    zoom: 7,
    wheelPxPerZoomLevel: 90,
    maxZoom: 20,
    zoomSnap: 0.5,
    zoomDelta: 0.5
  });
  
  // Add county boundaries
  fetch('https://services1.arcgis.com/KbxwQRRfWyEYLgp4/arcgis/rest/services/BLM_OR_County_Boundaries_Polygon_Hub/FeatureServer/1/query?outFields=*&where=1%3D1&f=geojson')
    .then(response => response.json())
    .then(data => {
      L.geoJSON(data, {
        style: {
          fillColor: 'transparent',
          weight: 1.5,
          opacity: 0.8,
          color: '#1e40af',
          fillOpacity: 0
        },
        onEachFeature: (feature, layer) => {
          if (feature.properties?.COUNTY_NAME) {
            layer.on({
              mouseover: () => showCountyInfo(feature.properties.COUNTY_NAME),
              click: () => showCountyInfo(feature.properties.COUNTY_NAME)
            });
          }
        }
      }).addTo(amap);
    })
    .catch(console.error);
  
  // Layer control
  Object.entries(layerButtons).forEach(([id, layer]) => {
    document.getElementById(id).addEventListener('click', () => {
      amap.eachLayer(l => amap.removeLayer(l));
      layer.addTo(amap);
      document.querySelectorAll('.layer-button').forEach(btn => btn.classList.remove('active'));
      document.getElementById(id).classList.add('active');
    });
  });
  
  // Add legend
  const legend = L.control({ position: 'topright' });
  legend.onAdd = () => {
    const div = L.DomUtil.create('div', 'legend');
    div.innerHTML = `
      <h4>Map Legend</h4>
      <div class="legend-items">
        ${Object.entries({
          'red': 'Not Interested/DNC',
          'violet': 'IPA',
          'orange': 'Eric',
          'grey': 'Broker/Eh',
          'blue': 'Never',
          'yellow': 'Call Relationship',
          'green': 'Contact/Call Again'
        }).map(([color, label]) => `
          <div class="legend-item">
            <div class="legend-color" style="background-color: ${color}"></div>
            <span>${label}</span>
          </div>
        `).join('')}
      </div>
    `;
    return div;
  };
  legend.addTo(amap);
  
  // Search control
  const searchControl = L.control({ position: 'topleft' });
  searchControl.onAdd = () => {
    const searchDiv = L.DomUtil.create('div', 'custom-search-control');
    searchDiv.innerHTML = `
      <button class="toggle-search-button">🔍</button>
      <div class="search-container hidden">
        <input type="text" class="search-input" placeholder="Search address...">
        <div class="button-container">
          <button class="search-button">🔍</button>
          <button class="close-search-button">✖</button>
        </div>
      </div>
    `;
    return searchDiv;
  };
  searchControl.addTo(amap);
  
  // Search functionality
  document.querySelector('.toggle-search-button').addEventListener('click', () => {
    const container = document.querySelector('.search-container');
    container.classList.remove('hidden');
    document.querySelector('.search-input').focus();
  });
  
  document.querySelector('.close-search-button').addEventListener('click', () => {
    document.querySelector('.search-container').classList.add('hidden');
  });
  
  document.querySelector('.search-button').addEventListener('click', performSearch);
  document.querySelector('.search-input').addEventListener('keypress', e => {
    if (e.key === 'Enter') performSearch();
  });
  
  return amap;
}

function performSearch() {
  const query = document.querySelector('.search-input').value.trim();
  if (!query) return;
  
  const searchResultsLayer = L.layerGroup().addTo(amap);
  
  fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`)
    .then(response => response.json())
    .then(data => {
      if (data?.length) {
        const result = data[0];
        const lat = parseFloat(result.lat);
        const lon = parseFloat(result.lon);
        
        L.marker([lat, lon], { icon: searchIcon })
          .addTo(searchResultsLayer)
          .bindPopup(result.display_name.split(',').slice(0, 2).join(', '))
          .openPopup();
          
        amap.flyTo([lat, lon], 16, { duration: 1.5 });
        document.querySelector('.search-container').classList.add('hidden');
      } else {
        alert('No results found');
      }
    })
    .catch(err => {
      console.error('Search error:', err);
      alert('Error performing search');
    });
}

function createFilterControl() {
  const createContainer = (id, title) => {
    const div = L.DomUtil.create('div', 'filter-container hidden');
    div.id = id;
    div.innerHTML = `
      <h4>${title}</h4>
      <div class="filter-options" id="${id}-options"></div>
      <hr>
      <button class="clear-filter">Clear Filters</button>
    `;
    return div;
  };

  const createToggle = (icon, targetId) => {
    const button = L.DomUtil.create('button', 'filter-toggle');
    button.innerHTML = icon;
    button.onclick = () => {
      const filterDiv = document.getElementById(targetId);
      filterDiv.classList.toggle('hidden');
      document.querySelectorAll('.filter-container').forEach(el => {
        if (el.id !== targetId) el.classList.add('hidden');
      });
    };
    return button;
  };

  return {
    propertyTypes: {
      control: createContainer('propertyTypesContainer', 'Property Types'),
      toggle: createToggle('🏢', 'propertyTypesContainer')
    },
    secondaryTypes: {
      control: createContainer('secondaryTypesContainer', 'Secondary Types'),
      toggle: createToggle('🏗️', 'secondaryTypesContainer')
    }
  };
}

function updateFilters() {
  const propertyTypes = [...new Set(originalData.features
    .map(f => f.properties["Property Type"])
    .filter(Boolean))];
  
  const secondaryTypes = [...new Set(originalData.features
    .map(f => f.properties["Secondary Type"])
    .filter(Boolean))];
  
  const renderOptions = (containerId, options) => {
    const container = document.getElementById(`${containerId}-options`);
    container.innerHTML = '';
    
    options.forEach(type => {
      const label = document.createElement('label');
      label.innerHTML = `
        <input type="checkbox" value="${type}">
        ${type}
      `;
      label.querySelector('input').addEventListener('change', e => {
        if (e.target.checked) {
          currentFilters[containerId === 'propertyTypesContainer' ? 'propertyTypes' : 'secondaryTypes'].push(type);
        } else {
          const filterType = containerId === 'propertyTypesContainer' ? 'propertyTypes' : 'secondaryTypes';
          currentFilters[filterType] = currentFilters[filterType].filter(t => t !== type);
        }
        updateMap(originalData);
      });
      container.appendChild(label);
    });
    
    document.querySelector(`#${containerId} .clear-filter`).onclick = () => {
      currentFilters[containerId === 'propertyTypesContainer' ? 'propertyTypes' : 'secondaryTypes'] = [];
      container.querySelectorAll('input').forEach(cb => cb.checked = false);
      updateMap(originalData);
    };
  };
  
  renderOptions('propertyTypesContainer', propertyTypes);
  renderOptions('secondaryTypesContainer', secondaryTypes);
}

function updateMap(data) {
  if (!originalData) originalData = data;
  if (!amap) amap = initializeMap();
  
  if (!markersLayer) {
    markersLayer = L.markerClusterGroup({
      disableClusteringAtZoom: 18,
      maxClusterRadius: 40,
      spiderfyOnMaxZoom: true,
      zoomToBoundsOnClick: true
    }).addTo(amap);
    
    const filters = createFilterControl();
    Object.values(filters).forEach(({ control, toggle }) => {
      amap.addControl(control);
      amap.addControl(toggle);
    });
    
    addPropertySearchControl(amap);
    updateFilters();
  }
  
  markersLayer.clearLayers();
  
  const filteredFeatures = originalData.features.filter(feature => {
    const props = feature.properties;
    return (
      (currentFilters.propertyTypes.length === 0 || currentFilters.propertyTypes.includes(props["Property Type"])) &&
      (currentFilters.secondaryTypes.length === 0 || currentFilters.secondaryTypes.includes(props["Secondary Type"])) &&
      (currentFilters.markerColors.length === 0 || currentFilters.markerColors.includes(props["Classify Color"]))
    );
  });
  
  filteredFeatures.forEach(feature => {
    const { geometry, properties } = feature;
    const [lng, lat] = geometry.coordinates;
    const marker = L.marker([lat, lng], {
      title: properties.Name,
      icon: getMarkerIcon(properties["Classify Color"])
    });
    
    marker.bindPopup(createPopupContent(properties, [lat, lng]));
    markersLayer.addLayer(marker);
  });
}

function createPopupContent(record, coords) {
  return `
    <div class="popup-card">
      <figure onmouseover="showActionButtons(this)" onmouseout="hideActionButtons(this)">
        ${record["Pop-up IMG"] ? 
          `<img src="${record["Pop-up IMG"]}" alt="${record.Name}">` : 
          `<div class="no-image">No Image Available</div>`}
        <div class="action-buttons">
          <a href="${record["County Prop Search"] || '#'}" title="County Property Search" target="_blank">🔍</a>
          <a href="${record.GIS || '#'}" title="GIS" target="_blank">🌎</a>
          <button onclick="copyToClipboard(this)" data-copy="${record["Address Concatenate"]}" title="Copy Address">📋</button>
          <a href="https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${coords[0]},${coords[1]}" title="Street View" target="_blank">🛣️</a>
          <a href="${record["CoStar URL"] || '#'}" title="CoStar" target="_blank">🏢</a>
        </div>
      </figure>
      <div class="popup-content">
        <h2 onclick="toggleDetails(this)">${record.Name}</h2>
        <div class="details hidden">
          <p><strong>Address:</strong> <span onclick="copyToClipboard(this)">${record["Address Concatenate"]}</span></p>
          <p><strong>Property ID:</strong> <span onclick="copyToClipboard(this)">${record["Property Id"]}</span></p>
          ${record.Segment ? `<p><strong>Segment:</strong> ${record.Segment}</p>` : ''}
          ${record.Date ? `<p><strong>Date:</strong> ${record.Date}</p>` : ''}
          ${record["Last Call Segment"] ? `<p><strong>Last Call Segment:</strong> ${record["Last Call Segment"]}</p>` : ''}
        </div>
      </div>
    </div>
  `;
}

function addPropertySearchControl(map) {
  const control = L.control({ position: 'topleft' });
  control.onAdd = () => {
    const container = L.DomUtil.create('div', 'property-search-control');
    container.innerHTML = `
      <button class="toggle-property-search-button">🏢</button>
      <div class="property-search-container hidden">
        <input type="text" class="property-search-input" placeholder="Search properties...">
        <div class="button-container">
          <button class="property-search-button">🔍</button>
          <button class="close-property-search">✕</button>
        </div>
        <div class="property-search-results hidden"></div>
      </div>
    `;
    return container;
  };
  control.addTo(map);
  
  // Attach event listeners
  document.querySelector('.toggle-property-search-button').addEventListener('click', () => {
    document.querySelector('.property-search-container').classList.remove('hidden');
    document.querySelector('.property-search-input').focus();
  });
  
  document.querySelector('.close-property-search').addEventListener('click', () => {
    document.querySelector('.property-search-container').classList.add('hidden');
    document.querySelector('.property-search-results').classList.add('hidden');
  });
  
  document.querySelector('.property-search-button').addEventListener('click', searchProperties);
  document.querySelector('.property-search-input').addEventListener('keypress', e => {
    if (e.key === 'Enter') searchProperties();
  });
  
  function searchProperties() {
    const query = document.querySelector('.property-search-input').value.toLowerCase().trim();
    if (!query || !originalData) return;
    
    const results = originalData.features.filter(feature => {
      const props = feature.properties;
      return (
        (props["Property Id"] && props["Property Id"].toString().toLowerCase().includes(query)) ||
        (props["Address Concatenate"] && props["Address Concatenate"].toLowerCase().includes(query)) ||
        (props.Name && props.Name.toLowerCase().includes(query))
      );
    });
    
    displaySearchResults(results);
  }
  
  function displaySearchResults(results) {
    const container = document.querySelector('.property-search-results');
    if (!results.length) {
      container.innerHTML = '<div>No properties found</div>';
      container.classList.remove('hidden');
      return;
    }
    
    container.innerHTML = results.map(feature => {
      const props = feature.properties;
      const [lng, lat] = feature.geometry.coordinates;
      return `
        <div class="property-result" data-lat="${lat}" data-lng="${lng}">
          <div>${props.Name || 'Unnamed Property'}</div>
          <small>ID: ${props["Property Id"] || 'N/A'}</small>
          <small>${props["Address Concatenate"] || 'No address'}</small>
        </div>
      `;
    }).join('');
    
    container.classList.remove('hidden');
    
    container.querySelectorAll('.property-result').forEach(el => {
      el.addEventListener('click', function() {
        const lat = parseFloat(this.dataset.lat);
        const lng = parseFloat(this.dataset.lng);
        map.setView([lat, lng], 18);
        
        markersLayer.eachLayer(layer => {
          const pos = layer.getLatLng();
          if (pos.lat === lat && pos.lng === lng) layer.openPopup();
        });
        
        document.querySelector('.property-search-container').classList.add('hidden');
        container.classList.add('hidden');
      });
    });
  }
}

// Helper functions
function toggleDetails(header) {
  header.nextElementSibling?.classList.toggle('hidden');
}

function copyToClipboard(element) {
  const text = element.dataset.copy || element.innerText;
  navigator.clipboard.writeText(text).then(() => {
    const tooltip = document.createElement('div');
    tooltip.className = 'copy-tooltip';
    tooltip.textContent = 'Copied!';
    element.appendChild(tooltip);
    setTimeout(() => tooltip.remove(), 1500);
  });
}

function showActionButtons(figure) {
  figure.querySelector('.action-buttons')?.classList.add('visible');
}

function hideActionButtons(figure) {
  figure.querySelector('.action-buttons')?.classList.remove('visible');
}

// Initialize application
document.addEventListener("DOMContentLoaded", () => {
  fetch(geoJSONUrl)
    .then(response => response.json())
    .then(data => updateMap(data))
    .catch(console.error);
});
