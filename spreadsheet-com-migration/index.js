const {dom, Computed, Disposable, Observable, keyframes, styled} = grainjs;

const baseUrl = 'https://xoeas5cgd7tel4q6bg63zt6wk40qmoxo.lambda-url.us-east-1.on.aws/';
const lambdaKey = 'kseviqjhasqmfnxvlgfp';
const scApiKey = Observable.create(null, "");

function onReady(fn) {
  if (document.readyState !== 'loading'){
    fn();
  } else {
    document.addEventListener('DOMContentLoaded', fn);
  }
}

function setKey(key) {
  grist.setOption('scApiKey', key);
  scApiKey.set(key);
};

async function myFetch(method, relPath, params) {
  const url = new URL(relPath, baseUrl);
  url.searchParams.set('key', lambdaKey);
  url.searchParams.set('token', scApiKey.get());
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  const options = {method, headers: {'Content-Type': 'application/json'}};
  const resp = await fetch(url, options);
  return await resp.json();
}

async function getItems(relPath) {
  const limit = 100;
  let offset = 0;
  const items = [];
  let result = {};
  do {
    result = await myFetch('GET', relPath, {limit, offset});
    items.push(...result.items);
    offset += limit;
  } while (result?.hasMore);
  return items;
}

const getWorkbooks = () => getItems('/workbooks');

const setDefault = (map, key, valueFunc) => {
  return map.get(key) || map.set(key, valueFunc()).get(key);
}

function arrangeWorkbooks(workbooks) {
  // _id => {name, folders: Map(_id => {name, workbooks: []}}
  const workspaces = new Map();
  for (const wb of workbooks) {
    const ws = setDefault(workspaces, wb.workspace._id,
      () => ({name: wb.workspace.name, folders: new Map()}));
    const folder = setDefault(ws.folders, wb.folder._id,
      () => ({name: wb.folder.name, workbooks: []}));
    folder.workbooks.push(wb);
  }
  return workspaces;
}

const nameCmp = (a, b) => a.name.localeCompare(b.name);

onReady(() => {
  const workbooksObs = Observable.create(null, []);
  const arrangedWorkbooks = Computed.create(null, use => arrangeWorkbooks(use(workbooksObs)));
  const allWorkbooks = Computed.create(null, use => new Map(use(workbooksObs).map(w => [w._id, w])));

  const selectedWorkbookId = Observable.create(null, null);
  const selectedWorkbook = Computed.create(null, (use) =>
    use(allWorkbooks).get(use(selectedWorkbookId)));

  async function importAllSheets(workbook) {
    try {
      await migrate({
        workbook,
        scGetItems: getItems,
      });
    } catch (e) {
      console.warn("Error", e);
      messageObs.set(`Error: ${e}`);
    }
  }

  dom.update(document.body,
    cssRoot(
      dom('h1', `Spreadsheet.com → Grist migration tool`),
      dom.create(stepConnect, workbooksObs),
      dom.domComputed(arrangedWorkbooks, aw => {
        const workspaces = [...aw.values()].sort(nameCmp);
        return cssUL(
          workspaces.map(ws => {
            const folders = [...ws.folders.values()].sort(nameCmp);
            return cssLI(
              cssWSName(ws.name),
              cssUL(
                folders.map(f => {
                  const wbs = [...f.workbooks].sort(nameCmp);
                  return cssLI(
                    cssWSName(f.name),
                    cssUL(wbs.map(wb => {
                      return cssLI(
                        cssWBItem(
                          cssWBRadio({type: 'radio', name: 'workbook_select', value: wb._id},
                            dom.on('change', (ev, elem) => { console.warn("SL", elem.value, selectedWorkbookId, selectedWorkbook, allWorkbooks); selectedWorkbookId.set(elem.value); })
                          ),
                          cssWBName(wb.name, {style: 'min-width: 300px'}),
                          cssLightText(wb.updatedAt),
                          cssLightText(wb._id),
                        )
                      );
                    }))
                  );
                })
              )
            );
          })
        );
      }),
      dom('h2', dom.text(use => use(selectedWorkbook)?.name)),
      dom.domComputed(selectedWorkbook, wb => {
        if (!wb) { return; }
        return [
          dom('h3', 'Sheets'),
          cssUL(
            wb.sheets.map(sheet => {
              return cssLI(
                cssWBItem(
                  cssWBName(sheet.name, {style: 'min-width: 300px'}),
                  cssLightText(sheet._id),
                )
              );
            })
          ),
          cssButton('Import All Sheets',
            dom.on('click', () => importAllSheets(selectedWorkbook.get()))
          ),
        ];
      }),
    ),
  );
  grist.ready({
    columns: [],
    requiredAccess: 'full'
  });

  grist.onOptions((options, settings) => {
    scApiKey.set(options.scApiKey);
  });
});


