function ready(fn) {
  if (document.readyState !== "loading") {
    fn();
  } else {
    document.addEventListener("DOMContentLoaded", fn);
  }
}

const URL_COL_NAME = "url";
let previousUrl = null;

async function gristRecordSelected(record, mappedColNamesToRealColNames) {
  const mappedRecord = grist.mapColumnNames(record);
  if (!mappedRecord) return;
  if (URL_COL_NAME in mappedRecord) {
    let url = mappedRecord[URL_COL_NAME];
    if (url != previousUrl) {
      console.log(`Webframe loading URL ${url} from record`, record);
      previousUrl = url;
      document.querySelector("#the_frame").src = url;
    }
  } else {
    document.body.innerHTML = "Please map the URL column, then reload.";
  }
}

// Start once the DOM is ready.
ready(function(){
  // Let Grist know we're ready to talk.
  grist.ready({
    requiredAccess: "read table",
    columns: [
      { name: URL_COL_NAME, type: "Text,Choice", title: "URL", description: "The URL of the website to load." },
    ],
  });
  // Register callback for when the user selects a record in Grist.
  grist.onRecord(gristRecordSelected);
});
