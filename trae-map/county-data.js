// County data for tax assessor and GIS links
const countyUrls = {
  'BAKER': {
    taxUrl: 'https://www4.bakercountyor.gov/webproperty/Assessor_Search.html',
    gisUrl: 'https://ormap.net/gis/index.html'
  },
  'BENTON': {
    taxUrl: 'https://assessment.bentoncountyor.gov/property-account-search/',
    gisUrl: 'https://bentoncountygis.maps.arcgis.com/apps/webappviewer/index.html?id=57b2358b418142b2891b3e863c29126a'
  },
  'CLACKAMAS': {
    taxUrl: 'http://ascendweb.clackamas.us/',
    gisUrl: 'https://maps.clackamas.us/maps/cmap'
  },
  'CLATSOP': {
    taxUrl: 'https://apps.clatsopcounty.gov/property/',
    gisUrl: 'https://delta.co.clatsop.or.us/apps/ClatsopCounty/'
  },
  'COLUMBIA': {
    taxUrl: 'https://propertyquery.columbiacountyor.gov/columbiaat/MainQueryPage.aspx?QueryMode=&Query=',
    gisUrl: 'https://gis.columbiacountymaps.com/ColumbiaCountyWebMaps/'
  },
  'COOS': {
    taxUrl: 'https://records.co.coos.or.us/pso',
    gisUrl: 'https://www.arcgis.com/home/webmap/viewer.html?webmap=1be7dbc77f8745d78fc5f3e8e85fc05e&extent'
  },
  'CROOK': {
    taxUrl: 'https://apps.lanecounty.org/PropertyAssessmentTaxationSearch/crook/search/general',
    gisUrl: 'https://geo.co.crook.or.us/portal/apps/webappviewer/index.html?id=370f5ec185b945db9d92999cef827982'
  },
  'CURRY': {
    taxUrl: 'https://open.maps.rlid.org/CurryCounty/CurryCountyApp/index.html',
    gisUrl: 'https://open.maps.rlid.org/CurryCounty/CurryCountyApp/index.html'
  },
  'DESCHUTES': {
    taxUrl: 'https://dial.deschutes.org/',
    gisUrl: 'https://dial.deschutes.org/Real/InteractiveMap'
  },
  'DOUGLAS': {
    taxUrl: 'https://orion-pa.co.douglas.or.us/Home',
    gisUrl: 'https://geocortex.co.douglas.or.us/html5viewer/index.html?viewer=douglas_county_gis.viewer'
  },
  'GILLIAM': {
    taxUrl: '',
    gisUrl: 'https://ormap.net/gis/index.html'
  },
  'GRANT': {
    taxUrl: 'https://www.cci400web.com:8183/GrantCo_PropertyInq/',
    gisUrl: 'https://ormap.net/gis/index.html'
  },
  'HARNEY': {
    taxUrl: 'https://records.harneycountyor.gov/pso/',
    gisUrl: 'https://harneycounty.maps.arcgis.com/apps/webappviewer/index.html?id=22b86dac6fa8482ba7ab156c8dfa8889'
  },
  'HOOD RIVER': {
    taxUrl: 'https://records.co.hood-river.or.us/PSO',
    gisUrl: 'https://webmap.hoodrivercounty.gov/'
  },
  'JACKSON': {
    taxUrl: 'https://pdo.jacksoncountyor.gov/pdo/',
    gisUrl: 'https://hub.arcgis.com/maps/58ae5e6d9699445bad7ad78528785690'
  },
  'JEFFERSON': {
    taxUrl: 'https://query.co.jefferson.or.us/PSO',
    gisUrl: 'http://maps.co.jefferson.or.us/'
  },
  'JOSEPHINE': {
    taxUrl: 'https://jcpa.josephinecounty.gov/Home',
    gisUrl: 'https://joco.maps.arcgis.com/apps/webappviewer/index.html?id=6b4f29b1fe824d8d851088a44936739e'
  },
  'KLAMATH': {
    taxUrl: 'https://assessor.klamathcounty.org/PSO/',
    gisUrl: 'https://kcgis.maps.arcgis.com/apps/webappviewer/index.html?id=664411956da94614a80be24849b74c1b&extent=-13553674.8692%2C5191062.857%2C-13550617.3881%2C5192486.4967%2C102100'
  },
  'LAKE': {
    taxUrl: '',
    gisUrl: 'https://gis.lakecountyfl.gov/gisweb'
  },
  'LANE': {
    taxUrl: 'https://apps.lanecounty.org/PropertyAccountInformation/',
    gisUrl: 'https://lcmaps.lanecounty.org/LaneCountyMaps/LaneCountyMapsApp/index.html'
  },
  'LINCOLN': {
    taxUrl: 'https://propertyweb.co.lincoln.or.us/Home',
    gisUrl: 'https://maps.co.lincoln.or.us/#on=blank/blank;sketch/default;basemap_labels/city_labels;basemap_labels/town_labels;basemap_labels/rivers_and_streams_labels;basemap_labels/streets_labels;basemap_labels/HywShlds;Taxlots/Taxlots;Taxlots/TaxLines_NoSubtype;Taxlots/TaxLines_Subtype;Taxlots/TaxWaterLines;Taxlots/TaxLabels150;Taxlots/TaxArrows150;Taxlots_selection/Taxlots_selection;a_basemap/city;a_basemap/rivers_and_streams;a_basemap/water;a_basemap/land;a_basemap/sections;a_basemap/sectionstxt;a_basemap/Contours;a_basemap/Contours_(10ft);surveys_selection/surveys_selection;a_basemap_selection/sectionstxt_selection;Services_and_Districts_selection/Services_and_Districts_selection&loc=-124.99274;44.22348;-122.72907;45.10083'
  },
  'LINN': {
    taxUrl: 'https://lc-helionweb.co.linn.or.us/pso/',
    gisUrl: 'https://gis.co.linn.or.us/portal/apps/webappviewer/index.html?id=afcf95382e0148339c9edb3bed350137'
  },
  'MALHEUR': {
    taxUrl: 'https://www.cci400web.com:8183/MalheurCo_PropertyInq/',
    gisUrl: 'https://geo.maps.arcgis.com/apps/webappviewer/index.html?id=516e7d03477e496ea86de6fde8ff4f2b'
  },
  'MARION': {
    taxUrl: 'https://mcasr.co.marion.or.us/PropertySearch.aspx',
    gisUrl: 'https://marioncounty.maps.arcgis.com/apps/webappviewer/index.html?id=b41e1f1b340a448682a2cc47fff41b31'
  },
  'MORROW': {
    taxUrl: 'https://records.co.morrow.or.us/PSO/',
    gisUrl: 'https://ormap.net/gis/index.html'
  },
  'MULTNOMAH': {
    taxUrl: 'https://multcoproptax.com/Property-Search',
    gisUrl: 'https://multco.maps.arcgis.com/apps/webappviewer/index.html?id=9af70037e14d4bd2bfa3ed73f6fcd301'
  },
  'POLK': {
    taxUrl: 'https://apps2.co.polk.or.us/PSO',
    gisUrl: 'https://maps.co.polk.or.us/pcmaps/'
  },
  'SHERMAN': {
    taxUrl: '',
    gisUrl: 'https://ormap.net/gis/index.html'
  },
  'TILLAMOOK': {
    taxUrl: 'https://query.co.tillamook.or.us/PSO/',
    gisUrl: 'https://experience.arcgis.com/experience/f4434a096c5641b09c8eacb0d9caa8e9'
  },
  'UMATILLA': {
    taxUrl: 'https://umatillacogis.maps.arcgis.com/apps/webappviewer/index.html?id=31d08e9fa56045628407eb957b922892',
    gisUrl: 'https://umatillacogis.maps.arcgis.com/apps/webappviewer/index.html?id=31d08e9fa56045628407eb957b922892'
  },
  'UNION': {
    taxUrl: 'https://lookup.union-county.org/PSO',
    gisUrl: 'https://unioncounty-or.maps.arcgis.com/apps/instant/media/index.html?appid=ce153b227b1646b38403c5963702e4c2'
  },
  'WALLOWA': {
    taxUrl: '',
    gisUrl: 'https://ormap.net/gis/index.html'
  },
  'WASCO': {
    taxUrl: 'https://public.co.wasco.or.us/webtax/(S(y5f5x0cq0ht1hgap43wgofdg))/default.aspx',
    gisUrl: 'https://public.co.wasco.or.us/gisportal/apps/webappviewer/index.html?id=80a942ec81da4dd2bcc16032cc329459'
  },
  'WASHINGTON': {
    taxUrl: 'https://washcotax.co.washington.or.us/',
    gisUrl: 'https://wcgis1.co.washington.or.us/Html5Viewer/index.html?viewer=Intermap'
  },
  'WHEELER': {
    taxUrl: '',
    gisUrl: 'https://ormap.net/gis/index.html'
  },
  'YAMHILL': {
    taxUrl: 'https://ascendweb.co.yamhill.or.us/AcsendWeb/(S(04dpphdmjiwfm0iwgouyh5yd))/default.aspx',
    gisUrl: 'https://www.yamhillcountymaps.com/'
  }
};