const { createApp, nextTick, ref, shallowRef, watch} = Vue;

const status = ref('waiting');
const tab = ref('preview');

function reportError(err) {
  status.value = String(err).replace(/^Error: /, '');
}

function ready(fn) {
  if (document.readyState !== 'loading'){
    fn();
  } else {
    document.addEventListener('DOMContentLoaded', fn);
  }
}

ready(function() {
  // Initialize Grist connection.
  grist.ready({
    requiredAccess: 'read table',
  });
  grist.onOptions((options) => {
    console.warn("OPTIONS", options);
  })
  grist.onRecords((rows) => {
    try {
      status.value = '';
      records.value = grist.mapColumnNames(rows);
    } catch (e) {
      reportError(e);
    }
  });

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
      return {records, status, tab};
    }
  });
  app.config.errorHandler = reportError;
  app.mount('#app');

  // Initialize Monaco editor.
  async function initMonaco() {
    require.config({ paths: {'vs': 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.26.1/min/vs'}});
    await new Promise((resolve, reject) => require(['vs/editor/editor.main'], resolve, reject));
    const editor = monaco.editor.create(document.getElementById("editor"), {
      value: `<div class="box">\n  Hello!\n</div>`,
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
  }
});
