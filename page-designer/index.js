const {
  compile, computed, createApp, defineComponent, defineCustomElement,
  h, nextTick, ref, shallowRef, watch,
} = Vue;

const {Liquid} = liquidjs;

const liquidEngine = new Liquid();
const waitingForData = ref(true);
const tab = ref('preview');
const template = ref('');
const serverDiverged = ref(false);
const haveLocalEdits = ref(false);
const records = shallowRef(null);
const renderedTemplate = ref('');
const vueError = ref(null);
const templateError = ref(null);
let editor = null;
let _editorPromise = null;
const ensureEditor = () => (_editorPromise || (_editorPromise = _initEditor()));

function ready(fn) {
  if (document.readyState !== 'loading'){
    fn();
  } else {
    document.addEventListener('DOMContentLoaded', fn);
  }
}

// TODO: this should be generated based on fields.
/*
<!-- working prompt -- but needs to use liquidjs
I have some an array of json data in records, like this:
...

Give me a vuejs template to present this data in nice-looking cards. Include html to go inside <div id="app"> (don't include this div itself). Don't include js: assume the format provided. Use tailwindcss for styling. Make an effort to make cards look really nice. Use color when it helps. Make each care clearly stand out.
-->
*/

const initialValue = `
<script src="https://cdn.tailwindcss.com"></script>
<div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3 p-4">
  {% for item in records %}
    <div class="rounded-2xl shadow-lg p-6 bg-white border border-gray-200 hover:shadow-xl transition-shadow duration-200">

      <h2 class="text-xl font-semibold text-indigo-700 mb-2">
        {{ item.Company }}
      </h2>

      {% if item.Notes %}
        <p class="text-gray-600 whitespace-pre-line">
          {{ item.Notes | downcase }}
        </p>
      {% else %}
        <p class="text-sm text-gray-400 italic">
          No notes available.
        </p>
      {% endif %}

      <div class="mt-4 flex justify-end">
        <span class="text-xs font-medium bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full">
          #{{ item.id }}
        </span>
      </div>

    </div>
  {% endfor %}
</div>
`;

let serverOptions = null;
const getServerTemplateValue = () => (serverOptions?.html || initialValue);

async function goToError(error) {
  tab.value = 'edit';
  const editor = await ensureEditor();
  const { line, column } = error.loc.start;
  editor.setPosition({ lineNumber: line, column });
  editor.revealPositionInCenter({ lineNumber: line, column });
  editor.getAction("editor.action.marker.next").run();
}

function getLineCol(text, pos) {
  let line = 1;
  let lastNL = -1;
  for (let i = 0; i < pos; i++) {
    if (text.charCodeAt(i) === 10) {    // '\n' is charCode 10
      line++;
      lastNL = i;
    }
  }
  return { line, column: pos - lastNL };
}

const compiledTemplate = computed(() => {
  try {
    const tpl = liquidEngine.parse(template.value);
    templateError.value = null;
    return tpl;
  } catch (error) {
    templateError.value = enhanceTemplateError(error);
    return [];
  }
});

function enhanceTemplateError(error) {
  if (error.token?.input && error.token.begin >= 0 && error.token.end >= 0) {
    // Convert error location to one we can use more readily with monaco editor.
    error.loc = {
      start: getLineCol(error.token.input, error.token.begin),
      end: getLineCol(error.token.input, error.token.end),
    };
  }
  return error;
}

const statusMessage = computed(() => {
  if (waitingForData.value) { return 'Waiting for data...'; }
  if (vueError.value) { return String(vueError.value); }
  if (templateError.value) { return `Template error`; }
  return null;
});

function setEditorErrorMarkers(error) {
  if (!editor) { return; }
  const errors = error ? [error] : [];
  let markers = [];
  try {
    markers = errors.map(e => ({
      startLineNumber: e.loc.start.line,
      startColumn: e.loc.start.column,
      endLineNumber: e.loc.end.line,
      endColumn: e.loc.end.column,
      message: e.message,
      severity: monaco.MarkerSeverity.Error
    }));
  } catch (e) {
    console.warn("Error setting error markers", e);
  }
  monaco.editor.setModelMarkers(editor.getModel(), "page-designer", markers);
  if (!markers.length) {
    editor.trigger(null, "closeMarkersNavigation", null);
  }
}

