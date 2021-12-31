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
        // Replace first occurrence of grist-plugin-api.js URL.
        data = data.replace(
          'https://docs.getgrist.com/grist-plugin-api.js',
          'http://localhost:8080/grist-plugin-api.js    ' // extra space for length match
        );
      }
      _writeRaw(data, encoding, callback);
    };
  }
  next();
};
