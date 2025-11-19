/**
 * Here is some usage documentation. User may write a LiquidJS template.
 * - Introduction to syntax: https://shopify.github.io/liquid/basics/introduction/
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

import {debounce} from "https://cdn.jsdelivr.net/npm/perfect-debounce@1.0.0/dist/index.mjs";

const {
  compile, computed, createApp, defineComponent, defineCustomElement,
  h, nextTick, ref, shallowRef, watch,
} = Vue;

const {Drop, Hash, Liquid} = liquidjs;

const liquidEngine = new Liquid({
  outputEscape: "escape",
  // Some limits as recommended in https://liquidjs.com/tutorials/dos.html
  parseLimit: 1e8,   // typical size of your templates in each render
  renderLimit: 1000, // limit each render to be completed in 1s
  memoryLimit: 1e9,  // memory available for LiquidJS (1e9 for 1GB)
});
const waitingForData = ref(true);
const tab = ref('preview');
const template = ref('');
const serverDiverged = ref(false);
const haveLocalEdits = ref(false);
const records = shallowRef(null);
const vueError = ref(null);
const templateError = ref(null);
let editor = null;
let _editorPromise = null;
const ensureEditor = () => (_editorPromise || (_editorPromise = _initEditor()));
const userContent = ref(null);

function ready(fn) {
  if (document.readyState !== 'loading'){
    fn();
  } else {
    document.addEventListener('DOMContentLoaded', fn);
  }
}

const initialValue = `\
<button class="copy-btn"
        title="Copy instructions to clipboard"
        onclick="
          window.getSelection().selectAllChildren(document.querySelector('.copy-content'));
          document.execCommand('copy')
        ">
  Copy
</button>

<div class="copy-content">

<p>You have access to records of this form:

<p><pre>
{{ record | inspect: 2 }}
</pre>

<p>You may use <a href="https://shopify.github.io/liquid/basics/introduction/" target="_blank">LiquidJS
template syntax</a>.
Available placeholders are <code>record</code> if you need
to show a page for a single record, or <code>record</code> to show a list of cards or similar for a list of
records.

<p>In addition to regular <a href="https://liquidjs.com/filters/overview.html" target="_blank">filters</a>,
you have available: <code>isString</code> <code>isArray</code> as well as:
<ul>
<li>{% raw %}<code>{{ num | currency }}</code>{% endraw %} Formats <code>num</code> as currency,
  with optional params for currency and locale.
<li>{% raw %}<code>{{ date | formatDate }}</code>{% endraw %} Formats <code>date</code> as a date,
  with optional params for format and locale (format uses moment.js syntax)
</ul>

<p>These global variables may be overridden using {% raw %}{% assign %}{% endraw %}:
<ul>
<li><code>locale</code>: to change the default locale for 'currency' and 'formatDate' filters
  (default: "en-US").
<li><code>currency</code>: to change the default for the 'currency' filter
  (default: "USD").
<li><code>dateFormat</code>: to change the default for 'formatDate' filter, using moment.js syntax
  (default: "MMMM DD, YYYY").
</ul>

<p>You may produce a full HTML page. You can include <code>&lt;style&gt;</code> and
<code>&lt;script&gt;</code> tags or import external stylesheets and scripts.

  </div>
</div>

<style>
body {
  font-family: sans-serif;
  font-size: small;
  line-height: 1.5;
  margin: 0.75rem;
}
pre, code {
  background-color: #EEE;
  border-radius: 3px;
  padding: 2px 4px;
  overflow-x: auto;
}
.copy-btn {
  position: absolute;
  top: 0.5rem;
  right: 0.75rem;
  padding: 0.25rem 0.5rem;
  font-size: 0.75rem;
  background: #ffffff;
  border: 1px solid #e1e5eb;
  border-radius: 0.25rem;
  cursor: pointer;
}
.copy-btn:hover {
  background: #f5f7fb;
}
</style>
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
  async record() { return _lastFetchedRecord.value || (_lastFetchedRecord.value = fetchSelectedRecord(_lastRowId)); }
  records() { return _lastFetchedRecords.value || (_lastFetchedRecords.value = fetchSelectedTable()); }
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
  toJSON(expandRefLevels = 1) {
    return Object.fromEntries(Object.keys(this._record).map(key => {
      let value = this.liquidMethodMissing(key);
      if (value instanceof RecordDrop) {
        value = expandRefLevels > 0 ? value.toJSON(expandRefLevels - 1) : `${value.tableId}[${value.rowId}]`;
      } else if (Array.isArray(value)) {
        if (value.length && value[0] instanceof RecordDrop) {
          value = expandRefLevels > 0 ? [value.toJSON(expandRefLevels - 1)] : [`${value.tableId}[${value.rowId}]`];
        }
      }
      return [key, value];
    }));
  }
}

let currentURL = null;
async function _renderTemplate([compiledTemplate]) {
  _lastFetchedRecord.value = null;
  _lastFetchedRecords.value = null;
  if (!compiledTemplate?.length || !userContent.value) { return; }
  try {
    const html = await liquidEngine.render(compiledTemplate, dataDrop);
    if (userContent.value) {
      if (currentURL) { URL.revokeObjectURL(currentURL); }
      currentURL = URL.createObjectURL(new Blob([html], { type: "text/html" }));
      userContent.value.src = currentURL;
    }

    templateError.value = null;
  } catch (error) {
    templateError.value = enhanceTemplateError(error);
  }
}
const renderTemplate = debounce(_renderTemplate, 100);

ready(function() {
  // Initialize Grist connection.
  grist.ready({
    requiredAccess: 'full',
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
    let reRender = false;
    if (msg.rowId) {
      _lastRowId = msg.rowId;
      if (_lastFetchedRecord.value !== null) {
        reRender = true;
      }
    }
    if (msg.dataChange) {
      if (_lastFetchedRecords.value !== null) {
        reRender = true;
      }
    }
    if (reRender) {
      renderTemplate([compiledTemplate.value]);
    }
  });

  // Initialize Vue.
  const app = createApp({
    setup() {
      watch(tab, async (newVal) => {
        if (newVal === "edit") { await ensureEditor(); }
      });
      watch(templateError, setEditorErrorMarkers, {immediate: true});

      watch([compiledTemplate, userContent], renderTemplate, {immediate: true});

      return {
        statusMessage, tab,
        templateError, goToError,
        haveLocalEdits, serverDiverged, resetFromOptions,
        userContent,
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
