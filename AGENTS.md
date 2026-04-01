# AGENTS.md

Guide for agents working in the grist-widget repository.

## Project Overview

This is a repository of **Grist custom widgets** - standalone web applications that run inside Grist documents. Each widget is a self-contained directory with its own `index.html` and `package.json`. Widgets have no backend requirements; they communicate with Grist via the Grist Plugin API.

## Essential Commands

### Development

```bash
# Install dependencies
yarn install

# Start development server with watch mode and live reload
yarn run dev

# Start development server (alternative, combined with Grist docker)
yarn run grist:dev

# Build for development (local URL in manifest)
yarn run build:dev

# Serve the widget repository locally
yarn run serve
yarn run serve:dev  # with live reload middleware
```

### Building

```bash
# Full build (install, submodules, TypeScript compile, manifest generation)
yarn run build

# Generate manifest.json only
yarn run publish
```

### Testing

```bash
# Run tests (requires Docker with gristlabs/grist image)
yarn run test

# Run tests in CI mode (headless)
yarn run test:ci

# Run tests with debug mode (keeps Grist open, no cleanup)
yarn run test:debug
```

### Running Grist with Local Widgets

```bash
# Run Grist docker configured to use local widget manifest
yarn run grist

# Combined: build, serve widgets, and run Grist
yarn run grist:serve
```

## Project Structure

```
grist-widget/
├── buildtools/           # Build scripts and TypeScript config
│   ├── publish.js        # Generates manifest.json from widget directories
│   ├── dev-server.js     # Development server with live reload
│   ├── bundle.js         # Bundling for distribution
│   └── tsconfig-base.json
├── test/                 # Integration tests (TypeScript)
│   ├── getGrist.ts       # Test utilities for Grist interaction
│   ├── gristWebDriverUtils.ts
│   ├── init-mocha-webdriver.ts
│   └── fixtures/         # Test documents (.grist files)
├── <widget-name>/        # Each widget is in its own directory
│   ├── index.html        # Required entrypoint
│   ├── package.json      # Required - contains grist config
│   └── *.js/css          # Widget implementation
├── external.jsonc        # Configuration for external/submodule widgets
├── manifest.json         # Generated - list of all published widgets
└── package.json          # Root project configuration
```

## Widget Structure

Each widget directory must contain:

1. **`index.html`** - The HTML entrypoint. Must include the Grist Plugin API:
   ```html
   <script src="https://docs.getgrist.com/grist-plugin-api.js"></script>
   ```

2. **`package.json`** - Must include a `grist` configuration section:
   ```json
   {
     "name": "@gristlabs/widget-example",
     "grist": {
       "name": "Example Widget",
       "widgetId": "@gristlabs/widget-example",
       "url": "https://gristlabs.github.io/grist-widget/example/index.html",
       "published": true,
       "accessLevel": "full",
       "description": "Widget description",
       "authors": [{ "name": "Grist Labs", "url": "https://github.com/gristlabs" }]
     }
   }
   ```

### Widget Configuration Fields

- `name`: Display name in Grist widget gallery
- `widgetId`: Unique identifier (use `@gristlabs/widget-*` for Grist Labs widgets)
- `url`: URL to the widget's index.html
- `published`: Set to `true` to include in manifest
- `accessLevel`: `"none"`, `"read table"`, or `"full"`
- `renderAfterReady`: Wait for `grist.ready()` before rendering
- `columns`: Array of column mappings the widget expects
- `description`: Short description for the widget gallery
- `isGristLabsMaintained`: Set to `true` for official Grist Labs widgets

### Multiple Widgets in One Directory

A single directory can define multiple widgets by using an array in `grist`:
```json
{
  "grist": [
    { "widgetId": "widget-1", ... },
    { "widgetId": "widget-2", ... }
  ]
}
```

## Code Patterns

### Widget Implementation Pattern (Plain JavaScript)

