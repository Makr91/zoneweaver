import express from 'express';
import https from 'https';
import http from 'http';
import fs from 'fs';
import cors from 'cors';
import session from 'express-session';
import SequelizeStore from 'connect-session-sequelize';
import rateLimit from 'express-rate-limit';
import router from './routes/index.js';
import db from './models/index.js';
import { specs, swaggerUi } from './config/swagger.js';
import { loadConfig } from './utils/config.js';
import { log, createRequestLogger, generateRequestId } from './utils/Logger.js';

// Initialize passport after database is ready
let passport;

// Prevent server crashes from unhandled WebSocket errors
process.on('uncaughtException', err => {
  log.app.error('Uncaught Exception', { 
    error: err.message, 
    stack: err.stack 
  });
  // Don't exit, just log the error to prevent crashes
});

// Load configuration from YAML file
const config = loadConfig();

// 🛡️ Static File Rate Limiting Configuration (CodeQL Security Fix)
// Create rate limiter for static file serving endpoints
const staticFileLimiter = rateLimit({
  windowMs: config.limits?.staticFiles?.windowMs?.value || 15 * 60 * 1000,
  max: config.limits?.staticFiles?.max?.value || 5000,
  message: {
    error:
      config.limits?.staticFiles?.message?.value ||
      'Too many static file requests, please try again later',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const app = express();
const port = process.env.PORT || config.frontend.port.value;

// Track active VNC sessions for WebSocket fallback
const activeVncSessions = new Map();

// CORS configuration from YAML
const corsOptions = {
  origin: config.security.cors.allow_origin.value,
  preflightContinue: config.security.cors.preflight_continue.value,
  credentials: config.security.cors.credentials.value,
};

app.set('trust proxy', config.frontend.trust_proxy.value);
app.use(cors(corsOptions));
app.options('*splat', cors(corsOptions));
app.use(express.json());

// Serve static files from the React app build
app.use(express.static('./web/dist'));

// Database and models initialization - wait for migrations to complete
const ServerModel = db.server;
const UserModel = db.user;
const serverModelReady = true; // Models are ready immediately after import

log.database.info('Sequelize models loaded and ready');

// Configure session middleware for OIDC and authentication
const SessionStore = SequelizeStore(session.Store);
const sessionStore = new SessionStore({
  db: db.sequelize,
  tableName: 'Sessions', // This will be auto-created
  checkExpirationInterval: 15 * 60 * 1000, // Clean up expired sessions every 15 minutes
  expiration: 30 * 60 * 1000, // Session expires after 30 minutes (good for OAuth flows)
});

app.use(
  session({
    secret: config.authentication.jwt_secret.value, // Use existing JWT secret
    store: sessionStore,
    name: 'zoneweaver.sid', // Session cookie name
    resave: false,
    saveUninitialized: false, // Don't save empty sessions
    cookie: {
      secure: config.server.ssl_enabled.value, // Use HTTPS cookies if SSL is enabled
      httpOnly: true, // Prevent XSS
      maxAge: 30 * 60 * 1000, // 30 minutes (matches OAuth flow needs)
      sameSite: 'lax', // CSRF protection while allowing OAuth redirects
    },
    // Sync session table on startup
    ...(() => {
      sessionStore
        .sync()
        .then(() => log.database.info('Session store synchronized'))
        .catch(err => log.database.error('Session store sync failed', { error: err.message }));
      return {};
    })(),
  })
);

log.app.info('Session middleware configured for OIDC support');

// Initialize Passport.js AFTER database and sessions are ready
(async () => {
  try {
    // Wait a moment for any ongoing migrations to complete
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Test database access to ensure schema is ready
    try {
      await UserModel.findOne({ limit: 1 });
      log.database.info('Database schema ready for authentication');
    } catch {
      log.database.info('Waiting for database migrations to complete...');
      await new Promise(resolve => setTimeout(resolve, 3000));
    }

    // Now safe to import and initialize Passport
    const passportModule = await import('./auth/passport.js');
    passport = passportModule.default;

    // Add Passport middleware after it's initialized
    app.use(passport.initialize());
    app.use(passport.session()); // Enable session support for OIDC
    log.auth.info('Passport.js initialized with session support');
  } catch (error) {
    log.auth.error('Failed to initialize Passport', { error: error.message });
    log.auth.warn('Authentication will fall back to JWT-only mode');
  }
})();

// Add request logging middleware
app.use((req, res, next) => {
  req.requestId = generateRequestId();
  const logger = createRequestLogger(req.requestId, req);
  
  res.on('finish', () => {
    if (res.statusCode >= 400) {
      logger.error(res.statusCode, res.statusMessage);
    } else {
      logger.success(res.statusCode);
    }
  });
  
  next();
});

// Middleware to track VNC console requests for WebSocket fallback
app.use('/api/servers/:serverAddress/zones/:zoneName/vnc/console', (req, res, next) => {
  const { serverAddress, zoneName } = req.params;
  const clientId = req.ip || req.connection.remoteAddress;

  log.websocket.debug('VNC Console: Tracking session', { 
    zoneName, 
    serverAddress, 
    clientId 
  });

  // Store the mapping for WebSocket fallback
  activeVncSessions.set(clientId, { serverAddress, zoneName });

  // Clean up old sessions after 5 minutes
  setTimeout(
    () => {
      activeVncSessions.delete(clientId);
    },
    5 * 60 * 1000
  );

  next();
});

app.use(router);

// Swagger API Documentation middleware
app.use('/api-docs', swaggerUi.serve, (req, res, next) => {
  // Dynamically set the server URL based on the current request
  const protocol = req.protocol;
  const host = req.get('host');
  const dynamicSpecs = {
    ...specs,
    servers: [
      {
        url: `${protocol}://${host}`,
        description: 'Current server (auto-detected)',
      },
      {
        url: '{protocol}://{host}',
        description: 'Custom server',
        variables: {
          protocol: {
            enum: ['http', 'https'],
            default: 'https',
            description: 'The protocol used to access the server',
          },
          host: {
            default: 'localhost:3000',
            description: 'The hostname and port of the server',
          },
        },
      },
    ],
  };

  swaggerUi.setup(dynamicSpecs, {
    explorer: true,
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'Zoneweaver API Documentation',
    swaggerOptions: {
      url: `${protocol}://${host}/api-docs/swagger.json`,
    },
  })(req, res, next);
});

// Serve the OpenAPI spec JSON separately to avoid asset loading issues
app.get('/api-docs/swagger.json', (req, res) => {
  const protocol = req.protocol;
  const host = req.get('host');
  const dynamicSpecs = {
    ...specs,
    servers: [
      {
        url: `${protocol}://${host}`,
        description: 'Current server (auto-detected)',
      },
    ],
  };
  res.setHeader('Content-Type', 'application/json');
  res.send(dynamicSpecs);
});

// Handle React Router routes - serve index.html for all non-API routes - Protected with static file rate limiting (CodeQL flagged)
app.get('*splat', staticFileLimiter, (req, res) => {
  res.sendFile('./web/dist/index.html', { root: '.' });
});

/**
 * Handle WebSocket upgrade for VNC proxy using native WebSocket implementation
 * This provides more reliable WebSocket proxying for NoVNC connections
 */
async function handleWebSocketUpgrade(request, socket, head) {
  const timestamp = new Date().toISOString();

  try {
    const url = new URL(request.url, `https://${request.headers.host}`);

    // Check if this is a Terminal or Zlogin WebSocket request
    const termMatch = url.pathname.match(/^\/term\/([^/]+)/);
    const zloginMatch = url.pathname.match(/^\/zlogin\/([^/]+)/);

    if (zloginMatch) {
      const sessionId = zloginMatch[1];

      if (!serverModelReady || !ServerModel) {
        log.websocket.error('WebSocket zlogin: ServerModel not initialized', { 
          sessionId, 
          timestamp 
        });
        socket.destroy();
        return;
      }

      // Get server information from referer header
      const referer = request.headers.referer || request.headers.origin;
      let serverAddress = null;

      if (referer) {
        const urlParams = new URLSearchParams(referer.split('?')[1]);
        const host = urlParams.get('host');
        if (host) {
          const server = await ServerModel.getServerByHostname(host);
          if (server) {
            serverAddress = `${server.hostname}:${server.port}`;
          }
        }
      }

      if (!serverAddress) {
        // Fallback to the most recently used server
        const servers = await ServerModel.getAllServers();
        if (servers.length > 0) {
          serverAddress = `${servers[0].hostname}:${servers[0].port}`;
        }
      }

      if (!serverAddress) {
        log.websocket.error('WebSocket zlogin: Could not determine target server', { 
          sessionId, 
          timestamp 
        });
        socket.destroy();
        return;
      }

      const [hostname, port] = serverAddress.split(':');
      const server = await ServerModel.getServer(hostname, parseInt(port || 5001), 'https');

      if (!server || !server.api_key) {
        log.websocket.error('WebSocket zlogin: No server or API key', { 
          sessionId, 
          hostname, 
          port, 
          timestamp 
        });
        socket.destroy();
        return;
      }

      const { WebSocket, WebSocketServer } = await import('ws');
      const backendUrl = `${server.protocol.replace('http', 'ws')}://${server.hostname}:${server.port}/zlogin/${sessionId}`;

      const wss = new WebSocketServer({ noServer: true });
      const backendWs = new WebSocket(backendUrl, {
        headers: {
          Authorization: `Bearer ${server.api_key}`,
          'User-Agent': 'Zoneweaver-Proxy/1.0',
        },
      });

      // Add immediate error handler to prevent server crashes
      backendWs.on('error', err => {
        log.websocket.error('WebSocket zlogin: Backend connection failed', { 
          backendUrl, 
          error: err.message, 
          timestamp 
        });
        socket.destroy(); // Close the client connection gracefully
      });

      wss.handleUpgrade(request, socket, head, clientWs => {
        backendWs.on('open', () => {
          log.websocket.info('WebSocket zlogin: Connected', { backendUrl, timestamp });
          clientWs.on('message', data => backendWs.send(data));
          backendWs.on('message', data => clientWs.send(data));
          clientWs.on('close', () => backendWs.close());
          backendWs.on('close', () => clientWs.close());
        });
      });
      return;
    }

    if (termMatch) {
      const sessionId = termMatch[1];
      log.websocket.info('WebSocket upgrade for terminal session', { sessionId });

      if (!serverModelReady || !ServerModel) {
        log.websocket.error('WebSocket upgrade failed: ServerModel not fully initialized', { sessionId });
        socket.destroy();
        return;
      }

      // Get server information from referer header
      const referer = request.headers.referer || request.headers.origin;
      let serverAddress = null;

      if (referer) {
        const urlParams = new URLSearchParams(referer.split('?')[1]);
        const host = urlParams.get('host');
        if (host) {
          const server = await ServerModel.getServerByHostname(host);
          if (server) {
            serverAddress = `${server.hostname}:${server.port}`;
          }
        }
      }

      if (!serverAddress) {
        // Fallback to the most recently used server
        const servers = await ServerModel.getAllServers();
        if (servers.length > 0) {
          serverAddress = `${servers[0].hostname}:${servers[0].port}`;
        }
      }

      if (!serverAddress) {
        log.websocket.error('WebSocket upgrade failed: Could not determine target server for terminal session', { sessionId });
        socket.destroy();
        return;
      }

      const [hostname, port] = serverAddress.split(':');
      const server = await ServerModel.getServer(hostname, parseInt(port || 5001), 'https');

      if (!server || !server.api_key) {
        log.websocket.error('WebSocket upgrade failed: No server or API key', { hostname, port });
        socket.destroy();
        return;
      }

      const { WebSocket, WebSocketServer } = await import('ws');
      const backendUrl = `${server.protocol.replace('http', 'ws')}://${server.hostname}:${server.port}/term/${sessionId}`;
      log.websocket.info('Connecting to backend terminal WebSocket', { backendUrl });

      const wss = new WebSocketServer({ noServer: true });
      const backendWs = new WebSocket(backendUrl, {
        headers: {
          Authorization: `Bearer ${server.api_key}`,
          'User-Agent': 'Zoneweaver-Proxy/1.0',
        },
      });

      // Add immediate error handler to prevent server crashes
      backendWs.on('error', err => {
        log.websocket.error('Backend WebSocket connection failed for terminal', { 
          sessionId, 
          error: err.message 
        });
        socket.destroy(); // Close the client connection gracefully
      });

      wss.handleUpgrade(request, socket, head, clientWs => {
        log.websocket.info('Client WebSocket established for terminal session', { sessionId });
        backendWs.on('open', () => {
          log.websocket.info('Backend WebSocket connected for terminal session', { sessionId });
          clientWs.on('message', data => backendWs.send(data));
          backendWs.on('message', data => clientWs.send(data));
          clientWs.on('close', () => backendWs.close());
          backendWs.on('close', () => clientWs.close());
        });
      });
      return;
    }

    // Handle fallback for noVNC default /websockify path
    if (url.pathname === '/websockify') {
      log.websocket.debug('WebSocket fallback: websockify detected, extracting server/zone from referer', {
        referer: request.headers.referer,
        origin: request.headers.origin
      });

      // Since referer might not have API path, try to maintain a mapping of active VNC sessions
      // For now, let's add a simple mapping based on recent VNC console requests

      // Check if we can extract zone info from URL params in referer
      const referer = request.headers.referer || request.headers.origin;
      let serverAddress = null;
      let zoneName = null;

      if (referer) {
        // Try to find zone info in URL fragments or query params
        const urlMatch = referer.match(/\/zones\/([^/?#]+)/);
        if (urlMatch) {
          zoneName = urlMatch[1];
          log.websocket.debug('WebSocket fallback: found zone in URL', { zoneName });

          // For now, assume the most recent server (could be improved with session mapping)
          serverAddress = 'hv-04-backend.home.m4kr.net:5001'; // Default from your logs
          log.websocket.debug('WebSocket fallback: using default server', { serverAddress });
        }
      }

      if (serverAddress && zoneName) {
        log.websocket.info('WebSocket fallback: extracted zone on server', { zoneName, serverAddress });

        // Redirect to proper VNC WebSocket handling
        request.url = `/api/servers/${serverAddress}/zones/${zoneName}/vnc/websockify`;
        url.pathname = request.url;
        log.websocket.debug('WebSocket fallback: redirected', { url: request.url });
      } else {
        log.websocket.debug('WebSocket fallback: could not extract server/zone info from referer');

        // Try to get from stored active sessions
        const clientId = request.connection.remoteAddress || request.socket.remoteAddress;
        log.websocket.debug('WebSocket fallback: checking stored sessions', { clientId });

        const storedSession = activeVncSessions.get(clientId);
        if (storedSession) {
          serverAddress = storedSession.serverAddress;
          zoneName = storedSession.zoneName;
          log.websocket.info('WebSocket fallback: found stored session', { zoneName, serverAddress });

          // Redirect to proper VNC WebSocket handling
          request.url = `/api/servers/${serverAddress}/zones/${zoneName}/vnc/websockify`;
          url.pathname = request.url;
          log.websocket.debug('WebSocket fallback: redirected from stored session', { url: request.url });
        } else {
          log.websocket.debug('WebSocket fallback: no stored session found', { 
            clientId,
            activeSessions: Array.from(activeVncSessions.keys())
          });
        }
      }
    }

    const finalVncMatch = url.pathname.match(
      /^\/api\/servers\/([^/]+)\/zones\/([^/]+)\/vnc\/websockify/
    );

    if (!finalVncMatch) {
      log.websocket.debug('WebSocket upgrade rejected: URL does not match VNC pattern', { 
        pathname: url.pathname 
      });
      socket.destroy();
      return;
    }

    const [, serverAddress, zoneName] = finalVncMatch;
    const [hostname, port] = serverAddress.split(':');

    log.websocket.info('WebSocket upgrade for VNC', { zoneName, hostname, port });

    if (!serverModelReady || !ServerModel) {
      log.websocket.error('WebSocket upgrade failed: ServerModel not fully initialized for VNC session', { 
        zoneName 
      });
      socket.destroy();
      return;
    }

    const server = await ServerModel.getServer(hostname, parseInt(port || 5001), 'https');

    if (!server || !server.api_key) {
      log.websocket.error('WebSocket upgrade failed: No server or API key for VNC', { 
        hostname, 
        port 
      });
      socket.destroy();
      return;
    }

    // Import WebSocket and WebSocketServer for proper WebSocket-to-WebSocket proxying
    const { WebSocket, WebSocketServer } = await import('ws');

    // Create WebSocket connection to backend
    const backendUrl = `${server.protocol.replace('http', 'ws')}://${server.hostname}:${server.port}/zones/${encodeURIComponent(zoneName)}/vnc/websockify`;

    log.websocket.info('Connecting to backend VNC WebSocket', { backendUrl });

    // Create WebSocket server for the client connection with no compression
    const wss = new WebSocketServer({
      noServer: true,
      perMessageDeflate: false,
      compression: 'DISABLED',
      handleProtocols: protocols =>
        // Handle binary subprotocol for VNC connections
        Array.from(protocols).includes('binary') ? 'binary' : Array.from(protocols)[0] || null,
    });

    // Create backend WebSocket with binary subprotocol but no compression/extensions
    const backendWs = new WebSocket(backendUrl, ['binary'], {
      headers: {
        Authorization: `Bearer ${server.api_key}`,
        'User-Agent': 'Zoneweaver-Proxy/1.0',
      },
      // Disable all extensions to prevent frame issues
      perMessageDeflate: false,
      extensions: {},
      compression: 'DISABLED',
    });

    // Add immediate error handler to prevent server crashes
    backendWs.on('error', err => {
      log.websocket.error('Backend WebSocket connection failed for VNC', { 
        zoneName, 
        error: err.message 
      });
      socket.destroy(); // Close the client connection gracefully
    });

    // Handle WebSocket upgrade
    wss.handleUpgrade(request, socket, head, clientWs => {
      log.websocket.info('Client VNC WebSocket established', { zoneName });

      // Wait for backend connection before setting up forwarding
      backendWs.on('open', () => {
        log.websocket.info('Backend VNC WebSocket connected', { zoneName });

        // Set up WebSocket-to-WebSocket forwarding
        clientWs.on('message', (data, isBinary) => {
          if (backendWs.readyState === WebSocket.OPEN) {
            backendWs.send(data, { binary: isBinary });
          }
        });

        backendWs.on('message', (data, isBinary) => {
          if (clientWs.readyState === WebSocket.OPEN) {
            clientWs.send(data, { binary: isBinary });
          }
        });

        // Handle disconnections
        clientWs.on('close', () => {
          log.websocket.info('Client VNC WebSocket disconnected', { zoneName });
          backendWs.close();
        });

        clientWs.on('error', err => {
          log.websocket.error('Client VNC WebSocket error', { zoneName, error: err.message });
          backendWs.close();
        });

        backendWs.on('close', () => {
          log.websocket.info('Backend VNC WebSocket closed', { zoneName });
          if (clientWs.readyState === WebSocket.OPEN) {
            clientWs.close();
          }
        });

        backendWs.on('error', err => {
          log.websocket.error('Backend VNC WebSocket error', { zoneName, error: err.message });
          if (clientWs.readyState === WebSocket.OPEN) {
            clientWs.close();
          }
        });
      });

      backendWs.on('error', err => {
        log.websocket.error('Failed to connect to backend VNC WebSocket', { 
          zoneName, 
          error: err.message 
        });
        clientWs.close();
      });
    });
  } catch (error) {
    log.websocket.error('WebSocket upgrade error', { error: error.message });
    socket.destroy();
  }
}

/**
 * Generate SSL certificates if they don't exist and generate_ssl is enabled
 */
async function generateSSLCertificatesIfNeeded() {
  if (!config.server.ssl_generate.value) {
    return false; // SSL generation disabled
  }

  const keyPath = config.server.ssl_key_path.value;
  const certPath = config.server.ssl_cert_path.value;

  // Check if certificates already exist
  if (fs.existsSync(keyPath) && fs.existsSync(certPath)) {
    log.app.info('SSL certificates already exist, skipping generation');
    return false; // Certificates exist, no need to generate
  }

  try {
    log.app.info('Generating SSL certificates...');

    // Import child_process for running openssl
    const { execSync } = await import('child_process');
    const path = await import('path');

    // Ensure SSL directory exists
    const sslDir = path.dirname(keyPath);
    if (!fs.existsSync(sslDir)) {
      fs.mkdirSync(sslDir, { recursive: true, mode: 0o700 });
    }

    // Generate SSL certificate using OpenSSL
    const opensslCmd = `openssl req -x509 -nodes -days 365 -newkey rsa:2048 -keyout "${keyPath}" -out "${certPath}" -subj "/C=US/ST=State/L=City/O=Zoneweaver/CN=localhost"`;

    execSync(opensslCmd, { stdio: 'pipe' });

    // Set proper permissions (readable by current user only)
    fs.chmodSync(keyPath, 0o600);
    fs.chmodSync(certPath, 0o600);

    log.app.info('SSL certificates generated successfully', {
      keyPath,
      certPath
    });

    return true; // Certificates generated successfully
  } catch (error) {
    log.app.error('Failed to generate SSL certificates', { error: error.message });
    log.app.warn('Continuing with HTTP fallback...');
    return false; // Generation failed
  }
}

// SSL/HTTPS Configuration
(async () => {
  if (config.server.ssl_enabled.value) {
    // Try to generate SSL certificates if needed
    await generateSSLCertificatesIfNeeded();

    try {
      const privateKey = fs.readFileSync(config.server.ssl_key_path.value, 'utf8');
      const certificate = fs.readFileSync(config.server.ssl_cert_path.value, 'utf8');

      const credentials = { key: privateKey, cert: certificate };

      // Add CA certificate if specified
      if (config.server.ssl_ca_path?.value) {
        const ca = fs.readFileSync(config.server.ssl_ca_path.value, 'utf8');
        credentials.ca = ca;
      }

      const httpsServer = https.createServer(credentials, app);

      // Add WebSocket upgrade handling for VNC proxy
      httpsServer.on('upgrade', handleWebSocketUpgrade);

      httpsServer.listen(port, () => {
        log.app.info('HTTPS Server started', { port });
      });

      // Optional: Redirect HTTP to HTTPS
      const httpApp = express();
      httpApp.use((req, res) => {
        res.redirect(`https://${req.headers.host}${req.url}`);
      });

      const httpServer = http.createServer(httpApp);
      httpServer.listen(80, () => {
        log.app.info('HTTP Server started - redirecting to HTTPS', { port: 80 });
      });
    } catch (error) {
      log.app.error('SSL Certificate Error', { error: error.message });
      log.app.warn('Falling back to HTTP server...');

      // Fallback to HTTP if SSL certificates are not available
      const httpServer = http.createServer(app);
      httpServer.on('upgrade', handleWebSocketUpgrade);

      httpServer.listen(port, () => {
        log.app.warn('HTTP Server started (SSL certificates not found)', { port });
      });
    }
  } else {
    // HTTP only mode
    const httpServer = http.createServer(app);
    httpServer.on('upgrade', handleWebSocketUpgrade);

    httpServer.listen(port, () => {
      log.app.info('HTTP Server started', { 
        port,
        apiDocs: `http://localhost:${port}/api-docs`
      });
    });
  }
})();

// Export config for use in other modules
export { config };
