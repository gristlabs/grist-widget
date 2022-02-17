// Builds code editor replacing all <script type="code" /> elements with a monaco instance.
function buildEditor(element) {
  // Get the form element (which should be parent of the script);
  const form = element.parentElement;
  // Get the initial source code.
  const jsValue = element.innerText.trim();

  // Replace script tag with a div that will be used as a container for monaco editor.
  const container = document.createElement('div');
  // Style it a little - those values were chosen by hand.
  container.style.minHeight = '50px';
  container.style.maxWidth = 'calc(100% - 50px)';
  container.classList.add('code-editor');
  form.replaceChild(container, element);

  // Create JS monaco model - like a tab in the IDE.
  const jsModel = monaco.editor.createModel(jsValue, 'javascript');
  // Create IDE. Options here are only for styling and making editor look like a
  // code snippet.
  const editor = monaco.editor.create(container, {
    model: jsModel,
    automaticLayout: true,
    wordWrap: 'on',
    minimap: {
      enabled: false,
    },
    lineNumbers: 'off',
    glyphMargin: false,
    folding: false,
    // Undocumented see https://github.com/Microsoft/vscode/issues/30795#issuecomment-410998882
    lineDecorationsWidth: 0,
    lineNumbersMinChars: 0,
    overviewRulerLanes: 0,
    hideCursorInOverviewRuler: true,
    renderLineHighlight: 'none',
    scrollbar: {
      vertical: 'hidden',
      handleMouseWheel: false
    },
    overviewRulerBorder: false,
  });
  // Set tabSize - this can be done only after editor is created.
  editor.getModel().updateOptions({tabSize: 2});
  // Disable scrolling past the last line - we will expand editor if necessary.
  editor.updateOptions({scrollBeyondLastLine: false});

  // Auto - height algorithm.
  // https://github.com/microsoft/monaco-editor/issues/794
  editor.onDidChangeModelDecorations(() => {
    updateEditorHeight(); // typing
    requestAnimationFrame(updateEditorHeight); // folding
  });
  let prevHeight = 0;
  const updateEditorHeight = () => {
    const editorElement = editor.getDomNode();
    if (!editorElement) {
      return;
    }
    const lineHeight = editor.getOption(monaco.editor.EditorOption.lineHeight);
    const lineCount = editor.getModel()?.getLineCount() || 1;
    const height = editor.getTopForLineNumber(lineCount + 1) + lineHeight;
    if (prevHeight !== height) {
      prevHeight = height;
      if (height < 1000) editorElement.style.height = `${height}px`;
      editor.layout();
    }
  };
  updateEditorHeight();

  buildOutput(form, jsModel);
}

function purge(element) {
  while (element.firstChild) {
    element.removeChild(element.firstChild);
  }
}

function buildOutput(form, jsModel) {
  // Get textarea element - it was only a placeholder where to put output.
  const textarea = form.querySelector('.result');
  // Replace it with a div - here we will render json viewer.
  const jsonView = document.createElement('div');
  form.replaceChild(jsonView, textarea);
  // Create helper method to show json in this view.
  function render(data) {
    const formatter = new JSONFormatter(data, 2, {hoverPreviewEnabled: true});
    purge(jsonView);
    jsonView.appendChild(formatter.render());
  }
  // Attach onsubmit handler that will execute the code
  form.onsubmit = function () {
    async function run() {
      try {
        // Each snippet should declare example method in global scope.
        delete window.example;
        // Eval snippet in window scope - we expect that window.example method will be there.
        window.eval(jsModel.getValue());
        // if there is a example method
        if (window.example) {
          // Run the code and pass the output handler.
          const result = await window.example({
            output(data) {
              render(data);
            },
          });
          // Clear the output and display result.
          purge(jsonView);
          render(result);
        }
      } catch (err) {
        purge(jsonView);
        jsonView.innerHTML = err.message;
      }
    }
    void run();
    // Prevent submit.
    return false;
  };
}

function init() {
  // Import definitions from api_deps.js
  monaco.languages.typescript.javascriptDefaults.addExtraLib(definition, 'plugin.d.ts');
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

window.onload = () => {
  init();
  const codes = Array.from(document.querySelectorAll("script[type='code']"));
  for (const code of codes) {
    buildEditor(code);
  }
};
