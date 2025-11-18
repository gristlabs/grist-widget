/**
 * Here is some usage documentation. User may write a LiquidJS template.
 * - Introduction to syntax: https://shopify.dev/docs/api/liquid
 * - Cheatsheet: https://www.shopify.com/partners/shopify-cheat-sheet
 * - Developer documentation: https://liquidjs.com/tutorials/intro-to-liquid.html
 *
 * The following variables are available:
 *  - record
 *      A single selected Grist record. You may use it to build a view like the Grist "Card"
 *      widget, to show the current record (often you'd want your widget linked to a table).
 *  - records
 *      All Grist records in this view, as for the Grist "Table" widget. This would be all records
 *      in a table when the widget isn't linked to anything (with sort & filters available), or a
 *      subset of records when it's linked to another widget.
 *  - locale: default for 'currency' and 'formatDate' filters (default: "en-US"). See filter documentation.
 *  - currency: default for 'currency' filters (default: "USD"). See filter documentation.
 *  - dateFormat: default for 'formatDate' filters (default: "MMMM DD, YYYY"). See filter documentation.
 *
 * The following additional filters are available:
 *  {{ num | currency }}
 *  {{ num | currency: "EUR" }}
 *  {{ num | currency: "EUR" "fr-FR" }}
 *      Formats `num` as currency, optionally overriding currency and locale. See above for
 *      setting the default currency and locale.
 *  {{ date | formatDate }}
 *  {{ date | formatDate: "DD MM YY" }}
 *  {{ date | formatDate: "DD MM YY" "de" }}
 *      Formats `date`, optionally overriding date format and locale. See above for setting the
 *      default date format and locale.
 *  {{ value | isString }}
 *      Returns whether value is of type 'string'
 *  {{ value | isArray }}
 *      Returns whether value is an array.
 */

const {
  compile, computed, createApp, defineComponent, defineCustomElement,
  h, nextTick, ref, shallowRef, watch,
} = Vue;

const {Drop, Hash, Liquid} = liquidjs;

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

let gristSettings = null;
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

const fetchOptions = () => ({
  format: 'rows',
  expandRefs: false,
  includeColumns: gristSettings?.accessLevel === 'full' ? 'normal' : undefined,
});

async function fetchSelectedRecord(rowId) {
  const record = (rowId === 'new') ? {} : await grist.docApi.fetchSelectedRecord(rowId, fetchOptions());
  return new RecordDrop(record);
}
async function fetchSelectedTable() {
  console.log("A", fetchOptions());
  const records = await grist.docApi.fetchSelectedTable(fetchOptions());
  return records.map(r => new RecordDrop(r));
}

let _token = null;
const getToken = () => (_token || (_token = fetchToken()));
async function fetchToken() {
  const tokenResult = await grist.getAccessToken({readOnly: true});
  setTimeout(() => { _token = null; }, tokenResult.ttlMsecs - 10000);
  return tokenResult;
}
async function fetchRecords(tableId, filters) {
  const tokenResult = await getToken();
  const url = new URL(tokenResult.baseUrl + `/tables/${tableId}/records`);
  url.searchParams.set('auth', tokenResult.token);
  url.searchParams.set('filter', JSON.stringify(filters))
  const {records} = await (await fetch(url)).json();
  if (!records) { return null; }
  return records.map(r => ({id: r.id, ...r.fields}));
}
async function fetchReference(tableId, rowId) {
  try {
    const records = await fetchRecords(tableId, {id: [rowId]});
    return records?.[0] || null;
  } catch (err) {
    return `${tableId}[${rowId}]`;
  }
}
async function fetchReferenceList(tableId, rowIds) {
  try {
    return await fetchRecords(tableId, {id: rowIds});
  } catch (err) {
    return `${tableId}[[${rowIds}]]`;
  }
}

let _lastRowId = null;
let _lastFetchedRecord = ref(null);
let _lastFetchedRecords = ref(null);
class DataDrop extends Drop {
  record() { return _lastFetchedRecord.value || fromPromise(_lastFetchedRecord, fetchSelectedRecord(_lastRowId)); }
  records() { return _lastFetchedRecords.value || fromPromise(_lastFetchedRecords, fetchSelectedTable()); }
  locale() { return 'en-US'; }
  currency() { return 'USD'; }
  dateFormat() { return 'MMMM DD, YYYY'; }
}
const dataDrop = new DataDrop();

