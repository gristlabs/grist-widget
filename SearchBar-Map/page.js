"use strict";

/* global grist, window, L */

// State variables, organized into an object for easier management
const state = {
  selectedTableId: null,
  writeAccess: true, // Default to true
  scanning: null,
  amap: null,
  markersLayer: null,
  mapContainer: null,
  selectedRowId: null,
  selectedRecords: null,
  mode: 'multi',
  lastRecord: null,
  lastRecords: null,
  cleanupHandlers: [],
  mapEventHandlers: [],
  mapInitialized: false,
  minimapInitialized: false,
  searchResults: null,
  mapReady: false,
  initializationInProgress: false,
  mapContainerReady: false,
  popups: {},
  gristInitialized: false,
};

// Required column names (constants are good practice)
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
const Address = 'Address';
const GeocodedAddress = 'GeocodedAddress';
const Geocode = 'Geocode';

// Icon definitions (these can stay outside the functions)
const selectedIcon = new L.Icon({
  iconUrl: 'marker-icon-green.png',
  iconRetinaUrl: 'marker-icon-green-2x.png',
  shadowUrl: 'marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const defaultIcon = new L.Icon({
  iconUrl: 'marker-icon.png',
  iconRetinaUrl: 'marker-icon-2x.png',
  shadowUrl: 'marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

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

const defaultBaseLayer = "MapTiler Satellite"; // Use OpenStreetMap as default since it's more reliable

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
        ${record.CoStar_URL ? `
          <a href="${record.CoStar_URL}" class="popup-button text-xs px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700" target="_blank">CoStar</a>
        ` : ''}
        ${record.County_Hyper ? `
          <a href="${record.County_Hyper}" class="popup-button text-xs px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700" target="_blank">County</a>
        ` : ''}
        ${record.GIS ? `
          <a href="${record.GIS}" class="popup-button text-xs px-2 py-1 bg-yellow-400 text-gray-800 rounded hover:bg-yellow-500" target="_blank">GIS</a>
        ` : ''}
      </div>
    </div>
  `;
}

function initializeMinimap(amap) {
  if (state.minimapInitialized) return;

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
      const center = state.amap.getCenter();
      const zoom = state.amap.getZoom();
      const ll = `${center.lat},${center.lng}`;
      const iframe = document.getElementById('googleMap');
      if (iframe) {
        iframe.src = `https://www.google.com/maps/d/embed?mid=1XYqZpHKr3L0OGpTWlkUah7Bf4v0tbhA&ll=${ll}&z=${zoom}&ui=0`;
      }
    }
  };

  toggleButton.addEventListener('click', toggleHandler);
  state.mapEventHandlers.push(() => toggleButton.removeEventListener('click', toggleHandler));

  state.minimapInitialized = true;
}

// ... Rest of the code ...

// Add cleanup function
function cleanup() {
  // Clean up Grist handlers first
  try {
    if (state.gristInitialized) {
      grist.onRecord(() => { });
      grist.onRecords(() => { });
      grist.on('message', () => { });
      state.gristInitialized = false;
      state.selectedTableId = null;
      state.selectedRecords = null;
      state.selectedRowId = null;
    }
  } catch (e) {
    console.error('Error cleaning up Grist handlers:', e);
  }

  state.mapReady = false;
  state.mapInitialized = false;
  state.minimapInitialized = false;
  state.mapContainerReady = false;

  // Clean up map event handlers
  state.mapEventHandlers.forEach(cleanup => {
    try {
      cleanup();
    } catch (e) {
      console.error('Error cleaning up map event handler:', e);
    }
  });
  state.mapEventHandlers = [];

  // Clean up other event handlers
  state.cleanupHandlers.forEach(cleanup => {
    try {
      cleanup();
    } catch (e) {
      console.error('Error during cleanup:', e);
    }
  });
  state.cleanupHandlers = [];

  // Clean up search results and pane
  if (state.searchResults) {
    try {
      state.searchResults.clearLayers();
      if (state.amap) {
        state.amap.removeLayer(state.searchResults);
        if (state.amap.getPane('searchPane')) {
          state.amap.getPane('searchPane').remove();
        }
      }
      state.searchResults = null;
    } catch (e) {
      console.error('Error cleaning up search results:', e);
    }
  }

  // Clean up markers
  if (state.markersLayer) {
    try {
      state.markersLayer.clearLayers();
      if (state.amap) {
        state.amap.removeLayer(state.markersLayer);
      }
      state.markersLayer = null;
    } catch (e) {
      console.error('Error cleaning up markers:', e);
    }
  }

  // Clean up map
  if (state.amap) {
    try {
      // Remove all layers
      state.amap.eachLayer((layer) => {
        try {
          state.amap.removeLayer(layer);
        } catch (e) {
          console.error('Error removing layer:', e);
        }
      });

      // Remove map instance
      state.amap.remove();
      state.amap = null;
    } catch (e) {
      console.error('Error removing map:', e);
    }
  }

  // Clean up DOM
  if (state.mapContainer) {
    state.mapContainer.innerHTML = '';
  }

  // Reset minimap iframe
  const iframe = document.getElementById('googleMap');
  if (iframe) {
    iframe.src = 'about:blank';
  }
}

