import { Timeline, DataSet, TimelineOptions } from 'vis-timeline/standalone';
import moment from 'moment';


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

  editable: {
    add: true,
    updateTime: true,
    remove: true,
  },
  showCurrentTime: true,

  stack: true,
  verticalScroll: true,
  zoomKey: 'ctrlKey',
  height: '100%',

  orientation: 'top',

  timeAxis: {
    scale: 'week',
    step: 1
  },
  format: {
    minorLabels: {week: 'w'}
  },

  locale: 'pl',

  zoomMin: 1000 * 60 * 60 * 24 * 31 * 3, // one day in milliseconds
  zoomMax: 1000 * 60 * 60 * 24 * 31 * 12, // about three months in milliseconds
};

// Create a Timeline
var timeline = new Timeline(container, items, options);

async function onSelect(data) {
  await grist.setCursorPos({ rowId: data.items[0] });
  await grist.commandApi.run('viewAsCard');
}

// add event listener
timeline.on('select', onSelect);

let lastGroups = new Set();
let lastRows = new Set();
const records = observable([]);

let show = () => {};

grist.onRecords(recs => {
  console.error('records', recs);
  const keys = Object.keys(recs[0] || {});
  console.error('keys', keys);
  console.log(recs);
  records(recs);
  show();
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
    end: trimTime(getTo(r)),
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
  show = showModel
  show();
});
onClick('#btnReseller', () => {
  show = showReseller
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
    return date;
  }
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
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
  const groupIds = new Set(recs.map(x => x[group]));
  const existingGroups = groups.getIds();
  const groupsToRemove = existingGroups.filter(x => !groupIds.has(x));
  groups.remove(groupsToRemove);
  groups.update(Array.from(groupIds).map(c => ({ id: c, content: c })));
  timeline.setGroups(groups);
}


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
  const newItems: any = recs
    .filter(r => getFrom(r) || getTo(r))
    .map(recToItem);
  items.update(newItems);
  timeline.setGroups();
}

show = showCampaings;
