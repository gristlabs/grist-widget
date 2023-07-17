const GRIST_PORT = process.env.GRIST_PORT || 8484;

// Simple middleware that will rewrite grist-plugin-api URL.
// We assume that Custom Widget is importing grist-plugin-api.js by including script tag:
// <script src="https://docs.getgrist.com/grist-plugin-api.js"></script>
module.exports = function (req, res, next) {
  // Rewrite only for GET method and an URL containing .htm fragment.
  if (req.url && req.url.includes(".htm") && req.method === 'GET') {
    // Overwrite Response internal _writeRaw method.
    const _writeRaw = res._writeRaw.bind(res);
    res._writeRaw = function (data, encoding, callback) {
      // Make sure that the Response data is a string.
      if (typeof data === 'string' && data) {
        const prodUrl = 'https://docs.getgrist.com/grist-plugin-api.js';
        const devUrl = `http://localhost:${GRIST_PORT}/grist-plugin-api.js`;
        // Replace first occurrence of grist-plugin-api.js URL.
        // Add extra space at the end to match Content-Length header.
        data = data.replace(prodUrl, devUrl.padEnd(prodUrl.length));
      }
      _writeRaw(data, encoding, callback);
    };
  }
  next();
};
