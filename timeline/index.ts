import { from } from 'fromit';
import moment from 'moment-timezone';
import 'moment/locale/en-gb';
import { DataSet, Timeline, TimelineOptions } from 'vis-timeline/standalone';
moment.locale('en-gb');

declare global {
  var grist: any;
  var VanillaContextMenu: any;
}


// DOM element where the Timeline will be attached
const container = document.getElementById('visualization')!;
const itemSet = new DataSet([]);
const groupSet = new DataSet<any>([]);
const records = observable([]);
const order = new Map();
const editCard = observable(false);
const zoomOnClick = observable(false);
const currentScale = observable('day');
const items = observable([]);
const groupSelected = observable(null);

// Two indexes to quickly find group name by id and vice versa.
const byStart = new Map();
const byEnd = new Map();

function startKey(item, days: number = 0) {
  const start = moment(item.start).add({days}).format('YYYY-MM-DD');
  return `${item.group}-${start}`;
}

function endKey(item, days: number = 0) {
  const end = moment(item.end).add({days}).format('YYYY-MM-DD');
  return `${item.group}-${end}`;
}

items.subscribe(list => {
  byStart.clear();
  byEnd.clear();
  for (const item of list) {
    byStart.set(startKey(item), item);
    byEnd.set(endKey(item), item);
  }
});


