import {cssWrap, cssEditMode, cssEditWrap} from './ui.mjs';
const {dom, observable, computed, styled} = grainjs;
const urlParams = new URLSearchParams(window.location.search);
const isReadOnly = urlParams.get('readonly') === 'true' ||
  (urlParams.has('access') && urlParams.get('access') !== 'full');

// Inform grist we are ready, this is async work, so we can do it right away.
grist.ready({
  requiredAccess: 'none',
  onEditOptions: () => editMode.set(true),
});

function saveForm(form) {
  return grist.setOption('formJson', form);
}

// We will change to true when user clicks "Open configuration" button.
const editMode = observable(false);

async function main() {
  const loaded = observable(false);
  // Here we will store the form data.
  const formJson = observable();
  // And update it whenever the form changes.
  listen('Options', (options, settings) => {
    console.error(settings);
    formJson.set(options?.formJson ?? null);
    if (!loaded.get()) {loaded.set(true);}
  });


  let rendererPromise = null;
  let builderPromise = null;

  listen('Options', (options) => {
    if (rendererPromise && loaded.get()) {
      rendererPromise.then(renderer => renderer.setForm(options?.formJson ?? {}));
      builderPromise.then(builder => builder.setForm(options?.formJson ?? {}));
    }
  });

  document.body.innerHTML = '';
  // Now update body.
  dom.update(document.body,
    dom.maybe(loaded, () => {
      const rendererElem = dom('div');
      rendererPromise = Formio.createForm(rendererElem, formJson.get() || {});

      const builderElem = dom('div');
      builderPromise = Formio.builder(builderElem, formJson.get() || {}, {noNewEdit: true});
      builderPromise.then(builder => {
        builder.on('addComponent', () => saveForm(builder.form));
        builder.on('removeComponent', () => saveForm(builder.form));
        builder.on('updateComponent', () => saveForm(builder.form));
      });
      return [
        cssWrap(dom.hide(editMode), rendererElem),
        cssEditWrap(dom.show(editMode), builderElem),
      ];
    }),
    cssEditMode('Edit mode',
      dom.show(editMode),
      dom.on('click', () => closeEditMode()),
      dom('span', 'X', dom.style('margin-left', '8px')),
    )
  );

  async function closeEditMode() {
    const builder = await builderPromise;
    const renderer = await rendererPromise;
    renderer.setForm(builder.form);
    editMode.set(false);
  }
}



// #####################################################
// Fix some shortcoming of JavaScript and Grist library.



function haveFullAccess() {
  return urlParams.get('access') === 'full';
}

// First is the method to actually return a column info.
async function getColumns() {
  const tableId = grist.getSelectedTableIdSync();
  const tables = await grist.docApi.fetchTable('_grist_Tables');
  const columns = await grist.docApi.fetchTable('_grist_Tables_column');
  const fields = Object.keys(columns);
  const colIds = columns.colId;
  const tableRef = tables.id[tables.tableId.indexOf(tableId)];
  return colIds.map(colId => {
    const index = columns.id.findIndex((_, i) => (columns.parentId[i] === tableRef && columns.colId[i] === colId));
    if (index === -1) {return null;}
    return Object.fromEntries(fields.map(f => [f, columns[f][index]]));
  });
}

// A promise that can be resolved or rejected from outside.
function defer() {
  let resolve = null;
  let reject = null;
  const prom = new Promise((_resolve, _reject) => {
    resolve = _resolve;
    reject = _reject;
  });
  prom.resolve = resolve;
  prom.reject = reject;
  return prom;
}

function event() {
  const obj = (callback) => {
    obj._callback.push(callback);
    return () => obj._callback.splice(obj._callback.indexOf(callback), 1);
  };
  obj._callback = [];
  obj.trigger = async (...args) => {
    for (const callback of obj._callback) {
      await callback(...args);
    }
  }
  obj.click = dom.on('click', () => obj.trigger());
  return obj;
}


// A handler for Grist events, that can be removed.
function listen(event, handler) {
  let enabled = true;
  const myHandler = (...args) => enabled && handler(...args);
  grist[`on${event}`](myHandler);
  return () => enabled = false;
}

// Same handler, but it will be removed after the first call.
function once(event, handler) {
  const remove = listen(event, (...args) => {
    remove();
    handler(...args);
  });
  return remove;
}


const SAMPLE_FORM = {
  components: [
    {
      type: 'textfield',
      key: 'firstName',
      label: 'First Name',
      placeholder: 'Enter your first name.',
      input: true,
      tooltip: 'Enter your <strong>First Name</strong>',
      description: 'Enter your <strong>First Name</strong>'
    },
    {
      type: 'textfield',
      key: 'lastName',
      label: 'Last Name',
      placeholder: 'Enter your last name',
      input: true,
      tooltip: 'Enter your <strong>Last Name</strong>',
      description: 'Enter your <strong>Last Name</strong>'
    },
    {
      type: "select",
      label: "Favorite Things",
      key: "favoriteThings",
      placeholder: "These are a few of your favorite things...",
      data: {
        values: [
          {
            value: "raindropsOnRoses",
            label: "Raindrops on roses"
          },
          {
            value: "whiskersOnKittens",
            label: "Whiskers on Kittens"
          },
          {
            value: "brightCopperKettles",
            label: "Bright Copper Kettles"
          },
          {
            value: "warmWoolenMittens",
            label: "Warm Woolen Mittens"
          }
        ]
      },
      dataSrc: "values",
      template: "<span>{{ item.label }}</span>",
      multiple: true,
      input: true
    },
    {
      type: 'button',
      action: 'submit',
      label: 'Submit',
      theme: 'primary'
    }
  ]
};


main();