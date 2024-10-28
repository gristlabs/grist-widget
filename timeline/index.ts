import {from} from 'fromit';
import moment from 'moment-timezone';
import 'moment/locale/en-gb';
import {DataSet, Timeline, TimelineOptions} from 'vis-timeline/standalone';
import {computed, observable} from './lib.js';
import {registerIconLibrary} from '@shoelace-style/shoelace/dist/utilities/icon-library.js';
registerIconLibrary('default', {
  resolver: name => `./out/${name}.svg`
});


import '@shoelace-style/shoelace/dist/themes/light.css';
import '@shoelace-style/shoelace/dist/components/drawer/drawer.js';
import '@shoelace-style/shoelace/dist/components/button/button.js';
import '@shoelace-style/shoelace/dist/components/switch/switch.js';
import '@shoelace-style/shoelace/dist/components/alert/alert.js';
import '@shoelace-style/shoelace/dist/components/icon/icon.js';

import VanillaContextMenu from 'vanilla-context-menu';

// Make sure we have monday as the first day of the week.
moment.locale('en-gb');

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
const groupSelected = observable(null);

interface Item {
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

Object.assign((window as any), {
  currentScale,
  confirmChanges,
  editCard,
  observable,
  computed,
});


// Two indexes to quickly find group name by id and vice versa.
const byStart = new Map();
const byEnd = new Map();

function startKey(item: Item, days: number = 0) {
  const start = moment(item.start).add({days}).format('YYYY-MM-DD');
  return `${item.group}-${start}`;
}


function endKey(item: Item, days: number = 0): string {
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

    const someoneOnLeft = byEnd.get(startKey(item, -1));
    const someoneOnRight = byStart.get(endKey(item, +1));

    div.classList.add('item-template');
    if (someoneOnLeft) {
      div.classList.add('item-left');
    }
    if (someoneOnRight) {
      div.classList.add('item-right');
    }

    const {start, end} = data;

    const all = items() as Item[];

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
    if (!confirmChanges() || confirm('Are you sure you want to delete this item?')) {
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

    if (confirmChanges() && !confirm('Are you sure you want to move this item?')) {
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
      await grist.selectedTable.update({id: item.id, fields});
    });
  },
  async onAdd(item, callback) {
    const group = idToName.get(item.group).split('|').map(formatValue);
    const start = moment(item.start).format('YYYY-MM-DD');

    if (!(item.start instanceof Date)) {
      console.error('Invalid date');
      return;
    }


    // In group we have list of values, we need to create an object from it (zip it with columns).

    const end = moment(defaultEnd(item.start)).format('YYYY-MM-DD');
    const values = [...group, start, end];
    const columns = [...mappings().Columns, mappings().From, mappings().To];
    const rawFields = Object.fromEntries(zip(columns, values));

    const fields = await liftFields(rawFields);


    const {id} = await grist.selectedTable.create({fields});

    await grist.setCursorPos({rowId: id});

    callback(null);

    openCard();
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
      return div;
    })());

    container.append(...partsHtml);

    container.addEventListener('click', function() {
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
  zoomMin: 1000 * 60 * 60 * 24 * 7 * 2, // about four weeks in milliseconds
  zoomMax: 1000 * 60 * 60 * 24 * 31 * 3, // about  12 months in milliseconds
  moment: function(date) {
    return moment(date); // Use moment with the 'en-gb' locale setting
  },
  snap: function(date) {
    const snappedDate = moment(date);

    // Adjust snapping to always align with Mondays
    // if (scale === 'week') {
    //   snappedDate.startOf('isoWeek'); // Start of the ISO week, i.e., Monday
    // } else if (scale === 'day') {
    //   snappedDate.startOf('day');
    // }
    snappedDate.startOf('day');


    return snappedDate.toDate();
  },

  margin: {
    item: 3,
    axis: 1
  }
};



let show = () => {};
let mappings = observable<any>({}, {deep: true});

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
  const columns = mappings().Columns;
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

  items(newItems.toArray());

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

show = showCampaings;

// update the locale when changing the select box value
// const select = document.getElementById('locale') as HTMLSelectElement;
// select.onchange = function() {
//   timeline.setOptions({
//     locale: select.value as any,
//   });
// };


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
  ['timeline:cluster'](value: boolean) {
    if (value) {
      timeline.setOptions({
        cluster: false as any,
        stack: false,
      });
      try {
        timeline.setGroups(null);
      } catch (ex) {}
      timeline.setGroups(groupSet);
      timeline.redraw();
    } else {
      timeline.setOptions({
        cluster: false as any,
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


const cursorBox = document.createElement('div');


document.addEventListener('DOMContentLoaded', function() {
  new VanillaContextMenu({
    scope: document.querySelector('.vis-panel.vis-left ')!,
    menuItems: [
      {
        label: 'Add new',
        callback: async () => {
          const fields = {
            [mappings().From]: moment().startOf('day').toDate(),
            [mappings().To]: moment().endOf('isoWeek').toDate(),
          };
          const {id} = await grist.selectedTable.create({fields});
          await grist.setCursorPos({rowId: id});
          // Open the card.
          await openCard();
        },
      },
      'hr',
      {
        label: 'More information',
        callback: async () => {
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

  // We need to track the .vis-panel.vis-left element top property changed, and adjust
  // group-header acordingly.

  const panel = document.querySelector('.vis-panel.vis-left')!;
  const header = document.getElementById('groupHeader')!;
  let lastTop = 0;
  const observer = new MutationObserver(() => {
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
  observer.observe(panel, {attributes: true});

  const foreground = document.querySelector('.vis-center .vis-foreground')!;

  cursorBox.className = 'cursor-selection';
  foreground.appendChild(cursorBox);

  foreground.addEventListener('mouseleave', function() {
    cursorBox.style.display = 'none';
  });

  timeline.on('select', function(properties) {
    if (properties.items.length === 0) {
      return;
    }
    grist.setCursorPos({rowId: properties.items[0]});
  });

  (foreground as any).addEventListener('mousemove', function(e: MouseEvent) {
    // Get the x position in regards of the parent.
    const x = e.clientX - foreground.getBoundingClientRect().left;

    const target = e.target as HTMLElement;

    if (target === cursorBox) {
      return;
    }

    // Make sure target has vis-group class.
    if (!target.classList.contains('vis-group')) {
      cursorBox.style.display = 'none';
      return;
    }
    cursorBox.style.display = 'block';

    // Now get the element at that position but in another div.
    const anotherDiv = document.querySelector(
      'div.vis-panel.vis-background.vis-vertical > div.vis-time-axis.vis-background'
    )!;

    const anotherDivPos = anotherDiv.getBoundingClientRect().left;

    if (!leftPoints.length) {
      const children = Array.from(anotherDiv.children);
      // Group by week number, element will have class like vis-week4

      // Get current scale from timeline.
      const weekFromElement = (el: Element) => {
        const classList = Array.from(el.classList)
          .filter(f => !['vis-even', 'vis-odd', 'vis-minor', 'vis-major'].includes(f))
        return classList.join(' ');
      };

      // Group by class attribute.
      const grouped = from(children)
        .groupBy(e => weekFromElement(e))
        .toArray();

      // Map to { left: the left of the first element in group, width: total width of the group }
      const points = grouped.map(group => {
        const left = group.first().getBoundingClientRect().left;
        const width = group.reduce(
          (acc, el) => acc + el.getBoundingClientRect().width,
          0
        );
        const adjustedWidth = left - anotherDivPos;
        return {left: adjustedWidth, width};
      });

      leftPoints = points;
    }

    // Find the one that is closest to the x position, so the first after.
    const index = leftPoints.findLastIndex(c => c.left < x);

    // Find its index.
    const closest = leftPoints[index];

    // Now get the element from the other div.

    // Now reposition selection.
    cursorBox.style.left = `${closest.left}px`;
    cursorBox.style.width = `${closest.width}px`;
    cursorBox.style.transform = '';


    try {
      if (cursorBox.parentElement !== target) {
        target.prepend(cursorBox);
      }
    } catch (ex) {}
  });

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
        callback: async () => {
          const selected = timeline.getSelection();
          if (selected.length === 0) {
            return;
          }
          setTimeout(async () => {
            if (!confirmChanges() || confirm('Are you sure you want to delete this item?')) {
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
            await grist.selectedTable.create({fields});
          });
        },
      },
    ],
  });
});

editCard.subscribe(async (value: any) => {
  // await grist.setOption('editCard', value);
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

  const moreDiv = document.createElement('div');
  moreDiv.style.width = '20px';

  parts.push(moreDiv);
  groupHeader.append(...parts);

  // Now we need to update its width, we can't break lines and anything like that.
  const width = Math.ceil(groupHeader.getBoundingClientRect().width);

  // And set this width as minimum for the table rendered below.
  const visualization = document.getElementById('visualization')!;
  // Set custom property --group-header-width to the width of the groupHeader
  visualization.style.setProperty('--group-header-width', `${width}px`);

  // Now measure each individual line, and provide grid-template-columns variable with minimum
  // width to make up for a column and header width.
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
  const newTop = top - headerHeight + 1;
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

function openCard() {
  return grist.commandApi.run('viewAsCard');
}

const getAllColumns: () => Promise<Column[]> = buildColumns();

interface BulkColumns {
  id: number[];
  colId: string[];
  parentId: number[];
  type: string[];
  displayCol: string[];
  isFormula: boolean[];
  formula: string[];
  visibleCol: string[];
}
interface Column extends Record<keyof BulkColumns, any> {};

function buildColumns() {
  let cache = [] as any[];
  let lastMappings = JSON.stringify(mappings());
  return async () => {
    const newMappings = JSON.stringify(mappings());
    if (newMappings === lastMappings) {
      return cache;
    }
    lastMappings = newMappings;
    const columns = await fetchColumnsFromGrist();
    cache = columns;
    return columns;
  };



  async function fetchColumnsFromGrist() {
    const columns: Column[] = toRecords(await grist.docApi.fetchTable('_grist_Tables_column'));
    return columns;
  }
}

let tablesCache = [] as any[];

async function fetchTables() {
  if (!tablesCache.length) {
    tablesCache = toRecords(await grist.docApi.fetchTable('_grist_Tables'));
  }
  return tablesCache;
}

async function selectedTable() {
  const tables = await fetchTables();
  const tableId = await grist.selectedTable.getTableId();
  return tables.find(t => t.tableId === tableId);
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


async function withIdSpinner(id: any, callback: () => Promise<void>) {
  const element = document.querySelector(`.item_${id}`)!;
  const spinner = document.createElement('sl-spinner');
  element.appendChild(spinner);
  try {
    await callback();
  } finally {
    spinner.remove();
  }
}


window.onunhandledrejection = function(event) {
  console.error(event);

  showAlert('danger', event.reason);
};

window.onerror = function(event) {
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


let leftPoints = [] as {left: number; width: number}[];

timeline.on('rangechange', ({byUser, event}) => {
  leftPoints = [];

  if (!byUser) {
    return;
  }
  if (!event || !event.deltaX) {
    return;
  }
  const deltaX = event.deltaX;
  cursorBox.style.transform = `translateX(${deltaX}px)`;
  if (!byUser) {
    return;
  }
});

timeline.on('rangechanged', () => {
  // Try to parse transform, and get the x value.
  const transform = cursorBox.style.transform;
  if (!transform) {
    return;
  }
  const match = transform.match(/translateX\(([^)]+)\)/);
  if (!match) {
    return;
  }
  const x = parseFloat(match[1]);

  // Update left property of the cursorBox, by adding the delta.
  const left = parseFloat(cursorBox.style.left);
  cursorBox.style.left = `${left + x}px`;
  cursorBox.style.transform = '';
})

