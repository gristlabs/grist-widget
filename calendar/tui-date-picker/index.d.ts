// Type definitions for TOAST UI Date Picker v4.3.3
// TypeScript Version: 3.8.3

export type CalendarType = 'date' | 'month' | 'year';
export type DatePickerEventType = 'change' | 'close' | 'draw' | 'open';
export type DateRangePickerEventType = 'change:start' | 'change:end';
export type CalendarEventType = 'draw';

export interface CalendarOptions {
  language?: string;
  showToday?: boolean;
  showJumpButtons?: boolean;
  date?: Date;
  type?: CalendarType;
  usageStatistics?: boolean;
}

export interface DefaultPickerOptions {
  type?: CalendarType;
  selectableRanges?: Array<[Date | number, Date | number]>;
  calendar?: CalendarOptions;
  timePicker?: object | boolean;
  showAlways?: boolean;
  autoClose?: boolean;
  language?: string;
  usageStatistics?: boolean;
}

export interface DatePickerOptions extends DefaultPickerOptions {
  input?: {
    element?: HTMLElement | string;
    format?: string;
  };
  openers?: Array<string | HTMLElement>;
  date?: Date | number;
  weekStartDay?: String;
}

export interface DateRangePickerOptions extends DefaultPickerOptions {
  startpicker: {
    input: HTMLInputElement | string;
    container: HTMLElement | string;
    date?: Date | number;
  };
  endpicker: {
    input: HTMLInputElement | string;
    container: HTMLElement | string;
    date?: Date | number;
  };
  format?: string;
}

export class Calendar {
  public addCssClass(className: string): void;

  public changeLanguage(language: string): void;

  public destroy(): void;

  public draw(options: object): void;

  public drawNext(): void;

  public drawPrev(): void;

  public getDate(): Date;

  public getDateElements(): [HTMLElement];

  public getNextDate(): Date;

  public getNextYearDate(): Date;

  public getPrevDate(): Date;

  public getPrevYearDate(): Date;

  public getType(): CalendarType;

  public hide(): void;

  public removeCssClass(className: string): void;

  public show(): void;

  public off(
    eventName?: CalendarEventType | { [key in CalendarEventType]?: Function } | Function,
    handler?: Function
  ): void;

  public on(
    eventName: CalendarEventType | { [key in CalendarEventType]?: Function },
    handler?: Function | object,
    context?: object
  ): void;

  static localeTexts: Record<string, object>;
}

export class DateRangePicker {
  public addRange(start: Date | number, end: Date | number): void;

  public changeLanguage(language: string): void;

  public destroy(): void;

  public setStartDate: (newDate: Date) => void;

  public getStartDate: () => Date;

  public setEndDate: (newDate: Date) => void;

  public getEndDate: () => Date;

  public getStartpicker: () => DatePicker;

  public getEndpicker: () => DatePicker;

  public setRanges(ranges: Array<[Date | number, Date | number]>): void;

  public removeRange(start: Date | number, end: Date | number, type?: CalendarType | null): void;

  public off(
    eventName?: DateRangePickerEventType | { [key in DateRangePickerEventType]?: Function } | Function,
    handler?: Function
  ): void;

  public on(
    eventName: DateRangePickerEventType | { [key in DateRangePickerEventType]?: Function },
    handler?: Function | object,
    context?: object
  ): void;
}

export default class DatePicker {
  constructor(container: string | HTMLElement, options?: DatePickerOptions);

  public addCssClass(className: string): void;

  public addOpener(opener: HTMLElement | string): void;

  public addRange(start: Date | number, end: Date | number): void;

  public changeLanguage(language: string): void;

  public disable(): void;

  public enable(): void;

  public drawLowerCalendar(date?: Date): void;

  public drawUpperCalendar(date?: Date): void;

  public findOverlappedRange(startDate: Date | number, endDate: Date | number): void;

  public getCalendar(): Calendar;

  public getCalendarType(): CalendarType;

  public getDateElements(): [HTMLElement];

  public getLocaleText(): Record<string, object>;

  public getTimePicker(): unknown;

  public getType(): CalendarType;

  public isDisabled(): boolean;

  public isOpened(): boolean;

  public isSelectable(date: Date): boolean;

  public isSelected(date: Date): boolean;

  public open(): void;

  public close(): void;

  public removeAllOpeners(): void;

  public removeCssClass(className: string): void;

  public removeOpener(opener: HTMLElement | string): void;

  public removeRange(start: Date | number, end: Date | number, type?: CalendarType | null): void;

  public setDateFormat(format: string): void;

  public setInput(element: HTMLElement | string, options: { format: string; syncFromInput: boolean }): void;

  public setNull(): void;

  public setRanges(ranges: Array<[Date | number, Date | number]>): void;

  public setType(type: string): void;

  public toggle(): void;

  public destroy(): void;

  public off(
    eventName?: DatePickerEventType | { [key in DatePickerEventType]?: Function } | Function,
    handler?: Function
  ): void;

  public on(
    eventName: DatePickerEventType | { [key in DatePickerEventType]?: Function },
    handler?: Function | object,
    context?: object
  ): void;

  public setStartDate: (newDate: Date) => void;

  public getDate: () => Date;

  public setDate: (newDate: Date) => void;

  static localeTexts: Record<string, object>;

  static createRangePicker(props: DateRangePickerOptions): DateRangePicker;

  static createCalendar(wrapperElement: string | HTMLElement, options: CalendarOptions): Calendar;
}