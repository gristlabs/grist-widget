// let's assume that it's imported in an html file
var grist;

// to keep all calendar related logic;
let calendarHandler;
const CALENDAR_NAME = 'standardCalendar';

const urlParams = new URLSearchParams(window.location.search);
const isReadOnly = urlParams.get('readonly') === 'true' ||
  (urlParams.has('access') && urlParams.get('access') !== 'full');

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
  const hasStartDate = record.startDate instanceof Date;
  const maybeHasEndDate = record.endDate === undefined ||
    record.endDate === null ||
    record.endDate instanceof Date;
  const hasTitle = typeof record.title === 'string';
  const maybeHasIsAllDay = record.isAllDay === undefined || typeof record.isAllDay === 'boolean';
  return hasStartDate && maybeHasEndDate && hasTitle && maybeHasIsAllDay;
}

function getMonthName() {
  return calendarHandler.calendar.getDate().toDate().toLocaleString('en-us', { month: 'long', year: 'numeric' })
}

class CalendarHandler {
  //TODO: switch to new variables once they are published.
  _mainColor =  'var(--grist-theme-input-readonly-border)';
  _calendarBackgroundColor =  'var(--grist-theme-page-panels-main-panel-bg)';
  _selectedColor = 'var(--grist-theme-top-bar-button-primary-fg)';
  _borderStyle =  '1px solid var(--grist-theme-table-body-border)';
  _accentColor =  'var(--grist-theme-accent-text)';
  _textColor =  'var(--grist-theme-text)';
  _selectionColor =  'var(--grist-theme-selection)';
  _calendarTheme = () => {return {
    common: {
      backgroundColor: this._calendarBackgroundColor,
      border: this._borderStyle,
      holiday: {color: this._textColor},
      gridSelection: {
        backgroundColor: this._selectionColor,
        border: `1px solid ${this._selectionColor}`
      },
      dayName: {
        color: this._textColor,
      },
      today: {
        color: this._textColor,
      },
      saturday:{
        color: this._textColor,
      }
    },
    week:{
      timeGrid:{
        borderRight: this._borderStyle,
      },
      timeGridLeft:{
        borderRight: this._borderStyle,
      },
      panelResizer:{
        border: this._borderStyle,
      },
      dayName:{
        borderBottom: this._borderStyle,
        borderTop: this._borderStyle,
      },
      dayGrid:{
        borderRight: this._borderStyle,
      },
      dayGridLeft:{
        borderRight: this._borderStyle,
      },
      timeGridHourLine:{
        borderBottom: this._borderStyle
      },
      gridSelection: this._accentColor,

      pastTime:{
        color: this._textColor,
      },
      futureTime:{
        color: this._textColor,
      },
      nowIndicatorLabel: {
        color: 'var(--grist-theme-accent-text)',
      },
      nowIndicatorPast: {
        border: '1px dashed var(--grist-theme-accent-border)',
      },
      nowIndicatorBullet: {
        backgroundColor: 'var(--grist-theme-accent-text)',
      },
      nowIndicatorToday: {
        border: '1px solid var(--grist-theme-accent-border)',
      },
      today: {
        color: this._textColor,
        backgroundColor: 'inherit',
      },
    },
    month: {
      dayName:{
        borderLeft: this._borderStyle,
        backgroundColor: 'inherit',
      },
      dayExceptThisMonth: {
        color: this._textColor,
      },
      holidayExceptThisMonth: {
        color: this._textColor,
      },
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
      isReadOnly,
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
          backgroundColor: this._mainColor,
          color: this._textColor,
          borderColor: this._mainColor,
        },
      ],
      useFormPopup: !isReadOnly,
      useDetailPopup: true,
    };
  }

  constructor() {
    const container = document.getElementById('calendar');
    if (isReadOnly) {
      container.classList.add('readonly')
    }
    const options = this._getCalendarOptions();
    this.previousIds = new Set();
    this.calendar = new tui.Calendar(container, options);

    // Not sure how to get a reference to this constructor, so doing it in a roundabout way.
    this.TZDate = this.calendar.getDate().constructor;

    this.calendar.on('clickEvent', async (info) => {
      await grist.setCursorPos({rowId: info.event.id});
    });

    this.calendar.on('selectDateTime', async (info) => {
      this.calendar.clearGridSelections();

      // If this click results in the form popup, focus the title field in it.
      setTimeout(() => container.querySelector('input[name=title]')?.focus(), 0);
    });

    // Creation happens via the event-edit form.
    this.calendar.on('beforeCreateEvent', (eventInfo) => upsertEvent(eventInfo));

    // Updates happen via the form or when dragging the event or its end-time.
    this.calendar.on('beforeUpdateEvent', (update) => upsertEvent({id: update.event.id, ...update.changes}));

    // Deletion happens via the event-edit form.
    this.calendar.on('beforeDeleteEvent', (eventInfo) => deleteEvent(eventInfo));

    container.addEventListener('mousedown', () => {
      focusWidget();
      // Clear existing selection; this follows the suggested workaround in
      // https://github.com/nhn/tui.calendar/issues/1300#issuecomment-1273902472
      this.calendar.clearGridSelections();
    });

    container.addEventListener('mouseup', () => {
      // Fix dragging after a tap, when 'mouseup' follows the 'mousedown' so quickly that ToastUI
      // misses adding a handler, and doesn't stop the drag. If ToastUI handles it, it will stop
      // the drag or switch to a popup open. If on the next tick, the drag is still on, cancel it.
      setTimeout(() => {
        if (this.calendar.getStoreState('dnd').draggingState !== 0) {
          this.calendar.getStoreDispatchers('dnd').cancelDrag();
        }
      }, 0);
    });

    document.addEventListener('keydown', (ev) => {
      if (ev.key === 'Escape') {
        this.calendar.getStoreDispatchers('popup').hideFormPopup();
        this.calendar.getStoreDispatchers('popup').hideDetailPopup();
      } else if (ev.key === 'Enter') {
        // On a view popup, click "Edit"; on the edit popup, click "Save". Just try both to keep
        // it simple, since only one button will be present in practice.
        container.querySelector('button.toastui-calendar-edit-button')?.click();
        container.querySelector('button.toastui-calendar-popup-confirm')?.click();
      }
    });
  }

  _isMultidayInMonthViewEvent(rec)  {
    const startDate = rec.start.toDate();
    const endDate = rec.end.toDate();
    const isItMonthView = this.calendar.getViewName() === 'month';
    const isEventMultiDay = startDate.getDate() !== endDate.getDate() ||
      startDate.getMonth() !== endDate.getMonth() ||
      startDate.getFullYear() !== endDate.getFullYear();
    return isItMonthView &&  !isEventMultiDay
  }

  async selectRecord(record) {
    if (!isRecordValid(record) || this._selectedRecordId === record.id) {
      return;
    }
    if (this._selectedRecordId) {
      this._colorCalendarEvent(this._selectedRecordId, this._mainColor);
    }
    this._selectedRecordId = record.id;
    const [startType] = await colTypesFetcher.getColTypes();
    const startDate = getAdjustedDate(record.startDate, startType);
    this.calendar.setDate(startDate);
    updateUIAfterNavigation();

    // If the view has a vertical timeline, scroll to the start of the event.
    if (!record.isAllday && this.calendar.getViewName() !== 'month') {
      setTimeout(() => {
        const event = this.calendar.getElement(record.id, CALENDAR_NAME);
        if (!event) { return; }
  
        // Only scroll into view if the event is not fully on-screen.
        const container = event.closest('.toastui-calendar-time');
        const containerTop = container.scrollTop;
        const containerBottom = containerTop + container.clientHeight;
        const eventTop = event.offsetTop;
        const eventBottom = eventTop + event.clientHeight;
        const isOnscreen = eventTop >= containerTop && eventBottom <= containerBottom;
        if (!isOnscreen) {
          event.scrollIntoView({behavior: 'smooth'});
        }
      }, 0);
    }
  }

  _colorCalendarEvent(eventId, color) {
    const event = this.calendar.getEvent(eventId, CALENDAR_NAME);
    const shouldPaintBackground = this._isMultidayInMonthViewEvent(event);
    this.calendar.updateEvent(eventId, CALENDAR_NAME, {borderColor: color, backgroundColor: shouldPaintBackground?color:this._mainColor});
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

  refreshSelectedRecord(){
    if (this._selectedRecordId) {
      this._colorCalendarEvent(this._selectedRecordId, this._selectedColor);
    }
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
      type: "Date,DateTime",
      description: "starting point of event",
      allowMultiple: false
    },
    {
      name: "endDate",
      title: "End Date",
      optional: true,
      type: "Date,DateTime",
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
  // refresh colors of selected event (in month view it's different from in other views)
  calendarHandler.refreshSelectedRecord();
}
// let's subscribe to all the events that we need
async function configureGristSettings() {
  // CRUD operations on records in table
  grist.onRecords(updateCalendar);
  // When cursor (selected record) change in the table
  grist.onRecord(gristSelectedRecordChanged);
  // When options changed in the widget configuration (reaction to perspective change)
  grist.onOptions(onGristSettingsChanged);

  // To get types, we need to know the tableId. This is a way to get it.
  grist.on('message', (e) => {
    if (e.tableId && e.mappingsChange) { colTypesFetcher.gotNewMappings(e.tableId); }
  });

  // TODO: remove optional chaining once grist-plugin-api.js includes this function.
  grist.enableKeyboardShortcuts?.();

  // bind columns mapping options to the GUI
  const columnsMappingOptions = getGristOptions();
  grist.ready({ requiredAccess: 'full', columns: columnsMappingOptions, allowSelectBy: true });
}

// When a user selects a record in the table, we want to select it on the calendar.
async function gristSelectedRecordChanged(record, mappings) {
  const mappedRecord = grist.mapColumnNames(record, mappings);
  if (mappedRecord && calendarHandler) {
    await calendarHandler.selectRecord(mappedRecord);
  }
}

// when a user changes the perspective in the GUI, we want to save it as grist option
// - rest of logic is in reaction to the grist option changed
async function calendarViewChanges(radiobutton) {
  changeCalendarView(radiobutton.value);
  if (!isReadOnly) {
    await grist.setOption('calendarViewPerspective', radiobutton.value);
  }
}

// When a user changes a perspective of calendar, we want this to be persisted in grist options between sessions.
// this is the place where we can react to this change and update calendar view, or when new session is started
// (so we are loading previous settings)
let onGristSettingsChanged = function(options, settings) {
  const view = options?.calendarViewPerspective ?? 'week';
  changeCalendarView(view);
  colTypesFetcher.setAccessLevel(settings.accessLevel);
  calendarHandler.setTheme(settings.theme);
};

function changeCalendarView(view) {
  selectRadioButton(view);
  calendarHandler.changeView(view);
}

// saving events to the table or updating existing one - basing on if ID is present or not in the send event
async function upsertGristRecord(gristEvent) {
  try {
    //to update the table, grist requires another format that it is returning by grist in onRecords event (it's flat is
    // onRecords event and nested ({id:..., fields:{}}) in grist table), so it needs to be converted
    const mappedRecord = grist.mapColumnNamesBack(gristEvent);
    if (!mappedRecord) { return; }

    // we cannot save record is some unexpected columns are defined in fields, so we need to remove them
    delete mappedRecord.id;
    // mapColumnNamesBack returns undefined for all absent fields, so we need to remove them as well
    // (we also use undefined for updates when a field hasn't changed).
    const filteredRecord = Object.fromEntries(Object.entries(mappedRecord)
      .filter(([key, value]) => value !== undefined));

    // Send nothing if there are no changes.
    if (Object.keys(filteredRecord).length === 0) { return; }

    const eventInValidFormat =  { id: gristEvent.id, fields: filteredRecord };
    const table = await grist.getTable();
    if (gristEvent.id) {
      await table.update(eventInValidFormat);
    } else {
      const {id} = await table.create(eventInValidFormat);
      await grist.setCursorPos({rowId: id});
    }
  } catch (err) {
    // Nothing clever we can do here, just log the error.
    // Grist should actually show the error in the UI, but it doesn't.
    console.error(err);
  }
}

const secondsPerDay = 24 * 60 * 60;

function makeGristDateTime(tzDate, colType) {
  if (colType === 'Date') {
    // Reinterpret the time as UTC. Note: timezone offset is in minutes.
    const secondsSinceEpoch = tzDate.valueOf() / 1000 - tzDate.getTimezoneOffset() * 60;
    // Round down to UTC midnight.
    return Math.floor(secondsSinceEpoch / secondsPerDay) * secondsPerDay;
  } else {
    return tzDate.valueOf() / 1000;
  }
}

async function upsertEvent(tuiEvent) {
  // conversion between calendar event object and grist flat format (so the one that is returned in onRecords event
  // and can be mapped by grist.mapColumnNamesBack)
  // tuiEvent can be partial: only the fields present will be updated in Grist.
  const [startType, endType] = await colTypesFetcher.getColTypes();
  const gristEvent = {
    id: tuiEvent.id,
    // undefined values will be removed from the fields sent to Grist.
    startDate: tuiEvent.start ? makeGristDateTime(tuiEvent.start, startType) : undefined,
    endDate: tuiEvent.end ? makeGristDateTime(tuiEvent.end, endType) : undefined,
    isAllDay: tuiEvent.isAllday !== undefined ? (tuiEvent.isAllday ? 1 : 0) : undefined,
    title: tuiEvent.title !== undefined ? (tuiEvent.title || "New Event") : undefined,
  }
  upsertGristRecord(gristEvent);
}

async function deleteEvent(event) {
  try {
    const table = await grist.getTable();
    await table.destroy(event.id);
  } catch (e) {
    console.error(e);
  }
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

/**
 * Returns a new date that's shifted towards UTC+0 if `colType` is `Date`.
 * 
 * Returns `date` unchanged if `colType` is `DateTime`.
 */
function getAdjustedDate(date, colType) {
  if (colType !== 'Date') { return date; }

  // Like date.tz('UTC'), but accounts for DST differences.
  const ms = date.valueOf() + (date.getTimezoneOffset() * 60000);
  return new Date(ms);
}

// helper function to build a calendar event object from grist flat record
function buildCalendarEventObject(record, colTypes) {
  let {startDate: start, endDate: end, isAllDay: isAllday} = record;
  let [startType, endType] = colTypes;
  endType = endType || startType;
  start = getAdjustedDate(start, startType);
  end = end ? getAdjustedDate(end, endType) : start

  // Normalize records with invalid start/end times so that they're visible
  // in the calendar.
  if (end < start) { end = start; }

  if (startType === 'Date' && endType === 'Date') {
    isAllday = true;
  }
  // Workaround for midnight zero-length events not showing up.
  if (!isAllday && end.valueOf() === start.valueOf() && isZeroTime(end) && isZeroTime(start)) {
    end = new calendarHandler.TZDate(end).addHours(1);
  }
  return {
    id: record.id,
    calendarId: CALENDAR_NAME,
    title: record.title,
    start,
    end,
    isAllday,
    category: 'time',
    state: 'Free',
  };
}

// when some CRUD operation is performed on the table, we want to update the calendar
async function updateCalendar(records, mappings) {
  if (mappings) { colTypesFetcher.gotMappings(mappings); }

  const mappedRecords = grist.mapColumnNames(records, mappings);
  // if any records were successfully mapped, create or update them in the calendar
  if (mappedRecords) {
    const colTypes = await colTypesFetcher.getColTypes();
    const CalendarEventObjects = mappedRecords.filter(isRecordValid).map(r => buildCalendarEventObject(r, colTypes));
    await calendarHandler.updateCalendarEvents(CalendarEventObjects);
  }
  dataVersion = Date.now();
}

function focusWidget() {
  window.focus();
}

function isZeroTime(date) {
  return date.getHours() === 0 && date.getMinutes() === 0 && date.getSeconds() === 0;
}

// We have no good way yet to get the type of a mapped column when multiple types are allowed. We
// get it via the metadata tables instead. There is no good way to know when a column's type is
// changed, so we skip that for now.
// TODO: Drop all this once the API can tell us column info.
class ColTypesFetcher {
  // Returns array of types for the array of colIds.
  static async getTypes(tableId, colIds) {
    const tables = await grist.docApi.fetchTable('_grist_Tables');
    const columns = await grist.docApi.fetchTable('_grist_Tables_column');
    const tableRef = tables.id[tables.tableId.indexOf(tableId)];
    return colIds.map(colId => {
      const index = columns.id.findIndex((id, i) => (columns.parentId[i] === tableRef && columns.colId[i] === colId));
      return columns.type[index];
    });
  }

  constructor() {
    this._tableId = null;
    this._colIds = null;
    this._colTypesPromise = Promise.resolve([null, null]);;
    this._accessLevel = 'full';
  }
  setAccessLevel(accessLevel) {
    this._accessLevel = accessLevel;
  }
  gotMappings(mappings) {
    // Can't fetch metadata when no full access.
    if (this._accessLevel !== 'full') { return; }
    if (!this._colIds || !(mappings.startDate === this._colIds[0] && mappings.endDate === this._colIds[1])) {
      this._colIds = [mappings.startDate, mappings.endDate];
      if (this._tableId) {
        this._colTypesPromise = ColTypesFetcher.getTypes(this._tableId, this._colIds);
      }
    }
  }
  gotNewMappings(tableId) {
    // Can't fetch metadata when no full access.
    if (this._accessLevel !== 'full') { return; }
    this._tableId = tableId;
    if (this._colIds) {
      this._colTypesPromise = ColTypesFetcher.getTypes(this._tableId, this._colIds);
    }
  }
  async getColTypes() {
    return this._colTypesPromise;
  }
}

const colTypesFetcher = new ColTypesFetcher();

function testGetCalendarEvent(eventId) {
  const calendarObject = calendarHandler.calendar.getEvent(eventId, CALENDAR_NAME);
  if (calendarObject) {
    const eventData = {
      title: calendarObject?.title,
      startDate: calendarObject?.start.d.d,
      endDate: calendarObject?.end.d.d,
      isAllDay: calendarObject?.isAllday ?? false,
      selected: calendarObject?.borderColor === calendarHandler._selectedColor
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
