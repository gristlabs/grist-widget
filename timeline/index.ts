import './vendor';
import {Column, Command, fetchColumnsFromGrist, Item, onClick, selectedTable, showAlert, withElementSpinner, withIdSpinner} from './lib';
import {from} from 'fromit';
import {observable} from 'grainjs';
import moment from 'moment-timezone';
import VanillaContextMenu from 'vanilla-context-menu';
import {DataSet, Timeline, TimelineOptions} from 'vis-timeline/standalone';
import {buildCursor} from './cursor';
import {Subject} from 'rxjs';
import {memoizeWith} from 'ramda';
import {monitorHeader, rewriteHeader} from './header';

declare global {
  var grist: any;
}

// DOM element where the Timeline will be attached
const container = document.getElementById('visualization')!;

const itemSet = new DataSet([]);
const groupSet = new DataSet<any>([]);
const records = observable([] as any[]);
const order = new Map();
const editCard = observable(false);
const confirmChanges = observable(false);
const currentScale = observable('day');
const items = observable([] as Item[]);
const groupSelected = observable(null as number | null);
const focusOnSelect = observable(false);
const mappings = observable<any>({});

const eventAdd = new Subject<number>();
const eventGroupInfo = new Subject<number>();
const eventItemInfo = new Subject<number>();

const cmdAddBlank = new Command<any>();

// Exposed for configuration.
Object.assign((window as any), {
  currentScale,
  confirmChanges,
  editCard,
  focusOnSelect
});


// Two indexes to quickly find group name by id and vice versa.
const byStart = new Map<string, Item[]>();
const byEnd = new Map<string, Item[]>();

const key = memoizeWith((...args: any[]) => args.join(), (date: string, days: number = 0) => {
  return moment(date).add({days}).format('YYYY-MM-DD');
})

function startKey(item: Item, days: number = 0) {
  return `${item.group}-${key(item.start, days)}`;
}
function endKey(item: Item, days: number = 0): string {
  return `${item.group}-${key(item.end, days)}`;
}
items.addListener(list => {
  byStart.clear();
  byEnd.clear();
  for (const item of list) {
    if (!byStart.has(startKey(item))) {
      byStart.set(startKey(item), []);
    }
    if (!byEnd.has(endKey(item))) {
      byEnd.set(endKey(item), []);
    }
    byStart.get(startKey(item))!.push(item);
    byEnd.get(endKey(item))!.push(item);
  }
});


grist.ready({
  allowSelectBy: true,
  requiredAccess: 'read table',
  columns: [
    {
      name: 'Columns',
      allowMultiple: true,
    },
    {
      name: 'Title',
      allowMultiple: true,
      optional: true,
    },
    {
      name: 'Readonly',
      optional: true,
    },
    {
      name: 'From',
    },
    {
      name: 'To',
    },
  ],
});


