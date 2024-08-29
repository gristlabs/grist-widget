// get the table selector element
const tableSelector = document.getElementById('table-selector');

// add an event listener to the table selector
tableSelector.addEventListener('change', async (e) => {
  const selectedTableId = e.target.value;
  // get the table data from Grist
  const tableData = await grist.getRecords(selectedTableId);
  // process the table data
  const featureCollection = processTableData(tableData);
  // add the feature collection to the map
  addFeatureCollectionToMap(featureCollection);
});

// function to process the table data
function processTableData(tableData) {
  // get the columns that contain latitude and longitude data
  const latCol = tableData.columns.find((col) => col.name === 'Latitude');
  const lngCol = tableData.columns.find((col) => col.name === 'Longitude');
  // create a feature collection from the table data
  const featureCollection = turf.featureCollection(tableData.records.map((record) => {
    return {
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [record[lngCol.name], record[latCol.name]]
      },
      properties: record
    };
  }));
  return featureCollection;
}

// function to add the feature collection to the map
function addFeatureCollectionToMap(featureCollection) {
  // get the mapbox map instance
  const map = getMapboxMapInstance();
  // add the feature collection to the map
  map.addLayer({
    id: 'csvData',
    type: 'circle',
    source: {
      type: 'geojson',
      data: featureCollection
    },
    paint: {
      'circle-radius': 5,
      'circle-color': 'purple'
    }
  });
  // add an event listener to the map to handle click events
  map.on('click', 'csvData', (e) => {
    // get the selected record from the table
    const selectedRecord = getSelectedRecord();
    // create a popup with the selected record's data
    const popup = createPopup(selectedRecord);
    // add the popup to the map
    popup.addTo(map);
  });
}

// function to get the mapbox map instance
function getMapboxMapInstance() {
  // get the mapbox map instance from the map element
  const map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/streets-v11',
    center: [-122.411, 37.785],
    zoom: 10
  });
  return map;
}

// function to get the selected record from the table
function getSelectedRecord() {
  // get the table selector element
  const tableSelector = document.getElementById('table-selector');
  // get the selected table id
  const selectedTableId = tableSelector.value;
  // get the selected record from the table
  const selectedRecord = grist.getRecord(selectedTableId, grist.getSelectedRowId());
  return selectedRecord;
}

// function to create a popup with the selected record's data
function createPopup(selectedRecord) {
  // create a popup element
  const popup = new mapboxgl.Popup()
   .setLngLat([-122.411, 37.785])
   .setHTML(`
      <h3>${selectedRecord.Name}</h3>
      <p>${selectedRecord.Address}</p>
      <p>${selectedRecord.Phone}</p>
    `);
  return popup;
}
