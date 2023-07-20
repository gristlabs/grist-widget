import { getMochaHooks } from 'mocha-webdriver';
import { GristTestServer } from 'test/getGrist';

// Default to chrome.
if (!process.env.SELENIUM_BROWSER) {
  process.env.SELENIUM_BROWSER = "chrome";
}

if (!process.env.MOCHA_WEBDRIVER_WINSIZE) {
  process.env.MOCHA_WEBDRIVER_WINSIZE = "1024x640";
}

if (process.env.MOCHA_WEBDRIVER_STACKTRACES === undefined) {
  process.env.MOCHA_WEBDRIVER_STACKTRACES = "1";
}

if (process.env.MOCHA_WEBDRIVER_IGNORE_CHROME_VERSION === undefined) {
  process.env.MOCHA_WEBDRIVER_IGNORE_CHROME_VERSION = "1";
}

if (process.env.MOCHA_WEBDRIVER_NO_CONTROL_BANNER === undefined) {
  process.env.MOCHA_WEBDRIVER_NO_CONTROL_BANNER = "1";
}

exports.mochaHooks = getMochaHooks();

let server: GristTestServer;
exports.mochaGlobalSetup = async function() {
  server = new GristTestServer();
  await server.start();
};

exports.mochaGlobalTeardown = async function() {
  // Hack to keep Grist open if --no-exit passed, following method
  // used by mocha-webdriver. TODO: use mocha-webdriver's useServer.
  const noexit: boolean = process.argv.includes("--no-exit") || process.argv.includes('-E');
  if (noexit) {
    console.log("Keeping Grist open");
  } else {
    await server.stop();
  }
};
