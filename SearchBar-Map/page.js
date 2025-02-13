"use strict";

/* global grist, window, L */

// Core state variables (initialized to safe defaults)
let selectedTableId = null;
let writeAccess = true;
let scanning = null;
let amap = null;
let markersLayer = null; // Initialize to null
let mapContainer = null;
let selectedRowId = null;
let selectedRecords = null;
let mode = 'multi';
let lastRecord = null;
let lastRecords = null;

// Handlers and initialization flags
let cleanupHandlers = [];
let mapEventHandlers = [];
let mapInitialized = false;
let minimapInitialized = false;
let searchResults = null;
let mapReady = false;
let initializationInProgress = false;
let mapContainerReady = false;
let popups = {};

// A flag to track if Grist is fully initialized
let gristInitialized = false;


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
            disableClusteringAtZoom: 19,
            spiderfyDistanceMultiplier: 1.5,
            iconCreateFunction: selectedRowClusterIconFactory(() => {
                // Use markersLayer directly, as it's now guaranteed to be initialized
                return markersLayer.getLayers().find(m => m.options.id === selectedRowId);
            })
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
            mapInitialized = true;  // Set the flag here
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
    if (!records) {
        console.warn('No records provided to updateMap');
        return;
    }

    // Check if map and markersLayer are initialized before proceeding
    if (!mapInitialized || !markersLayer) {
        console.warn('Map or markersLayer not fully initialized, delaying update');
        setTimeout(() => updateMap(records), 500); // Retry after a short delay
        return;
    }


    try {
        if (!records.length) {
            showProblem("No data found yet");
            return;
        }

        // Clean up existing markers and handlers
        markersLayer.clearLayers(); // Clear existing markers
        cleanupHandlers.forEach(cleanup => cleanup());
        cleanupHandlers = [];

        const batchSize = 100;
        const markers = [];

        for (let i = 0; i < records.length; i += batchSize) {
            const batch = records.slice(i, i + batchSize);
            batch.forEach(record => {
                if (!record.Latitude || !record.Longitude) return;

                const marker = L.marker([record.Latitude, record.Longitude], {
                    title: record.Name || '',
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

        if (markers.length > 0) {
            markersLayer.addLayers(markers);

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
    // Ensure markersLayer exists and has the getLayers method
    if (!markersLayer || typeof markersLayer.getLayers !== 'function') {
        console.warn('markersLayer is not properly initialized.');
        return;
    }
    if (!id) {
        console.warn('Invalid marker selection attempt');
        return;
    }

    try {
        const markers = markersLayer.getLayers();
        if (!markers || !markers.length) {
            console.warn('No markers available');
            return;
        }

        const previousMarker = markers.find(m => m.options.id === selectedRowId);
        if (previousMarker) {
            previousMarker.setIcon(defaultIcon);
        }

        const newMarker = markers.find(m => m.options.id === id);
        if (!newMarker) {
            // console.warn(`Marker with id ${id} not found.`);  // Optional: Less verbose warning
            return;
        }

        selectedRowId = id;
        newMarker.setIcon(selectedIcon);
        newMarker.openPopup();

        grist.setCursorPos?.({ rowId: id }).catch(console.error);
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

async function scan(tableId, records, mappings) {

    if (!writeAccess || !tableId || !records || !mappings) {
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
    if (!gristInitialized || !selectedTableId || !mappings) {
        if (!gristInitialized) {
            console.warn("Grist not fully initialized yet.");
        }
        if (!selectedTableId) {
            console.warn("Table ID not yet set.");
        }
        return;
    }

    if (!scanning) {
        try {
            if (!selectedRecords) {
                console.warn('No records selected');
                return;
            }
            scanning = scan(selectedTableId, selectedRecords, mappings)
                .then(() => scanning = null)
                .catch((error) => {
                    console.error('Scan error:', error);
                    scanning = null;
                });
        } catch (error) {
            console.error('Error in scanOnNeed:', error);
            scanning = null;
        }
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
    if (!mapInitialized || !markersLayer) {
        console.warn("Map not initialized in selectOnMap, delaying selection.");
        setTimeout(() => selectOnMap(rec), 500); // Retry
        return;
    }
    // If this is already selected row, do nothing (to avoid flickering)
    if (selectedRowId === rec.id) { return; }

    selectedRowId = rec.id;
    if (mode === 'single') {
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

    const cluster = markersLayer.getVisibleParent(marker);
    if (cluster) {
        const bounds = cluster.getBounds().pad(0.5);
        amap.fitBounds(bounds);
        setTimeout(() => {
            marker.openPopup();
        }, 500);
    } else {
        amap.setView(marker.getLatLng(), Math.max(amap.getZoom(), 15));
        marker.openPopup();
    }
}


// Add cleanup function
function cleanup() {
    // Clean up Grist handlers first
    try {
        if (gristInitialized) {
            grist.onRecord(() => { });
            grist.onRecords(() => { });
            grist.on('message', () => { });
            gristInitialized = false;
            selectedTableId = null;
            selectedRecords = null;
            selectedRowId = null;
        }
    } catch (e) {
        console.error('Error cleaning up Grist handlers:', e);
    }

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
