import { h } from 'preact';
import CalendarCore from "./calendarCore";
import type { Options } from "../types/options";
/**
 * Calendar class
 *
 * @class Calendar
 * @extends CalendarCore
 * @param {object} options - Calendar options. Check out {@link CalendarCore} for more information.
 */
export default class Calendar extends CalendarCore {
    constructor(container: Element | string, options?: Options);
    protected getComponent(): h.JSX.Element;
}
