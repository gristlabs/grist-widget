"use strict";

/* global grist, window, mapboxgl */

let map;
let selectedTableId = null;
let selectedRowId = null;
let selectedRecords = null;
let mode = 'multi';
let mapSource = 'mapbox://styles/sgfroerer/clzc4a3mw00c901rc8836bh9z';
let mapCopyright = '© Mapbox, © OpenStreetMap contributors';

// Required, Label value
const Name = "Name";
// Required
const Longitude = "Longitude";
// Required
const Latitude = "Latitude";
// Image URL
const ImageURL = "ImageURL";
// Optional - switch column to trigger geocoding
const Geocode = 'Geocode';
// Optional - but required for geocoding. Field with address to find (might be formula)
const Address = 'Address';
// Optional - but useful for geocoding. Blank field which map uses
//            to store last geocoded Address. Enables map widget
//            to automatically update the geocoding if Address is changed
const GeocodedAddress = 'GeocodedAddress';
let lastRecord;
let lastRecords;

// Mapbox access token
mapboxgl.accessToken = 'pk.eyJ1Ijoic2dmcm9lcmVyIiwiYSI6ImNsdGk4cWY0OTBkaXgycG1kNDNreGpqYTgifQ.P0pY9LfTCJLO9abd0Y41QQ';

function initMap() {
  console.log("Initializing map...");
  map = new mapboxgl.Map({
    container: 'map',
    style: mapSource,
    center: [-98, 38.88], // Initial center point (longitude, latitude)
    zoom: 3 // Initial zoom level
  });

  map.on('load', function() {
    console.log("Map loaded.");
    map.addSource('properties', {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: []
      },
      cluster: true,
      clusterMaxZoom: 14, // Max zoom to cluster points on
      clusterRadius: 50 // Radius of each cluster when clustering points (defaults to 50)
    });

    map.addLayer({
      id: 'clusters',
      type: 'circle',
      source: 'properties',
      filter: ['has', 'point_count'],
      paint: {
        'circle-color': [
          'step',
          ['get', 'point_count'],
          '#51bbd6',
          100,
          '#f1f075',
          750,
          '#f28cb1'
        ],
        'circle-radius': [
          'step',
          ['get', 'point_count'],
          20,
          100,
          30,
          750,
          40
        ]
      }
    });

    map.addLayer({
      id: 'cluster-count',
      type: 'symbol',
      source: 'properties',
      filter: ['has', 'point_count'],
      layout: {
        'text-field': '{point_count_abbreviated}',
        'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
        'text-size': 12
      }
    });

    map.addLayer({
      id: 'unclustered-point',
      type: 'circle',
      source: 'properties',
      filter: ['!', ['has', 'point_count']],
      paint: {
        'circle-color': '#11b4da',
        'circle-radius': 8,
        'circle-stroke-width': 1,
        'circle-stroke-color': '#fff'
      }
    });

    updateMap(selectedRecords);

    map.on('click', 'clusters', function (e) {
      var features = map.queryRenderedFeatures(e.point, {
        layers: ['clusters']
      });
      var clusterId = features[0].properties.cluster_id;
      map.getSource('properties').getClusterExpansionZoom(
        clusterId,
        function (err, zoom) {
          if (err) return;

          map.easeTo({
            center: features[0].geometry.coordinates,
            zoom: zoom
          });
        }
      );
    });

    map.on('click', 'unclustered-point', function (e) {
      const coordinates = e.features[0].geometry.coordinates.slice();
      const { id, name, lng, lat, imageUrl } = e.features[0].properties;

      const popupContent = `<strong>${name}</strong><br><img src="${imageUrl}" alt="${name}" style="width: 200px; height: auto;">`;

      const popup = new mapboxgl.Popup({ offset: 25 })
        .setLngLat(coordinates)
        .setHTML(popupContent)
        .addTo(map);

      selectMarker(id);
    });

    map.on('mouseenter', 'clusters', function () {
      map.getCanvas().style.cursor = 'pointer';
    });
    map.on('mouseleave', 'clusters', function () {
      map.getCanvas().style.cursor = '';
    });
  });
}

