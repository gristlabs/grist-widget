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