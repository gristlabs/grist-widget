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
      return `<span>${event.title}</span>`;
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

async function calendarViewChanges(radiobutton){
  await grist.setOption('calendarViewPerspective', radiobutton.value);
}

function mapCalendarEventToGristObject(event){
  const dateFrom = (info.changes.start?.valueOf() ?? info.event.start.valueOf()) / 1000;
  const dateTo = (info.changes.end?.valueOf() ?? info.event.start.valueOf()) / 1000;
  const recordToMap = {id: record.id, startDate: dateFrom, endDate: dateTo, title: info.event.title, isAllDay: info.event.isAllday};
  const mappedRecord = grist.mapColumnNamesBack(recordToMap);
  delete mappedRecord.id;
  return{id:record.id, fields: mappedRecord };
}

let Calendar
let selectedRecordId = null;
ready(function() {
  const container = document.getElementById('calendar');
  // Update the widget anytime the document data changes.
  Calendar = new tui.Calendar(container, options);
  grist.allowSelectBy();
  grist.onRecords(updateCalendar);
  grist.onRecord((record, mappings) => {
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
  });
  grist.onOptions(function (options, interaction) {
    if(options.calendarViewPerspective){
      Calendar.changeView(options.calendarViewPerspective);
      selectRadioButton(options.calendarViewPerspective);
    }
  });
    Calendar.on('beforeUpdateEvent', async (info) => {
      if (info.changes) {
        if (info.changes.start || info.changes.end) {
          const record = await grist.fetchSelectedRecord(info.event.id)
          if (record) {
            const dateFrom = (info.changes.start?.valueOf() ?? info.event.start.valueOf()) / 1000;
            const dateTo = (info.changes.end?.valueOf() ?? info.event.start.valueOf()) / 1000;
            const table = await grist.getTable();
            const recordToMap = {id: record.id, startDate: dateFrom, endDate: dateTo, title: info.event.title, isAllDay: info.event.isAllday};
            const mappedRecord = grist.mapColumnNamesBack(recordToMap);
            delete mappedRecord.id;
            await table.update({id:record.id, fields: mappedRecord });

        }
      }
    }
  });
    Calendar.on('clickEvent', async (info) => {
      grist.setSelectedRows([info.event.id]);
    });
  // Registering an instance event
  Calendar.on('selectDateTime', async (info) => {
    const dateFrom = info.start?.valueOf() / 1000;
    const dateTo = info.end?.valueOf() / 1000;
    const table = await grist.getTable();
    await table.create( {fields: {B: dateFrom, C: dateTo, "Is_All_Day_": info.isAllday?1:0, A: "New Event"}})
    Calendar.clearGridSelections();
  });
  grist.ready({requiredAccess: 'read table', columns: columnsMappingOptions});

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


