function ready(fn) {
  if (document.readyState !== 'loading'){
    fn();
  } else {
    document.addEventListener('DOMContentLoaded', fn);
  }
}

const templates = [{
  id: 'labels8',
  name: '8 per sheet (2-1/3" x 3-3/8")',
  perPage: 8,
}, {
  id: 'labels10',
  name: '10 per sheet (2" x 4")',
  perPage: 10,
}, {
  id: 'labels20',
  name: '20 per sheet (1" x 4")',
  perPage: 20,
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

// For backward compatibility we will read starting template from a URL's hash or store, but
// this should not be used any more.
const defaultTemplate =
  findTemplate(document.location.hash.slice(1)) ||
  findTemplate('labels30');

function findTemplate(id) {
  return templates.find(t => t.id === id);
}

let app = undefined;
let data = {
  status: 'waiting',
  labels: null,
  template: defaultTemplate,
  showOptions: false,
  // Blanks, if positive, tells to leave this number of labels blank before starting to populate
  // them with data.
  blanks: 0,
  rows: null
};

// Columns we expect
const LabelText = 'LabelText';
const LabelCount = 'LabelCount';

function arrangeLabels(labels, template, blanks) {
  const pages = [];
  let page = [];
  blanks = blanks || 0;
  for (let i = 0; i < blanks + labels.length; i++) {
    if (page.length >= template.perPage) {
      pages.push(page);
      page = [];
    }
    if (i < blanks) {
      page.push("");
    } else {
      const label = labels[i - blanks];
      if (label) {
        page.push(label);
      }
    }
  }
  while (page.length < template.perPage) {
    page.push("");
  }
  pages.push(page);
  return pages;
}

function handleError(err) {
  console.error('ERROR', err);
  const target = app || data;
  target.labels = null;
  target.status = String(err).replace(/^Error: /, '');
}

function updateRecords() {
  try {
    data.status = '';
    const rows = data.rows;
    if (!rows || !rows.length) {
      throw new Error("No data. Please add some rows");
    }
    if (!rows[0].hasOwnProperty(LabelText)) {
      throw new Error(`Please pick a column to show in the Creator Panel.`);
    }
    const haveCounts = rows[0].hasOwnProperty(LabelCount);
    const labels = [];
    for (const r of rows) {
      // parseFloat to be generous about the type of LabelCount. Text will be accepted.
      const count = haveCounts ? parseFloat(r[LabelCount]) : 1;
      for (let i = 0; i < count; i++) {
        labels.push(r[LabelText]);
      }
    }
    data.labels = labels;
  } catch (err) {
    handleError(err);
  }
}

// Page width before any scaling is applied.
let pageWidth = null;

function updateSize() {
  const page = document.querySelector('.page-outer');
  if (!page) { return; }
  if (!pageWidth) {
    pageWidth = page.getBoundingClientRect().width;
  }
  document.body.style.setProperty('--page-scaling', window.innerWidth / pageWidth);
}

ready(function() {
  grist.ready({
    requiredAccess: 'read table',
    columns: [
      {
        name: LabelText,
        title: "Label text",
        type: "Text"
      },
      {
        name: LabelCount,
        title: "Label count",
        type: "Numeric",
        optional: true
      }
    ]
  });
  // Listen to configuration change.
  grist.onOptions((options) => {
    if (options) {
      // Read saved options.
      data.template = findTemplate(options.template) || defaultTemplate;
      data.blanks = options.blanks || 0;
    } else {
      // Revert to defaults.
      data.template = defaultTemplate;
      data.blanks = 0;
    }
  })
  // Update the widget anytime the document data changes.
  grist.onRecords((rows) => {
    // We will fallback to reading rows directly to support
    // old widgets that didn't use column mappings.
    data.rows = grist.mapColumnNames(rows) || rows;
  });
  window.onresize = updateSize;

  Vue.config.errorHandler = handleError;
  app = new Vue({
    el: '#app',
    data: data,
    watch : {
      rows() {
        updateRecords();
      }
    },
    methods: {
      arrangeLabels,
      async save() {
        // Custom save handler to save only when user changed the value.
        await grist.widgetApi.setOption('template', this.template.id);
        await grist.widgetApi.setOption('blanks', this.blanks);
      }
    },
    updated: () => setTimeout(updateSize, 0),
  });
});
