function ready(fn) {
  if (document.readyState !== 'loading'){
    fn();
  } else {
    document.addEventListener('DOMContentLoaded', fn);
  }
}

let templates = [{
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

let startTemplate =
  findTemplate(document.location.hash.slice(1)) ||
  findTemplate(localStorage.getItem('printlabel-template')) ||
  findTemplate('labels30');

function findTemplate(id) {
  return templates.find(t => t.id === id);
}

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

function updateRecords(rows) {
  try {
    data.status = '';
    if (!rows || !rows.length) {
      throw new Error("No data. Please add some rows");
    }
    if (!rows[0].hasOwnProperty('LabelText')) {
      throw new Error('Need a visible column named "LabelText"');
    }
    let haveCounts = rows[0].hasOwnProperty('LabelCount');
    let labels = [];
    for (let r of rows) {
      // parseFloat to be generous about the type of LabelCount. Text will be accepted.
      let count = haveCounts ? parseFloat(r.LabelCount) : 1;
      for (let i = 0; i < count; i++) {
        labels.push(r.LabelText);
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
  let page = document.querySelector('.page-outer');
  if (!page) { return; }
  if (!pageWidth) {
    pageWidth = page.getBoundingClientRect().width;
  }
  document.body.style.setProperty('--page-scaling', window.innerWidth / pageWidth);
}

ready(function() {
  // Update the widget anytime the document data changes.
  grist.ready();
  grist.onRecords(updateRecords);
  window.onresize = updateSize;

  Vue.config.errorHandler = handleError;
  app = new Vue({
    el: '#app',
    data: data,
    methods: {arrangeLabels: arrangeLabels},
    watch: {
      template: function() {
        localStorage.setItem('printlabel-template', this.template.id);
      }
    },
    updated: () => setTimeout(updateSize, 0),
  });
});
