# grist-widget
A repository of grist custom widgets that have no back-end requirements.

# Building

To recreate manifest.json file used by Grist use:

```bash
yarn run build
```

# Testing locally

To run local widget server in watch mode and with automatic reload use:

```bash
yarn install
yarn run dev
```

Next start Grist with an URL pointing to a local widget manifest file:

```bash
GRIST_WIDGET_LIST_URL=http://localhost:8585/manifest.json npm start
```