// Add window unload handlers and global error handler
window.addEventListener('unload', cleanup);
window.addEventListener('beforeunload', cleanup);

// Initialize Grist
document.addEventListener('DOMContentLoaded', () => {
  // Clean up any existing state
  cleanup();

  // Set up error handler first
  window.onerror = function (msg, url, lineNo, columnNo, error) {
    const errorDetails = {
      message: msg,
      url: url,
      line: lineNo,
      column: columnNo,
      error: error
    };
    console.error('Global error:', errorDetails);
    cleanup();
    showProblem('An error occurred. Please refresh the page.');
    return false;
  };

  // Initialize Grist with proper error handling
  grist.ready({
    columns: [
      { name: "Name", type: "Text" },
      { name: "Latitude", type: "Numeric" },
      { name: "Longitude", type: "Numeric" },
      { name: "Property_Type", type: "Choice", optional: true },
      { name: "Tenants", type: "ChoiceList", optional: true },
      { name: "Secondary_Type", type: "ChoiceList", optional: true },
      { name: "ImageURL", type: "Text", optional: true },
      { name: "CoStar_URL", type: "Text", optional: true },
      { name: "County_Hyper", type: "Text", optional: true },
      { name: "GIS", type: "Text", optional: true },
      { name: "Address", type: "Text", optional: true },
      { name: "GeocodedAddress", type: "Text", optional: true },
      { name: "Geocode", type: "Bool", optional: true }
    ],
    allowSelectBy: {
      name: "Geocode",
      type: "Bool",
      optional: true
    },
    allowSelectBy: true,
    onEditPermission: (hasEditPerm) => {
      state.writeAccess = hasEditPerm;
    }
  }).then(() => {
    state.gristInitialized = true;
    console.log('Grist initialized');

    // Set up message handler after initialization
    grist.on('message', (e) => {
      if (e.tableId) {
        state.selectedTableId = e.tableId;
        console.log('Table ID set:', state.selectedTableId);
      }
    });

    // Set up record handlers
    grist.onRecords((data, mappings) => {
      try {
        state.selectedRecords = data;
        state.lastRecords = data;
        if (state.mode !== 'single') {
          updateMap(state.lastRecords);
          if (state.lastRecord) {
            selectOnMap(state.lastRecord);
          }
        }
        const defaultMap = defaultMapping(data[0], mappings);
        if (state.mapInitialized) {
          scanOnNeed(defaultMap);
        } else {
          setTimeout(() => {
            scanOnNeed(defaultMap);
          }, 500);
        }
      } catch (error) {
        console.error('Error in onRecords handler:', error);
      }
    });

    grist.onRecord((record, mappings) => {
      try {
        if (!record || !record.id) return;
        state.selectedRowId = record.id;
        if (state.mode === 'single') {
          state.lastRecord = record;
          selectOnMap(state.lastRecord);
        } else {
          const marker = selectMarker(record.id);
          if (marker) {
            zoomToMarker(marker);
          }
        }
        const defaultMap = defaultMapping(record, mappings);
        if (state.mapInitialized) {
          scanOnNeed(defaultMap);
        } else {
          setTimeout(() => {
            scanOnNeed(defaultMap);
          }, 500);
        }
      } catch (error) {
        console.error('Error in onRecord handler:', error);
      }
    });

    grist.onNewRecord(() => {
      if (state.markersLayer) {
        state.markersLayer.clearLayers();
      }
      state.cleanupHandlers.forEach(cleanup => cleanup());
      state.cleanupHandlers = [];
    });

  }).catch(error => {
    console.error('Failed to initialize Grist:', error);
    showProblem('Failed to initialize. Please refresh the page.');
  });
});

