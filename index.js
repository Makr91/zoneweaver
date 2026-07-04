import express from 'express';
import https from 'https';
import http from 'http';
import fs from 'fs';
import crypto from 'crypto';
import { setTimeout as delay } from 'timers/promises';
import cors from 'cors';
import axios from 'axios';
import session from 'express-session';
import SequelizeStore from './utils/SequelizeSessionStore.js';
import rateLimit from 'express-rate-limit';
import router from './routes/index.js';
import ServerController from './controllers/ServerController.js';
import db from './models/index.js';
import { specs, swaggerUi } from './config/swagger.js';
import { loadConfig } from './utils/config.js';
import { log, createRequestLogger, generateRequestId } from './utils/Logger.js';
import { startAgentHealthPoller } from './utils/agentHealthPoller.js';

// Dark Swagger theme shared with the Hyperweaver UI + docs site (config/swagger-theme.css).
// Read once at module load; injected as swagger-ui-express customCss on /api-docs and
// on the selected-agent shell below.
const swaggerCustomCss = fs.readFileSync(
  new URL('./config/swagger-theme.css', import.meta.url),
  'utf8'
);

// Themed shell for the selected-agent API docs (/agent/api-docs). It loads swagger-ui's
// assets from /api-docs (already served) and its spec from the same-origin relay, reading
// the selected host id from ?server= in the browser.
const agentApiDocsHtml = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Agent API Documentation</title>
<link rel="stylesheet" href="/api-docs/swagger-ui.css" />
<style>${swaggerCustomCss}</style>
</head>
<body>
<div id="swagger-ui"></div>
<script src="/api-docs/swagger-ui-bundle.js"></script>
<script>
window.onload = function () {
  var params = new URLSearchParams(window.location.search);
  var server = params.get('server');
  var specUrl = '/agent/api-docs/swagger.json' + (server ? '?server=' + encodeURIComponent(server) : '');
  window.ui = SwaggerUIBundle({
    url: specUrl,
    dom_id: '#swagger-ui',
    deepLinking: true,
    presets: [SwaggerUIBundle.presets.apis],
    layout: 'BaseLayout',
    tryItOutEnabled: true,
  });
};
</script>
</body>
</html>`;

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

// Fail-fast on a weak/placeholder JWT secret (contract §4 — do NOT copy BoxVault's
// allowInsecureKeySizes:true / unreplaced-literal). HS256 signs BOTH the app JWT and the
// express-session cookie below, so a missing, placeholder, or short secret forges every session.
const jwtSecret = config.authentication?.jwt_secret?.value;
if (!jwtSecret || jwtSecret === '__JWT_SECRET_FROM_FILE__' || jwtSecret.length < 32) {
  log.app.error(
    'FATAL: authentication.jwt_secret is missing, the unreplaced placeholder, or too weak ' +
      '(minimum 32 characters). Set a strong random secret before starting. Refusing to start.'
  );
  process.exit(1);
}

// 🛡️ Static File Rate Limiting Configuration (CodeQL Security Fix)
// Create rate limiter for static file serving endpoints
const staticFileLimiter = rateLimit({
  windowMs: config.limits?.staticFiles?.windowMs?.value || 15 * 60 * 1000,
  limit: config.limits?.staticFiles?.max?.value || 5000,
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

// Serve the Hyperweaver UI build artifact (fetched into ./ui by CI during packaging)
app.use(express.static('./ui'));

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

// Key separation: derive the session-cookie signing key from the JWT secret instead of
// reusing it verbatim — one master secret in config, two independent per-purpose keys.
const sessionSecret = crypto
  .createHash('sha256')
  .update(`hyperweaver-session:${jwtSecret}`)
  .digest('hex');

app.use(
  session({
    secret: sessionSecret,
    store: sessionStore,
    name: 'hyperweaver-server.sid', // Session cookie name
    resave: false,
    saveUninitialized: false, // Don't save empty sessions
    // Sliding expiration: re-stamp the 30-minute cookie on every request (the store's touch()
    // follows it), so the session — and the OIDC token stash that powers favorites — survives
    // active use instead of dying a fixed 30 minutes after login. Idle 30 min still expires.
    rolling: true,
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

// Start the background agent health/capability poller (D11 — the Server owns freshness)
startAgentHealthPoller();

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
    customCss: swaggerCustomCss,
    customSiteTitle: 'Hyperweaver Server API Documentation',
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

// ── Selected-agent API docs (Aggregated mode) ──────────────────────────────
// The Hyperweaver UI's "Agent API" reference opens /agent/api-docs?server={id},
// where id is the host selected in the navbar. This themed shell loads swagger-ui
// from /api-docs and its spec from the relay below.
app.get('/agent/api-docs', (req, res) => {
  void req;
  res.type('html').send(agentApiDocsHtml);
});

// Relay: fetch the selected agent's own OpenAPI spec server-side (no browser CORS,
// and NAT'd agents still work since the Server reaches them), then point "Try it out"
// back through this Server's authenticated agent proxy.
app.get('/agent/api-docs/swagger.json', async (req, res) => {
  const id = req.query.server;
  const stub = message => ({
    openapi: '3.0.0',
    info: { title: 'Agent API — unavailable', version: '0.0.0', description: message },
    paths: {},
  });
  res.setHeader('Content-Type', 'application/json');
  if (!id) {
    return res.send(
      stub('No agent selected — pick a host in the navbar, then open the Agent API reference.')
    );
  }
  try {
    const agent = await ServerController.getAgentById(id);
    if (!agent) {
      return res.status(404).send(stub(`No registered agent with id ${id}.`));
    }
    if (agent.capabilities?.role && agent.capabilities.role !== 'agent') {
      return res.status(409).send(stub('The selected backend is not an agent.'));
    }
    const specResponse = await axios.get(
      `${agent.protocol}://${agent.hostname}:${agent.port}/api-docs/swagger.json`,
      {
        timeout: 10000,
        httpsAgent: new https.Agent({ rejectUnauthorized: !agent.allow_insecure }),
      }
    );
    const spec = specResponse.data;
    spec.servers = [
      {
        url: `${req.protocol}://${req.get('host')}/api/agents/${agent.id}`,
        description: `${agent.entity_name || agent.hostname} — via Hyperweaver Server (authorize with your JWT to try requests)`,
      },
    ];
    return res.send(spec);
  } catch (error) {
    log.app.warn('Agent API docs relay failed', { id, error: error.message });
    return res
      .status(502)
      .send(stub(`Could not load the selected agent's API spec: ${error.message}`));
  }
});

