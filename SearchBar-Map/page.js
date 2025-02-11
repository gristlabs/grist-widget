"use strict";

/* global grist, window, L */

// Configuration
const GOOGLE_MAPS_EMBED_ID = '1XYqZpHKr3L0OGpTWlkUah7Bf4v0tbhA'; // Your Google MyMaps ID
let mapSource = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}';
let mapCopyright = 'Tiles © Esri';
let mode = 'multi';
let amap;
let popups = {};
let selectedTableId = null;
let selectedRowId = null;
let selectedRecords = null;
let markers;

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
const Geocode = 'Geocode';
const Address = 'Address';
const GeocodedAddress = 'GeocodedAddress';

// Base map layers
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
    "OpenStreetMap": L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: ''
    })
};

// Custom icons
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

function createPopupContent({ name, propertyType, tenants, secondaryType, imageUrl, costarLink, countyLink, gisLink }) {
    return `
    <div class="custom-popup">
      <div class="popup-header">
        <h3>${name || 'Unnamed Location'}</h3>
      </div>
      <div class="popup-content">
        ${imageUrl ?
            `<img src="${imageUrl}" alt="${name}" class="popup-image" onerror="this.style.display='none'"/>` :
            ''}
        <div class="popup-info">
          ${propertyType ? `<p><strong>Type:</strong> ${propertyType}</p>` : ''}
          ${secondaryType ? `<p><strong>Secondary:</strong> ${secondaryType}</p>` : ''}
          ${tenants ? `<p><strong>Tenants:</strong> ${tenants}</p>` : ''}
        </div>
        ${(costarLink || countyLink || gisLink) ? `
          <div class="popup-buttons">
            ${costarLink ? `<a href="${costarLink}" class="popup-button" target="_blank">CoStar</a>` : ''}
            ${countyLink ? `<a href="${countyLink}" class="popup-button" target="_blank">County</a>` : ''}
            ${gisLink ? `<a href="${gisLink}" class="popup-button" target="_blank">GIS</a>` : ''}
          </div>
        ` : ''}
      </div>
    </div>`;
}

function updateGoogleMinimap() {
    const iframe = document.getElementById('googleMap');
    if (!iframe || !amap) return;

    const center = amap.getCenter();
    const zoom = amap.getZoom();
    const ll = `${center.lat},${center.lng}`;

    // Update the Google MyMaps embed URL.
    iframe.src = `https://www.google.com/maps/d/embed?mid=${GOOGLE_MAPS_EMBED_ID}&ll=${ll}&z=${zoom}&output=embed`;

    iframe.onload = () => {
        let intervalId;

        // Try to apply styles immediately.
        function applyStyles() {
            try {
                const mapholder = iframe.contentDocument.getElementById('mapholder');
                if (mapholder) {
                    mapholder.style.position = 'static';
                    mapholder.style.padding = '0';
                    clearInterval(intervalId); // Stop polling!
                    console.log("Minimap styles applied successfully!");
                }
            } catch (error) {
              // Ignore errors, iframe content might not be accessible yet.
            }
        }

        applyStyles(); // Try immediately

        // Poll for #mapholder and apply styles.
        intervalId = setInterval(applyStyles, 100); // Check every 100ms
    };
}
function initMinimap() {
    const minimapContainer = document.getElementById('minimap-container');
    const toggleButton = document.getElementById('toggleMinimap');

    if (!minimapContainer || !toggleButton) return;

    // Initialize in collapsed state
    minimapContainer.classList.add('collapsed');

    // Toggle minimap visibility
    toggleButton.addEventListener('click', () => {
        minimapContainer.classList.toggle('collapsed');
        if (!minimapContainer.classList.contains('collapsed')) {
            updateGoogleMinimap();
        }
    });

    // Sync minimap with main map movements
    amap.on('moveend', () => {
        if (!minimapContainer.classList.contains('collapsed')) {
            updateGoogleMinimap();
        }
    });
}

function showProblem(txt) {
    document.getElementById('map').innerHTML = '<div class="error">' + txt + '</div>';
}

function parseValue(v) {
    if (typeof (v) === 'object' && v !== null && v.value && v.value.startsWith('V(')) {
        const payload = JSON.parse(v.value.slice(2, v.value.length - 1));
        return payload.remote || payload.local || payload.parent || payload;
    }
    return v;
}

function getInfo(rec) {
    return {
        id: rec.id,
        name: parseValue(rec[Name]),
        lng: parseValue(rec[Longitude]),
        lat: parseValue(rec[Latitude]),
        propertyType: parseValue(rec[Property_Type]),
        tenants: parseValue(rec[Tenants]),
        secondaryType: parseValue(rec[Secondary_Type]),
        imageUrl: parseValue(rec[ImageURL]),
        costarLink: parseValue(rec[CoStar_URL]),
        countyLink: parseValue(rec[County_Hyper]),
        gisLink: parseValue(rec[GIS])
    };
}