class RecordDrop extends Drop {
  constructor(record) { super(); this._record = record; }
  liquidMethodMissing(key) {
    const value = this._record[key];
    if (value?.tableId) {
      if (value.rowId) {  // Reference
        return value.cached || (value.cached = fetchReference(value.tableId, value.rowId));
      } else if (value.rowIds) {  // ReferenceList
        return value.cached || (value.cached = fetchReferenceList(value.tableId, value.rowIds));
      }
    }
    return value;
  }
  toJSON() {
    return this._record;
  }
}

const pending = Object();
function fromPromise(ref, promise) {
  ref.value = pending;
  promise.then(val => { ref.value = val; }).catch(e => { ref.value = null; throw e; });
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
  grist.onOptions((options, settings) => {
    gristSettings = settings;
    serverOptions = options;
    if (!haveLocalEdits.value) {
      resetFromOptions();
    } else {
      serverDiverged.value = (getServerTemplateValue() !== template.value);
    }
  })

  grist.rpc.on('message', async function(msg) {
    waitingForData.value = false;
    vueError.value = null;
    if (msg.rowId) {
      _lastRowId = msg.rowId;
      _lastFetchedRecord.value = null;
    }
    if (msg.dataChange) {
      _lastFetchedRecords.value = null;
    }
  });

  // Initialize Vue.
  const app = createApp({
    setup() {
      watch(tab, async (newVal) => {
        if (newVal === "edit") { await ensureEditor(); }
      });
      watch(templateError, setEditorErrorMarkers, {immediate: true});
      watch([compiledTemplate, _lastFetchedRecord, _lastFetchedRecords], async ([compiledTemplate]) => {
        if (!compiledTemplate?.length) { return; }
        try {
          renderedTemplate.value = await liquidEngine.render(compiledTemplate, dataDrop);
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


function currency(value, currency = undefined, locale = undefined) {
  if (!currency) { currency = this.context.get(['currency']); }
  if (!locale) { locale = this.context.get(['locale']); }

  if (typeof value !== "number") { return value || '—'; }   // Show falsy as a dash.
  value = Math.round(value * 100) / 100;    // Round to nearest cent.
  value = (value === -0 ? 0 : value);       // Avoid negative zero.
  const result = value.toLocaleString(locale, { style: 'currency', currency });
  if (result.includes('NaN')) { return value; }
  return result;
}

const momentLocalesLoaded = new Map([['en', 'en']]);

async function formatDate(value, dateFormat = undefined, locale = undefined) {
  if (!locale) { locale = this.context.get(['locale']); }
  if (!dateFormat) { dateFormat = this.context.get(['dateFormat']); }

  if (typeof(value) === 'number') { value = new Date(value * 1000); }
  let useLocale = momentLocalesLoaded.get(locale) || await loadMomentLocale(locale);
  const date = moment.utc(value).locale(useLocale);
  return date.isValid() ? date.format(dateFormat) : value;
}

async function loadMomentLocale(locale) {
  locale = locale.toLowerCase();                // E.g. 'de' or 'de-DE'
  return await doLoadMomentLocale(locale) ||
    await doLoadMomentLocale(locale.split("-")[0]); // E.g. "de"
}
async function doLoadMomentLocale(locale) {
  if (momentLocalesLoaded.get(locale)) {
    momentLocalesLoaded.set(locale, locale);
    await withMaskedGlobals(['define', 'require', 'module'], () =>
      new Promise((resolve) => {
        const script = document.createElement("script");
        script.src = `https://cdnjs.cloudflare.com/ajax/libs/moment.js/2.30.1/locale/${locale}.min.js`;
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.head.appendChild(script);
      })
    );
  }
  return locale;
}
async function withMaskedGlobals(globalNames, cb) {
  const saved = Object.fromEntries(globalNames.map(n => [n, window[n]]));
  globalNames.forEach(n => { window[n] = undefined; });
  try {
    return await cb();
  } finally {
    globalNames.forEach(n => { window[n] = saved[n]; });
  }
}

liquidEngine.registerFilter('currency', currency);
liquidEngine.registerFilter('formatDate', formatDate);
liquidEngine.registerFilter('isArray', Array.isArray);
liquidEngine.registerFilter('isString', v => (typeof(v) === 'string'));
