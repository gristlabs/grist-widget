
const scTypes = {
  SELECT: (scColumn) => ({type: 'Choice', widgetOptions: JSON.stringify({choices: scColumn.options})}),
  DATE: () => ({type: 'Date'}),
  AUTOMATIC: () => ({type: 'Any'}),
  RELATED_ROW: () => ({type: 'Any'}),   // TODO
  ATTACHMENT: () => ({type: 'Attachments'}),    // TODO
  CURRENCY: () => ({type: 'Numeric'}),
  COLUMN_FORMULA: () => ({type: 'Any'}),  // TODO
  TEXT: () => ({type: 'Text'}),
  PHONE: () => ({type: 'Text'}),
};

async function migrate(options) {
  const {workbook, scGetItems} = options;

  const token = await grist.docApi.getAccessToken({});
  const dstCli = getGristApiClient(token);

  let dstTables = await dstCli.getTables();
  let dstTableMap = new Map(dstTables.map(t => [t.id, t.fields]));

  const worksheets = await scGetItems(`/workbooks/${workbook._id}/worksheets`);
  for (const ws of worksheets) {
    console.warn("ID", ws._id);
    console.warn("Name", ws.name);
    let tableId = ws.name;
    if (dstTableMap.has(ws.name)) {
      console.warn("SKIPPING EXISTING TABLE", tableId);
    } else {
      tableId = (await dstCli.addTable(ws.name, ws.columns.map(columnScToGrist))).id;
      console.warn("ADDED TABLE", tableId);
      if (tableId !== ws.name) {
        throw new Error(`tableId ${tableId} not equal ws.name ${ws.name}`);
      }
    }
  }

  dstTables = await dstCli.getTables();
  dstTableMap = new Map(dstTables.map(t => [t.id, t.fields]));

  for (const [tableId, fields] of dstTableMap.entries()) {
    fields.columns = await dstCli.getColumns(tableId);
  }

  for (const ws of worksheets) {
    console.log("--------");
    console.log("PROCESSING", ws.name);
    const tableId = ws.name;
    const dstColumns = dstTableMap.get(ws.name).columns;
    const dstColumnByLabel = new Map(dstColumns.map(c => [c.fields.label, c]));
    console.log("DST COLS", dstColumnByLabel);
    const rows = await scGetItems(`/worksheets/${ws._id}/rows`);
    console.warn(rows[0]);
    const records = rows.map(r => {
      const fields = {};
      for (const cell of r.cellData) {
        const col = dstColumnByLabel.get(cell.label);
        if (!col) { throw new Error(`Didn't find ${cell.label}`); }
        const value = (col.fields.type === 'Attachments') ? null : cell.data || null;
        fields[col.id] = value;
      }
      return {fields};
    });
    await dstCli.addRecords(tableId, records);
  }
}

function columnScToGrist(scColumn) {
  const options = scTypes[scColumn.dataType]?.(scColumn);
  if (!options) { throw new Error(`Unknown type ${scColumn.dataType}`); }
  return {
    id: scColumn.label,
    fields: {
      isFormula: false,
      label: scColumn.label,
      formula: "",
      ...options,
    }
  };
}

function getGristApiClient(token) {
  const baseUrl = token.baseUrl;
  const myFetch = async (method, url, body) => {
    const fullUrl = new URL(url);
    fullUrl.searchParams.set('auth', token.token);

    const fullOptions = {method, headers: {'Content-Type': 'application/json'},
      body: body ? JSON.stringify(body) : undefined,
    };
    const resp = await fetch(fullUrl, fullOptions);
    const text = await resp.text();
    let result;
    try {
      result = JSON.parse(text);
    } catch (e) {
      throw new Error(`${resp.statusText}: Invalid JSON: ${text}`);
    }
    if (!resp.ok) {
      throw new Error(result.details?.userError || result.error || resp.statusText);
    }
    return result;
  };

  const getTables = async () => {
    return (await myFetch('GET', `${baseUrl}/tables`)).tables;
  };

  const getColumns = async (tableId) => {
    return (await myFetch('GET', `${baseUrl}/tables/${tableId}/columns`)).columns;
  };

  const addColumns = async (tableId, columns) => {
    return (await myFetch('POST', `${baseUrl}/tables/${tableId}/columns`, {columns})).columns;
  };

  const apply = async (userActions) => {
    return await myFetch('POST', `${baseUrl}/apply`, userActions);
  };

  const getRecords = async (tableId, filters) => {
    const url = new URL(`${baseUrl}/tables/${tableId}/records`);
    if (filters) {
      url.searchParams.append('filter', JSON.stringify(filters));
    }
    const result = await myFetch('GET', url.href);
    return result.records;
  };

  const putRecords = async (tableId, records) => {
    return (await myFetch('PUT', `${baseUrl}/tables/${tableId}/records`, {records}));
  };

  const addRecords = async (tableId, records) => {
    return (await myFetch('POST', `${baseUrl}/tables/${tableId}/records`, {records}));
  };

  const updateRecords = async (tableId, records) => {
    return (await myFetch('PATCH', `${baseUrl}/tables/${tableId}/records`, {records}));
  };

  const addTable = async (tableId, columns) => {
    const tables = [{id: tableId, columns}];
    return (await myFetch('POST', `${baseUrl}/tables`, {tables})).tables[0];
  };
  return {myFetch, apply, getTables, getColumns, addColumns, getRecords, addRecords,
    putRecords, updateRecords, addTable};
}
