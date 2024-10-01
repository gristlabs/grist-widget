import moment from 'moment-timezone';
import 'moment/locale/en-gb'; // Import the 'en-gb' locale which uses ISO weeks
import { Timeline, DataSet, TimelineOptions } from 'vis-timeline/standalone';
moment.locale('en-gb');

declare global {
  var grist: any;
}

grist.ready({
  allowSelectBy: true,
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

    // Create an input element
    const input = document.createElement('input');
    input.type = 'text';
    input.value = group.content; // Set default value based on the group's content
    input.style.width = '100px'; // Set desired width

    // Prevent `vis-timeline` from hijacking the input events
    const stopEventPropagation = (event) => {
      event.stopPropagation(); // Stop the event from propagating to vis-timeline
    };
    
    // Add event listeners for various pointer events
    input.addEventListener('pointerdown', stopEventPropagation);
    input.addEventListener('pointerup', stopEventPropagation);
    input.addEventListener('pointermove', stopEventPropagation);
    input.addEventListener('click', stopEventPropagation);
    input.addEventListener('mousedown', stopEventPropagation);


    // Append the input to the container
    container.appendChild(input);

    // Return the container as the group's template
    return container;
  },

  editable: {
    add: true,
    updateTime: true,
    updateGroup: true,
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
    scale: 'day',
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
var timeline = new Timeline(container, items, options);

async function onSelect(data) {
  await grist.setCursorPos({ rowId: data.items[0] });

  if (!data.items.length) {
    const allIds = items.getIds();
    await grist.setSelectedRows(allIds);
  } else {
    await grist.setSelectedRows([data.items[0]]);
  }
}

// add event listener
timeline.on('select', onSelect);

let lastGroups = new Set();
let lastRows = new Set();
const records = observable([]);

let show = () => {};

grist.onRecords(recs => {
  const keys = Object.keys(recs[0] || {});
  console.log(recs);
  records(recs);
  show();

  const ids = recs.map(r => r.id);
  grist.setSelectedRows(ids);
});

function getFrom(r: any) {
  return r.Valid_From;
}

function getTo(r: any) {
  return r.Valid_To;
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
  show = showModel;
  show();
});
onClick('#btnReseller', () => {
  show = showReseller;
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

function renderItems(group?: string, show?: (r: any) => string) {
  const recs = records();
  const newIds = new Set(recs.map(x => x.id));
  const existing = items.getIds();
  const removed = existing.filter(x => !newIds.has(x));
  items.remove(removed);
  const newItems: any = recs
    .filter(r => getFrom(r) || getTo(r))
    .map(r => {
      const result = recToItem(r);
      if (group) {
        result.group = r[group];
      }
      if (show) {
        result.content = show(r);
      }
      return result;
    });

  items.update(newItems);
}
const formatCurrency = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
});

function showCampaings() {
  const formated = x => formatCurrency.format(x);
  renderItems('Campaign', x => `${x.Subject} (${formated(x.Campaign_MSRP)})`);
  renderGroups('Campaign');
}

function renderGroups(group: string) {
  const recs = records();
  const groupIds = new Set(recs.map(x => x[group])) as Set<string>;
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

function showModel() {
  // Same thing as above, but by Part.
  const formated = x => formatCurrency.format(x);
  renderItems('Part', x => `${x.Reseller} (${formated(x.Campaign_MSRP)})`);

  renderGroups('Part');
}

function showReseller() {
  const formated = x => formatCurrency.format(x);
  renderItems('Reseller', x => `${x.Part} (${formated(x.Campaign_MSRP)})`);

  renderGroups('Reseller');
}

function showAll() {
  const recs = records();
  const newIds = new Set(recs.map(x => x.id));
  const existing = items.getIds();
  const removed = existing.filter(x => !newIds.has(x));
  items.remove(removed);
  const newItems: any = recs.filter(r => getFrom(r) || getTo(r)).map(recToItem);
  items.update(newItems);
  timeline.setGroups();

  timeline.setOptions({
    timeAxis: {
      scale: 'day',
    },
  });
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
    (el as any).onchange = function () {
      const value = (el as any).value;
      const formatedValue = formatValue(value);
      const elementId = (el as any).id;
      const hasDot = elementId.indexOf('.') !== -1;
      if (hasDot) {
        const [parent, child] = elementId.split('.');
        console.log(`Setting ${parent}.${child} to ${formatedValue}`);
        timeline.setOptions({
          [parent]: {
            [child]: formatedValue,
          },
        });
      } else {
        console.log(`Setting ${elementId} to ${formatedValue}`);
        timeline.setOptions({
          [elementId]: formatedValue,
        });
      }
    };
    (el as any).onchange();
  }
}
bindConfig();

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
  timeline.setSelection(Number(rec.id));
})


async function main() {
  await grist.allowSelectBy();
}

main();