const {
  compile, computed, createApp, defineComponent, defineCustomElement,
  h, nextTick, ref, shallowRef, watch,
} = Vue;

const waitingForData = ref(true);
const vueError = ref(null);
const tab = ref('preview');
const template = ref('');
const serverDiverged = ref(false);
const haveLocalEdits = ref(false);
let editor = null;

function ready(fn) {
  if (document.readyState !== 'loading'){
    fn();
  } else {
    document.addEventListener('DOMContentLoaded', fn);
  }
}

// TODO: this should be generated based on fields.
/*
<!-- working prompt
  I have some an array of json data in records, like this:
 {
    "id": 1,
    "Company": "Batz, Prohaska and Schmeler",
    "Notes": "Prolific blogger.\nVery interesting person. Likes to dig up, analyze, and then write about interesting data."
  },
  {
    "id": 2,
    "Company": "Considine-Mante",
    "Notes": ""
  },

Give me a vuejs template to present this data in nice-looking cards. Include html to go inside <div id="app"> (don't include this div itself). Don't include js: assume the format provided. Use tailwindcss for styling. Make an effort to make cards look really nice. Use color when it helps. Make each care clearly stand out.
-->
*/

const initialValue = `
<div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3 p-4">
  <div
    v-for="item in records"
    :key="item.id"
    class="rounded-2xl shadow-lg p-6 bg-white border border-gray-200 hover:shadow-xl transition-shadow duration-200"
    >
    <h2 class="text-xl font-semibold text-indigo-700 mb-2">
      {{ item.Company }}
    </h2>

    <p class="text-gray-600 whitespace-pre-line" v-if="item.Notes">
    {{ item.Notes }}
    </p>

    <p
      class="text-sm text-gray-400 italic"
      v-else
      >
      No notes available.
    </p>

    <div class="mt-4 flex justify-end">
      <span
        class="text-xs font-medium bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full"
        >
        #{{ item.id }}
      </span>
    </div>
  </div>
</div>
`;

// Vue won't compile <style> tags into compiled templates. Extract those for rendering separately.
const splitHtmlCss = computed(() => {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(template.value, "text/html");
    const styles = [...doc.querySelectorAll("style")];
    const css = styles.map(node => node.textContent).join("\n\n");
    styles.forEach(node => node.remove());
    const html = doc.body.innerHTML.trim();
    return {html, css};
  } catch (e) {
    return {html: template.value, css: ''};
  }
});

function goToError(error) {
  const { line, column } = error.loc.start;
  props.editor.setPosition({ lineNumber: line, column });
  props.editor.revealPositionInCenter({ lineNumber: line, column });
  props.editor.getAction("editor.action.marker.next").run();
}

const compiledTemplate = computed(() => {
  const errors = [];
  let render;
  try {
    render = compile(splitHtmlCss.value.html, {onError: (e) => errors.push(e)});
  } catch (err) {
    render = h('div', `Failed to compile: ${err}`);
  }
  return {render, errors};
});

const compileErrors = computed(() => compiledTemplate.value.errors);

// Computed that compiles HTML template into a custom component.
const compiledComponent = computed(() => {
  return defineComponent({
    props: ["params"],
    setup(props) { return {...props.params, compileErrors}; },
    render: compiledTemplate.value.render,
  });
});

// We wrap the component and the split-out CSS into a custom element to scope the CSS in the
// template to the template itself (and not to the rest of the custom widget UI).
customElements.define("shadow-wrap", defineCustomElement({
  props: ['css', 'component', 'params'],
  template: `
    <component is=style>{{css}}</component>
    <component :is="component" :params="params"></component>
  `
}));

const statusMessage = computed(() => {
  if (waitingForData.value) { return 'Waiting for data...'; }
  if (vueError.value) { return String(vueError.value); }
  if (compileErrors.value?.length) { return "COMPILE ERROR"; }
  return null;
});

function setEditorErrorMarkers(errors) {
  if (!editor) { return; }
  try {
    const markers = (errors || []).map(e => ({
      startLineNumber: e.loc.start.line,
      startColumn: e.loc.start.column,
      endLineNumber: e.loc.end.line,
      endColumn: e.loc.end.column,
      message: e.message,
      severity: monaco?.MarkerSeverity.Error
    }));
    monaco.editor.setModelMarkers(editor.getModel(), "page-designer", markers);
  } catch (e) {
    console.warn("Error setting error markers", e);
    monaco.editor.setModelMarkers(editor.getModel(), "page-designer", []);
  }
}

ready(function() {
  // Initialize Grist connection.
  grist.ready({
    requiredAccess: 'read table',
  });

  let serverOptions = null;
  function getServerTemplateValue() { return serverOptions?.html || initialValue; }
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

  let isMonacoInitialized = false;

  // Initialize Vue.
  const records = shallowRef(null);
  const app = createApp({
    setup() {
      watch(tab, async (newVal) => {
        if (newVal === "edit" && !isMonacoInitialized) {
          isMonacoInitialized = true;
          await nextTick();
          await initMonaco();
        }
      });
      watch(compileErrors, setEditorErrorMarkers);
      return {
        statusMessage, tab,
        compiledComponent, splitHtmlCss, compileErrors, goToError,
        haveLocalEdits, serverDiverged, resetFromOptions,
        params: {records, formatDate, formatUSD},
      };
    }
  });
  app.config.errorHandler = (err) => { vueError.value = err; };
  app.mount('#app');

  // Initialize Monaco editor.
  async function initMonaco() {
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
    setEditorErrorMarkers(compileErrors.value);
  }
});

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
