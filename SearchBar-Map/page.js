"use strict";

/* global grist, window, L */ // Make sure L is declared as a global

let amap;
let markersLayer;
let mapContainer = null;
let selectedRowId = null;
let selectedRecords = null;
let mode = 'multi';
let lastRecord;
let lastRecords;
let cleanupHandlers = [];
let mapEventHandlers = [];
let mapInitialized = false;
let minimapInitialized = false;
let searchResults = null;
let mapReady = false;
let initializationInProgress = false;
let mapContainerReady = false;


// Required column names
const Name = "Name";
const Longitude = "Longitude";
const Latitude = "Latitude";
const Property_Type = 'Property_Type';
const Tenants = 'Tenants';
const Secondary_Type = 'Secondary_Type';
const ImageURL = 'ImageURL';
const CoStar_URL = 'CoStar_URL';
const County_Hyper = 'County_Hyper';
const GIS = 'GIS';

// Icon definitions
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

// Base map layers
const baseLayers = {
  "Google Hybrid": L.tileLayer('https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}', {
    attribution: 'Google Hybrid',
    maxZoom: 20,
    subdomains: ['mt0', 'mt1', 'mt2', 'mt3']
  }),
  "MapTiler Satellite": L.tileLayer('https://api.maptiler.com/tiles/satellite-v2/{z}/{x}/{y}.jpg?key=TbsQ5qLxJHC20Jv4Th7E', {
    attribution: '',
    maxZoom: 20
  }),
  "ArcGIS": L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}', {
    attribution: '',
    maxZoom: 19
  }),
  "OpenStreetMap": L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors',
    maxZoom: 19
  })
};

const defaultBaseLayer = "OpenStreetMap"; // Use OpenStreetMap as default since it's more reliable

function createPopupContent(record) {
  return `
    <div class="bg-white rounded-lg shadow-lg overflow-hidden">
      <div class="p-2 border-b border-gray-200">
        <h3 class="text-xs font-semibold text-gray-800">${record.Name || 'Unnamed Location'}</h3>
      </div>
      ${record.ImageURL ? `
        <div class="relative h-24">
          <img src="${record.ImageURL}" alt="Property Image" 
               class="w-full h-full object-cover cursor-pointer hover:opacity-90" 
               onclick="openLightbox('${record.ImageURL}')" />
        </div>
      ` : ''}
      <div class="p-2 space-y-1">
        <div class="text-xs text-gray-700">
          <strong>Type:</strong> ${record.Property_Type || 'N/A'}
        </div>
        <div class="text-xs text-gray-700">
          <strong>Secondary:</strong> ${record.Secondary_Type || 'N/A'}
        </div>
        <div class="text-xs text-gray-700">
          <strong>Tenants:</strong> ${record.Tenants || 'N/A'}
        </div>
      </div>
      <div class="p-2 bg-gray-50 flex gap-1">
        ${record.CoStar_URL ? `<a href="${record.CoStar_URL}" class="popup-button text-xs px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700" target="_blank">CoStar</a>` : ''}
        ${record.County_Hyper ? `<a href="${record.County_Hyper}" class="popup-button text-xs px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700" target="_blank">County</a>` : ''}
        ${record.GIS ? `<a href="${record.GIS}" class="popup-button text-xs px-2 py-1 bg-yellow-400 text-gray-800 rounded hover:bg-yellow-500" target="_blank">GIS</a>` : ''}
      </div>
    </div>
  `;
}

function initializeMinimap(amap) {
  if (minimapInitialized) return;

  const minimapContainer = document.getElementById('minimap-container');
  const toggleButton = document.getElementById('toggleMinimap');
  const toggleText = toggleButton?.querySelector('.toggle-text');
  const toggleIcon = toggleButton?.querySelector('.toggle-icon');

  if (!minimapContainer || !toggleButton) {
    console.warn('Minimap elements not found');
    return;
  }

  minimapContainer.classList.add('collapsed');
  if (toggleText) toggleText.textContent = 'Expand Map';
  if (toggleIcon) toggleIcon.textContent = '🔼';

  const toggleHandler = () => {
    minimapContainer.classList.toggle('collapsed');
    const isCollapsed = minimapContainer.classList.contains('collapsed');
    if (toggleText) toggleText.textContent = isCollapsed ? 'Expand Map' : 'Minimize Map';
    if (toggleIcon) toggleIcon.textContent = isCollapsed ? '🔼' : '🔽';
    if (!isCollapsed) {
      const center = amap.getCenter();
      const zoom = amap.getZoom();
      const ll = `${center.lat},${center.lng}`;
      const iframe = document.getElementById('googleMap');
      if (iframe) {
        iframe.src = `https://www.google.com/maps/d/embed?mid=1XYqZpHKr3L0OGpTWlkUah7Bf4v0tbhA&ll=${ll}&z=${zoom}&ui=0`;
      }
    }
  };

  toggleButton.addEventListener('click', toggleHandler);
  mapEventHandlers.push(() => toggleButton.removeEventListener('click', toggleHandler));

  minimapInitialized = true;
}


