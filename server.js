import http from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
const root = path.dirname(new URL(import.meta.url).pathname);
const types = {'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.png':'image/png'};
http.createServer(async (req,res) => {
  try {
    const pathname = decodeURIComponent(new URL(req.url,'http://localhost').pathname);
    if (!['/', '/index.html', '/style.css', '/app.js', '/engine.js', '/art.js', '/tower-art.js', '/assets/crossbow-directions.png', '/assets/cannon-directions.png', '/assets/venice-atlas.png', '/assets/venice-stone.png', '/assets/arsenal-gate.png'].includes(pathname)) throw Error();
    const file = path.resolve(root, '.' + (pathname === '/' ? '/index.html' : pathname));
    if (!file.startsWith(root + '/')) throw Error();
    const body = await readFile(file);
    res.writeHead(200, {'Content-Type':types[path.extname(file)] || 'application/octet-stream'});res.end(body);
  } catch {res.writeHead(404);res.end('Not found');}
}).listen(Number(process.env.PORT) || 3000,'0.0.0.0',()=>console.log('Lagoon Guard listening on port '+(process.env.PORT || 3000)));
