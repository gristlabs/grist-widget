import {ChildProcess, execSync, spawn} from 'child_process';
import FormData from 'form-data';
import fs from 'fs';
import {driver} from 'mocha-webdriver';
import fetch from 'node-fetch';

import {GristWebDriverUtils} from 'test/gristWebDriverUtils';


type UserAction = Array<string | number | object | boolean | null | undefined>;

/**
 * Set up mocha hooks for starting and stopping Grist. Return
 * an interface for interacting with Grist.
 */
export function getGrist(): GristUtils {
  const server = new GristTestServer();
  const grist = new GristUtils(server);

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
      ` --network="host"` +
      ` -e PORT=${gristPort} -p ${gristPort}:${gristPort}` +
      ` -e GRIST_SINGLE_ORG=${serverSettings.site}` +
      ` -e GRIST_WIDGET_LIST_URL=http://localhost:${contentPort}/manifest.json` +
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
    return `http://localhost:${contentPort}`;
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

  public async sendActionsAndWaitForServer(actions: UserAction[], optTimeout: number = 2000) {
    const result = await driver.executeAsyncScript(async (actions: any, done: Function) => {
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

  public async clickWidgetPane() {
    const elem = this.driver.find('.test-config-widget-select .test-select-open');
    if (await elem.isPresent()) {
      await elem.click();
      // if not present, may just be already selected.
    }
  }

  public async selectCustomWidget(text: string | RegExp) {
    await this.driver.findContent('.test-select-menu li', text).click();
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

  // Crude, assumes a single iframe. Should elaborate.
  public async getCustomWidgetBody(selector: string = 'html'): Promise<string> {
    const iframe = this.driver.find('iframe');
    try {
      await this.driver.switchTo().frame(iframe);
      return await this.driver.find(selector).getText();
    } finally {
      await this.driver.switchTo().defaultContent();
    }
  }

  public async executeScriptOnCustomWidget<T>(script: string | Function): Promise<T> {
    const iframe = this.driver.find('iframe');
    try {
      await this.driver.switchTo().frame(iframe);
      const jsValue = await this.driver.executeScript(script);
      return jsValue as T;
    } finally {
      await this.driver.switchTo().defaultContent();
    }
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
}
