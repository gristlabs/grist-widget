Vue.component('pedigreelevel', {
  props: ['animal', 'bracket'],
	template: '#pedigree-level'
});

Vue.filter('asDate', function(value) {
  if (typeof(value) === 'number') {
    value = new Date(value * 1000);
  }
  const date = moment.utc(value)
  return date.isValid() ? date.format('DD/MM/YYYY') : value;
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
      throw new Error("(No data - please add or select a row)");
    }
    data.animal = {...row.References};
    console.log("GOT ROW", row, "DATA IS", data);
  } catch (err) {
    handleError(err);
  }
}

ready(function() {
  // Update the invoice anytime the document data changes.
  grist.ready();
  grist.onRecord(updateRecord);

  Vue.config.errorHandler = handleError;
  app = new Vue({
    el: '#app',
    data: data,
  });
});