grist.ready({
  allowSelectBy: true,
  requiredAccess: 'read table',
  columns: [
    {
      name: 'Group',
      allowMultiple: true,
    },
    {
      name: 'Columns',
      allowMultiple: true,
      optional: true,
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
  groupOrder: function (a, b) {
    return a.id - b.id;
  },
  template: function (item, element, data) {
    const parts = data.content.split('|');
    if (parts.length === 1) {
      return parts[0];
    }
    const text = `${parts[0]} (${parts[1] || 'no subject'})`;
    const div = document.createElement('div');
    div.className = 'item-template';
    const span = document.createElement('span');
    span.innerText = text;
    div.appendChild(span);

    const someoneOnLeft = byEnd.get(startKey(item, -1));
    const someoneOnRight = byStart.get(endKey(item, +1));

    div.classList.add('item-template');
    if (someoneOnLeft) {
      div.classList.add('item-left');
    }
    if (someoneOnRight) {
      div.classList.add('item-right');
    }


    return div;
  },
  async onRemove(item, callback) {
    if (confirm('Are you sure you want to delete this item?')) {
      await grist.selectedTable.destroy(item.id);
      callback(null);
    }
  },
  async onMove(item, callback) {
    let { start, end } = item;
    const format = (date: Date) => moment(date).format('YYYY-MM-DD');

    if (!confirm('Are you sure you want to move this item?')) {
      callback(null);
      return;
    }

    // If end is at midnignt (0:00) it means we were extending or shrinking, in that case move 1 minute before.
    if (end.getHours() === 0 && end.getMinutes() === 0) {
      end = moment(end).subtract(1, 'minute').toDate();
    }
    const fields = {
      [mappings().From]: format(start),
      [mappings().To]: format(end),
    };
    await withIdSpinner(item.id, async () => {
      callback(item);
      await grist.selectedTable.update({ id: item.id, fields });
    });
  },
  async onAdd(item, callback) {
    const group = idToName.get(item.group).split('|').map(formatValue);
    const start = moment(item.start).format('YYYY-MM-DD');

    // In group we have list of values, we need to create an object from it (zip it with columns).

    const end = moment(defaultEnd(item.start)).format('YYYY-MM-DD');
    const values = [...group, start, end];
    const columns = [...mappings().Group, mappings().From, mappings().To];
    const rawFields = Object.fromEntries(zip(columns, values));

    const fields = await liftFields(rawFields);

    const { id } = await grist.selectedTable.create({ fields });

    await grist.setCursorPos({ rowId: id });

    callback(null);
  },

  // allow manipulation of items
  // editable: true,

  /* alternatively, enable/disable individual actions:

  editable: {
    add: true,
    updateTime: true,
    updateGroup: true,
    remove: true
  },
  */

  groupTemplate: function (group) {
    // Create a container for the group
    const container = document.createElement('div');

    container.classList.add('group-template');
    const partsHtml = group.columns.map(col => {
      const div = document.createElement('div');
      const value = formatValue(col);
      if (typeof value === 'string' || value === null) {
        div.innerText = String(value ?? '') || '-';
      } else if (typeof value === 'number') {
        div.innerText = formatCurrency.format(value);
      } else if (typeof value === 'boolean') {
        div.innerHTML = `<input type="checkbox" ${
          value ? 'checked' : ''
        } disabled>`;
      }
      div.classList.add('group-part');
      div.style.padding = '5px';
      return div;
    });
    container.append(...partsHtml);

    container.addEventListener('click', function () {
      // Find first item in that group.
      const first = itemSet.get().find(i => i.group === group.id);
      if (first) {
        timeline.focus(first.id);
      }
      groupSelected(group);
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
  zoomMin: 1000 * 60 * 60 * 24 * 7 * 4, // about three months in milliseconds
  zoomMax: 1000 * 60 * 60 * 24 * 31 * 12, // about three months in milliseconds
  moment: function (date) {
    return moment(date); // Use moment with the 'en-gb' locale setting
  },
  snap: function (date, scale, step) {
    const snappedDate = moment(date);

    // Adjust snapping to always align with Mondays
    if (scale === 'week') {
      snappedDate.startOf('isoWeek'); // Start of the ISO week, i.e., Monday
    } else if (scale === 'day') {
      snappedDate.startOf('day');
    }

    return snappedDate.toDate();
  },

  margin: {
    item: 4, // Adjusts the space around each item
    axis: 2, // Adjusts the space between items and the axis
  },
};

let lastGroups = new Set();
let lastRows = new Set();

(window as any).editCard = editCard;

let show = () => {};
let mappings = observable({}, { deep: true });

// Create a Timeline
const timeline = new Timeline(container, itemSet, options);

grist.onRecords((recs, maps) => {
  mappings(maps);
  records(grist.mapColumnNames(recs));
  order.clear();
  recs.forEach((r, i) => order.set(r.id, i));
  show();
  updateHeader(true);
});

function getFrom(r: any) {
  return r.From && r.From instanceof Date ? r.From : null;
}

function getTo(r: any) {
  return r.To && r.To instanceof Date ? r.To : null;
}

function recToItem(r) {
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
  result.group = r.Group.join('|');
  result.group = nameToId.get(result.group);
  result.content = r.Title.join('|');
  if (r.Readonly) {
    result.editable = false;
  }

  return result;
}

function itemToRec(item) {
  const groupName = idToName.get(item.group);
  const groupValues = groupName.split('|');
  const titleValues = item.content?.split('|') ?? [];

  return {
    Group: groupValues,
    Title: titleValues,
    From: item.start,
    To: item.end,
    id: item.id,
  };
}

function recToRow(rec) {
  const groupValues = rec.Group;
  const columns = mappings().Group;
  const allColumns = [...columns, mappings().From, mappings().To];
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

function onClick(selector: string, callback: () => void) {
  window.document.querySelector(selector)!.addEventListener('click', callback);
}

onClick('#btnAlCampaign', () => {
  show = showCampaings;
  show();
});

function same(a: any, b: any) {
  if (!a || !b) {
    return false;
  }
  return a.getTime() === b.getTime();
}

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

function observable(
  value?: any,
  options?: {
    deep?: boolean;
  }
) {
  let listeners = [] as any[];
  const obj = function (arg?: any) {
    if (arg === undefined) {
      return value;
    } else {
      if (options?.deep) {
        if (JSON.stringify(value) !== JSON.stringify(arg)) {
          listeners.forEach((clb: any) => clb(arg));
          value = arg;
        }
      } else if (value !== arg) {
        listeners.forEach((clb: any) => clb(arg));
        value = arg;
      }
    }
  };

  obj.subscribe = function (clb: any) {
    listeners.push(clb);
    return () => void listeners.splice(listeners.indexOf(clb), 1);
  };

  obj.dispose = function () {
    listeners = [];
  };

  return obj;
}

const oldRecs = new Map();

function renderItems() {
  const recs = records();

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
  
  items(newItems);

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

function showCampaings() {
  renderItems();
  renderGroups();
}

const nameToId = new Map(); // keys to id
const idToName = new Map(); // id to keys
const idToCols = new Map(); // visible columns

function calcGroup(rec: any) {
  return rec.Group.join('|');
}

function renderGroups() {
  const existingGroups = groupSet.getIds();
  const groupsToRemove = existingGroups.filter(id => !idToName.has(id));
  groupSet.remove(groupsToRemove);
  groupSet.update(
    Array.from(idToName.entries()).map(c => ({
      id: c[0],
      content: c[1],
      editable: true,
      className: 'group_' + c[1],
      columns: idToCols.get(c[0]),
    }))
  );
  timeline.setGroups(groupSet);
}

show = showCampaings;

// update the locale when changing the select box value
const select = document.getElementById('locale') as HTMLSelectElement;
select.onchange = function () {
  timeline.setOptions({
    locale: select.value as any,
  });
};

function dump(arg: any) {
  const div = document.getElementById('status-bar')!;
  div.innerText = JSON.stringify(arg);
}

(window as any).timeline = timeline;

// const range = document.getElementById('range') as HTMLInputElement;
// range.oninput = function () {
//   const visi = document.getElementById('visualization')!;
//   const margin = parseInt(range.value, 10);
//   visi.setAttribute(
//     'style',
//     `--group-columns: ${
//       margin * 3
//     }px minmax(57px, max-content) minmax(86px, max-content)`
//   );
//   timeline.redraw();
// };

function bindConfig() {
  const configElements = document.querySelectorAll('.config');

  for (const el of configElements) {
    console.debug(`Binding config element: ${el}`);
    // Subscribe to change event.
    (el as HTMLSelectElement).onchange = function () {
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
  ['timeline:cluster'](value: boolean) {
    if (value) {
      timeline.setOptions({
        cluster: true,
        stack: false,
      });
      try {
        timeline.setGroups(null);
      } catch (ex) {}
      timeline.setGroups(groupSet);
      timeline.redraw();
    } else {
      timeline.setOptions({
        cluster: false,
        stack: false,
      });
      timeline.setGroups(groupSet);
      timeline.redraw();
    }
  },
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
      currentScale(formatedValue);
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
        cluster: false,
      });
      timeline.setGroups(groupSet);
      timeline.redraw();
    }
  } else if (schema === 'local') {
    if (!(parent in window)) {
      console.error(`Local variable ${parent} not found in window`);
      return;
    }

    (window as any)[parent](formatedValue);
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

grist.onRecord(rec => {
  if (!rec || !rec.id) {
    return;
  }
  setTimeout(() => {
    // Get selected row.
    const selected = timeline.getSelection();

    if (selected[0] === rec.id) {
      return;
    }

    timeline.setSelection(Number(rec.id), {
      focus: true,
      animation: {
        animation: false,
      },
    });
  }, 10);
});

async function main() {
  // await grist.allowSelectBy();
}

main();
timeline.setGroups(groupSet);


document.addEventListener('DOMContentLoaded', function () {
  new VanillaContextMenu({
    scope: document.querySelector('.vis-panel.vis-left '),
    menuItems: [
      {
        label: 'Add new',
        callback: async () => {
          const fields = {
            [mappings().From]: moment().startOf('day').toDate(),
            [mappings().To]: moment().endOf('isoWeek').toDate(),
          };
          // const { id } = await grist.selectedTable.create({ fields });
          await grist.setCursorPos({ rowId: 'new' });
          // Open the card.
          await openCard();
        },
      },
      'hr',
      {
        label: 'More information',
        callback: async (...args) => {
          const drawer = document.querySelector('.drawer-overview') as any;
          const infor = drawer.querySelector('.drawer-info') as any;
          infor.innerHTML = ``;


          // Get selected item.
          const selected = timeline.getSelection();
          const item = itemSet.get(selected[0]);
          if (!item) {
            return;
          }

          const labels = mappings().Columns;
          const values = item.data.Columns;
          const obj = zip(labels, values);

          for (const [label, value] of obj) {
            infor.innerHTML += `<div>${label}: ${value}</div>`;
          }



          drawer.show();
        },
      },
    ],
  });

  const fore = document.querySelector(
    '#visualization > div.vis-timeline.vis-bottom.vis-ltr > div.vis-panel.vis-center > div.vis-content > div > div.vis-foreground'
  );
  fore?.addEventListener('contextmenu', function (e) {
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
  button.addEventListener('click', function () {
    timeline.fit();
  });

  // We need to track the .vis-panel.vis-left element top property changed, and adjust
  // group-header acordingly.

  const panel = document.querySelector('.vis-panel.vis-left')!;
  const header = document.getElementById('groupHeader')!;
  let lastTop = 0;
  const observer = new MutationObserver(mutations => {
    const content = panel.querySelector('.vis-labelset')!;
    const top = panel.getBoundingClientRect().top;
    if (top === lastTop) {
      return;
    }
    lastTop = top;
    const headerHeight = header.getBoundingClientRect().height;
    const newTop = top - headerHeight;
    header.style.setProperty('top', `${newTop}px`);

    // Also adjust the left property of the group-header, as it may have a scrool element.
    const left = content.getBoundingClientRect().left;
    header.style.setProperty('left', `${left}px`);
  });
  observer.observe(panel, { attributes: true });

  const foreground = document.querySelector('.vis-center .vis-foreground')!;

  const selection = document.createElement('div');
  selection.className = 'cursor-selection';
  foreground.appendChild(selection);

  foreground.addEventListener('mouseleave', function () {
    selection.style.display = 'none';
  });

  timeline.on('select', function (properties) {
    if (properties.items.length === 0) {
      return;
    }
    grist.setCursorPos({ rowId: properties.items[0] });
  });

  (foreground as any).addEventListener('mousemove', function (e: MouseEvent) {
    // Get the x position in regards of the parent.
    const x = e.clientX - foreground.getBoundingClientRect().left;

    const target = e.target as HTMLElement;

    if (target === selection) {
      return;
    }

    // Make sure target has vis-group class.
    if (!target.classList.contains('vis-group')) {
      selection.style.display = 'none';
      return;
    }
    selection.style.display = 'block';

    // Now get the element at that position but in another div.
    const anotherDiv = document.querySelector(
      'div.vis-panel.vis-background.vis-vertical > div.vis-time-axis.vis-background'
    )!;

    const anotherDivPos = anotherDiv.getBoundingClientRect().left;

    const children = Array.from(anotherDiv.children);

    // Group by week number, element will have class like vis-week4

    // Get current scale from timeline.

    const weekFromElement = (el: Element) => {
      const classList = Array.from(el.classList);

      const scale = currentScale();

      const weekClass = classList.find(c => c.startsWith('vis-' + scale));
      if (!weekClass) {
        return null;
      }
      const week = parseInt(weekClass.replace('vis-' + scale, ''), 10);
      return week;
    };

    // Group by class attribute.
    const grouped = from(children)
      .groupBy(e => weekFromElement(e))
      .toArray();

    // Map to { left: the left of the first element in group, width: total width of the group }
    const leftPoints = grouped.map(group => {
      const left = group.first().getBoundingClientRect().left;
      const width = group.reduce(
        (acc, el) => acc + el.getBoundingClientRect().width,
        0
      );
      const adjustedWidth = left - anotherDivPos;
      return { left: adjustedWidth, width };
    });

    // Find the one that is closest to the x position, so the first after.
    const index = leftPoints.findLastIndex(c => c.left < x);

    // Find its index.
    const closest = leftPoints[index];

    // Now get the element from the other div.
    const element = anotherDiv.children[index];

    // Now reposition selection.
    selection.style.left = `${closest.left}px`;
    selection.style.width = `${closest.width}px`;

    try {
      if (selection.parentElement !== target) {
        target.prepend(selection);
      }
    } catch (ex) {}
  });

  // same manu for .vis-item.vis-range
  const itemMenu = new VanillaContextMenu({
    scope: fore,
    menuItems: [
      {
        label: 'Edit',
        callback: async () => {
          const selected = timeline.getSelection();
          if (selected.length === 0) {
            return;
          }
          await grist.setCursorPos({ rowId: selected[0] });
          await openCard();
        },
      },
      {
        label: 'Delete',
        callback: async () => {
          const selected = timeline.getSelection();
          if (selected.length === 0) {
            return;
          }
          setTimeout(async () => {
            if (confirm('Are you sure you want to delete this item?')) {
              await grist.selectedTable.destroy(selected[0]);
            }
          }, 10);
        },
      },
      {
        label: 'Duplicate',
        callback: async () => {
          const selected = timeline.getSelection() as number[];
          if (selected.length === 0) {
            return;
          }
          const recs = records();
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
            await grist.selectedTable.create({ fields });
          });
        },
      },
    ],
  });
});

editCard.subscribe(async (value: any) => {
  await grist.setOption('editCard', value);
  (document.getElementById('local:editCard') as any)!.checked = value;
});

grist.onOptions((options: any) => {
  if (options?.editCard !== undefined) {
    editCard(options.editCard ?? false);
  }
});

// Hihgligh group if clicked

let lastMappings = '';

function updateHeader(force) {
  const newMappings = JSON.stringify(mappings());
  if (newMappings === lastMappings && !force) {
    return;
  }
  lastMappings = newMappings;

  // We have this element  <div class="group-header" id="groupHeader"></div>

  // Maps has somegint like this { Group: [ 'Campaign', 'Model', 'Reseller' ] }

  // So generate elements and insert it into the groupHeader, so that it looks like this
  // Campaign | Model | Reseller

  const groupHeader = document.getElementById('groupHeader')!;
  if (!groupHeader) {
    return;
  }
  groupHeader.innerHTML = '';
  const parts = mappings().Columns.map((col: string) => {
    const div = document.createElement('div');
    div.innerText = col;
    div.classList.add('group-part');
    div.style.padding = '5px';
    return div;
  });
  groupHeader.style.setProperty('grid-template-columns', 'auto');
  groupHeader.append(...parts);

  // Now we need to update its width, we can't break lines and anything like that.
  const width = Math.ceil(groupHeader.getBoundingClientRect().width);

  // And set this width as minimum for the table rendered below.
  const visualization = document.getElementById('visualization')!;
  // Set custom property --group-header-width to the width of the groupHeader
  visualization.style.setProperty('--group-header-width', `${width}px`);

  // Now measer each individual line, and provide grisd-template-columns variable with minimum
  // width to acomodate column and header width.
  // grid-template-columns: var(--group-columns,  repeat(12, max-content));

  const widths = parts.map(part =>
    Math.ceil(part.getBoundingClientRect().width)
  );
  const templateColumns = widths
    .map(w => `minmax(${w}px, max-content)`)
    .join(' ');

  visualization.style.setProperty('--group-columns', templateColumns);
  anchorHeader();

  const firstLine = document.querySelector('.group-template');
  if (!firstLine) {
    console.error('No first line found');
    return;
  }
  const sizesFromFirstLine = Array.from(firstLine.children).map(
    (el: Element) => el.getBoundingClientRect().width
  );
  const templateColumns2 = sizesFromFirstLine.map(w => `${w}px`).join(' ');
  groupHeader.style.setProperty('grid-template-columns', templateColumns2);
}
let lastTop = 0;

(window as any).updateHeader = updateHeader;

function anchorHeader() {
  const panel = document.querySelector('.vis-panel.vis-left')!;
  const header = document.getElementById('groupHeader')!;
  const content = panel.querySelector('.vis-labelset')!;
  const top = panel.getBoundingClientRect().top;
  if (top === lastTop) {
    return;
  }
  lastTop = top;
  const headerHeight = header.getBoundingClientRect().height;
  const newTop = top - headerHeight;
  header.style.setProperty('top', `${newTop}px`);

  // Also adjust the left property of the group-header, as it may have a scrool element.
  const left = content.getBoundingClientRect().left;
  header.style.setProperty('left', `${left}px`);
}

function zip<T, V>(a: T[], b: V[]): [T, V][] {
  return a.map((e, i) => [e, b[i]]);
}

function defaultEnd(start: Date) {
  switch (currentScale()) {
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

// timeline.on('contextmenu', function (props) {
//   alert('Right click!');

//   props.event.preventDefault();
// });

function openCard() {
  return grist.commandApi.run('viewAsCard');
}

const getAllColumns = buildColumns();

function buildColumns() {
  let cache = [] as any[];
  let lastMappings = JSON.stringify(mappings());
  return async () => {
    const newMappings = JSON.stringify(mappings());
    if (newMappings === lastMappings) {
      return cache;
    }
    lastMappings = newMappings;
    const columns = await getAllColumns();
    cache = columns;
    return columns;
  };

  async function getAllColumns() {
    const columns = await grist.docApi.fetchTable('_grist_Tables_column');
    const fields = Object.keys(columns);
    const tableColumns = [] as any[];
    for (const index in columns.parentId) {
      tableColumns.push(
        Object.fromEntries(fields.map(f => [f, columns[f][index]]))
      );
    }
    return tableColumns;
  }
}

async function liftFields(fields: any) {
  const allColumns = await getAllColumns();
  let clone = null as any;

  for (const colId in fields) {
    const col = allColumns.find(c => c.colId === colId);
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
      clone ??= { ...fields };
      clone[colId] = rowId;
    }
  }

  return clone ?? fields;
}

timeline.on('doubleClick', async function (props) {
  const { item, event } = props;
  if (event?.type === 'dblclick' && item) {
    await openCard();
  }
});

(window as any).items = itemSet;
(window as any).groups = groupSet;


async function withElementSpinner(element: Element, callback: () => Promise<void>) {
  const spinner = document.createElement('sl-spinner');
  element.appendChild(spinner);
  try {
    await callback();
  } finally {
    spinner.remove();
  }
}


async function withIdSpinner(id: number, callback: () => Promise<void>) {
  const element = document.querySelector(`.item_${id}`)!;
  const spinner = document.createElement('sl-spinner');
  element.appendChild(spinner);
  try {
    await callback();
  } finally {
    spinner.remove();
  }
}


window.onunhandledrejection = function (event) {
  console.error(event);

  showAlert('danger', event.reason);
};

window.onerror = function (event) {
  console.error(event);
  const message = (event as any).message ?? event;
  showAlert('danger', message);

};

function showAlert(variant: string, message: string) {
  const alert = document.querySelector(`sl-alert[variant="${variant}"]`) as any;
  const title = alert.querySelector('#title') as any;
  const text = alert.querySelector('#text') as any;
  title.innerText = "Error occured";
  text.innerText = message;
  alert.toast();
}