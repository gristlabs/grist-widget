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
import {decodeObject} from "./objtypes.js";

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
const showInfo = ref(false);
const showToolbar = ref(true);
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
This is an example of a template you could write. See "Info" button for full instructions.
<h2>Record {{ record.id }}</h2>
<p>There are {{ records | size }} records available. Selected record:
<pre>
{{ record | json: 2 }}
</pre>
<!-- You can add styles too -->
<style>
  h2 { color: lightblue; }
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
  monaco.editor.setModelMarkers(editor.getModel(), "page-builder", markers);
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
  const record = (rowId === 'new') ? {id: rowId} : await grist.docApi.fetchSelectedRecord(rowId, fetchOptions());
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
function decodeRecord(data) {
  return Object.fromEntries(Object.entries(data).map(([k, v]) => [k, decodeObject(v)]));
}
async function fetchReference(tableId, rowId) {
  try {
    const records = await fetchRecords(tableId, {id: [rowId]});
    const rec = records?.[0] || null;
    return rec ? new RecordDrop(decodeRecord(rec)) : rec;
  } catch (err) {
    return `${tableId}[${rowId}]`;
  }
}
async function fetchReferenceList(tableId, rowIds) {
  try {
    const records = await fetchRecords(tableId, {id: rowIds});
    return Array.isArray(records) ? records.map(r => new RecordDrop(decodeRecord(r))) : records;
  } catch (err) {
    return `${tableId}[[${rowIds}]]`;
  }
}

let _lastRowId = null;
let _lastFetchedRecord = ref(null);
let _lastFetchedRecords = ref(null);
class DataDrop extends Drop {
  record() { return _lastFetchedRecord.value || (_lastFetchedRecord.value = fetchSelectedRecord(_lastRowId)); }
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
    } else if (Array.isArray(value) && value.every(v => typeof(v) === 'number')) {
      return value.cached || (value.cached = new AttachmentsDrop(value));
    }
    return value;
  }
  toJSON(expandRefLevels = 1) {
    function process(value) {
      if (value instanceof RecordDrop) {
        value = expandRefLevels > 0 ? value.toJSON(expandRefLevels - 1) : `${value.tableId}[${value.rowId}]`;
      } else if (Array.isArray(value) && value[0] instanceof RecordDrop) {
        if (expandRefLevels > 0) {
          return value.map(v => v.toJSON(expandRefLevels - 1));
        }
        return `${value.tableId}[[${value.rowIds}]]`;
      }
      return value;
    }
    return Object.fromEntries(Object.keys(this._record).map(key => {
      const value = this.liquidMethodMissing(key);
      return [key, value instanceof Promise ? value.then(process) : process(value)];
    }));
  }
}

// This may also represent a plain number from a list because that looks the same as attachments.
class AttachmentsDrop extends Drop {
  constructor(attIds) { super(); this._att = attIds.map(id => new AttDrop(id)); }
  valueOf() { return this._att; }
  info() { return this._att[0]?.info(); }
  url() { return this._att[0]?.url(); }
  toJSON() { return this._att; }
}
class AttDrop extends Drop {
  constructor(attId) { super(); this._attId = attId; }
  valueOf() { return this._attId; }
  url() { return this._cachedUrl || (this._cachedUrl = getAttachmentUrl(this._attId)); }
  info() { return this._cachedInfo || (this._cachedInfo = fetchAttachmentInfo(this._attId)); }
  toJSON() { return Promise.all([this.url(), this.info()]).then(([url, info]) => ({url, info})); }
}
async function fetchAttachmentInfo(attId) {
  try {
    const entries = await fetchRecords('_grist_Attachments', {id: [attId]});
    if (!entries[0] || typeof(entries[0]) !== 'object') { return null; }
    const result = pick(entries[0], ["fileName", "fileSize", "imageHeight", "imageWidth"]);
    if (typeof(result.timeUploaded) === 'number') {
      result.timeUploded = new Date(result.timeUploaded);
    }
    return result;
  } catch (err) {
    return `Att[${attId}]`;
  }
}
async function getAttachmentUrl(attId) {
  const tokenResult = await getToken();
  const url = new URL(tokenResult.baseUrl + `/attachments/${attId}/download`);
  url.searchParams.set('auth', tokenResult.token);
  return url.href;
}

const _infoRecord = ref(null);
let _infoFetching = false;
const infoRecord = computed(() => {
  const rec = _lastFetchedRecord.value || (_lastFetchedRecord.value = fetchSelectedRecord(_lastRowId));
  if (!_infoFetching) {
    _infoFetching = true;
    rec.then(r => asyncJson(r))
      .then(
        r => { _infoRecord.value = JSON.stringify(trimListsInJson(r), null, 2); },
        err => {
          if (/Access not granted/.test(err.message)) {
            _infoRecord.value = `⚠️ Use Creator Panel to grant access to data`;
          } else {
            _infoRecord.value = `[Data not available] ${err.message}`;
          }
        }

      )
      .then(() => { _infoFetching = false; });
  }
  return _infoRecord.value;
});

