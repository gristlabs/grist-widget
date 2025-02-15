"use strict";

let amap;
let markersLayer;
let selectedRowId = null;

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
    attribution: ''
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
    wheelPxPerZoomLevel: 90
  });

  L.control.layers(baseLayers, overlayLayers, { position: 'topright', collapsed: true }).addTo(amap);

  const searchControl = L.esri.Geocoding.geosearch({
    providers: [L.esri.Geocoding.arcgisOnlineProvider()],
    position: 'topleft',
    useMapBounds: false // Ensure search is not restricted to current map bounds
  }).addTo(amap);

  const searchResults = L.layerGroup().addTo(amap);

  searchControl.on('results', function (data) {
    searchResults.clearLayers(); // Clear previous results
    if (data.results.length > 0) {
      for (let i = 0; i < data.results.length; i++) {
        const result = data.results[i];
        const marker = L.marker(result.latlng, { icon: searchIcon });
        marker.bindPopup(`<b>${result.text}</b>`).openPopup();
        searchResults.addLayer(marker);
      }
    }
  });

  overlayLayers["Search Results"] = searchResults;

  return amap;
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
    const marker = L.marker([record.Latitude, record.Longitude], {
      title: record.Name,
      icon: record.id === selectedRowId ? selectedIcon : defaultIcon
    });

    const popupContent = `
      <div class="card bg-base-100 shadow-xl">
        <figure class="px-4 pt-4">
          ${record.ImageURL ? `
            <img src="${record.ImageURL}" alt="${record.Name}" class="rounded-xl w-full h-40 object-cover" />
          ` : `
            <div class="w-full h-40 bg-gray-100 flex items-center justify-center rounded-xl">
              <span class="text-gray-400">No Image Available</span>
            </div>
          `}
        </figure>
        <div class="card-body p-4">
          <h2 class="card-title text-lg">${record.Name}</h2>
          <div class="text-sm">
            <p><strong>Address:</strong> ${record.Address}</p>
            <p><strong>Property ID:</strong> ${record.id}</p>
          </div>
          <div class="card-actions justify-end mt-2">
            <a href="${record.County_Hyper || '#'}" class="btn btn-sm btn-outline" target="_blank">County</a>
            <a href="${record.GIS || '#'}" class="btn btn-sm btn-outline" target="_blank">GIS</a>
            <a href="${record.CoStar_URL || '#'}" class="btn btn-sm btn-outline" target="_blank">CoStar</a>
          </div>
        </div>
      </div>
    `;

    marker.bindPopup(popupContent, {
      maxWidth: 300,
      minWidth: 300,
      className: 'custom-popup'
    });

    markersLayer.addLayer(marker);
  });
}

function toggleDetails(header) {
  const details = header.nextElementSibling;
  if (details) {
    details.classList.toggle('hidden');
  }
}

function copyToClipboard(element) {
  const textToCopy = element.dataset.copy || element.innerText;
  navigator.clipboard.writeText(textToCopy).then(() => {
    const tooltip = document.createElement('div');
    tooltip.className = 'copy-tooltip';
    tooltip.textContent = 'Copied!';
    element.appendChild(tooltip);
    setTimeout(() => { tooltip.remove(); }, 1000);
  });
}

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
    { name: "Geocode", type: 'Bool', title: 'Geocode', optional: true },
    { name: "Address", type: 'Text', optional: true },
    { name: "GeocodedAddress", type: 'Text', title: 'Geocoded Address', optional: true },
  ],
  allowSelectBy: true
});

grist.onRecord((record) => {
  selectedRowId = record.id;
  updateMap([record]);
});

grist.onRecords((records) => {
  updateMap(records);
});
