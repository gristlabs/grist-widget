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
  lrMiddleware(req, res, () => {
    rewrite(req, res, () => {
      serve(req, res);
    });
  });
}).listen(WIDGETS_PORT, () => {
  console.log(`Server running on: http://localhost:${WIDGETS_PORT}`);
});
