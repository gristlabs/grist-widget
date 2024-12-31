require([
  "esri/Map",
  "esri/views/MapView",
  "esri/layers/FeatureLayer"
], function (Map, MapView, FeatureLayer) {
  // Create the map with a hybrid basemap
  var map = new Map({
    basemap: "hybrid"
  });

  // Create the view centered on Oregon
  var view = new MapView({
    container: "myMap",
    map: map,
    center: [-123.018723, 44.925675], // Longitude, Latitude
    zoom: 12
  });

  // Define the four layers from the Oregon Parcel Viewer
  var taxCodeLayer = new FeatureLayer({
    url: "https://services8.arcgis.com/8PAo5HGmvRMlF2eU/arcgis/rest/services/or_cadastral_wm/FeatureServer/2",
    title: "Tax Code"
  });

  var mapIndexLayer = new FeatureLayer({
    url: "https://services8.arcgis.com/8PAo5HGmvRMlF2eU/arcgis/rest/services/or_cadastral_wm/FeatureServer/3",
    title: "Map Index"
  });

  var taxLotLayer = new FeatureLayer({
    url: "https://services8.arcgis.com/8PAo5HGmvRMlF2eU/arcgis/rest/services/or_cadastral_wm/FeatureServer/4",
    title: "Tax Lot"
  });

  var realPropertyTableLayer = new FeatureLayer({
    url: "https://services8.arcgis.com/8PAo5HGmvRMlF2eU/arcgis/rest/services/or_cadastral_wm/FeatureServer/6",
    title: "Real Property Table"
  });

  // Add the layers to the map
  map.addMany([taxCodeLayer, mapIndexLayer, taxLotLayer, realPropertyTableLayer]);
});