function ensureMapContainer() {
  mapContainer = document.getElementById('map');
  if (!mapContainer) {
    throw new Error('Map container not found');
  }

  // Clear any existing content
  mapContainer.innerHTML = '';
  
  // Add loading indicator
  const loadingDiv = document.createElement('div');
  loadingDiv.className = 'map-loading';
  loadingDiv.innerHTML = 'Initializing map...';
  mapContainer.appendChild(loadingDiv);
  
  mapContainerReady = true;
}

function initializeMap() {
  if (initializationInProgress) {
    console.warn('Map initialization already in progress');
    return null;
  }

  initializationInProgress = true;

  try {
    cleanup();
    ensureMapContainer();

    // Create map with Google Hybrid as default
    const googleHybrid = baseLayers["Google Hybrid"];
    amap = L.map('map', {
      center: [45.5283, -122.8081],
      zoom: 4,
      wheelPxPerZoomLevel: 90,
      zoomControl: true,
      attributionControl: false,
      preferCanvas: true,
      renderer: L.canvas(),
      maxZoom: 19,
      minZoom: 2,
      fadeAnimation: false,
      zoomAnimation: false,
      markerZoomAnimation: false,
      layers: [googleHybrid] // Set Google Hybrid as default layer
    });

    // Add layer control
    L.control.layers(baseLayers, {}, { 
      position: 'topright', 
      collapsed: true 
    }).addTo(amap);

    // Initialize marker cluster
    markersLayer = L.markerClusterGroup({
      maxClusterRadius: 80,
      spiderfyOnMaxZoom: true,
      showCoverageOnHover: false,
      zoomToBoundsOnClick: true,
      chunkedLoading: true,
      chunkInterval: 200,
      animate: false,
      disableClusteringAtZoom: 19
    });

    amap.addLayer(markersLayer);

    // Initialize search with proper cleanup
    const searchControl = L.esri.Geocoding.geosearch({
      providers: [L.esri.Geocoding.arcgisOnlineProvider()],
      position: 'topleft',
      useMapBounds: false,
      placeholder: 'Search for places...',
      expanded: false,
      collapseAfterResult: true,
      searchBounds: null,
      allowMultipleResults: true,
      zoomToResult: false,
      maxResults: 10,
      useMapCenter: false,
      autoComplete: true,
      autoCompleteDelay: 250
    }).addTo(amap);

    // Create search results layer with custom pane
    amap.createPane('searchPane');
    amap.getPane('searchPane').style.zIndex = 450; // Above markers but below popups
    searchResults = L.layerGroup([], { pane: 'searchPane' }).addTo(amap);

    // Search handler with proper cleanup
    const searchHandler = (data) => {
      if (searchResults) {
      searchResults.clearLayers();
      if (data.results?.length > 0) {
        data.results.forEach(result => {
        const searchMarker = L.marker(result.latlng, {
          icon: L.divIcon({
          className: 'search-marker',
          html: '<div class="search-marker-inner"></div>',
          iconSize: [12, 12],
          iconAnchor: [6, 6]
          }),
          pane: 'searchPane'
        });
        searchMarker.bindPopup(result.text || 'Location');
        searchResults.addLayer(searchMarker);
        });
        
        // If only one result, zoom to it
        if (data.results.length === 1) {
        amap.setView(data.results[0].latlng, 16, { animate: false });
        searchResults.getLayers()[0].openPopup();
        } else {
        // If multiple results, fit bounds to show all
        const bounds = L.latLngBounds(data.results.map(r => r.latlng));
        amap.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
        }
      }
      }
    };

    // Add error and loading state handlers
    const searchStartHandler = () => {
      if (searchResults) {
      searchResults.clearLayers();
      }
      const input = document.querySelector('.leaflet-control-geocoder-form input');
      if (input) {
      input.classList.add('searching');
      }
    };

    const searchEndHandler = () => {
      const input = document.querySelector('.leaflet-control-geocoder-form input');
      if (input) {
      input.classList.remove('searching');
      }
    };

    const searchErrorHandler = (e) => {
      console.error('Search error:', e);
      searchEndHandler();
      showProblem('Search failed. Please try again.');
    };

    const searchClearHandler = () => {
      if (searchResults) {
      searchResults.clearLayers();
      }
      searchEndHandler();
    };

    // Add event listeners
    searchControl.on('searchstart', searchStartHandler);
    searchControl.on('requeststart', searchStartHandler);
    searchControl.on('requestend', searchEndHandler);
    searchControl.on('error', searchErrorHandler);
    searchControl.on('results', searchHandler);
    searchControl.on('clear', searchClearHandler);

    // Add cleanup handlers
    mapEventHandlers.push(() => {
      searchControl.off('results', searchHandler);
      searchControl.off('searchstart', searchStartHandler);
      searchControl.off('requeststart', searchStartHandler);
      searchControl.off('requestend', searchEndHandler);
      searchControl.off('error', searchErrorHandler);
      searchControl.off('clear', searchClearHandler);
      if (searchResults) {
      searchResults.clearLayers();
      amap.removeLayer(searchResults);
      }
    });


    // Add event handlers
    const errorHandler = (e) => {
      console.error('Map error:', e);
      showProblem('An error occurred with the map. Please refresh the page.');
    };
    amap.on('error', errorHandler);
    mapEventHandlers.push(() => amap.off('error', errorHandler));

    const loadHandler = () => {
      console.log('Map loaded successfully');
      mapReady = true;
    };
    amap.on('load', loadHandler);
    mapEventHandlers.push(() => amap.off('load', loadHandler));

    const moveHandler = () => {
      if (minimapInitialized && !document.getElementById('minimap-container').classList.contains('collapsed')) {
        const center = amap.getCenter();
        const zoom = amap.getZoom();
        const ll = `${center.lat},${center.lng}`;
        const iframe = document.getElementById('googleMap');
        if (iframe) {
          iframe.src = `https://www.google.com/maps/d/embed?mid=1XYqZpHKr3L0OGpTWlkUah7Bf4v0tbhA&ll=${ll}&z=${zoom}&ui=0`;
        }
      }
    };
    amap.on('moveend', moveHandler);
    mapEventHandlers.push(() => amap.off('moveend', moveHandler));


    // Initialize minimap after all other components
    amap.whenReady(() => {
      // Remove loading indicator
      const loadingDiv = mapContainer.querySelector('.map-loading');
      if (loadingDiv) {
      loadingDiv.remove();
      }
      
      initializeMinimap(amap);
      mapInitialized = true;
    });

    return amap;

  } catch (error) {

    console.error('Error initializing map:', error);
    showProblem('Failed to initialize map. Please refresh the page.');
    return null;
  } finally {
    initializationInProgress = false;
  }
}


