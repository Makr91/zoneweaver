import express from 'express';
import https from 'https';
import http from 'http';
import fs from 'fs';
import { setTimeout as delay } from 'timers/promises';
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
    stack: err.stack,
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
app.use(express.json({ limit: '50mb' })); // Support large JSON payloads

// Note: Multer middleware removed — proxy servers stream data directly without buffering

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
    await delay(1000);

    // Test database access to ensure schema is ready
    try {
      await UserModel.findOne({ limit: 1 });
      log.database.info('Database schema ready for authentication');
    } catch {
      log.database.info('Waiting for database migrations to complete...');
      await delay(3000);
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
  void res;
  const { serverAddress, zoneName } = req.params;
  const clientId = req.ip || req.connection.remoteAddress;

  log.websocket.debug('VNC Console: Tracking session', {
    zoneName,
    serverAddress,
    clientId,
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
  const { protocol } = req;
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
  const { protocol } = req;
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
  void req;
  res.sendFile('./web/dist/index.html', { root: '.' });
});

/**
 * Resolve server address from request referer/origin headers, with fallback to most recent server
 */
const resolveServerFromRequest = async request => {
  const referer = request.headers.referer || request.headers.origin;
  if (referer) {
    const urlParams = new URLSearchParams(referer.split('?')[1]);
    const host = urlParams.get('host');
    if (host) {
      const server = await ServerModel.getServerByHostname(host);
      if (server) {
        return `${server.hostname}:${server.port}`;
      }
    }
  }
  const servers = await ServerModel.getAllServers();
  if (servers.length > 0) {
    return `${servers[0].hostname}:${servers[0].port}`;
  }
  return null;
};

/**
 * Get authenticated server credentials from "hostname:port" address string
 */
const getAuthenticatedServer = address => {
  const [hostname, serverPort] = address.split(':');
  return ServerModel.getServer(hostname, parseInt(serverPort || 5001), 'https');
};

/**
 * Create bidirectional WebSocket proxy for simple (non-VNC) sessions
 */
const createSimpleWsProxy = async (request, socket, head, backendUrl, apiKey, logContext) => {
  const { WebSocket, WebSocketServer } = await import('ws');
  const wss = new WebSocketServer({ noServer: true });
  const backendWs = new WebSocket(backendUrl, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'User-Agent': 'Zoneweaver-Proxy/1.0',
    },
  });

  backendWs.on('error', err => {
    log.websocket.error('Backend WebSocket connection failed', {
      ...logContext,
      error: err.message,
    });
    socket.destroy();
  });

  wss.handleUpgrade(request, socket, head, clientWs => {
    backendWs.on('open', () => {
      log.websocket.info('Backend WebSocket connected', logContext);
      clientWs.on('message', data => backendWs.send(data));
      backendWs.on('message', data => clientWs.send(data));
      clientWs.on('close', () => backendWs.close());
      backendWs.on('close', () => clientWs.close());
    });
  });
};

/**
 * Handle terminal/zlogin WebSocket upgrade by resolving server from referer
 */
const handleSessionUpgrade = async (sessionType, sessionId, request, socket, head) => {
  if (!serverModelReady || !ServerModel) {
    log.websocket.error(`WebSocket ${sessionType}: ServerModel not initialized`, { sessionId });
    socket.destroy();
    return;
  }

  const serverAddress = await resolveServerFromRequest(request);
  if (!serverAddress) {
    log.websocket.error(`WebSocket ${sessionType}: Could not determine target server`, {
      sessionId,
    });
    socket.destroy();
    return;
  }

  const server = await getAuthenticatedServer(serverAddress);
  if (!server || !server.api_key) {
    log.websocket.error(`WebSocket ${sessionType}: No server or API key`, { sessionId });
    socket.destroy();
    return;
  }

  const backendUrl = `${server.protocol.replace('http', 'ws')}://${server.hostname}:${server.port}/${sessionType}/${sessionId}`;
  log.websocket.info(`WebSocket ${sessionType}: Connecting`, { backendUrl });

  await createSimpleWsProxy(request, socket, head, backendUrl, server.api_key, {
    sessionType,
    sessionId,
  });
};

/**
 * Handle task output stream WebSocket upgrade
 */
const handleTaskStreamUpgrade = async (serverAddr, taskId, request, socket, head) => {
  if (!serverModelReady || !ServerModel) {
    log.websocket.error('WebSocket task stream: ServerModel not initialized', { taskId });
    socket.destroy();
    return;
  }

  const server = await getAuthenticatedServer(serverAddr);
  if (!server || !server.api_key) {
    log.websocket.error('WebSocket task stream: No server or API key', { taskId });
    socket.destroy();
    return;
  }

  const backendUrl = `${server.protocol.replace('http', 'ws')}://${server.hostname}:${server.port}/tasks/${taskId}/stream`;
  log.websocket.info('WebSocket task stream: Connecting', { backendUrl });

  await createSimpleWsProxy(request, socket, head, backendUrl, server.api_key, {
    type: 'task-stream',
    taskId,
  });
};

/**
 * Resolve VNC target from URL (direct match or websockify fallback)
 */