// Helper function to map column names (replace with proper mapping logic)
function mapColumnNames(data) {
  return data.map(record => ({
    ...record,
    Name: record.Name,
    Latitude: record.Latitude,
    Longitude: record.Longitude,
    Property_Type: record.Property_Type,
    Tenants: record.Tenants,
    Secondary_Type: record.Secondary_Type,
    ImageURL: record.ImageURL,
    CoStar_URL: record.CoStar_URL,
    County_Hyper: record.County_Hyper,
    GIS: record.GIS,
    Address: record.Address,
    GeocodedAddress: record.GeocodedAddress,
    Geocode: record.Geocode
  }));
}

// ... Rest of the functions ...



// Creates clusterIcons that highlight if they contain selected row

const selectedRowClusterIconFactory = function (selectedMarkerGetter) {
  return function (cluster) {
    const childCount = cluster.getChildCount();
    let isSelected = false;

    try {
      const selectedMarker = selectedMarkerGetter();
      if (selectedMarker) {
        isSelected = cluster.getAllChildMarkers().some(m => m.options.id === selectedMarker.options.id);
      }
    } catch (e) {
      console.error("Error in clusterIconFactory:", e);
    }

    let c = ' marker-cluster-';
    if (childCount < 10) {
      c += 'small';
    } else if (childCount < 100) {
      c += 'medium';
    } else {
      c += 'large';
    }

    return new L.DivIcon({
      html: '<div><span>' + childCount + '</span></div>',
      className: 'marker-cluster' + c + (isSelected ? ' marker-cluster-selected' : ''),
      iconSize: new L.Point(40, 40)
    });
  };
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
  if (m) { state.mode = m; }
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

async function scan(tableId, records, mappings) {

  if (!state.writeAccess || !tableId || !records || !mappings) {
    console.warn('Missing required parameters for scan');
    return;
  }

  try {
    for (const record of records) {
      // Skip if required fields are missing
      if (!record || !mappings[Address] || !record[mappings[Address]]) {
        continue;
      }

      const address = record[mappings[Address]];
      const hasGeocodeField = Geocode in mappings && record[mappings[Geocode]];
      const hasGeocodedAddressField = GeocodedAddress in mappings;

      // Check if we need to update coordinates
      const shouldUpdate = hasGeocodeField &&
        (!record[mappings[Longitude]] ||
          (hasGeocodedAddressField && record[mappings[GeocodedAddress]] !== address));

      if (shouldUpdate) {
        try {
          const result = await geocode(address);
          if (result) {
            const updates = {
              [mappings[Longitude]]: result.lng,
              [mappings[Latitude]]: result.lat
            };

            if (hasGeocodedAddressField) {
              updates[mappings[GeocodedAddress]] = address;
            }

            await grist.docApi.applyUserActions([
              ['UpdateRecord', tableId, record.id, updates]
            ]);

            await delay(1000); // Rate limiting
          }
        } catch (e) {
          console.error('Geocoding error for address:', address, e);
        }
      }
    }
  } catch (error) {
    console.error('Scan error:', error);
  }
}

function scanOnNeed(mappings) {
  // Only proceed if Grist is initialized AND we have a tableId
  if (!state.gristInitialized || !state.selectedTableId || !mappings) {
    if (!state.gristInitialized) {
      console.warn("Grist not fully initialized yet.");
    }
    if (!state.selectedTableId) {
      console.warn("Table ID not yet set.");
    }
    return;
  }

  if (!state.scanning) {
    try {
      if (!state.selectedRecords) {
        console.warn('No records selected');
        return;
      }
      state.scanning = scan(state.selectedTableId, state.selectedRecords, mappings)
        .then(() => state.scanning = null)
        .catch((error) => {
          console.error('Scan error:', error);
          state.scanning = null;
        });
    } catch (error) {
      console.error('Error in scanOnNeed:', error);
      state.scanning = null;
    }
  }
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

// Modified selectOnMap to check for map initialization
function selectOnMap(rec) {
  if (!state.mapInitialized || !state.markersLayer) {
    console.warn("Map not initialized in selectOnMap, delaying selection.");
    setTimeout(() => selectOnMap(rec), 500); // Retry
    return;
  }
  // If this is already selected row, do nothing (to avoid flickering)
  if (state.selectedRowId === rec.id) { return; }

  state.selectedRowId = rec.id;
  if (state.mode === 'single') {
    updateMap([rec]);
  } else {
    const marker = selectMaker(rec.id); // Call selectMaker *after* map initialization
    if (marker) {
      zoomToMarker(marker);
    }
  }
}



// Add helper function to handle marker zooming
function zoomToMarker(marker) {
  if (!marker) return;

  const cluster = state.markersLayer.getVisibleParent(marker);
  if (cluster) {
    const bounds = cluster.getBounds().pad(0.5);
    state.amap.fitBounds(bounds);
    setTimeout(() => {
      marker.openPopup();
    }, 500);
  } else {
    state.amap.setView(marker.getLatLng(), Math.max(state.amap.getZoom(), 15));
    marker.openPopup();
  }
}


// Add cleanup function
function cleanup() {
  // Clean up Grist handlers first
  try {
    if (state.gristInitialized) {
      grist.onRecord(() => { });
      grist.onRecords(() => { });
      grist.on('message', () => { });
      state.gristInitialized = false;
      state.selectedTableId = null;
      state.selectedRecords = null;
      state.selectedRowId = null;
    }
  } catch (e) {
    console.error('Error cleaning up Grist handlers:', e);
  }

  state.mapReady = false;
  state.mapInitialized = false;
  state.minimapInitialized = false;
  state.mapContainerReady = false;

  // Clean up map event handlers
  state.mapEventHandlers.forEach(cleanup => {
    try {
      cleanup();
    } catch (e) {
      console.error('Error cleaning up map event handler:', e);
    }
  });
  state.mapEventHandlers = [];

  // Clean up other event handlers
  state.cleanupHandlers.forEach(cleanup => {
    try {
      cleanup();
    } catch (e) {
      console.error('Error during cleanup:', e);
    }
  });
  state.cleanupHandlers = [];

  // Clean up search results and pane
  if (state.searchResults) {
    try {
      state.searchResults.clearLayers();
      if (state.amap) {
        state.amap.removeLayer(state.searchResults);
        if (state.amap.getPane('searchPane')) {
          state.amap.getPane('searchPane').remove();
        }
      }
      state.searchResults = null;
    } catch (e) {
      console.error('Error cleaning up search results:', e);
    }
  }

  // Clean up markers
  if (state.markersLayer) {
    try {
      state.markersLayer.clearLayers();
      if (state.amap) {
        state.amap.removeLayer(state.markersLayer);
      }
      state.markersLayer = null;
    } catch (e) {
      console.error('Error cleaning up markers:', e);
    }
  }

  // Clean up map
  if (state.amap) {
    try {
      // Remove all layers
      state.amap.eachLayer((layer) => {
        try {
          state.amap.removeLayer(layer);
        } catch (e) {
          console.error('Error removing layer:', e);
        }
      });

      // Remove map instance
      state.amap.remove();
      state.amap = null;
    } catch (e) {
      console.error('Error removing map:', e);
    }
  }

  // Clean up DOM
  if (state.mapContainer) {
    state.mapContainer.innerHTML = '';
  }

  // Reset minimap iframe
  const iframe = document.getElementById('googleMap');
  if (iframe) {
    iframe.src = 'about:blank';
  }
}

// Add window unload handlers and global error handler
window.addEventListener('unload', cleanup);
window.addEventListener('beforeunload', cleanup);

// Initialize Grist
document.addEventListener('DOMContentLoaded', () => {
  // Clean up any existing state
  cleanup();

  // Set up error handler first
  window.onerror = function (msg, url, lineNo, columnNo, error) {
    const errorDetails = {
      message: msg,
      url: url,
      line: lineNo,
      column: columnNo,
      error: error
    };
    console.error('Global error:', errorDetails);
    cleanup();
    showProblem('An error occurred. Please refresh the page.');
    return false;
  };

  // Initialize Grist with proper error handling
  grist.ready({
    columns: [
      { name: "Name", type: "Text" },
      { name: "Latitude", type: "Numeric" },
      { name: "Longitude", type: "Numeric" },
      { name: "Property_Type", type: "Choice", optional: true },
      { name: "Tenants", type: "ChoiceList", optional: true },
      { name: "Secondary_Type", type: "ChoiceList", optional: true },
      { name: "ImageURL", type: "Text", optional: true },
      { name: "CoStar_URL", type: "Text", optional: true },
      { name: "County_Hyper", type: "Text", optional: true },
      { name: "GIS", type: "Text", optional: true },
      { name: "Address", type: "Text", optional: true },
      { name: "GeocodedAddress", type: "Text", optional: true },
      { name: "Geocode", type: "Bool", optional: true }
    ],
    allowSelectBy:
              { name: "Geocode", type: "Bool", optional: true }
    ],
    allowSelectBy: true,
    // Correctly handle onEditPermission
    onEditPermission: (hasEditPerm) => {
      state.writeAccess = hasEditPerm;
    }
  }).then(() => {
    state.gristInitialized = true;
    console.log('Grist initialized');

    // Set up message handler after initialization
    grist.on('message', (e) => {
      if (e.tableId) {
        state.selectedTableId = e.tableId;
        console.log('Table ID set:', state.selectedTableId);
      }
    });

    // Set up record handlers.  Crucially, wait for map initialization.
    grist.onRecords((data, mappings) => {
      try {
          state.selectedRecords = data;
          state.lastRecords = grist.mapColumnNames(data) || data;
          if (state.mode !== 'single') {
            // Now it's safe to call updateMap
            updateMap(state.lastRecords);
            if (state.lastRecord) {
              selectOnMap(state.lastRecord);
            }
          }
          // Wait until *after* map initialization to scan.
          if (state.mapInitialized) {
            scanOnNeed(defaultMapping(data[0], mappings));
          } else {
            //If map is not initialized yet, set a timeout
            setTimeout(() => {
                scanOnNeed(defaultMapping(data[0], mappings));
              }, 500);
          }
      } catch (error) {
        console.error('Error in onRecords handler:', error);
      }
    });


    grist.onRecord((record, mappings) => {
      try {
        if (!record || !record.id) return;
        state.selectedRowId = record.id;
        if (state.mode === 'single') {
          state.lastRecord = grist.mapColumnNames(record) || record;
            // Now it's safe to call selectOnMap.
          selectOnMap(state.lastRecord);
            if (state.mapInitialized) {
                scanOnNeed(defaultMapping(record,mappings));
            } else {
                setTimeout(()=> {
                    scanOnNeed(defaultMapping(record, mappings));
                }, 500);
            }
        } else {
          const marker = selectMaker(record.id); // Call selectMaker *after* map initialization
          if (marker) {
            zoomToMarker(marker);
          }
        }
      } catch (error) {
        console.error('Error in onRecord handler:', error);
      }
    });


    grist.onNewRecord(() => {
      if (state.markersLayer) {
        state.markersLayer.clearLayers();
      }
      state.cleanupHandlers.forEach(cleanup => cleanup());
      state.cleanupHandlers = [];
    });


  }).catch(error => {
    console.error('Failed to initialize Grist:', error);
    showProblem('Failed to initialize. Please refresh the page.');
  });
});