```javascript
function ready(fn) {
  if (document.readyState !== 'loading') {
    fn();
  } else {
    document.addEventListener('DOMContentLoaded', fn);
  }
}

ready(function() {
  // Initialize widget and declare requirements
  grist.ready({
    columns: [
      { name: "Column1", title: "Column 1", type: "Text" },
      { name: "Column2", title: "Column 2", optional: true }
    ],
    requiredAccess: 'read table'
  });

  // Handle data updates
  grist.onRecord(function(record, mappings) {
    const data = grist.mapColumnNames(record, mappings);
    // Update UI with data
  });

  // Or handle all records at once
  grist.onRecords(function(records, mappings) {
    const data = grist.mapColumnNames(records, mappings);
    // Update UI with all records
  });
});
```

### Widget Implementation Pattern (TypeScript)

TypeScript widgets (like `timeline/`) have their own `tsconfig.json` and build process:
```json
{
  "scripts": {
    "build": "esbuild index.ts --bundle --sourcemap --outdir=out",
    "dev": "esbuild index.ts --bundle --sourcemap --outdir=out --watch"
  }
}
```

The TypeScript type definitions are in `inspect/grist-plugin-api.d.ts`.

### Grist API Key Methods

- `grist.ready(options)`: Declare widget requirements and initialize
- `grist.onRecord(callback)`: Called when cursor row changes or updates
- `grist.onRecords(callback)`: Called when any record changes
- `grist.mapColumnNames(data, mappings)`: Apply column mapping to data
- `grist.mapColumnNamesBack(data, mappings)`: Reverse mapping for edits
- `grist.docApi.applyUserActions(actions)`: Write data back to Grist
- `grist.getTable(tableId?)`: Get table operations interface
- `grist.setOptions(options)` / `grist.getOptions()`: Persist widget settings

## Testing

Tests use **mocha-webdriver** with Selenium against a Docker Grist instance.

### Test Setup

1. Tests require `gristlabs/grist` Docker image
2. A local server hosts widgets at port 9998
3. Grist runs in Docker at port 9999
4. Tests use `MOCHA_WEBDRIVER_HEADLESS=1` for CI

### Test Structure

```typescript
import { assert, driver } from 'mocha-webdriver';
import { getGrist } from './getGrist';

describe('widget name', function() {
  this.timeout('30s');
  const grist = getGrist();

  it('should do something', async function() {
    const docId = await grist.upload('test/fixtures/docs/Doc.grist');
    await grist.openDoc(docId);
    await grist.addNewSection(/Custom/, /TableName/);
    await grist.selectCustomWidget(/WidgetName/);
    // Test assertions...
  });
});
```

### Running Specific Tests

```bash
GREP_TESTS="calendar" yarn run test
```

## External Widgets

External widgets (from submodules) are configured in `external.jsonc`:
```json
{
  "varamil/simplefilter": {
    "url": "https://gristlabs.github.io/grist-widget/varamil/simplefilter/index.html",
    "widgetId": "@varamil/widget-simplefilter",
    "isGristLabsMaintained": false
  }
}
```

## TypeScript Configuration

- Base config: `buildtools/tsconfig-base.json`
- Target: ES2017, CommonJS modules
- Output: `_build/` directory
- Strict mode enabled
- Tests have their own `test/tsconfig.json`

## Important Gotchas

1. **Manifest Generation**: The `publish.js` script scans all directories with `index.html` and `package.json`, looking for `grist` config with `published: true`.

2. **URL Replacement**: During local development, widget URLs are rewritten to `http://localhost:8585` instead of `https://gristlabs.github.io/grist-widget`.

3. **Access Levels**: Widgets requesting `"full"` access can write to the document. Request `"read table"` for read-only, `"none"` for no data access.

4. **Column Mapping**: Always use `grist.mapColumnNames()` to handle user-configured column mappings.

5. **Docker Required**: Tests require Docker to run Grist. Use `yarn run pretest` to pull and prepare.

6. **No Autosave**: The custom-widget-builder explicitly warns users there's no autosave.

7. **i18n**: Some widgets (calendar) have i18n support via translation JSON files in `i18n/<locale>/translation.json`.

8. **Archive Domains**: For widgets loading external resources, list allowed domains in `archive.domains` in the grist config.