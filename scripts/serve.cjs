/* A tiny static server for the built site.
   It serves the `dist/` folder that Vite produces, under the same
   `/Portfolio/` path that GitHub Pages uses, so that the checks
   exercise the real sub-path behaviour rather than a convenience
   root. */
const http = require('http');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const site = path.join(root, 'dist');

const mime = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
  '.py': 'text/plain; charset=utf-8',
  '.JS': 'application/javascript; charset=utf-8',
};

const server = http.createServer((req, res) => {
  let relative;

  try {
    relative = decodeURIComponent(
      new URL(req.url, 'http://localhost').pathname
    ).replace(/^\/Portfolio(?=\/|$)/, '');
  } catch (error) {
    res.writeHead(400);
    return res.end('Bad request');
  }

  let target = path.resolve(site, '.' + (relative || '/'));

  if (!target.startsWith(site + path.sep) && target !== site) {
    res.writeHead(403);
    return res.end('Forbidden');
  }

  if (fs.existsSync(target) && fs.statSync(target).isDirectory()) {
    target = path.join(target, 'index.html');
  }

  fs.readFile(target, (error, data) => {
    res.writeHead(error ? 404 : 200, {
      'Content-Type': mime[path.extname(target).toLowerCase()]
        || 'application/octet-stream',
      'Cache-Control': 'no-store',
    });
    res.end(error ? 'Not found' : data);
  });
});

if (require.main === module) {
  server.listen(8000, '127.0.0.1', () =>
    console.log('TECH\'STAMENT: http://127.0.0.1:8000/Portfolio/')
  );
}

module.exports = server;
