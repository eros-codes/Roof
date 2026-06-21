import 'dotenv/config';
import express from 'express';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs/promises';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ADMIN_DIR = path.join(__dirname, 'admin');
const ADMIN_PORT = process.env.ADMIN_PORT || 3001;
// BACKEND_ORIGIN: where to forward API requests
const BACKEND_ORIGIN = (process.env.API_ORIGIN || `http://localhost:4000`).replace(/\/$/, '');
// INJECT_API_ORIGIN: what to expose to the browser. For secure proxying we
// default to empty string so the client uses relative `/api` (same-origin
// to the proxy). Override if you need the client to call the backend
// directly.
const INJECT_API_ORIGIN = process.env.ADMIN_INJECT_API_ORIGIN !== undefined ? process.env.ADMIN_INJECT_API_ORIGIN : '';

const app = express();

// Serve static assets (CSS/JS/images) from server/admin
app.use(express.static(ADMIN_DIR, { index: false }));

// Proxy /api/* requests to the backend API (preserve method, headers, body)
app.use('/api', async (req, res) => {
  try {
    const upstreamUrl = BACKEND_ORIGIN + req.originalUrl; // e.g. http://localhost:4000/api/admin/...

    // Clone headers and remove host to avoid conflicts
    const headers = { ...req.headers };
    delete headers.host;
    // Optionally remove origin so backend won't treat this as a browser CORS request
    delete headers.origin;
    // Remove headers that undici doesn't support or that shouldn't be forwarded
    // (e.g. `Expect: 100-continue`, connection control headers)
    if (headers.expect) delete headers.expect;
    delete headers.connection;
    delete headers['proxy-connection'];
    delete headers.upgrade;

    const hasBody = !['GET', 'HEAD'].includes(req.method);
    const fetchOptions = {
      method: req.method,
      headers,
      // For GET/HEAD don't pass a body; when we forward the incoming
      // request stream to undici's fetch we must set `duplex: 'half'`.
      ...(hasBody ? { body: req, duplex: 'half' } : {}),
    };

    const upstreamRes = await fetch(upstreamUrl, fetchOptions);

    // Forward status
    res.status(upstreamRes.status);

    // Forward headers (but avoid leaking backend's CORS headers unnecessarily)
    upstreamRes.headers.forEach((value, key) => {
      res.setHeader(key, value);
    });

    // Stream response body
    if (upstreamRes.body && typeof upstreamRes.body.pipe === 'function') {
      upstreamRes.body.pipe(res);
    } else {
      const buf = await upstreamRes.arrayBuffer();
      res.send(Buffer.from(buf));
    }
  } catch (err) {
    console.error('Proxy error:', err);
    res.status(502).send('Bad Gateway');
  }
});

// Ensure admin UI can retrieve the site's service worker from the backend
app.get('/service-worker.js', async (req, res) => {
  try {
    const upstreamUrl = BACKEND_ORIGIN + '/service-worker.js';
    const upstreamRes = await fetch(upstreamUrl);

    res.status(upstreamRes.status);
    upstreamRes.headers.forEach((value, key) => res.setHeader(key, value));

    if (upstreamRes.body && typeof upstreamRes.body.pipe === 'function') {
      upstreamRes.body.pipe(res);
    } else {
      const buf = await upstreamRes.arrayBuffer();
      res.send(Buffer.from(buf));
    }
  } catch (err) {
    console.error('Failed to proxy service-worker.js:', err);
    res.status(502).send('Bad Gateway');
  }
});

// Respond to Chrome DevTools probe to avoid noisy 404 logs
app.get('/.well-known/appspecific/com.chrome.devtools.json', (_req, res) => {
  res.status(204).end();
});

// Fallback: serve index.html with injected API origin so the admin UI can call the backend
app.get('*', async (req, res) => {
  try {
    const indexPath = path.join(ADMIN_DIR, 'index.html');
    let html = await fs.readFile(indexPath, 'utf8');
    const injected = `<script>window.__API_ORIGIN__ = "${INJECT_API_ORIGIN.replace(/"/g, '\\"')}";</script>`;
    html = html.replace('</head>', `${injected}\n</head>`);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(html);
  } catch (err) {
    console.error('Failed to serve index.html:', err);
    res.status(500).send('Internal Server Error');
  }
});

app.listen(ADMIN_PORT, () => {
  console.log(`✅ Admin proxy listening: http://localhost:${ADMIN_PORT}`);
  console.log(`↪️  Proxying /api -> ${BACKEND_ORIGIN}/api`);
});
