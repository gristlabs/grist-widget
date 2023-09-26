// let's assume that it's imported in an html file
var grist;

// to keep all calendar related logic;
let calendarHandler;
const CALENDAR_NAME = 'standardCalendar';

//for tests
let dataVersion = Date.now();
function testGetDataVersion(){
  return dataVersion;
}

//registering code to run when a document is ready
function ready(fn) {
  if (document.readyState !== 'loading') {
    fn();
  } else {
    document.addEventListener('DOMContentLoaded', fn);
  }
}

function isRecordValid(record) {
  return record.startDate instanceof Date &&
  record.endDate instanceof Date &&
  typeof record.title === 'string'
}

function getMonthName() {
  return calendarHandler.calendar.getDate().toDate().toLocaleString('en-us', { month: 'long', year: 'numeric' })
}

class CalendarHandler {
  //TODO: find a theme value with that color
  _mainColor = () => '#70707D'//'var(--grist-theme-date-picker-selected-bg-hover)'; //this._gristTheme?.colors['table-add-new-bg'];
  _calendarBackgroundColor = () => 'var(--grist-theme-page-panels-main-panel-bg)';
  _selectedColor = ()=> this._gristTheme?.colors['top-bar-button-primary-fg'];
  _borderStyle = () => `1px solid ${this._gristTheme?.colors['table-body-border']}`;
  _accentColor = () => 'var(--grist-theme-accent-text)'
  _textColor = () => this._gristTheme?.colors['text'];
  _selectionColor = () => 'var(--grist-theme-selection)'
  _calendarTheme = () => {return {
    common: {
      backgroundColor: this._calendarBackgroundColor(),
      border: this._borderStyle(),
      holiday: {color: this._accentColor()},
      gridSelection: {
        backgroundColor: this._selectionColor(),
        border: `1px solid ${this._selectionColor()}`
      },
    },
    week:{
      timeGrid:{
        borderRight: this._borderStyle(),
      },
      timeGridHourLine:{
        borderBottom: this._borderStyle()
      },
      gridSelection: this._accentColor(),

      pastTime:{
        color: this._textColor(),
      },
      futureTime:{
        color: this._textColor(),
      }
    }}
  }