function updateMap(data) {
    data = data || selectedRecords;
    selectedRecords = data;

    if (!data || data.length === 0) {
        showProblem("No data found yet");
        return;
    }

    if (!(Longitude in data[0] && Latitude in data[0] && Name in data[0])) {
        showProblem("Table does not yet have all expected columns: Name, Longitude, Latitude");
        return;
    }

    const error = document.querySelector('.error');
    if (error) { error.remove(); }


    // Calculate bounds *before* initializing the map
    const points = data.map(record => {
        const { lat, lng } = getInfo(record);
        if (!lat || !lng || isNaN(lat) || isNaN(lng)) return null;
        return [lat, lng];
    }).filter(point => point !== null);

    let initialCenter = [39.8283, -98.5795]; // Default center (USA)
    let initialZoom = 4;

    if (points.length > 0) {
        try {
            const bounds = L.latLngBounds(points);
            initialCenter = bounds.getCenter();
            initialZoom = amap ? amap.getBoundsZoom(bounds) : 10; // Use existing map's zoom if available, default to 10
        } catch (e) {
            console.warn('Error fitting bounds:', e);
        }
    }


    if (amap) {
        try {
            amap.off();
            amap.remove();
        } catch (e) {
            console.warn(e);
        }
    }

    // Initialize map
    const defaultTiles = L.tileLayer(mapSource, { attribution: mapCopyright });
    amap = L.map('map', {
        layers: [defaultTiles],
        center: initialCenter, // Use calculated center
        zoom: initialZoom,       // Use calculated zoom
        wheelPxPerZoomLevel: 90
    });


    // Add layer control
    L.control.layers(baseLayers, {}, { position: 'topright', collapsed: true }).addTo(amap);

    // Initialize marker cluster group
    markers = L.markerClusterGroup({
        maxClusterRadius: 80,
        spiderfyOnMaxZoom: true,
        showCoverageOnHover: true,
        zoomToBoundsOnClick: true,
        chunkedLoading: true,
        chunkInterval: 200,
        animate: false
    });

    // Add markers
    data.forEach(record => {
        const { id, name, lng, lat, propertyType, tenants, secondaryType, imageUrl, costarLink, countyLink, gisLink } = getInfo(record);

        if (!lng || !lat || String(lng) === '...' ||
            isNaN(lng) || isNaN(lat) ||
            Math.abs(lat) < 0.01 && Math.abs(lng) < 0.01) {
            return;
        }

        const marker = L.marker([lat, lng], {
            title: name,
            id: id,
            icon: (id == selectedRowId) ? selectedIcon : defaultIcon
        });

        marker.on('click', function () {
            selectMaker(this.options.id);
        });

        const popupContent = createPopupContent({
            name,
            propertyType,
            tenants,
            secondaryType,
            imageUrl,
            costarLink,
            countyLink,
            gisLink
        });

        marker.bindPopup(popupContent, {
            maxWidth: 200,
            className: 'custom-popup'
        });

        markers.addLayer(marker);
        popups[id] = marker;
    });

    amap.addLayer(markers);

    // Add search control
    const searchControl = L.esri.Geocoding.geosearch({
        providers: [L.esri.Geocoding.arcgisOnlineProvider()],
        position: 'topleft',
        useMapBounds: false,
        attribution: false
    }).addTo(amap);




    if (points.length > 0) {
        try {
            const bounds = L.latLngBounds(points);
            amap.fitBounds(bounds, { padding: [50, 50] });
        } catch (e) {
            console.warn('Error fitting bounds:', e);
            //Fallback
            amap.setView(initialCenter, initialZoom);
        }
    }

    // Show selected marker if exists
    if (selectedRowId && popups[selectedRowId]) {
        const marker = popups[selectedRowId];
        if (!marker._icon) {
            markers.zoomToShowLayer(marker);
        }
        marker.openPopup();
    }

    // Initialize minimap *after* main map setup
    initMinimap();
}

function selectMaker(id) {
    // Reset the options from the previously selected marker
    const previouslyClicked = popups[selectedRowId];
    if (previouslyClicked) {
        previouslyClicked.setIcon(defaultIcon);
    }

    const marker = popups[id];
    if (!marker) { return null; }

    // Remember the new selected marker
    selectedRowId = id;

    // Set the options for the newly selected marker
    marker.setIcon(selectedIcon);

    // Open the popup
    marker.openPopup();

    // Update the selected row in Grist
    grist.setCursorPos?.({ rowId: id }).catch(() => { });

    return marker;
}

// Grist integration code
let lastRecord;
let lastRecords;
let writeAccess = true;
let scanning = null;

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
            await grist.docApi.applyUserActions([['UpdateRecord', tableId, record.id, {
                [mappings[Longitude]]: result.lng,
                [mappings[Latitude]]: result.lat,
                ...(GeocodedAddress in mappings) ? { [mappings[GeocodedAddress]]: address } : undefined
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
    if (selectedRowId === rec.id) { return; }
    selectedRowId = rec.id;
    if (mode === 'single') {
        updateMap([rec]);
    } else {
        updateMap();
    }
}

grist.on('message', (e) => {
    if (e.tableId) { selectedTableId = e.tableId; }
});

grist.onRecord((record, mappings) => {
    if (mode === 'single') {
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
        updateMap(lastRecords);
        if (lastRecord) {
            selectOnMap(lastRecord);
        }
        scanOnNeed(defaultMapping(data[0], mappings));
    }
});

let clearMakers = () => { };

grist.onNewRecord(() => {
    clearMakers();
    clearMakers = () => { };
});

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

const optional = true;
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
        { name: "Geocode", type: 'Bool', title: 'Geocode', optional },
        { name: "Address", type: 'Text', optional },
        { name: "GeocodedAddress", type: 'Text', title: 'Geocoded Address', optional },
    ],
    allowSelectBy: true,
    onEditOptions
});
