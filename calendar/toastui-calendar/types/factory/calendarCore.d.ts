import type { ComponentChild } from 'preact';
import type { DeepPartial } from 'ts-essentials';
import EventModel from "../model/eventModel";
import TZDate from "../time/date";
import type { EventBus } from "../utils/eventBus";
import type { ExternalEventTypes, InternalEventTypes, ScrollBehaviorOptions } from "../types/eventBus";
import type { DateType, EventObject } from "../types/events";
import type { CalendarColor, CalendarInfo, Options, ViewType } from "../types/options";
import type { CalendarState, CalendarStore, Dispatchers, InternalStoreAPI } from "../types/store";
import type { ThemeState, ThemeStore } from "../types/theme";
/**
 * {@link https://nhn.github.io/tui.code-snippet/latest/CustomEvents CustomEvents} document at {@link https://github.com/nhn/tui.code-snippet tui-code-snippet}
 * @typedef {CustomEvents} CustomEvents
 */
/**
 * Define Calendars to group events.
 *
 * @typedef {object} CalendarInfo
 * @property {string} id - Calendar id.
 * @property {string} name - Calendar name.
 * @property {string} color - Text color of events.
 * @property {string} borderColor - Left border color of events.
 * @property {string} backgroundColor - Background color of events.
 * @property {string} dragBackgroundColor - Background color of events during dragging.
 */
/**
 * Timezone options of the calendar instance.
 *
 * For more information, see {@link https://github.com/nhn/tui.calendar/blob/main/docs/en/apis/options.md#timezone|Timezone options} in guide.
 *
 * @typedef {object} TimezoneOptions
 * @example
 * const calendar = new Calendar('#container', {
 *   timezone: {
 *     // @property {string} zones[].timezoneName - Timezone name. it should be one of IANA timezone names.
 *     // @property {string} [zones[].displayLabel] - Display label of timezone.
 *     // @property {string} [zones[].tooltip] - Tooltip of the element of the display label.
 *     zones: [
 *       {
 *         timezoneName: 'Asia/Seoul',
 *         displayLabel: 'UTC+9:00',
 *         tooltip: 'Seoul'
 *       },
 *       {
 *         timezoneName: 'Europe/London',
 *         displayLabel: 'UTC+1:00',
 *         tooltip: 'BST'
 *       }
 *     ],
 *     // This function will be called for rendering components for each timezone.
 *     // You don't have to use it if you're able to `Intl.DateTimeFormat` API with `timeZone` option.
 *     // this function should return timezone offset from UTC.
 *     // for instance, using moment-timezone:
 *     customOffsetCalculator: (timezoneName, timestamp) => {
 *       return moment.tz(timezoneName).utcOffset(timestamp);
 *     }
 *   }
 * });
 * @property {Array.<object>} zones - Timezone data.
 * @property {string} zones[].timezoneName - Timezone name. it should be one of IANA timezone names.
 * @property {string} [zones[].displayLabel] - Display label of timezone.
 * @property {string} [zones[].tooltip] - Tooltip of the element of the display label.
 * @property {function} customOffsetCalculator - Custom offset calculator when you're not able to leverage `Intl.DateTimeFormat` API.
 */
/**
 * Object to create/modify events.
 * @typedef {object} EventObject
 * @property {string} [id] - Event id.
 * @property {string} [calendarId] - Calendar id.
 * @property {string} [title] - Event title.
 * @property {string} [body] - Body content of the event.
 * @property {string} [isAllday] - Whether the event is all day or not.
 * @property {string|number|Date|TZDate} [start] - Start time of the event.
 * @property {string|number|Date|TZDate} [end] - End time of the event.
 * @property {number} [goingDuration] - Travel time which is taken to go in minutes.
 * @property {number} [comingDuration] - Travel time which is taken to come back in minutes.
 * @property {string} [location] - Location of the event.
 * @property {Array.<string>} [attendees] - Attendees of the event.
 * @property {string} [category] - Category of the event. Available categories are 'milestone', 'task', 'time' and 'allday'.
 * @property {string} [dueDateClass] - Classification of work events. (before work, before lunch, before work)
 * @property {string} [recurrenceRule] - Recurrence rule of the event.
 * @property {string} [state] - State of the event. Available states are 'Busy', 'Free'.
 * @property {boolean} [isVisible] - Whether the event is visible or not.
 * @property {boolean} [isPending] - Whether the event is pending or not.
 * @property {boolean} [isFocused] - Whether the event is focused or not.
 * @property {boolean} [isReadOnly] - Whether the event is read only or not.
 * @property {boolean} [isPrivate] - Whether the event is private or not.
 * @property {string} [color] - Text color of the event.
 * @property {string} [backgroundColor] - Background color of the event.
 * @property {string} [dragBackgroundColor] - Background color of the event during dragging.
 * @property {string} [borderColor] - Left border color of the event.
 * @property {object} [customStyle] - Custom style of the event. The key of CSS property should be camelCase (e.g. {'fontSize': '12px'})
 * @property {*} [raw] - Raw data of the event. it's an arbitrary property for anything.
 */
