# grist-widget
A repository of Grist custom widgets that have no back-end requirements.

# Custom hosting

To use this repository for your own Grist instance, you need to copy all the files to
your own hosting provider and recreate the manifest.json file used by Grist. 

```bash
yarn install
yarn run build
```

To tell your Grist instance to use your repository set the `GRIST_WIDGET_LIST_URL`
environmental variable to URL of the manifest.json file, for example

```bash
GRIST_WIDGET_LIST_URL=https:/<your address>/manifest.json npm start
```

# Developing

To run a local widget server in a watch mode, with automatic reload use:

```bash
yarn install
yarn run dev
```

This will start local development server that will host contents of this repository,
recreate the manifest.json file on every change and replace `grist-plugin-api.js` URL to
one provided by your own Grist instance, assuming it is available at
http://localhost:8484, to override the port use:

```bash
GRIST_PORT=<your port> yarn run dev
```

Next start Grist with an URL pointing to a local widget manifest file:

```bash
GRIST_WIDGET_LIST_URL=http://localhost:8585/manifest.json npm start
```
