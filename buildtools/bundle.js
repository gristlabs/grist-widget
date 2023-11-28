#!/usr/bin/env node

/**
 *
 * This is a script to bundle up some widgets and their
 * assets into a standalone directory that could be used
 * offline. It is a little bit string and duct-tape-y,
 * sorry about that.
 *
 * Requires wget to operate. Will only bundle widgets
 * that have an "archive" field in their package.json.
 * The "archive" field can be an empty {}, or:
 *    {
 *      "domains": ["domain1.com", "domain2.com"],
 *      "entrypoints: ["https://other.page"]
 *    }
 * Material in the specified domains will also be
 * included in the bundle. Material needed by any
 * extra entry-point pages will be included as well.
 *
 * The bundle will also include grist-plugin-api.js.
 * This is not intended for use, but rather as a
 * placeholder for where Grist could serve its own
 * version of this file.
 *
 * The bundle includes a manifest.json file with
 * relative URLs to the included widgets.
 *
 * The bundle also includes a manifest.yml file to
 * describe the widgets as a plugin to Grist. The
 * clash in file names is a little unfortunate.
 *
 * Run from the root of the repository. Places results
 * the dist/plugins directory. Call as:
 *   node buildtools/bundle.js
 * To make all widgets unlisted in the UI when bundled
 * with Grist do:
 *   node buildtools/bundle.js --unlisted
 * To set the name of the bundle directory, do:
 *   node buildtools/bundle.js --name the-bundle-name
 *
 * Will run a temporary server on port 9990.
 *
 * Tested on Linux. The way wget is called may or may
 * not need tweaking to work on Windows.
 */

const { spawn, spawnSync } = require('child_process');
const { program } = require('commander');
const fs = require('fs');
const fetch = require('node-fetch');
const path = require('path');

program
  .option('--unlisted')
  .option('-n, --name <string>');

program.parse();
const { unlisted, name } = program.opts();

// This is where we will place our output.
const TARGET_DIR = `dist/plugins/${ name ?? 'grist-widget-bundle' }`;

// This is a temporary port number.
const TMP_PORT = 9990;

/**
 *
 * Gather all the steps needed for bundling.
 *
 */
class Bundler {
  constructor() {
    this.localServer = null;   // We will briefly serve widgets from here.
    this.port = TMP_PORT;      // Port for serving widgets.
    this.host = `localhost:${this.port}`;  // Host for serving widgets.
    this.renamedHost = 'widgets';          // Final directory name for widgets.
    this.assetUrl = `http://${this.host}`; // URL for serving widgets.
    this.widgets = [];         // Bundled widgets will be added here.
    this.bundledAt = null;     // A single time that applies to whole bundle.
    this.bundleRoot = null;    // Where bundle will be stored.
  }

  // Start a widget server.
  start() {
    this.localServer = spawn('python3', [
      '-m', 'http.server', this.port,
    ], {
      cwd: process.cwd(),
    });
  }

  // Wait for asset server to be responsive.
  // Note: the asset server provided index.html files that list
  // a directory's contents. This is handy for making entrypoints
  // work (e.g. providing a link to a directory full off translation
  // subdirectories can be crawled correctly) but might be a little
  // unexpected.
  async wait() {
    let ct = 0;
    while (true) {
      console.log("Waiting for asset server...", this.assetUrl);
      try {
        const resp = await fetch(this.assetUrl);
        if (resp.status === 200) {
          console.log("Found asset server", this.assetUrl);
          break;
        }
      } catch (e) {
        // we expect fetch failures initially.
      }
      await new Promise(resolve => setTimeout(resolve, 250));
      ct++;
    }
  }

  // Stop widget server.
  stop() {
    this.localServer?.kill();
    this.localServer = null;
  }

