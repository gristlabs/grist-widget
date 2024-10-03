import moment from 'moment-timezone';
import 'moment/locale/en-gb'; // Import the 'en-gb' locale which uses ISO weeks
import { Timeline, DataSet, TimelineOptions } from 'vis-timeline/standalone';
moment.locale('en-gb');
import { from } from 'fromit';

declare global {
  var grist: any;
}

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
      name: 'From',
    },
    {
      name: 'To',
    },
  ],
});

// DOM element where the Timeline will be attached
const container = document.getElementById('visualization')!;

// Items data set, each item is : {
const items = new DataSet([
  // { id: 1, content: 'item 1', start: '2014-04-20' },
  // { id: 2, content: 'item 2', start: '2014-04-14' },
  // { id: 3, content: 'item 3', start: '2014-04-18' },
  // { id: 4, content: 'item 4', start: '2014-04-16', end: '2014-04-19' },
  // { id: 5, content: 'item 5', start: '2014-04-25' },
  // { id: 6, content: 'item 6', start: '2014-04-27', type: 'point' },
]);

const groups = new DataSet<any>([]);

// Configuration for the Timeline
const options: TimelineOptions = {
  // allow selecting multiple items using ctrl+click, shift+click, or hold.
  multiselect: true,

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
    const parts = group.content.split('|');
    const partsHtml = parts.map(part => {
      const div = document.createElement('div');
      const value = formatValue(part);
      if (typeof value === 'string') {
        div.innerText = String(value) || '-';
      } else if (typeof value === 'number') {
        div.innerText = formatCurrency.format(value);
      } else if (typeof value === 'boolean') {
        div.innerHTML = `<input type="checkbox" ${
          value ? 'checked' : ''
        } disabled>`;
      }
      div.classList.add('group-part');
      return div;
    });
    container.append(...partsHtml);

    // Return the container as the group's template
    return container;
  },

  editable: {
    add: true,
    updateTime: true,
    updateGroup: false,
    remove: true,
    overrideItems: true,
  },
  showCurrentTime: true,
  showWeekScale: true,

  verticalScroll: true,
  zoomKey: 'ctrlKey',
  height: '100%',

  orientation: 'top',

  timeAxis: {
    scale: 'week',
    step: 3600,
  },
  format: {},

  locale: 'en-gb',
  stack: false,
  stackSubgroups: true,
  groupHeightMode: 'fixed',
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
    }

    return snappedDate.toDate();
  },

  margin: {
    item: 4, // Adjusts the space around each item
    axis: 2, // Adjusts the space between items and the axis
  },
  // Optional: Set max/min heights for the row
  // maxHeight: 300, // You can adjust this to your liking
};

// Create a Timeline
const timeline = new Timeline(container, items, options);

async function onSelect(data) {
  await grist.setCursorPos({ rowId: data.items[0] });

  // if (!data.items.length) {
  //   const allIds = items.getIds();
  //   await grist.setSelectedRows(allIds);
  // } else {
  //   await grist.setSelectedRows([data.items[0]]);
  // }

  if (editCard()) {
    await grist.commandApi.run('viewAsCard');
  }
}

// add event listener
timeline.on('select', onSelect);

let lastGroups = new Set();
let lastRows = new Set();
const records = observable([]);
const editCard = observable(false);
(window as any).editCard = editCard;

let show = () => {};
let mapping = observable({});



grist.onRecords((recs, maps) => {
  mapping(maps);
  records(grist.mapColumnNames(recs));
  show();
  // const ids = recs.map(r => r.id);
  // grist.setSelectedRows(ids);
});

function getFrom(r: any) {
  return r.From && r.From instanceof Date ? r.From : null;
}

function getTo(r: any) {
  return r.To && r.To instanceof Date ? r.To : null;
}