ready(function() {
  // Initialize Grist connection.
  grist.ready({
    requiredAccess: 'read table',
  });

  function resetFromOptions() {
    vueError.value = null;
    template.value = getServerTemplateValue();
    if (editor) { editor.setValue(template.value); }
    haveLocalEdits.value = false;
    serverDiverged.value = false;
  }
  grist.onOptions((options) => {
    serverOptions = options;
    if (!haveLocalEdits.value) {
      resetFromOptions();
    } else {
      serverDiverged.value = (getServerTemplateValue() !== template.value);
    }
  })
  grist.onRecords((rows) => {
    waitingForData.value = false;
    vueError.value = null;
    records.value = grist.mapColumnNames(rows);
  }, {expandRefs: false});


  // Initialize Vue.
  const app = createApp({
    setup() {
      watch(tab, async (newVal) => {
        if (newVal === "edit") { await ensureEditor(); }
      });
      watch(templateError, setEditorErrorMarkers, {immediate: true});
      watch([compiledTemplate, records], async ([compiledTemplate, records]) => {
        if (!compiledTemplate?.length) { return; }
        try {
          renderedTemplate.value = await liquidEngine.render(compiledTemplate, {records});
          templateError.value = null;
        } catch (error) {
          templateError.value = enhanceTemplateError(error);
        }
      }, {immediate: true});

      return {
        statusMessage, tab,
        templateError, goToError,
        haveLocalEdits, serverDiverged, resetFromOptions,
        renderedTemplate,
        params: {records, formatDate, formatUSD},
      };
    }
  });
  app.config.errorHandler = (err) => { console.warn("Vue Error", err); vueError.value = err; };
  app.mount('#app');

});

// Initialize Monaco editor.
async function _initEditor() {
  require.config({ paths: {'vs': 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.26.1/min/vs'}});
  await new Promise((resolve, reject) => require(['vs/editor/editor.main'], resolve, reject));
  editor = monaco.editor.create(document.getElementById("editor"), {
    value: template.value,
    language: "html",
    theme: "vs-dark",
    automaticLayout: true,
    wordWrap: 'on',
    minimap: {enabled: false},
    lineNumbers: 'off',
    glyphMargin: false,
    folding: false,
    scrollBeyondLastLine: false,
  });
  function _onEditorContentChanged() {
    const newValue = editor.getValue();
    vueError.value = null;
    template.value = newValue;
    serverDiverged.value = false;
    if (newValue !== getServerTemplateValue()) {
      haveLocalEdits.value = true;
      grist.setOptions({html: newValue});
    }
  }
  const onEditorContentChanged = _.debounce(_onEditorContentChanged, 1000);
  editor.getModel().onDidChangeContent(onEditorContentChanged);
  setEditorErrorMarkers(templateError.value);
  return editor;
}


function formatUSD(value) {
  if (typeof value !== "number") { return value || '—'; }   // Show falsy as a dash.
  value = Math.round(value * 100) / 100;    // Round to nearest cent.
  value = (value === -0 ? 0 : value);       // Avoid negative zero.
  const result = value.toLocaleString('en', { style: 'currency', currency: 'USD' });
  if (result.includes('NaN')) { return value; }
  return result;
}

function formatDate(value, format = "MMMM DD, YYYY") {
  if (typeof(value) === 'number') { value = new Date(value * 1000); }
  const date = moment.utc(value)
  return date.isValid() ? date.format(format) : value;
}

liquidEngine.registerFilter('formatUSD', formatUSD);
liquidEngine.registerFilter('formatDate', formatDate);
liquidEngine.registerFilter('isArray', Array.isArray);
liquidEngine.registerFilter('isString', v => (typeof(v) === 'string'));
