"use strict";

/* global grist, window, L */ // Added L to globals

let amap;
let popups = {};
let selectedTableId = null;
let selectedRowId = null;
let selectedRecords = null;
let mode = 'multi';
let mapSource = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}';
let mapCopyright = 'Esri';
let currentMappings = { // Initialize currentMappings with default mappings
    Longitude: "Longitude",
    Name: "Name",
    Latitude: "Latitude",
    Property_Type: "Property_Type",
    Tenants: "Tenants",
    Secondary_Type: "Secondary_Type",
    ImageURL: "ImageURL",
    CoStar_URL: "CoStar_URL",
    County_Hyper: "County_Hyper",
    GIS: "GIS",
    "Pop-up IMG": "Pop-up IMG",
    "Property Id": "Property Id",
    "Address Concatenate": "Address Concatenate",
    "County Prop Search": "County Prop Search",
    Geocode: "Geocode",
    Address: "Address",
    GeocodedAddress: "GeocodedAddress"
};


// Define column names as constants (matches your original, but using underscores for internal names where needed)
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
const Geocode = 'Geocode';
const Address = 'Address';
const GeocodedAddress = 'GeocodedAddress';
const Popup_IMG_COL = 'Popup_IMG'; // Internal name for "Pop-up IMG"
const Property_Id_COL = 'Property_Id'; // Internal name for "Property Id"
const Address_Concatenate_COL = 'Address_Concatenate'; // Internal name for "Address Concatenate"
const County_Prop_Search_COL = 'County_Prop_Search'; // Internal name for "County Prop Search"


const selectedIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

const defaultIcon = new L.Icon.Default();

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
        center: [45.5283, -122.8081], // Default center (USA)
        zoom: 4, // Default zoom level
        wheelPxPerZoomLevel: 90,
    });


    // Add layer control
    L.control.layers(baseLayers, overlayLayers, { position: 'topright', collapsed: true }).addTo(amap);

    // Add Esri Geocoder search control
    const searchControl = L.esri.Geocoding.geosearch({
        providers: [L.esri.Geocoding.arcgisOnlineProvider()],
        position: 'topleft',
        attribution: false // Disable attribution for the geocoder
    }).addTo(amap);

    const searchResults = L.layerGroup().addTo(amap);

    searchControl.on('results', function (data) {
        searchResults.clearLayers();
        for (let i = data.results.length - 1; i >= 0; i--) {
            searchResults.addLayer(L.marker(data.results[i].latlng, { icon: searchIcon })); // Use searchIcon
        }
    });

    overlayLayers["Search Results"] = searchResults;


    return amap;
}


function updateMap(records, mappings) { // Add mappings parameter to updateMap
    if (!amap) {
        amap = initializeMap();
    }

    if (!markersLayer) {
        markersLayer = L.markerClusterGroup();
        amap.addLayer(markersLayer);
    }

    markersLayer.clearLayers();
    popups = {}; // Clear existing popups

    records.forEach(record => {
        const lat = record[mappings.Latitude] || record.latitude; // Use mappings
        const lng = record[mappings.Longitude] || record.longitude; // Use mappings

        if (lat === undefined || lng === undefined || lat === null || lng === null) {
            console.warn(`Skipping record due to missing coordinates: ${record[mappings.Name] || 'Unknown'}`); // Use mappings
            return;
        }


        const marker = L.marker([lat, lng], {
            title: record[mappings.Name], // Use mappings
            icon: defaultIcon
        });

        marker.bindPopup(createPopupContent(record, mappings), { // Pass mappings to createPopupContent
            maxWidth: 300,
            minWidth: 300,
            className: 'custom-popup'
        });
        popups[record.id] = marker; // Store marker in popups object
        markersLayer.addLayer(marker);
    });

    amap.addLayer(markersLayer);
}


