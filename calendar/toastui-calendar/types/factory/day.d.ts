import { h } from 'preact';
import CalendarCore from "./calendarCore";
import type { Options } from "../types/options";
export default class Day extends CalendarCore {
    constructor(container: Element, options?: Options);
    protected getComponent(): h.JSX.Element;
}
