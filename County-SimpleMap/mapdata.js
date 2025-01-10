var simplemaps_statemap_mapdata={
  main_settings: {
   //General settings
    width: "responsive", //'700' or 'responsive'
    background_color: "#0962ab",
    background_transparent: "no",
    popups: "on_click",
    
    //State defaults
    state_description: "State description",
    state_color: "#88A4BC",
    state_hover_color: "#3B729F",
    state_opacity: ".5",
    state_hover_opacity: ".6",
    border_hover_color: "#3b729f",
    state_url: "",
    border_size: "1",
    border_color: "#000000",
    all_states_inactive: "no",
    all_states_zoomable: "yes",
    
    //Location defaults
    location_description: "Location description",
    location_color: "#FF0067",
    location_opacity: 0.8,
    location_hover_opacity: 1,
    location_url: "",
    location_size: 25,
    location_type: "square",
    location_border_color: "#FFFFFF",
    location_border: 2,
    location_hover_border: 2.5,
    all_locations_inactive: "no",
    all_locations_hidden: "no",
    
    //Label defaults
    label_color: "#0962ab",
    label_hover_color: "#000000",
    label_size: "",
    label_font: "Noto Sans Regular, Verdana, Arial, sans-serif",
    label_display: "auto",
    hide_labels: "no",
    label_scale: "yes",
    hide_eastern_labels: false,
    manual_zoom: "no",
    back_image: "no",
    arrow_box: "no",
    navigation_size: "40",
    navigation_color: "#f7f7f7",
    navigation_border_color: "#636363",
    initial_back: "no",
    initial_zoom: -1,
    initial_zoom_solo: "no",
    region_opacity: 1,
    region_hover_opacity: 0.6,
    zoom_out_incrementally: "yes",
    zoom_percentage: 0.99,
    zoom_time: 0.5,
    
    //Popup settings
    popup_color: "white",
    popup_opacity: 0.9,
    popup_shadow: 1,
    popup_corners: 5,
    popup_font: "12px/1.5 Verdana, Arial, Helvetica, sans-serif",
    popup_nocss: "no",
    
    //Advanced settings
    div: "map",
    auto_load: "yes",
    rotate: "0",
    url_new_tab: "yes",
    keyboard_navigation: "no",
    images_directory: "default",
    import_labels: "no",
    fade_time: 0.1,
    link_text: "View Website",
    backgroundmap_tiles_url: "https://cdn.simplemaps.com/pmtiles/state/OR.pmtiles",
    backgroundmap_js_url: "https://cdn.simplemaps.com/js/backgroundmap/4.5/backgroundmap.js",
    state_image_url: "",
    state_image_position: "",
    location_image_url: ""
  },
  state_specific: {
    "41001": {
      name: "Baker",
      description: "<a href=\"https://www4.bakercountyor.gov/webproperty/Assessor_Search.html\">🔍 Search</a><br /><a href=\"https://bakerco.maps.arcgis.com/apps/instant/sidebar/index.html?appid=56f13a98d69f4c0f94a142dbda9b7828\">🌎 GIS</a>",
      hide: "no",
      inactive: "no"
    },
    "41003": {
      name: "Benton",
      hide: "no",
      inactive: "no",
      description: "<a href=\"https://assessment.bentoncountyor.gov/property-account-search/\">🔍 Search</a><br /><a href=\"https://bentoncountygis.maps.arcgis.com/apps/webappviewer/index.html?id=57b2358b418142b2891b3e863c29126a\">🌎 GIS</a>"
    },
    "41005": {
      name: "Clackamas",
      hide: "no",
      inactive: "no",
      description: "<a href=\"http://ascendweb.clackamas.us/\">🔍 Search</a><br /><a href=\"https://maps.clackamas.us/maps/cmap\">🌎 GIS</a>"
    },
    "41007": {
      name: "Clatsop",
      hide: "no",
      inactive: "no",
      description: "<a href=\"https://apps.clatsopcounty.gov/property/\">🔍 Search</a><br /><a href=\"https://delta.co.clatsop.or.us/apps/ClatsopCounty/\">🌎 GIS</a>"
    },
    "41009": {
      name: "Columbia",
      hide: "no",
      inactive: "no",
      description: "<a href=\"https://propertyquery.columbiacountyor.gov/columbiaat/MainQueryPage.aspx?QueryMode=&Query=\">🔍 Search</a><br /><a href=\"https://gis.columbiacountymaps.com/ColumbiaCountyWebMaps/\">🌎 GIS</a>"
    },
    "41011": {
      name: "Coos",
      hide: "no",
      inactive: "no",
      description: "<a href=\"https://records.co.coos.or.us/pso\">🔍 Search</a><br /><a href=\"https://www.arcgis.com/home/webmap/viewer.html?webmap=1be7dbc77f8745d78fc5f3e8e85fc05e&extent\">🌎 GIS</a>"
    },
    "41013": {
      name: "Crook",
      hide: "no",
      inactive: "no",
      description: "<a href=\"https://apps.lanecounty.org/PropertyAssessmentTaxationSearch/crook/search/general\">🔍 Search</a><br /><a href=\"https://geo.co.crook.or.us/portal/apps/webappviewer/index.html?id=370f5ec185b945db9d92999cef827982\">🌎 GIS</a>"
    },
    "41015": {
      name: "Curry",
      hide: "no",
      inactive: "no",
      description: "<a href=\">🔍 Search</a><br /><a href=\"https://open.maps.rlid.org/CurryCounty/CurryCountyApp/index.html\">🌎 GIS</a>"
    },
    "41017": {
      name: "Deschutes",
      hide: "no",
      inactive: "no",
      description: "<a href=\"https://dial.deschutes.org/\">🔍 Search</a><br /><a href=\"https://dial.deschutes.org/Real/InteractiveMap\">🌎 GIS</a>"
    },
    "41019": {
      name: "Douglas",
      hide: "no",
      inactive: "no",
      description: "<a href=\"https://orion-pa.co.douglas.or.us/Home\">🔍 Search</a><br /><a href=\"https://geocortex.co.douglas.or.us/html5viewer/index.html?viewer=douglas_county_gis.viewer\">🌎 GIS</a>"
    },
    "41021": {
      name: "Gilliam",
      hide: "no",
      inactive: "no",
      description: "<a href=\">🔍 Search</a><br /><a href=\">🌎 GIS</a>"
    },
    "41023": {
      name: "Grant",
      hide: "no",
      inactive: "no",
      description: "<a href=\"https://www.cci400web.com:8183/GrantCo_PropertyInq/\">🔍 Search</a><br /><a href=\"https://ormap.net/gis/index.html\">🌎 GIS</a>"
    },
    "41025": {
      name: "Harney",
      hide: "no",
      inactive: "no",
      description: "<a href=\"https://records.harneycountyor.gov/pso/\">🔍 Search</a><br /><a href=\"https://harneycounty.maps.arcgis.com/apps/webappviewer/index.html?id=22b86dac6fa8482ba7ab156c8dfa8889\">🌎 GIS</a>"
    },
    "41027": {
      name: "Hood River",
      hide: "no",
      inactive: "no",
      description: "<a href=\"https://records.co.hood-river.or.us/PSO\">🔍 Search</a><br /><a href=\"https://webmap.hoodrivercounty.gov/\">🌎 GIS</a>"
    },
    "41029": {
      name: "Jackson",
      hide: "no",
      inactive: "no",
      description: "<a href=\"https://pdo.jacksoncountyor.gov/pdo/index.cfm?bTextOnly=True\">🔍 Search</a><br /><a href=\"https://hub.arcgis.com/maps/58ae5e6d9699445bad7ad78528785690\">🌎 GIS</a>"
    },
    "41031": {
      name: "Jefferson",
      hide: "no",
      inactive: "no",
      description: "<a href=\"https://query.co.jefferson.or.us/PSO\">🔍 Search</a><br /><a href=\"http://maps.co.jefferson.or.us/\">🌎 GIS</a>"
    },
    "41033": {
      name: "Josephine",
      hide: "no",
      inactive: "no",
      description: "<a href=\"https://jcpa.josephinecounty.gov/Home\">🔍 Search</a><br /><a href=\"https://joco.maps.arcgis.com/apps/webappviewer/index.html?id=6b4f29b1fe824d8d851088a44936739e\">🌎 GIS</a>"
    },
    "41035": {
      name: "Klamath",
      hide: "no",
      inactive: "no",
      description: "<a href=\"https://assessor.klamathcounty.org/PSO/\">🔍 Search</a><br /><a href=\"https://kcgis.maps.arcgis.com/apps/webappviewer/index.html?id=664411956da94614a80be24849b74c1b&extent=-13553674.8692%2C5191062.857%2C-13550617.3881%2C5192486.4967%2C102100\">🌎 GIS</a>"
    },
    "41037": {
      name: "Lake",
      hide: "no",
      inactive: "no",
      description: "<a href=\"https://records.lakecountyor.org/pso\">🔍 Search</a><br /><a href=\"https://gis.lakecountyfl.gov/gisweb\">🌎 GIS</a>"
    },
    "41039": {
      name: "Lane",
      hide: "no",
      inactive: "no",
      description: "<a href=\"https://lcmaps.lanecounty.org/PropertySearchNew/?portalId=3585881&pageId=5145461#searchTab\">🔍 Search</a><br /><a href=\"https://lcmaps.lanecounty.org/LaneCountyMaps/LaneCountyMapsApp/index.html\nhttps://apps.lanecounty.org/PropertyAccountInformation/\">🌎 GIS</a>"
    },
    "41041": {
      name: "Lincoln",
      hide: "no",
      inactive: "no",
      description: "<a href=\"https://propertyweb.co.lincoln.or.us/Home\">🔍 Search</a><br /><a href=\"https://maps.co.lincoln.or.us/#on=blank/blank;sketch/default;basemap_labels/city_labels;basemap_labels/town_labels;basemap_labels/rivers_and_streams_labels;basemap_labels/streets_labels;basemap_labels/Streets;basemap_labels/HywShlds;Taxlots/Taxlots;Taxlots/TaxLines_NoSubtype;Taxlots/TaxLines_Subtype;Taxlots/TaxWaterLines;Taxlots/TaxLabels150;Taxlots/TaxArrows150;Taxlots_selection/Taxlots_selection;a_basemap/city;a_basemap/rivers_and_streams;a_basemap/water;a_basemap/land;a_basemap/sections;a_basemap/sectionstxt;a_basemap/Contours;a_basemap/Contours_(10ft);surveys_selection/surveys_selection;a_basemap_selection/sectionstxt_selection;Services_and_Districts_selection/Services_and_Districts_selection&loc=-124.99274;44.22348;-122.72907;45.10083\">🌎 GIS</a>"
    },
    "41043": {
      name: "Linn",
      hide: "no",
      inactive: "no",
      description: "<a href=\"https://lc-helionweb.co.linn.or.us/pso/\">🔍 Search</a><br /><a href=\"https://gis.co.linn.or.us/portal/apps/webappviewer/index.html?id=afcf95382e0148339c9edb3bed350137\">🌎 GIS</a>"
    },
    "41045": {
      name: "Malheur",
      hide: "no",
      inactive: "no",
      description: "<a href=\"https://www.cci400web.com:8183/MalheurCo_PropertyInq/\">🔍 Search</a><br /><a href=\"https://geo.maps.arcgis.com/apps/webappviewer/index.html?id=516e7d03477e496ea86de6fde8ff4f2b\">🌎 GIS</a>"
    },
    "41047": {
      name: "Marion",
      hide: "no",
      inactive: "no",
      description: "<a href=\"https://mcasr.co.marion.or.us/Default.aspx\">🔍 Search</a><br /><a href=\"https://marioncounty.maps.arcgis.com/apps/webappviewer/index.html?id=b41e1f1b340a448682a2cc47fff41b31\">🌎 GIS</a>"
    },
    "41049": {
      name: "Morrow",
      hide: "no",
      inactive: "no",
      description: "<a href=\"https://records.co.morrow.or.us/PSO/\">🔍 Search</a><br /><a href=\"https://ormap.net/gis/index.html\">🌎 GIS</a>"
    },
    "41051": {
      name: "Multnomah",
      hide: "no",
      inactive: "no",
      description: "<a href=\"https://multcoproptax.com/Property-Search\">🔍 Search</a><br /><a href=\"https://multco.maps.arcgis.com/apps/webappviewer/index.html?id=9af70037e14d4bd2bfa3ed73f6fcd301\">🌎 GIS</a>"
    },
    "41053": {
      name: "Polk",
      hide: "no",
      inactive: "no",
      description: "<a href=\"https://apps2.co.polk.or.us/PSO\">🔍 Search</a><br /><a href=\"https://maps.co.polk.or.us/pcmaps/\">🌎 GIS</a>"
    },
    "41055": {
      name: "Sherman",
      hide: "no",
      inactive: "no",
      description: "<a href=\">🔍 Search</a><br /><a href=\"https://ormap.net/gis/index.html\">🌎 GIS</a>"
    },
    "41057": {
      name: "Tillamook",
      hide: "no",
      inactive: "no",
      description: "<a href=\"https://query.co.tillamook.or.us/PSO/\">🔍 Search</a><br /><a href=\"https://experience.arcgis.com/experience/f4434a096c5641b09c8eacb0d9caa8e9\">🌎 GIS</a>"
    },
    "41059": {
      name: "Umatilla",
      hide: "no",
      inactive: "no",
      description: "<a href=\"https://public.co.umatilla.or.us/pso/\">🔍 Search</a><br /><a href=\"https://umatillacogis.maps.arcgis.com/apps/webappviewer/index.html?id=31d08e9fa56045628407eb957b922892\">🌎 GIS</a>"
    },
    "41061": {
      name: "Union",
      hide: "no",
      inactive: "no",
      description: "<a href=\"https://lookup.union-county.org/PSO\">🔍 Search</a><br /><a href=\">🌎 GIS</a>"
    },
    "41063": {
      name: "Wallowa",
      hide: "no",
      inactive: "no",
      description: "<a href=\">🔍 Search</a><br /><a href=\">🌎 GIS</a>"
    },
    "41065": {
      name: "Wasco",
      hide: "no",
      inactive: "no",
      description: "<a href=\"https://public.co.wasco.or.us/webtax/Shasaymxt5nipcfygfuzfwwvp/default.aspx\">🔍 Search</a><br /><a href=\"https://public.co.wasco.or.us/gisportal/apps/webappviewer/index.html?id=80a942ec81da4dd2bcc16032cc329459\">🌎 GIS</a>"
    },
    "41067": {
      name: "Washington",
      hide: "no",
      inactive: "no",
      description: "<a href=\"https://washcotax.co.washington.or.us/\">🔍 Search</a><br /><a href=\"https://wcgis1.co.washington.or.us/Html5Viewer/index.html?viewer=Intermap\">🌎 GIS</a>"
    },
    "41069": {
      name: "Wheeler",
      hide: "no",
      inactive: "no",
      description: "<a href=\">🔍 Search</a><br /><a href=\">🌎 GIS</a>"
    },
    "41071": {
      name: "Yamhill",
      hide: "no",
      inactive: "no",
      description: "<a href=\"https://ascendweb.co.yamhill.or.us/AcsendWeb/Sylmwv2q3uwgsxn4oq3qeufgz/default.aspx\">🔍 Search</a><br /><a href=\"https://www.yamhillcountymaps.com/\">🌎 GIS</a>"
    }
  },
  locations: {},
  labels: {
    "41001": {
      name: "Baker",
      parent_id: "41001"
    },
    "41003": {
      name: "Benton",
      parent_id: "41003"
    },
    "41005": {
      name: "Clackamas",
      parent_id: "41005"
    },
    "41007": {
      name: "Clatsop",
      parent_id: "41007"
    },
    "41009": {
      name: "Columbia",
      parent_id: "41009"
    },
    "41011": {
      name: "Coos",
      parent_id: "41011"
    },
    "41013": {
      name: "Crook",
      parent_id: "41013"
    },
    "41015": {
      name: "Curry",
      parent_id: "41015"
    },
    "41017": {
      name: "Deschutes",
      parent_id: "41017"
    },
    "41019": {
      name: "Douglas",
      parent_id: "41019"
    },
    "41021": {
      name: "Gilliam",
      parent_id: "41021"
    },
    "41023": {
      name: "Grant",
      parent_id: "41023"
    },
    "41025": {
      name: "Harney",
      parent_id: "41025"
    },
    "41027": {
      name: "Hood River",
      parent_id: "41027"
    },
    "41029": {
      name: "Jackson",
      parent_id: "41029"
    },
    "41031": {
      name: "Jefferson",
      parent_id: "41031"
    },
    "41033": {
      name: "Josephine",
      parent_id: "41033"
    },
    "41035": {
      name: "Klamath",
      parent_id: "41035"
    },
    "41037": {
      name: "Lake",
      parent_id: "41037"
    },
    "41039": {
      name: "Lane",
      parent_id: "41039"
    },
    "41041": {
      name: "Lincoln",
      parent_id: "41041"
    },
    "41043": {
      name: "Linn",
      parent_id: "41043"
    },
    "41045": {
      name: "Malheur",
      parent_id: "41045"
    },
    "41047": {
      name: "Marion",
      parent_id: "41047"
    },
    "41049": {
      name: "Morrow",
      parent_id: "41049"
    },
    "41051": {
      name: "Multnomah",
      parent_id: "41051"
    },
    "41053": {
      name: "Polk",
      parent_id: "41053"
    },
    "41055": {
      name: "Sherman",
      parent_id: "41055"
    },
    "41057": {
      name: "Tillamook",
      parent_id: "41057"
    },
    "41059": {
      name: "Umatilla",
      parent_id: "41059"
    },
    "41061": {
      name: "Union",
      parent_id: "41061"
    },
    "41063": {
      name: "Wallowa",
      parent_id: "41063"
    },
    "41065": {
      name: "Wasco",
      parent_id: "41065"
    },
    "41067": {
      name: "Washington",
      parent_id: "41067"
    },
    "41069": {
      name: "Wheeler",
      parent_id: "41069"
    },
    "41071": {
      name: "Yamhill",
      parent_id: "41071"
    }
  },
  legend: {
    entries: []
  },
  regions: {}
};