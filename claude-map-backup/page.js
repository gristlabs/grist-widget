"use strict";

/* global grist, window */

let amap;
let markersLayer;
let popups = {};
let selectedTableId = null;
let selectedRowId = null;
let selectedRecords = null;
let mode = 'multi';
let mapSource = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}';
let mapCopyright = 'Esri';

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
        center: [45.5283, -122.8081], // Default center (USA)
        zoom: 4, // Default zoom level
        wheelPxPerZoomLevel: 90,
    });

    // Attach the load event listener after the map is initialized
    amap.on('load', function () {
        console.log("Map is fully loaded and ready for interaction");
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
            const marker = L.marker(data.results[i].latlng, {
                icon: new L.Icon({
                    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-gold.png',
                    shadowUrl: 'marker-shadow.png',
                    iconSize: [25, 41],
                    iconAnchor: [12, 41],
                    popupAnchor: [1, -34],
                    shadowSize: [41, 41]
                })
            });
            searchResults.addLayer(marker);
        }
    });

    overlayLayers["Search Results"] = searchResults;

    // Synchronize with Google Map
    const googleMapIframe = document.getElementById('googleMap');

    if (googleMapIframe) {
        // Function to sync Leaflet map with Google MyMap
        function syncMaps() {
            // Sync the Leaflet map with the iframe's view
            amap.on('moveend', function () {
                const center = amap.getCenter();
                const zoom = amap.getZoom();
                const ll = `${center.lat},${center.lng}`;
                googleMapIframe.src = `https://www.google.com/maps/d/embed?mid=1XYqZpHKr3L0OGpTWlkUah7Bf4v0tbhA&ll=${ll}&z=${zoom}`;
            });

            // Trigger sync on initial load
            const initialCenter = amap.getCenter();
            const initialZoom = amap.getZoom();
            const initialLL = `${initialCenter.lat},${initialCenter.lng}`;
            googleMapIframe.src = `https://www.google.com/maps/d/embed?mid=1XYqZpHKr3L0OGpTWlkUah7Bf4v0tbhA&ll=${initialLL}&z=${initialZoom}`;
        }

        syncMaps();
    } else {
        console.error("Google MyMap iframe not found!");
    }

    // Collapsible minimap logic
    const minimapContainer = document.getElementById('minimap-container');
    const toggleButton = document.getElementById('toggleMinimap');

    if (toggleButton && minimapContainer) {
        toggleButton.addEventListener('click', function () {
            minimapContainer.classList.toggle('collapsed');
        });
    }

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

function createMarker(record) {
    const marker = L.marker([record[Latitude], record[Longitude]], {
        title: record[Name],
        icon: record.id === selectedRowId ? selectedIcon : defaultIcon
    });

    // Update to store the record with the marker
    marker.record = record;

    // Create popup with record data
    const popupContent = createPopupContent(record);
    marker.bindPopup(popupContent, {
        maxWidth: 240,
        minWidth: 240,
        className: 'custom-popup'
    });

    marker.on('click', () => {
        grist.setCursorPos({ rowId: record.id }).catch(() => {});
    });

    popups[record.id] = marker;
    markersLayer.addLayer(marker);

    return marker;
}

function updateMap(data) {
    if (!amap) {
        amap = initializeMap();
    }

    if (!markersLayer) {
        markersLayer = L.markerClusterGroup();
        amap.addLayer(markersLayer);
    } else {
        markersLayer.clearLayers();
    }

    data.forEach(record => {
        const marker = createMarker(record);
    });
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

let clearMakers = () => {};
let markers = [];

function selectMaker(id) {
    const previouslyClicked = popups[selectedRowId];
    if (previouslyClicked) {
        previouslyClicked.setIcon(defaultIcon);
    }
    const marker = popups[id];
    if (!marker) { return null; }
    selectedRowId = id;
    marker.setIcon(selectedIcon);
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
            [Property_Id]: Property_Id,
            [ImageURL]: ImageURL,
            [CoStar_URL]: CoStar_URL,
            [County_Hyper]: County_Hyper,
            [GIS]: GIS,
            [Geocode]: hasCol(Geocode, record) ? Geocode : null,
            [Address]: hasCol(Address, record) ? Address : null,
            [GeocodedAddress]: hasCol(GeocodedAddress, record) ? GeocodedAddress : null,
        };
    }
    return mappings;
}

function selectOnMap(rec) {
    if (selectedRowId === rec.id) { return; }
    selectedRowId = rec.id;
    if (mode === 'single') {
        updateMap([rec]);
    } else {
        updateMap();
    }
}

grist.onRecord((record, mappings) => {
    lastRecord = grist.mapColumnNames(record) || record;
    if (mode === 'single') {
        selectOnMap(lastRecord);
        scanOnNeed(defaultMapping(record, mappings));
    } else {
        const marker = selectMaker(record.id);
        if (!marker) { return; }
        markersLayer.zoomToShowLayer(marker);
        marker.openPopup();
    }
});

grist.onRecords((data, mappings) => {
    lastRecords = grist.mapColumnNames(data) || data;
    if (mode !== 'single') {
        updateMap(lastRecords);
        if (lastRecord) {
            selectOnMap(lastRecord);
        }
        scanOnNeed(defaultMapping(data[0], mappings));
    }
});

grist.onNewRecord(() => {
    clearMakers();
    clearMakers = () => {};
})

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

document.addEventListener("DOMContentLoaded", function () {
    const minimapContainer = document.getElementById('minimap-container');
    const toggleButton = document.getElementById('toggleMinimap');

    // Toggle minimap visibility
    toggleButton.addEventListener('click', function () {
        minimapContainer.classList.toggle('collapsed');
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

grist.on('selection', (records) => {
    if (records.length === 1) {
        const record = records[0];
        const marker = popups[record.id];
        if (marker) {
            marker.openPopup();
            amap.setView(marker.getLatLng(), 16);
        }
    }
});
