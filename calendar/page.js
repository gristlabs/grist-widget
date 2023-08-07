// grist is imported in html, so it is available here.
var grist;
function ready(fn) {
  if (document.readyState !== 'loading'){
    fn();
  } else {
    document.addEventListener('DOMContentLoaded', fn);
  }
}

let mainColor = getComputedStyle(document.documentElement)
    .getPropertyValue('--main-color')

let selectedColor = getComputedStyle(document.documentElement)
    .getPropertyValue('--selected-color')

async function calendarViewChanges(radiobutton){
  await grist.setOption('calendarViewPerspective', radiobutton.value);
}

function mapCalendarEventToGristObject(event){
  const mappedRecord = grist.mapColumnNamesBack(event);
  delete mappedRecord.id;
  return{id:event.id, fields: mappedRecord };
}

let selectedRecordId = null;
let Calendar = null;



async function configureGristSettings() {
  const columnsMappingOptions = [
    {
      name: "startDate", // What field we will read.
      title: "Start Date", // Friendly field name.
      optional: false, // Is this an optional field.
      type: "DateTime", // What type of column we expect.
      description: "starting point of event", // Description of a field.
      allowMultiple: false // Allows multiple column assignment.
    },
    {
      name: "endDate",
      title: "End Date",
      optional: false,
      type: "DateTime",
      description: "ending point of event",
      allowMultiple: false
    },
    {
      name: "title",
      title: "Title",
      optional: false,
      type: "Text",
      description: "title of event",
      allowMultiple: false
    },
    {
      name: "isAllDay",
      title: "Is All Day",
      optional: true,
      type: "Bool",
      description: "is event all day long",
    }
  ];

  await grist.allowSelectBy();
  grist.onRecords(updateCalendar);
  grist.onRecord(gristRecordChanged);
  grist.onOptions(onGristSettingsChanged);
  grist.ready({requiredAccess: 'read table', columns: columnsMappingOptions});
}

let gristRecordChanged = (record, mappings) => {
  const mappedRecord = grist.mapColumnNames(record, mappings);
  if(mappedRecord) {
    Calendar.setDate(mappedRecord.startDate);
    if(selectedRecordId){
      Calendar.updateEvent(selectedRecordId, 'cal1',{backgroundColor: mainColor});
    }
    Calendar.updateEvent(mappedRecord.id, 'cal1',{backgroundColor: selectedColor});
    selectedRecordId = mappedRecord.id;
  }
  var dom = document.querySelector('.toastui-calendar-time');
  const middleHour = mappedRecord.startDate.getHours()
      + (mappedRecord.endDate.getHours() - mappedRecord.startDate.getHours())/2;
  dom.scrollTo({top: (dom.clientHeight/24)*middleHour, behavior: 'smooth'});
};

let onGristSettingsChanged = function (options) {
  if(options.calendarViewPerspective){
    Calendar.changeView(options.calendarViewPerspective);
    selectRadioButton(options.calendarViewPerspective);
  }
};



function configureCalendar() {
  const container = document.getElementById('calendar');
  // ToastUI calendar settings - https://nhn.github.io/tui.calendar/latest/Calendar
  const options = {
    week: {
      taskView: false,
    },
    month: {},
    defaultView: 'week',
    template: {
      time(event) {
        const {title} = event;
        return `<span>${title}</span>`;
      },
      allday(event) {
        const {title} = event;
        return `<span>${title}</span>`;
      },
    },
    calendars: [
      {
        id: 'cal1',
        name: 'Personal',
        backgroundColor: mainColor,
      },
    ],
  }
  // Update the widget anytime the document data changes.
  Calendar = new tui.Calendar(container, options);
  Calendar.on('beforeUpdateEvent', onCalendarEventBeingUpdated);
  Calendar.on('clickEvent', async (info) => {
    grist.setSelectedRows([info.event.id]);
  });
  Calendar.on('selectDateTime', onNewDateBeingSelectedOnCalendar);
  return Calendar;
}

const onCalendarEventBeingUpdated = async (info) => {
  if (info.changes) {
    if (info.changes.start || info.changes.end) {
      const record = await grist.fetchSelectedRecord(info.event.id)
      if (record) {
        const gristEvent = {
          startDate: (info.changes.start?.valueOf() ?? info.event.start.valueOf()) / 1000,
          endDate: (info.changes.end?.valueOf() ?? info.event.end.valueOf()) / 1000,
          isAllday: info.changes.isAllday ?? info.event.isAllday,
          title: info.changes.title ?? info.event.title,
          id: record.id,
        }
        const mappedRecord = mapCalendarEventToGristObject(gristEvent);
        const table = await grist.getTable();
        await table.update(mappedRecord);

      }
    }
  }
};

const onNewDateBeingSelectedOnCalendar = async (info) => {
  const gristEvent = {
    startDate: info.start?.valueOf() / 1000,
    endDate: info.end?.valueOf() / 1000,
    isAllDay: info.isAllday ? 1 : 0,
    title: "New Event"
  }
  const table = await grist.getTable();
  await table.create(mapCalendarEventToGristObject(gristEvent));
  Calendar.clearGridSelections();
}
ready(function() {
  configureGristSettings();
  Calendar = configureCalendar();
});

function selectRadioButton(value){
  for(const element of document.getElementsByName('calendar-options')){
    if(element.value === value){
      element.checked = true;
    }
  }
}

function calendarPrevious(){
  Calendar.prev();
}

function calendarNext(){
  Calendar.next();
}

function calendarToday(){
  Calendar.today();
}

let previousIds= [];
function updateCalendar(records,mappings) {

  const mappedRecords = grist.mapColumnNames(records, mappings);

  if(mappedRecords) {
    for (const record of mappedRecords) {
      const event = Calendar.getEvent(record.id, 'cal1'); // EventObject
      if (!event) {
        Calendar.createEvents([
          {
            id: record.id,
            calendarId: 'cal1',
            title: record.title,
            start: record.startDate,
            end: record.endDate,
            isAllday: record.isAllDay,
            category: 'time',
            state: 'Free',
          },
        ]);
      } else {
        Calendar.updateEvent(record.id, 'cal1', {
          title: record.title,
          start: record.startDate,
          end: record.endDate,
          isAllday: record.isAllDay,
        })
      }
    }
    for (const id of previousIds) {
      if (!mappedRecords.find(record => record.id === id)) {
        Calendar.deleteEvent(id, 'cal1');
      }
    }
    previousIds = new Set(mappedRecords.map(record => record.id));
  }
}