let currentURL = null;
async function _renderTemplate([compiledTemplate]) {
  _lastFetchedRecord.value = null;
  _lastFetchedRecords.value = null;
  if (!compiledTemplate?.length || !userContent.value) { return; }
  try {
    const html = await liquidEngine.render(compiledTemplate, dataDrop);
    if (userContent.value) {
      if (currentURL) { URL.revokeObjectURL(currentURL); }
      currentURL = URL.createObjectURL(new Blob([cleanUpHtml(html)], { type: "text/html" }));
      userContent.value.src = currentURL;
    }

    templateError.value = null;
  } catch (error) {
    templateError.value = enhanceTemplateError(error);
  }
}
const renderTemplate = debounce(_renderTemplate, 100);

function cleanUpHtml(input) {
  const body = (s) => /^<body[\s>]/i.test(s) ? s : `<body>${s}</body>`;
  const head = (s) => /^<head[\s>]/i.test(s) ? s : `<head><meta charset="utf-8"></head>${body(s)}`;
  const html = (s) => /^<html[\s>]/i.test(s) ? s : `<html>${head(s)}</html>`;
  const doctype = (s) => /^<!doctype/i.test(s) ? s : `<!doctype html>\n${html(s)}`;
  return doctype(input.trimStart());
}

ready(function() {
  // Initialize Grist connection.
  grist.ready({
    requiredAccess: 'full',
  });

  // Tell Grist to show "Open configuration" link. That links unhides our toolbar.
  // For some reason, this only works if called a bit later.
  setTimeout(() => grist.sectionApi.configure({ hasCustomOptions: true }), 0);

  function resetFromOptions() {
    vueError.value = null;
    template.value = getServerTemplateValue();
    if (editor) { editor.setValue(template.value); }
    haveLocalEdits.value = false;
    serverDiverged.value = false;
  }
  grist.onOptions((options, settings) => {
    gristSettings = settings;
    if (!serverOptions && !options?.html && options?.toolbar !== false) {
      tab.value = "edit";
      showInfo.value = true;
    }
    serverOptions = options;
    showToolbar.value = (options?.toolbar !== false);
    if (!haveLocalEdits.value) {
      resetFromOptions();
    } else {
      serverDiverged.value = (getServerTemplateValue() !== template.value);
    }
  })
  grist.rpc.registerFunc('editOptions', () => {
    showToolbar.value = true;
    grist.setOption('toolbar', true);
  });

  grist.rpc.on('message', async function(msg) {
    if (waitingForData.value) {
      waitingForData.value = false;
    }
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

      function hideToolbar() {
        tab.value = 'preview';
        showToolbar.value = false;
        grist.setOption('toolbar', false);
      }

      return {
        statusMessage, tab, infoRecord,
        showInfo, showToolbar, hideToolbar,
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
      grist.setOptions({html: newValue, toolbar: true});
    }
  }
  const onEditorContentChanged = debounce(_onEditorContentChanged, 1000);
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

const pick = (obj, keys) => Object.fromEntries(keys.filter(k => k in obj).map(k => [k, obj[k]]));

async function asyncJson(v) {
  if (v instanceof Promise) {
    v  = await v;
  }
  if (v && typeof v.toJSON === 'function') {
    const r = v.toJSON();
    v = r instanceof Promise ? await r : r;
  }
  if (Array.isArray(v)) {
    return Promise.all(v.map(asyncJson));
  }
  if (v && typeof v === 'object') {
    const entries = await Promise.all(
      Object.entries(v).map(async ([k, val]) => [k, await asyncJson(val)])
    );
    return Object.fromEntries(entries);
  }
  return v;
}

async function asyncJsonStringify(value, indent) {
  return JSON.stringify(await asyncJson(value), null, indent);
}

function trimListsInJson(value) {
  function walk(val) {
    if (Array.isArray(val)) {
      return val.slice(0, 1).map(walk);
    }
    if (val && typeof val === 'object') {
      return Object.fromEntries(Object.entries(val).map(([k, v]) => [k, walk(v)]));
    }
    return val;
  }
  return walk(value);
}

liquidEngine.registerFilter('currency', currency);
liquidEngine.registerFilter('formatDate', formatDate);
liquidEngine.registerFilter('isArray', Array.isArray);
liquidEngine.registerFilter('isString', v => (typeof(v) === 'string'));
liquidEngine.registerFilter('json', asyncJsonStringify);
