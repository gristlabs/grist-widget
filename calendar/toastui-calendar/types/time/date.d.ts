/**
 * Custom Date Class to handle timezone offset.
 *
 * For more information, see {@link https://github.com/nhn/tui.calendar/blob/main/docs/en/apis/tzdate.md|TZDate} in guide.
 *
 * @class TZDate
 * @param {number|TZDate|Date|string} date - date value to be converted. If date is number or string, it should be eligible to parse by Date constructor.
 */
export default class TZDate {
    private tzOffset;
    private d;
    constructor(...args: any[]);
    /**
     * Get the string representation of the date.
     * @returns {string} string representation of the date.
     */
    toString(): string;
    /**
     * Add years to the instance.
     * @param {number} y - number of years to be added.
     * @returns {TZDate} - returns the instance itself.
     */
    addFullYear(y: number): TZDate;
    /**
     * Add months to the instance.
     * @param {number} m - number of months to be added.
     * @returns {TZDate} - returns the instance itself.
     */
    addMonth(m: number): TZDate;
    /**
     * Add dates to the instance.
     * @param {number} d - number of days to be added.
     * @returns {TZDate} - returns the instance itself.
     */
    addDate(d: number): TZDate;
    /**
     * Add hours to the instance.
     * @param {number} h - number of hours to be added.
     * @returns {TZDate} - returns the instance itself.
     */
    addHours(h: number): TZDate;
    /**
     * Add minutes to the instance.
     * @param {number} M - number of minutes to be added.
     * @returns {TZDate} - returns the instance itself.
     */
    addMinutes(M: number): TZDate;
    /**
     * Add seconds to the instance.
     * @param {number} s - number of seconds to be added.
     * @returns {TZDate} - returns the instance itself.
     */
    addSeconds(s: number): TZDate;
    /**
     * Add milliseconds to the instance.
     * @param {number} ms - number of milliseconds to be added.
     * @returns {TZDate} - returns the instance itself.
     */
    addMilliseconds(ms: number): TZDate;
    /**
     * Set the date and time all at once.
     * @param {number} y - year
     * @param {number} m - month
     * @param {number} d - date
     * @param {number} h - hours
     * @param {number} M - minutes
     * @param {number} s - seconds
     * @param {number} ms - milliseconds
     * @returns {TZDate} - returns the instance itself.
     */
    setWithRaw(y: number, m: number, d: number, h: number, M: number, s: number, ms: number): TZDate;
    /**
     * Convert the instance to the native `Date` object.
     * @returns {Date} - The native `Date` object.
     */
    toDate(): Date;
    /**
     * Get the value of the date. (milliseconds since 1970-01-01 00:00:00 (UTC+0))
     * @returns {number} - value of the date.
     */
    valueOf(): number;
    /**
     * Get the timezone offset from UTC in minutes.
     * @returns {number} - timezone offset in minutes.
     */
    getTimezoneOffset(): number;
    /**
     * Get milliseconds which is converted by timezone
     * @returns {number} milliseconds
     */
    getTime(): number;
    /**
     * Get the year of the instance.
     * @returns {number} - full year
     */
    getFullYear(): number;
    /**
     * Get the month of the instance. (zero-based)
     * @returns {number} - month
     */
    getMonth(): number;
    /**
     * Get the date of the instance.
     * @returns {number} - date
     */
    getDate(): number;
    /**
     * Get the hours of the instance.
     * @returns {number} - hours
     */
    getHours(): number;
    /**
     * Get the minutes of the instance.
     * @returns {number} - minutes
     */
    getMinutes(): number;
    /**
     * Get the seconds of the instance.
     * @returns {number} - seconds
     */
    getSeconds(): number;
    /**
     * Get the milliseconds of the instance.
     * @returns {number} - milliseconds
     */
    getMilliseconds(): number;
    /**
     * Get the day of the week of the instance.
     * @returns {number} - day of the week
     */
    getDay(): number;
    /**
     * Sets the instance to the time represented by a number of milliseconds since 1970-01-01 00:00:00 (UTC+0).
     * @param {number} t - number of milliseconds
     * @returns {number} - Passed milliseconds of the instance since 1970-01-01 00:00:00 (UTC+0).
     */
    setTime(t: number): number;
    /**
     * Sets the year-month-date of the instance. Equivalent to calling `setFullYear` of `Date` object.
     * @param {number} y - year
     * @param {number} m - month (zero-based)
     * @param {number} d - date
     * @returns {number} - Passed milliseconds of the instance since 1970-01-01 00:00:00 (UTC+0).
     */
    setFullYear(y: number, m?: number, d?: number): number;
    /**
     * Sets the month of the instance. Equivalent to calling `setMonth` of `Date` object.
     * @param {number} m - month (zero-based)
     * @param {number} d - date
     * @returns {number} - Passed milliseconds of the instance since 1970-01-01 00:00:00 (UTC+0).
     */
    setMonth(m: number, d?: number): number;
    /**
     * Sets the date of the instance. Equivalent to calling `setDate` of `Date` object.
     * @param {number} d - date
     * @returns {number} - Passed milliseconds of the instance since 1970-01-01 00:00:00 (UTC+0).
     */
    setDate(d: number): number;
    /**
     * Sets the hours of the instance. Equivalent to calling `setHours` of `Date` object.
     * @param {number} h - hours
     * @param {number} M - minutes
     * @param {number} s - seconds
     * @param {number} ms - milliseconds
     * @returns {number} - Passed milliseconds of the instance since 1970-01-01 00:00:00 (UTC+0).
     */
    setHours(h: number, M?: number, s?: number, ms?: number): number;
    /**
     * Sets the minutes of the instance. Equivalent to calling `setMinutes` of `Date` object.
     * @param {number} M - minutes
     * @param {number} s - seconds
     * @param {number} ms - milliseconds
     * @returns {number} - Passed milliseconds of the instance since 1970-01-01 00:00:00 (UTC+0).
     */
    setMinutes(M: number, s?: number, ms?: number): number;
    /**
     * Sets the seconds of the instance. Equivalent to calling `setSeconds` of `Date` object.
     * @param {number} s - seconds
     * @param {number} ms - milliseconds
     * @returns {number} - Passed milliseconds of the instance since 1970-01-01 00:00:00 (UTC+0).
     */
    setSeconds(s: number, ms?: number): number;
    /**
     * Sets the milliseconds of the instance. Equivalent to calling `setMilliseconds` of `Date` object.
     * @param {number} ms - milliseconds
     * @returns {number} - Passed milliseconds of the instance since 1970-01-01 00:00:00 (UTC+0).
     */
    setMilliseconds(ms: number): number;
    /**
     * Set the timezone offset of the instance.
     * @param {string|number} tzValue - The name of timezone(IANA name) or timezone offset(in minutes).
     * @returns {TZDate} - New instance with the timezone offset.
     */
    tz(tzValue: string | 'Local' | number): TZDate;
    /**
     * Get the new instance following the system's timezone.
     * If the system timezone is different from the timezone of the instance,
     * the instance is converted to the system timezone.
     *
     * Instance's `tzOffset` property will be ignored if there is a `tzValue` parameter.
     *
     * @param {string|number} tzValue - The name of timezone(IANA name) or timezone offset(in minutes).
     * @returns {TZDate} - New instance with the system timezone.
     */
    local(tzValue?: string | number): TZDate;
}