// Configuration for the Timeline
const options: TimelineOptions = {
  groupOrder: function(a, b) {
    if (a.id === 0) {
      // This is last group, so it should bgroupHeadere last.
      return 1;
    }
    if (b.id === 0) {
      return -1;
    }
    return a.id - b.id;
  },

  template: function(item, element, data) {
    const parts = data.content.split('|');
    const text = parts[1] ? `${parts[0]} (${parts[1] || 'no subject'})` : parts[0];
    const div = document.createElement('div');
    div.className = 'item-template';
    const span = document.createElement('span');
    span.innerText = text;
    div.appendChild(span);

    const someoneOnLeft = byEnd.get(startKey(item, -1)) ?? [];
    const someoneOnRight = byStart.get(endKey(item, +1)) ?? [];

    div.classList.add('item-template');
    if (someoneOnLeft.length) {
      div.classList.add('item-left');
    }
    if (someoneOnRight.length) {
      div.classList.add('item-right');
    }

    const {start, end} = data;

    const all = items.get() as Item[];

    div.classList.remove('item-clash');
    for (const other of all) {
      if (other.group !== item.group) {
        continue;
      }
      if (other.id === item.id) {
        continue;
      }
      if (start >= other.data.To || end <= other.data.From) {
        continue;
      }
      div.classList.add('item-clash');
      break;
    }

    item.element = div;
    return div;
  },
  async onRemove(item, callback) {
    if (!confirmChanges.get() || confirm('Are you sure you want to delete this item?')) {
      await grist.selectedTable.destroy(item.id);
      callback(null);
    }
  },
  async onMove(item, callback) {
    let {start, end} = item;
    if (!end || !start) {
      return;
    }
    if (!(end instanceof Date) || !(start instanceof Date)) {
      return;
    }
    const format = (date: Date) => moment(date).format('YYYY-MM-DD');

    if (confirmChanges.get() && !confirm('Are you sure you want to move this item?')) {
      callback(null);
      return;
    }

    // If end is at midnignt (0:00) it means we were extending or shrinking, in that case move 1 minute before.
    if (end.getHours() === 0 && end.getMinutes() === 0) {
      end = moment(end).subtract(1, 'minute').toDate();
    }
    const fields = {
      [mappings.get().From]: format(start),
      [mappings.get().To]: format(end),
    };
    await withIdSpinner(item.id, async () => {
      callback(item);
      await grist.selectedTable.update({id: item.id, fields});
    });
  },
  async onAdd(item, callback) {
    let id;
    try {
      const group = idToName.get(item.group).split('|').map(formatValue);
      const start = moment(item.start).format('YYYY-MM-DD');

      if (!(item.start instanceof Date)) {
        console.error('Invalid date');
        return;
      }

      // In group we have list of values, we need to create an object from it (zip it with columns).
      const end = moment(defaultEnd(item.start)).format('YYYY-MM-DD');
      const values = [...group, start, end];
      const columns = [...mappings.get().Columns, mappings.get().From, mappings.get().To];
      const rawFields = Object.fromEntries(zip(columns, values));

      const fields = await liftFields(rawFields);
      {id = (await grist.selectedTable.create({fields})).id;}

      await grist.setCursorPos({rowId: id});

      callback(null);

      openCard();

    } finally {
      eventAdd.next(id);
    }
  },

  groupTemplate: function(group) {
    // Create a container for the group
    const container = document.createElement('div');

    container.classList.add('group-template');

    if (group.id === 0) {
      container.classList.add('group-empty');
      return container;
    }

    const partsHtml: HTMLDivElement[] = group.columns.map(col => {
      const div = document.createElement('div');
      const value = formatValue(col);
      if (typeof value === 'string' || value === null) {
        div.innerText = String(value ?? '') || '-';
      } else if (typeof value === 'number') {
        div.innerText = formatCurrency.format(value);
      } else if (typeof value === 'boolean') {
        div.innerHTML = `<input type="checkbox" ${value ? 'checked' : ''
          } disabled>`;
      }
      div.classList.add('group-part');
      div.style.padding = '5px';
      return div;
    });

    // Add 3 dots menu.
    partsHtml.push((() => {
      const div = document.createElement('div');
      div.innerHTML = '<sl-icon name="three-dots"></sl-icon>';
      div.className = 'center cursor';
      div.addEventListener('click', (e) => {
        e.stopPropagation();
        eventGroupInfo.next(group.id);
      })
      return div;
    })());

    container.append(...partsHtml);

    container.addEventListener('click', function() {
      // Find first item in that group.
      const last = itemSet.get().filter(i => i.group === group.id).sort((a, b) => b.start - a.start)[0];
      if (last) {
        timeline.focus(last.id);
      }
      groupSelected.set(group);
    });

    // Return the container as the group's template
    return container;
  },

  editable: {
    add: true,
    updateTime: true,
    updateGroup: false,
  },
  showCurrentTime: true,
  showWeekScale: true,
  groupHeightMode: 'fixed',

  verticalScroll: true,
  zoomKey: 'ctrlKey',
  height: '100%',

  orientation: 'top',

  timeAxis: {
    scale: 'day',
  },
  locale: 'en-gb',
  stack: false,
  stackSubgroups: false,
  xss: {
    disabled: true,
  },
  zoomMin: 1000 * 60 * 60 * 24 * 7 * 2, // about four weeks in milliseconds
  zoomMax: 1000 * 60 * 60 * 24 * 31 * 3, // about  12 months in milliseconds
  moment: function(date) {
    return moment(date); // Use moment with the 'en-gb' locale setting
  },
  snap: function(date) {
    const snappedDate = moment(date);
    snappedDate.startOf('day');
    return snappedDate.toDate();
  },
  margin: {
    item: 1,
    axis: 0
  }
};

