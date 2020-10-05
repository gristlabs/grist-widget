Vue.component('pedigreelevel', {
  props: ['animal', 'bracket'],
	template: '#pedigree-level'
});

Vue.filter('asDate', function(value) {
  if (!value) { return ''; }
  if (typeof(value) === 'number') {
    value = new Date(value * 1000);
  }
  const date = moment.utc(value)
  return date.isValid() ? date.format('MM/DD/YYYY') : value;
});

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
  animal: null,
};

function handleError(err) {
  console.error(err);
  const target = app || data;
  target.animal = '';
  target.status = String(err).replace(/^Error: /, '');
  console.log(data);
}

function updateRecord(row) {
  try {
    data.status = '';
    if (row === null) {
      throw new Error("No data. Please add or select a row");
    }
    if (!row.PedigreeData) {
      throw new Error('Need a column named "PedigreeData", with a formula like "RECORD(rec, expand_refs=5)"');
    }
    if (!('Dam' in row.PedigreeData && 'Sire' in row.PedigreeData)) {
      throw new Error(`Need columns for parents named "Dam" and "Sire"`);
    }
    data.animal = {...row.PedigreeData};
  } catch (err) {
    handleError(err);
  }
}

ready(function() {
  // Update the widget anytime the document data changes.
  grist.ready();
  grist.onRecord(updateRecord);

  Vue.config.errorHandler = handleError;
  app = new Vue({
    el: '#app',
    data: data,
  });
});