/**
 * CalendarCore class
 *
 * @class CalendarCore
 * @mixes CustomEvents
 * @param {string|Element} container - container element or selector.
 * @param {object} options - calendar options. For more information, see {@link https://github.com/nhn/tui.calendar/blob/main/docs/en/apis/calendar.md|Calendar options} in guide.
 *   @param {string} [options.defaultView="week"] - Initial view type. Available values are: 'day', 'week', 'month'.
 *   @param {boolean} [options.useFormPopup=false] - Whether to use the default form popup when creating/modifying events.
 *   @param {boolean} [options.useDetailPopup=false] - Whether to use the default detail popup when clicking events.
 *   @param {boolean} [options.isReadOnly=false] - Whether the calendar is read-only.
 *   @param {boolean} [options.usageStatistics=true] - Whether to allow collect hostname and send the information to google analytics.
 *                                              For more information, check out the {@link https://github.com/nhn/tui.calendar/blob/main/apps/calendar/README.md#collect-statistics-on-the-use-of-open-source|documentation}.
 *   @param {function} [options.eventFilter] - A function that returns true if the event should be displayed. The default filter checks if the event's `isVisible` property is true.
 *   @param {object} [options.week] - Week option of the calendar instance.
 *     @param {number} [options.week.startDayOfWeek=0] - Start day of the week. Available values are 0 (Sunday) to 6 (Saturday).
 *     @param {Array.<string>} [options.week.dayNames] - Names of days of the week. Should be 7 items starting from Sunday to Saturday. If not specified, the default names are used.
 *                                               Default values are ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].
 *     @param {boolean} [options.week.workweek=false] - Whether to exclude Saturday and Sunday.
 *     @param {boolean} [options.week.showTimezoneCollapseButton=true] - Whether to show the timezone collapse button.
 *     @param {boolean} [options.week.timezonesCollapsed=false] - Whether to collapse the timezones.
 *     @param {number} [options.week.hourStart=0] - Start hour of the day. Available values are 0 to 24.
 *     @param {number} [options.week.hourEnd=24] - End hour of the day. Available values are 0 to 24. Must be greater than `hourStart`.
 *     @param {boolean} [options.week.narrowWeekend=false] - Whether to narrow down width of weekends to half.
 *     @param {boolean|Array.<string>} [options.week.eventView=true] - Determine which view to display events. Available values are 'allday' and 'time'. set to `false` to disable event view.
 *     @param {boolean|Array.<string>} [options.week.taskView=true] - Determine which view to display tasks. Available values are 'milestone' and 'task'. set to `false` to disable task view.
 *     @param {boolean|object} [options.week.collapseDuplicateEvents=false] - Whether to collapse duplicate events. If you want to filter duplicate events and choose the main event based on your requirements, set `getDuplicateEvents` and `getMainEvent`. For more information, see {@link https://github.com/nhn/tui.calendar/blob/main/docs/en/apis/options.md#weekcollapseduplicateevents|Options} in guide.
 *   @param {object} options.month - Month option of the calendar instance.
 *     @param {number} [options.month.startDayOfWeek=0] - Start day of the week. Available values are 0 (Sunday) to 6 (Saturday).
 *     @param {Array.<string>} [options.month.dayNames] - Names of days of the week. Should be 7 items starting from Sunday to Saturday. If not specified, the default names are used.
 *                                                Default values are ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].
 *     @param {boolean} [options.month.workweek=false] - Whether to exclude Saturday and Sunday.
 *     @param {boolean} [options.month.narrowWeekend=false] - Whether to narrow down width of weekends to half.
 *     @param {number} [options.month.visibleWeeksCount=0] - Number of weeks to display. 0 means display all weeks.
 *   @param {Array.<CalendarInfo>} [options.calendars] - Calendars to group events.
 *   @param {boolean|object} [options.gridSelection=true] - Whether to enable grid selection. or it's option. it's enabled when the value is `true` and object and will be disabled when `isReadOnly` is true.
 *     @param {boolean} options.gridSelection.enableDbClick - Whether to enable double click to select area.
 *     @param {boolean} options.gridSelection.enableClick - Whether to enable click to select area.
 *   @param {TimezoneOptions} options.timezone - Timezone option of the calendar instance. For more information about timezone, check out the {@link https://github.com/nhn/tui.calendar/blob/main/docs/en/apis/options.md|Options} in guide.
 *   @param {Theme} options.theme - Theme option of the calendar instance. For more information, see {@link https://github.com/nhn/tui.calendar/blob/main/docs/en/apis/theme.md|Theme} in guide.
 *   @param {TemplateConfig} options.template - Template option of the calendar instance. For more information, see {@link https://github.com/nhn/tui.calendar/blob/main/docs/en/apis/template.md|Template} in guide.
 */
