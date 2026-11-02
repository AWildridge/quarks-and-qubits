import { createServer } from 'node:http';
import { readFile, realpath, stat } from 'node:fs/promises';
import { resolve, sep, extname } from 'node:path';
import { pathToFileURL } from 'node:url';
import { gzipSync } from 'node:zlib';
import { parseHeaders } from './security-policy.js';

const types = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json',
  '.xml': 'application/xml',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.pdf': 'application/pdf',
  '.txt': 'text/plain; charset=utf-8',
  '.bib': 'text/plain; charset=utf-8',
  '.dat': 'text/plain; charset=utf-8',
  '.info': 'text/plain; charset=utf-8',
};

export async function startPreview({ port = 0, root = resolve('dist') } = {}) {
  const headers = parseHeaders(await readFile(resolve(root, '_headers'), 'utf8'));
  const realRoot = await realpath(root);
  const server = createServer(async (request, response) => {
    for (const [key, value] of Object.entries(headers)) response.setHeader(key, value);
    response.setHeader('Cache-Control', 'no-cache');
    try {
      if (!['GET', 'HEAD'].includes(request.method)) {
        response.writeHead(405, { Allow: 'GET, HEAD' }).end();
        return;
      }
      const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
      if (
        pathname.includes('\\') ||
        pathname.includes('\0') ||
        pathname.split('/').some((part) => part.startsWith('.'))
      ) {
        response.writeHead(400).end();
        return;
      }
      let path = resolve(root, '.' + pathname);
      if (path !== root && !path.startsWith(root + sep)) {
        response.writeHead(403).end();
        return;
      }
      if ((await stat(path)).isDirectory()) path = resolve(path, 'index.html');
      const actual = await realpath(path);
      if (!actual.startsWith(realRoot + sep)) {
        response.writeHead(403).end();
        return;
      }
      const content = await readFile(actual);
      const type = types[extname(path)] || 'application/octet-stream';
      response.setHeader('Content-Type', type);
      response.setHeader('Vary', 'Accept-Encoding');
      const compress =
        /\bgzip\b/.test(request.headers['accept-encoding'] || '') &&
        /text|json|xml|javascript|svg/.test(type);
      const body = compress ? gzipSync(content) : content;
      if (compress) response.setHeader('Content-Encoding', 'gzip');
      response.setHeader('Content-Length', body.length);
      response.writeHead(200).end(request.method === 'HEAD' ? undefined : body);
    } catch (error) {
      response
        .writeHead(error instanceof URIError ? 400 : 404, { 'Content-Type': 'text/plain' })
        .end('Not found');
    }
  });
  await new Promise((ok, reject) => {
    server.once('error', reject);
    server.listen(port, '127.0.0.1', ok);
  });
  return { server, url: `http://127.0.0.1:${server.address().port}` };
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const { server, url } = await startPreview({ port: Number(process.env.PORT || 4321) });
  console.log(`Security-header preview: ${url}`);
  for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => server.close());
}
