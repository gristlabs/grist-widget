import {Key, assert, driver} from 'mocha-webdriver';
import {getGrist} from "./getGrist";

//not a pretty way to get events from currently used calendar control. but it's working.
function buildGetCalendarObjectScript(eventId: number) {
  return `return testGetCalendarEvent(${eventId});`
}

describe('calendar', function () {
  this.timeout('30s');
  const grist = getGrist();
  grist.bigScreen();

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
        //sign in to grist
        await grist.login();
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
      isAllDay: false,
      selected: false,
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
      isAllDay: false,
      selected: false,
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
    await grist.waitToPass(async () => {
      await grist.inCustomWidget(async () => {
        await driver.findWait('#calendar-day-label', 200).click();
      });
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

    // TUI Calendar uses its own data engine, so mocking Date is not working here. In the future, it will be good to
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

  it("should respect non full access", async function () {
    await grist.setCustomWidgetAccess('none');
    await grist.waitForServer();
    await grist.waitForFrame();

    // Now try to add a record. It should fail.
    await clickDay(10);
    await assertNewEventPopupDisplayed(false);

    // We don't have a good way of checking it. So we just check at the end that we have only one event.

    // Now with read access.
    await grist.setCustomWidgetAccess('read table');
    await grist.waitForServer();
    await grist.waitForFrame();

    // Try to add a record again. It should still fail.
    await clickDay(11);
    await assertNewEventPopupDisplayed(false);

    // Now with full access.
    await grist.setCustomWidgetAccess('full');
    await grist.waitForServer();
    await grist.waitForFrame();

    await createCalendarEvent(12, 'Test1');
    await grist.waitForServer();
    await grist.waitToPass(async () => {
      assert.equal(await eventsCount(), 1);
    });

    await grist.undo();

    // TODO: add test for ACL permissions tests and looking at document as a different user.
  });

  it("should support bi-directional linking", async function () {
    // Make sure we have clean view
    assert.equal(await eventsCount(), 1);

    // Now configure bi-directional mapping.
    await grist.sendActionsAndWaitForServer([
      ['UpdateRecord', '_grist_Views_section', 1, {linkSrcSectionRef: 3}],
      ['UpdateRecord', '_grist_Views_section', 3, {linkSrcSectionRef: 1}],
    ]);

    // Add 4 events in the calendar.
    await createCalendarEvent(14, 'Test2');
    await createCalendarEvent(15, 'Test3');
    await createCalendarEvent(16, 'Test4');
    await createCalendarEvent(17, 'Test5');

    // Now test if bi-directional mapping works.
    await grist.waitToPass(async () => {
      assert.equal(await eventsCount(), 5);
    });

    // Select 2 row in grid view.
    await clickRow(2);

    assert.equal(await selectedRow(), 2);

    // Calendar should be focused on 3rd event.
    assert.isTrue(await getCalendarEvent(3).then(c => c.selected));

    // Click 4th row
    await clickRow(3);
    assert.equal(await selectedRow(), 3);
    assert.isTrue(await getCalendarEvent(4).then(c => c.selected));

    // Now click on the last visible event
    await grist.inCustomWidget(async () => {
      const element = driver.findWait(`div[data-event-id="6"] .toastui-calendar-weekday-event-title`, 200);
      await driver.withActions(ac =>
        ac.move({origin: element}).press().pause(80).release()
      );
    });

    // Grid should move to 5th row.
    await grist.waitToPass(async () => {
      assert.equal(await selectedRow(), 5);
    });
    await grist.undo(4); // Revert both changes to the view and events.
    await grist.undo(1);
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

  it("Switch language to polish, check if text are different", async function () {
        async function switchLanguage(language: string) {
            const profileSettings = await grist.openProfileSettingsPage();
            //Switch language
            await profileSettings.setLanguage(language);
            await driver.navigate().back();
            await grist.waitForServer();
        }
        async function assertTodayButtonText(text: string) {
            await grist.inCustomWidget(async ()=>{
                const buttontext = await driver.find("#calendar-button-today").getText();
                assert.equal(buttontext,text)
            });
        }
        try{
            await switchLanguage('Polski');
            await assertTodayButtonText('dzisiaj');
        }finally {
            await switchLanguage('English');
            await assertTodayButtonText('today');
        }
    });
    //TODO: test adding new events and moving existing one on the calendar. ToastUI is not best optimized for drag and drop tests in mocha and i cannot yet make it working correctly./**
   /* Clicks the cell for `day` in the calendar.
   */
   async function clickDay(day: number) {
    await grist.inCustomWidget(async () => {
      const cell = driver.findContentWait(`.toastui-calendar-template-monthGridHeader`, String(day), 200);
      await driver.withActions(ac =>
        // doubleClick doesn't work here, so we do two clicks instead.
        ac.move({origin: cell}).press().pause(100).release().pause(100).press().pause(100).release()
      );
    });
  }

  /**
   * Creates an event in the calendar with title `eventTitle` for the specified `day`.
   */
  async function createCalendarEvent(day: number, eventTitle: string) {
    await clickDay(day);
    await grist.inCustomWidget(async () => {
      await driver.findWait('.toastui-calendar-popup-container', 1000);
      await driver.sendKeys(eventTitle, Key.ENTER);
    });
    await grist.waitForServer();
  }

  async function assertNewEventPopupDisplayed(expected: boolean) {
    await grist.inCustomWidget(async () => {
      assert.equal(await driver.find('.toastui-calendar-popup-container').isPresent(), expected);
    });
  }

  function eventsCount() {
    return grist.inCustomWidget(async () => {
      // We see only summaries (like 1 more)
      const texts = await driver.findAll(`div[data-event-id]`, g => g.getAttribute('data-event-id'));
      const numbers = new Set(texts.map(t => Number(t)));
      return numbers.size;
    });
  }

  async function clickRow(rowIndex: number) {
    await driver.findContentWait('.gridview_data_row_num', String(rowIndex), 200).click();
  }

  async function selectedRow() {
    return Number(await driver.findWait('.gridview_data_row_num.selected', 200).then(e => e.getText()));
  }
});
