// TODO
// This is a hacky build of a copy of objtypes.ts from Grist.
// It's actually already in the page, just not exposed via `grist` global.
/**
 * Encodes and decodes Grist encoding of values, mirroring similar Python functions in
 * sandbox/grist/objtypes.py.
 */
// tslint:disable:max-classes-per-file
/**
 * Letter codes for {@link CellValue} types encoded as [code, args...] tuples.
 */
export var GristObjCode;
(function (GristObjCode) {
    GristObjCode["List"] = "L";
    GristObjCode["LookUp"] = "l";
    GristObjCode["Dict"] = "O";
    GristObjCode["DateTime"] = "D";
    GristObjCode["Date"] = "d";
    GristObjCode["Skip"] = "S";
    GristObjCode["Censored"] = "C";
    GristObjCode["Reference"] = "R";
    GristObjCode["ReferenceList"] = "r";
    GristObjCode["Exception"] = "E";
    GristObjCode["Pending"] = "P";
    GristObjCode["Unmarshallable"] = "U";
    GristObjCode["Versions"] = "V";
})(GristObjCode || (GristObjCode = {}));
function isPlainObject(value) {
    if (Object.prototype.toString.call(value) !== "[object Object]")
        return false;
    const proto = Object.getPrototypeOf(value);
    return proto === null || proto === Object.prototype;
}
// The text to show on cells whose values are pending.
export const PENDING_DATA_PLACEHOLDER = "Loading...";
/**
 * A GristDate is just a JS Date object whose toString() method returns YYYY-MM-DD.
 */
export class GristDate extends Date {
    static fromGristValue(epochSec) {
        return new GristDate(epochSec * 1000);
    }
    toString() {
        return this.toISOString().slice(0, 10);
    }
}
/**
 * A GristDateTime is a JS Date with an added timezone field. Its toString() returns the date in
 * ISO format. To create a timezone-aware momentjs object, use:
 *
 *    moment(d).tz(d.timezone)
 */
export class GristDateTime extends Date {
    static fromGristValue(epochSec, timezone) {
        return Object.assign(new GristDateTime(epochSec * 1000), { timezone });
    }
    toString() { return this.toISOString(); }
}
/**
 * A Reference represents a reference to a row in a table. It is simply a pair of a string tableId
 * and a numeric rowId.
 */
export class Reference {
    constructor(tableId, rowId) {
        this.tableId = tableId;
        this.rowId = rowId;
    }
    toString() {
        return `${this.tableId}[${this.rowId}]`;
    }
}
/**
 * A ReferenceList represents a reference to a number of rows in a table. It is simply a pair of a string tableId
 * and a numeric array rowIds.
 */
export class ReferenceList {
    constructor(tableId, rowIds) {
        this.tableId = tableId;
        this.rowIds = rowIds;
    }
    toString() {
        return `${this.tableId}[[${this.rowIds}]]`;
    }
}
/**
 * A RaisedException represents a formula error. It includes the exception name, message, and
 * optional details.
 */
export class RaisedException {
    constructor(list) {
        if (!list.length) {
            throw new Error("RaisedException requires a name as first element");
        }
        list = [...list];
        this.name = list.shift();
        this.message = list.shift();
        this.details = list.shift();
        this.user_input = list.shift()?.u;
    }
    /**
     * This is designed to look somewhat similar to Excel, e.g. #VALUE or #DIV/0!"
     */
    toString() {
        switch (this.name) {
            case 'ZeroDivisionError': return '#DIV/0!';
            case 'UnmarshallableError': return this.details || ('#' + this.name);
            case 'InvalidTypedValue': return `#Invalid ${this.message}: ${this.details}`;
        }
        return '#' + this.name;
    }
}
/**
 * An UnknownValue is a fallback for values that we don't handle otherwise, e.g. of a Python
 * formula returned a function object, or a value we fail to decode.
 * It is typically the Python repr() string of the value.
 */
export class UnknownValue {
    // When encoding an unknown value, get a best-effort string form of it.
    static safeRepr(value) {
        try {
            return String(value);
        }
        catch (e) {
            return `<${typeof value}>`;
        }
    }
    constructor(value) {
        this.value = value;
    }
    toString() {
        return String(this.value);
    }
}
/**
 * A trivial placeholder for a value that's not yet available.
 */
