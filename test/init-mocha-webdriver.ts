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

const {getMochaHooks} = require('mocha-webdriver');
exports.mochaHooks = getMochaHooks();

