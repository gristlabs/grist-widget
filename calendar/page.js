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

function convertEventToGristTableFormat(event) {
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
    this.calendar.on('selectDateTime', (info)=> {
      onNewDateBeingSelectedOnCalendar(info);
      this.calendar.clearGridSelections();
    });
  }

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

  changeView(calendarViewPerspective) {
    this.calendar.changeView(calendarViewPerspective);
  }

  calendarPrevious() {
    this.calendar.prev();
  }

  calendarNext() {
    this.calendar.next();
  }

  calendarToday() {
    this.calendar.today();
  }

  async updateCalendarEvents(calendarEvents) {
    const currentIds = new Set();
    for (const record of calendarEvents) {
      const event = Calendar.getEvent(record.id, 'cal1');
      const eventData = record;

      if (!event) {
        Calendar.createEvents([eventData]);
      } else {
        Calendar.updateEvent(record.id, 'cal1', eventData);
      }
      currentIds.add(record.id);
    }
    for (const id of this.previousIds) {
      if (!currentIds.has(id)) {
        Calendar.deleteEvent(id, 'cal1');
      }
    }
    this.previousIds = currentIds;
    // //const mappedRecords = grist.mapColumnNames(records, mappings);
    // // if any records was successfully mapped, create or update them in the calendar
    // if (calendarEvents && calendarEvents.length) {
    //   const currentIds = new Set();
    //   for (const record of calendarEvents) {
    //     const event = this.calendar.getEvent(record.id, 'cal1');
    //     if (!event) {
    //       await this.calendar.createEvents(record);
    //     } else {
    //       await this.calendar.updateEvent(record.id, 'cal1', record);
    //     }
    //     currentIds.add(record.id);
    //   }
    //   //Checking if there are any events that are not in the grist table anymore, and delete them from the calendar
    //   for (const id of this.calendarEventsIds) {
    //     if (!currentIds.has(id)) {
    //       this.calendar.deleteEvent(id, 'cal1');
    //     }
    //   }
    //   // update the current ids to reflect the new state
    //   this.calendarEventsIds = currentIds;
    // }

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
  grist.onRecords(updateCalendar2);
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
  let option = options?.calendarViewPerspective??'week';
    this.calendarHandler.changeView(option);
    selectRadioButton(option);
};

const onCalendarEventBeingUpdated = async (info) => {
    if (info.changes?.start || info.changes?.end) {
      const record =  await grist.fetchSelectedRecord(info.event.id);
      if (record) {

        const gristEvent = buildGristFlatFormatFromEventObject(info.event)
        if(info.changes.start) gristEvent.startDate = roundEpochDateToSeconds(info.changes.start.valueOf());
        if(info.changes.end) gristEvent.endDate = roundEpochDateToSeconds(info.changes.end.valueOf());
        await upsertGristRecord(gristEvent);
      }
    }
};

async function upsertGristRecord(gristEvent){
    const eventInValidFormat = convertEventToGristTableFormat(gristEvent);
    const table = await grist.getTable();
    if (gristEvent.id) {
        await table.update(eventInValidFormat);
    } else {
        await table.create(eventInValidFormat);
    }
}
function roundEpochDateToSeconds(date) {
  return date/1000;
}
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

const onNewDateBeingSelectedOnCalendar = async (info) => {
  const gristEvent = buildGristFlatFormatFromEventObject(info);
  upsertGristRecord(gristEvent);
}

function selectRadioButton(value) {
  for (const element of document.getElementsByName('calendar-options')) {
    if (element.value === value) {
      element.checked = true;
    }
  }
}


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

async function updateCalendar2(records, mappings) {
  const mappedRecords = grist.mapColumnNames(records, mappings);
  // if any records was successfully mapped, create or update them in the calendar
  if (mappedRecords) {
    const CalendarEventObjects = mappedRecords.map(buildCalendarEventObject);
    await this.calendarHandler.updateCalendarEvents(CalendarEventObjects);
  }
}

let previousIds = new Set();
function updateCalendar(records, mappings) {
  const mappedRecords = grist.mapColumnNames(records, mappings);

  if (mappedRecords) {
    const currentIds = new Set();
    for (const record of mappedRecords.map(buildCalendarEventObject)) {
      const event = Calendar.getEvent(record.id, 'cal1');
      const eventData = record;

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