// Create a Timeline
const timeline = new Timeline(container, itemSet, options);
timeline.setOptions({
  ...options,
  groupHeightMode: 'fixed',
});

let lastMappings = '';
grist.onRecords((recs, maps) => {
  mappings.set(maps);
  records.set(grist.mapColumnNames(recs));
  order.clear();
  recs.forEach((r, i) => order.set(r.id, i));
  renderAllItems();
  const newMappings = JSON.stringify(mappings.get());
  if (newMappings === lastMappings) {
    document.body.style.visibility = 'visible';
    return;
  }
  lastMappings = newMappings;
  rewriteHeader({mappings, timeline, cmdAddBlank});
  document.body.style.visibility = 'visible';

});

// We will ignore first onRecord event.
let firstOnRecord = true;
let lastId = 0;
grist.onRecord(rec => {
  if (rec.id === lastId) {
    return;
  }
  lastId = rec.id;
  if (firstOnRecord) {
    firstOnRecord = false;
    return;
  }
  if (!rec || !rec.id) {
    return;
  }
  // Get selected row.
  const selected = timeline.getSelection();
  if (selected[0] === rec.id) {
    return;
  }
  timeline.setSelection(Number(rec.id), {
    focus: focusOnSelect.get(),
    animation: {
      animation: false,
    },
  });
});


timeline.on('select', function(properties) {
  if (properties.items.length === 0) {
    return;
  }
  grist.setCursorPos({rowId: properties.items[0]});
});

function getFrom(r: any) {
  return r.From && r.From instanceof Date ? r.From : null;
}

function getTo(r: any) {
  return r.To && r.To instanceof Date ? r.To : null;
}

function recToItem(r): Item {
  const result = {
    id: r.id,
    content: '',
    start: trimTime(getFrom(r)),
    end: appendEnd(trimTime(getTo(r))),
    type: 'range',
    group: undefined,
    className: 'item_' + r.id,
    data: r,
    editable: undefined as any,
  };
  result.group = r.Columns.join('|');
  result.group = nameToId.get(result.group);
  result.content = (r.Title ?? ['no title']).join('|');
  if (r.Readonly) {
    result.editable = false;
  }

  return result;
}


function recToRow(rec) {
  const groupValues = rec.Columns;
  const columns = mappings.get().Columns;
  const allColumns = [...columns, mappings.get().From, mappings.get().To];
  const newStart = moment(rec.From).add(1, 'day').toDate();
  const newEnd = moment(rec.To).add(1, 'week').subtract(-1).toDate();
  const allValues = [
    ...groupValues,
    moment(newStart).format('YYYY-MM-DD'),
    moment(newEnd).format('YYYY-MM-DD'),
  ];
  const fields = Object.fromEntries(zip(allColumns, allValues));
  return {
    id: rec.id,
    ...fields,
  };
}

function compareItems(a: any, b: any) {
  // Compare each field in the item above
  if (a.id !== b.id) {
    return false;
  }
  if (a.content !== b.content) {
    return false;
  }
  if (a.start !== b.start) {
    return false;
  }
  if (a.end !== b.end) {
    return false;
  }
  if (a.group !== b.group) {
    return false;
  }
  if (a.type !== b.type) {
    return false;
  }
  return true;
}

