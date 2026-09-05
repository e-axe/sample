import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
const site = process.cwd();
const args = process.argv.slice(2);
const port = Number(args[args.indexOf('--port') + 1]) || 4173;
const mime = {'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.webp':'image/webp','.svg':'image/svg+xml'};
http.createServer(async(req,res)=>{
  try {
    const route = decodeURIComponent(new URL(req.url,'http://localhost').pathname);
    const root = site;
    const relative = route.startsWith('/saimer-pro/') ? route.slice('/saimer-pro/'.length) : route.slice(1);
    let file = path.resolve(root, relative || 'index.html');
    if (!file.startsWith(root + '/') && file !== root) {res.writeHead(403).end(); return;}
    if ((await fs.stat(file)).isDirectory()) file=path.join(file,'index.html');
    res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'text/plain','Cache-Control':'no-store'});
    res.end(await fs.readFile(file));
  } catch {res.writeHead(404).end('Not found');}
}).listen(port,'0.0.0.0');
