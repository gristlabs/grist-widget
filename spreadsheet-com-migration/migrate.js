
const scTypes = {
  SELECT: (scColumn) => ({type: 'Choice', widgetOptions: JSON.stringify({choices: scColumn.options})}),
  DATE: () => ({type: 'Date'}),
  ATTACHMENT: () => ({type: 'Attachments'}),
  CURRENCY: () => ({type: 'Numeric', widgetOptions: JSON.stringify({numMode: 'currency'})}),
  TEXT: () => ({type: 'Text'}),
  PHONE: () => ({type: 'Text'}),
};

async function migrate(options) {
  const {workbook, scGetItems, fetchSCAttachment, reportProgress} = options;

  const dstCli = await getGristApiClient();

  let dstTables = await dstCli.getTables();
  let dstTableMap = new Map(dstTables.map(t => [t.id, t.fields]));
  const sheetIdToTableId = new Map();
  const tableIdToPrimaryCol = new Map();

  // Each refCol is {tableId, gristCol, sheetId, scCol}.
  const refCols = [];

  const worksheets = await scGetItems(`/workbooks/${workbook._id}/worksheets`);
  reportProgress(`Creating tables`);
  for (const ws of worksheets) {
    console.warn("Worksheet", ws._id, ws.name, ws);
    let tableId = ws.name;
    if (dstTableMap.has(ws.name)) {
      console.warn("SKIPPING EXISTING TABLE", tableId);
    } else {
      const table = await dstCli.addTable(ws.name,
        [...ws.columns.map(columnScToGrist), makeScRowIdColSpec()]);
      console.warn("ADDED TABLE", table);
      tableId = table.id;
    }
    sheetIdToTableId.set(ws._id, tableId);

    const primaryColumn = ws.columns.find(c => c.primary);
    tableIdToPrimaryCol.set(tableId, primaryColumn);

    const columns = await dstCli.getColumns(tableId);
    for (let i = 0; i < ws.columns.length; i++) {
      const scCol = ws.columns[i];
      const gristCol = columns[i];
      if (scCol.dataType == "RELATED_ROW") {
        refCols.push({tableId, gristCol, sheetId: ws._id, scCol});
      }
    }
  }

  console.warn('RefCols', refCols);

  dstTables = await dstCli.getTables();
  dstTableMap = new Map(dstTables.map(t => [t.id, t.fields]));

  for (const [tableId, fields] of dstTableMap.entries()) {
    fields.columns = await dstCli.getColumns(tableId);
  }

  // For references, SC API doesn't tell us for "RELATED ROW" column type which worksheet it
  // points to. To get around that, we'll keep track of the _id of each row from all worksheets
  // (since IDs seem to be globally-unique), and which [tableId, rowId] it maps to
  const scRowIdToGrist = new Map();

  for (const ws of worksheets) {
    console.log("PROCESSING", ws.name);
    reportProgress(`Importing ${ws.name}...`);
    const tableId = sheetIdToTableId.get(ws._id);
    if (!tableId) { throw new Error(`Strange: failed to find table matching sheet ${ws._id}`); }
    const dstColumns = dstTableMap.get(tableId).columns;
    const dstColumnByLabel = new Map(dstColumns.map(c => [c.fields.label, c]));
    console.log("DST COLS", dstColumnByLabel);
    const rows = await scGetItems(`/worksheets/${ws._id}/rows`);
    console.warn("First row", rows[0]);

    // Count up attachments for better reporting.
    let totalAttachments = 0;
    for (const r of rows) {
      for (const cell of r.cellData) {
        const col = dstColumnByLabel.get(cell.label);
        if (!col) { throw new Error(`Didn't find ${cell.label}`); }
        if (col.fields.type === 'Attachments' && Array.isArray(cell.data)) {
          totalAttachments += cell.data.length;
        }
      }
    }

    let uploadedAttachments = 0;
    const records = [];
    for (const r of rows) {
      const fields = {};
      fields.scRowId = r._id;
      for (const cell of r.cellData) {
        const col = dstColumnByLabel.get(cell.label);
        if (!col) { throw new Error(`Didn't find ${cell.label}`); }
        let value = cell.data;
        if (col.fields.type === 'Attachments') {
          value = null;
          if (Array.isArray(cell.data)) {
            reportProgress(`Importing ${ws.name}: uploading attachments ${uploadedAttachments + 1} of ${totalAttachments}`);
            const attIds = await uploadAttachments(cell.data, fetchSCAttachment, dstCli.uploadToGrist);
            if (attIds) {
              value = ['L', ...attIds];
            }
            uploadedAttachments += cell.data.length;
          }
        } else if (typeof cell.data === 'string' && cell.data === cell.formula) {
          value = cell.display || null;
        } else if (typeof cell.data === 'undefined') {
          value = cell.display || null;
        }
        fields[col.id] = value;
      }
      records.push({fields});
    }

    reportProgress(`Importing ${ws.name}: adding ${records.length} records`);
    const res = await dstCli.addRecords(tableId, records);
    rows.forEach((r, i) => {
      scRowIdToGrist.set(r._id, [tableId, res.records[i].id]);
    });
  }

  // Now fix each reference column.
  for (const {tableId, gristCol, sheetId, scCol} of refCols) {
    const baseType = (scCol.allowMultiple ? 'RefList' : 'Ref');
    // Get values in Grist from the column as (rowId -> value) mapping
    const gristRecords = await grist.docApi.fetchTable(tableId);
    const colValues = gristRecords[gristCol.id];
    const values = new Map(gristRecords.id.map((id, i) => [id, colValues[i]]));
    const refTableIds = new Set();
    for (const val of values.values()) {
      if (val && typeof val === 'string') {
        for (const v of val.split(",")) {
          refTableIds.add(scRowIdToGrist.get(v)?.[0]);
        }
      }
    }
    if (refTableIds.size > 1) {
      throw new Error(`Source column ${scCol.label} references different tables: ${[...refTableIds]}`);
    }
    if (refTableIds.size < 1) {
      console.log("No known refs for", scCol.label);
      continue;
    }
    const refTableId = [...refTableIds.values()][0];
    const type = `${baseType}:${refTableId}`;
    // Find the object for the visibleCol
    const refPrimaryCol = tableIdToPrimaryCol.get(refTableId);
    const dstColumns = dstTableMap.get(refTableId).columns;
    const visibleCol = dstColumns.find(c => (c.fields.label === refPrimaryCol?.label));
    if (!visibleCol) {
      throw new Error(`Didn't find primary column of ${refTableId}`);
    }
    await grist.docApi.applyUserActions([
      ['ModifyColumn', tableId, gristCol.id, {type, visibleCol: visibleCol.fields.colRef}]
    ]);
    await grist.docApi.applyUserActions([
      ["SetDisplayFormula", tableId, null, gristCol.fields.colRef, `\$${gristCol.id}.${visibleCol.id}`]
    ]);
    await grist.docApi.applyUserActions([['BulkUpdateRecord', tableId,
      [...values.keys()],
      {[gristCol.id]: [...values.values()].map(val =>
        (scCol.allowMultiple ?
          ((val && typeof val === 'string') ?
            ['L', ...val.split(",").map(v => scRowIdToGrist.get(v)?.[1]).filter(x => x)] :
            null
          ) :
          scRowIdToGrist.get(val)?.[1]
        )
      )}
    ]]);
  }
}