onClick('#btnAlCampaign', () => {
  renderAllItems();
});


function trimTime(date?: Date) {
  if (!date) {
    return '';
  }
  if (!(date instanceof Date)) {
    return '';
  }
  // Format date in format 'YYYY-MM-DD'
  const formattedDate = date.toISOString().split('T')[0];
  return formattedDate;
}

function appendEnd(yyyy_mm_dd: string) {
  return `${yyyy_mm_dd}T23:59:59`;
}



const oldRecs = new Map();

function renderItems() {
  const recs = records.get();

  let i = 1;
  nameToId.clear();
  idToName.clear();
  for (const rec of recs) {
    const groupName = calcGroup(rec);
    if (nameToId.has(groupName)) {
      continue;
    }
    nameToId.set(groupName, i);
    idToName.set(i, groupName);
    idToCols.set(i, rec.Columns);
    i++;
  }

  const newIds = new Set(recs.map(x => x.id));
  const existing = itemSet.getIds();
  const removed = existing.filter(x => !newIds.has(x));
  itemSet.remove(removed);
  const newItems = from(recs as any[])
    .filter(r => getFrom(r) && getTo(r))
    .map(r => {
      const result = recToItem(r);
      return result;
    });

  items.set(newItems.toArray());

  const changedItems =
    oldRecs.size > 0
      ? newItems.filter(newOne => {
        const old = oldRecs.get(newOne.id);
        const LEAVE = true,
          REMOVE = false;
        if (!old) {
          return LEAVE;
        }
        const same = compareItems(old, newOne);
        return same ? REMOVE : LEAVE;
      })
      : newItems;

  const array = changedItems.toArray();
  oldRecs.clear();
  array.forEach(x => oldRecs.set(x.id, x));

  itemSet.update(array);
}
const formatCurrency = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
});

function renderAllItems() {
  renderItems();
  renderGroups();
}

const nameToId = new Map(); // keys to id
const idToName = new Map(); // id to keys
const idToCols = new Map(); // visible columns

function calcGroup(rec: any) {
  return rec.Columns.join('|');
}

function renderGroups() {
  const existingGroups = groupSet.getIds();
  const groupsToRemove = existingGroups.filter(id => !idToName.has(id));
  groupSet.remove(groupsToRemove);
  const rawGroups = Array.from(idToName.entries()).map(c => ({
    id: c[0],
    content: c[1],
    editable: true,
    className: 'group_' + c[1],
    columns: idToCols.get(c[0]),
  }));

  // rawGroups.push({
  //   id: 0,
  //   content: 'Unassigned',
  //   editable: false,
  //   className: 'group_unassigned',
  //   columns: [],
  // })

  groupSet.update(rawGroups);
  timeline.setGroups(groupSet);
}



function bindConfig() {
  const configElements = document.querySelectorAll('.config');

  for (const el of configElements) {
    // Subscribe to change event.
    (el as HTMLSelectElement).onchange = function() {
      const elementId = el.getAttribute('id')!;
      const value = (el as HTMLSelectElement).value;
      updateConfig(elementId, value);
    };
    el.addEventListener('sl-change', event => {
      const checked = (event.target as any).checked;
      const elementId = el.getAttribute('id')!;
      updateConfig(elementId, checked);
    });
  }
}
bindConfig();

const functions = {

};

