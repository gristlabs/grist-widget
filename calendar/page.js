function ready(fn) {
  if (document.readyState !== 'loading'){
    fn();
  } else {
    document.addEventListener('DOMContentLoaded', fn);
  }
}


const options = {
  week: {
    taskView: false,
  },
  month: {},
  defaultView: 'week',
  template: {
    time(event) {
      const {title} = event;

      return `<span>${title}</span>`;
    },
    allday(event) {
      return `<span style="color: gray;">${event.title}</span>`;
    },
  },
  calendars: [
    {
      id: 'cal1',
      name: 'Personal',
      backgroundColor: '#03bd9e',
    },
  ],
}

let Calendar
ready(function() {
  const container = document.getElementById('calendar');
  // Update the widget anytime the document data changes.
  Calendar = new tui.Calendar(container, options);
  grist.ready({requiredAccess: 'read table'});
  grist.onRecords(updateCalendar);
});
grist.ready({requiredAccess: 'read table'});

function updateCalendar(records) {
  for(const record of records) {
    const event = Calendar.getEvent(record.id, 'cal1'); // EventObject
    if (!event) {
      Calendar.createEvents([
        {
          id: record.id,
          calendarId: 'cal1',
          title: record.A,
          start: record.B,
          end: record.C,
          category: 'time',
          state: 'Free',
          isReadOnly: true,
          color: '#fff',
          backgroundColor: '#ccc',
          customStyle: {
            fontStyle: 'italic',
            fontSize: '15px',
          },
        }, // EventObject
      ]);
    }
    else{
      Calendar.updateEvent(record.id, 'cal1', {
        title: record.A,
        start: record.B,
        end: record.C,
      })
    }
  }
}


