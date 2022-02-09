function ready(fn) {
  if (document.readyState !== 'loading'){
    fn();
  } else {
    document.addEventListener('DOMContentLoaded', fn);
  }
}

let app = undefined;
let data = {
  status: 'waiting',
  result: null,
  input: {
    description: null,
    button: null,
    actions: null,
  }
}

function handleError(err) {
  console.error('ERROR', err);
  data.status = String(err).replace(/^Error: /, '');
}

async function applyActions() {
  data.results = "Working...";
  try {
    await grist.docApi.applyUserActions(data.input.actions);
    data.message = 'Done';
  } catch (e) {
    data.message = `Please grant full access for writing. (${e})`;
  }
}

function onRecord(row, mapping) {
  try {
    data.status = '';
    data.results = null;
    data.column = mapping ? mapping.Action : "ActionButton";
    if (!row) {
      throw new Error("No data row. Please add some rows");
    }
    if (!row.hasOwnProperty(data.column)) {
      throw new Error('Need a visible column named "ActionButton". You can map a custom column in the Creator Panel.');
    }
    const keys = ['button', 'description', 'actions'];
    if (!row[data.column] || keys.some(k => !row[data.column][k])) {
      const allKeys = keys.map(k => JSON.stringify(k)).join(", ");
      const missing = keys.filter(k => !row[data.column][k]).map(k => JSON.stringify(k)).join(", ");
      throw new Error(`"ActionButton" cells should contain an object with keys ${allKeys}. ` +
        `Missing keys: ${missing}`);
    }
    data.input = row[data.column];
  } catch (err) {
    handleError(err);
  }
}

ready(function() {
  // Update the widget anytime the document data changes.
  grist.ready({columns: ["Action"]});
  grist.onRecord(onRecord);

  Vue.config.errorHandler = handleError;
  app = new Vue({
    el: '#app',
    data: data,
    methods: {applyActions}
  });
});