function updateConfig(elementId: string, value: any) {
  if (elementId in functions) {
    functions[elementId](value);
    return;
  }
  const formatedValue = formatValue(value);
  const schema = elementId.split(':')[0];
  const [parent, child] = elementId.split(':')[1].split('.');
  if (child && schema === 'timeline') {
    if (child === 'scale') {
      currentScale.set(formatedValue);
      timeline.setOptions({
        [parent]: {
          [child]: formatedValue,
        },
      });
    } else {
      timeline.setOptions({
        [parent]: {
          [child]: formatedValue,
        },
      });
    }
  } else if (schema === 'timeline') {
    timeline.setOptions({
      [parent]: formatedValue,
    });

    if (parent === 'stack') {
      timeline.setOptions({
        cluster: false as any,
      });
      timeline.setGroups(groupSet);
      timeline.redraw();
    }
  } else if (schema === 'local') {
    if (!(parent in window)) {
      console.error(`Local variable ${parent} not found in window`);
      return;
    }

    (window as any)[parent].set(formatedValue);
  } else {
    console.error(`Unknown schema ${schema}`);
  }
}

function formatValue(value: any) {
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


timeline.setGroups(groupSet);

buildCursor(timeline, {
  eventAdd
});


document.addEventListener('DOMContentLoaded', function() {
  const fore = document.querySelector(
    '#visualization > div.vis-timeline.vis-bottom.vis-ltr > div.vis-panel.vis-center > div.vis-content > div > div.vis-foreground'
  );
  fore?.addEventListener('contextmenu', function(e) {
    // If we clicked in the .vis-item.vis-range it is ok, else stopImmediatePropagation
    const item = (e.target as HTMLElement).closest('.vis-item.vis-range');
    if (item) {
      // It has class item_N, get the N and select it (but first find that class)
      // then parse it to int and select it.
      const classes = Array.from(item.classList);
      const classItem = classes.find(c => c.startsWith('item_'));
      if (classItem) {
        const id = parseInt(classItem.replace('item_', ''), 10);
        timeline.setSelection([id]);
      }
    } else {
      e.stopImmediatePropagation();
    }
    // e.preventDefault();
  });
  // Set defaults.
  timeline.setOptions({
    stack: false,
    timeAxis: {
      scale: 'day',
    },
  });

  const button = document.getElementById('focusButton')!;
  button.addEventListener('click', function() {
    timeline.fit();
  });


  monitorHeader();


  // same manu for .vis-item.vis-range
  const itemMenu = new VanillaContextMenu({
    scope: fore as HTMLElement,
    menuItems: [
      {
        label: 'Edit',
        callback: async () => {
          const selected = timeline.getSelection();
          if (selected.length === 0) {
            return;
          }
          await grist.setCursorPos({rowId: selected[0]});
          await openCard();
        },
      },
      {
        label: 'Delete',
        callback: deleteSelected,
      },
      {
        label: 'Duplicate',
        callback: async () => {
          const selected = timeline.getSelection() as number[];
          if (selected.length === 0) {
            return;
          }
          const recs = records.get();
          const rec = recs.find(r => r.id === selected[0]);
          if (!rec) {
            return;
          }

          const clone = structuredClone(rec);
          clone.From = rec.To;

          // Calculate difference, and add it to the new date.
          const diff = moment(rec.To).diff(clone.From);
          clone.To = moment(clone.From).add(diff).toDate();

          const row = recToRow(clone);
          delete row.id;

          const element = /* div with item_x */ document.querySelector(
            `.item_${selected[0]}`
          )!;

          await withElementSpinner(element, async () => {
            const fields = await liftFields(row);
            await grist.selectedTable.create({fields});
          });
        },
      },
    ],
    customThemeClass: 'context-menu-orange-theme',
    customClass: 'custom-context-menu-cls',
  });
});

editCard.addListener(async (value: any) => {
  (document.getElementById('local:editCard') as any)!.checked = value;
});

grist.onOptions((options: any) => {
  if (options?.editCard !== undefined) {
    editCard.set(options.editCard ?? false);
  }
});


function zip<T, V>(a: T[], b: V[]): [T, V][] {
  return a.map((e, i) => [e, b[i]]);
}

function defaultEnd(start: Date) {
  switch (currentScale.get()) {
    case 'day':
      return moment(start).endOf('day').toDate();
    case 'week':
      return moment(start)
        .add(1, 'week')
        .subtract(1, 'day')
        .endOf('day')
        .toDate();
    case 'month':
      return moment(start)
        .add(1, 'month')
        .subtract(1, 'day')
        .endOf('day')
        .toDate();
    case 'year':
      return moment(start)
        .add(1, 'year')
        .subtract(1, 'day')
        .endOf('day')
        .toDate();
  }
  throw new Error('Unknown scale');
}

function openCard() {
  return grist.commandApi.run('viewAsCard');
}

const getAllColumns: () => Promise<Column[]> = buildColumns();

function buildColumns() {
  let cache = [] as any[];
  let lastMappings = JSON.stringify(mappings.get());
  return async () => {
    const newMappings = JSON.stringify(mappings.get());
    if (newMappings === lastMappings) {
      return cache;
    }
    lastMappings = newMappings;
    const columns = await fetchColumnsFromGrist();
    cache = columns;
    return columns;
  };
}

/**
 * When creating a row in Grist we need to change values for Ref columns to row ids.
 */
async function liftFields(fields: Record<string, any>) {
  const allColumns = await getAllColumns();
  const myTable = await selectedTable();
  const myColumns = allColumns.filter(c => c.parentId === myTable.id);
  let clone = null as any;

  for (const colId in fields) {
    const col = myColumns.find(c => c.colId === colId);
    if (!col) {
      throw new Error(`Column with id ${colId} not found`);
    }
    // If this is formula column, omit it.
    if (col.isFormula && col.formula) {
      clone ??= {...fields};
      delete clone[colId];
      continue;
    }
    const type = col?.type;
    if (type.startsWith('Ref:')) {
      const tableId = type.split(':')[1];
      const visibleColRowId = col.visibleCol;
      const visibleColModel = allColumns.find(c => c.id === visibleColRowId);
      const visibleColId = visibleColModel?.colId;
      const table = await grist.docApi.fetchTable(tableId);
      const visibleColValues = table[visibleColId];
      const rowIndex = visibleColValues.indexOf(fields[colId]);
      const rowId = table.id[rowIndex];
      clone ??= {...fields};
      clone[colId] = rowId;
    }
  }

  return clone ?? fields;
}

timeline.on('doubleClick', async function(props) {
  const {item, event} = props;
  if (event?.type === 'dblclick' && item) {
    await withIdSpinner(item, async () => {
      await openCard();
    })
  }
});

window.onunhandledrejection = function(event) {
  console.error(event);
  showAlert('danger', event.reason);
};

window.onerror = function(event) {
  console.error(event);
  const message = (event as any).message ?? event;
  showAlert('danger', message);
};

eventGroupInfo.subscribe(openDrawer);
function openDrawer(groupId: number) {
  if (!groupId) {
    return;
  }
  const item = itemSet.get().find(i => i.group === groupId);

  const drawer = document.querySelector('.drawer-overview') as any;
  const infor = drawer.querySelector('.drawer-info') as any;
  infor.innerHTML = ``;


  const labels = mappings.get().Columns;
  const values = item.data.Columns;
  const obj = zip(labels, values);

  for (const [label, value] of obj) {
    infor.innerHTML += `<div>${label}: ${value}</div>`;
  }
  drawer.show();
}

cmdAddBlank.subscribe(addBlank);
async function addBlank() {
  const fields = {
    [mappings.get().From]: moment().startOf('day').toDate(),
    [mappings.get().To]: moment().endOf('isoWeek').toDate(),
  };
  const {id} = await grist.selectedTable.create({fields});
  await grist.setCursorPos({rowId: id});
  // Open the card.
  await openCard();
}


async function deleteSelected() {
  const selected = timeline.getSelection();
  if (selected.length === 0) {
    return;
  }
  setTimeout(async () => {
    if (!confirmChanges.get() || confirm('Are you sure you want to delete this item?')) {
      await grist.selectedTable.destroy(selected[0]);
    }
  }, 10);
}