function updateMap(data) {
  console.log("Updating map with data: ", data);
  data = data || selectedRecords;
  selectedRecords = data;
  if (!data || data.length === 0) {
    showProblem("No data found yet");
    return;
  }

  console.log("Columns in data: ", Object.keys(data[0]));

  if (!(Longitude in data[0] && Latitude in data[0] && Name in data[0] && ImageURL in data[0])) {
    showProblem("Table does not yet have all expected columns: Name, Longitude, Latitude, ImageURL. You can map custom columns"+
    " in the Creator Panel.");
    return;
  }

  if (!map) {
    console.log("Map not initialized, initializing now...");
    initMap();
  }

  const features = data.map(rec => {
    const { id, name, lng, lat, imageUrl } = getInfo(rec);
    if (String(lng) === '...') { return null; }
    if (Math.abs(lat) < 0.01 && Math.abs(lng) < 0.01) { return null; }

    return {
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [lng, lat]
      },
      properties: {
        id,
        name,
        lng,
        lat,
        imageUrl
      }
    };
  }).filter(f => f !== null);

  map.getSource('properties').setData({
    type: 'FeatureCollection',
    features: features
  });

  makeSureSelectedMarkerIsShown();
}

function selectMarker(id) {
  selectedRowId = id;
  grist.setCursorPos?.({rowId: id}).catch(() => {});

  const feature = selectedRecords.find(rec => rec.id === id);
  if (feature) {
    const coordinates = [parseFloat(feature[Longitude]), parseFloat(feature[Latitude])];
    map.flyTo({ center: coordinates, zoom: 15, essential: true });
  }
}

function getInfo(rec) {
  const result = {
    id: rec.id,
    name: parseValue(rec[Name]),
    lng: parseValue(rec[Longitude]),
    lat: parseValue(rec[Latitude]),
    imageUrl: parseValue(rec[ImageURL])
  };
  return result;
}

function makeSureSelectedMarkerIsShown() {
  const rowId = selectedRowId;
  if (rowId) {
    const feature = selectedRecords.find(rec => rec.id === rowId);
    if (feature) {
      const coordinates = [parseFloat(feature[Longitude]), parseFloat(feature[Latitude])];
      map.flyTo({ center: coordinates, zoom: 15, essential: true });
    }
  }
}

function parseValue(v) {
  if (typeof(v) === 'object' && v !== null && v.value && v.value.startsWith('V(')) {
    const payload = JSON.parse(v.value.slice(2, v.value.length - 1));
    return payload.remote || payload.local || payload.parent || payload;
  }
  return v;
}

function showProblem(txt) {
  console.error(txt);
  document.getElementById('map').innerHTML = '<div class="error">' + txt + '</div>';
}

grist.on('message', (e) => {
  console.log("Received message: ", e);
  if (e.tableId) { selectedTableId = e.tableId; }
});

grist.onRecord((record, mappings) => {
  console.log("Received record: ", record);
  lastRecord = grist.mapColumnNames(record) || record;
  selectOnMap(lastRecord);
});

grist.onRecords((data, mappings) => {
  console.log("Received records: ", data);
  lastRecords = grist.mapColumnNames(data) || data;
  updateMap(lastRecords);
});

grist.onNewRecord(() => {
  console.log("New record event");
  popups = {};
});

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

function onEditOptions() {
  const popup = document.getElementById("settings");
  popup.style.display = 'block';
  const btnClose = document.getElementById("btnClose");
  btnClose.onclick = () => popup.style.display = 'none';
  const checkbox = document.getElementById('cbxMode');
  checkbox.checked = mode === 'multi' ? true : false;
  checkbox.onchange = () => mode = checkbox.checked ? 'multi' : 'single';
  ['mapSource', 'mapCopyright'].forEach((opt) => {
    const elem = document.getElementById(opt);
    elem.value = (opt === "mapSource" ? mapSource : mapCopyright);
    elem.onchange = async (e) => {
      switch (opt) {
        case 'mapSource': mapSource = e.target.value; break;
        case 'mapCopyright': mapCopyright = e.target.value; break;
      }
      initMap();
    }
  });
}

async function updateMode() {
  const data = await grist.getOption("mode");
  mode = data === "multi" ? "multi" : "single";
}

window.addEventListener('DOMContentLoaded', () => {
  updateMode();
  grist.ready();
});
