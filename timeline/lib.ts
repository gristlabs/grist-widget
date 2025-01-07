import {computed, observable} from 'grainjs';
import {Subject, Subscribable} from 'rxjs';

export interface BulkColumns {
  id: number[];
  colId: string[];
  parentId: number[];
  type: string[];
  displayCol: string[];
  isFormula: boolean[];
  formula: string[];
  visibleCol: string[];
  label: string[];
}

export interface Column extends Record<keyof BulkColumns, any> {};

export interface BulkTables {
  id: number[];
  tableId: string[];
}

export interface Table extends Record<keyof BulkTables, any> {};

export async function fetchColumnsFromGrist() {
  const columns: Column[] = toRecords(await grist.docApi.fetchTable('_grist_Tables_column'));
  return columns;
}

export async function fetchTables(): Promise<Table[]> {
  return toRecords(await grist.docApi.fetchTable('_grist_Tables'));
}

export interface Schema {
  allColumns: Column[];
  tables: Table[];
  tableId: string;
  table: Table;
  columns: Column[];
}

export const DATA = {
  schema: null as Schema | null,
}

export async function fetchSchema(): Promise<Schema> {
  const [allColumns, tables, tableId] = await Promise.all([
    fetchColumnsFromGrist(),
    fetchTables(),
    selectedTable()
  ]);

  const table = tables.find(t => t.tableId === tableId)!;
  const columns = allColumns.filter(c => c.parentId === table.id);

  return {
    allColumns,
    tables,
    tableId,
    table,
    columns
  }
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

export async function selectedTable(): Promise<string> {
  return await grist.selectedTable.getTableId()
}

export function showAlert(variant: string, message: string) {
  const alert = document.querySelector(`sl-alert[variant="${variant}"]`) as any;
  const title = alert.querySelector('#title') as any;
  const text = alert.querySelector('#text') as any;
  title.innerText = "Error occured";
  text.innerText = message;
  alert.toast();
}

export async function withElementSpinner(element: Element, callback: () => Promise<void>) {
  const spinner = document.createElement('sl-spinner');
  element.appendChild(spinner);
  try {
    await callback();
  } finally {
    spinner.remove();
  }
}

export async function withIdSpinner(id: any, callback: () => Promise<void>) {
  const element = document.querySelector(`.item_${id}`)!;
  await withElementSpinner(element, callback);
}
export function onClick(selector: string, callback: () => void) {
  window.document.querySelector(selector)!.addEventListener('click', callback);
}
export interface Item {
  id: number;
  content: string;
  start: string;
  end: string;
  type: string;
  className: string;
  data: any;
  editable: boolean;

  group?: number;
  element?: HTMLElement;
  startKey: string;
  endKey: string;
}

type CommandObserver = (arg: any) => Promise<void>;

export class Command<T = any> implements Subscribable<T> {
  private handlers: CommandObserver[] = [];
  private subject = new Subject<T>();

  public async invoke(arg: T) {
    for (const handler of this.handlers) {
      await handler(arg);
    }
    this.subject.next(arg);
  }

  public subscribe = this.subject.subscribe.bind(this.subject);

  public handle(handler: (arg: T) => Promise<void>) {
    this.handlers.push(handler);
    return {
      dispose: () => {
        this.handlers.splice(this.handlers.indexOf(handler), 1);
      }
    }
  }
}

export function stringToValue(value: any) {
  if (['true', 'false'].includes(value)) {
    return value === 'true';
  }
  if (value === 'null') {
    return null;
  }
  // Test for string that looks like integer.
  if (/^\d+$/.test(value)) {
    return parseInt(value, 10);
  }
  return value;
}


export function valueToString(value: any) {
  if (value === null || value === undefined) {
    return '-';
  }
  if (typeof value === 'boolean') {
    return value ? 'true' : 'false';
  }

  // Floats to 2 decimal places.
  if (typeof value === 'number') {
    return value.toFixed(2);
  }

  // Dates to ISO date.
  if (value instanceof Date) {
    return value.toISOString();
  }

  return String(value);
}


// Machinery to create observable for column labels.
export function buildColLabel(colId: string) {
  if (!DATA.schema) {
    return colId;;
  }
  if (!DATA.schema.columns || !DATA.schema.columns.length) {
    return colId;
  }
  const column = DATA.schema.columns.find(c => c.colId === colId);
  return (column ? column.label : colId) || colId;
}

/**
 * Function that memoizes the result of a function based on arguments.
 */
export function memo<F extends (...args: any) => any>(fn: F, salt?: () => any): F {
  let prevKey: any = Symbol();
  let value: any = null;
  return function(...args: any[]) {
    const key = salt ? JSON.stringify([args, salt()]) : JSON.stringify(args);
    const newKey = JSON.stringify(key);
    if (newKey !== prevKey) {
      prevKey = newKey;
      value = fn(...args);
    }
    return value;
  } as F;
}

export function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function hasChanged() {
  let lastValue: any = null;
  return function(value: any) {
    const newValue = JSON.stringify(value);
    if (newValue === lastValue) {
      return false;
    } else {
      lastValue = newValue;
      return true;
    }
  };
}


export function datesAsc(a: Date|string, b: Date|string) {
  const left = typeof a === 'string' ? a : a.toISOString();
  const right = typeof b === 'string' ? b : b.toISOString();
  return left.localeCompare(right);
}

export const dateDesc = (a: Date|string, b: Date|string) => datesAsc(b, a);
