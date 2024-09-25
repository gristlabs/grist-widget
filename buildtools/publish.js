#!/usr/bin/env node

// Creates a global manifest with all published widgets. Call as:
//   node ./buildtools/publish.js manifest.json
// or:
//   node ./buildtools/publish.js manifest.json http://localhost:8585

const {execSync} = require('child_process');
const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');
const folders = fs.readdirSync(rootDir);

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

const widgets = [];

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

const indexHtml = `
  <div class="grid">
  ${widgets.map(widget => `
    <div class="widget">
      <h2>${widget.name}
      ${widget.isGristLabsMaintained ? '<span style="color: #007bff">🛡️</span>' : ''}
      </h2>
      <p>${widget.description}</p>
      <p>
      <a href="${widget.url}">Open</a>
      </p>
      <p>Author: ${widget.authors[0]?.name ?? '-'}</p>
      <p>Last updated: ${widget.lastUpdatedAt}</p>
    </div>
    `).join('')}
  </div>
  <style>
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
      gap: 1.5rem;
      margin: 20px;
    }
    .widget {
      border: 1px solid #ddd;
      box-shadow: 1px 1px 4px 1px #0000001A;
      border-radius: 4px;
    }
    h2 {
      margin-top: 0;
      background-color: #ddd;
      padding: 0.5em;
      font-size: 1.2em;
    }
    p {
      margin-left: 0.5em;
      margin-right: 0.5em;
      margin-bottom: 0.5em;
    }
    html, body {
      margin: 0;
      padding: 0;
      font-size: 13px;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Liberation Sans", Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol";
    }
</style>
`

fs.writeFileSync(path.join(rootDir, 'index.html'), indexHtml);

function replaceUrl(replacementUrl, configUrl) {
  return configUrl.replace(
    'https://gristlabs.github.io/grist-widget',
    replacementUrl
  );
}
