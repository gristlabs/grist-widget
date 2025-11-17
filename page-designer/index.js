const { compile, computed, createApp, defineComponent, nextTick, ref, shallowRef, watch} = Vue;

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
const template = ref(initialValue);

const compiledComponent = computed(() => {
  // This seems nicely efficient, in that if compiledComponent isn't being rendered, it doesn't
  // get recomputed.
  const render = compile(template.value);
  return defineComponent({
    props: ["records"],
    render,
  });
});

ready(function() {
  // Initialize Grist connection.
  grist.ready({
    requiredAccess: 'read table',
  });
  grist.onOptions((options) => {
    template.value = options?.html || initialValue;
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
      return {records, status, tab, compiledComponent, template};
    }
  });
  app.config.errorHandler = reportError;
  app.mount('#app');

  // Initialize Monaco editor.
  async function initMonaco() {
    require.config({ paths: {'vs': 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.26.1/min/vs'}});
    await new Promise((resolve, reject) => require(['vs/editor/editor.main'], resolve, reject));
    const editor = monaco.editor.create(document.getElementById("editor"), {
      value: initialValue,
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
      grist.setOptions({html: editor.getValue()});
    }
    const onEditorContentChanged = _.debounce(_onEditorContentChanged, 1000);
    editor.getModel().onDidChangeContent(onEditorContentChanged);
  }
});