function createPopupContent(record, mappings) { // Add mappings parameter
    const typeClass = 'bg-blue-100 text-blue-800';
    const secondaryClass = 'bg-green-100 text-green-800';
    const tenantClass = 'bg-yellow-100 text-yellow-800';

    return `
        <div class="popup-card">
          <div class="popup-image-container">
            ${record[mappings.Popup_IMG] ? // Use mappings
              `<img src="${record[mappings.Popup_IMG]}" alt="${record[mappings.Name]}" class="popup-image"/>` : // Use mappings
              `<div class="popup-image-placeholder">
                <span class="text-gray-400">No Image Available</span>
               </div>`
            }
            <div class="action-buttons">
              <div class="button-container">
                <button class="action-btn" onclick="window.open('${record[mappings.County_Prop_Search] || '#'}')" title="County Property Search">🔍</button>
                <button class="action-btn" onclick="window.open('${record[mappings.GIS] || '#'}')" title="GIS">🌎</button>
                <button class="action-btn" onclick="copyToClipboard('${record[mappings.Address_Concatenate]}', this)" title="Copy Address">📋</button>
                <button class="action-btn" onclick="window.open('https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${record[mappings.Latitude]},${record[mappings.Longitude]}')" title="Street View">🛣️</button>
                <button class="action-btn" onclick="window.open('${record[mappings.CoStar_URL] || '#'}')" title="CoStar">🏢</button>
              </div>
            </div>
          </div>
          <div class="property-info">
            <div class="property-name" onclick="toggleDetails(this)">
              ${record[mappings.Name]}
            </div>
            <div class="property-details">
              <div class="detail-item copyable" onclick="copyToClipboard('${record[mappings.Address_Concatenate]}', this)">
                <strong>Address:</strong>
                <span>${record[mappings.Address_Concatenate]}</span>
              </div>
              <div class="detail-item copyable" onclick="copyToClipboard('${record[mappings.Property_Id]}', this)">
                <strong>Property ID:</strong>
                <span>${record[mappings.Property_Id]}</span>
              </div>
              <div class="mb-2">
                  ${record[mappings.Property_Type] ? `<span class="type-tag">${record[mappings.Property_Type]}</span>` : ''}
                  ${record[mappings.Secondary_Type] ? `<span class="type-tag">${record[mappings.Secondary_Type]}</span>` : ''}
                  ${record[mappings.Tenants] ? `<span class="type-tag">${record[mappings.Tenants]}</span>` : ''}
              </div>
            </div>
          </div>
        </div>
      `;
}


// If widget has write access
let writeAccess = true;

// A ongoing scanning promise, to check if we are in progress.
let scanning = null;


const delay = ms => new Promise(res => setTimeout(res, ms));

