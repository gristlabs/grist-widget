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
// Required, Label value
const Name = "Name";
// Required
const Longitude = "Longitude";
// Required
const GeoJSON = "GeoJSON";
const Latitude = "Latitude";
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


//Color markers downloaded from leaflet repo, color-shifted to green
//Used to show currently selected pin
const selectedIcon =  new L.Icon({
  iconUrl: 'marker-icon-green.png',
  iconRetinaUrl: 'marker-icon-green-2x.png',
  shadowUrl: 'marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});
const defaultIcon =  new L.Icon.Default();



// Creates clusterIcons that highlight if they contain selected row
// Given a function `() => selectedMarker`, return a cluster icon create function
// that can be passed to MarkerClusterGroup({iconCreateFunction: ... } )
//
// Cluster with selected record gets the '.marker-cluster-selected' class
// (defined in screen.css)
//
// Copied from _defaultIconCreateFunction in ClusterMarkerGroup
//    https://github.com/Leaflet/Leaflet.markercluster/blob/master/src/MarkerClusterGroup.js
const selectedRowClusterIconFactory = function (selectedMarkerGetter) {
  return function(cluster) {
    var childCount = cluster.getChildCount();

    let isSelected = false;
    try {
      const selectedMarker = selectedMarkerGetter();

      // hmm I think this is n log(n) to build all the clusters for the whole map.
      // It's probably fine though, it only fires once when map markers
      // are set up or when selectedRow changes
      isSelected = cluster.getAllChildMarkers().filter((m) => m == selectedMarker).length > 0;
    } catch (e) {
      console.error("WARNING: Error in clusterIconFactory in map widget");
      console.error(e);
    }

    var c = ' marker-cluster-';
    if (childCount < 10) {
      c += 'small';
    } else if (childCount < 100) {
      c += 'medium';
    } else {
      c += 'large';
    }

    return new L.DivIcon({
        html: '<div><span>'
            + childCount
            + ' <span aria-label="markers"></span>'
            + '</span></div>',
        className: 'marker-cluster' + c + (isSelected ? ' marker-cluster-selected' : ''),
        iconSize: new L.Point(40, 40)
    });
  }
};

let geocoder = L.Control.Geocoder && L.Control.Geocoder.nominatim();
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
  const results = await geocoder.geocode(address);
  let v = results[0];

  if (v) {
    v = v.center;
  }

  return v;
}

async function delay(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

// If widget has wright access
let writeAccess = true;
// A ongoing scanning promise, to check if we are in progress.
let scanning = null;

async function scan(tableId, records, mappings) {
  if (!writeAccess) { return; }
  for (const record of records) {
    // We can only scan if Geocode column was mapped.
    if (!(Geocode in record)) { break; }
    // And the value in the column is truthy.
    if (!record[Geocode]) { continue; }
    // Get the address to search.
    const address = record.Address;
    // Little caching here. We will set GeocodedAddress to last address we searched,
    // so after next round - we will check if the address is indeed changed.
    // But this field is optional, if it is not in the record (not mapped)
    // we will find the location each time (if coordinates are empty).
    if (record[GeocodedAddress]) {
      if (record[GeocodedAddress] == record.Address) {
        // We have already (successfully or not) attempted to geocode this address, skip it
        continue;
      } else {
        // We have caching field, and last address is diffrent.
        // So clear coordinates (as if the record wasn't scanned before)
        record[Longitude] = null;
        record[Latitude] = null;
        record[GeoJSON] = null;
      }
    }
    // If address is not empty, and coordinates are empty (or were cleared by cache)
    if (address && !record[Longitude]) {
      // Find coordinates.
      const result = await geocode(address);
      // Update them, and update cache (if the field was mapped)
      await grist.docApi.applyUserActions([ ['UpdateRecord', tableId, record.id, {
        [mappings[Longitude]]: result?.lng ?? null,
        [mappings[Latitude]]: result?.lat ?? null,
        ...(GeocodedAddress in mappings && mappings[GeocodedAddress]) ? {[mappings[GeocodedAddress]]: address} : undefined
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

// Little extra wrinkle to deal with showing differences.  Should be taken
// care of by Grist once diffing is out of beta.
function parseValue(v) {
  if (typeof(v) === 'object' && v !== null && v.value && v.value.startsWith('V(')) {
    const payload = JSON.parse(v.value.slice(2, v.value.length - 1));
    return payload.remote || payload.local || payload.parent || payload;
  }
  return v;
}

function getInfo(rec) {
  const result = {
    id: rec.id,
    name: parseValue(rec[Name]),
    lng: parseValue(rec[Longitude]),
    lat: parseValue(rec[Latitude]),
    geojson: parseValue(rec[GeoJSON]),
  };
  return result;
}

// Recursively extract all coordinate points from a GeoJSON geometry
function extractPointsFromGeoJSON(geojson) {
  const points = [];

  function extractCoordinates(coords, depth) {
    if (depth === 0) {
      // We've reached a coordinate pair [lng, lat]
      points.push(new L.LatLng(coords[1], coords[0]));
      return;
    }

    // Recurse into nested arrays
    for (let i = 0; i < coords.length; i++) {
      extractCoordinates(coords[i], depth - 1);
    }
  }

  if (!geojson || !geojson.type) {
    return points;
  }

  try {
    const geometry = geojson.type === "Feature" ? geojson.geometry : geojson;

    if (!geometry || !geometry.coordinates) {
      return points;
    }

    // Determine nesting depth based on geometry type
    const depthMap = {
      Point: 0,
      LineString: 1,
      Polygon: 2,
      MultiPoint: 1,
      MultiLineString: 2,
      MultiPolygon: 3,
    };

    const depth = depthMap[geometry.type];
    if (depth !== undefined) {
      extractCoordinates(geometry.coordinates, depth);
    } else if (geometry.type === "GeometryCollection") {
      for (let i = 0; i < geometry.geometries.length; i++) {
        points.push(...extractPointsFromGeoJSON(geometry.geometries[i]));
      }
    }
  } catch (e) {
    console.error("Error extracting points from GeoJSON:", e);
  }

  return points;
}

// Function to clear last added markers. Used to clear the map when new record is selected.
let clearMarkers = () => {};
let clearGeoJSONLayers = () => {};

let markers = [];
let geoJSONLayers = {};
let geoJSONGroup = null;

function updateMap(data, mappings) {
  data = data || selectedRecords;
  selectedRecords = data;
  if (!data || data.length === 0) {
    showProblem("No data found yet");
    return;
  }

  // Determine if we're in GeoJSON mode
  const isGeoJSONMode = mappings && GeoJSON in mappings && mappings[GeoJSON];

  // Check for mixed column usage and show warning
  if (isGeoJSONMode) {
    const hasCoordinateColumns = data.some(rec => 
      (Latitude in rec && rec[Latitude] != null) ||
      (Longitude in rec && rec[Longitude] != null) ||
      (Geocode in rec && rec[Geocode] != null)
    );
    if (hasCoordinateColumns) {
      const warningMsg =
        "GeoJSON column detected - ignoring Latitude, Longitude, and Geocode columns";
      console.warn(warningMsg);
      showProblem(warningMsg + ". GeoJSON takes precedence.");
    }
  } else {
    if (!(Longitude in data[0] && Latitude in data[0] && Name in data[0])) {
      showProblem(
        "Table does not yet have all expected columns: Name, Longitude, Latitude. You can map custom columns" +
          " in the Creator Panel.",
      );
      return;
    }
  }

  // Map tile source:
  //    https://leaflet-extras.github.io/leaflet-providers/preview/
  //    Old source was natgeo world map, but that only has data up to zoom 16
  //    (can't zoom in tighter than about 10 city blocks across)
  //
  const tiles = L.tileLayer(mapSource, { attribution: DOMPurify.sanitize(mapCopyright, {FORCE_BODY: true})});

  const error = document.querySelector('.error');
  if (error) { error.remove(); }
  if (amap) {
    try {
      amap.off();
      amap.remove();
    } catch (e) {
      // ignore
      console.warn(e);
    }
  }
  const map = L.map('map', {
    layers: [tiles],
    wheelPxPerZoomLevel: 90, //px, default 60, slows scrollwheel zoom
  });

  // Make sure clusters always show up above points
  // Default z-index for markers is 600, 650 is where tooltipPane z-index starts
  map.createPane('selectedMarker').style.zIndex = 620;
  map.createPane('clusters'      ).style.zIndex = 610;
  map.createPane('otherMarkers'  ).style.zIndex = 600;

  const points = []; //L.LatLng[], used for zooming to bounds of all markers

  popups = {}; // Map: {[rowid]: L.marker or L.geoJSON layer}
  geoJSONLayers = {};

  if (isGeoJSONMode) {
    // GeoJSON mode
    geoJSONGroup = L.featureGroup();

    for (const rec of data) {
      const { id, name, geojson } = getInfo(rec);

      if (!geojson) {
        continue;
      }

      let parsedGeoJSON;
      try {
        parsedGeoJSON =
          typeof geojson === "string" ? JSON.parse(geojson) : geojson;
      } catch (e) {
        console.error("Invalid GeoJSON for row", id, ":", e);
        continue;
      }

      // Extract points for bounds
      points.push(...extractPointsFromGeoJSON(parsedGeoJSON));

      // Create GeoJSON layer
      const layer = L.geoJSON(parsedGeoJSON, {
        style: {
          opacity: id == selectedRowId ? 0.6 : 0.3,
          fillOpacity: id == selectedRowId ? 0.6 : 0.3,
        },
        pointToLayer: function (feature, latlng) {
          return L.marker(latlng, {
            icon: id == selectedRowId ? selectedIcon : defaultIcon,
            pane: id == selectedRowId ? "selectedMarker" : "otherMarkers",
          });
        },
        onEachFeature: function (feature, layer) {
          layer.bindPopup(name);
          layer.on("click", () => {
            selectGeoJSONFeature(id);
          });
        },
      });

      geoJSONGroup.addLayer(layer);
      geoJSONLayers[id] = layer;
      popups[id] = layer;
    }

    map.addLayer(geoJSONGroup);
    clearGeoJSONLayers = () => map.removeLayer(geoJSONGroup);
  } else {
    // Coordinates mode (original behavior)
    // Make this before markerClusterGroup so iconCreateFunction
    // can fetch the currently selected marker from popups by function closure

    markers = L.markerClusterGroup({
      disableClusteringAtZoom: 18,
      //If markers are very close together, they'd stay clustered even at max zoom
      //This disables that behavior explicitly for max zoom (18)
      maxClusterRadius: 30, //px, default 80
      // default behavior clusters too aggressively. It's nice to see individual markers
      showCoverageOnHover: true,

      clusterPane: "clusters", //lets us specify z-index, so cluster icons can be on top
      iconCreateFunction: selectedRowClusterIconFactory(
        () => popups[selectedRowId],
      ),
    });

    markers.on("click", (e) => {
      const id = e.layer.options.id;
      selectMaker(id);
    });

    for (const rec of data) {
      const { id, name, lng, lat } = getInfo(rec);
      // If the record is in the middle of geocoding, skip it.
      if (String(lng) === "...") {
        continue;
      }
      if (Math.abs(lat) < 0.01 && Math.abs(lng) < 0.01) {
        // Stuff at 0,0 usually indicates bad imports/geocoding.
        continue;
      }
      const pt = new L.LatLng(lat, lng);
      points.push(pt);

      const marker = L.marker(pt, {
        title: name,
        id: id,
        icon: id == selectedRowId ? selectedIcon : defaultIcon,
        pane: id == selectedRowId ? "selectedMarker" : "otherMarkers",
      });

      marker.bindPopup(name);
      markers.addLayer(marker);

      popups[id] = marker;
    }
    map.addLayer(markers);

    clearMarkers = () => map.removeLayer(markers);
  }

  try {
    map.fitBounds(new L.LatLngBounds(points), {maxZoom: 15, padding: [0, 0]});
  } catch (err) {
    console.warn('cannot fit bounds');
  }
  function makeSureSelectedMarkerIsShown() {
    const rowId = selectedRowId;

    if (rowId && popups[rowId]) {
      const item = popups[rowId];
      if (isGeoJSONMode) {
        // For GeoJSON, open popup on the layer
        item.openPopup();
      } else {
        // For markers
        if (!item._icon) {
          markers.zoomToShowLayer(item);
        }
        item.openPopup();
      }
    }
  }

  amap = map;

  makeSureSelectedMarkerIsShown();
}


function clearPopupMarker() {
  const marker = popups[selectedRowId];
  if (marker) {
    marker.closePopup();
    if (marker.setIcon) {
      // It's a marker
      marker.setIcon(defaultIcon);
      marker.pane = "otherMarkers";
    } else {
      // It's a GeoJSON layer
      marker.setStyle({
        opacity: 0.3,
        fillOpacity: 0.3,
      });
    }
  }
}

function selectMaker(id) {
   // Reset the options from the previously selected marker.
   const previouslyClicked = popups[selectedRowId];
   if (previouslyClicked) {
     previouslyClicked.setIcon(defaultIcon);
     previouslyClicked.pane = 'otherMarkers';
   }
   const marker = popups[id];
   if (!marker) { return null; }

   // Remember the new selected marker.
   selectedRowId = id;

   // Set the options for the newly selected marker.
   marker.setIcon(selectedIcon);
   marker.pane = 'selectedMarker';

   // Rerender markers in this cluster
   markers.refreshClusters();

   // Update the selected row in Grist.
   grist.setCursorPos?.({rowId: id}).catch(() => {});

   return marker;
}

function selectGeoJSONFeature(id) {
  // Reset opacity for previously selected feature
  const previouslyClicked = geoJSONLayers[selectedRowId];
  if (previouslyClicked) {
    previouslyClicked.setStyle({
      opacity: 0.3,
      fillOpacity: 0.3,
    });
    previouslyClicked.eachLayer(function (layer) {
      if (layer.setIcon) {
        layer.setIcon(defaultIcon);
      }
    });
  }

  const layer = geoJSONLayers[id];
  if (!layer) {
    return null;
  }

  // Remember the new selected feature
  selectedRowId = id;

  // Set style for newly selected feature
  layer.setStyle({
    opacity: 0.6,
    fillOpacity: 0.6,
  });
  layer.eachLayer(function (l) {
    if (l.setIcon) {
      l.setIcon(selectedIcon);
    }
  });

  // Update the selected row in Grist
  grist.setCursorPos?.({ rowId: id }).catch(() => {});

  return layer;
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
      [GeoJSON]: hasCol(GeoJSON, record) ? GeoJSON : null,
      [Address]: hasCol(Address, record) ? Address : null,
      [GeocodedAddress]: hasCol(GeocodedAddress, record) ? GeocodedAddress : null,
      [Geocode]: hasCol(Geocode, record) ? Geocode : null,
    };
  }
  return mappings;
}

function selectOnMap(rec, mappings) {
  // If this is already selected row, do nothing (to avoid flickering)
  if (selectedRowId === rec.id) { return; }

  selectedRowId = rec.id;
  if (mode === "single") {
    updateMap([rec], mappings);
  } else {
    updateMap(null, mappings);
  }
}

grist.onRecord((record, mappings) => {
  if (mode === 'single') {
    // If mappings are not done, we will assume that table has correct columns.
    // This is done to support existing widgets which where configured by
    // renaming column names.
    lastRecord = grist.mapColumnNames(record) || record;
    selectOnMap(lastRecord, mappings);
    scanOnNeed(defaultMapping(record, mappings));
  } else {
    const isGeoJSONMode = mappings && GeoJSON in mappings && mappings[GeoJSON];
    if (isGeoJSONMode) {
      const feature = selectGeoJSONFeature(record.id);
      if (!feature) {
        return;
      }
      feature.openPopup();
    } else {
      const marker = selectMaker(record.id);
      if (!marker) {
        return;
      }
      markers.zoomToShowLayer(marker);
      marker.openPopup();
    }
  }
});
grist.onRecords((data, mappings) => {
  lastRecords = grist.mapColumnNames(data) || data;
  if (mode !== 'single') {
    // If mappings are not done, we will assume that table has correct columns.
    // This is done to support existing widgets which where configured by
    // renaming column names.
    updateMap(lastRecords, mappings);
    if (lastRecord) {
      selectOnMap(lastRecord, mappings);
    }
    // We need to mimic the mappings for old widgets
    scanOnNeed(defaultMapping(data[0], mappings));
  }
});

grist.onNewRecord(() => {
  if (mode === 'single') {
    clearMarkers();
    clearGeoJSONLayers();
    clearMarkers = () => {};
    clearGeoJSONLayers = () => {};
  } else {
    clearPopupMarker();
  }
  selectedRowId = null;
})

function updateMode(mappings) {
  if (mode === "single") {
    if (lastRecord) {
      selectedRowId = lastRecord.id;
      updateMap([lastRecord], mappings);
    }
  } else {
    updateMap(lastRecords, mappings);
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
    { name: "Longitude", type: "Numeric" },
    { name: "Latitude", type: "Numeric" },
    {
      name: "GeoJSON",
      type: "Text",
      optional,
      description:
        "`geometry` attribute of geojson data. If set, `Longitude` and `Latitude` will not be used.",
    },
    { name: "Geocode", type: "Bool", title: "Geocode", optional },
    { name: "Address", type: "Text", optional },
    {
      name: "GeocodedAddress",
      type: "Text",
      title: "Geocoded Address",
      optional,
    },
  ],
  allowSelectBy: true,
  onEditOptions
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
  document.getElementById("mapSource").value = mapSource;
  const newCopyright = options?.mapCopyright ?? mapCopyright;
  mapCopyright = newCopyright
  document.getElementById("mapCopyright").value = mapCopyright;
});
