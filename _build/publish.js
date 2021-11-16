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
  const config = packageJson.grist;
  if (!config || !config.widgetId || !config.name || !config.url) {
    console.debug("Package folder " + folder);
    console.debug("Configuration " + JSON.stringify(config));
    throw new Error(`Package in ${folder} is not configured correctly.`);
  }
  if (config.published) {
    console.log('Publishing ' + config.widgetId);
    widgets.push(config);
  }
}

fs.writeFileSync(path.join(rootDir, 'manifest.json'), JSON.stringify(widgets, null, 2));
