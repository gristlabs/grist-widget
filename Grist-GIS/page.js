"use strict";

/* global grist, window */

let amap;
let popups = {};
let selectedTableId = null;
let selectedRowId = null;
let selectedRecords = null;
let mode = 'multi';
let mapSource = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}';
let mapCopyright = 'Tiles &copy; Esri &mdash; Source: Esri, DeLorme, NAVTEQ, USGS, Intermap, iPC, NRCAN, Esri Japan, METI, Esri China (Hong Kong), Esri (Thailand), TomTom, 2012';
// Required columns
const Name = "Name";
const Longitude = "Longitude";
const Latitude = "Latitude";
// Optional columns
const Property_Type = 'Property_Type';
const Tenants = 'Tenants';
const Secondary_Type = 'Secondary_Type';
const ImageURL = 'ImageURL';
const CoStar_URL = 'CoStar_URL';
const County_Hyper = 'County_Hyper';
const GIS = 'GIS';
const Address = 'Address';
const GeocodedAddress = 'GeocodedAddress';
let lastRecord;
let lastRecords;

const searchIcon = L.divIcon({
  className: 'custom-pin',
  html: `<svg width="30" height="45" viewBox="0 0 30 45" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M15 0C6.71572 0 0 6.71572 0 15C0 23.2843 15 45 15 45C15 45 30 23.2843 30 15C30 6.71572 23.2843 0 15 0Z" 
          fill="#FFD700" 
          stroke="#B8860B" 
          stroke-width="2"/>
    <circle cx="15" cy="15" r="6" fill="#B8860B"/>
  </svg>`,
  iconSize: [30, 45],
  iconAnchor: [15, 45],
  popupAnchor: [0, -45]
});

let searchMarker;

async function performSearch(query, map) {
  try {
    const response = await fetch(
      `https://api.maptiler.com/geocoding/${encodeURIComponent(query)}.json?key=TbsQ5qLxJHC20Jv4Th7E`
    );
    const data = await response.json();

    if (data.features && data.features.length > 0) {
      const location = data.features[0];
      const [lng, lat] = location.center;

      if (searchMarker) {
        map.removeLayer(searchMarker);
      }

      searchMarker = L.marker([lat, lng], { icon: searchIcon }).addTo(map);
      searchMarker.bindPopup(location.place_name).openPopup();
      map.setView([lat, lng], 15);
    }
  } catch (error) {
    console.error('Error performing search:', error);
  }
}

function addSearchControl(map) {
  const searchContainer = L.DomUtil.create('div', 'leaflet-control-search');
  searchContainer.style.backgroundColor = 'white';
  searchContainer.style.padding = '5px';
  searchContainer.style.margin = '10px';
  searchContainer.style.borderRadius = '4px';
  searchContainer.style.boxShadow = '0 1px 5px rgba(0,0,0,0.4)';

  const searchInput = L.DomUtil.create('input', 'search-input', searchContainer);
  searchInput.type = 'text';
  searchInput.placeholder = 'Search address...';
  searchInput.style.padding = '5px';
  searchInput.style.width = '250px';
  searchInput.style.border = '1px solid #ccc';
  searchInput.style.borderRadius = '4px';

  const searchControl = L.Control.extend({
    options: { position: 'topright' },
    onAdd: function () { return searchContainer; }
  });

  map.addControl(new searchControl());
  L.DomEvent.disableClickPropagation(searchContainer);

  searchInput.addEventListener('input', (e) => {
    const query = e.target.value.trim();
    if (query.length > 2) {
      performSearch(query, map);
    }
  });
}

function updateMap(data) {
  data = data || selectedRecords;
  selectedRecords = data;

  if (!data || data.length === 0) {
    console.warn("No data available for the map.");
    return;
  }

  if (!(Longitude in data[0] && Latitude in data[0] && Name in data[0])) {
    console.error("Table does not yet have all expected columns: Name, Longitude, Latitude.");
    return;
  }

  const tiles = L.tileLayer(mapSource, { attribution: mapCopyright });

  if (amap) {
    amap.off();
    amap.remove();
  }

  const map = L.map('map', { layers: [tiles], center: [0, 0], zoom: 2 });
  amap = map;
  addSearchControl(map);

  const points = [];
  popups = {};

  const markers = L.markerClusterGroup({
    disableClusteringAtZoom: 18,
    maxClusterRadius: 30,
    iconCreateFunction: selectedRowClusterIconFactory(() => popups[selectedRowId]),
  });

  for (const rec of data) {
    const { id, name, lng, lat } = getInfo(rec);
    if (!lng || !lat) continue;

    const marker = L.marker([lat, lng], { title: name });
    marker.bindPopup(`<strong>${name}</strong>`);
    markers.addLayer(marker);
    popups[id] = marker;
    points.push(new L.LatLng(lat, lng));
  }

  map.addLayer(markers);

  if (points.length) {
    map.fitBounds(L.latLngBounds(points), { maxZoom: 15 });
  } else {
    map.setView([0, 0], 2);
  }
}
