import { cssWrap, SaveEditDialog } from './ui.mjs';
const {dom, Observable, styled} = grainjs;


function saveForm(builder) {
  return grist.setOption('formJson', builder.form);
}

// Inform grist we are ready, this is async work, so we can do it right away.
grist.ready({
  requiredAccess: 'none',
  onEditOptions: () => isBuilderMode.set(true),
});

let tableId = null;
let options = null;


// When we are loaded we need to decide what to do. Here are options we have:
// 1. We are loaded for the first time ever (no form saved yet, no options saved ond so on).
// -  In that case, we want to build a sample form for user to see and allow him to edit or use it.
// 2. We may have already saved some form (either the default one or user's version)
// -  In that case, we want to render this form. User can edit it if he wants. He just need 
//    press the "Open configuration" button in the panel.
const firstEverLoad = defer();
const savedForm = defer();

// If we are loaded for the first time ever, we need to build a sample form and show it to the user.
// but only if we have full ready access to the document.
firstEverLoad.then(async () => {
  if (haveFullAccess()) {
    // Great! We can start building sample form and show it to the user.
    const sampleForm = await buildSampleForm();
    sampleForm.show();

    // User can now edit the form or save it, we will show him those two options.
    const decision = buildUserOptions();
    decision.show();

    // When user saves this form, we will install it here
    decision.onSave(async () => {
      await grist.setOption('version', Date.now());
      await grist.setOption('formJson', sampleForm.getForm());
      decision.hide();

      // Now when user saves, it is ok, but when he reverts, we need to show him the builder again.
      const stop = listen('Options', (options) => {
        if (!options?.version) {
          decision.show();
          stop();
        }
      });
    });

    // User wants to edit the form, we will show him the builder.
    decision.onEdit(showBuilder);

    async function showBuilder() {
      const form = sampleForm.getForm();
      const builder = await buildTheBuilder(form);
      sampleForm.destroy();
      builder.show();
    }

  } else {
    // Damn, we don't have access and we don't have a form saved. We can't do anything really.
    // Let's just show a message to the user that he needs to give us access.
  }
});

// We have some form already saved, let's render it.
savedForm.then(async form => {
  const renderer = await buildTheRenderer(form);
  renderer.show();

  let builder = null;

  // User might have want to edit it somehow, let's show him the builder.
  isBuilderMode.addListener(async isEdit => {
    // If user wants to edit the form.
    if (isEdit) {
      // If we don't have the builder yet, let's build it.
      if (!builder) {
        builder = await buildTheBuilder(form);
      } else {
        // Otherwise, just update the form that user wants to edit.
        builder.setForm(form);
      }
      // Now switch the views.
      renderer.hide();
      builder.show();

      // User might want to save it or cancel it.
      // We will allow him to save it using regular Save button in the document. BUt first we are going to trigger
      // it.
      await grist.setOption('version', Date.now());

      // Now user has this save button, where he can save the form or just cancel the edit all together.
      // When he cancels, we will get new options with a previous version of the form.
      const listener = onVersionChange(() => {
        // User has cancelled the edit, let's switch back to the renderer.
        builder.hide();
        renderer.show();
        listener.remove();
      });
    } else {
      // Ignore, we cancel using the save options dialog.
    }
  });
});

// Ok, so we know what to do when we are loaded, Grist knows that we are ready to go.

// Let's figure out what we need to do.
once('Options', (options) => {
  // We have options, let's see if we have a form saved.
  if (options?.formJson) {
    // We have a form saved, let's render it.
    savedForm.resolve(options.formJson);
  } else {
    // We don't have a form saved, let's build a sample form.
    firstEverLoad.resolve();
  }
});


// #####################################################
// Now lets define all the methods used above.
function buildTheBuilder(formJson) {
  const elem = dom('div');
  const builderPromise = Formio.builder(elem, {}, {noNewEdit: true});
  builderPromise.then(builder => builder.setForm(formJson));
  const visible = Observable.create(null, false);
  dom.domDispose(document.body);
  document.body.innerHTML = '';
  dom.update(document.body,
    cssWrap(dom.show(visible), elem),
  );
  return {
    show() { visible.set(true); },
    hide() { visible.set(false); },
    destroy() { elem.remove(); },
    getForm() { return SAMPLE_FORM; },
  };
}

/**
 * Functions that builds sample form based on the columns we have.
 */
async function buildSampleForm() {
  const rendererElem = dom('div');
  const visible = Observable.create(null, false);
  const rendererPromise = Formio.createForm(rendererElem, SAMPLE_FORM);
  dom.domDispose(document.body);
  document.body.innerHTML = '';
  dom.update(document.body,
    cssWrap(dom.show(visible), rendererElem),
  );
  return {
    show() { visible.set(true); },
    hide() { visible.set(false); },
    destroy() { rendererElem.remove(); },
    getForm() { return SAMPLE_FORM; },
  };
}

function buildUserOptions() {
  const save = event();
  const edit = event();
  const element = SaveEditDialog({
    save: save.trigger,
    edit: edit.trigger,
  });
  return {
    show() {
      document.body.appendChild(element);
    },
    hide() {
      element.remove();
    },
    onSave: save,
    onEdit: edit,
  }
}

const urlParams = new URLSearchParams(window.location.search);
const isReadOnly = urlParams.get('readonly') === 'true' ||
  (urlParams.has('access') && urlParams.get('access') !== 'full');

function haveFullAccess() {
  return urlParams.get('access') === 'full';
}

// #####################################################
// Fix some shortcoming of JavaScript and Grist library.


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
    if (index === -1) { return null; }
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