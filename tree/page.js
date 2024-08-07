let map;
let nameColumn = 'Name';
let ownerColumn = 'Owner';

function initializeMap() {
  map = new maplibregl.Map({
    container: 'map',
    style: 'https://api.maptiler.com/maps/02c3290e-4c70-4f5f-8701-51554ec4cfb2/style.json?key=TbsQ5qLxJHC20Jv4Th7E',
    center: [-123.25260, 44.71041],
    zoom: 8.4
  });

  const nav = new maplibregl.NavigationControl();
  map.addControl(nav, 'top-left');

  map.on('load', () => {
    grist.ready();
    grist.onRecords((records) => {
      updateMap(records);
    });

    grist.onOptions((options, previousOptions) => {
      if (options.nameColumn) nameColumn = options.nameColumn;
      if (options.ownerColumn) ownerColumn = options.ownerColumn;
    });

    grist.onRecord((record, previousRecord) => {
      if (record && record.Longitude && record.Latitude) {
        map.flyTo({
          center: [record.Longitude, record.Latitude],
          zoom: 15
        });
      }
    });
  });

  document.getElementById('saveConfig').addEventListener('click', () => {
    const nameCol = document.getElementById('nameColumn').value;
    const ownerCol = document.getElementById('ownerColumn').value;

    grist.setOptions({
      nameColumn: nameCol,
      ownerColumn: ownerCol
    });
  });
}

function updateMap(records) {
  if (map.getSource('locations')) {
    map.removeLayer('locations-layer');
    map.removeSource('locations');
  }

  const geojson = {
    type: 'FeatureCollection',
    features: records.map(record => ({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [record.Longitude, record.Latitude]
      },
      properties: {
        name: record[nameColumn],
        owner: record[ownerColumn]
      }
    }))
  };

  map.addSource('locations', {
    type: 'geojson',
    data: geojson,
    cluster: true,
    clusterMaxZoom: 14,
    clusterRadius: 50
  });

  map.addLayer({
    id: 'clusters',
    type: 'circle',
    source: 'locations',
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
    source: 'locations',
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
    source: 'locations',
    filter: ['!', ['has', 'point_count']],
    paint: {
      'circle-color': '#11b4da',
      'circle-radius': 8,
      'circle-stroke-width': 1,
      'circle-stroke-color': '#fff'
    }
  });

  map.on('click', 'unclustered-point', (e) => {
    const coordinates = e.features[0].geometry.coordinates.slice();
    const { name, owner } = e.features[0].properties;

    new maplibregl.Popup()
      .setLngLat(coordinates)
      .setHTML(`<strong>${name}</strong><p>${owner}</p>`)
      .addTo(map);
  });

  map.on('mouseenter', 'unclustered-point', () => {
    map.getCanvas().style.cursor = 'pointer';
  });

  map.on('mouseleave', 'unclustered-point', () => {
    map.getCanvas().style.cursor = '';
  });
}

window.onload = initializeMap;
