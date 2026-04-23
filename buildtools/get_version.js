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

const rootDir = path.join(__dirname, '..');
const cacheFile = path.join(__dirname, 'version-cache.json');


const BUMP_NONE  = 0;
const BUMP_PATCH = 1;
const BUMP_MINOR = 2;
const BUMP_MAJOR = 3;
// Maps severity level back to a bump type string for applyBump().
const BUMP_TYPES = [null, 'patch', 'minor', 'major'];

function parseSemver(str) {
  const m = /^(\d+)\.(\d+)\.(\d+)$/.exec(String(str || ''));
  if (!m) { return null; }
  return {major: Number(m[1]), minor: Number(m[2]), patch: Number(m[3])};
}

function formatSemver({major, minor, patch}) {
  return `${major}.${minor}.${patch}`;
}

function determineBumpType(oldVer, newVer) {
  const oldSv = parseSemver(oldVer);
  const newSv = parseSemver(newVer);
  if (!oldSv || !newSv) { return BUMP_MAJOR; }
  if (newSv.major !== oldSv.major) { return BUMP_MAJOR; }
  if (newSv.minor !== oldSv.minor) { return BUMP_MINOR; }
  if (newSv.patch !== oldSv.patch) { return BUMP_PATCH; }
  return BUMP_NONE;
}

function applyBump(version, bumpType) {
  const sv = parseSemver(version);
  if (!sv) { throw new Error(`Unparseable root version: ${version}`); }
  if (bumpType === 'major') {
    return formatSemver({major: sv.major + 1, minor: 0, patch: 0});
  }
  if (bumpType === 'minor') {
    return formatSemver({major: sv.major, minor: sv.minor + 1, patch: 0});
  }
  if (bumpType === 'patch') {
    return formatSemver({major: sv.major, minor: sv.minor, patch: sv.patch + 1});
  }
  return version;
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
    try { cache = JSON.parse(fs.readFileSync(cacheFile, 'utf-8')); } catch (e) { cache = {}; }
  }

  // Determine most severe bump.
  let worstSeverity = BUMP_NONE;
  for (const pkg of considered) {
    const severity = !(pkg.name in cache) ? BUMP_MINOR : determineBumpType(cache[pkg.name], pkg.version);
    worstSeverity = Math.max(worstSeverity, severity);
  }
  const worstBump = BUMP_TYPES[worstSeverity];

  // Read current root version.
  const rootPkg = JSON.parse(fs.readFileSync(path.join(rootDir, 'package.json'), 'utf-8'));
  const currentVersion = rootPkg.version;

  // Compute new version.
  const newVersion = worstBump ? applyBump(currentVersion, worstBump) : currentVersion;

  // Output the desired version.
  process.stdout.write(newVersion);

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
