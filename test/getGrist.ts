import {ChildProcess, execSync, spawn} from 'child_process';
import FormData from 'form-data';
import fs from 'fs';
import { driver, enableDebugCapture } from 'mocha-webdriver';
import fetch from 'node-fetch';

import {Key, WebDriver, WebElement, WebElementPromise} from 'mocha-webdriver';
import escapeRegExp = require('lodash/escapeRegExp');
import {GristWebDriverUtils, WindowDimensions} from "test/gristWebDriverUtils";

type UserAction = Array<string | number | object | boolean | null | undefined>;

/**
 * Set up mocha hooks for starting and stopping Grist. Return
 * an interface for interacting with Grist.
 */
export function getGrist(): GristUtils {
  const server = new GristTestServer();
  const grist = new GristUtils(server);

  enableDebugCapture();

  before(async function () {
    // Server will have started up in a global fixture, we just
    // need to make sure it is ready.
    // TODO: mocha-webdriver has a way of explicitly connecting a
    // server that might have advantages for debugging.
    await grist.wait();
    // "Changes you made may not be saved" alerts are consumed
    // in grist-core tests - do the same here.
    // TODO: figure out why they occur.
    await grist.driver.navigate().refresh();
    if (await grist.isAlertShown()) {
      await grist.acceptAlert();
    }
  });

  return grist;
}

/**
 *
 * During tests, we will have two servers. The first is Grist itself,
 * run as a disposable docker container. The second is a webserver
 * hosting the content in this repository, for use as custom widgets.
 * I've just hard-coded port numbers here.
 *
 */
const serverSettings = {
  gristContainerName: 'grist-test',
  gristImage: 'gristlabs/grist',
  gristPort: 9999,
  contentPort: 9998,
  site: 'grist-widget',
};

/**
 * Start and stop servers needed for testing. Grist is run as a docker container.
 * The grist-widget repo is served in the same way as "yarn run serve:dev" would,
 * by running live-server with some middleware.
 */
export class GristTestServer {
  private _assetServer?: ChildProcess;

  public async start() {
    await this.stop();
    const {gristContainerName, gristImage, gristPort, contentPort} = serverSettings;
    const cmd = `docker run -d --rm --name ${gristContainerName}` +
      ' --add-host=host.docker.internal:host-gateway' +
      ` -e PORT=${gristPort} -p ${gristPort}:${gristPort}` +
      ` -e GRIST_SINGLE_ORG=${serverSettings.site}` +
      ` -e GRIST_WIDGET_LIST_URL=http://host.docker.internal:${contentPort}/manifest.json` +
      ` ${gristImage}`;
    try {
      execSync(cmd, {
        stdio: 'pipe'
      });
    } catch (e) {
      throw new Error(
        `Failed to start Grist: ${cmd} (${e?.stderr.toString()})`
      );
    }
    const pwd = process.cwd();
    this._assetServer = spawn('live-server', [
      `--port=${contentPort}`, '--no-browser', '-q',
      `--middleware=${pwd}/buildtools/rewriteUrl.js`
    ], {
      env: {
        ...process.env,
        GRIST_PORT: String(gristPort),
      }
    });
  }

  public async stop() {
    try {
      execSync(`docker kill ${serverSettings.gristContainerName}`, {
        stdio: 'pipe'
      });
    } catch (e) {
      // fine if kill fails, may not have been running.
    }
    try {
      execSync(`docker rm ${serverSettings.gristContainerName}`, {
        stdio: 'pipe'
      });
    } catch (e) {
      // fine if rm fails, may not actually exist.
    }
    if (this._assetServer) {
      this._assetServer.kill();
      this._assetServer = undefined;
    }
  }

  public get gristUrl() {
    const {gristPort} = serverSettings;
    return `http://localhost:${gristPort}`;
  }

  public get assetUrl() {
    const {contentPort} = serverSettings;
    // localhost doesn't work on Node 18 (see https://github.com/node-fetch/node-fetch/issues/1624)
    return `http://127.0.0.1:${contentPort}`;
  }
}

export class GristUtils extends GristWebDriverUtils {
  public constructor(public server: GristTestServer) {
    super(driver);
  }

  public get url() {
    return this.server.gristUrl;
  }

