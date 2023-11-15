#!/usr/bin/env node

// Creates a global manifest with all published widgets. Call as:
//   node ./buildtools/publish.js manifest.json
// or:
//   node ./buildtools/publish.js manifest.json http://localhost:8585

const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');
const folders = fs.readdirSync(rootDir);

const manifestFile = process.argv[2];
const replacementUrl = process.argv[3]

if (!manifestFile) {
  throw new Error('please call with the file to build');
}

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
      if (replacementUrl) {
        if (config.url) {
          config.url = replaceUrl(replacementUrl, config.url);
        }
        if (config.archive?.entrypoints) {
          config.archive.entrypoints = config.archive.entrypoints.map(
            e => replaceUrl(replacementUrl, e)
          );
        }
      }
      widgets.push(config);
    }
  }
}

fs.writeFileSync(manifestFile, JSON.stringify(widgets, null, 2));

function replaceUrl(replacementUrl, configUrl) {
  return configUrl.replace(
    'https://gristlabs.github.io/grist-widget',
    replacementUrl
  );
}
