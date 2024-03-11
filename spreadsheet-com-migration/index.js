const {dom, Computed, Disposable, Observable, keyframes, styled} = grainjs;

const baseUrl = 'https://xoeas5cgd7tel4q6bg63zt6wk40qmoxo.lambda-url.us-east-1.on.aws/';
const lambdaKey = 'kseviqjhasqmfnxvlgfp';
const scApiKey = Observable.create(null, "");

let contentArea = null;

function onReady(fn) {
  if (document.readyState !== 'loading'){
    fn();
  } else {
    document.addEventListener('DOMContentLoaded', fn);
  }
}

async function fetchSCAttachment(url) {
  const fullUrl = new URL('/att', baseUrl);
  fullUrl.searchParams.set('key', lambdaKey);
  fullUrl.searchParams.set('token', scApiKey.get());
  fullUrl.searchParams.set('atturl', url);
  return fetch(fullUrl, {method: 'GET'});
}

async function myFetch(method, relPath, params) {
  const url = new URL(relPath, baseUrl);
  url.searchParams.set('key', lambdaKey);
  url.searchParams.set('token', scApiKey.get());
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  const options = {method, headers: {'Content-Type': 'application/json'}};
  const resp = await fetch(url, options);

  const text = await resp.text();
  try {
    result = JSON.parse(text);
  } catch (e) {
    throw new Error(`${resp.statusText}: Invalid JSON: ${text}`);
  }
  if (!resp.ok) {
    throw new Error(`Fetch failed: ${result.message || resp.statusText}`);
  }
  return result;
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

const nameCmp = (a, b) => a.name.localeCompare(b.name);

let docId = 'unsetDocId';

// We use a global 'store', which is localStorage, with fallbacks.
const storeSet = (key, val) => { store.set(`spreadsheet-com-migration-${docId}:${key}`, val); };
const storeGet = (key) => {
  const trunkId = docId.split('~')[0];
  return (store.get(`spreadsheet-com-migration-${docId}:${key}`) ||
    store.get(`spreadsheet-com-migration-${trunkId}:${key}`));
}

onReady(async () => {
  grist.ready({
    columns: [],
    requiredAccess: 'full'
  });

  docId = await grist.docApi.getDocName();

  scApiKey.set(storeGet('scApiKey') || '');

  const workbooksObs = Observable.create(null, []);
  const selectedWorkbookId = Observable.create(null, null);

  const allWorkbooks = Computed.create(null, use =>
    new Map(use(workbooksObs).map(w => [w._id, w])));
  const selectedWorkbook = Computed.create(null, (use) =>
    use(allWorkbooks).get(use(selectedWorkbookId)));

  function makeStepper(owner) {
    const stepsComplete = Observable.create(owner, 0);
    const stepObservables = [];
    const makeObs = (i) => Computed.create(owner, use => use(stepsComplete) >= i)
      .onWrite((isComplete) => { stepsComplete.set(isComplete ? i : Math.min(i - 1, stepsComplete.get())); });
    const getObs = (i) => stepObservables[i] || (stepObservables[i] = makeObs(i));
    return {getObs};
  }
  const stepper = makeStepper(null);

  const callbacks = {refreshWorkspaces: null};

  dom.update(document.body, cssRoot(
    contentArea = cssContent(
      dom('h1', `Spreadsheet.com → Grist migration tool`),
      dom.create(stepConnect, stepper.getObs(1), workbooksObs, callbacks),
      dom.maybe(stepper.getObs(1), () =>
        dom.create(stepPickWorkbook, stepper.getObs(2), workbooksObs, selectedWorkbookId, callbacks)),
      dom.maybe(stepper.getObs(2), () =>
        dom.create(stepCheckImport, stepper.getObs(3), selectedWorkbook)),
      dom.maybe(stepper.getObs(3), () =>
        dom.create(stepRunImport, stepper.getObs(4), selectedWorkbook)),
      dom.maybe(stepper.getObs(4), () => [
        dom('p', `Congratulations, the import is done!`),
        dom('p', `
If you see a "Save Copy" button in the top bar, this is a good time to save your copy.
`),
        dom('p', `
To remove the Migration Tool, use the "Remove" option in the menu next to the page name,
then select "Delete data and this page".
`),
        dom('p', `
Some notes: This tool is able to migrate most data types, including relations
(known as "references" in Grist), and attachments. Formulas are imported as values.
Grist supports powerful formulas with a slightly different approach. Read about it at
`, dom('a', {href: 'https://support.getgrist.com/formulas/'}, 'formulas'),
` and `, dom('a', {href: 'https://support.getgrist.com/summary-tables/'}, 'summary tables'),
`.`,
        ),
        dom('p', '\xa0'),
      ]),
    ),
    cssHelp(dom('p', `
Questions or problems? Check our
`, dom('a', {href: 'https://support.getgrist.com/'}, 'Help Center'),
`, and don't hesitate to reach out at
`, dom('a', {href: 'mailto:support@getgrist.com'}, 'support@getgrist.com'), `, on our
`, dom('a', {href: 'https://community.getgrist.com/'}, 'community forum'), `
or in our
`, dom('a', {href: 'https://discord.gg/MYKpYQ3fbP'}, `Discord server`), `.
      `)
    ),
  ));
});

function makeStep({collapsed, isComplete, title}, ...domArgs) {
  return cssStep(
    cssStep.cls('-collapsed', collapsed),
    cssStepHeader(
      dom.on('click', () => collapsed.set(!collapsed.get())),
      cssCollapse(cssCollapse.cls('-closed', collapsed)),
      dom('div', title),
      cssComplete(dom.show(isComplete)),
    ),
    ...domArgs
  );
}

function stepCompleter(completerFunc, {isComplete, collapsed, messageObs, loadingObs}) {
  return async function(...args) {
    loadingObs.set(true);
    try {
      await completerFunc(...args);
      isComplete?.set(true);
      collapsed?.set(true);
    } catch (e) {
      console.warn("Error", e);
      messageObs.set(`Error: ${e.message}`);
    } finally {
      loadingObs.set(false);
      // Scroll to bottom
      if (contentArea) {
        contentArea.scrollTop = contentArea.scrollHeight;
      }
    }
  };
}

function stepConnect(owner, isComplete, workbooksObs, callbacks) {
  const collapsed = Observable.create(owner, false);
  const messageObs = Observable.create(owner, '');
  const loadingObs = Observable.create(owner, false);

  function setKey(key) {
    storeSet('scApiKey', key);
    scApiKey.set(key);
  }

  async function doConnect() {
    const workbooks = await getWorkbooks();
    console.warn("workbooks", workbooks);
    storeSet('workbooks', workbooks);
    workbooksObs.set(workbooks);
  }
  callbacks.refreshWorkspaces = doConnect;
  const connect = stepCompleter(doConnect, {isComplete, collapsed, messageObs, loadingObs});

  const cachedWorkbooks = storeGet('workbooks');
  if (cachedWorkbooks?.length > 0) {
    workbooksObs.set(cachedWorkbooks);
    isComplete.set(true);
    collapsed.set(true);
  }

  return makeStep({collapsed, isComplete, title: 'Step 1: Connect'},
    dom('p', `
Welcome! Let us help you migrate data from spreadsheet.com to Grist.
`),
    dom('p', `
You are looking at a widget that's part of a Grist document. This widget can populate this
document with the data from one of your spreadsheet.com documents.
`),
    dom('p', `
To begin, find your spreadsheet.com API token, which can be obtained from
`, dom('a', {href: 'https://app.spreadsheet.com/home'}, 'Personal settings'), `
in Spreadsheet.com. Find it under your user icon > Personal settings > API keys, and paste here.
`),
    cssApiKeyBlock(
      cssApiKey(
        {placeholder: 'Your spreadsheet.com API key'},
        dom.prop('value', scApiKey),
        dom.on('change', (ev, elem) => setKey(elem.value.trim())),
      ),
      cssButton('Connect', dom.prop('disabled', loadingObs), dom.on('click', () => connect())),
      dom.maybe(loadingObs, () => cssSpinner()),
    ),
    cssErrorMessage(dom.text(messageObs)),
  );
}

function stepPickWorkbook(owner, isComplete, workbooksObs, selectedWorkbookId, callbacks) {
  const collapsed = Observable.create(owner, false);
  const messageObs = Observable.create(owner, '');
  const loadingObs = Observable.create(owner, false);

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
  const arrangedWorkbooks = Computed.create(null, use => arrangeWorkbooks(use(workbooksObs)));

  function selectWorkbook(wbId) {
    selectedWorkbookId.set(wbId);
    storeSet('workbookId', wbId);
    isComplete.set(true);
    collapsed.set(true);
  }

  const refresh = stepCompleter(async () => {
    selectedWorkbookId.set(null);
    storeSet('workbookId', null);
    isComplete.set(false);
    collapsed.set(false);
    await callbacks.refreshWorkspaces();
  }, {messageObs, loadingObs});

  const cachedWorkbookId = storeGet('workbookId');
  if (cachedWorkbookId && workbooksObs.get().some(wb => wb._id === cachedWorkbookId)) {
    selectWorkbook(cachedWorkbookId);
    collapsed.set(true);
  }

  return makeStep({collapsed, isComplete, title: 'Step 2: Pick workbook'},
    dom.domComputed(arrangedWorkbooks, aw => {
      const workspaces = [...aw.values()].sort(nameCmp);
      return cssUL(
        workspaces.map(ws => {
          const folders = [...ws.folders.values()].sort(nameCmp);
          return cssLI(
            cssWSName(ws.name,
              ' (',
              cssLinkButton('Refresh', dom.prop('disabled', loadingObs), dom.on('click', () => { refresh(); })),
              ')',
              dom.maybe(loadingObs, () => cssSpinner()),
            ),
            cssUL(
              folders.map(f => {
                const wbs = [...f.workbooks].sort(nameCmp);
                return cssLI(
                  cssWSName(f.name),
                  cssUL(wbs.map(wb => {
                    return cssLI(
                      cssWBItem(
                        cssWBRadio({type: 'radio', name: 'workbook_select', value: wb._id},
                          dom.on('change', (ev, elem) => selectWorkbook(elem.value)),
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
    cssErrorMessage(dom.text(messageObs)),
  );
}

function stepCheckImport(owner, isComplete, selectedWorkbook) {
  const collapsed = Observable.create(owner, false);
  const messageObs = Observable.create(owner, '');
  const loadingObs = Observable.create(owner, false);
  const prepLoadingObs = Observable.create(owner, false);

  const destTablesObs = Observable.create(owner, []);
  grist.docApi.listTables().then(t => destTablesObs.set(t));

  function toGristTableId(ident, prefix = "T") {
    const _invalid_ident_char_re = /[^a-zA-Z0-9_]+/g;
    const _invalid_ident_start_re = /^(?=[0-9_])/;
    ident = ident.normalize('NFKD').replace(/[\u0300-\u036f]/g, "");
    ident = ident.replace(_invalid_ident_char_re, '_').replace(/^_+/, '');
    ident = ident.replace(_invalid_ident_start_re, prefix);
    ident = ident.charAt(0).toUpperCase() + ident.slice(1);
    return ident;
  }

  const conflictNames = Computed.create(owner, use => {
    const m = new Map();
    const destTables = new Set(use(destTablesObs));
    for (const sheet of (use(selectedWorkbook)?.sheets || [])) {
      const tableId = toGristTableId(sheet.name);
      if (destTables.has(tableId)) {
        m.set(sheet.name, tableId);
      }
    }
    return m;
  });

  async function doRemoveConflicts(conflicts) {
    storeSet('importDone', false);
    // Let's make sure we can make changes to the document; if it's a template or fiddle, we will
    // fork it now.
    try {
      await grist.docApi.applyUserActions([['RemoveTable', '_Dummy_']]);
    } catch (e) {
      if (/No such table/.test(String(e))) {
        // Ignore, this is what we expect.
      } else {
        throw e;
      }
    }

    for (const tableId of conflicts.values()) {
      await grist.docApi.applyUserActions([['RemoveTable', tableId]]);
    }
    await grist.docApi.listTables().then(t => destTablesObs.set(t));
    if (conflictNames.get().size > 0) {
      throw new Error("Unexpected: some conflicts remain");
    }
  }

  const refresh = stepCompleter(async () => {
    storeSet('importDone', false);
    isComplete.set(false);
    collapsed.set(false);
    destTablesObs.set(await grist.docApi.listTables());
  }, {messageObs, loadingObs: prepLoadingObs});

  const removeConflicts = stepCompleter(doRemoveConflicts, {isComplete, collapsed, messageObs, loadingObs});

  if (storeGet('importDone')) {
    isComplete.set(true);
    collapsed.set(true);
  }


  return makeStep({
      collapsed, isComplete,
      title: dom.text(use => `Step 3: Prepare to import from "${use(selectedWorkbook)?.name}"`)
    },
    dom.domComputed(selectedWorkbook, wb => {
      if (!wb) { return; }
      return [
        cssH3Flex('Sheets in the workbook',
          ' (',
          cssLinkButton('Refresh', dom.prop('disabled', prepLoadingObs), dom.on('click', () => { refresh(); })),
          '):',
          dom.maybe(prepLoadingObs, () => cssSpinner()),
        ),
        cssUL(
          wb.sheets.map(sheet => {
            return cssLI(
              cssWBItem(
                cssWBName(sheet.name,
                  dom.domComputed(use => use(conflictNames).get(sheet.name), tableId => {
                    if (!tableId) { return null; }
                    return cssConflict('⚠️ Conflicts with ', cssConflictName(tableId));
                  }),
                  {style: 'min-width: 300px'}
                ),
              )
            );
          })
        ),
        dom.domComputed(conflictNames, conflicts => {
          if (conflicts.size === 0) {
            return cssActionLine('No conflicts ✅',
              cssButton('Continue', dom.prop('disabled', loadingObs), dom.on('click', () => { removeConflicts(conflicts); })),
              dom.maybe(loadingObs, () => cssSpinner()),
            );
          }
          return [
            dom('p', 'To be able to continue, we can remove conflicting tables from Grist.'),
            cssActionLine(
              cssButton(`Remove ${conflicts.size} conflicting tables`,
                dom.prop('disabled', loadingObs), 
                dom.on('click', () => { removeConflicts(conflicts); })),
              dom.maybe(loadingObs, () => cssSpinner()),
            ),
          ];
        }),
      ];
    }),
    cssErrorMessage(dom.text(messageObs)),
  );
}

function stepRunImport(owner, isComplete, selectedWorkbook) {
  const collapsed = Observable.create(owner, false);
  const messageObs = Observable.create(owner, '');
  const loadingObs = Observable.create(owner, false);

  owner.autoDispose(isComplete.addListener(val => { if (!val) { collapsed.set(false); } }));

  async function doImportAllSheets(workbook) {
    await migrate({ workbook, scGetItems: getItems, fetchSCAttachment});
    storeSet('importDone', true);
  }
  const importAllSheets = stepCompleter(doImportAllSheets, {isComplete, collapsed, messageObs, loadingObs});

  if (storeGet('importDone')) {
    isComplete.set(true);
    collapsed.set(true);
  }

  return makeStep({
      collapsed, isComplete,
      title: dom.text(use => `Step 4: Import from "${use(selectedWorkbook)?.name}"`)
    },
    dom.domComputed(selectedWorkbook, wb => {
      if (!wb) { return; }
      return [
        dom('h3', 'Sheets in the workbook:'),
        cssUL(
          wb.sheets.map(sheet => cssLI(cssWBItem(cssWBName(sheet.name, {style: 'min-width: 300px'}))))
        ),
        cssActionLine(
          cssButton(`Import ${wb.sheets.length} sheets`,
            dom.prop('disabled', loadingObs),
            dom.on('click', () => { importAllSheets(wb); })),
          dom.maybe(loadingObs, () => cssSpinner()),
        ),
      ];
    }),
    cssErrorMessage(dom.text(messageObs)),
  );
}

const cssRoot = styled('div', `
  font-family: 'Roboto', sans-serif;
  font-size: 14px;
  text-rendering: optimizeLegibility;
  -moz-osx-font-smoothing: grayscale;
  margin: 16px;
  height: calc(100vh - 32px);
  display: flex;
  flex-direction: column;

  & p {
    font-size: 15px;
    margin: 16px;
    line-height: 1.4;
  }
`);

const cssContent = styled('div', `
  overflow: auto;
  flex: 1;
  margin-bottom: auto;
`);

const cssLI = styled('li', `
  list-style-type: none;
`);

const cssWSName = styled('div', `
  color: #225fda;
  font-weight: 700;
  padding: 8px 0;
  display: flex;
  align-items: center;
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

const cssApiKeyBlock = styled('p', `
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
  cursor: pointer;
`);

const spinnerRotate = keyframes(`
 from { transform: rotate(0deg); }
 to { transform: rotate(360deg); }
`);
const cssSpinner = styled('div', `
  margin: -16px 8px;
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
  &-closed {
    transform: rotate(-90deg);
  }
`);

const cssConflict = styled('span', `
  color: #ff5400;
  font-weight: normal;
  margin-left: 16px;
`);
const cssConflictName = styled('span', `
  font-weight: 700;
`);

const cssActionLine = styled('div', `
  display: flex;
  align-items: center;
  gap: 16px;
  margin: 16px 0;
`);

const cssLinkButton = styled('button', `
  background: none;
  border: none;
  text-decoration: underline;
  font-weight: bold;
  color: #16B378;
  cursor: pointer;
  &:hover:not(:disabled) {
    color: #009058
  }
  &:disabled {
    opacity: 75%;
  }
`);

const cssH3Flex = styled('h3', `
  display: flex;
  align-items: center;
`);

const cssHelp = styled('div', `
  background-color: #a4dfc9;
  padding: 0 16px;
`);
