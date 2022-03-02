// To update Grist table, we first need to know what table we are connected to.
// Here we will listen to all messages sent from Grist to our custom widget,
// and if any of this message has a tableId, we will store it in global window
// object.
let tableId;
grist.on("message", (data) => {
  if (data.tableId) {
    tableId = data.tableId;
  }
});

// Next we will listen to onRecords event and store the information
// that is send with this event in two global variables.
let rows = null; // All rows in a table.
let mappings = null; // Column mappings configuration.
grist.onRecords((_rows, _mappings) => {
  mappings = _mappings;
  rows = grist.mapColumnNames(_rows);
  if (!rows) {
    // grist.mapColumnNames helper will return null if not all
    // columns are mapped.
    app.error = "Please map columns";
  } else {
    app.error = "";
    app.updated = rows.length ? Math.max(...rows.map(r => r.Updated ?? 0)) : 0;
    // Get prices and symbols from rows.
    const symbols = new Set(rows.map(x => x.Name));
    app.list = Array.from(symbols).map(s => ({
      Name: s,
      Price: rows.find(r => r.Name === s)?.Price
    }));
  }
})

// Helper function to chunk array into smaller list of max n elements.
// Yahoo finance API can only receive 10 symbols at a time.
function* chunks(arr, n) {
  for (let i = 0; i < arr.length; i += n) {
    yield arr.slice(i, i + n);
  }
}

// Main function that will fetch last price of each symbol in the array
// from Yahoo Finance API.
async function fetchPrices(symbols) {
  const prices = [];
  for (const c of chunks(symbols, 10)) {
    const prefix = String(c);
    const res = await fetch("https://yfapi.net/v6/finance/quote?" + new URLSearchParams({
      lang: 'en',
      region: 'US',
      symbols: prefix
    }), {
      headers: {
        "x-api-key": app.apikey
      }
    });
    if (res.status === 200) {
      const result = await res.json();
      if (result?.quoteResponse.error) {
        throw new Error(result?.quoteResponse.error);
      }
      prices.push(...result.quoteResponse.result.map(x => ({Name: x.symbol, Price: x.ask})));
    } else {
      throw new Error(res.statusText || `Error response with ${res.status} status`);
    }
  }
  return prices;
}

// Function invoked when we press the Refresh button.
const refreshClicked = async () => {
  if (!rows) {
    app.error = "Please map columns";
    return;
  }
  if (!app.apikey) {
    app.error = "Please enter API key";
    return;
  }
  try {
    app.waiting = true;
    app.error = null;
    // Remove duplicates from symbols.
    const toQuery = Array.from(new Set(rows.map(r => r.Name)));
    const prices = await fetchPrices(toQuery);
    const rowIds = [];
    const values = [];
    for (const r of rows) {
      const price = prices.find(x => x.Name == r.Name)?.Price;
      rowIds.push(r.id);
      values.push(price ?? "Not found");
    }
    const priceColumn = mappings['Price'];
    await grist.docApi.applyUserActions([
      ['BulkUpdateRecord', tableId, rowIds, {[priceColumn]: values}]
    ]);
  } catch (err) {
    console.log(err);
    app.error = err.message;
  } finally {
    app.waiting = false;
  }
};

// Tell Grist that we are ready, and inform about our requirements.
grist.ready({
  // We need full access to the document, in order to update stock prices.
  requiredAccess: 'full',
  // We need some information how to read the table.
  columns: [{name: "Name", title: "Symbol"}, "Price", {name: "Updated", type: "Date", optional: true}],
  // Show configuration screen when we press "Open configuration" in the Creator panel.
  onEditOptions() {
    app.config = true;
  }
});

// Grist will send "options" event when loaded with all options we stored.
grist.onOptions(options => {
  // Read the apikey we saved in the document.
  app.apikey = options?.apikey || '';
});

// Here we will use VueJS framework to bind JavaScript object to HTML.
const app = Vue.createApp({
  data() {
    return {
      // If we are currently waiting for the prices.
      waiting: false,
      // Api key stored inside the textbox on the configuration screen.
      apikey: '',
      // Holds error message that can be shown on the UI.
      error: '',
      // If config screen is visible.
      config: false,
      // Current status.
      message: 'Wait ...',
      // Holds last date we updated the stock price (optional)
      updated: null,
      // List of all stock symbols and their last read prices.
      list: [{
      }]
    }
  },
  methods: {
    refresh() {
      refreshClicked();
    },
    saveConfig() {
      this.config = false;
      grist.setOption("apikey", this.apikey);
    }
  }
}).mount('#app')