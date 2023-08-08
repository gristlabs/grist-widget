// lets assume that it's imported in a html file
var grist;

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
      await grist.setSelectedRows([info.event.id]);
    });
    this.calendar.on('selectDateTime', (info)=> {
      onNewDateBeingSelectedOnCalendar(info);
      this.calendar.clearGridSelections();
    });
  }

  // navigate to the selected date in the calendar and scroll to the time period of the event
  selectRecord(record) {
    if (this._selectedRecordId) {
      this.calendar.updateEvent(this._selectedRecordId, 'cal1', {backgroundColor: CalendarHandler._mainColor});
    }
    this.calendar.updateEvent(record.id, 'cal1', {backgroundColor: CalendarHandler._selectedColor});
    this._selectedRecordId = record.id;
    this.calendar.setDate(record.startDate);
    var dom = document.querySelector('.toastui-calendar-time');
    const middleHour = record.startDate.getHours()
        + (record.endDate.getHours() - record.startDate.getHours()) / 2;
    dom.scrollTo({top: (dom.clientHeight / 24) * middleHour, behavior: 'smooth'});

  }

  // change calendar perspective between week, month and day.
  changeView(calendarViewPerspective) {
    this.calendar.changeView(calendarViewPerspective);
  }

  // navigate to the previous time period
  calendarPrevious() {
    this.calendar.prev();
  }

  // navigate to the next time period
  calendarNext() {
    this.calendar.next();
  }

  //navigate to today
  calendarToday() {
    this.calendar.today();
  }

  // update calendar events based on the collection of records from the grist table.
  async updateCalendarEvents(calendarEvents) {
    // we need to keep track of the ids of the events that are currently in the calendar to compare it
    // with the new set of events when they come.
    const currentIds = new Set();

    for (const record of calendarEvents) {
      //chek if event already exist in the calendar - update it if so, create new otherwise
      const event = this.calendar.getEvent(record.id, 'cal1');
      const eventData = record;
      if (!event) {
        this.calendar.createEvents([eventData]);
      } else {
        this.calendar.updateEvent(record.id, 'cal1', eventData);
      }
      currentIds.add(record.id);
    }
    // if some events are not in the new set of events, we need to remove them from the calendar
    if(this.previousIds) {
      for (const id of this.previousIds) {
        if (!currentIds.has(id)) {
          this.calendar.deleteEvent(id, 'cal1');
        }
      }
    }
    this.previousIds = currentIds;
  }
}

// when document is ready, register calendar and subscribe to grist events
document.addEventListener('DOMContentLoaded', ()=> {
  this.calendarHandler = new CalendarHandler();
  configureGristSettings();
});

//to update the table, grist require other format that it is returning in onRecords event (it's flat there),
// so it need to be converted
function convertEventToGristTableFormat(event) {
  const mappedRecord = grist.mapColumnNamesBack(event);
  // we cannot save record is some unexpected columns are defined in fields, so we need to remove them
  delete mappedRecord.id;
  return { id: event.id, fields: mappedRecord };
}

// Data for column mapping fileds in Widget GUI
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

// let subscribe all the events that we need
async function configureGristSettings() {
  // table selection should change when other event is selected
  grist.allowSelectBy();
  // CRUD operations on records in table
  grist.onRecords(updateCalendar);
  // When cursor (selected record) change in the table
  grist.onRecord(gristSelectedRecordChanged);
  // When options changed in the widget configuration (reaction to perspective change)
  grist.onOptions(onGristSettingsChanged);

  // bind columns mapping options to the GUI
  const columnsMappingOptions = getGristOptions();
  grist.ready({ requiredAccess: 'read table', columns: columnsMappingOptions });
}

// when user select record in the table, we want to select it on the calendar
  function gristSelectedRecordChanged(record, mappings) {
    const mappedRecord = grist.mapColumnNames(record, mappings);
    if (mappedRecord && this.calendarHandler) {
      this.calendarHandler.selectRecord(mappedRecord);
    }
}

// when user change the perspective in the GUI, we want to save it as grist option
// - rest of logic is in reaction to grist option changed
async function calendarViewChanges(radiobutton) {
  await grist.setOption('calendarViewPerspective', radiobutton.value);
}


// when user change a perspective of calendar we want this to be persisted in grist options between sessions.
// This is the place where we can react to this change and update calendar view, or when new session is started
// (so we are loading previous settings)
let onGristSettingsChanged = function(options) {
  let option = options?.calendarViewPerspective??'week';
    this.calendarHandler.changeView(option);
    selectRadioButton(option);
};

// when user move or resize event on the calendar, we want to update the record in the table
const onCalendarEventBeingUpdated = async (info) => {
    if (info.changes?.start || info.changes?.end) {
      const record =  await grist.fetchSelectedRecord(info.event.id);
      if (record) {
        // get all the record data from the event, and update only start and end date
        const gristEvent = buildGristFlatFormatFromEventObject(info.event)
        if(info.changes.start) gristEvent.startDate = roundEpochDateToSeconds(info.changes.start.valueOf());
        if(info.changes.end) gristEvent.endDate = roundEpochDateToSeconds(info.changes.end.valueOf());
        await upsertGristRecord(gristEvent);
      }
    }
};

// saving events to the table or updating existing one - basing on if ID is present or not in the send event
async function upsertGristRecord(gristEvent){
    const eventInValidFormat = convertEventToGristTableFormat(gristEvent);
    const table = await grist.getTable();
    if (gristEvent.id) {
        await table.update(eventInValidFormat);
    } else {
        await table.create(eventInValidFormat);
    }
}

// grist expect date in seconds, but calendar is returning it in miliseconds, so we need to convert it
function roundEpochDateToSeconds(date) {
  return date/1000;
}

// conversion between calendar event object and grist flat format (so the one that is returned in onRecords event
// and can be mapped by grist.mapColumnNamesBack)
function buildGristFlatFormatFromEventObject(TUIEvent) {
  const gristEvent = {
    startDate: roundEpochDateToSeconds(TUIEvent.start?.valueOf()),
    endDate: roundEpochDateToSeconds(TUIEvent.end?.valueOf()),
    isAllDay: TUIEvent.isAllday ? 1 : 0,
    title: TUIEvent.title??"New Event"
  }
  if(TUIEvent.id) gristEvent.id = TUIEvent.id;
  return gristEvent;
}

// when user select new date range on the calendar, we want to create new record in the table
const onNewDateBeingSelectedOnCalendar = async (info) => {
  const gristEvent = buildGristFlatFormatFromEventObject(info);
  upsertGristRecord(gristEvent);
}

//helper function to select radio button in the GUI
function selectRadioButton(value) {
  for (const element of document.getElementsByName('calendar-options')) {
    if (element.value === value) {
      element.checked = true;
    }
  }
}

// helper function to build calendar event object from grist flat record
function buildCalendarEventObject(record) {
  return {
    id: record.id,
    calendarId: 'cal1',
    title: record.title,
    start: record.startDate,
    end: record.endDate,
    isAllday: record.isAllDay,
    category: 'time',
    state: 'Free',
  };
}

// when some CRUD operation is performed on the table, we want to update calendar
async function updateCalendar(records, mappings) {
  const mappedRecords = grist.mapColumnNames(records, mappings);
  // if any records was successfully mapped, create or update them in the calendar
  if (mappedRecords) {
    const CalendarEventObjects = mappedRecords.map(buildCalendarEventObject);
    await this.calendarHandler.updateCalendarEvents(CalendarEventObjects);
  }
}
