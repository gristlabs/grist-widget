# Grist Custom Widget

This widget enables you to create other custom widgets for Grist documents, right inside Grist that are hosted by Grist itself.

## Getting Started

To begin developing your custom widget, follow these steps:

1. **Open the Widget Editor:** Click on the "Open configuration" button in the creator panel or clear the saved filter settings for the relevant tab.
2. **Edit Code:** Write your widget's logic in the JavaScript tab and structure its appearance in the HTML tab.
3. **Preview and Install:** Click the "Preview" button to see your widget in action. This will save the widget's code to the document's metadata.
4. **Save Configuration:** Press the "Save" button to persist the widget settings to ensure they remain active after refreshing the page.

**Note:** There is no autosave feature, so always remember to save your configuration manually.

## Data Storage

The widget's configuration data is stored in the widget's metadata using the following format:

```javascript
const options = {
    _installed: true,
    _js: `...your JavaScript code...`,
    _html: `...your HTML code...`,
};
grist.setOptions(options);
```

In the final widget, the <code>_html</code> field is inserted as is into an iframe, and the <code>_js</code> field is embedded within a script tag afterwards.

This widget in itself doesn't require any access to documents metadata, but it can be used to create widgets that do. Storing <code>Javascript</code> and <code>HTML</code> code in the metadata stores it only temporarily. User needs to save it in order to persist the changes (just like for regular <code>filters</code>).

Any contribution is welcome, the big thing missing is dark mode support.
        

## IntelliSense

The widget editor supports `IntelliSense` for the `JavaScript` code. It does it by providing its own types definitions directly to the Monaco editor. The IntelliSense is based on the official Grist Plugin API. See the `genarate.js` script for more details.