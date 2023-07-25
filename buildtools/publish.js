#!/usr/bin/env node

// Creates a global manifest with all published widgets.

const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');
const folders = fs.readdirSync(rootDir);

function isWidgetDir(folder) {
  const indexHtmlFile = path.join(rootDir, folder, 'index.html');
  const packageFile = path.join(rootDir, folder, 'package.json');
  return fs.existsSync(indexHtmlFile) && fs.existsSync(packageFile);
}

const widgets = [];

for (const folder of folders) {
  if (!fs.statSync(folder).isDirectory()) {
    continue;
  }
  if (!isWidgetDir(folder)) {
    continue;
  }
  const packageFile = path.join(rootDir, folder, 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageFile));
  let configs = packageJson.grist;
  if (!configs) {
    console.warn(`Package in ${folder} is missing grist configuration section.`);
    continue;
  }
  // Config can be either an object or a list of objects. List of objects defines
  // multiple widget in a single widget package.
  configs = Array.isArray(configs) ? configs : [configs];
  for (const config of configs) {
    if (!config || !config.widgetId || !config.name || !config.url) {
      console.debug(`${folder} config:`, config);
      throw new Error(`Package in ${folder} is misconfigured.`);
    }
    if (config.published) {
      console.log('Publishing ' + config.widgetId);
      // If we have custom server url as a first argument for local testing,
      // replace widget url.
      if (process.argv[2] && config.url) {
        config.url = config.url.replace(
          'https://gristlabs.github.io/grist-widget',
          process.argv[2]
        );
      }
      widgets.push(config);
    }
  }
}

fs.writeFileSync(path.join(rootDir, 'manifest.json'), JSON.stringify(widgets, null, 2));