const geocode = async (address) => {
    try {
        const response = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=jsonv2`);
        const data = await response.json();
        if (data && data.length > 0) {
            return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
        } else {
            return { lat: null, lng: null }; // Or handle no results as needed
        }
    } catch (error) {
        console.error("Geocoding error:", error);
        return { lat: null, lng: null }; // Handle fetch errors
    }
};


async function scan(tableId, records, mappings) {
    if (!writeAccess) { return; }
    for (const record of records) {
        if (!(mappings.Geocode in record)) { break; } // Use mappings to access Geocode column
        if (!record[mappings.Geocode]) { continue; } // Use mappings to access Geocode column
        const address = record[mappings.Address]; // Use mappings to access Address column
        if (mappings.GeocodedAddress && record[mappings.GeocodedAddress] && record[mappings.GeocodedAddress] !== record[mappings.Address]) { // Use mappings
            record[mappings.Longitude] = null; // Use mappings
            record[mappings.Latitude] = null; // Use mappings
        }
        if (address && !record[mappings.Longitude]) { // Use mappings
            const result = await geocode(address);
            await grist.docApi.applyUserActions([['UpdateRecord', tableId, record.id, {
                [mappings.Longitude]: result.lng, // Use mappings
                [mappings.Latitude]: result.lat, // Use mappings
                ...(mappings.GeocodedAddress ? { [mappings.GeocodedAddress]: address } : undefined) // Use mappings
            }]]);
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
    if (typeof (v) === 'object' && v !== null && v.value && v.value.startsWith('V(')) {
        const payload = JSON.parse(v.value.slice(2, v.value.length - 1);
        return payload.remote || payload.local || payload.parent || payload;
    }
    return v;
}


let clearMakers = () => { };
let markersLayer = null; // Initialize markersLayer to null


function selectMaker(id) {
    if (!popups) return; // Check if popups is initialized
    const previouslyClicked = popups[selectedRowId];
    if (previouslyClicked) {
        previouslyClicked.setIcon(defaultIcon);
        previouslyClicked.setZIndexOffset(0); // Reset z-index
    }
    const marker = popups[id];
    if (!marker) { return null; }
    selectedRowId = id;
    marker.setIcon(selectedIcon);
    marker.setZIndexOffset(1000); // Bring selected marker to front
    if (markersLayer && markersLayer.hasLayer(marker)) { // Check if markersLayer is initialized and hasLayer method exists
        markersLayer.zoomToShowLayer(marker);
    }
    marker.openPopup();
    grist.setCursorPos?.({ rowId: id }).catch(() => { });
    return marker;
}


grist.on('message', (e) => {
    if (e.tableId) { selectedTableId = e.tableId; }
});


function selectOnMap(rec, mappings) { // Add mappings parameter
    if (selectedRowId === rec.id) { return; }
    selectedRowId = rec.id;
    if (mode === 'single') {
        updateMap([rec], mappings); // Pass mappings to updateMap
    } else {
        updateMap(lastRecords, mappings); // Pass mappings to updateMap
    }
}


grist.onRecord((record, mappings) => {
    const mappedRecord = grist.mapColumnNames(record) || record; // Apply column mapping here
    lastRecord = mappedRecord;
    if (mode === 'single') {
        selectOnMap(lastRecord, mappings);
    } else {
        const marker = selectMaker(record.id);
        if (!marker) { return; }
        if (markersLayer && markersLayer.hasLayer(marker)) {
            markersLayer.zoomToShowLayer(marker);
        }
        marker.openPopup();
    }
    scanOnNeed(mappings); // Pass mappings to scanOnNeed
});


grist.onRecords((data, mappings) => {
    const mappedData = data.map(rec => grist.mapColumnNames(rec) || rec); // Apply column mapping to each record
    lastRecords = mappedData;
    if (mode !== 'single') {
        updateMap(lastRecords, mappings); // Pass mappings to updateMap
        if (lastRecord) {
            selectOnMap(lastRecord, mappings);
        }
    }
    if (data.length > 0) {
        scanOnNeed(mappings); // Pass mappings to scanOnNeed, but only if data is available
    }
});


grist.onNewRecord(() => {
    clearMakers();
    clearMakers = () => { };
})

function updateMode() {
    if (mode === 'single') {
        selectedRowId = lastRecord.id;
        updateMap([lastRecord], currentMappings); // Pass currentMappings
    } else {
        updateMap(lastRecords, currentMappings); // Pass currentMappings
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
    };
    ["mapSource", "mapCopyright"].forEach((opt) => {
        const ipt = document.getElementById(opt);
        ipt.onchange = async (e) => {
            await grist.setOption(opt, e.target.value);
        };
    });
}


const optional = true;

document.addEventListener("DOMContentLoaded", function () {
    grist.ready({
        columns: [
            "Name",
            { name: "Longitude", type: 'Numeric' },
            { name: "Latitude", type: 'Numeric' },
            { name: "Property_Type", type: 'Choice' },
            { name: "Tenants", type: 'ChoiceList' },
            { name: "Secondary_Type", type: 'ChoiceList' },
            { name: "ImageURL", type: 'Text' },
            { name: "CoStar_URL", type: 'Text' },
            { name: "County_Hyper", type: 'Text' },
            { name: "GIS", type: 'Text' },
            { name: "Pop-up IMG", type: 'Text', optional: true, internalColumnName: Popup_IMG_COL }, // Renamed internalColumnName
            { name: "Property Id", type: 'Text', optional: true, internalColumnName: Property_Id_COL }, // Renamed internalColumnName
            { name: "Address Concatenate", type: 'Text', optional: true, internalColumnName: Address_Concatenate_COL }, // Renamed internalColumnName
            { name: "County Prop Search", type: 'Text', optional: true, internalColumnName: County_Prop_Search_COL }, // Renamed internalColumnName
            { name: "Geocode", type: 'Bool', title: 'Geocode', optional: true },
            { name: "Address", type: 'Text', optional: true },
            { name: "GeocodedAddress", type: 'Text', title: 'Geocoded Address', optional: true },
        ],
        columnMap: currentMappings,
        allowSelectBy: true,
        onEditOptions
    });

    amap = initializeMap(); // Initialize map after grist.ready


    const minimapContainer = document.getElementById('minimap-container');
    const toggleButton = document.getElementById('toggleMinimap');

    if (toggleButton && minimapContainer) {
        toggleButton.addEventListener('click', function () {
            minimapContainer.classList.toggle('collapsed');
        });
    }


    grist.onOptions((options, interaction) => {
        writeAccess = interaction.accessLevel === 'full';
        const newMode = options?.mode ?? mode;
        mode = newMode;
        if (newMode !== mode && lastRecords) {
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
});


function copyToClipboard(text, element) {
    navigator.clipboard.writeText(text).then(() => {
        const tooltip = document.createElement('div');
        tooltip.className = 'copy-tooltip';
        tooltip.textContent = 'Copied!';
        element.appendChild(tooltip);
        setTimeout(() => tooltip.remove(), 1000);
    });
}

function toggleDetails(element) {
    const details = element.nextElementSibling;
    details.classList.toggle('active');
}
