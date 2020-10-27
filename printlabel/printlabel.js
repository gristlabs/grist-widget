function ready(fn) {
  if (document.readyState !== 'loading'){
    fn();
  } else {
    document.addEventListener('DOMContentLoaded', fn);
  }
}

const templates = [{
  id: 'labels30',
  name: '30 per sheet (1" x 2-5/8")',
  details: 'Compatible with Avery® 5160®, 5260™, 5520™, 5660®, 5810™, 5960™, 5970™, 5971™ , 5972™, 5979™, 5980™, 8160™, 8460™, 8660™, 8810™',
}];

let useListFromRow = false;

let app = undefined;
let data = {
  status: 'waiting',
  labels: null,
  template: templates[0],
};

function handleError(err) {
  console.error(err);
  const target = app || data;
  target.labels = null;
  target.status = String(err).replace(/^Error: /, '');
  console.log(data);
}

function updateRecord(row) {
  try {
    if (row && Array.isArray(row.LabelText)) {
      useListFromRow = true;
      if (!row.LabelText.length) {
        throw new Error("No data. Please add some rows");
      }
      data.status = '';
      data.labels = row.LabelText;
    } else {
      useListFromRow = false;
    }
  } catch (err) {
    handleError(err);
  }
}

function updateRecords(rows) {
  if (useListFromRow) {
    return;
  }
  try {
    data.status = '';
    if (!rows || !rows.length) {
      throw new Error("No data. Please add some rows");
    }
    if (!rows[0].LabelText) {
      throw new Error('Need a visible column named "LabelText"');
    }
    data.labels = rows.map(r => r.LabelText);
  } catch (err) {
    handleError(err);
  }
}

ready(function() {
  // Update the widget anytime the document data changes.
  grist.ready();
  grist.onRecord(updateRecord);
  grist.onRecords(updateRecords);

  Vue.config.errorHandler = handleError;
  app = new Vue({
    el: '#app',
    data: data,
  });
});
