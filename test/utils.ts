import { ChildProcess, execSync, spawn } from 'child_process';
import fetch from 'node-fetch';
const FormData = require('form-data');
const fs = require('fs');
import {driver} from 'mocha-webdriver';

import {GristWebDriverUtils} from 'test/gristWebDriverUtils';

const gristSettings = {
  containerName: 'grist-test',
  port: 9999,
  port2: 9998,
  site: 'gristy',
};

interface IGristServer {
  url: string;
}

export class GristTestServer implements IGristServer {
  private _assetServer?: ChildProcess;

  public async start() {
    await this.stop();
    const {port, port2} = gristSettings;
    const cmd = `docker run -d --rm --name ${gristSettings.containerName}` +
      ` --network="host"` +
      ` -q` +
      ` -e PORT=${port} -p ${port}:${port}` +
      ` -e GRIST_SINGLE_ORG=${gristSettings.site}` +
      ` -e GRIST_WIDGET_LIST_URL=http://localhost:${port2}/manifest.json` +
      ` gristlabs/grist`;
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
      `--port=${port2}`, '--no-browser', '-q',
      `--middleware=${pwd}/buildtools/rewriteUrl.js`
    ], {
      env: {
        ...process.env,
        GRIST_PORT: String(port),
      },
    });
  }

  public async stop() {
    try {
      execSync(`docker kill ${gristSettings.containerName}`, {
        stdio: 'pipe'
      });
    } catch (e) {
      // fine if kill fails.
    }
    try {
      execSync(`docker rm ${gristSettings.containerName}`, {
        stdio: 'pipe'
      });
    } catch (e) {
      // fine if rm fails.
    }
    if (this._assetServer) {
      this._assetServer.kill();
      this._assetServer = undefined;
    }
  }

  public get url() {
    const {port} = gristSettings;
    return `http://localhost:${port}`;
  }

  public get assetUrl() {
    const {port2} = gristSettings;
    return `http://localhost:${port2}`;
  }
}

export class GristUtils extends GristWebDriverUtils {
  public constructor(public server: GristTestServer) {
    super(driver);
  }

  public get url() {
    return this.server.url;
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
        if (resp.status === 200) { break; }
      } catch (e) {
        // we expect fetch failures.
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
        if (resp.status === 200) { break; }
      } catch (e) {
        // we expect fetch failures.
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

  public async setCustomWidgetAccess(option: "none"|"read table"|"full") {
    const text = {
      "none" : "No document access",
      "read table": "Read selected table",
      "full": "Full document access"
    };
    await this.driver.find(`.test-config-widget-access .test-select-open`).click();
    await this.driver.findContent(`.test-select-menu li`, text[option]).click();
  }

  // Crude, should elaborate.
  public async getCustomWidgetBody(): Promise<string> {
    const iframe = driver.find('iframe');
    try {
      await this.driver.switchTo().frame(iframe);
      return await driver.find('html').getText();
    } finally {
      await driver.switchTo().defaultContent();
    }
  }
}

export function makeGrist(): GristUtils {
  const server = new GristTestServer();
  const grist = new GristUtils(server);

  before(async function() {
    await server.start();
    await grist.wait();
  });

  after(async function() {
    await server.stop();
  });
  return grist;
}

