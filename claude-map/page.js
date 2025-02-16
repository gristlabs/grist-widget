"use strict";

/* global grist, window, L */

let amap;
let popups = {};
let selectedTableId = null;
let selectedRowId = null;
let selectedRecords = null;
let mode = 'multi';
let mapSource = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}';
let mapCopyright = 'Esri';
let currentMappings = { // Initialize default mappings
    Longitude: "Longitude",
    Name: "Name",
    Latitude: "Latitude",
    "PopupIMG": "PopupIMG", // Displayed name is "PopupIMG"
    "Property Id": "Property Id",
    "Address Concatenate": "Address Concatenate",
    "County Prop Search": "County Prop Search",
    "GIS": "GIS",
    "CoStar URL": "CoStar URL",
    "Type": "Type",
    "Secondary": "Secondary",
    "Tenants": "Tenants"
};


const defaultIcon = new L.Icon.Default();

function initializeMap() {
    amap = L.map('map').setView([45.5283, -122.8081], 4); // Adjusted default zoom level

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(amap);

    return amap;
}


function createPopupContent(record, mappings) {
    return `
        <div class="popup-card">
          <div class="popup-image-container">
            ${record[mappings.PopupIMG] ?
              `<img src="${record[mappings.PopupIMG]}" alt="${record[mappings.Name]}" class="popup-image"/>` :
              `<div class="popup-image-placeholder">
                <span class="text-gray-400">No Image Available</span>
               </div>`
            }
            <div class="action-buttons">
              <div class="button-container">
                <button class="action-btn" onclick="window.open('${record[mappings["County Prop Search"]] || '#'}')" title="County Property Search">🔍</button>
                <button class="action-btn" onclick="window.open('${record[mappings.GIS] || '#'}')" title="GIS">🌎</button>
                <button class="action-btn" onclick="copyToClipboard('${record[mappings["Address Concatenate"]]}', this)" title="Copy Address">📋</button>
                <button class="action-btn" onclick="window.open('https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${record[mappings.Latitude]},${record.Longitude]}')" title="Street View">🛣️</button>
                <button class="action-btn" onclick="window.open('${record[mappings["CoStar URL"]] || '#'}')" title="CoStar">🏢</button>
              </div>
            </div>
          </div>
          <div class="property-info">
            <div class="property-name" onclick="toggleDetails(this)">
              ${record[mappings.Name]}
            </div>
            <div class="property-details">
              <div class="detail-item copyable" onclick="copyToClipboard('${record[mappings["Address Concatenate"]]}', this)">
                <strong>Address:</strong>
                <span>${record[mappings["Address Concatenate"]]}</span>
              </div>
              <div class="detail-item copyable" onclick="copyToClipboard('${record[mappings["Property Id"]]}', this)">
                <strong>Property ID:</strong>
                <span>${record[mappings["Property Id"]]}</span>
              </div>
              <div class="mb-2">
                  ${record[mappings.Type] ? `<span class="type-tag">${record[mappings.Type]}</span>` : ''}
                  ${record[mappings.Secondary] ? `<span class="type-tag">${record[mappings.Secondary]}</span>` : ''}
                  ${record[mappings.Tenants] ? `<span class="type-tag">${record[mappings.Tenants]}</span>` : ''}
              </div>
            </div>
          </div>
        </div>
      `;
}

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


document.addEventListener("DOMContentLoaded", function () {
    grist.ready({
        columns: [
            "Name",
            { name: "Longitude", type: 'Numeric' },
            { name: "Latitude", type: 'Numeric' },
            { name: "PopupIMG", type: 'Text', optional: true }, // Displayed name is "PopupIMG"
            { name: "Property Id", type: 'Text', optional: true },
            { name: "Address Concatenate", type: 'Text', optional: true },
            { name: "County Prop Search", type: 'Text', optional: true },
            { name: "GIS", type: 'Text', optional: true },
            { name: "CoStar URL", type: 'Text', optional: true },
            { name: "Type", type: 'Choice', optional: true },
            { name: "Secondary", type: 'Choice', optional: true },
            { name: "Tenants", type: 'Choice List', optional: true }
        ],
        columnMap: currentMappings, // Apply default mappings
        allowSelectBy: true,
    });

    amap = initializeMap(); // Initialize map AFTER grist.ready

    grist.on('message', (e) => {
        console.log('grist.on message e.tableId:', e.tableId);
        selectedTableId = e.tableId;
        console.log('selectedTableId set to:', selectedTableId);
    });

    grist.onRecord((record, mappings) => {
        const mappedRecord = grist.mapColumnNames(record) || record;
        if (!mappedRecord || !mappedRecord[mappings.Latitude] || !mappedRecord[mappings.Longitude]) return;

        const latlng = L.latLng(mappedRecord[mappings.Latitude], mappedRecord[mappings.Longitude]); // Create LatLng object

        let marker = L.marker(latlng, {icon: defaultIcon}) // Add defaultIcon here
            .addTo(amap)
            .bindPopup(createPopupContent(mappedRecord, mappings), { // Use richer popup content, add popup options
                maxWidth: 300,
                minWidth: 300,
                className: 'custom-popup' // Ensure custom-popup class is applied
            });

        amap.setView(latlng, 15); // Zoom to marker, zoom level 15 (adjust as needed)
    });

    grist.onRecords((data, mappings) => {
        if (!amap || !data || !mappings) return;
        console.log("grist.onRecords data:", data);
        console.log("grist.onRecords mappings:", mappings);
        // For now, onRecords is not doing marker updates - focusing on single record select zoom
    });
});
