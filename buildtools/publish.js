#!/usr/bin/env node

// Creates a global manifest with all published widgets. Call as:
//   node ./buildtools/publish.js manifest.json
// or:
//   node ./buildtools/publish.js manifest.json http://localhost:8585

const {execSync} = require('child_process');
const fs = require('fs');
const path = require('path');
const jsonc = require('jsonc');

const rootDir = path.join(__dirname, '..');
let folders = fs.readdirSync(rootDir);

const manifestFile = process.argv[2];
const replacementUrl = process.argv[3]

if (!manifestFile) {
  throw new Error('please call with the file to build');
}

function isWidgetDir(dir) {
  const indexHtmlFile = path.join(dir, 'index.html');
  const packageFile = path.join(dir, 'package.json');
  return fs.existsSync(indexHtmlFile) && fs.existsSync(packageFile);
}

const ALLOWED = jsonc.parse(fs.readFileSync(path.join(rootDir, 'external.jsonc'), 'utf-8').trim());

// By default remove submodules from the list of folders.
folders = folders.filter(folder => {
  if (listSubmodules(rootDir).includes(folder)) { return false; }
  return true;
});

// And insert allowed folders back.
folders.push(...Object.keys(ALLOWED));

const widgets = [];

const widgetIds = new Set();

for (const folder of folders) {
  const dir = path.join(rootDir, folder);
  if (!fs.statSync(dir).isDirectory() || !isWidgetDir(dir)) { continue; }

  const packageFile = path.join(dir, 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageFile));
  let configs = packageJson.grist; 
  if (!configs) {
    console.warn(`Package in ${folder} is missing grist configuration section.`);
    continue;
  }

  // If this is en external widget, we might have overrides.
  if (ALLOWED[folder]) {
    // External modules can only have a single config.
    configs = Array.isArray(configs) ? configs[0] : configs;
    configs = Object.assign({}, configs, ALLOWED[folder]);
  }

  // Config can be either an object or a list of objects. List of objects defines
  // multiple widget in a single widget package.
  configs = Array.isArray(configs) ? configs : [configs];
  for (const config of configs) {
    if (!config || !config.widgetId || !config.name || !config.url) {
      console.debug(`${folder} config:`, config);
      throw new Error(`Package in ${folder} is misconfigured.`);
    }

    if (widgetIds.has(config.widgetId)) {
      throw new Error(`Duplicate widgetId ${config.widgetId} in ${folder}`);
    }
    widgetIds.add(config.widgetId);

    if (config.published) {
      if (Object.keys(ALLOWED).includes(folder)) {
        console.warn(`Publishing external widget ${config.widgetId} from ${folder}`);
      } else {
        console.log('Publishing ' + config.widgetId);
      }
      config.lastUpdatedAt = execSync(`git log -1 --format=%cI package.json`, {cwd: dir, encoding: 'utf8'})
        .trimEnd();
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


function listSubmodules(repoRoot) {
  const gitmodulesPath = path.join(repoRoot, '.gitmodules');
  if (!fs.existsSync(gitmodulesPath)) {
    return []; // No submodules
  }
  const stdout = execSync(
    'git config --file .gitmodules --get-regexp path',
    { cwd: repoRoot, encoding: 'utf-8' }
  );
  return stdout.split('\n').map(line => line.split(' ')[1]);
}
