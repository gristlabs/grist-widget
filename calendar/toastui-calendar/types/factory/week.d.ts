import { h } from 'preact';
import CalendarCore from "./calendarCore";
import type { Options } from "../types/options";
export default class Week extends CalendarCore {
    constructor(container: Element, options?: Options);
    protected getComponent(): h.JSX.Element;
}