export default abstract class CalendarCore implements EventBus<ExternalEventTypes & InternalEventTypes> {
    protected container: Element | null;
    /**
     * start and end date of weekly, monthly
     * @private
     */
    protected renderRange: {
        start: TZDate;
        end: TZDate;
    };
    protected eventBus: EventBus<ExternalEventTypes & InternalEventTypes>;
    protected theme: InternalStoreAPI<ThemeStore>;
    protected store: InternalStoreAPI<CalendarStore>;
    constructor(container: string | Element, options?: Options);
    protected abstract getComponent(): ComponentChild;
    protected getStoreState(): CalendarState;
    protected getStoreState<Group extends keyof CalendarState>(group: Group): CalendarState[Group];
    protected getStoreDispatchers(): Dispatchers;
    protected getStoreDispatchers<Group extends keyof Dispatchers>(group: Group): Dispatchers[Group];
    /**
     * Destroys the instance.
     */
    destroy(): void;
    private calculateMonthRenderDate;
    private calculateWeekRenderDate;
    private calculateDayRenderDate;
    /**
     * Move the rendered date to the next/prev range.
     *
     * The range of movement differs depending on the current view, Basically:
     *   - In month view, it moves to the next/prev month.
     *   - In week view, it moves to the next/prev week.
     *   - In day view, it moves to the next/prev day.
     *
     * Also, the range depends on the options like how many visible weeks/months should be rendered.
     *
     * @param {number} offset The offset to move by.
     *
     * @example
     * // Move to the next month in month view.
     * calendar.move(1);
     *
     * // Move to the next year in month view.
     * calendar.move(12);
     *
     * // Move to yesterday in day view.
     * calendar.move(-1);
     */
    move(offset: number): void;
    /**********
     * CRUD Methods
     **********/
    /**
     * Create events and render calendar.
     * @param {Array.<EventObject>} events - list of {@link EventObject}
     * @example
     * calendar.createEvents([
     *   {
     *     id: '1',
     *     calendarId: '1',
     *     title: 'my event',
     *     category: 'time',
     *     dueDateClass: '',
     *     start: '2018-01-18T22:30:00+09:00',
     *     end: '2018-01-19T02:30:00+09:00',
     *   },
     *   {
     *     id: '2',
     *     calendarId: '1',
     *     title: 'second event',
     *     category: 'time',
     *     dueDateClass: '',
     *     start: '2018-01-18T17:30:00+09:00',
     *     end: '2018-01-19T17:31:00+09:00',
     *   },
     * ]);
     */
    createEvents(events: EventObject[]): void;
    protected getEventModel(eventId: string, calendarId: string): EventModel | null;
    /**
     * Get an {@link EventObject} with event's id and calendar's id.
     *
     * @param {string} eventId - event's id
     * @param {string} calendarId - calendar's id of the event
     * @returns {EventObject|null} event. If the event can't be found, it returns null.
     *
     * @example
     * const event = calendar.getEvent(eventId, calendarId);
     *
     * console.log(event.title);
     */
    getEvent(eventId: string, calendarId: string): import("../types/events").EventObjectWithDefaultValues | null;
    /**
     * Update an event.
     *
     * @param {string} eventId - ID of an event to update
     * @param {string} calendarId - The calendarId of the event to update
     * @param {EventObject} changes - The new {@link EventObject} data to apply to the event
     *
     * @example
     * calendar.on('beforeUpdateEvent', function ({ event, changes }) {
     *   const { id, calendarId } = event;
     *
     *   calendar.updateEvent(id, calendarId, changes);
     * });
     */
    updateEvent(eventId: string, calendarId: string, changes: EventObject): void;
    /**
     * Delete an event.
     *
     * @param {string} eventId - event's id to delete
     * @param {string} calendarId - The CalendarId of the event to delete
     */
    deleteEvent(eventId: string, calendarId: string): void;
    /**********
     * General Methods
     **********/
    /**
     * Set events' visibility by calendar ID
     *
     * @param {string|Array.<string>} calendarId - The calendar id or ids to change visibility
     * @param {boolean} isVisible - If set to true, show the events. If set to false, hide the events.
     */
    setCalendarVisibility(calendarId: string | string[], isVisible: boolean): void;
    /**
     * Render the calendar.
     *
     * @example
     * calendar.render();
     *
     * @example
     * // Re-render the calendar when resizing a window.
     * window.addEventListener('resize', () => {
     *   calendar.render();
     * });
     */
    render(): this;
    /**
     * For SSR(Server Side Rendering), Return the HTML string of the whole calendar.
     *
     * @returns {string} HTML string
     */
    renderToString(): string;
    /**
     * Delete all events and clear view
     *
     * @example
     * calendar.clear();
     */
    clear(): void;
    /**
     * Scroll to current time on today in case of daily, weekly view.
     * Nothing happens in the monthly view.
     *
     * @example
     * function onNewEvents(events) {
     *   calendar.createEvents(events);
     *   calendar.scrollToNow('smooth');
     * }
     */
    scrollToNow(scrollBehavior?: ScrollBehaviorOptions): void;
    private calculateRenderRange;
    /**
     * Move to today.
     *
     * @example
     * function onClickTodayBtn() {
     *   calendar.today();
     * }
     */
    today(): void;
    /**
     * Move to specific date.
     *
     * @param {Date|string|number|TZDate} date - The date to move. it should be eligible parameter to create a `Date` instance if `date` is string or number.
     * @example
     * calendar.on('clickDayName', (event) => {
     *   if (calendar.getViewName() === 'week') {
     *     const dateToMove = new Date(event.date);
     *
     *     calendar.setDate(dateToMove);
     *     calendar.changeView('day');
     *   }
     * });
     */
    setDate(date: DateType): void;
    /**
     * Move the calendar forward to the next range.
     *
     * @example
     * function moveToNextOrPrevRange(offset) {
     *   if (offset === -1) {
     *     calendar.prev();
     *   } else if (offset === 1) {
     *     calendar.next();
     *   }
     * }
     */
    next(): void;
    /**
     * Move the calendar backward to the previous range.
     *
     * @example
     * function moveToNextOrPrevRange(offset) {
     *   if (offset === -1) {
     *     calendar.prev();
     *   } else if (offset === 1) {
     *     calendar.next();
     *   }
     * }
     */
    prev(): void;
    /**
     * Change color values of events belong to a certain calendar.
     *
     * @param {string} calendarId - The calendar ID
     * @param {object} colorOptions - The color values of the calendar
     *   @param {string} colorOptions.color - The text color of the events
     *   @param {string} colorOptions.borderColor - Left border color of events
     *   @param {string} colorOptions.backgroundColor - Background color of events
     *   @param {string} colorOptions.dragBackgroundColor - Background color of events during dragging
     *
     * @example
     * calendar.setCalendarColor('1', {
     *     color: '#e8e8e8',
     *     backgroundColor: '#585858',
     *     borderColor: '#a1b56c',
     *     dragBackgroundColor: '#585858',
     * });
     * calendar.setCalendarColor('2', {
     *     color: '#282828',
     *     backgroundColor: '#dc9656',
     *     borderColor: '#a1b56c',
     *     dragBackgroundColor: '#dc9656',
     * });
     * calendar.setCalendarColor('3', {
     *     color: '#a16946',
     *     backgroundColor: '#ab4642',
     *     borderColor: '#a1b56c',
     *     dragBackgroundColor: '#ab4642',
     * });
     */
    setCalendarColor(calendarId: string, colorOptions: CalendarColor): void;
    /**
     * Change current view type.
     *
     * @param {string} viewName - The new view name to change to. Available values are 'month', 'week', 'day'.
     *
     * @example
     * // change to daily view
     * calendar.changeView('day');
     *
     * // change to weekly view
     * calendar.changeView('week');
     *
     * // change to monthly view
     * calendar.changeView('month');
     */
    changeView(viewName: ViewType): void;
    /**
     * Get the DOM element of the event by event id and calendar id
     *
     * @param {string} eventId - ID of event
     * @param {string} calendarId - calendarId of event
     * @returns {HTMLElement} event element if found or null
     *
     * @example
     * const element = calendar.getElement(eventId, calendarId);
     *
     * console.log(element);
     */
    getElement(eventId: string, calendarId: string): Element | null;
    /**
     * Set the theme of the calendar.
     *
     * @param {Theme} theme - The theme object to apply. For more information, see {@link https://github.com/nhn/tui.calendar/blob/main/docs/en/apis/theme.md|Theme} in guide.
     *
     * @example
     * calendar.setTheme({
     *   common: {
     *     gridSelection: {
     *       backgroundColor: '#333',
     *     },
     *   },
     *   week: {
     *     nowIndicatorLabel: {
     *       color: '#00FF00',
     *     },
     *   },
     *   month: {
     *     dayName: {
     *       borderLeft: '1px solid #e5e5e5',
     *     },
     *   },
     * });
     */
    setTheme(theme: DeepPartial<ThemeState>): void;
    /**
     * Get current options.
     *
     * @returns {Options} - The current options of the instance
     */
    getOptions(): {
        template: import("../types/template").Template;
        theme: {
            common: import("../types/theme").CommonTheme;
            week: import("../types/theme").WeekTheme;
            month: import("../types/theme").MonthTheme;
        };
        week: import("../types/options").WeekOptions;
        month: import("../types/options").MonthOptions;
        isReadOnly: boolean;
        gridSelection: (boolean | import("../types/options").GridSelectionOptions) & import("../types/options").GridSelectionOptions;
        defaultView: ViewType;
        useFormPopup: boolean;
        useDetailPopup: boolean;
        usageStatistics: boolean;
        eventFilter: (event: EventObject) => boolean;
        timezone: import("../types/options").TimezoneOptions;
    };
    /**
     * Set options of calendar. For more information, see {@link https://github.com/nhn/tui.calendar/blob/main/docs/en/apis/options.md|Options} in guide.
     *
     * @param {Options} options - The options to set
     */
    setOptions(options: Options): void;
    /**
     * Get current rendered date. (see {@link TZDate} for further information)
     *
     * @returns {TZDate}
     */
    getDate(): TZDate;
    /**
     * Start time of rendered date range. (see {@link TZDate} for further information)
     *
     * @returns {TZDate}
     */
    getDateRangeStart(): TZDate;
    /**
     * End time of rendered date range. (see {@link TZDate} for further information)
     *
     * @returns {TZDate}
     */
    getDateRangeEnd(): TZDate;
    /**
     * Get current view name('day', 'week', 'month').
     *
     * @returns {string} current view name ('day', 'week', 'month')
     */
    getViewName(): ViewType;
    /**
     * Set calendar list.
     *
     * @param {CalendarInfo[]} calendars - list of calendars
     */
    setCalendars(calendars: CalendarInfo[]): void;
    /**
     * Open event form popup with predefined form values.
     *
     * @param {EventObject} event - The predefined {@link EventObject} data to show in form.
     */
    openFormPopup(event: EventObject): void;
    clearGridSelections(): void;
    fire<EventName extends keyof ExternalEventTypes>(eventName: EventName, ...args: Parameters<ExternalEventTypes[EventName]>): EventBus<ExternalEventTypes>;
    off<EventName extends keyof ExternalEventTypes>(eventName?: EventName, handler?: ExternalEventTypes[EventName]): EventBus<ExternalEventTypes>;
    on<EventName extends keyof ExternalEventTypes>(eventName: EventName, handler: ExternalEventTypes[EventName]): EventBus<ExternalEventTypes>;
    once<EventName extends keyof ExternalEventTypes>(eventName: EventName, handler: ExternalEventTypes[EventName]): EventBus<ExternalEventTypes>;
}