function makeScRowIdColSpec() {
  return {
    id: 'scRowId',
    fields: {
      isFormula: false,
      label: 'Orig ID',
      formula: "",
      type: 'Text',
      widgetOptions: '{"textColor":"#157AFB"}',
    }
  };
}

function columnScToGrist(scColumn) {
  const options = scTypes[scColumn.dataType]?.(scColumn) || {type: 'Any'};
  if (!options) { throw new Error(`Unknown type ${scColumn.dataType}`); }
  console.warn("COLUMN", scColumn);
  return {
    id: scColumn.label,
    fields: {
      label: scColumn.label,
      // Keep Any columns officially "empty" to allow auto-detection.
      isFormula: (options.type === 'Any'),
      formula: "",
      ...options,
    }
  };
}

async function getGristApiClient(token) {
  let cachedToken = null;
  let cachedTokenExp = 0;
  const getToken = async () => {
    // If token is too close to expiration, get a new one.
    if (Date.now() >= cachedTokenExp - 30000) {
      cachedToken = await grist.docApi.getAccessToken({});
      cachedToken.ttlMsecs = 33000;
      cachedTokenExp = Date.now() + cachedToken.ttlMsecs;
      console.warn("Got new token; expires in", cachedToken.ttlMsecs);
    }
    return cachedToken;
  };

  const baseUrl = (await getToken()).baseUrl;

  const rawFetch = async (url, options) => {
    const fullUrl = new URL(url);
    fullUrl.searchParams.set('auth', (await getToken()).token);
    console.warn("FETCHING", options.method, fullUrl, "body", options.body?.length, "length");
    const resp = await fetch(fullUrl, options);
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

  const myFetch = async (method, url, body) => {
    const fullOptions = {method, headers: {'Content-Type': 'application/json'},
      body: body ? JSON.stringify(body) : undefined,
    };
    return rawFetch(url, fullOptions);
  };

  const myFetchChunked = async (method, url, {records}) => {
    const chunkSize = 500;
    const results = {records: []};
    for (let i = 0; i < records.length; i += chunkSize) {
      const recordsChunk = records.slice(i, i + chunkSize);
      console.log(`Sending chunk ${i}:${i+chunkSize} ${method} ${url}`);
      const res = await myFetch(method, url, {records: recordsChunk});
      if (res.records) {
        results.records.push(...res.records);
      }
      console.log(`Got ${res.records?.length} results; for a total of ${results.records?.length}`);
    }
    return results;
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
    return (await myFetchChunked('PUT', `${baseUrl}/tables/${tableId}/records`, {records}));
  };

  const addRecords = async (tableId, records) => {
    return (await myFetchChunked('POST', `${baseUrl}/tables/${tableId}/records`, {records}));
  };

  const updateRecords = async (tableId, records) => {
    return (await myFetchChunked('PATCH', `${baseUrl}/tables/${tableId}/records`, {records}));
  };

  const addTable = async (tableId, columns) => {
    const tables = [{id: tableId, columns}];
    return (await myFetch('POST', `${baseUrl}/tables`, {tables})).tables[0];
  };

  const uploadToGrist = async (formData) => {
    return await rawFetch(`${baseUrl}/attachments`, {
      method: 'POST', body: formData, //  mode: 'no-cors',
      headers: {'X-Requested-With': 'XMLHttpRequest'}
    });
  };

  return {myFetch, apply, getTables, getColumns, addColumns, getRecords, addRecords,
    putRecords, updateRecords, addTable, uploadToGrist};
}

async function uploadAttachments(scAttachments, fetchSCAttachment, uploadToGrist) {
  const formData = new FormData();

  // Fetch each file and append to FormData
  let count = 0;
  for (const att of scAttachments) {
    const response = await fetchSCAttachment(att.url);
    if (response.ok) {
      const blob = await response.blob();
      formData.append('upload', blob, att.name);
      count++;
    } else {
      console.error('Failed to fetch:', att.url, response.statusText);
    }
  }
  return (count > 0 ? await uploadToGrist(formData) : null);
}
