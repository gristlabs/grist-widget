"use strict";

/* global grist, window */

let amap;
let map; // Declare the map variable
let markersLayer;
let popups = {};
let selectedTableId = null;
let selectedRowId = null;
let selectedRecords = null;
let mode = 'multi';
let mapSource = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}';
let mapCopyright = 'Esri';
// Add these at the top of your file
const ZOOM_LEVEL = {
    DEFAULT: 4,
    SEARCH: 18,
    MARKER: 16
};

// Required columns
const Name = "Name";  // ReferenceList to Owners_
const Longitude = "Longitude";
const Latitude = "Latitude";
const Property_Id = "Property_Id";
const Property_Address = "Property_Address";
const ImageURL = "ImageURLs";
const CoStar_URL = "CoStar_URL";
const County_Hyper = "County_Hyper";
const GIS = "GIS";
const Geocode = "Geocode";
const Address = "Property_Address";
const GeocodedAddress = "GeocodedAddress";

let lastRecord;
let lastRecords;

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
        attribution: 'Google Hybrid'
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
        wheelPxPerZoomLevel: 120, // Increased for faster zooming
        zoomSnap: 0.5, // Smoother zoom transitions
        zoomDelta: 1.5 // Larger zoom steps
    });

    // Add layer control
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
                        icon: new L.Icon({
                            iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-gold.png',
                            shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
                            iconSize: [25, 41],
                            iconAnchor: [12, 41],
                            popupAnchor: [1, -34],
                            shadowSize: [41, 41]
                        })
                    }).addTo(searchResultsLayer);
                    
                    // Extract just the address and city from the display name
                    let displayParts = result.display_name.split(',');
                    let simplifiedAddress = displayParts.slice(0, 2).join(', ');
                    
                    // Add popup with simplified address info
                    marker.bindPopup(`<b>${simplifiedAddress}</b>`).openPopup();
                    
                    // Pan to the result
                    amap.setView([lat, lon], ZOOM_LEVEL.SEARCH);
                    
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
    
    // Add this back - it's crucial for marker-to-record interaction
    amap.on('popupopen', function(e) {
        const feature = e.popup._source;
        if (feature && feature.record) {
            grist.setCursorPos({rowId: feature.record.id}).catch(() => {});
        }
    });

    return amap;
}

function copyToClipboard(text) {
    // Create a temporary input element
    const tempInput = document.createElement('input');
    tempInput.style.position = 'absolute';
    tempInput.style.left = '-9999px';
    tempInput.value = text;
    document.body.appendChild(tempInput);

    // Select and copy the text
    tempInput.select();
    document.execCommand('copy');
    document.body.removeChild(tempInput);
}

function toggleDetails(element) {
    element.classList.toggle('expanded');
    const details = element.nextElementSibling;
    if (details) {
        details.classList.toggle('expanded');
    }
}

