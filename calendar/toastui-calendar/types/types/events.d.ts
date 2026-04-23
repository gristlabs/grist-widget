import type { MarkOptional } from 'ts-essentials';
import type EventModel from "../model/eventModel";
import type EventUIModel from "../model/eventUIModel";
import type TZDate from "../time/date";
import type Collection from "../utils/collection";
import type { StyleProp } from "./components/common";
import type { CalendarInfo } from "./options";
export declare type Matrix<T> = T[][];
export declare type Matrix3d<T> = Matrix<T>[];
export declare type CollisionGroup = Matrix<number>;
export declare type DayGridEventMatrix = Matrix3d<EventUIModel>;
export declare type TimeGridEventMatrix = Record<string, Matrix3d<EventUIModel>>;
export declare type EventModelMap = {
    milestone: EventUIModel[];
    allday: EventUIModel[];
    task: EventUIModel[];
    time: EventUIModel[];
};
export declare type EventGroupMap = Record<keyof EventModelMap, DayGridEventMatrix | TimeGridEventMatrix>;
export declare type DateType = Date | string | number | TZDate;
export declare type IDS_OF_DAY = Record<string, number[]>;
export interface CalendarData {
    calendars: CalendarInfo[];
    events: Collection<EventModel>;
    idsOfDay: IDS_OF_DAY;
}
export declare type EventCategory = 'milestone' | 'task' | 'allday' | 'time';
export declare type EventState = 'Busy' | 'Free';
export declare type EventObjectWithDefaultValues = MarkOptional<Required<EventObject>, 'color' | 'borderColor' | 'backgroundColor' | 'dragBackgroundColor'> & {
    start: TZDate;
    end: TZDate;
    __cid: number;
};
export interface EventObject {
    /**
     * `Optional` unique id for various use
     */
    id?: string;
    /**
     * Calendar ID
     */
    calendarId?: string;
    /**
     * Title for the event
     */
    title?: string;
    /**
     * Body for the event
     */
    body?: string;
    /**
     * Determine if the event is an all-day event
     */
    isAllday?: boolean;
    /**
     * When the event starts
     */
    start?: DateType;
    /**
     * When the event ends
     */
    end?: DateType;
    /**
     * Travel time which is taken to go
     */
    goingDuration?: number;
    /**
     * Travel time which is taken to come back
     */
    comingDuration?: number;
    /**
     * Location of the event
     */
    location?: string;
    /**
     * Attendees of the event
     */
    attendees?: string[];
    /**
     * Category of the event (milestone, task, allday, time)
     */
    category?: EventCategory;
    /**
     * Classification of work events (before work, before lunch, before work)
     */
    dueDateClass?: string;
    /**
     * Recurrence rule of the event
     */
    recurrenceRule?: string;
    /**
     * State of the event. The default is 'Busy'
     */
    state?: EventState;
    /**
     * Determine whether the event is shown or hidden
     */
    isVisible?: boolean;
    /**
     * Determine whether something is in progress
     */
    isPending?: boolean;
    /**
     * Determine whether the event is focused
     */
    isFocused?: boolean;
    /**
     * Determine whether the event is read-only
     */
    isReadOnly?: boolean;
    /**
     * Determine whether the event is private
     */
    isPrivate?: boolean;
    /**
     * Text color of the event element
     */
    color?: string;
    /**
     * Background color of the event element
     */
    backgroundColor?: string;
    /**
     * Background color of the dragging event element
     */
    dragBackgroundColor?: string;
    /**
     * Left border color of the event element
     */
    borderColor?: string;
    /**
     * Custom style for the event element
     */
    customStyle?: StyleProp;
    /**
     * Raw data for the event
     */
    raw?: any;
}
export declare type BooleanKeyOfEventObject = 'isPrivate' | 'isAllday' | 'isPending' | 'isFocused' | 'isVisible' | 'isReadOnly';
export declare type TimeUnit = 'second' | 'minute' | 'hour' | 'date' | 'month' | 'year';