// Handle React Router routes - serve index.html for all non-API routes - Protected with static file rate limiting (CodeQL flagged)
app.get('*splat', staticFileLimiter, (req, res) => {
  void req;
  res.sendFile('./ui/index.html', { root: '.' });
});

/**
 * Resolve a registered agent by registry id for a WebSocket upgrade (dual-mode plan §4.2).
 * Applies the same role guard as the REST proxy (§6.2): non-agent rows are excluded.
 */
const resolveAgentForWs = async id => {
  if (!serverModelReady || !ServerModel) {
    return null;
  }
  const server = await ServerModel.withScope('withApiKey').findByPk(parseInt(id));
  if (server?.capabilities?.role && server.capabilities.role !== 'agent') {
    log.websocket.warn('WebSocket upgrade rejected: registered backend is not an agent', { id });
    return null;
  }
  return server;
};

/**
 * Create bidirectional WebSocket proxy for simple (non-VNC) sessions
 */
const createSimpleWsProxy = async (
  request,
  socket,
  head,
  backendUrl,
  apiKey,
  allowInsecure,
  logContext
) => {
  const { WebSocket, WebSocketServer } = await import('ws');
  const wss = new WebSocketServer({ noServer: true });
  const backendWs = new WebSocket(backendUrl, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'User-Agent': 'Hyperweaver-Server/1.0',
    },
    // Honored for wss:// (passed through to https.request), ignored for ws://
    rejectUnauthorized: !allowInsecure,
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
 * Proxy a simple (non-VNC) session WS upgrade for /api/agents/:id/{backendPath}.
 * backendPath is the agent's root-mounted path (zlogin/term/ssh/logs-stream/tasks).
 * search is the client's query string, forwarded verbatim so the agent-minted WS
 * ticket (?ticket=…) reaches the agent for verification.
 */
const handleAgentWsUpgrade = async (id, backendPath, search, request, socket, head, logContext) => {
  const server = await resolveAgentForWs(id);
  if (!server || !server.api_key) {
    log.websocket.error('WebSocket: agent not found or missing API key', { id, backendPath });
    socket.destroy();
    return;
  }

  const backendUrl = `${server.protocol.replace('http', 'ws')}://${server.hostname}:${server.port}/${backendPath}${search}`;
  log.websocket.info('WebSocket: connecting to agent backend', { ...logContext, backendUrl });

  await createSimpleWsProxy(
    request,
    socket,
    head,
    backendUrl,
    server.api_key,
    server.allow_insecure,
    {
      ...logContext,
      id,
    }
  );
};

/**
 * Create VNC WebSocket proxy with binary subprotocol support for a resolved agent.
 */
const createVncWsProxy = async (server, zoneName, search, request, socket, head) => {
  const { WebSocket, WebSocketServer } = await import('ws');
  const backendUrl = `${server.protocol.replace('http', 'ws')}://${server.hostname}:${server.port}/zones/${encodeURIComponent(zoneName)}/vnc/websockify${search}`;

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
      'User-Agent': 'Hyperweaver-Server/1.0',
    },
    perMessageDeflate: false,
    extensions: {},
    compression: 'DISABLED',
    // Honored for wss:// (passed through to https.request), ignored for ws://
    rejectUnauthorized: !server.allow_insecure,
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
 * Proxy a VNC websockify WS upgrade for /api/agents/:id/zones/:zone/vnc/websockify.
 */
const handleAgentVncUpgrade = async (id, zoneName, search, request, socket, head) => {
  const server = await resolveAgentForWs(id);
  if (!server || !server.api_key) {
    log.websocket.error('WebSocket VNC: agent not found or missing API key', { id, zoneName });
    socket.destroy();
    return;
  }
  await createVncWsProxy(server, zoneName, search, request, socket, head);
};

/**
 * Handle WebSocket upgrades for the unified agent namespace (dual-mode plan §4.2):
 * zlogin, term, ssh, logs/stream, tasks/:id/stream, and VNC websockify — all keyed by
 * registry id. The UI derives these paths itself; agents keep returning raw sessions.
 */
const handleWebSocketUpgrade = async (request, socket, head) => {
  try {
    const url = new URL(request.url, `https://${request.headers.host}`);
    // search is forwarded verbatim to the agent backend (WS ticket auth rides ?ticket=…)
    const { pathname, search } = url;

    // /api/agents/:id/zones/:zone/vnc/websockify
    const vncMatch = pathname.match(
      /^\/api\/agents\/(?<id>[^/]+)\/zones\/(?<zone>[^/]+)\/vnc\/websockify/
    );
    if (vncMatch) {
      // Decode the pathname segment exactly once — createVncWsProxy re-encodes it once;
      // the agent decodes once, so passing the raw segment through double-encodes it.
      await handleAgentVncUpgrade(
        vncMatch.groups.id,
        decodeURIComponent(vncMatch.groups.zone),
        search,
        request,
        socket,
        head
      );
      return;
    }

    // /api/agents/:id/tasks/:taskId/stream
    const taskMatch = pathname.match(
      /^\/api\/agents\/(?<id>[^/]+)\/tasks\/(?<taskId>[a-fA-F0-9-]+)\/stream/
    );
    if (taskMatch) {
      await handleAgentWsUpgrade(
        taskMatch.groups.id,
        `tasks/${taskMatch.groups.taskId}/stream`,
        search,
        request,
        socket,
        head,
        { type: 'task-stream', taskId: taskMatch.groups.taskId }
      );
      return;
    }

    // /api/agents/:id/logs/stream/:sessionId
    const logsMatch = pathname.match(
      /^\/api\/agents\/(?<id>[^/]+)\/logs\/stream\/(?<sessionId>[^/]+)/
    );
    if (logsMatch) {
      await handleAgentWsUpgrade(
        logsMatch.groups.id,
        `logs/stream/${logsMatch.groups.sessionId}`,
        search,
        request,
        socket,
        head,
        { type: 'logs-stream', sessionId: logsMatch.groups.sessionId }
      );
      return;
    }

    // /api/agents/:id/(zlogin|term|ssh)/:sessionId
    const sessionMatch = pathname.match(
      /^\/api\/agents\/(?<id>[^/]+)\/(?<type>zlogin|term|ssh)\/(?<sessionId>[^/]+)/
    );
    if (sessionMatch) {
      await handleAgentWsUpgrade(
        sessionMatch.groups.id,
        `${sessionMatch.groups.type}/${sessionMatch.groups.sessionId}`,
        search,
        request,
        socket,
        head,
        { type: sessionMatch.groups.type, sessionId: sessionMatch.groups.sessionId }
      );
      return;
    }

    log.websocket.debug('WebSocket upgrade rejected: no /api/agents pattern matched', {
      pathname,
    });
    socket.destroy();
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
    const opensslCmd = `openssl req -x509 -nodes -days 365 -newkey rsa:2048 -keyout "${keyPath}" -out "${certPath}" -subj "/C=US/ST=State/L=City/O=Hyperweaver/CN=localhost"`;

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