function updateMap(records) {
  if (initializationInProgress) {
    console.warn('Map initialization in progress, delaying update');
    setTimeout(() => updateMap(records), 500);
    return;
  }

  try {
    if (!records?.length) {
      showProblem("No data found yet");
      return;
    }

    if (!amap || !mapReady) {
      amap = initializeMap();
      if (!amap) return;
    }

    if (markersLayer) {
      markersLayer.clearLayers();
    }

    // Create markers in batches for better performance
    const batchSize = 100;
    const markers = [];
    
    for (let i = 0; i < records.length; i += batchSize) {
      const batch = records.slice(i, i + batchSize);
      batch.forEach(record => {
        if (!record.Latitude || !record.Longitude) return;

        const marker = L.marker([record.Latitude, record.Longitude], {
          title: record.Name,
          id: record.id,
          icon: (record.id === selectedRowId) ? selectedIcon : defaultIcon
        });

        const clickHandler = () => selectMarker(marker.options.id);
        marker.on('click', clickHandler);
        cleanupHandlers.push(() => marker.off('click', clickHandler));

        marker.bindPopup(createPopupContent(record));
        markers.push(marker);
      });
    }

    // Add markers in batch
    if (markers.length > 0) {
      markersLayer.addLayers(markers);
      
      // Fit bounds if markers exist
      const bounds = markersLayer.getBounds();
      if (bounds.isValid()) {
        amap.fitBounds(bounds, { 
          padding: [50, 50],
          maxZoom: 15,
          animate: false
        });
      }
    }
  } catch (error) {
    console.error('Error updating map:', error);
    showProblem('Failed to update map with data.');
  }
}