function recToItem(r) {
  return {
    id: r.id,
    content: r.Subject || 'no title',
    start: trimTime(getFrom(r)),
    end: appendEnd(trimTime(getTo(r))),
    type: same(getTo(r), getFrom(r)) ? 'point' : 'range',
    group: undefined,
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

onClick('#btnAll', () => {
  show = showAll;
  show();
});
onClick('#btnAlCampaign', () => {
  show = showCampaings;
  show();
});
onClick('#btnModel', () => {
  show();
});
onClick('#btnReseller', () => {
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

function observable(value?: any) {
  let listeners = [] as any[];
  const obj = function (arg?: any) {
    if (arg === undefined) {
      return value;
    } else {
      if (value !== arg) {
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

function renderItems(group = false) {
  const recs = records();
  const newIds = new Set(recs.map(x => x.id));
  const existing = items.getIds();
  const removed = existing.filter(x => !newIds.has(x));
  items.remove(removed);
  const newItems = from(recs as any[])
    .filter(r => getFrom(r) && getTo(r))
    .map(r => {
      const result = recToItem(r);
      if (group) {
        result.group = r.Columns.join('|');
      }
      result.content = r.Title.join('|');
      return result;
    });

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

  items.update(array);
}
const formatCurrency = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
});

function showCampaings() {
  renderItems(true);
  renderGroups();
}

function calcGroup(rec: any) {
  return rec.Columns.join('|');
}

function renderGroups() {
  const recs = records();
  const groupIds = new Set(recs.map(x => calcGroup(x))) as Set<string>;
  const existingGroups = groups.getIds();
  const groupsToRemove = existingGroups.filter(x => !groupIds.has(x));
  groups.remove(groupsToRemove);
  groups.update(
    Array.from(groupIds).map(c => ({
      id: c,
      content: c,
      editable: true,
    }))
  );
  timeline.setGroups(groups);
}

function groupHtml(group: string) {
  return `
    <div class="grist_row" >
      <input type="text" value="${group}" onclick="grist_row_click(this, event)" />
      <input type="text" value="0"  onclick="grist_row_click(this, event)"/>
    </div>
  `;
}

(window as any).grist_row_click = function (
  el: HTMLElement,
  event: MouseEvent
) {
  console.log(`Stopping this `);
  // event.stopImmediatePropagation();
  // event.stopPropagation();
  // console.log(el);
  // el.focus();
};

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
//   // Copy this value as margin.
//   const margin = parseInt(range.value, 10);
//   timeline.setOptions({
//     margin: {
//       item: {
//         horizontal: margin,
//         vertical: margin
//       },    // Adjusts the space around each item
//       axis: margin     // Adjusts the space between items and the axis
//     }
//   });
// };

function bindConfig() {
  const configElements = document.querySelectorAll('.config');
  console.log(`Found ${configElements.length} config elements`);
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

function updateConfig(elementId: string, value: any) {
  const formatedValue = formatValue(value);
  const schema = elementId.split(':')[0];
  const [parent, child] = elementId.split(':')[1].split('.');
  if (child && schema === 'timeline') {
    console.log(`Setting ${parent}.${child} to ${formatedValue}`);
    timeline.setOptions({
      [parent]: {
        [child]: formatedValue,
      },
    });
  } else if (schema === 'timeline') {
    console.log(`Setting ${parent} to ${formatedValue}`);
    timeline.setOptions({
      [parent]: formatedValue,
    });
  } else if (schema === 'local') {
    if (!(parent in window)) {
      console.error(`Local variable ${parent} not found in window`);
      return;
    }
    console.log(`Setting ${parent} to ${formatedValue}`);
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

document.addEventListener('DOMContentLoaded', function () {
  const button = document.getElementById('focusButton')!;
  button.addEventListener('click', function () {
    timeline.fit();
  });
});

timeline.setOptions({
  timeAxis: {
    scale: 'week',
  },
});


editCard.subscribe(async (value: any) => {
  await grist.setOption('editCard', value);
  (document.getElementById('local:editCard') as any)!.checked = value;
});

grist.onOptions((options: any) => {
  if (options.editCard !== undefined) {
    editCard(options.editCard ?? false);
      }
});