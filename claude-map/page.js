"use strict";

/* global grist, window, L */

let amap;
let selectedTableId = null; // Initialize selectedTableId immediately
let selectedRecords = null; // Initialize selectedRecords
let lastRecord;
let lastRecords;
let mode = 'multi'; // Default mode
let selectedRowId = null;
let currentMappings = { // Initialize default mappings
    Longitude: "Longitude",
    Name: "Name",
    Latitude: "Latitude",
    "PopupIMG": "PopupIMG", // Changed to "PopupIMG" to match displayed name and avoid spaces
};


function initializeMap() {
    amap = L.map('map').setView([45.5283, -122.8081], 10); // Basic map, default view

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(amap);

    return amap;
}

document.addEventListener("DOMContentLoaded", function () {
    grist.ready({
        columns: [
            "Name",
            { name: "Longitude", type: 'Numeric' },
            { name: "Latitude", type: 'Numeric' },
            { name: "PopupIMG", type: 'Text', optional: true } // Displayed name is now "PopupIMG" (no space)
        ],
        columnMap: currentMappings, // Apply default mappings
        allowSelectBy: true,
    });

    amap = initializeMap(); // Initialize map AFTER grist.ready

    grist.on('message', (e) => { // Moved message handler inside DOMContentLoaded
        console.log('grist.on message e.tableId:', e.tableId); // Debug log
        selectedTableId = e.tableId;
        console.log('selectedTableId set to:', selectedTableId); // Debug log
    });

    grist.onRecord((record, mappings) => { // Added mappings parameter
        const mappedRecord = grist.mapColumnNames(record) || record; // Apply column mapping
        if (!mappedRecord || !mappedRecord[mappings.Latitude] || !mappedRecord[mappings.Longitude]) return;

        L.marker([mappedRecord[mappings.Latitude], mappedRecord[mappings.Longitude]]) // Use mappings
            .addTo(amap)
            .bindPopup(`<b>${mappedRecord[mappings.Name]}</b><br>${mappedRecord[mappings.PopupIMG] || 'No Image'}`); // Basic popup, use mappings
    });

    grist.onRecords((data, mappings) => { // Added mappings parameter
        if (!amap || !data || !mappings) return;
        // For now, just log the data to console to see if it's received
        console.log("grist.onRecords data:", data);
        console.log("grist.onRecords mappings:", mappings); // Log mappings too
    });
});