function selectMarker(id) {
  try {
    const markers = markersLayer.getLayers();
    const previousMarker = markers.find(m => m.options.id === selectedRowId);
    if (previousMarker) {
      previousMarker.setIcon(defaultIcon);
    }

    const newMarker = markers.find(m => m.options.id === id);
    if (!newMarker) return;

    selectedRowId = id;
    newMarker.setIcon(selectedIcon);
    newMarker.openPopup();

    grist.setCursorPos?.({rowId: id}).catch(console.error);
  } catch (error) {
    console.error('Error selecting marker:', error);
  }
}
function showProblem(txt) {
  const mapElement = document.getElementById('map');
  if (mapElement) {
    mapElement.innerHTML = `<div class="error">${txt}</div>`;
  }
}

// Lightbox function
function openLightbox(imageUrl) {
  const lightbox = document.createElement('div');
  lightbox.className = 'lightbox';
  lightbox.innerHTML = `
    <div class="relative">
      <img src="${imageUrl}" alt="Full-size Image" />
      <button onclick="this.parentElement.parentElement.remove()">✕</button>
    </div>
  `;
  document.body.appendChild(lightbox);
}



// Creates clusterIcons that highlight if they contain selected row

const selectedRowClusterIconFactory = function (selectedMarkerGetter) {
  return function(cluster) {
    var childCount = cluster.getChildCount();

    let isSelected = false;
    try {
      const selectedMarker = selectedMarkerGetter();
      isSelected = cluster.getAllChildMarkers().filter((m) => m == selectedMarker).length > 0;
    } catch (e) {
      console.error("WARNING: Error in clusterIconFactory in map widget");
      console.error(e);
    }

    var c = ' marker-cluster-';
    if (childCount < 10) {
      c += 'small';
    } else if (childCount < 100) {
      c += 'medium';
    } else {
      c += 'large';
    }

    return new L.DivIcon({
        html: '<div><span>'
            + childCount
            + ' <span aria-label="markers"></span>'
            + '</span></div>',
        className: 'marker-cluster' + c + (isSelected ? ' marker-cluster-selected' : ''),
        iconSize: new L.Point(40, 40)
    });
  }
};

const geocoder = L.Control.Geocoder && L.Control.Geocoder.nominatim();
if (URLSearchParams && location.search && geocoder) {
  const c = new URLSearchParams(location.search).get('geocoder');
  if (c && L.Control.Geocoder[c]) {
    console.log('Using geocoder', c);
    geocoder = L.Control.Geocoder[c]();
  } else if (c) {
    console.warn('Unsupported geocoder', c);
  }
  const m = new URLSearchParams(location.search).get('mode');
  if (m) { mode = m; }
}

async function geocode(address) {
  return new Promise((resolve, reject) => {
    try {
      geocoder.geocode(address, (v) => {
        v = v[0];
        if (v) { v = v.center; }
        resolve(v);
      });
    } catch (e) {
      console.log("Problem:", e);
      reject(e);
    }
  });
}

