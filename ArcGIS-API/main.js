require([
  "esri/Map",
  "esri/views/MapView",
  "esri/layers/FeatureLayer",
  "esri/widgets/LayerList",
  "esri/renderers/SimpleRenderer",
  "esri/symbols/SimpleLineSymbol",
  "esri/symbols/SimpleFillSymbol"
], function (Map, MapView, FeatureLayer, LayerList, SimpleRenderer, SimpleLineSymbol, SimpleFillSymbol) {
  var map = new Map({
    basemap: "hybrid"
  });

  var view = new MapView({
    container: "myMap",
    map: map,
    center: [-123.018723, 44.925675],
    zoom: 18
  });

  // Define the Real Property layer
  var realPropertyLayer = new FeatureLayer({
    url: "https://services8.arcgis.com/8PAo5HGmvRMlF2eU/arcgis/rest/services/or_cadastral_wm/FeatureServer/6",
    title: "Real Property",
    outFields: ["*"],
    visible: false,  // Hide this layer but keep it for queries
    renderer: new SimpleRenderer({
      symbol: new SimpleFillSymbol({
        color: [0, 0, 0, 0],
        outline: new SimpleLineSymbol({
          color: [225, 237, 245, 0.5],
          width: 1
        })
      })
    })
  });

  // Define the Tax Lot layer with modified popup template
  var taxLotLayer = new FeatureLayer({
    url: "https://services8.arcgis.com/8PAo5HGmvRMlF2eU/arcgis/rest/services/or_cadastral_wm/FeatureServer/4",
    title: "Tax Lots",
    outFields: ["*"],
    renderer: new SimpleRenderer({
      symbol: new SimpleFillSymbol({
        color: [0, 0, 0, 0],
        outline: new SimpleLineSymbol({
          color: [225, 237, 245, 0.5],
          width: 1
        })
      }),
      visualVariables: [{
        type: "visibility",
        minDataValue: 14,
        maxDataValue: 15,
        minSize: 0,
        maxSize: 1
      }]
    })
  });

  // Function to query real property information
  function queryRealProperty(maptaxlot) {
    const query = realPropertyLayer.createQuery();
    query.where = `MapTaxlot = '${maptaxlot}'`;
    query.outFields = ["*"];
    return realPropertyLayer.queryFeatures(query);
  }

  // Set up view click event handler
  view.on("click", function(event) {
    view.hitTest(event).then(function(response) {
      const taxLotFeature = response.results.find(result => 
        result.graphic.layer === taxLotLayer
      );

      if (taxLotFeature) {
        const maptaxlot = taxLotFeature.graphic.attributes.MapTaxlot;
        
        queryRealProperty(maptaxlot).then(function(results) {
          if (results.features.length > 0) {
            const propertyInfo = results.features[0].attributes;
            
            // Create and show popup
            view.popup.open({
              title: "Property Information",
              location: event.mapPoint,
              content: `
                <div class="property-info">
                  <p><strong>Map Taxlot:</strong> ${propertyInfo.MapTaxlot || 'N/A'}</p>
                  <p><strong>Owner:</strong> ${propertyInfo.OwnerLine1 || 'N/A'}</p>
                  <p><strong>Business Name:</strong> ${propertyInfo.OwnerLine2 || 'N/A'}</p>
                  <p><strong>Additional Info:</strong> ${propertyInfo.OwnerLine3 || 'N/A'}</p>
                  <p><strong>Mailing Address:</strong> ${propertyInfo.MailAdd1 || 'N/A'}</p>
                  <p><strong>Mailing Address 2:</strong> ${propertyInfo.MailAdd2 || 'N/A'}</p>
                  <p><strong>Mailing City:</strong> ${propertyInfo.MailCity || 'N/A'}</p>
                  <p><strong>Mailing Zip:</strong> ${propertyInfo.MailZip || 'N/A'}</p>
                  <p><strong>Site Address:</strong> ${propertyInfo.SiteAddNam || 'N/A'}</p>
                  <p><strong>Site City:</strong> ${propertyInfo.SiteAddCty || 'N/A'}</p>
                </div>
              `
            });
          }
        }).catch(function(error) {
          console.error("Error querying real property:", error);
        });
      }
    });
  });

  // Add layers to the map
  map.add(taxLotLayer);
  map.add(realPropertyLayer);

  // Add Layer List widget
  var layerList = new LayerList({
    view: view
  });
  view.ui.add(layerList, "top-right");
});