  public async wait() {
    let ct = 0;
    while (true) {
      if (ct > 8) {
        console.log("Waiting for Grist...");
      }
      try {
        const url = this.url;
        const resp = await fetch(url + '/status');
        if (resp.status === 200) {
          break;
        }
      } catch (e) {
        // we expect fetch failures initially.
      }
      await new Promise(resolve => setTimeout(resolve, 250));
      ct++;
    }
    ct = 0;
    while (true) {
      if (ct > 8) {
        console.log("Waiting for asset server...");
      }
      try {
        const resp = await fetch(this.server.assetUrl);
        if (resp.status === 200) {
          break;
        }
      } catch (e) {
        // we expect fetch failures initially.
      }
      await new Promise(resolve => setTimeout(resolve, 250));
      ct++;
    }
  }

  public async upload(gristFileName: string): Promise<string> {
    const endpoint = this.url + '/api/docs';
    const formData = new FormData();
    formData.append('upload', fs.createReadStream(gristFileName), 'sample.grist');

    const response = await fetch(endpoint, {
      method: 'POST',
      body: formData,
      headers: {
        'X-Requested-With': 'XMLHttpRequest',
      }
    });

    if (response.ok) {
      const result = await response.json();
      if (typeof result !== 'string') {
        throw new Error(`Unexpected response: ${result}`);
      }
      return result;
    } else {
      console.error('File upload failed. Status:', response.status);
      throw new Error(`Upload failed: ${await response.json()}`);
    }
  }

  public async openDoc(docId: string): Promise<void> {
    await driver.get(this.url + `/doc/${docId}`);
    await driver.findWait('.viewsection_title', 10000);
    await this.waitForServer();
  }

  public async clickWidgetPane() {
    const elem = this.driver.find('.test-custom-widget-gallery-container');
    if (await elem.isPresent()) {
      await elem.click();
    }
  }

  public async selectCustomWidget(text: string | RegExp) {
    await this.driver.findContent('.test-custom-widget-gallery-widget', text).click();
    await this.driver.find('.test-custom-widget-gallery-save').click();
    await this.waitForServer();
  }

  public async removeWidget(name: string|RegExp) {
    await this.selectSectionByTitle(name);
    await this.sendCommand('deleteSection');
    await this.waitForServer();
  }

  public async addCustomSection(name: string, type: string, dataSource: string|RegExp= /Table1/) {
    await this.toggleSidePanel('right', 'open');
    await this.addNewSection(/Custom/, dataSource);
    await this.clickWidgetPane();
    await this.selectCustomWidget(type);
    await this.waitForServer();
  }

  public async setCustomWidgetAccess(option: "none" | "read table" | "full") {
    const text = {
      "none": "No document access",
      "read table": "Read selected table",
      "full": "Full document access"
    };
    await this.driver.find(`.test-config-widget-access .test-select-open`).click();
    await this.driver.findContent(`.test-select-menu li`, text[option]).click();
  }

  public async waitForFrame() {
    await driver.findWait("iframe.test-custom-widget-ready", 1000);
  }

  public async setCustomWidgetMapping(name: string, value: string | RegExp) {
    const click = async (selector: string) => {
      try {
        await driver.findWait(selector, 2000).click();
      } catch (e) {
        //sometimes here we get into "detached" state and test fail.
        //if this happened, just try one more time
        await driver.findWait(selector, 2000).click();
      }
    };
    const toggleDrop = async (selector: string) => await click(`${selector} .test-select-open`);
    const pickerDrop = (name: string) => `.test-config-widget-mapping-for-${name}`;
    await toggleDrop(pickerDrop(name));
    const clickOption = async (text: string | RegExp) => {
      await driver.findContentWait('.test-select-menu li', text, 2000).click();
      await this.waitForServer();
    };
    await clickOption(value);
  }

  public async inCustomWidget<T>(op: () => Promise<T>): Promise<T> {
    const iframe = driver.find('iframe');
    try {
      await this.driver.switchTo().frame(iframe);
      return await op();
    } finally {
      await driver.switchTo().defaultContent();
    }
  }

  // Crude, assumes a single iframe. Should elaborate.
  public async getCustomWidgetBody(selector: string = 'html'): Promise<string> {
    return this.inCustomWidget(() => this.driver.find(selector).getText());
  }

  public async getCustomWidgetElementParameter(selector: string, parameter: string): Promise<string> {
    return this.inCustomWidget(() => this.driver.find(selector).getAttribute(parameter));
  }

  public async executeScriptInCustomWidget<T>(script: Function, ...args: any[]): Promise<T> {
    return this.inCustomWidget(() => {
      return driver.executeScript(script, ...args);
    })
  }
  public async sendActionsAndWaitForServer(actions: UserAction[], optTimeout: number = 2000) {
    const result = await this.driver.executeAsyncScript(async (actions: any, done: Function) => {
      try {
        await (window as any).gristDocPageModel.gristDoc.get().docModel.docData.sendActions(actions);
        done(null);
      } catch (err) {
        done(String(err?.message || err));
      }
    }, actions);
    if (result) {
      throw new Error(result as string);
    }
    await this.waitForServer(optTimeout);
  }

