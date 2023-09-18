import {assert, driver} from 'mocha-webdriver';
import {getGrist} from "./getGrist";

//not a pretty way to get events from currently used calendar control. but it's working.
function buildGetCalendarObjectScript(eventId: number) {
  return `return testGetCalendarEvent(${eventId});`
}

describe('calendar', function () {
  this.timeout(20000);
  const grist = getGrist();

  async function executeAndWaitForCalendar(action: () => Promise<void>) {
    const oldDataVersion = await getDateVersion();
    await action();
    await driver.wait(async () => {
      const dataVersion = await getDateVersion();
      return dataVersion > oldDataVersion;
    });
  }

  //wait until the event is loaded on the calendar
  async function getCalendarEvent(eventId: number): Promise<any> {
    let mappedObject: any;
    mappedObject = await grist.executeScriptOnCustomWidget(buildGetCalendarObjectScript(eventId));
    return JSON.parse(mappedObject);
  }

  async function getCalendarSettings(): Promise<string> {
    return await grist.executeScriptOnCustomWidget('return testGetCalendarViewName()');
  }

  async function getDateVersion(): Promise<Date> {
    return await grist.executeScriptOnCustomWidget('return testGetDataVersion()');
  }

  before(async function () {
    const docId = await grist.upload('test/fixtures/docs/Calendar.grist');
    await grist.openDoc(docId);
    await grist.toggleSidePanel('right', 'open');
    await grist.addNewSection(/Custom/, /Table1/);
    await grist.clickWidgetPane();
    await grist.selectCustomWidget(/Calendar/);
    await grist.setCustomWidgetAccess('full');
    await grist.setCustomWidgetMapping('startDate', /From/);
    await grist.setCustomWidgetMapping('endDate', /To/);
    await grist.setCustomWidgetMapping('title', /Label/);
    await grist.setCustomWidgetMapping('isAllDay', /IsFullDay/);
  });

  it('should create new event when new row is added', async function () {
    await executeAndWaitForCalendar(async () => {
      await grist.sendActionsAndWaitForServer([['AddRecord', 'Table1', -1, {
        From: new Date('2023-08-03 13:00'),
        To: new Date('2023-08-03 14:00'),
        Label: "New Event",
        IsFullDay: false
      }]]);
    });
    const mappedObject = await getCalendarEvent(1);
    assert.deepEqual(mappedObject, {
      title: "New Event",
      startDate: new Date('2023-08-03 13:00').toJSON(),
      endDate: new Date('2023-08-03 14:00').toJSON(),
      isAllDay: false
    })
  });

  it('should create new all day event when new row is added', async function () {
    await executeAndWaitForCalendar(async () => {
      await grist.sendActionsAndWaitForServer([['AddRecord', 'Table1', -1, {
        From: new Date('2023-08-04 13:00'),
        To: new Date('2023-08-04 14:00'),
        Label: "All Day Event",
        IsFullDay: true
      }]]);
    });
    const mappedObject = await getCalendarEvent(2);
    assert.equal(mappedObject.title, "All Day Event");
    assert.equal(mappedObject.isAllDay, true);
    // Ignoring a time component, because it's not important in full day events
    assert.equal(new Date(mappedObject.startDate).toDateString(),
      new Date('2023-08-04 00:00:00').toDateString());
    assert.equal(new Date(mappedObject.endDate).toDateString(),
      new Date('2023-08-04 00:00:00').toDateString());
  });

  it('should update event when table data is changed', async function () {
    await executeAndWaitForCalendar(async () => {
      await grist.sendActionsAndWaitForServer([['UpdateRecord', 'Table1', 1, {
        From: new Date('2023-08-03 13:00'),
        To: new Date('2023-08-03 15:00'),
        Label: "New Event",
        IsFullDay: false
      }]]);
    });
    const mappedObject = await getCalendarEvent(1);
    assert.deepEqual(mappedObject, {
      title: "New Event",
      startDate: new Date('2023-08-03 13:00').toJSON(),
      endDate: new Date('2023-08-03 15:00').toJSON(),
      isAllDay: false
    })
  });

  it('should remove event when row is deleted', async function () {
    await executeAndWaitForCalendar(async () => {
      await grist.sendActionsAndWaitForServer([['RemoveRecord', 'Table1', 1]]);
    });
    const mappedObject = await getCalendarEvent(1)
    assert.isNull(mappedObject);
  });

  it('should change calendar perspective when button is pressed', async function () {
    await grist.inCustomWidget(async () => {
      await driver.findWait('#calendar-day-label', 200).click();
    });
    let viewType = await getCalendarSettings();
    assert.equal(viewType, 'day');
    await grist.inCustomWidget(async () => {
      await driver.findWait('#calendar-month-label', 200).click();
    });
    viewType = await getCalendarSettings();
    assert.equal(viewType, 'month');
    await grist.inCustomWidget(async () => {
      await driver.findWait('#calendar-week-label', 200).click();
    });
    viewType = await getCalendarSettings();
    assert.equal(viewType, 'week');
  })

  it('should navigate to appropriate time periods when button is pressed', async function () {
    const today = new Date();
    const validateDate = async (daysToAdd: number) => {
      const newDate = await grist.executeScriptOnCustomWidget(
        'return calendarHandler.calendar.getDate().d.toDate().toDateString()'
      );

      const expectedDate = new Date(today);
      expectedDate.setDate(today.getDate() + daysToAdd);
      assert.equal(newDate, expectedDate.toDateString());
    }

    // Navigate to the previous week
    await navigateCalendar('previous');
    await validateDate(-7);

    // Navigate to today
    await navigateCalendar('today');
    await validateDate(0);

    // Navigate to next week
    await navigateCalendar('next');
    await validateDate(7);
  });

  it('should show correct month name when navigating to previous and next month', async function () {
    const findCalendarTitle = async (): Promise<string> => await grist.inCustomWidget(async () => {
      return await driver.findWait("#calendar-title", 200).getText();
    });

    await selectPerspective('month');
    await navigateCalendar('today');

    // TUI Calendar use it's own data enegine, so mocking Date is not working here. In future it will be good to
    // find a way to mock a date both in the system (by using TimeShift) and in the TUI Calendar to get rid of this
    // data builder here.
    const monthNameOf = (date: Date) => date.toLocaleString('en-us', {month: 'long', year: 'numeric'});
    const shiftMonth = (date: Date, months: number) => {
      const newDate = new Date(date);
      newDate.setMonth(date.getMonth() + months);
      return newDate;
    };
    const now = new Date(Date.now());
    assert.equal(await findCalendarTitle(), monthNameOf(now));

    await navigateCalendar('previous');

    assert.equal(await findCalendarTitle(), monthNameOf(shiftMonth(now, -1)));

    await navigateCalendar('today');
    await navigateCalendar('next');

    assert.equal(await findCalendarTitle(), monthNameOf(shiftMonth(now, 1)));
  });

  //Helpers
  async function selectPerspective(perspective: 'month' | 'week' | 'day') {
    await grist.inCustomWidget(async () => {
      await driver.findWait(`#calendar-${perspective}-label`, 200).click();
    });
  }

  async function navigateCalendar(toWhere: 'previous' | 'next' | 'today') {
    await grist.inCustomWidget(async () => {
      await driver.findWait(`#calendar-button-${toWhere}`, 200).click();
    });
  }

  //TODO: test adding new events and moving existing one on the calendar. ToastUI is not best optimized for drag and drop tests in mocha and i cannot yet make it working correctly.

});
