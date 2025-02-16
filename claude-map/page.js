"use strict";

/* global grist, window, L */

let amap;
let selectedTableId = null;

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
            { name: "PopupIMG", type: 'Text', optional: true } // Renamed displayed name to "PopupIMG" - TEST for DOMTokenList error
        ],
        allowSelectBy: true,
    });

    amap = initializeMap(); // Initialize map AFTER grist.ready

    grist.on('message', (e) => { // Moved message handler inside DOMContentLoaded
        console.log('grist.on message e.tableId:', e.tableId); // Debug log
        selectedTableId = e.tableId;
        console.log('selectedTableId set to:', selectedTableId); // Debug log
    });

    grist.onRecord((record) => {
        if (!record || !record.Latitude || !record.Longitude) return;

        L.marker([record.Latitude, record.Longitude])
            .addTo(amap)
            .bindPopup(`<b>${record.Name}</b><br>${record.PopupIMG || 'No Image'}`); // Basic popup
    });

    grist.onRecords((data) => {
        if (!amap || !data) return;
        // For now, just log the data to console to see if it's received
        console.log("grist.onRecords data:", data);
    });
});
