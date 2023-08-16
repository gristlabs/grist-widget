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
        await driver.wait(async ()=> {
            const dataVersion = await getDateVersion();
            return dataVersion > oldDataVersion;
        });
    }

    //wait until the event is loaded on the calendar
    async function getCalendarEvent(eventId: number) {
        let mappedObject:any;
        mappedObject = await grist.executeScriptOnCustomWidget(buildGetCalendarObjectScript(eventId));
        return mappedObject;
    }

    async function getDateVersion(){
        return  await grist.executeScriptOnCustomWidget('return testGetDataVersion()');
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
            startDate: new Date('2023-08-03 13:00').toString(),
            endDate: new Date('2023-08-03 14:00').toString(),
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
        const mappedObject  = await getCalendarEvent(2);
        assert.equal(mappedObject.title, "All Day Event");
        assert.equal(mappedObject.isAllDay, true);
        // Ignoring time component, because it's not important in full day events
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
            startDate: new Date('2023-08-03 13:00').toString(),
            endDate: new Date('2023-08-03 15:00').toString(),
            isAllDay: false
        })
    });

    it('should remove event when row is deleted', async function () {
        await executeAndWaitForCalendar(async () => {
            await grist.sendActionsAndWaitForServer([['RemoveRecord', 'Table1', 1]]);
        });
        const mappedObject = await getCalendarEvent(1)
        assert.notExists(mappedObject);
    });


    //TODO: test adding new events and moving existing one on the calendar. ToastUI is not best optimalized for drag and drop tests in mocha and i cannot yet make it working correctly. 

});