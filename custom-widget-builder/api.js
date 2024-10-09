/** Helper for keeping some data and watching for changes */
function memory(name) {
  let value = undefined;
  let listeners = [];
  const obj = function (arg) {
    if (arg === undefined) {
      return value;
    } else {
      if (value !== arg) {
        listeners.forEach(clb => clb(arg));
        value = arg;
      }
    }
  };

  obj.subscribe = function (clb) {
    listeners.push(clb);
    return () => void listeners.splice(listeners.indexOf(clb), 1);
  };

  return obj;
}

// Global state, to keep track of the editor state, and file content.
const currentJs = memory('js');
const currentHtml = memory('html');
const state = memory('state'); // null, 'installed', 'editor'

const COLORS = {
  green: '#16b378',
}

const DEFAULT_HTML = `<html>
<head>
  <script src="https://docs.getgrist.com/grist-plugin-api.js"></script>
</head>
<body>
  <div style="font-family: sans-serif; padding: 1em;">
    <h2>
      Custom widget builder
    </h2>
    <p>
      For instructions on how to use this widget, click the "Open configuration" button on the creator panel and select the "Help" tab.
    </p>
    <p>
      Remember: there is no autosaving! Always save changes before closing/refreshing the page.
    </p>  
  </div>
</body>
</html>
`.trim();

const DEFAULT_JS = `
grist.ready({ requiredAccess: 'none' });
grist.onRecords(table => {

});
grist.onRecord(record => {

});
`.trim();

let htmlModel;
let jsModel;

let monacoLoaded = false;
async function loadMonaco() {
  // Load all those scripts above.

  if (monacoLoaded) {
    return;
  }

  monacoLoaded = true;

  async function loadJs(url) {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = url;
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }
  async function loadCss(url) {
    return new Promise((resolve, reject) => {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = url;
      link.onload = resolve;
      link.onerror = reject;
      document.head.appendChild(link);
    });
  }

  await loadCss(
    'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.26.1/min/vs/editor/editor.main.min.css'
  );
  await loadJs(
    'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.26.1/min/vs/loader.min.js'
  );

  window.require.config({
    paths: {
      vs: 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.26.1/min/vs',
    },
  });

  await new Promise((resolve, reject) => {
    window.require(
      ['vs/editor/editor.main.nls', 'vs/editor/editor.main'],
      resolve,
      reject
    );
  });
}

// Builds code editor replacing all <script type="code" /> elements with a monaco instance.
function buildEditor() {
  if (window.editor) {
    return;
  }
  htmlModel = monaco.editor.createModel(currentHtml() ?? DEFAULT_HTML, 'html');
  jsModel = monaco.editor.createModel(currentJs() ?? DEFAULT_JS, 'javascript');

  jsModel.onDidChangeContent(() => {
    currentJs(jsModel.getValue());
  });
  htmlModel.onDidChangeContent(() => {
    currentHtml(htmlModel.getValue());
  });
  // Replace script tag with a div that will be used as a container for monaco editor.
  const container = document.getElementById('container');
  // Create JS monaco model - like a tab in the IDE.
  // Create IDE. Options here are only for styling and making editor look like a
  // code snippet.
  const editor = monaco.editor.create(container, {
    model: htmlModel,
    automaticLayout: true,
    fontSize: '13px',
    wordWrap: 'on',
    minimap: {
      enabled: false,
    },
    lineNumbers: 'off',
    glyphMargin: false,
    folding: false,
  });
  // Set tabSize - this can be done only after editor is created.
  editor.getModel().updateOptions({ tabSize: 2 });
  // Disable scrolling past the last line - we will expand editor if necessary.
  editor.updateOptions({ scrollBeyondLastLine: false });
  window.editor = editor;
}
const page_widget = document.getElementById('page_widget');
const page_editor = document.getElementById('page_editor');
const page_help = document.getElementById('page_help');
const btnTabJs = document.getElementById('tab_js');
const btnTabHtml = document.getElementById('tab_html');
const btnTabHelp = document.getElementById('tab_help');
const tabs = [btnTabJs, btnTabHtml, btnTabHelp];
function resetTabs() {
  // Remove .selected class from all tabs.
  tabs.forEach(e => e.classList.remove('selected'));
}
function selectTab(tab) {
  tab.classList.add('selected');
}
const btnReset = document.getElementById('btnReset');
const btnInstall = document.getElementById('btnInstall');
const bar = document.getElementById('_bar');
let wFrame = null;

const bntTabs = [btnTabJs, btnTabHtml, btnTabHelp];
const pages = [page_editor, page_help, page_widget];

function purge(element) {
  while (element.firstChild) {
    element.removeChild(element.firstChild);
  }
}

let lastListener;
function createFrame() {
  // remove all data from page_widget
  purge(page_widget);
  wFrame = document.createElement('iframe');
  page_widget.appendChild(wFrame);
  const widgetWindow = wFrame.contentWindow;
  // Rewire messages between this widget, and the preview
  if (lastListener) window.removeEventListener('message', lastListener);
  lastListener = e => {
    if (e.source === widgetWindow) {
      // Hijicack configure message to inform Grist that we have custom configuration.
      // data will have { iface: "CustomSectionAPI", meth: "configure", args: [{}] }
      if (
        e.data?.iface === 'CustomSectionAPI' &&
        e.data?.meth === 'configure'
      ) {
        e.data.args ??= [{}];
        e.data.args[0].hasCustomOptions = true;
      }
      window.parent.postMessage(e.data, '*');
    } else if (e.source === window.parent) {
      // If user clicks `Open confirguration` button, we will switch to the editor.
      // The message that we will receive is:
      // {"mtype":1,"reqId":6,"iface":"editOptions","meth":"invoke","args":[]}
      if (e.data?.iface === 'editOptions' && e.data?.meth === 'invoke') {
        if (state() !== 'editor') {
          showEditor();
        }
      } else {
        widgetWindow.postMessage(e.data, '*');
      }
    }
  };
  window.addEventListener('message', lastListener);
}

