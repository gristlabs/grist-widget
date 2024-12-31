require([
  "esri/Map",
  "esri/views/MapView",
  "esri/layers/FeatureLayer",
  "esri/widgets/LayerList"
], function (Map, MapView, FeatureLayer, LayerList) {
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

  // Define the Tax Code layer with custom styling and popup template
  var taxCodeLayer = new FeatureLayer({
    url: "https://services8.arcgis.com/8PAo5HGmvRMlF2eU/arcgis/rest/services/or_cadastral_wm/FeatureServer/2",
    title: "Tax Code",
    renderer: {
      type: "simple", // Simple Renderer
      symbol: {
        type: "simple-fill", // Fill symbol for polygons
        color: [255, 255, 178, 0.6], // Light yellow with transparency
        outline: {
          color: [255, 255, 0], // Yellow outline
          width: 1
        }
      }
    },
    popupTemplate: {
      title: "Tax Code Area",
      content: "<b>Tax Code:</b> {TaxCode}<br><b>Description:</b> {Description}"
    }
  });

  // Define the Map Index layer with custom styling and popup template
  var mapIndexLayer = new FeatureLayer({
    url: "https://services8.arcgis.com/8PAo5HGmvRMlF2eU/arcgis/rest/services/or_cadastral_wm/FeatureServer/3",
    title: "Map Index",
    renderer: {
      type: "simple",
      symbol: {
        type: "simple-fill",
        color: [178, 223, 138, 0.6], // Light green with transparency
        outline: {
          color: [51, 160, 44], // Dark green outline
          width: 1
        }
      }
    },
    popupTemplate: {
      title: "Map Index",
      content: "<b>Index Number:</b> {IndexNumber}<br><b>Additional Info:</b> {Info}"
    }
  });

  // Define the Tax Lot layer with custom styling and popup template
  var taxLotLayer = new FeatureLayer({
    url: "https://services8.arcgis.com/8PAo5HGmvRMlF2eU/arcgis/rest/services/or_cadastral_wm/FeatureServer/4",
    title: "Tax Lot",
    renderer: {
      type: "simple",
      symbol: {
        type: "simple-fill",
        color: [166, 206, 227, 0.6], // Light blue with transparency
        outline: {
          color: [31, 120, 180], // Dark blue outline
          width: 1
        }
      }
    },
    popupTemplate: {
      title: "Tax Lot Information",
      content: "<b>Owner Name:</b> {OwnerName}<br><b>Tax Lot:</b> {TaxLot}"
    }
  });

  // Define the Real Property Table layer with custom styling and popup template
  var realPropertyTableLayer = new FeatureLayer({
    url: "https://services8.arcgis.com/8PAo5HGmvRMlF2eU/arcgis/rest/services/or_cadastral_wm/FeatureServer/6",
    title: "Real Property Table",
    renderer: {
      type: "simple",
      symbol: {
        type: "simple-fill",
        color: [251, 154, 153, 0.6], // Light red with transparency
        outline: {
          color: [227, 26, 28], // Dark red outline
          width: 1
        }
      }
    },
    popupTemplate: {
      title: "Real Property Info",
      content: "<b>Property ID:</b> {PropertyID}<br><b>Address:</b> {Address}"
    }
  });

  // Add the layers to the map
  map.addMany([taxCodeLayer, mapIndexLayer, taxLotLayer, realPropertyTableLayer]);

  // Add a Layer List widget for toggling visibility
  var layerList = new LayerList({
    view: view
  });

  // Add the LayerList widget to the top-right corner of the view
  view.ui.add(layerList, "top-right");
});
