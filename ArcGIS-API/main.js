require([
  "esri/Map",
  "esri/views/MapView",
  "esri/layers/TileLayer"
], function (Map, MapView, TileLayer) {

  var layer = new TileLayer({
    url: "https://imagery.oregonexplorer.info/arcgis/rest/services/NAIP_2009/NAIP_2009_WM/ImageServer",
  });

  var map = new Map({
    basemap: "gray",
    layers: [layer]
  });

  var view = new MapView({
    container: "myMap",
    map: map,
    center: [-123, 44],
    zoom: 13
  });
});
