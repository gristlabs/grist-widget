/**
 * Runs a dev server for developing custom widgets. It does a few things:
 * (1) Serve everything from the current directory. E.g. it allows access to /map/index.html.
 * (2) When it responds with an HTML page containing 'https://docs.getgrist.com/grist-plugin-api.js',
 *     it replaces that with `http://localhost:${GRIST_PORT}/grist-plugin-api.js`.
 *     This way, when running against a dev Grist server, it will use the API library from that
 *     dev server. See rewriteUrl.js for details.
 */
const http = require('node:http');
const sirv = require('sirv');
const livereload = require('livereload');
const connectLR = require('connect-livereload');
const rewrite = require('./rewriteUrl');

const WIDGETS_PORT = process.env.PORT || 8585;

livereload.createServer().watch('.');
const lrMiddleware = connectLR();
const serve = sirv('.', { dev: true });

http.createServer((req, res) => {
  // Redirect /foo to /foo/
  const url = new URL(req.url, 'http://localhost/');
  if (!url.pathname.endsWith('/') && !url.pathname.includes('.')) {
    res.statusCode = 301;
    res.setHeader('Location', url.pathname + '/' + url.search + url.hash);
    return res.end();
  }
  lrMiddleware(req, res, () => {
    rewrite(req, res, () => {
      serve(req, res);
    });
  });
}).listen(WIDGETS_PORT, () => {
  console.log(`Server running on: http://localhost:${WIDGETS_PORT}`);
});
