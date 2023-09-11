const {Subject} = rxjs;
const {debounceTime} = rxjs.operators;

const defaultTheme = "snow";

const toolbarOptions = [
  ['bold', 'italic', 'underline', 'strike'],        // toggled buttons
  ['blockquote', 'code-block'],

  [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
  [{ 'size': ['small', false, 'large', 'huge'] }],  // font sizes

  [{ 'list': 'ordered'}, { 'list': 'bullet' }],
  [{ 'script': 'sub'}, { 'script': 'super' }],      // superscript/subscript
  [{ 'indent': '-1'}, { 'indent': '+1' }],          // outdent/indent
  [{ 'direction': 'rtl' }],                         // text direction


  [{ 'color': [] }, { 'background': [] }],          // dropdown with defaults from theme
  [{ 'font': [] }],
  [{ 'align': [] }],

  ['link'],

  ['clean'],                                        // remove formatting button
];

let quill = {};

const textChanged = new Subject();
let column;
let id;
let lastContent;
let lastSave;
let tableId;

// Create a Quill editor with specified theme
function makeQuill(theme){
  var quillDiv = document.createElement('div');
  quillDiv.id = 'quill';
  document.getElementById('editor').innerHTML = '';
  document.getElementById('editor').appendChild(quillDiv);

  const quill = new Quill('#quill', {
    theme: theme,
    modules: {
      toolbar: toolbarOptions,
      imageResize: {
        displaySize: true
      }
    }
  });

  quill.on('text-change', () => textChanged.next(null));
  if(lastContent){
    quill.setContents(safeParse(lastContent));
  }

  // Set up config save callback
  document.getElementById("configuration").addEventListener("submit", async function(event){
    event.preventDefault();
    await saveOptions();
  });

  return quill;
}

function safeParse(value) {
  try {
    return JSON.parse(value);
  } catch (err) {
    if (typeof value === 'string') {
      return {ops: [{insert: `${value}\n`}]};
    }
    return null;
  }
}

// Helper to show or hide panels.
function showPanel(name) {
  document.getElementById("configuration").style.display = 'none';
  document.getElementById("editor").style.display = 'none';
  document.getElementById(name).style.display = '';
}

// Define handler for the Save button.
async function saveOptions() {
  const theme = document.getElementById("quillTheme").value;
  await grist.widgetApi.setOption('quillTheme', theme);
  showPanel('editor');
}

// Subscribe to grist data
grist.ready({requiredAccess: 'full', columns: [{name: 'Content', type: 'Text'}],
  // Register configuration handler to show configuration panel.
  onEditOptions() {
    showPanel('configuration');
  },
});
grist.onRecord(function (record, mappings) {
  quill.enable();
  // If this is a new record, or mapping is diffrent.
  if (id !== record.id || mappings?.Content !== column) {
    id = record.id;
    column = mappings?.Content;
    const mapped = grist.mapColumnNames(record);
    if (!mapped) {
      // Log but don't bother user - maybe we are just testing.
      console.error('Please map columns');
    } else if (lastContent !== mapped.Content) {
      // We will remember last thing sent, to not remove progress.
      const content = safeParse(mapped.Content);
      lastContent = JSON.stringify(content);
      quill.setContents(content);
    }
  }
});

grist.onNewRecord(function () {
  id = null;
  lastContent = null;
  quill.setContents(null);
  quill.disable();
})

// Register onOptions handler.
grist.onOptions((customOptions, _) => {
  customOptions = customOptions || {};
  theme = customOptions.quillTheme || defaultTheme;
  document.getElementById("quillTheme").value = theme;
  quill = makeQuill(theme);
  showPanel("editor");
});

// Debounce the save event, to not save more often than once every 500 ms.
const saveEvent = textChanged.pipe(debounceTime(500));
const table = grist.getTable();
saveEvent.subscribe(() => {
  // If we are in a middle of saving, skip this.
  if (lastSave) { return; }
  // If we are mapped.
  if (column && id) {
    const content = quill.getContents();
    // Store content as json.
    const newContent = JSON.stringify(content);
    // Don't send what we just received.
    if (newContent === lastContent) {
      return;
    }
    lastContent = newContent;
    lastSave = table.update({id, fields: {
      [column]: lastContent,
    }}).finally(() => lastSave = null);
  }
});