async function delay(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

// If widget has wright access
let writeAccess = true;
// A ongoing scanning promise, to check if we are in progress.
let scanning = null;

async function scan(tableId, records, mappings) {
  if (!writeAccess) { return; }
  for (const record of records) {
    // We can only scan if Geocode column was mapped.
    if (!(Geocode in record)) { break; }
    // And the value in the column is truthy.
    if (!record[Geocode]) { continue; }
    // Get the address to search.
    const address = record.Address;
    // Little caching here. We will set GeocodedAddress to last address we searched,
    // so after next round - we will check if the address is indeed changed.
    // But this field is optional, if it is not in the record (not mapped)
    // we will find the location each time (if coordinates are empty).
    if (record[GeocodedAddress] && record[GeocodedAddress] !== record.Address) {
      // We have caching field, and last address is diffrent.
      // So clear coordinates (as if the record wasn't scanned before)
      record[Longitude] = null;
      record[Latitude] = null;
    }
    // If address is not empty, and coordinates are empty (or were cleared by cache)
    if (address && !record[Longitude]) {
      // Find coordinates.
      const result = await geocode(address);
      // Update them, and update cache (if the field was mapped)
      await grist.docApi.applyUserActions([ ['UpdateRecord', tableId, record.id, {
        [mappings[Longitude]]: result.lng,
        [mappings[Latitude]]: result.lat,
        ...(GeocodedAddress in mappings) ? {[mappings[GeocodedAddress]]: address} : undefined
      }] ]);
      await delay(1000);
    }
  }
}

function scanOnNeed(mappings) {
  if (!scanning && selectedTableId && selectedRecords) {
    scanning = scan(selectedTableId, selectedRecords, mappings).then(() => scanning = null).catch(() => scanning = null);
  }
}

function showProblem(txt) {
  document.getElementById('map').innerHTML = '<div class="error">' + txt + '</div>';
}

// Little extra wrinkle to deal with showing differences.  Should be taken
// care of by Grist once diffing is out of beta.
function parseValue(v) {
  if (typeof(v) === 'object' && v !== null && v.value && v.value.startsWith('V(')) {
    const payload = JSON.parse(v.value.slice(2, v.value.length - 1));
    return payload.remote || payload.local || payload.parent || payload;
  }
  return v;
}

function getInfo(rec) {
  const result = {
    id: rec.id,
    name: parseValue(rec[Name]),
    lng: parseValue(rec[Longitude]),
    lat: parseValue(rec[Latitude]),
    propertyType: parseValue(rec['Property_Type']),  // Add Property Type column
    tenants: parseValue(rec['Tenants']),  // Add Tenants column
    secondaryType: parseValue(rec['Secondary_Type']),  // Add Secondary Type column
    imageUrl: parseValue(rec['ImageURL']),  // Add Image URL column
    costarLink: parseValue(rec['CoStar_URL']),  // Add CoStar link column
    countyLink: parseValue(rec['County_Hyper']),  // Add County link column
    gisLink: parseValue(rec['GIS']),  // Add GIS link column
  };
  return result;
}

// Function to clear last added markers. Used to clear the map when new record is selected.
let clearMakers = () => {};

let markers; // Declare markers outside updateMap for wider scope

// --- Base Layers from Grist-GIS.js ---
const baseLayers = {
  "Google Hybrid": L.tileLayer('https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}', {
    attribution: 'Google Hybrid',
    maxZoom: 20,
    subdomains: ['mt0', 'mt1', 'mt2', 'mt3']
  }),
  "MapTiler Satellite": L.tileLayer('https://api.maptiler.com/tiles/satellite-v2/{z}/{x}/{y}.jpg?key=TbsQ5qLxJHC20Jv4Th7E', {
    attribution: '',
    maxZoom: 20
  }),
  "ArcGIS": L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}', {
    attribution: '',
    maxZoom: 19
  }),
  "OpenStreetMap": L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors',
    maxZoom: 19
  })
};









function selectMaker(id) {
  // Reset the options from the previously selected marker.
  const previouslyClicked = popups[selectedRowId];
  if (previouslyClicked) {
    previouslyClicked.setIcon(defaultIcon);
  }

  const marker = popups[id];
  if (!marker) { return null; }

  // Remember the new selected marker.
  selectedRowId = id;

  // Set the options for the newly selected marker.
  marker.setIcon(selectedIcon);

  // Open the popup
  marker.openPopup();

  // Update the selected row in Grist.
  grist.setCursorPos?.({rowId: id}).catch(() => {});

  return marker;
}



grist.on('message', (e) => {
  if (e.tableId) { selectedTableId = e.tableId; }
});

function hasCol(col, anything) {
  return anything && typeof anything === 'object' && col in anything;
}

function defaultMapping(record, mappings) {
  if (!mappings) {
    return {
      [Longitude]: Longitude,
      [Name]: Name,
      [Latitude]: Latitude,
      [Property_Type]: Property_Type,
      [Tenants]: Tenants,
      [Secondary_Type]: Secondary_Type,
      [ImageURL]: ImageURL,
      [CoStar_URL]: CoStar_URL,
      [County_Hyper]: County_Hyper,
      [GIS]: GIS,
      [Address]: hasCol(Address, record) ? Address : null,
      [GeocodedAddress]: hasCol(GeocodedAddress, record) ? GeocodedAddress : null,
      [Geocode]: hasCol(Geocode, record) ? Geocode : null,
    };
  }
  return mappings;
}

function selectOnMap(rec) {
  // If this is already selected row, do nothing (to avoid flickering)
  if (selectedRowId === rec.id) { return; }

  selectedRowId = rec.id;
  if (mode === 'single') {
    updateMap([rec]);
  } else {
    updateMap();
  }
}