export class PendingValue {
    toString() {
        return PENDING_DATA_PLACEHOLDER;
    }
}
/**
 * A trivial placeholder for a value that won't be shown.
 */
export class SkipValue {
    toString() {
        return '...';
    }
}
/**
 * A placeholder for a value hidden by access control rules.
 * Depending on the types of the columns involved, copying
 * a censored value and pasting elsewhere will either use
 * CensoredValue.__repr__ (python) or CensoredValue.toString (typescript)
 * so they should match
 */
export class CensoredValue {
    toString() {
        return 'CENSORED';
    }
}
/**
 * Produces a Grist-encoded version of the value, e.g. turning a Date into ['d', timestamp].
 * Returns ['U', repr(value)] if it fails to encode otherwise.
 *
 * TODO Add tests. This is not yet used for anything.
 */
export function encodeObject(value) {
    try {
        switch (typeof value) {
            case 'string':
            case 'number':
            case 'boolean':
                return value;
        }
        if (value == null) {
            return null;
        }
        else if (value instanceof Reference) {
            return [GristObjCode.Reference, value.tableId, value.rowId];
        }
        else if (value instanceof ReferenceList) {
            return [GristObjCode.ReferenceList, value.tableId, value.rowIds];
        }
        else if (value instanceof Date) {
            const timestamp = value.valueOf() / 1000;
            if ('timezone' in value) {
                return [GristObjCode.DateTime, timestamp, value.timezone];
            }
            else {
                // TODO Depending on how it's used, may want to return ['d', timestamp] for UTC midnight.
                return [GristObjCode.DateTime, timestamp, 'UTC'];
            }
        }
        else if (value instanceof CensoredValue) {
            return [GristObjCode.Censored];
        }
        else if (value instanceof RaisedException) {
            return [GristObjCode.Exception, value.name, value.message, value.details];
        }
        else if (Array.isArray(value)) {
            return [GristObjCode.List, ...value.map(encodeObject)];
        }
        else if (isPlainObject(value)) {
            return [GristObjCode.Dict, mapValues(value, encodeObject, { sort: true })];
        }
    }
    catch (e) {
        // Fall through to return a best-effort representation.
    }
    // We either don't know how to convert the value, or failed during the conversion. Instead we
    // return an "UnmarshallableValue" object, with repr() of the value to show to the user.
    return [GristObjCode.Unmarshallable, UnknownValue.safeRepr(value)];
}
/**
 * Given a Grist-encoded value, returns an object represented by it.
 * If the type code is unknown, or construction fails for any reason, returns an UnknownValue.
 */
export function decodeObject(value) {
    if (!Array.isArray(value)) {
        return value;
    }
    const code = value[0];
    const args = value.slice(1);
    let err;
    try {
        switch (code) {
            case 'D': return GristDateTime.fromGristValue(args[0], String(args[1]));
            case 'd': return GristDate.fromGristValue(args[0]);
            case 'E': return new RaisedException(args);
            case 'L': return args.map(decodeObject);
            case 'O': return mapValues(args[0], decodeObject, { sort: true });
            case 'P': return new PendingValue();
            case 'r': return new ReferenceList(String(args[0]), args[1]);
            case 'R': return new Reference(String(args[0]), args[1]);
            case 'S': return new SkipValue();
            case 'C': return new CensoredValue();
            case 'U': return new UnknownValue(args[0]);
        }
    }
    catch (e) {
        err = e;
    }
    // If we can't decode, return an UnknownValue with some attempt to represent what we couldn't
    // decode as long as some info about the error if any.
    return new UnknownValue(`${code}(${JSON.stringify(args).slice(1, -1)})` +
        (err ? `#${err.name}(${err.message})` : ''));
}
// Like lodash's mapValues, with support for sorting keys, for friendlier output.
export function mapValues(sourceObj, mapper, options = {}) {
    const result = {};
    const keys = Object.keys(sourceObj);
    if (options.sort) {
        keys.sort();
    }
    for (const key of keys) {
        result[key] = mapper(sourceObj[key]);
    }
    return result;
}