  _getCalendarOptions() {
    return {
      week: {
        taskView: false,
      },
      month: {},
      usageStatistics: false,
      theme: this._calendarTheme(),
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
          id:  CALENDAR_NAME,
          name: 'Personal',
          backgroundColor: this._mainColor(),
          color: this._textColor(),
          borderColor: this._mainColor(),
        },
      ],
    };
  }

  constructor() {
    const container = document.getElementById('calendar');
    const options = this._getCalendarOptions();
    this.previousIds = new Set();
    this.calendar = new tui.Calendar(container, options);
    this.calendar.on('beforeUpdateEvent', onCalendarEventBeingUpdated);
    this.calendar.on('clickEvent', async (info) => {
      await grist.setSelectedRows([info.event.id]);
    });
    this.calendar.on('selectDateTime', async (info)=> {
      await onNewDateBeingSelectedOnCalendar(info);
      this.calendar.clearGridSelections();
    });
  }

  // navigate to the selected date in the calendar and scroll to the time period of the event
  selectRecord(record) {
    if (isRecordValid(record)) {
      if (this._selectedRecordId) {
        this.calendar.updateEvent(this._selectedRecordId, CALENDAR_NAME, {borderColor: this._mainColor()});
      }
      this.calendar.updateEvent(record.id, CALENDAR_NAME, {borderColor: this._selectedColor()});
      this._selectedRecordId = record.id;
      this.calendar.setDate(record.startDate);
      updateUIAfterNavigation();
      if (this.calendar.getViewName() !== 'month') {
        // Scroll to the middle of the event if it's not month view.
        // In some cases, an event is not visible even if a valid day is focused - for example, when event is in the
        // last hour of the day, so to make it visible, we need to scroll to the middle of the event.
        const dom = document.querySelector('.toastui-calendar-time');
        if(dom) {
          const middleHour = record.startDate.getHours()
            + (record.endDate.getHours() - record.startDate.getHours()) / 2;
          dom.scrollTo({top: (dom.clientHeight / 24) * middleHour, behavior: 'smooth'});
        }
      }
    }
  }

  // change calendar perspective between week, month and day.
  changeView(calendarViewPerspective) {
    this.calendar.changeView(calendarViewPerspective);
    updateUIAfterNavigation();
  }

  // navigate to the previous time period
  calendarPrevious() {
    this.calendar.prev();
    updateUIAfterNavigation();
  }

  // navigate to the next time period
  calendarNext() {
    this.calendar.next();
    updateUIAfterNavigation();
  }

  //navigate to today
  calendarToday() {
    this.calendar.today();
    updateUIAfterNavigation();
  }

  // update calendar events based on the collection of records from the grist table.
  async updateCalendarEvents(calendarEvents) {
    // we need to keep track the ids of the events that are currently in the calendar to compare it
    // with the new set of events when they come.
    const currentIds = new Set();
    for (const record of calendarEvents) {
      // check if an event already exists in the calendar - update it if so, create new otherwise
      const event = this.calendar.getEvent(record.id, CALENDAR_NAME);
      const eventData = record;
      if (!event) {
        this.calendar.createEvents([eventData]);
      } else {
        this.calendar.updateEvent(record.id, CALENDAR_NAME, eventData);
      }
      currentIds.add(record.id);
    }
    // if some events are not in the new set of events, we need to remove them from the calendar
    if (this.previousIds) {
      for (const id of this.previousIds) {
        if (!currentIds.has(id)) {
          this.calendar.deleteEvent(id, CALENDAR_NAME);
        }
      }
    }
    this.previousIds = currentIds;
  }

  setTheme(gristThemeConfiguration) {
    this._gristTheme = gristThemeConfiguration;
    const options = this._getCalendarOptions();
    this.calendar.setTheme(options.theme);
    //this.calendar.setOptions(options);
    this.calendar.setCalendars(options.calendars);
    this.calendar.render();
  }
}

// when a document is ready, register the calendar and subscribe to grist events
ready(async () => {
  calendarHandler = new CalendarHandler();
  await configureGristSettings();

});

// Data for column mapping fields in Widget GUI
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