function createPopupContent(record) {
    const address = parseValue(record[Address]) || '';
    const propertyId = parseValue(record[Property_Id]) || '';
    const name = parseValue(record[Name]) || '';
    const imageUrl = parseValue(record[ImageURL]) || '';

    return `
    <div class="card">
        <figure>
            ${imageUrl ? `
            <img src="${imageUrl}" alt="${name}" />
            ` : `
            <div class="w-full h-[140px] bg-gray-100 flex items-center justify-center">
                <span class="text-gray-400">No Image</span>
            </div>
            `}
            <div class="action-buttons">
                <div class="button-container">
                    ${record[County_Hyper] ? `<a href="${record[County_Hyper]}" class="action-btn" title="County Property Search" target="_blank">🔍</a>` : ''}
                    ${record[GIS] ? `<a href="${record[GIS]}" class="action-btn" title="GIS" target="_blank">🌎</a>` : ''}
                    ${address ? `<button type="button" class="action-btn" onclick="copyToClipboard('${address.replace(/'/g, "\\'")}')" title="Copy Address">📋</button>` : ''}
                        <a href="https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${record[Latitude]},${record[Longitude]}" class="action-btn" title="Street View" target="_blank">🛣️</a>
                        ${record[CoStar_URL] ? `<a href="${record[CoStar_URL]}" class="action-btn" title="CoStar" target="_blank">🏢</a>` : ''}
                        </div>
                        </div>
                        </figure>
                        <div class="card-content">
                        <h2 onclick="toggleDetails(this)">${name}</h2>
                        <div class="details">
                        ${address ? `<p><strong>Address:</strong> <span class="copyable" onclick="copyToClipboard('${address.replace(/'/g, "\\'")}')">${address}</span></p>` : ''}
                        ${propertyId ? `<p><strong>Property ID:</strong> <span class="copyable" onclick="copyToClipboard('${propertyId.replace(/'/g, "\\'")}')">${propertyId}</span></p>` : ''}
            </div>
            </div>
    </div>
    `;
}

// Modify the updateMap function for better performance
function updateMap(data) {
    if (!amap) {
        amap = initializeMap();
    }

    // Store the currently selected marker ID before clearing
    const currentSelectedId = selectedRowId;

    // Always clear existing markers completely before adding new ones
    if (markersLayer) {
        markersLayer.clearLayers();
    } else {
        markersLayer = L.markerClusterGroup({
            chunkedLoading: false,
            spiderfyOnMaxZoom: true,
            disableClusteringAtZoom: 17,
            maxClusterRadius: 80,
            animate: false,
            zoomToBoundsOnClick: true,
            removeOutsideVisibleBounds: true,
            maxZoom: 18,
            singleMarkerMode: false,
            zoomToBoundsOptions: {
                padding: [20, 20],
                maxZoom: 17
            },
            spiderfyDistanceMultiplier: 1.5,
            showCoverageOnHover: false,
            zoomAnimation: false,
            // Optimize cluster icon creation
            iconCreateFunction: function(cluster) {
                const childCount = cluster.getChildCount();
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
                    className: 'marker-cluster' + c,
                    iconSize: new L.Point(40, 40)
                });
            }
        });
        amap.addLayer(markersLayer);
    }

    // Reset popups object to prevent duplicates
    popups = {};

    if (!Array.isArray(data) || data.length === 0) {
        console.log('No data to display on map');
        return;
    }

    // Process all markers at once instead of batching
    const allMarkers = [];
    
    // Create all markers in a single loop
    data.forEach(record => {
        const marker = createMarker(record);
        if (marker) {
            allMarkers.push(marker);
        }
    });
    
    // Add all markers to the layer at once
    if (allMarkers.length > 0) {
        markersLayer.addLayers(allMarkers);
        markersLayer.refreshClusters();
        console.log(`Loaded ${Object.keys(popups).length} markers out of ${data.length} records`);
    }
    
    // After all markers are loaded, check if we need to select one
    if (currentSelectedId) {
        const marker = popups[currentSelectedId];
        if (marker) {
            selectMaker(currentSelectedId);
        }
    }
}

// Modify createMarker function
// Add error handling for marker creation
function createMarker(record) {
    try {
        // Skip records with invalid coordinates
        if (!record || !record[Latitude] || !record[Longitude]) {
            return null;
        }
        
        // Parse coordinates once
        const lat = parseFloat(record[Latitude]);
        const lng = parseFloat(record[Longitude]);
        
        // Validate parsed coordinates
        if (isNaN(lat) || isNaN(lng)) {
            return null;
        }
        
        // Check if marker already exists for this record
        if (popups[record.id]) {
            return popups[record.id];
        }
        
        const marker = L.marker([lat, lng], {
            title: parseValue(record[Name]),
            icon: record.id === selectedRowId ? selectedIcon : defaultIcon,
            riseOnHover: true,
            zIndexOffset: record.id === selectedRowId ? 1000 : 0
        });

        // Add click event listener with detailed logging
        marker.on('click', function(event) {
            console.log(`🔍 Marker Click Handler - Record ID: ${record.id}`);
            L.DomEvent.stopPropagation(event);
            console.log('  ↳ Event propagation stopped');
            
            L.DomEvent.preventDefault(event);
            console.log('  ↳ Default behavior prevented');
            
            selectMaker(record.id);
            console.log('  ↳ selectMaker called');
            
            return false;
        });

        // Attach the record to the marker for Grist interaction
        marker.record = record;
        
        // Create popup content only when needed (lazy loading)
        const popupContent = createPopupContent(record);
        marker.bindPopup(popupContent, {
            maxWidth: 240,
            minWidth: 240,
            className: 'custom-popup',
            closeButton: true
        });

        popups[record.id] = marker;
        return marker;
    } catch (error) {
        console.error('Error creating marker for record:', record?.id, error);
        return null;
    }
}

// If widget has write access
let writeAccess = true;

// A ongoing scanning promise, to check if we are in progress.
let scanning = null;

async function scan(tableId, records, mappings) {
    if (!writeAccess) { return; }
    for (const record of records) {
        if (!(Geocode in record)) { break; }
        if (!record[Geocode]) { continue; }
        const address = record.Address;
        if (record[GeocodedAddress] && record[GeocodedAddress] !== record.Address) {
            record[Longitude] = null;
            record[Latitude] = null;
        }
        if (address && !record[Longitude]) {
            const result = await geocode(address);
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

function parseValue(v) {
    if (!v) return '';

    // Handle arrays (like ReferenceList)
    if (Array.isArray(v)) {
        return v.map(item => {
            if (item && typeof item === 'object' && item.Name) {
                return item.Name;
            }
            return item;
        }).join(", ");
    }

    // Handle objects (like Reference)
    if (typeof v === 'object') {
        if (v.Name) return v.Name;
        if (v.value && typeof v.value === 'string' && v.value.startsWith('V(')) {
            try {
                const payload = JSON.parse(v.value.slice(2, v.value.length - 1));
                return payload.remote || payload.local || payload.parent || payload;
            } catch (e) {
                return v.value;
            }
        }
        return v.toString();
    }

    return v.toString();
}

function getInfo(rec) {
    const result = {
        id: rec.id,
        name: parseValue(rec[Name]),
        lng: parseValue(rec[Longitude]),
        lat: parseValue(rec[Latitude]),
        propertyType: parseValue(rec['Property_Type']),
        tenants: parseValue(rec['Tenants']),
        secondaryType: parseValue(rec['Secondary_Type']),
        imageUrl: parseValue(rec['ImageURL']),
        costarLink: parseValue(rec['CoStar_URL']),
        countyLink: parseValue(rec['County_Hyper']),
        gisLink: parseValue(rec['GIS']),
    };
    return result;
}

// Improved marker selection with better map centering
function selectMaker(id) {
    try {
        console.log(`selectMaker called with ID: ${id}`); // At the start
        
        // Check if id is valid
        if (!id) {
            console.warn('Invalid ID provided to selectMaker');
            return null;
        }
        
        // Reset previous marker icon
        const previouslyClicked = popups[selectedRowId];
        if (previouslyClicked) {
            previouslyClicked.setIcon(defaultIcon);
            previouslyClicked.setZIndexOffset(0);
        }

        // Get the marker for this ID
        const marker = popups[id];
        if (!marker) {
            console.warn('No marker found for ID:', id);
            return null;
        }

        // Update selected row ID and marker icon
        selectedRowId = id;
        marker.setIcon(selectedIcon);
        marker.setZIndexOffset(1000); // Ensure selected marker appears above others
        
        // Get marker coordinates
        const latlng = marker.getLatLng();
        console.log(`Centering map on marker at [${latlng.lat}, ${latlng.lng}] with zoom ${ZOOM_LEVEL.MARKER}`);
        
        // If the marker is in a cluster, handle it appropriately
        if (markersLayer && typeof markersLayer.zoomToShowLayer === 'function') {
            try {
                markersLayer.zoomToShowLayer(marker, function() {
                    // Use panTo instead of setView to maintain zoom level
                    amap.panTo(latlng, {
                        animate: true,
                        duration: 0.3
                    });
                    
                    console.log(`About to open popup for marker: ${id}`); // Before openPopup
                    marker.openPopup(); // Existing line
                    console.log(`Popup opened for marker: ${id}`); // After openPopup
                });
            } catch (e) {
                console.warn('Error in zoomToShowLayer:', e);
                // Fallback: pan to marker and open popup
                amap.panTo(latlng, {
                    animate: true,
                    duration: 0.3
                });
                console.log(`About to open popup for marker (fallback): ${id}`);
                marker.openPopup();
                console.log(`Popup opened for marker (fallback): ${id}`);
            }
        } else {
            // Direct marker handling
            amap.panTo(latlng, {
                animate: true,
                duration: 0.3
            });
            console.log(`About to open popup for marker (direct): ${id}`);
            marker.openPopup();
            console.log(`Popup opened for marker (direct): ${id}`);
        }

        // Refresh clusters to update their appearance
        if (markersLayer) {
            markersLayer.refreshClusters();
        }

        // Update the selected row in Grist
        grist.setCursorPos?.({rowId: id}).catch(() => {});

        console.log(`selectMaker completed for ID: ${id}`); // At the end
        return marker;
    } catch (error) {
        console.error('Error selecting marker:', error);
        return null;
    }
}

// Add the defaultMapping function to fix the 'defaultMapping is not defined' error
function defaultMapping(record, mappings) {
    // Create a default mapping object if mappings is undefined
    if (!mappings) {
        return {
            [Name]: Name,
            [Longitude]: Longitude,
            [Latitude]: Latitude,
            [Property_Id]: Property_Id,
            [Property_Address]: Property_Address,
            [ImageURL]: ImageURL,
            [CoStar_URL]: CoStar_URL,
            [County_Hyper]: County_Hyper,
            [GIS]: GIS,
            [Geocode]: Geocode,
            [Address]: Address,
            [GeocodedAddress]: GeocodedAddress
        };
    }
    
    // If mappings is provided, use it
    return mappings;
}

// Helper function to select a record on the map
function selectOnMap(record) {
    if (!record || !record.id) return;
    
    const marker = popups[record.id];
    if (marker) {
        selectMaker(record.id);
    } else {
        console.warn('No marker found for record:', record.id);
    }
}

// Remove duplicate event handlers and consolidate them
// This is the only onRecords handler we need
grist.onRecords((data, mappings) => {
    // Ensure data is an array
    lastRecords = Array.isArray(data) ? (grist.mapColumnNames(data) || data) : [];
    
    if (mode !== 'single') {
        updateMap(lastRecords);
        if (lastRecord && lastRecord.id) {
            setTimeout(() => {
                selectOnMap(lastRecord);
            }, 100); // Small delay to ensure markers are loaded
        }
    }
    
    if (lastRecords.length > 0) {
        scanOnNeed(defaultMapping(lastRecords[0], mappings));
    }
});

// This is the only onRecord handler we need
grist.onRecord((record, mappings) => {
    lastRecord = grist.mapColumnNames(record) || record;
    
    if (mode === 'single') {
        updateMap([lastRecord]);
        selectOnMap(lastRecord);
        scanOnNeed(defaultMapping(record, mappings));
    } else {
        selectOnMap(record);
    }
});

// Handle new records
grist.onNewRecord(() => {
    if (markersLayer) {
        markersLayer.clearLayers();
    }
});

// Update mode function
function updateMode() {
    if (mode === 'single' && lastRecord) {
        selectedRowId = lastRecord.id;
        updateMap([lastRecord]);
    } else if (lastRecords && lastRecords.length > 0) {
        updateMap(lastRecords);
    }
}

function onEditOptions() {
    const popup = document.getElementById("settings");
    popup.style.display = 'block';
    const btnClose = document.getElementById("btnClose");
    btnClose.onclick = () => popup.style.display = 'none';
    const checkbox = document.getElementById('cbxMode');
    checkbox.checked = mode === 'multi' ? true : false;
    checkbox.onchange = async (e) => {
        const newMode = e.target.checked ? 'multi' : 'single';
        if (newMode != mode) {
            mode = newMode;
            await grist.setOption('mode', mode);
            updateMode();
        }
    }
    [ "mapSource", "mapCopyright" ].forEach((opt) => {
        const ipt = document.getElementById(opt)
        ipt.onchange = async (e) => {
            await grist.setOption(opt, e.target.value);
        }
    })
}

document.addEventListener("DOMContentLoaded", function () {
    grist.ready({
        columns: [
            "Name",  // Accept any type for Name
            { name: "Longitude", type: "Numeric" },
            { name: "Latitude", type: "Numeric" },
            { name: "Property_Id", type: "Text" },
            { name: "Property_Address", type: "Text" },
            { name: "ImageURLs", type: "Text", optional: true },
            { name: "CoStar_URL", type: "Text", optional: true },
            { name: "County_Hyper", type: "Text", optional: true },
            { name: "GIS", type: "Text", optional: true },
            { name: "Geocode", type: "Bool", title: "Geocode", optional: true },
            { name: "GeocodedAddress", type: "Text", title: "Geocoded Address", optional: true },
        ],
        allowSelectBy: true,
        onEditOptions
    });
});

grist.onOptions((options, interaction) => {
    writeAccess = interaction.accessLevel === 'full';
    const newMode = options?.mode ?? mode;
    mode = newMode;
    if (newMode != mode && lastRecords) {
        updateMode();
    }

    const newSource = options?.mapSource ?? mapSource;
    mapSource = newSource;
    const mapSourceElement = document.getElementById("mapSource");
    if (mapSourceElement) {
        mapSourceElement.value = mapSource;
    }
    const newCopyright = options?.mapCopyright ?? mapCopyright;
    mapCopyright = newCopyright;
    const mapCopyrightElement = document.getElementById("mapCopyright");
    if (mapCopyrightElement) {
        mapCopyrightElement.value = mapCopyright;
    }
});

// We're using the improved selection handler defined earlier in the file
// No need for a duplicate handler here

// Helper function to select a record on the map
function selectOnMap(record) {
    if (!record || !record.id) return;
    
    const marker = popups[record.id];
    if (marker) {
        selectMaker(record.id);
    } else {
        console.warn('No marker found for record:', record.id);
    }
}

function updateMode() {
    if (mode === 'single') {
        selectedRowId = lastRecord.id;
        updateMap([lastRecord]);
    } else {
        updateMap(lastRecords);
    }
}

function onEditOptions() {
    const popup = document.getElementById("settings");
    popup.style.display = 'block';
    const btnClose = document.getElementById("btnClose");
    btnClose.onclick = () => popup.style.display = 'none';
    const checkbox = document.getElementById('cbxMode');
    checkbox.checked = mode === 'multi' ? true : false;
    checkbox.onchange = async (e) => {
        const newMode = e.target.checked ? 'multi' : 'single';
        if (newMode != mode) {
            mode = newMode;
            await grist.setOption('mode', mode);
            updateMode();
        }
    }
    [ "mapSource", "mapCopyright" ].forEach((opt) => {
        const ipt = document.getElementById(opt)
        ipt.onchange = async (e) => {
            await grist.setOption(opt, e.target.value);
        }
    })
}

document.addEventListener("DOMContentLoaded", function () {
    grist.ready({
        columns: [
            "Name",  // Accept any type for Name
            { name: "Longitude", type: "Numeric" },
            { name: "Latitude", type: "Numeric" },
            { name: "Property_Id", type: "Text" },
            { name: "Property_Address", type: "Text" },
            { name: "ImageURLs", type: "Text", optional: true },
            { name: "CoStar_URL", type: "Text", optional: true },
            { name: "County_Hyper", type: "Text", optional: true },
            { name: "GIS", type: "Text", optional: true },
            { name: "Geocode", type: "Bool", title: "Geocode", optional: true },
            { name: "GeocodedAddress", type: "Text", title: "Geocoded Address", optional: true },
        ],
        allowSelectBy: true,
        onEditOptions
    });
});

grist.onOptions((options, interaction) => {
    writeAccess = interaction.accessLevel === 'full';
    const newMode = options?.mode ?? mode;
    mode = newMode;
    if (newMode != mode && lastRecords) {
        updateMode();
    }

    const newSource = options?.mapSource ?? mapSource;
    mapSource = newSource;
    const mapSourceElement = document.getElementById("mapSource");
    if (mapSourceElement) {
        mapSourceElement.value = mapSource;
    }
    const newCopyright = options?.mapCopyright ?? mapCopyright;
    mapCopyright = newCopyright;
    const mapCopyrightElement = document.getElementById("mapCopyright");
    if (mapCopyrightElement) {
        mapCopyrightElement.value = mapCopyright;
    }
});

// We're using the improved selection handler defined earlier in the file
// No need for a duplicate handler here