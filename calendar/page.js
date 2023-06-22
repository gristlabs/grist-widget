function ready(fn) {
  if (document.readyState !== 'loading'){
    fn();
  } else {
    document.addEventListener('DOMContentLoaded', fn);
  }
}

const columnsMappingOptions = [
  {
    name: "StartDate", // What field we will read.
    title: "Start Date", // Friendly field name.
    optional: false, // Is this an optional field.
    type: "DateTime", // What type of column we expect.
    description: "starting point of event", // Description of a field.
    allowMultiple: false // Allows multiple column assignment.
  },
  {
    name: "EndDate",
    title: "End Date",
    optional: false,
    type: "DateTime",
    description: "ending point of event",
    allowMultiple: false
  },
    {
    name: "Title",
    title: "Title",
    optional: false,
    type: "Text",
    description: "title of event",
    allowMultiple: false
    },
  {
    name: "IsAllDay",
    title: "Is All Day",
    optional: true,
    type: "Bool",
    description: "is event all day long",
  }
];


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

async function calendarViewChanges(radiobutton){
  await grist.setOption('calendarViewPerspective', radiobutton.value);
}

let Calendar
ready(function() {
  const container = document.getElementById('calendar');
  // Update the widget anytime the document data changes.
  Calendar = new tui.Calendar(container, options);
  grist.ready({requiredAccess: 'read table', columns: columnsMappingOptions});
  grist.onRecords(updateCalendar);
  grist.onOptions(function (options, interaction) {
    console.log(options, interaction);
    if(options.calendarViewPerspective){
      Calendar.changeView(options.calendarViewPerspective);
      selectRadioButton(options.calendarViewPerspective);
    }
  });
    Calendar.on('beforeUpdateEvent', async (info) => {
      if (info.changes) {
        if (info.changes.start || info.changes.end) {
          const record = await grist.fetchSelectedRecord(info.event.id)
          if (record) {
            const dateFrom = (info.changes.start?.valueOf() ?? info.event.start.valueOf()) / 1000;
            const dateTo = (info.changes.end?.valueOf() ?? info.event.start.valueOf()) / 1000;
            const table = await grist.getTable();
            await table.update({id: record.id, fields: {B: dateFrom, C: dateTo}})

        }
      }
    }
    grist.ready({requiredAccess: 'read table'});
  });
});

function selectRadioButton(value){
  for(const element of document.getElementsByName('calendar-options')){
    if(element.value === value){
      element.checked = true;
    }
  }
}

function updateCalendar(records,mappings) {
  const mapped = grist.mapColumnNames(records, mappings);
  if(mapped) {
    for (const record of records) {
      const event = Calendar.getEvent(record.id, 'cal1'); // EventObject
      if (!event) {
        Calendar.createEvents([
          {
            id: record.id,
            calendarId: 'cal1',
            title: mapped.title,
            start: mapped.startDate,
            end: mapped.endDate,
            isAllday: mapped.isAllDay,
            category: 'time',
            state: 'Free',
            color: '#fff',
            backgroundColor: '#ccc',
            customStyle: {
              fontStyle: 'italic',
              fontSize: '15px',
            },
          }, // EventObject
        ]);
      } else {
        Calendar.updateEvent(record.id, 'cal1', {
          title: record.A,
          start: record.B,
          end: record.C,
        })
      }
    }
  }
}


