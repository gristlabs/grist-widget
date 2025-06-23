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
    // Remove any layer control UI (top right)
    // (Do not add L.control.layers)
    // Remove the bottom right layer-controls div if it exists
    document.addEventListener('DOMContentLoaded', function() {
      const layerControls = document.querySelector('.layer-controls');
      if (layerControls) layerControls.remove();
    });
    
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

    initializeGeminiUI(data);
}

// Modify createMarker function
// Add error handling for marker creation
function createMarker(record) {
    try {
        if (!record || !record[Latitude] || !record[Longitude]) {
            return null;
        }
        const lat = parseFloat(record[Latitude]);
        const lng = parseFloat(record[Longitude]);
        if (isNaN(lat) || isNaN(lng)) {
            return null;
        }
        if (popups[record.id]) {
            return popups[record.id];
        }
        // Use only Classify_Color for marker color
        const classification = record["Classify_Color"] || "Never";
        console.log('Marker classification for record', record.id, ':', classification);
        const marker = L.marker([lat, lng], {
            title: parseValue(record[Name]),
            icon: getMarkerIcon(classification),
            riseOnHover: true,
            zIndexOffset: record.id === selectedRowId ? 1000 : 0
        });
        marker.on('click', function(event) {
            L.DomEvent.stopPropagation(event);
            L.DomEvent.preventDefault(event);
            selectMaker(record.id);
            return false;
        });
        marker.record = record;
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

// --- Gemini-Style Sidebar, Legend, and County Info Logic ---

// 1. Classification Colors (same as Gemini)
const classificationColors = {
  "Not Interested/DNC": "#FF5252",
  "IPA": "#9C27B0",
  "Eric": "#FF9800",
  "Broker/Eh": "#9E9E9E",
  "Never": "#2196F3",
  "Call Relationship": "#FFEB3B",
  "Contact": "#4CAF50",
  "Call Again": "#92d694"
};
// Helper to get color for a classification
function getClassificationColor(classification) {
  return classificationColors[classification] || classificationColors["Never"];
}
// Gemini-style marker icons for each classification
const classifyIcons = {
  "Not Interested/DNC": new L.Icon({ iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png', shadowUrl: 'marker-shadow.png', iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41] }),
  "IPA": new L.Icon({ iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-violet.png', shadowUrl: 'marker-shadow.png', iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41] }),
  "Eric": new L.Icon({ iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-orange.png', shadowUrl: 'marker-shadow.png', iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41] }),
  "Broker/Eh": new L.Icon({ iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-grey.png', shadowUrl: 'marker-shadow.png', iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41] }),
  "Never": new L.Icon({ iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png', shadowUrl: 'marker-shadow.png', iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41] }),
  "Call Relationship": new L.Icon({ iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-yellow.png', shadowUrl: 'marker-shadow.png', iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41] }),
  "Contact": new L.Icon({ iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png', shadowUrl: 'marker-shadow.png', iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41] }),
  "Call Again": new L.Icon({ iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png', shadowUrl: 'marker-shadow.png', iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41] })
};
function getMarkerIcon(classification) {
  return classifyIcons[classification] || classifyIcons["Never"];
}

// 2. Sidebar State
let sidebarVisible = false;
let sidebarDetailActive = false;
let sidebarProperties = [];
let sidebarSearch = '';
let sidebarSearchType = 'property';
let sidebarActiveFilters = {};
let sidebarLastData = [];

// 3. Helper: Show Toast
function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast-notification ${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.classList.add('active'), 10);
  setTimeout(() => {
    toast.classList.remove('active');
    setTimeout(() => { if (toast.parentNode) document.body.removeChild(toast); }, 300);
  }, 3000);
}

// 4. Helper: Copy to Clipboard
function copyToClipboardGemini(text) {
  if (!text || typeof text !== 'string') return;
  navigator.clipboard.writeText(text).then(() => {
    const tooltip = document.createElement('div');
    tooltip.className = 'copy-tooltip active';
    tooltip.textContent = 'Copied!';
    document.body.appendChild(tooltip);
    setTimeout(() => { tooltip.classList.remove('active'); setTimeout(() => { if (tooltip.parentNode) document.body.removeChild(tooltip); }, 300); }, 1200);
  }, () => showToast('Failed to copy text.', 'error'));
}

// 5. Sidebar Toggle Button (bottom left)
function setupSidebarToggle() {
  if (document.getElementById('sidebar-toggle')) return;
  const button = document.createElement('button');
  button.className = 'sidebar-toggle-button';
  button.id = 'sidebar-toggle';
  button.innerHTML = '📋';
  button.title = 'Toggle Properties Sidebar';
  button.style.position = 'absolute';
  button.style.bottom = '30px';
  button.style.left = '10px';
  button.onclick = function() {
    sidebarVisible = !sidebarVisible;
    document.getElementById('sidebar').classList.toggle('active', sidebarVisible);
    if (sidebarVisible) updateSidebar();
  };
  document.body.appendChild(button);
}

// 6. Layer Controls
// Remove setupLayerControls function and all calls to it
// Remove any references to layer control buttons or related DOM elements

// 7. Sidebar Search Type Toggle
function setupSidebarSearchType() {
  const sidebarHeader = document.querySelector('.sidebar-header');
  if (!sidebarHeader || sidebarHeader.querySelector('.search-type-toggle')) return;
  const searchTypeToggle = document.createElement('div');
  searchTypeToggle.className = 'search-type-toggle';
  searchTypeToggle.innerHTML = `
    <button class="search-type-button active" data-type="property">Property</button>
    <button class="search-type-button" data-type="address">Address</button>
    <button class="search-type-button" data-type="owner">Owner</button>
    <button class="search-type-button" data-type="tenant">Tenant</button>
  `;
  sidebarHeader.appendChild(searchTypeToggle);
  const toggleButtons = searchTypeToggle.querySelectorAll('.search-type-button');
  toggleButtons.forEach(btn => {
    btn.onclick = function() {
      if (this.classList.contains('active')) return;
      toggleButtons.forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      sidebarSearchType = this.getAttribute('data-type');
      document.getElementById('sidebar-search').placeholder =
        sidebarSearchType === 'address' ? 'Search address...'
        : sidebarSearchType === 'owner' ? 'Search by owner name...'
        : sidebarSearchType === 'tenant' ? 'Search by tenant name...'
        : 'Search properties...';
      sidebarSearch = '';
      document.getElementById('sidebar-search').value = '';
      updateSidebar();
    };
  });
}

// 8. Sidebar Search/Filter
function setupSidebarSearch() {
  const searchInput = document.getElementById('sidebar-search');
  const clearBtn = document.getElementById('clear-search');
  if (!searchInput || !clearBtn) return;
  let debounceTimeout;
  searchInput.oninput = function() {
    clearTimeout(debounceTimeout);
    debounceTimeout = setTimeout(() => {
      sidebarSearch = this.value;
      updateSidebar();
    }, 300);
  };
  clearBtn.onclick = function() {
    searchInput.value = '';
    sidebarSearch = '';
    updateSidebar();
  };
}

// 9. Sidebar Close Button
function setupSidebarClose() {
  const closeBtn = document.getElementById('close-sidebar');
  if (!closeBtn) return;
  closeBtn.onclick = function() {
    sidebarVisible = false;
    document.getElementById('sidebar').classList.remove('active');
    sidebarDetailActive = false;
    document.getElementById('property-details').classList.add('hidden');
    document.getElementById('property-list').classList.remove('hidden');
  };
}

// 10. Sidebar List & Details Rendering
function updateSidebar(data) {
  // Use last loaded data if not provided
  if (!data) data = sidebarLastData;
  if (!Array.isArray(data)) return;
  sidebarLastData = data;
  // Filter by map bounds and search/filter
  const bounds = amap.getBounds();
  let visible = data.filter(rec => {
    const lat = parseFloat(rec[Latitude]);
    const lng = parseFloat(rec[Longitude]);
    if (isNaN(lat) || isNaN(lng)) return false;
    const inBounds = bounds.contains(L.latLng(lat, lng));
    // Classification filter
    let matchesClass = true;
    if (Object.keys(sidebarActiveFilters).length > 0) {
      const classify = rec['Name_Classify_Color'] || rec['Classify_Color'] || rec['Classify'] || '';
      matchesClass = !!sidebarActiveFilters[classify];
    }
    // Search filter
    let matchesSearch = true;
    if (sidebarSearch) {
      const s = sidebarSearch.toLowerCase();
      if (sidebarSearchType === 'address') {
        matchesSearch = (rec['Address_Concatenate'] || rec[Property_Address] || '').toLowerCase().includes(s);
      } else if (sidebarSearchType === 'owner') {
        matchesSearch = (rec['PrimaryOwner'] || rec['Name'] || '').toLowerCase().includes(s);
      } else if (sidebarSearchType === 'tenant') {
        matchesSearch = (rec['Tenants'] || '').toLowerCase().includes(s);
      } else {
        // property/general
        matchesSearch = [rec['Name'], rec['Property_Name'], rec['Address_Concatenate'], rec['PrimaryOwner'], rec['Property_Type'], rec['Secondary_Type'], rec['City'], rec['County'], rec['Parcel'], rec['Tenants']]
          .map(x => (x || '').toString().toLowerCase()).some(x => x.includes(s));
      }
    }
    return inBounds && matchesClass && matchesSearch;
  });
  sidebarProperties = visible;
  // Render list
  const propertyList = document.getElementById('property-list');
  const propertyCount = document.getElementById('property-count');
  if (!propertyList || !propertyCount) return;
  propertyCount.textContent = `${visible.length} properties`;
  propertyList.innerHTML = '';
  visible.forEach(rec => {
    const id = rec.id;
    const img = rec['Pop_up_IMG'] || rec['ImageURLs'] || '';
    const name = rec['Name'] || rec['Property_Name'] || 'Unnamed';
    const addr = rec['Address_Concatenate'] || rec[Property_Address] || '';
    const type = rec['Property_Type'] || '';
    const stype = rec['Secondary_Type'] || '';
    const classify = rec['Name_Classify_Color'] || rec['Classify_Color'] || rec['Classify'] || '';
    const color = getClassificationColor(classify);
    const item = document.createElement('div');
    item.className = 'property-item';
    item.dataset.id = id;
    item.innerHTML = `
      <div class="classification-indicator" style="background-color: ${color};"></div>
      <div class="property-thumbnail">${img ? `<img src="${img}" alt="${name}" loading="lazy" onerror="this.onerror=null;this.replaceWith('<span>No Img</span>')">` : '<span>No Img</span>'}</div>
      <div class="property-info">
        <h4>${name}</h4>
        ${(type || stype) ? `<div class="property-type">${type}${type && stype ? ' - ' : ''}${stype}</div>` : ''}
        <div class="property-address">${addr}</div>
        <div class="property-id">ID: <span class="id-copy" data-copy-id="${id}" title="Click to copy ID">${id}</span></div>
      </div>
    `;
    item.onclick = function(e) {
      if (e.target.classList.contains('id-copy')) {
        copyToClipboardGemini(id);
        return;
      }
      showSidebarDetails(id);
      document.querySelectorAll('.property-item.active').forEach(x => x.classList.remove('active'));
      item.classList.add('active');
    };
    propertyList.appendChild(item);
  });
  if (!sidebarDetailActive) {
    document.getElementById('property-details').classList.add('hidden');
    propertyList.classList.remove('hidden');
  }
}

// 11. Sidebar Details View
function showSidebarDetails(id) {
  const rec = sidebarProperties.find(r => r.id === id);
  if (!rec) return;
  sidebarDetailActive = true;
  const details = document.getElementById('property-details');
  const list = document.getElementById('property-list');
  if (!details || !list) return;
  // Build details HTML (simplified for now)
  details.innerHTML = `
    <div class="details-inner-container">
      <div class="property-nav-bar">
        <button class="back-button">← Back</button>
      </div>
      <div class="details-view-header">
        <div class="details-view-image">${rec['Pop_up_IMG'] ? `<img src="${rec['Pop_up_IMG']}" alt="${rec['Name']}" onerror="this.onerror=null;this.src='https://placehold.co/400x200/e5e7eb/9ca3af?text=No+Image+Available';">` : `<div class="no-image">No Image Available</div>`}</div>
        <div class="details-view-info">
          <h3 class="details-view-owner copy-button" data-copy-text="${rec['PrimaryOwner'] || ''}" title="Click to copy Owner Name">${rec['PrimaryOwner'] || ''}</h3>
          <div class="details-view-type">${rec['Property_Type'] || ''}${rec['Property_Type'] && rec['Secondary_Type'] ? ' | ' : ''}${rec['Secondary_Type'] || ''}</div>
          <div class="details-view-address copy-button" data-copy-text="${rec['Address_Concatenate'] || ''}" title="Click to copy Address">${rec['Address_Concatenate'] || ''}</div>
          <div class="details-view-ids">
            <span>ID: <span class="copy-button id-copy" data-copy-text="${rec.id}" title="Click to copy ID">${rec.id}</span></span>
            <span>Parcel: <span class="copy-button id-copy" data-copy-text="${rec['Parcel'] || ''}" title="Click to copy Parcel">${rec['Parcel'] || ''}</span></span>
          </div>
        </div>
      </div>
      <div class="details-section">
        <h4 class="collapsible-header collapsed" data-section="phones">Phone Numbers <span class="toggle-icon">▶</span></h4>
        <div class="collapsible-content hidden">
          <div class="phone-details-table">
            <table><thead><tr><th>Phone</th><th>Notes</th></tr></thead><tbody>
              ${(rec['Phone'] ? `<tr><td>${rec['Phone']}</td><td>${rec['Phone_1_Notes'] || ''}</td></tr>` : '')}
              ${(rec['Phone_2'] ? `<tr><td>${rec['Phone_2']}</td><td>${rec['Phone_2_Notes'] || ''}</td></tr>` : '')}
              ${(rec['Phone_3'] ? `<tr><td>${rec['Phone_3']}</td><td>${rec['Phone_3_Notes'] || ''}</td></tr>` : '')}
              ${(rec['Phone_4'] ? `<tr><td>${rec['Phone_4']}</td><td>${rec['Phone_4_Notes'] || ''}</td></tr>` : '')}
              ${(rec['Wrong_Phone'] ? `<tr><td colspan="2">Wrong: ${rec['Wrong_Phone']}</td></tr>` : '')}
            </tbody></table>
          </div>
        </div>
      </div>
      <div class="details-section">
        <h4 class="collapsible-header collapsed" data-section="property">Property Details <span class="toggle-icon">▶</span></h4>
        <div class="collapsible-content hidden">
          <div class="details-grid">
            <div><span class="details-label">Building Size:</span> <span class="details-value">${rec['RBA'] || 'N/A'} SF</span></div>
            <div><span class="details-label">Land Size:</span> <span class="details-value">${rec['Land'] || 'N/A'} SF</span></div>
            <div><span class="details-label">Year Built:</span> <span class="details-value">${rec['YearB'] || 'N/A'}</span></div>
            <div><span class="details-label">Year Renovated:</span> <span class="details-value">${rec['YearR'] || 'N/A'}</span></div>
            <div><span class="details-label">Tenancy:</span> <span class="details-value">${rec['Tenancy'] || 'N/A'}</span></div>
            <div><span class="details-label">Parcel:</span> <span class="details-value">${rec['Parcel'] || 'N/A'}</span></div>
            <div><span class="details-label">County:</span> <span class="details-value">${rec['County'] || 'N/A'}</span></div>
          </div>
        </div>
      </div>
    </div>
  `;
  details.classList.remove('hidden');
  list.classList.add('hidden');
  details.scrollTop = 0;
  // Back button
  details.querySelector('.back-button').onclick = function() {
    sidebarDetailActive = false;
    details.classList.add('hidden');
    list.classList.remove('hidden');
    document.querySelectorAll('.property-item.active').forEach(x => x.classList.remove('active'));
  };
  // Copy buttons
  details.querySelectorAll('.copy-button').forEach(btn => {
    btn.onclick = function() {
      const text = this.getAttribute('data-copy-text');
      if (text) copyToClipboardGemini(text);
    };
  });
  // Collapsible sections
  details.querySelectorAll('.collapsible-header').forEach(header => {
    const content = header.nextElementSibling;
    header.onclick = function() {
      content.classList.toggle('hidden');
      header.classList.toggle('collapsed');
      header.querySelector('.toggle-icon').textContent = content.classList.contains('hidden') ? '▶' : '▼';
    };
  });
}

// 12. Legend Logic
function setupLegend() {
  const legend = document.getElementById('map-legend');
  if (!legend) return;
  legend.innerHTML = '';
  const header = document.createElement('div');
  header.className = 'legend-header';
  header.innerHTML = '<h4>Map Legend</h4>';
  legend.appendChild(header);
  const content = document.createElement('div');
  content.className = 'legend-content';
  let itemsHTML = '<div class="legend-items">';
  itemsHTML += `
    <div class="legend-item interactive" data-classification="all">
      <label class="legend-checkbox-label">
        <input type="checkbox" class="legend-checkbox" data-classification="all" checked>
        <span class="checkmark"></span>
        <span class="label">All Types</span>
      </label>
    </div>
    <div class="legend-divider"></div>
  `;
  for (const [name, color] of Object.entries(classificationColors)) {
    itemsHTML += `
      <div class="legend-item interactive" data-classification="${name}">
        <label class="legend-checkbox-label">
          <input type="checkbox" class="legend-checkbox" data-classification="${name}">
          <span class="color-indicator" style="background-color: ${color};"></span>
          <span class="label">${name}</span>
        </label>
      </div>`;
  }
  itemsHTML += '</div>';
  content.innerHTML = itemsHTML;
  legend.appendChild(content);
  header.onclick = function() {
    content.classList.toggle('hidden');
  };
  setTimeout(() => {
    const allCheckbox = content.querySelector('input[data-classification="all"]');
    const typeCheckboxes = content.querySelectorAll('input[data-classification]:not([data-classification="all"])');
    if (allCheckbox) {
      allCheckbox.onchange = function() {
        if (this.checked) {
          typeCheckboxes.forEach(cb => cb.checked = false);
          sidebarActiveFilters = {};
          updateSidebar();
        } else {
          const anyChecked = Array.from(typeCheckboxes).some(cb => cb.checked);
          if (!anyChecked) this.checked = true;
        }
      };
    }
    typeCheckboxes.forEach(cb => {
      cb.onchange = function() {
        const classification = this.getAttribute('data-classification');
        if (this.checked) {
          if (allCheckbox) allCheckbox.checked = false;
          sidebarActiveFilters[classification] = true;
        } else {
          delete sidebarActiveFilters[classification];
          if (Object.keys(sidebarActiveFilters).length === 0 && allCheckbox) allCheckbox.checked = true;
        }
        updateSidebar();
      };
    });
    if (allCheckbox) allCheckbox.checked = true;
    typeCheckboxes.forEach(cb => cb.checked = false);
    sidebarActiveFilters = {};
  }, 300);
}

// 13. County Info Card (inline countyUrls from Gemini)
const countyUrls = {
  'BAKER': { taxUrl: 'https://www4.bakercountyor.gov/webproperty/Assessor_Search.html', gisUrl: 'https://ormap.net/gis/index.html' },
  'BENTON': { taxUrl: 'https://assessment.bentoncountyor.gov/property-account-search/', gisUrl: 'https://bentoncountygis.maps.arcgis.com/apps/webappviewer/index.html?id=57b2358b418142b2891b3e863c29126a' },
  'CLACKAMAS': { taxUrl: 'http://ascendweb.clackamas.us/', gisUrl: 'https://maps.clackamas.us/maps/cmap' },
  'CLATSOP': { taxUrl: 'https://apps.clatsopcounty.gov/property/', gisUrl: 'https://delta.co.clatsop.or.us/apps/ClatsopCounty/' },
  'COLUMBIA': { taxUrl: 'https://propertyquery.columbiacountyor.gov/columbiaat/MainQueryPage.aspx?QueryMode=&Query=', gisUrl: 'https://gis.columbiacountymaps.com/ColumbiaCountyWebMaps/' },
  'COOS': { taxUrl: 'https://records.co.coos.or.us/pso', gisUrl: 'https://www.arcgis.com/home/webmap/viewer.html?webmap=1be7dbc77f8745d78fc5f3e8e85fc05e&extent' },
  'CROOK': { taxUrl: 'https://apps.lanecounty.org/PropertyAssessmentTaxationSearch/crook/search/general', gisUrl: 'https://geo.co.crook.or.us/portal/apps/webappviewer/index.html?id=370f5ec185b945db9d92999cef827982' },
  'CURRY': { taxUrl: 'https://open.maps.rlid.org/CurryCounty/CurryCountyApp/index.html', gisUrl: 'https://open.maps.rlid.org/CurryCounty/CurryCountyApp/index.html' },
  'DESCHUTES': { taxUrl: 'https://dial.deschutes.org/', gisUrl: 'https://dial.deschutes.org/Real/InteractiveMap' },
  'DOUGLAS': { taxUrl: 'https://orion-pa.co.douglas.or.us/Home', gisUrl: 'https://geocortex.co.douglas.or.us/html5viewer/index.html?viewer=douglas_county_gis.viewer' },
  'GILLIAM': { taxUrl: '', gisUrl: 'https://ormap.net/gis/index.html' },
  'GRANT': { taxUrl: 'https://www.cci400web.com:8183/GrantCo_PropertyInq/', gisUrl: 'https://ormap.net/gis/index.html' },
  'HARNEY': { taxUrl: 'https://records.harneycountyor.gov/pso/', gisUrl: 'https://harneycounty.maps.arcgis.com/apps/webappviewer/index.html?id=22b86dac6fa8482ba7ab156c8dfa8889' },
  'HOOD RIVER': { taxUrl: 'https://records.co.hood-river.or.us/PSO', gisUrl: 'https://webmap.hoodrivercounty.gov/' },
  'JACKSON': { taxUrl: 'https://pdo.jacksoncountyor.gov/pdo/', gisUrl: 'https://hub.arcgis.com/maps/58ae5e6d9699445bad7ad78528785690' },
  'JEFFERSON': { taxUrl: 'https://query.co.jefferson.or.us/PSO', gisUrl: 'http://maps.co.jefferson.or.us/' },
  'JOSEPHINE': { taxUrl: 'https://jcpa.josephinecounty.gov/Home', gisUrl: 'https://joco.maps.arcgis.com/apps/webappviewer/index.html?id=6b4f29b1fe824d8d851088a44936739e' },
  'KLAMATH': { taxUrl: 'https://assessor.klamathcounty.org/PSO/', gisUrl: 'https://kcgis.maps.arcgis.com/apps/webappviewer/index.html?id=664411956da94614a80be24849b74c1b&extent=-13553674.8692%2C5191062.857%2C-13550617.3881%2C5192486.4967%2C102100' },
  'LAKE': { taxUrl: '', gisUrl: 'https://gis.lakecountyfl.gov/gisweb' },
  'LANE': { taxUrl: 'https://apps.lanecounty.org/PropertyAccountInformation/', gisUrl: 'https://lcmaps.lanecounty.org/LaneCountyMaps/LaneCountyMapsApp/index.html' },
  'LINCOLN': { taxUrl: 'https://propertyweb.co.lincoln.or.us/Home', gisUrl: 'https://maps.co.lincoln.or.us/#on=blank/blank;sketch/default;basemap_labels/city_labels;basemap_labels/town_labels;basemap_labels/rivers_and_streams_labels;basemap_labels/streets_labels;basemap_labels/HywShlds;Taxlots/Taxlots;Taxlots/TaxLines_NoSubtype;Taxlots/TaxLines_Subtype;Taxlots/TaxWaterLines;Taxlots/TaxLabels150;Taxlots/TaxArrows150;Taxlots_selection/Taxlots_selection;a_basemap/city;a_basemap/rivers_and_streams;a_basemap/water;a_basemap/land;a_basemap/sections;a_basemap/sectionstxt;a_basemap/Contours;a_basemap/Contours_(10ft);surveys_selection/surveys_selection;a_basemap_selection/sectionstxt_selection;Services_and_Districts_selection/Services_and_Districts_selection&loc=-124.99274;44.22348;-122.72907;45.10083' },
  'LINN': { taxUrl: 'https://lc-helionweb.co.linn.or.us/pso/', gisUrl: 'https://gis.co.linn.or.us/portal/apps/webappviewer/index.html?id=afcf95382e0148339c9edb3bed350137' },
  'MALHEUR': { taxUrl: 'https://www.cci400web.com:8183/MalheurCo_PropertyInq/', gisUrl: 'https://geo.maps.arcgis.com/apps/webappviewer/index.html?id=516e7d03477e496ea86de6fde8ff4f2b' },
  'MARION': { taxUrl: 'https://mcasr.co.marion.or.us/PropertySearch.aspx', gisUrl: 'https://marioncounty.maps.arcgis.com/apps/webappviewer/index.html?id=b41e1f1b340a448682a2cc47fff41b31' },
  'MORROW': { taxUrl: 'https://records.co.morrow.or.us/PSO/', gisUrl: 'https://ormap.net/gis/index.html' },
  'MULTNOMAH': { taxUrl: 'https://multcoproptax.com/Property-Search', gisUrl: 'https://multco.maps.arcgis.com/apps/webappviewer/index.html?id=9af70037e14d4bd2bfa3ed73f6fcd301' },
  'POLK': { taxUrl: 'https://apps2.co.polk.or.us/PSO', gisUrl: 'https://maps.co.polk.or.us/pcmaps/' },
  'SHERMAN': { taxUrl: '', gisUrl: 'https://ormap.net/gis/index.html' },
  'TILLAMOOK': { taxUrl: 'https://query.co.tillamook.or.us/PSO/', gisUrl: 'https://experience.arcgis.com/experience/f4434a096c5641b09c8eacb0d9caa8e9' },
  'UMATILLA': { taxUrl: 'https://umatillacogis.maps.arcgis.com/apps/webappviewer/index.html?id=31d08e9fa56045628407eb957b922892', gisUrl: 'https://umatillacogis.maps.arcgis.com/apps/webappviewer/index.html?id=31d08e9fa56045628407eb957b922892' },
  'UNION': { taxUrl: 'https://lookup.union-county.org/PSO', gisUrl: 'https://unioncounty-or.maps.arcgis.com/apps/instant/media/index.html?appid=ce153b227b1646b38403c5963702e4c2' },
  'WALLOWA': { taxUrl: '', gisUrl: 'https://ormap.net/gis/index.html' },
  'WASCO': { taxUrl: 'https://public.co.wasco.or.us/webtax/(S(y5f5x0cq0ht1hgap43wgofdg))/default.aspx', gisUrl: 'https://public.co.wasco.or.us/gisportal/apps/webappviewer/index.html?id=80a942ec81da4dd2bcc16032cc329459' },
  'WASHINGTON': { taxUrl: 'https://washcotax.co.washington.or.us/', gisUrl: 'https://wcgis1.co.washington.or.us/Html5Viewer/index.html?viewer=Intermap' },
  'WHEELER': { taxUrl: '', gisUrl: 'https://ormap.net/gis/index.html' },
  'YAMHILL': { taxUrl: 'https://ascendweb.co.yamhill.or.us/AcsendWeb/(S(04dpphdmjiwfm0iwgouyh5yd))/default.aspx', gisUrl: 'https://www.yamhillcountymaps.com/' }
};
function setupCountyInfoCard() {
  const countyInfo = document.getElementById('county-info');
  const countyNameElement = document.getElementById('county-name');
  const taxButton = document.getElementById('tax-button');
  const gisButton = document.getElementById('gis-button');
  if (!countyInfo || !countyNameElement || !taxButton || !gisButton) return;
  // Fetch county boundaries GeoJSON (as in Gemini)
  fetch('https://services1.arcgis.com/KbxwQRRfWyEYLgp4/arcgis/rest/services/BLM_OR_County_Boundaries_Polygon_Hub/FeatureServer/1/query?outFields=COUNTY_NAME&where=1%3D1&f=geojson')
    .then(response => response.json())
    .then(data => {
      const countyLayer = L.geoJSON(data, {
        style: { fillColor: 'transparent', weight: 1.5, opacity: 0.8, color: '#1e40af', fillOpacity: 0 },
        onEachFeature: (feature, layer) => {
          if (feature.properties?.COUNTY_NAME) {
            const countyName = feature.properties.COUNTY_NAME;
            layer.on('mouseover', (e) => {
              countyNameElement.textContent = countyName + ' County';
              const urls = countyUrls[countyName.toUpperCase()] || { taxUrl: '', gisUrl: '' };
              taxButton.href = urls.taxUrl || '#';
              taxButton.classList.toggle('disabled', !urls.taxUrl);
              gisButton.href = urls.gisUrl || '#';
              gisButton.classList.toggle('disabled', !urls.gisUrl);
              countyInfo.classList.remove('hidden');
              e.target.setStyle({ weight: 3, color: '#0056b3' });
            });
            layer.on('mouseout', (e) => {
              e.target.setStyle({ weight: 1.5, color: '#1e40af' });
              countyInfo.classList.add('hidden');
            });
            layer.on('click', (e) => {
              L.DomEvent.stop(e);
              countyNameElement.textContent = countyName + ' County';
              const urls = countyUrls[countyName.toUpperCase()] || { taxUrl: '', gisUrl: '' };
              taxButton.href = urls.taxUrl || '#';
              taxButton.classList.toggle('disabled', !urls.taxUrl);
              gisButton.href = urls.gisUrl || '#';
              gisButton.classList.toggle('disabled', !urls.gisUrl);
              countyInfo.classList.remove('hidden');
            });
          }
        }
      }).addTo(amap);
      amap.on('click', (e) => {
        if (!countyInfo.classList.contains('hidden')) {
          let clickedOnCounty = false;
          if (e.originalEvent.target && countyLayer) {
            countyLayer.eachLayer(layer => {
              if (e.originalEvent.target === layer._path) clickedOnCounty = true;
            });
          }
          if (!clickedOnCounty) countyInfo.classList.add('hidden');
        }
      });
    });
}

// 14. Initialize all Gemini UI logic after map is ready
function initializeGeminiUI(data) {
  setupSidebarToggle();
  setupSidebarSearchType();
  setupSidebarSearch();
  setupSidebarClose();
  updateSidebar(data);
}

// --- End Gemini UI logic ---

// In updateMap, after markers are loaded, call initializeGeminiUI(data)
const origUpdateMap = updateMap;
updateMap = function(data) {
  origUpdateMap(data);
  initializeGeminiUI(data);
};
