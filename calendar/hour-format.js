// Given a BCP 47 locale tag, returns true when the locale uses a 12-hour clock
// (AM/PM), false for 24-hour, via Intl resolvedOptions().hour12. Shared by
// page.js and the inline TimePicker patch in index.html, which runs before
// page.js loads, so this lives in its own file loaded ahead of both.
function getHour12(locale) {
  try {
    return new Intl.DateTimeFormat(locale, {hour: 'numeric'}).resolvedOptions().hour12;
  } catch (e) {
    console.warn(`getHour12: cannot resolve hour cycle for locale "${locale}", defaulting to 24h`, e);
  }
  return false; // fallback: 24h
}
