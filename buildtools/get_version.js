#!/usr/bin/env node

// Computes the desired root package.json version by detecting version bumps
// in tracked widget packages (those with a .grist[].archive property).
//
// Scans each subdirectory for a package.json with a grist[].archive entry.
// Compares each tracked package's version against buildtools/version-cache.json:
//   - New package (not in cache)  → minor bump
//   - Major version changed       → major bump
//   - Minor version changed       → minor bump
//   - Patch version changed       → patch bump
//   - Unparseable version         → error
// The most severe bump across all tracked packages is applied to the root
// package.json version. The computed version is written to stdout.
//
// Usage:
//   node get_version.js                  # prints the computed version (read-only)
//   node get_version.js --update-cache   # also updates version-cache.json
//
// E.g. for a root package.json at 1.0.0
//   - Calendar version from 0.0.5 -> 0.0.6 bumps package.json to 1.0.1
//   - Calendar version from 0.0.5 -> 0.1.0 bumps package.json to 1.1.0
//   - Calendar version from 0.0.5 -> 1.0.0 bumps package.json to 2.0.0

const fs = require('fs');
const path = require('path');
const semver = require('semver');

const rootDir = path.join(__dirname, '..');
const cacheFile = path.join(__dirname, 'version-cache.json');

// Severity ranking for picking the worst bump across packages.
const SEVERITY = {major: 3, minor: 2, patch: 1};
const SEVERITY_TO_TYPE = {3: 'major', 2: 'minor', 1: 'patch'};

function validateVersion(str) {
  if (!semver.valid(str)) {
    throw new Error(`Unparseable semver version: "${str}"`);
  }
}

function determineBumpSeverity(oldVer, newVer) {
  validateVersion(oldVer);
  validateVersion(newVer);
  const diff = semver.diff(oldVer, newVer);
  if (!diff) return 0;
  // semver.diff can return premajor/preminor/prepatch/prerelease —
  // map those to their base bump type.
  if (diff.includes('major')) return SEVERITY.major;
  if (diff.includes('minor')) return SEVERITY.minor;
  return SEVERITY.patch;
}

function getConsideredPackages() {
  const entries = fs.readdirSync(rootDir, {withFileTypes: true});
  const result = [];
  for (const entry of entries) {
    if (!entry.isDirectory()) { continue; }
    const pkgPath = path.join(rootDir, entry.name, 'package.json');
    if (!fs.existsSync(pkgPath)) { continue; }
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
    if (!pkg.grist) { continue; }
    // Normalize to array (same pattern as publish.js:65).
    const configs = Array.isArray(pkg.grist) ? pkg.grist : [pkg.grist];
    const isRelevantToBundle = configs.some(c => c && c.archive);
    if (isRelevantToBundle) {
      result.push({name: pkg.name, version: pkg.version});
    }
  }
  return result;
}

function main() {
  const considered = getConsideredPackages();

  // Load cache.
  let cache = {};
  if (fs.existsSync(cacheFile)) {
    try {
      cache = JSON.parse(fs.readFileSync(cacheFile, 'utf-8'));
    } catch (e) {
      throw new Error(`Failed to parse version cache at ${cacheFile}: ${e.message}`);
    }
  }

  // Determine most severe bump.
  let worstSeverity = 0;
  for (const pkg of considered) {
    const severity = !(pkg.name in cache) ? SEVERITY.minor : determineBumpSeverity(cache[pkg.name], pkg.version);
    worstSeverity = Math.max(worstSeverity, severity);
  }
  const worstBump = SEVERITY_TO_TYPE[worstSeverity] || null;

  // Read current root version.
  const rootPkg = JSON.parse(fs.readFileSync(path.join(rootDir, 'package.json'), 'utf-8'));
  const currentVersion = rootPkg.version;
  validateVersion(currentVersion);

  // Compute new version.
  const newVersion = worstBump ? semver.inc(currentVersion, worstBump) : currentVersion;

  // Output the desired version.
  console.log(newVersion);

  // Only update cache when explicitly requested.
  if (process.argv.includes('--update-cache')) {
    writeCache(cache, considered);
  }
}

function writeCache(cache, considered) {
  for (const pkg of considered) {
    cache[pkg.name] = pkg.version;
  }
  fs.writeFileSync(cacheFile, JSON.stringify(cache, null, 2) + '\n');
}

main();
