var {dom, Observable} = grainjs;
var tableId = null;
var rowId = null;
var colId = null;
var cachedData = null;
var txt = null;  // EasyMDE instance
var editable = null;
var isEditMode = Observable.create(null, false);
let isNewRecord = Observable.create(null, true);

window.addEventListener('keypress', (ev) => {
  // If user pressed Enter or Space
  if (ev.keyCode === 13 || ev.keyCode === 32) {
    // and we are in the read mode
    if (txt.isPreviewActive() && editable) {
      // switch to edit mode.
      editMode();
      ev.preventDefault();
      return;
    }
  }
});

window.addEventListener('keydown', (ev) => {
  // If user pressed Ctrl + S
  if (ev.key === 's' && (ev.ctrlKey || ev.metaKey)) {
    // and in edit mode
    if (!txt.isPreviewActive()) {
      // save and go to read mode
      save();
      readMode();
      ev.preventDefault();
      return;
    }
  } else if (ev.keyCode === 27) {
    if (!txt.isPreviewActive()) {
      // If user pressed Escape, cancel edit
      txt.value("" + cachedData);
      readMode();
      ev.preventDefault();
    }
  }
})

function editMode() {
  isEditMode.set(true);
  if (txt.isPreviewActive()) {
    txt.togglePreview();
    // Focus on the editor, but only if we have focus on the window itself,
    // We don't want to steal the focus from a table in Grist.
    if (!document.hasFocus()) {
      return;
    }
    // Warning: We are using internals here to focus on the inner code editor,
    // it might break in future easymde version.
    if (txt.codemirror && typeof txt.codemirror.focus === 'function') {
      txt.codemirror.focus();
    }
  }
}

function readMode() {
  isEditMode.set(false);
  if (!txt.isPreviewActive()) {
    // We are using internals to release the focus.
    if (txt.codemirror &&
        txt.codemirror.display &&
        txt.codemirror.display.input &&
        typeof txt.codemirror.display.input.blur === 'function') {
      txt.codemirror.display.input.blur();
    }
    txt.togglePreview();
  }
}

function showError(msg) {
  var el = document.getElementById('error')
  if (!msg) {
    el.style.display = 'none';
  } else {
    el.innerHTML = msg;
    el.style.display = 'block';
  }
}

function save() {
  if (!editable || !rowId || !tableId) { return; }
  var data = txt.value() || '';
  if (data === cachedData) { return; }
  console.log("SAVE", data);
  grist.docApi.applyUserActions([ ['UpdateRecord', tableId, rowId, {
    [colId]: data
  }]]).then(function(e) {
    showError(null);
  }).catch(function(e) {
    showError(String(e));
  });
}

function ready(fn) {
  if (document.readyState !== 'loading'){
    fn();
  } else {
    document.addEventListener('DOMContentLoaded', fn);
  }
}

var isMac = /Mac/.test(navigator.platform);
var toolbar = [
  {
    name: 'save',
    action: function(editor) {
      save();
      readMode();
    },
    className: 'fa fa-save save-action',
    title: `Save (${isMac ? 'Cmd' : 'Ctrl'} + S)`
  },
  {
    name: 'edit',
    action: function(editor) {
      editMode();
    },
    className: 'fa fa-pencil edit-action',
    title: 'Edit (Enter or Space)'
  },
  "|", "bold", "italic", "heading", "quote", "|", "link", "guide",
];

ready(() => {
  grist.ready({
    columns: [{ name: "Content", type: 'Text'}],
    requiredAccess: 'full'
  });


  grist.on('message', (e) => {
    if (e.tableId) { tableId = e.tableId; }
  });

  grist.onOptions((options, settings) => {
    const newEditable = (settings.accessLevel !== 'read table');
    if (newEditable !== editable) {
      editable = newEditable;
      txt = new EasyMDE({
        spellChecker: false,
        status: false,
        minHeight: '0px',
        toolbar: editable ? toolbar : false,
      });
      if (editable) {
        dom.update(document.querySelector(".edit-action"), dom.hide(isEditMode));
        dom.update(document.querySelector(".save-action"), dom.show(isEditMode));
        dom.update(txt.toolbar_div, dom.cls('toolbar-read-mode', use => !use(isEditMode)));
      }
      toggle(false);
    }
  });

  grist.onRecord(function(record, mappings) {
    isNewRecord.set(false);
    save();
    var nextRowId = record.id;
    delete record.id;
    var keys = Object.keys(record);
    rowId = null;
    colId = null;
    if (!mappings) {
      // We will fallback to reading a value from a single column to
      // support old way of mapping (exposing only a single column).
      // New widgets should only check if mappings object is truthy,
      // or use grist.mapColumnNames helper method.
      if (keys.length !== 1) {
        showError("Please pick a column to store content on Creator Panel");
        return;
      }
      colId = keys[0];
    } else if (mappings) {
      if (!mappings.Content) {
        showError("Please pick a column to store content on Creator Panel");
        return;
      }
      colId = mappings.Content;
    }
    showError(null);
    data = record[colId] || '';
    if (nextRowId !== rowId || cachedData !== data) {
      txt.value("" + data);
      if (data) {
        readMode();
      } else {
        editMode();
      }
    }
    cachedData = data;
    rowId = nextRowId;
  });

  isNewRecord.addListener(isNew => {
    toggle(!isNew);
  });

  grist.onNewRecord(() => {
    save();
    isNewRecord.set(true);
    txt.value('');
    rowId = null;
    cachedData = data = null;
    colId = null;
    readMode();
  })
  
});

function toggle(show) {
  txt.element.style.visibility = show ? 'visible' : 'hidden';
  txt.toolbar_div.style.visibility = show ? 'visible' : 'hidden';
}