  /**
   Runs a Grist command in the browser window.
  */
  public async sendCommand(name: string, argument: any = null) {
    await this.driver.executeAsyncScript((name: any, argument: any, done: any) => {
      const result = (window as any).gristApp.allCommands[name].run(argument);
      if (result?.finally) {
        result.finally(done);
      } else {
        done();
      }
    }, name, argument);
    await this.waitForServer();
  }


  public async login() {
    //just click log in to get example account.
    const menu = await this.driver.findWait('.test-dm-account', 1000);
    await menu.click();
    if (await this.isAlertShown()) {
      await this.acceptAlert();
    }
    await this.waitForServer();
  }

  public async openAccountMenu() {
    const menu = await this.driver.findWait('.test-dm-account', 1000)
    await menu.click();
    // Since the AccountWidget loads orgs and the user data asynchronously, the menu
    // can expand itself causing the click to land on a wrong button.
    await this.waitForServer();
    await this.driver.findWait('.test-dm-account-settings', 1000);
    await this.driver.sleep(250);  // There's still some jitter (scroll-bar? other user accounts?)
  }

  public async openProfileSettingsPage(): Promise<ProfileSettingsPage> {
    await this.openAccountMenu();
    await this.driver.find('.grist-floating-menu .test-dm-account-settings').click();
    //close alert if it is shown
    if (await this.isAlertShown()) {
      await this.acceptAlert();
    }
    await this.driver.findWait('.test-account-page-login-method', 5000);
    await this.waitForServer();
    return new ProfileSettingsPage(this);
  }

  /**
   * Click the Undo button and wait for server. If optCount is given, click Undo that many times.
   */
  public async undo(optCount: number = 1, optTimeout?: number) {
    for (let i = 0; i < optCount; ++i) {
      await this.driver.find('.test-undo').doClick();
    }
    await this.waitForServer(optTimeout);
  }


  /**
   * Changes browser window dimensions to FullHd for a test suite.
   */
  public bigScreen() {
    let oldDimensions: WindowDimensions;
    before(async () => {
      oldDimensions = await this.driver.manage().window().getRect();
      await this.driver.manage().window().setRect({ width: 1920, height: 1080 });
    });
    after(async () => {
      await this.driver.manage().window().setRect(oldDimensions);
    });
  }

  public async focusOnCell(columnName: string, row: number) {
    const cell = await this.getCell({ col: columnName, rowNum: row });
    await cell.click();
  }
  public async fillCell(columnName: string, row: number, value: string) {
    await this.focusOnCell(columnName, row);
    await this.driver.sendKeys(value)
    await this.driver.sendKeys(Key.ENTER);
  }

  public async addColumn(table: string, name: string) {
    // focus on table
    await this.selectSectionByTitle(table);
    // add new column using a shortcut
    await this.driver.actions().keyDown(Key.ALT).sendKeys('=').keyUp(Key.ALT).perform();
    // wait for rename panel to show up
    await this.driver.findWait('.test-column-title-popup', 1000);
    // rename and accept
    await this.driver.sendKeys(name);
    await this.driver.sendKeys(Key.ENTER);
    await this.waitForServer();
  }

  /**
   * Click into a section without disrupting cursor positions.
   */
  public async selectSectionByTitle(title: string|RegExp) {
    try {
      if (typeof title === 'string') {
        title = new RegExp("^" + escapeRegExp(title) + "$", 'i');
      }
      // .test-viewsection is a special 1px width element added for tests only.
      await this.driver.findContent(`.test-viewsection-title`, title).find(".test-viewsection-blank").click();
    } catch (e) {
      // We might be in mobile view.
      await this.driver.findContent(`.test-viewsection-title`, title).findClosest(".view_leaf").click();
    }
  }


  /**
   * Returns a visible GridView cell. Options may be given as arguments directly, or as an object.
   * - col: column name, or 0-based column index
   * - rowNum: 1-based row numbers, as visible in the row headers on the left of the grid.
   * - section: optional name of the section to use; will use active section if omitted.
   */
  public getCell(col: number | string, rowNum: number, section?: string): WebElementPromise;
  public getCell(options: ICellSelect): WebElementPromise;
  public getCell(colOrOptions: number | string | ICellSelect, rowNum?: number, section?: string): WebElementPromise {
    const mapper = async (el: WebElement) => el;
    const options: IColSelect<WebElement> = (typeof colOrOptions === 'object' ?
      { col: colOrOptions.col, rowNums: [colOrOptions.rowNum], section: colOrOptions.section, mapper } :
      { col: colOrOptions, rowNums: [rowNum!], section, mapper });
    return new WebElementPromise(this.driver, this.getVisibleGridCells(options).then((elems) => elems[0]));
  }