grist.onRecord((record, mappings) => {
  if (mode === 'single') {
    // If mappings are not done, we will assume that table has correct columns.
    // This is done to support existing widgets which where configured by
    // renaming column names.
    lastRecord = grist.mapColumnNames(record) || record;
    selectOnMap(lastRecord);
    scanOnNeed(defaultMapping(record, mappings));
  } else {
    const marker = selectMaker(record.id);
    if (!marker) { return; }
    markers.zoomToShowLayer(marker);
    marker.openPopup();
  }
});
grist.onRecords((data, mappings) => {
  lastRecords = grist.mapColumnNames(data) || data;
  if (mode !== 'single') {
    // If mappings are not done, we will assume that table has correct columns.
    // This is done to support existing widgets which where configured by
    // renaming column names.
    updateMap(lastRecords);
    if (lastRecord) {
      selectOnMap(lastRecord);
    }
    // We need to mimic the mappings for old widgets
    scanOnNeed(defaultMapping(data[0], mappings));
  }
});

grist.onNewRecord(() => {
  if (markersLayer) {
    markersLayer.clearLayers();
  }
  cleanupHandlers.forEach(cleanup => cleanup());
  cleanupHandlers = [];
});

// Add cleanup function
function cleanup() {
  mapReady = false;
  mapInitialized = false;
  minimapInitialized = false;
  mapContainerReady = false;

  // Clean up map event handlers
  mapEventHandlers.forEach(cleanup => {
    try {
      cleanup();
    } catch (e) {
      console.error('Error cleaning up map event handler:', e);
    }
  });
  mapEventHandlers = [];

  // Clean up other event handlers
  cleanupHandlers.forEach(cleanup => {
    try {
      cleanup();
    } catch (e) {
      console.error('Error during cleanup:', e);
    }
  });
  cleanupHandlers = [];

  // Clean up search results and pane
  if (searchResults) {
    try {
      searchResults.clearLayers();
      if (amap) {
        amap.removeLayer(searchResults);
        if (amap.getPane('searchPane')) {
          amap.getPane('searchPane').remove();
        }
      }
      searchResults = null;
    } catch (e) {
      console.error('Error cleaning up search results:', e);
    }
  }

  // Clean up markers
  if (markersLayer) {
    try {
      markersLayer.clearLayers();
      if (amap) {
        amap.removeLayer(markersLayer);
      }
      markersLayer = null;
    } catch (e) {
      console.error('Error cleaning up markers:', e);
    }
  }

  // Clean up map
  if (amap) {
    try {
      // Remove all layers
      amap.eachLayer((layer) => {
        try {
          amap.removeLayer(layer);
        } catch (e) {
          console.error('Error removing layer:', e);
        }
      });
      
      // Remove map instance
      amap.remove();
      amap = null;
    } catch (e) {
      console.error('Error removing map:', e);
    }
  }

  // Clean up DOM
  if (mapContainer) {
    mapContainer.innerHTML = '';
  }

  // Reset minimap iframe
  const iframe = document.getElementById('googleMap');
  if (iframe) {
    iframe.src = 'about:blank';
  }
}


// Add window unload handler
window.addEventListener('unload', cleanup);
window.addEventListener('beforeunload', cleanup);
window.addEventListener('error', (e) => {
  console.error('Global error:', e);
  showProblem('An error occurred. Please refresh the page.');
});




const optional = true;
// Grist integration
grist.ready({
  columns: [
    "Name",
    { name: "Latitude", type: 'Numeric'},
    { name: "Longitude", type: 'Numeric'},
    { name: "Property_Type", type: 'Choice'},
    { name: "Tenants", type: 'ChoiceList'},
    { name: "Secondary_Type", type: 'ChoiceList'},
    { name: "ImageURL", type: 'Text'},
    { name: "CoStar_URL", type: 'Text'},
    { name: "County_Hyper", type: 'Text'},
    { name: "GIS", type: 'Text'}
  ],
  allowSelectBy: true
});

grist.onRecord(record => {
  selectedRowId = record.id;
  if (mode === 'single') {
    updateMap([record]);
  } else {
    selectMarker(record.id);
  }
});

grist.onRecords(records => {
  selectedRecords = records;
  if (mode !== 'single') {
    updateMap(records);
  }
});

window.onerror = function(msg, url, lineNo, columnNo, error) {
  console.error('Error: ', msg, '\nURL: ', url, '\nLine:', lineNo, '\nColumn:', columnNo, '\nError object:', error);
  showProblem('An error occurred. Please check the console for details.');
  return false;
};
