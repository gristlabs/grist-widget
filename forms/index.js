import {cssWrap, cssEditMode, cssEditWrap, col, row, SAMPLE_FORM} from './ui.mjs';
const {dom, observable, computed, styled} = grainjs;
const urlParams = new URLSearchParams(window.location.search);
const isReadOnly = urlParams.get('readonly') === 'true' ||
  (urlParams.has('access') && urlParams.get('access') !== 'full');

// We are in module, so dom is already loaded.
grist.ready({
  requiredAccess: 'full',
  onEditOptions: () => showEditor(),
});


// We will change to true when user clicks "Open configuration" button.
const editMode = observable(false);

const selectedRow = observable(null);
const selectedRowId = computed(use => use(selectedRow)?.id);

// Prebuild renderer UI.
const rendererElem = dom('div');
let renderer = null;
Formio.createForm(rendererElem, {}).then((r) => renderer = r);

// Builder will be built lazily, when needed.
let builder = null;
const builderElem = dom('div.overflow');
async function loadBuilder() {
  if (builder) {return builder;}
  builder = await Formio.builder(builderElem, {}, {noNewEdit: true});
  return Object.assign(builder, {elem: builderElem});
}



// We will wait for the initial settings to be loaded.
once('Options', (options, settings) => {
  main(options, settings);
});

const records = observable(null);
listen('Records', (recs) => {
  records.set(recs);
});

listen('Record', (rec) => selectedRow.set(rec));

// And when we are loaded, we will show the editor.

async function main(options, settings) {

  const deferEditMode = observable(false);

  // We have two UI's, one for editing, and one for viewing.
  dom.update(document.body,
    dom.update(viewUI(), dom.hide(editMode)),
    dom.update(editUI(), dom.show(deferEditMode)),
  );

  // Create editor UI.
  editMode.addListener(async (on) => {
    if (!builder && on) {
      await loadBuilder();
      loadBuilder().then(builder => {
        builder.on('addComponent', () => saveForm(builder.form));
        builder.on('removeComponent', () => saveForm(builder.form));
        builder.on('updateComponent', () => saveForm(builder.form));
      });
    }
    if (on) {
      builder.setForm(renderer.form);
    }
    deferEditMode.set(on);
  });

  editMode.set(true);

  renderer.setForm(options?.formJson || {});

  function editUI() {
    const noRecords = computed(use => use(records)?.length == 0);
    const haveRecords = computed(use => use(records)?.length > 0);

    return cssWrapper(
      dom.hide(use => use(records) === null),
      dom.maybe(noRecords, () => [
        dom('div', 'There are no forms created yet.'),
        dom('button.btn btn-primary', 'Create new form', click(createNewForm)),
      ]),
      cssEditor(
        cssTopMenu(
          cssLogo(
            dom('button.btn.btn-primary.btn-sm.btn-block', 'New form', click(createNewForm)),
          ),
          cssGrow(),
          dom('div.nav.nav-pills.p-3',
            dom('a.nav-link.active.btn-sm',
              'Edit'
            ),
            dom('a.nav-link.btn-sm.cursor',
              'Preview'
            ),
            dom('a.nav-link.btn-sm.cursor',
              'Data'
            ),
            dom('a.nav-link.btn-sm.cursor',
              'Share'
            ),
            dom('a.nav-link.btn-sm.cursor',
              click(() => editMode.set(false)),
              'Close editor'
            ),
          )
        ),
        cssEditorContent(
          dom.maybe(records, () => [
            cssNavigation(
              dom.forEach(records, rec => cssRecord(
                rec.Name,
                dom.on('click', () => grist.setCursorPos({rowId: rec.id})),
                cssRecord.cls('-selected', computed(use => rec.id === use(selectedRowId))),
              ))
            ),
          ]),
          cssBody(
            builderElem,
          )
        )
      )
    );
  }
  function viewUI() {
    return rendererElem;
  }

  async function createNewForm() {
    const table = grist.getTable(grist.getSelectedTableIdSync());
    const {id} = await table.create({
      fields: {
        Name: 'First form',
      }
    });
    await grist.setCursorPos({rowId: id});
  }
}

const cssWrapper = styled('div', `
  height: 100%;
`);

const cssRecord = styled('div', `
  padding: 8px;
  border-bottom: 1px solid #ccc;
  cursor: pointer;

  &:hover {
    background: #eee;
  }
  &-selected {
    background: #333;
    color: white; 
  }
  &-selected:hover {
    background: #333;
    color: white; 
  }
`);

const cssLogo = styled('div.bg-light.left-width', `
  border-right: 1px solid #ccc;
  display: flex;
  align-items: center;
  padding: 8px;
`);

const cssEditor = styled('div', `
  display: flex;
  flex-direction: column;
  height: 100%;
`);

const cssTopMenu = styled('div', `
  border-bottom: 1px solid #ccc;
  display: flex;
  gap:8px;
`);

const cssEditorContent = styled('div', `
  display: flex;
  gap: 8px;
  flex: 1;
`);

const cssNavigation = styled('div.bg-light.left-width', `
  padding-top: 8px;
  border-right: 1px solid #ccc;
`);

const cssBody = styled('div', `
  flex: 1;
  padding-top: 8px;
`);

const cssGrow = styled('div', `
  flex: 1;
`);


// #####################################################
// Fix some shortcoming of JavaScript and Grist library.

function click(callback) {
  return dom.on('click', callback);
}

function saveForm(form) {
  return grist.setOption('formJson', form);
}

function showEditor() {
  editMode.set(true);
}

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

function style(style) {
  return {style};
}
