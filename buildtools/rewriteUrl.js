const GRIST_PORT = process.env.GRIST_PORT || 8484;

// Simple middleware that will rewrite grist-plugin-api URL.
// We assume that Custom Widget is importing grist-plugin-api.js by including script tag:
// <script src="https://docs.getgrist.com/grist-plugin-api.js"></script>
module.exports = function (req, res, next) {
  // Rewrite only for GET method and an URL containing .htm fragment.
  if (req.url && (req.url.includes(".htm") || req.url.endsWith("/")) && req.method === 'GET') {
    // Overwrite Response's write() method.
    const origWrite = res.write;
    res.write = function (data, encoding, callback) {
      if (Buffer.isBuffer(data)) {
        data = Buffer.from(replaceUrl(data.toString('utf8')), 'utf8');
      } else if (typeof data === 'string' && data) {
        data = replaceUrl(data);
      }
      origWrite.call(this, data, encoding, callback);
    };
  }
  next();
};

function replaceUrl(data) {
  const prodUrl = 'https://docs.getgrist.com/grist-plugin-api.js';
  const devUrl = `http://localhost:${GRIST_PORT}/grist-plugin-api.js`;
  // Replace first occurrence of grist-plugin-api.js URL.
  // Add extra space at the end to match Content-Length header.
  return data.replace(prodUrl, devUrl.padEnd(prodUrl.length));
}