function updateUIAfterNavigation(){
  // update name of the month and year displayed on the top of the widget
  document.getElementById('calendar-title').innerText = getMonthName();
}
// let's subscribe to all the events that we need
async function configureGristSettings() {
  // table selection should change when another event is selected
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

// when a user selects a record in the table, we want to select it on the calendar
function gristSelectedRecordChanged(record, mappings) {
  const mappedRecord = grist.mapColumnNames(record, mappings);
  if (mappedRecord && calendarHandler) {
    calendarHandler.selectRecord(mappedRecord);
  }
}

// when a user changes the perspective in the GUI, we want to save it as grist option
// - rest of logic is in reaction to the grist option changed
async function calendarViewChanges(radiobutton) {
  await grist.setOption('calendarViewPerspective', radiobutton.value);
}


// When a user changes a perspective of calendar, we want this to be persisted in grist options between sessions.
// this is the place where we can react to this change and update calendar view, or when new session is started
// (so we are loading previous settings)
let onGristSettingsChanged = function(options, settings) {
  let option = options?.calendarViewPerspective ?? 'week';
    calendarHandler.changeView(option);
    selectRadioButton(option);
    calendarHandler.setTheme(settings.theme)
    //calendarHandler.setTheme();
};

// when user moves or resizes event on the calendar, we want to update the record in the table
const onCalendarEventBeingUpdated = async (info) => {
    if (info.changes?.start || info.changes?.end) {
        let gristEvent = {};
        gristEvent.id = info.event.id;
        if(info.changes.start) gristEvent.startDate = roundEpochDateToSeconds(info.changes.start.valueOf());
        if(info.changes.end) gristEvent.endDate = roundEpochDateToSeconds(info.changes.end.valueOf());
        await upsertGristRecord(gristEvent);
      //}
    }
};

// saving events to the table or updating existing one - basing on if ID is present or not in the send event
async function upsertGristRecord(gristEvent){
    //to update the table, grist requires another format that it is returning by grist in onRecords event (it's flat is
    // onRecords event and nested ({id:..., fields:{}}) in grist table), so it needs to be converted
    const mappedRecord = grist.mapColumnNamesBack(gristEvent);
    // we cannot save record is some unexpected columns are defined in fields, so we need to remove them
    delete mappedRecord.id;
    //mapColumnNamesBack is returning undefined for all absent fields, so we need to remove them as well
    const filteredRecord = Object.fromEntries(Object.entries(mappedRecord)
      .filter(([key, value]) => value !== undefined));
    const eventInValidFormat =  { id: gristEvent.id, fields: filteredRecord };
    const table = await grist.getTable();
    if (gristEvent.id) {
        await table.update(eventInValidFormat);
    } else {
        await table.create(eventInValidFormat);
    }
}

// grist expects date in seconds, but the calendar is returning it in milliseconds, so we need to convert it
function roundEpochDateToSeconds(date) {
  return date/1000;
}

// conversion between calendar event object and grist flat format (so the one that is returned in onRecords event
// and can be mapped by grist.mapColumnNamesBack)
function buildGristFlatFormatFromEventObject(tuiEvent) {
  const gristEvent = {
    startDate: roundEpochDateToSeconds(tuiEvent.start?.valueOf()),
    endDate: roundEpochDateToSeconds(tuiEvent.end?.valueOf()),
    isAllDay: tuiEvent.isAllday ? 1 : 0,
    title: tuiEvent.title??"New Event"
  }
  if (tuiEvent.id) { gristEvent.id = tuiEvent.id; }
  return gristEvent;
}

// when user selects new date range on the calendar, we want to create a new record in the table
async function onNewDateBeingSelectedOnCalendar(info) {
  const gristEvent = buildGristFlatFormatFromEventObject(info);
  await upsertGristRecord(gristEvent);
}

//helper function to select radio button in the GUI
function selectRadioButton(value) {
  for (const element of document.getElementsByName('calendar-options')) {
    if (element.value === value) {
      element.checked = true;
      element.parentElement.classList.add('active')
    }
    else{
      element.checked = false;
      element.parentElement.classList.remove('active')
    }
  }
}

// helper function to build a calendar event object from grist flat record
function buildCalendarEventObject(record) {
  return {
    id: record.id,
    calendarId: CALENDAR_NAME,
    title: record.title,
    start: record.startDate,
    end: record.endDate,
    isAllday: record.isAllDay,
    category: 'time',
    state: 'Free',
  };
}

// when some CRUD operation is performed on the table, we want to update the calendar
async function updateCalendar(records, mappings) {
  const mappedRecords = grist.mapColumnNames(records, mappings);
  // if any records were successfully mapped, create or update them in the calendar
  if (mappedRecords) {
    const CalendarEventObjects = mappedRecords.filter(isRecordValid).map(buildCalendarEventObject);
    await calendarHandler.updateCalendarEvents(CalendarEventObjects);
  }
  dataVersion = Date.now();
}

function testGetCalendarEvent(eventId) {
  const calendarObject = calendarHandler.calendar.getEvent(eventId, CALENDAR_NAME);
  if (calendarObject) {
    const eventData = {
      title: calendarObject?.title,
      startDate: calendarObject?.start.d.d,
      endDate: calendarObject?.end.d.d,
      isAllDay: calendarObject?.isAllday ?? false
    };
    return JSON.stringify(eventData);
  } else {
    return null;
  }
}

function testGetCalendarViewName(){
  // noinspection JSUnresolvedReference
  return calendarHandler.calendar.getViewName();
}