const resolveVncTarget = (url, request) => {
  const directMatch = url.pathname.match(
    /^\/api\/servers\/(?<addr>[^/]+)\/zones\/(?<zone>[^/]+)\/vnc\/websockify/
  );
  if (directMatch) {
    return { serverAddress: directMatch.groups.addr, zoneName: directMatch.groups.zone };
  }

  if (url.pathname !== '/websockify') {
    return null;
  }

  log.websocket.debug('WebSocket fallback: websockify detected', {
    referer: request.headers.referer,
    origin: request.headers.origin,
  });

  const referer = request.headers.referer || request.headers.origin;
  if (referer) {
    const urlMatch = referer.match(/\/zones\/(?<zone>[^/?#]+)/);
    if (urlMatch) {
      log.websocket.debug('WebSocket fallback: found zone in URL', {
        zoneName: urlMatch.groups.zone,
      });
      return {
        serverAddress: 'hv-04-backend.home.m4kr.net:5001',
        zoneName: urlMatch.groups.zone,
      };
    }
  }

  const clientId = request.connection.remoteAddress || request.socket.remoteAddress;
  const storedSession = activeVncSessions.get(clientId);
  if (storedSession) {
    log.websocket.info('WebSocket fallback: found stored session', storedSession);
    return storedSession;
  }

  log.websocket.debug('WebSocket fallback: no VNC target found', { clientId });
  return null;
};

/**
 * Create VNC WebSocket proxy with binary subprotocol support
 */
const createVncWsProxy = async (vncTarget, request, socket, head) => {
  const { serverAddress, zoneName } = vncTarget;
  const [hostname, serverPort] = serverAddress.split(':');

  log.websocket.info('WebSocket upgrade for VNC', { zoneName, hostname, serverPort });

  if (!serverModelReady || !ServerModel) {
    log.websocket.error('WebSocket VNC: ServerModel not initialized', { zoneName });
    socket.destroy();
    return;
  }

  const server = await ServerModel.getServer(hostname, parseInt(serverPort || 5001), 'https');
  if (!server || !server.api_key) {
    log.websocket.error('WebSocket VNC: No server or API key', { hostname, serverPort });
    socket.destroy();
    return;
  }

  const { WebSocket, WebSocketServer } = await import('ws');
  const backendUrl = `${server.protocol.replace('http', 'ws')}://${server.hostname}:${server.port}/zones/${encodeURIComponent(zoneName)}/vnc/websockify`;

  log.websocket.info('Connecting to backend VNC WebSocket', { backendUrl });

  const wss = new WebSocketServer({
    noServer: true,
    perMessageDeflate: false,
    compression: 'DISABLED',
    handleProtocols: protocols =>
      Array.from(protocols).includes('binary') ? 'binary' : Array.from(protocols)[0] || null,
  });

  const backendWs = new WebSocket(backendUrl, ['binary'], {
    headers: {
      Authorization: `Bearer ${server.api_key}`,
      'User-Agent': 'Zoneweaver-Proxy/1.0',
    },
    perMessageDeflate: false,
    extensions: {},
    compression: 'DISABLED',
  });

  backendWs.on('error', err => {
    log.websocket.error('Backend VNC WebSocket connection failed', {
      zoneName,
      error: err.message,
    });
    socket.destroy();
  });

  wss.handleUpgrade(request, socket, head, clientWs => {
    log.websocket.info('Client VNC WebSocket established', { zoneName });

    backendWs.on('open', () => {
      log.websocket.info('Backend VNC WebSocket connected', { zoneName });

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
        error: err.message,
      });
      clientWs.close();
    });
  });
};

/**
 * Handle WebSocket upgrade for VNC proxy, terminal sessions, and task streams
 */
const handleWebSocketUpgrade = async (request, socket, head) => {
  try {
    const url = new URL(request.url, `https://${request.headers.host}`);

    const zloginMatch = url.pathname.match(/^\/zlogin\/(?<sessionId>[^/]+)/);
    if (zloginMatch) {
      await handleSessionUpgrade('zlogin', zloginMatch.groups.sessionId, request, socket, head);
      return;
    }

    const termMatch = url.pathname.match(/^\/term\/(?<sessionId>[^/]+)/);
    if (termMatch) {
      await handleSessionUpgrade('term', termMatch.groups.sessionId, request, socket, head);
      return;
    }

    const taskMatch = url.pathname.match(
      /^\/api\/servers\/(?<addr>[^/]+)\/tasks\/(?<taskId>[a-fA-F0-9-]+)\/stream/
    );
    if (taskMatch) {
      await handleTaskStreamUpgrade(
        taskMatch.groups.addr,
        taskMatch.groups.taskId,
        request,
        socket,
        head
      );
      return;
    }

    const vncTarget = resolveVncTarget(url, request);
    if (!vncTarget) {
      log.websocket.debug('WebSocket upgrade rejected: URL does not match any pattern', {
        pathname: url.pathname,
      });
      socket.destroy();
      return;
    }

    await createVncWsProxy(vncTarget, request, socket, head);
  } catch (error) {
    log.websocket.error('WebSocket upgrade error', { error: error.message });
    socket.destroy();
  }
};

/**
 * Generate SSL certificates if they don't exist and generate_ssl is enabled
 */
const generateSSLCertificatesIfNeeded = async () => {
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
      certPath,
    });

    return true; // Certificates generated successfully
  } catch (error) {
    log.app.error('Failed to generate SSL certificates', { error: error.message });
    log.app.warn('Continuing with HTTP fallback...');
    return false; // Generation failed
  }
};

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
        apiDocs: `http://localhost:${port}/api-docs`,
      });
    });
  }
})();

// Export config for use in other modules
export { config };