function stepConnect(owner, workbooksObs) {
  const isComplete = Observable.create(owner, false);
  const collapsed = Observable.create(owner, false);
  const messageObs = Observable.create(owner, '');
  const loadingObs = Observable.create(owner, false);

  async function connect() {
    loadingObs.set(true);
    try {
      const workbooks = await getWorkbooks();
      workbooksObs.set(workbooks);
      isComplete.set(true);
      collapsed.set(true);
    } catch (e) {
      console.warn("Error", e);
      messageObs.set(`Error: ${e}`);
    } finally {
      loadingObs.set(false);
    }
  }

  return cssStep(
    cssStep.cls('-collapsed', collapsed),
    cssStepHeader(
      cssCollapse(cssCollapse.cls('-closed', collapsed),
        dom.on('click', () => collapsed.set(!collapsed.get())),
      ),
      dom('div', 'Step 1: Connect '),
      cssComplete(dom.show(isComplete)),
    ),
    dom('p', `
Welcome! Let us help you migrate data from spreadsheet.com to Grist.
`),
    dom('p', `
You are looking at a widget that's part of a Grist document. This widget an populate this
document with the data from one of your spreadsheet.com documents.
`),
    dom('p', `
To start, you need to find your spreadsheet.com API token, which can be obtained from
`, dom('a', {href: 'https://app.spreadsheet.com/home'}, 'Personal settings'), `
in Spreadsheet.com. Find it under your user icon > Personal settings > API keys.
`),
    dom('p', `
Paste your API key here.
`),
    cssApiKeyBlock(
      cssApiKey(
        {placeholder: 'Your spreadsheet.com API key'},
        dom.prop('value', scApiKey),
        dom.on('change', (ev, elem) => setKey(elem.value)),
      ),
      cssButton('Connect', dom.prop('disabled', loadingObs), dom.on('click', () => connect())),
      dom.maybe(loadingObs, () => cssSpinner()),
    ),
    cssErrorMessage(dom.text(messageObs)),
  );
}




const cssRoot = styled('div', `
  font-family: 'Roboto', sans-serif;
  font-size: 14px;
  text-rendering: optimizeLegibility;
  -moz-osx-font-smoothing: grayscale;
  margin: 16px;
`);

const cssLI = styled('li', `
  list-style-type: none;
`);

const cssWSName = styled('div', `
  color: #225fda;
  font-weight: 700;
  padding: 8px 0;
`);

const cssUL = styled('ul', `
  padding: 0 0 0 24px;
  margin: 0;
`);

const cssWBName = styled('div', `
  color: #4a4a4a;
  font-size: 14px;
  font-weight: 700;
  padding: 8px 0;
`);

const cssLightText = styled('span', `
  color: #8a8a8a;
`);

const cssWBItem = styled('label', `
  display: flex;
  gap: 16px;
  align-items: center;
  cursor: pointer;
  border-radius: 4px;
  padding: 4px 16px;
  margin: -4px -16px;
  &:hover {
    background-color: #EEE;
  }
`);

const cssWBRadio = styled('input', `
  display: none;
`);

const cssButton = styled('button', `
  background-color: #16B378;
  border: none;
  border-radius: 4px;
  color: white;
  padding: 8px 16px;
  margin: 0 16px;
  display: block;
  position: relative;
  &:hover:not(:disabled) {
    background-color: #009058
  }
  &:disabled {
    opacity: 75%;
  }
`);

const cssApiKeyBlock = styled('div', `
  display: flex;
  align-items: center;
`);

const cssApiKey = styled('input', `
  border: 1px solid #ccc;
  border-radius: 4px;
  padding: 8px 16px;
  width: 300px;
`);

const cssErrorMessage = styled('p', `
  color: red;
`);

const cssStep = styled('div', `
  &-collapsed > :not(:first-child) {
    display: none;
  }
`);

const cssStepHeader = styled('h2', `
  display: flex;
  align-items: center;
  gap: 8px;
  background-color: #eee;
  padding: 16px;
  border-radius: 4px;
`);

const spinnerRotate = keyframes(`
 from { transform: rotate(0deg); }
 to { transform: rotate(360deg); }
`);
const cssSpinner = styled('div', `
  width: 24px;
  height: 24px;
  border: 3px solid #aaa;
  border-bottom-color: transparent;
  border-radius: 50%;
  display: inline-block;
  box-sizing: border-box;
  animation: ${spinnerRotate} 1s linear infinite;
`);

const cssComplete = styled('div', `
  &::before {
    content: '✅';
  }
`);

const cssCollapse = styled('div', `
  display: inline-block;
  width: 0px;
  height: 0px;
  border-left: 8px solid transparent;
  border-right: 8px solid transparent;
  border-top: 8px solid #8a8a8a;
  cursor: pointer;
  &-closed {
    transform: rotate(-90deg);
  }
`);
