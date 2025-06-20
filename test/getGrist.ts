import {ChildProcess, execSync, spawn} from 'child_process';
import FormData from 'form-data';
import fs from 'fs';
import { driver, enableDebugCapture } from 'mocha-webdriver';
import fetch from 'node-fetch';

import {Key} from 'mocha-webdriver';
import {GristWebDriverUtils} from "test/gristWebDriverUtils";

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

    // Make sure rewriteUrl.js is available in the buildtools directory.
    if (!fs.existsSync(`${pwd}/buildtools/rewriteUrl.js`)) {
      throw new Error(`Expected buildtools/rewriteUrl.js to exist at ${pwd}/buildtools/rewriteUrl.js`);
    }

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

  // This method doesn't work in single user mode, need to fix upstream.
  // For now it is  just overridden with a simpler version.
  public override async openAccountMenu() {
    await this.driver.findWait('.test-dm-account', 2000).click();
    await this.driver.sleep(250); 
  }

  public async clickWidgetGallery() {
    const elem = this.driver.find('.test-custom-widget-gallery-container');
    if (await elem.isPresent()) {
      await elem.click();
    }
  }

  public async clickWidgetSection() {
    await driver.findWait('.custom_view_container', 100).click();
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

  public async forceDismissTips() {
    try {
      await this.driver.findWait('.test-dp-add-new', 2000).doClick();
      await this.driver.findWait('.test-dp-add-widget-to-page', 500).doClick();
      await this.driver.sendKeys(Key.ESCAPE);
      await this.driver.findWait('.test-behavioral-prompt-dont-show-tips', 500).click();
      await this.driver.find('.test-behavioral-prompt-dismiss').click();
      await this.waitForServer();
    } catch (e) {
      // If the tips are not shown, this will fail. Ignore.
      console.warn("Behavioral prompt not shown, ignoring.");
    }
  }

  public async addCustomSection(name: string, type: string, dataSource: string|RegExp= /Table1/) {
    await this.addNewSection(/Custom/, dataSource, {dismissTips: true});
    await this.clickWidgetGallery();
    await this.selectCustomWidget(type);
    await this.waitForServer();
    await this.toggleSidePanel('right', 'open');
  }

  public async setCustomWidgetAccess(option: "none" | "read table" | "full") {
    const text = {
      "none": "No document access",
      "read table": "Read selected table",
      "full": "Full document access"
    };
    await this.driver.find(`.test-config-widget-access .test-select-open`).click();
    await this.driver.findContentWait(`.test-select-menu li`, text[option], 100).click();
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

  public async login() {
    //just click log in to get example account.
    const menu = await this.driver.findWait('.test-dm-account', 1000);
    await menu.click();
    if (await this.isAlertShown()) {
      await this.acceptAlert();
    }
    await this.waitForServer();
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

  public async focusOnCell(columnName: string, row: number) {
    const cell = await this.getCell({ col: columnName, rowNum: row });
    await cell.click();
  }

  public async fillCell(columnName: string, row: number, value: string) {
    await this.focusOnCell(columnName, row);
    await this.driver.sendKeys(value)
    await this.driver.sendKeys(Key.ENTER);
    await this.waitForServer();
  }
}
