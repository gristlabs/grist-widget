const http = require('node:http');
const sirv = require('sirv');
const rewrite = require('./rewriteUrl');

const WIDGETS_PORT = process.env.PORT || 8585;

const serve = sirv('.', { dev: true });

http.createServer((req, res) => {
  rewrite(req, res, () => serve(req, res));
}).listen(WIDGETS_PORT);
