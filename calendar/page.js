// lets assume that it's imported in a html file
var grist;

document.addEventListener('DOMContentLoaded', ()=> {
  this.calendarHandler = new CalendarHandler();
  Calendar =  this.calendarHandler.calendar;
  configureGristSettings();

});


async function calendarViewChanges(radiobutton) {
  await grist.setOption('calendarViewPerspective', radiobutton.value);
}

function mapCalendarEventToGristObject(event) {
  const mappedRecord = grist.mapColumnNamesBack(event);
  delete mappedRecord.id;
  return { id: event.id, fields: mappedRecord };
}

let Calendar
class CalendarHandler {
  static _mainColor = getComputedStyle(document.documentElement)
      .getPropertyValue('--main-color');

  static _selectedColor = getComputedStyle(document.documentElement)
      .getPropertyValue('--selected-color');
  static getCalendarOptions() {
    return {
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
          backgroundColor: CalendarHandler._mainColor,
        },
      ],
    };
  }
  constructor() {
    const container = document.getElementById('calendar');
    const options = CalendarHandler.getCalendarOptions();
    this.calendar = new tui.Calendar(container, options);
    this.calendar.on('beforeUpdateEvent', onCalendarEventBeingUpdated);
    this.calendar.on('clickEvent', async (info) => {
      grist.setSelectedRows([info.event.id]);
    });
    this.calendar.on('selectDateTime', onNewDateBeingSelectedOnCalendar);
  }


  selectRecord(record) {
    if (this._selectedRecordId) {
      this.calendar.updateEvent(this._selectedRecordId, 'cal1', {backgroundColor: CalendarHandler._mainColor});
    }
    this.calendar.updateEvent(record.id, 'cal1', {backgroundColor: CalendarHandler._selectedColor});
    this._selectedRecordId = record.id;
    Calendar.setDate(record.startDate);
    var dom = document.querySelector('.toastui-calendar-time');
    const middleHour = record.startDate.getHours()
        + (record.endDate.getHours() - record.startDate.getHours()) / 2;
    dom.scrollTo({top: (dom.clientHeight / 24) * middleHour, behavior: 'smooth'});

  }
}

function getGristOptions() {
  return [
    {
      name: "startDate",
      title: "Start Date",
      optional: false,
      type: "DateTime",
      description: "starting point of event",
      allowMultiple: false
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
}

async function configureGristSettings() {
  const columnsMappingOptions = getGristOptions();

  grist.allowSelectBy();
  grist.onRecords(updateCalendar);
  grist.onRecord(gristSelectedRecordChanged);
  grist.onOptions(onGristSettingsChanged);
  grist.ready({ requiredAccess: 'read table', columns: columnsMappingOptions });
}

  function gristSelectedRecordChanged(record, mappings) {
    const mappedRecord = grist.mapColumnNames(record, mappings);
    if (mappedRecord && this.calendarHandler) {
      this.calendarHandler.selectRecord(mappedRecord);
    }
  }

let onGristSettingsChanged = function(options) {
  if (options?.calendarViewPerspective) {
    Calendar.changeView(options.calendarViewPerspective);
    selectRadioButton(options.calendarViewPerspective);
  }
};

// function configureCalendar() {
//   const container = document.getElementById('calendar');
//   const options = getCalendarOptions()
//   Calendar = new tui.Calendar(container, options);
//   Calendar.on('beforeUpdateEvent', onCalendarEventBeingUpdated);
//   Calendar.on('clickEvent', async (info) => {
//     grist.setSelectedRows([info.event.id]);
//   });
//   Calendar.on('selectDateTime', onNewDateBeingSelectedOnCalendar);
//   return Calendar;
// }

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

function selectRadioButton(value) {
  for (const element of document.getElementsByName('calendar-options')) {
    if (element.value === value) {
      element.checked = true;
    }
  }
}

function calendarPrevious() {
  Calendar.prev();
}

function calendarNext() {
  Calendar.next();
}

function calendarToday() {
  Calendar.today();
}

let previousIds = new Set();
function updateCalendar(records, mappings) {
  const mappedRecords = grist.mapColumnNames(records, mappings);

  if (mappedRecords) {
    const currentIds = new Set();
    for (const record of mappedRecords) {
      const event = Calendar.getEvent(record.id, 'cal1');
      const eventData = {
        id: record.id,
        calendarId: 'cal1',
        title: record.title,
        start: record.startDate,
        end: record.endDate,
        isAllday: record.isAllDay,
        category: 'time',
        state: 'Free',
      };

      if (!event) {
        Calendar.createEvents([eventData]);
      } else {
        Calendar.updateEvent(record.id, 'cal1', eventData);
      }
      currentIds.add(record.id);
    }

    for (const id of previousIds) {
      if (!currentIds.has(id)) {
        Calendar.deleteEvent(id, 'cal1');
      }
    }
    previousIds = currentIds;
  }
}
