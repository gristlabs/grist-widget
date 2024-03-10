const {dom, Computed, Disposable, Observable, styled} = grainjs;

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
  const messageObs = Observable.create(null, '');
  const arrangedWorkbooks = Observable.create(null, new Map());
  const allWorkbooks = Observable.create(null, new Map());

  const selectedWorkbookId = Observable.create(null, null);
  const selectedWorkbook = Computed.create(null, (use) =>
    use(allWorkbooks).get(use(selectedWorkbookId)));

  async function runIt() {
    messageObs.set("Loading...");
    try {
      const workbooks = await getWorkbooks();
      messageObs.set("");
      console.warn(JSON.stringify(workbooks));
      arrangedWorkbooks.set(arrangeWorkbooks(workbooks));
      allWorkbooks.set(new Map(workbooks.map(w => [w._id, w])));
    } catch (e) {
      console.warn("Error", e);
      messageObs.set(`Error: ${e}`);
    }
  }

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
      dom('input', dom.prop('value', scApiKey),
        {placeholder: 'Enter spreadsheet.com API key'},
        dom.on('change', (ev, elem) => setKey(elem.value)),
      ),
      dom('br'),
      dom('button', 'Run it', dom.on('click', () => runIt())),
      dom('br'),
      dom('div', dom.text(messageObs)),
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

const cssRoot = styled('div', `
  font-family: 'Roboto', sans-serif;
  font-size: 13px;
  text-rendering: optimizeLegibility;
  -moz-osx-font-smoothing: grayscale;
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
  margin: 16px auto;
  display: block;
  &:hover {
    background-color: #009058
  }
`);