  // Go ahead and bundle widgets, assuming a widget server is running.
  bundle(targetDir) {
    // We are going to wipe the directory we bundle into, so
    // go into a subdirectory of what we were given to reduce
    // odds of deleting too much unintentially.
    this.bundleRoot = path.join(targetDir, 'archive');
    fs.rmSync(this.bundleRoot, { recursive: true, force: true });
    fs.mkdirSync(this.bundleRoot, { recursive: true });

    // Prepare the manifest file using the regular process
    // (we will edit it later).
    this.prepareManifest();

    // Read the manifest.
    const data = fs.readFileSync(this._manifestFile(), 'utf8');
    const manifest = JSON.parse(data);

    // Run through the widgets, bundling any marked with an "archive"
    // field.
    this.bundledAt = new Date();
    for (const widget of manifest) {
      if (!widget.archive) { continue; }
      console.log(`Bundling: ${widget.url}`);
      this.downloadUrl(widget.url, widget);
      // Allow for other "entrypoints" in case there is material
      // wget doesn't find. Theoretical, unused right now.
      for (const url of (widget.archive.entrypoints || [])) {
        this.downloadUrl(url, widget);
      }
      // Fix up the URL in the manifest to be relative to where
      // the widget material will be moved to.
      widget.url = widget.url.replace(
        this.assetUrl,
        './' + this.renamedHost
      );
      // Do same for entrypoint URLs - not really necessary, but feels
      // a bit cleaner to keep consistent.
      if (widget.archive?.entrypoints) {
        widget.archive.entrypoints = widget.archive.entrypoints.map(
          e => e.replace(
            this.assetUrl,
            './' + this.renamedHost
          )
        );
      }
      // Set a timestamp.
      widget.bundledAt = this.bundledAt.toISOString();
      if (unlisted) {
        widget.published = false;
      }
      this.widgets.push(widget);
    }

    // Rename material served from our asset server to a
    // directory called "widgets" instead of "localhost:NNNN".
    // In theory we should check all files for mention of
    // "localhost:NNNN" but in practice assets from that server
    // should only be referenced by other assets from that
    // server - and wget appears to sensibly make such references
    // be relative. So we can just rename the directory without
    // fuss.
    fs.renameSync(path.join(this.bundleRoot, this.host),
                  path.join(this.bundleRoot, this.renamedHost));
    this.reviseManifest();

    fs.writeFileSync(path.join(targetDir, 'manifest.yml'),
                     `name: ${name}\n` +
                     'components:\n' +
                     '  widgets: archive/manifest.json\n');
  }

  // Write out a manifest file that matches the server we are running.
  prepareManifest() {
    const manifestFile = this._manifestFile();
    const url = `http://localhost:${this.port}`;
    const cmd = `node ./buildtools/publish.js ${manifestFile} ${url}`;
    const result = spawnSync(cmd, {shell: true, stdio: 'inherit'});
    if (result.status !== 0) {
      throw new Error('failure');
    }
  }

  // Rewrite the manifest file with just the bundled widgets, and
  // with relative URLs.
  reviseManifest() {
    console.log(this.widgets);
    fs.writeFileSync(
      this._manifestFile(),
      JSON.stringify(this.widgets, null, 2));
  }

  // Download the given URL and everything it depends on using
  // wget.
  downloadUrl(url, widget) {
    const archive = widget.archive;

    // Prepare wget cmd.
    let cmd = 'wget -q --recursive --page-requisites ';
    cmd += '--no-parent --level=5 --convert-links ';
    const domains = (archive?.domains || [])
          .map(domain => this._safeDomain(domain));
    domains.push('getgrist.com');
    domains.push('localhost');
    cmd += '--span-hosts --domains ' + domains.join(',') + ' ';
    cmd += `--directory-prefix=${this.bundleRoot} ${url}`;

    // Run the wget command.
    const result = spawnSync(cmd, {shell: true, stdio: 'inherit'});
    if (result.status !== 0) {
      throw new Error(`failure running: ${cmd}`);
    }
  }

  // Quick sanity check on domains, since we'll be inserting
  // them lazily in a shell command.
  _safeDomain(domain) {
    const approxDomainNamePattern = /^[a-zA-Z0-9.:-]+$/;
    domain = String(domain);
    if (approxDomainNamePattern.test(domain)) {
      return domain;
    }
    throw new Error(`is this a domain: ${domain}`);
  }

  // Get the path to the manifest file.
  _manifestFile() {
    return path.join(this.bundleRoot, 'manifest.json');
  }
}


// Run a server, do the bundling, and then shut down the server.
async function main(targetDir) {
  const bundler = new Bundler();
  bundler.start();
  try {
    await bundler.wait();
    bundler.bundle(targetDir);
  } finally {
    bundler.stop();
  }
  console.log(`Results in ${targetDir}`);
}
main(TARGET_DIR).catch(e => console.error(e));