function init() {
  if (init.invoked) return;
  init.invoked = true;
  // Import definitions from api_deps.js
  monaco.languages.typescript.javascriptDefaults.addExtraLib(
    definition,
    'plugin.d.ts'
  );
  // Declare global grist namespace.
  monaco.languages.typescript.javascriptDefaults.addExtraLib(
    `
    import * as Grist from "grist"
    declare global {
      interface Window {
        var grist: typeof Grist;
      }
    }
    export {}
    `,
    'main.d.ts'
  );
}

function cleanUi() {
  resetTabs();
  pages.forEach(e => (e.style.display = 'none'));
}

function changeTab(lang) {
  if (lang === 'help') {
    cleanUi();
    page_help.style.display = 'block';
    selectTab(btnTabHelp);
    return;
  }
  cleanUi();
  page_editor.style.display = 'block';
  page_help.style.display = 'none';
  editor.setModel(lang === 'js' ? jsModel : htmlModel);
  selectTab(lang == 'js' ? btnTabJs : btnTabHtml);
}

function installWidget(code, html) {
  state('installed');
  code = code ?? jsModel.getValue();
  html = html ?? htmlModel.getValue();
  createFrame();
  const content = wFrame.contentWindow;
  content.document.open();
  content.document.write(html);
  if (code.trim()) {
    if (!html.includes('grist-plugin-api.js')) {
      content.document.write(
        `<script src="https://docs.getgrist.com/grist-plugin-api.js"></` +
          `script>`
      );
    }
    content.document.write(`<script>${code}</` + `script>`);
  }
  content.document.close();
  page_widget.style.display = 'block';
  page_editor.style.display = 'none';
  page_help.style.display = 'none';

  [...document.getElementsByClassName('_tab')].forEach(
    e => (e.style.display = 'none')
  );
  [...document.getElementsByClassName('_button')].forEach(
    e => (e.style.display = 'none')
  );
}

async function showEditor() {
  state('editor');
  await loadMonaco();
  init();

  bar.style.display = 'flex';
  page_editor.style.display = 'block';
  page_help.style.display = 'none';
  buildEditor();
  jsModel.setValue(currentJs() ?? DEFAULT_JS);
  htmlModel.setValue(currentHtml() ?? DEFAULT_HTML);

  page_widget.style.display = 'none';
  page_editor.style.display = 'block';

  [...document.getElementsByClassName('_tab')].forEach(
    e => (e.style.display = 'inline-block')
  );
  [...document.getElementsByClassName('_button')].forEach(
    e => (e.style.display = 'none')
  );
  btnInstall.style.display = 'inline-block';
  btnReset.style.display = 'inline-block';
  changeTab('html');
}

const onOptions = function (clb) {
  let listen = true;
  let last = undefined;
  grist.onOptions((...data) => {
    if (listen) {
      if (last !== undefined) {
        if (JSON.stringify(last) === JSON.stringify(data)) {
          return;
        }
        last = data;
      }
      clb(...data);
    }
  });
  return () => void (listen = false);
};

onOptions(async options => {
  if (!options) {
    if (state() === 'installed') {
      // If we are already installed, check that we don't have any code shown.
      if (currentJs() || currentHtml()) {
        // If we have, remove it and install default widget.
        currentHtml(null);
        currentJs(null);
        installWidget(DEFAULT_JS, DEFAULT_HTML);
      } else {
        // Don't need to do anything.
      }
    } else {
      // We are not installed, so install the default widget.
      currentHtml(null);
      currentJs(null);
      state('installed');
      installWidget(DEFAULT_JS, DEFAULT_HTML);
    }
  } else {
    // Install the widget from options, if we don't have any code in memory.
    const newJs = options?._js ?? null;
    const newHtml = options?._html ?? null;

    if (currentJs() !== newJs || currentHtml() !== newHtml) {
      // If we have code in memory, and it is different from the one in options,
      // we need to update it.
      currentJs(newJs);
      currentHtml(newHtml);
      state('installed');
      installWidget(currentJs() ?? DEFAULT_JS, currentHtml() ?? DEFAULT_HTML);
    }
  }
});

function btnInstall_onClick() {
  const options = {
    _installed: true,
    _js: jsModel.getValue(),
    _html: htmlModel.getValue(),
  };
  grist.setOptions(options);
  state('installed');

  // Copy file contents into memory.
  currentJs(options?._js);
  currentHtml(options?._html);

  // Hide editor.
  page_editor.style.display = 'none';

  // Hide buttons bar.
  bar.style.display = 'none';

  // Now install this widget (create frame rewire etc).
  installWidget(currentJs(), currentHtml());
}

function bntReset_onClick() {
  htmlModel.setValue(DEFAULT_HTML);
  jsModel.setValue(DEFAULT_JS);
}

grist.ready({
  onEditOptions: () => {
    if (state() !== 'editor') {
      showEditor();
    }
  },
});
