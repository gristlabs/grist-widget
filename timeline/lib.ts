
export interface BulkColumns {
  id: number[];
  colId: string[];
  parentId: number[];
  type: string[];
  displayCol: string[];
  isFormula: boolean[];
  formula: string[];
  visibleCol: string[];
}

export interface Column extends Record<keyof BulkColumns, any> {};

export async function fetchColumnsFromGrist() {
  const columns: Column[] = toRecords(await grist.docApi.fetchTable('_grist_Tables_column'));
  return columns;
}



let tablesCache = [] as any[];

export async function fetchTables() {
  if (!tablesCache.length) {
    tablesCache = toRecords(await grist.docApi.fetchTable('_grist_Tables'));
  }
  return tablesCache;
}


function toRecords(bulk: Record<string, any[]>) {
  const fields = Object.keys(bulk);
  const records = [] as any[];
  for (const index in bulk.id) {
    records.push(
      Object.fromEntries(fields.map(f => [f, bulk[f][index]]))
    );
  }
  return records;
}

export async function selectedTable() {
  const tables = await fetchTables();
  const tableId = await grist.selectedTable.getTableId();
  return tables.find(t => t.tableId === tableId);
}
