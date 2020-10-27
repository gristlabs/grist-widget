function ready(fn) {
  if (document.readyState !== 'loading'){
    fn();
  } else {
    document.addEventListener('DOMContentLoaded', fn);
  }
}

let templates = [{
  id: 'labels10',
  name: '10 per sheet (2" x 4")',
  perPage: 10,
}, {
  id: 'labels30',
  name: '30 per sheet (1" x 2-5/8")',
  perPage: 30,
}, {
  id: 'labels60',
  name: '60 per sheet (1/2" x 1-3/4")',
  perPage: 60,
}, {
  id: 'labels80',
  name: '80 per sheet (1/2" x 1-3/4")',
  perPage: 80,
}];

let startTemplateId = localStorage.getItem('printlabel-template');
let startTemplate = templates.find(t => t.id === startTemplateId) || templates[1];

let useListFromRow = false;

let app = undefined;
let data = {
  status: 'waiting',
  labels: null,
  template: startTemplate,
};

function arrangeLabels(labels, template) {
  let pages = [];
  let page = [];
  for (let i = 0; i < labels.length; i++) {
    if (page.length >= template.perPage) {
      pages.push(page);
      page = [];
    }
    if (labels[i]) {
      page.push(labels[i]);
    }
  }
  while (page.length < template.perPage) {
    page.push("");
  }
  pages.push(page);
  return pages;
}

function handleError(err) {
  console.error(err);
  let target = app || data;
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
    methods: {arrangeLabels: arrangeLabels},
    watch: {
      template: function() {
        localStorage.setItem('printlabel-template', this.template.id);
      }
    }
  });
});
