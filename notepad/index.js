const {Subject} = rxjs;
const {debounceTime} = rxjs.operators;

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

  ['clean']                                         // remove formatting button
];

// Create quill editor
const quill = new Quill('#editor', {
  theme: 'snow',
  modules: {
    toolbar: toolbarOptions,
    imageResize: {
      displaySize: true
    }
  },
});

let column;
let id;
let lastContent;
let lastSave;
let tableId;

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

// Subscribe to grist data
grist.ready({requiredAccess: 'full', columns: [{name: 'Content', type: 'Text'}]});
grist.onRecord(function (record, mappings) {
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

// Create a change event.
const textChanged = new Subject();
quill.on('text-change', () => textChanged.next(null));
// Debounce the save event, to not save more often than once every 500 ms.
const saveEvent = textChanged.pipe(debounceTime(500));
const table = grist.getTable();
saveEvent.subscribe(() => {
  // If we are in a middle of saving, skip this.
  if (lastSave) { return; }
  // If we are mapped.
  if (column) {
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