  /**
   * Returns visible cells of the GridView from a single column and one or more rows. Options may be
   * given as arguments directly, or as an object.
   * - col: column name, or 0-based column index
   * - rowNums: array of 1-based row numbers, as visible in the row headers on the left of the grid.
   * - section: optional name of the section to use; will use active section if omitted.
   *
   * If given by an object, then an array of columns is also supported. In this case, the return
   * value is still a single array, listing all values from the first row, then the second, etc.
   *
   * Returns cell text by default. Mapper may be `identity` to return the cell objects.
   */
  public async getVisibleGridCells(col: number | string, rows: number[], section?: string): Promise<string[]>;
  public async getVisibleGridCells<T = string>(options: IColSelect<T> | IColsSelect<T>): Promise<T[]>;
  public async getVisibleGridCells<T>(
    colOrOptions: number | string | IColSelect<T> | IColsSelect<T>, _rowNums?: number[], _section?: string
  ): Promise<T[]> {

    if (typeof colOrOptions === 'object' && 'cols' in colOrOptions) {
      const { rowNums, section, mapper } = colOrOptions;    // tslint:disable-line:no-shadowed-variable
      const columns = await Promise.all(colOrOptions.cols.map((oneCol) =>
        this.getVisibleGridCells({ col: oneCol, rowNums, section, mapper })));
      // This zips column-wise data into a flat row-wise array of values.
      return ([] as T[]).concat(...rowNums.map((_r, i) => columns.map((c) => c[i])));
    }

    const { col, rowNums, section, mapper = el => el.getText() }: IColSelect<any> = (
      typeof colOrOptions === 'object' ? colOrOptions :
        { col: colOrOptions, rowNums: _rowNums!, section: _section }
    );

    if (rowNums.includes(0)) {
      // Row-numbers should be what the users sees: 0 is a mistake, so fail with a helpful message.
      throw new Error('rowNum must not be 0');
    }

    const sectionElem = section ? await this.getSection(section) : await this.driver.findWait('.active_section', 4000);
    const colIndex = (typeof col === 'number' ? col :
      await sectionElem.findContent('.column_name', exactMatch(col)).index());

    const visibleRowNums: number[] = await sectionElem.findAll('.gridview_data_row_num',
      async (el) => parseInt(await el.getText(), 10));

    const selector = `.gridview_data_scroll .record:not(.column_names) .field:nth-child(${colIndex + 1})`;
    const fields = mapper ? await sectionElem.findAll(selector, mapper) : await sectionElem.findAll(selector);
    return rowNums.map((n) => fields[visibleRowNums.indexOf(n)]);
  }

  public getSection(sectionOrTitle: string | WebElement): WebElement | WebElementPromise {
    if (typeof sectionOrTitle !== 'string') { return sectionOrTitle; }
    return this.driver.findContent(`.test-viewsection-title`, new RegExp("^" + escapeRegExp(sectionOrTitle) + "$", 'i'))
      .findClosest('.viewsection_content');
  }
}

class ProfileSettingsPage {
  private driver: WebDriver;
  private gu: GristWebDriverUtils;

  constructor(gu: GristWebDriverUtils) {
    this.gu = gu;
    this.driver = gu.driver;
  }

  public async setLanguage(language: string) {
    await this.driver.findWait('.test-account-page-language .test-select-open', 100).click();
    await this.driver.findContentWait('.test-select-menu li', language, 100).click();
    await this.gu.waitForServer();
  }
}


export interface IColsSelect<T = WebElement> {
  cols: Array<number | string>;
  rowNums: number[];
  section?: string | WebElement;
  mapper?: (e: WebElement) => Promise<T>;
  /** Optional pattern of custom widget name to select in the gallery. */
  customWidget?: RegExp|string;
}

export interface IColSelect<T = WebElement> {
  col: number | string;
  rowNums: number[];
  section?: string | WebElement;
  mapper?: (e: WebElement) => Promise<T>;
}

export interface ICellSelect {
  col: number | string;
  rowNum: number;
  section?: string | WebElement;
}

export function exactMatch(value: string, flags?: string): RegExp {
  return new RegExp(`^${escapeRegExp(value)}$`, flags);
}
