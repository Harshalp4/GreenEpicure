/**
 * Local Development Server
 * Run: node server.js
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const PORT = process.env.PORT || 3000;

// MIME types
const mimeTypes = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf'
};

// API handlers
const apiHandlers = {
  '/api/products': () => require('./api/products/index.js'),
  '/api/cart': () => require('./api/cart/index.js'),
  '/api/orders': () => require('./api/orders/index.js'),
  '/api/addresses': () => require('./api/addresses/index.js'),
  '/api/auth/login': () => require('./api/auth/login.js'),
  '/api/auth/register': () => require('./api/auth/register.js'),
  '/api/auth/me': () => require('./api/auth/me.js'),
  '/api/payment/create': () => require('./api/payment/create.js'),
  '/api/payment/verify': () => require('./api/payment/verify.js'),
  '/api/admin/products': () => require('./api/admin/products.js'),
  '/api/admin/orders': () => require('./api/admin/orders.js'),
  '/api/admin/stats': () => require('./api/admin/stats.js'),
  '/api/admin/upload': () => require('./api/admin/upload.js'),
  '/api/admin/customers': () => require('./api/admin/customers.js'),
  '/api/admin/categories': () => require('./api/admin/categories.js'),
};

// Parse JSON body
async function parseBody(req) {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        resolve(JSON.parse(body));
      } catch {
        resolve({});
      }
    });
  });
}

// Create mock response object
function createResponse(res) {
  const response = {
    statusCode: 200,
    headers: {},
    status(code) {
      this.statusCode = code;
      return this;
    },
    setHeader(key, value) {
      this.headers[key] = value;
    },
    json(data) {
      res.writeHead(this.statusCode, {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        ...this.headers
      });
      res.end(JSON.stringify(data));
    },
    end() {
      res.writeHead(this.statusCode, {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        ...this.headers
      });
      res.end();
    }
  };
  return response;
}

// Server
const server = http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  let pathname = parsedUrl.pathname;

  console.log(`${req.method} ${pathname}`);

  // Handle API routes
  if (pathname.startsWith('/api/')) {
    // Handle dynamic routes like /api/products/[id]
    let handler = null;
    let dynamicId = null;

    // Check for exact match first
    if (apiHandlers[pathname]) {
      handler = apiHandlers[pathname]();
    } else {
      // Check for dynamic routes
      const parts = pathname.split('/');
      if (parts.length === 4) {
        const basePath = `/${parts[1]}/${parts[2]}`;
        dynamicId = parts[3];

        // Try to load dynamic handler
        const dynamicHandlerPath = `./api/${parts[2]}/[id].js`;
        try {
          handler = require(dynamicHandlerPath);
        } catch (e) {
          // No dynamic handler
        }
      }
    }

    if (handler) {
      const mockReq = {
        method: req.method,
        headers: req.headers,
        query: { ...parsedUrl.query, id: dynamicId },
        body: await parseBody(req)
      };
      const mockRes = createResponse(res);

      try {
        await handler(mockReq, mockRes);
      } catch (error) {
        console.error('API Error:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: error.message }));
      }
      return;
    }
  }

  // Serve static files
  if (pathname === '/') pathname = '/index.html';

  const filePath = path.join(__dirname, pathname);
  const ext = path.extname(filePath);

  fs.readFile(filePath, (err, data) => {
    if (err) {
      // Try with .html extension
      fs.readFile(filePath + '.html', (err2, data2) => {
        if (err2) {
          res.writeHead(404);
          res.end('Not Found');
        } else {
          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end(data2);
        }
      });
    } else {
      const contentType = mimeTypes[ext] || 'application/octet-stream';
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(data);
    }
  });
});

server.listen(PORT, () => {
  console.log(`\n🌿 Green Epicure running at http://localhost:${PORT}\n`);
  console.log('Pages:');
  console.log(`  - Home:     http://localhost:${PORT}`);
  console.log(`  - Products: http://localhost:${PORT}/products.html`);
  console.log(`  - Login:    http://localhost:${PORT}/login.html`);
  console.log(`  - Register: http://localhost:${PORT}/register.html`);
  console.log(`  - Cart:     http://localhost:${PORT}/cart.html`);
  console.log(`\nPress Ctrl+C to stop\n`);
});
