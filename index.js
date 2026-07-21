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
import { handleWebSocketUpgrade } from './utils/wsProxy.js';
import { generateSSLCertificatesIfNeeded } from './utils/sslSetup.js';
import { csrfProtection } from './auth/csrfProtection.js';

/**
 * Dark Swagger theme shared with the Hyperweaver UI + docs site (config/swagger-theme.css).
 * Read once at module load; injected as swagger-ui-express customCss on /api-docs and
 * on the selected-agent shell below.
 */
const swaggerCustomCss = fs.readFileSync(
  new URL('./config/swagger-theme.css', import.meta.url),
  'utf8'
);

/**
 * Themed shell for the selected-agent API docs (/agent/api-docs). It loads swagger-ui's
 * assets from /api-docs (already served) and its spec from the same-origin relay, reading
 * the selected host id from ?server= in the browser.
 */
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

let passport;

process.on('uncaughtException', err => {
  log.app.error('Uncaught Exception', {
    error: err.message,
    stack: err.stack,
  });
});

const config = loadConfig();

/**
 * Fail-fast on a weak/placeholder JWT secret (contract §4). HS256 signs BOTH the app JWT
 * and the express-session cookie below, so a missing, placeholder, or short secret forges
 * every session.
 */
const jwtSecret = config.authentication?.jwt_secret?.value;
if (!jwtSecret || jwtSecret === '__JWT_SECRET_FROM_FILE__' || jwtSecret.length < 32) {
  log.app.error(
    'FATAL: authentication.jwt_secret is missing, the unreplaced placeholder, or too weak ' +
      '(minimum 32 characters). Set a strong random secret before starting. Refusing to start.'
  );
  process.exit(1);
}

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

const corsOptions = {
  origin: config.security.cors.allow_origin.value,
  preflightContinue: config.security.cors.preflight_continue.value,
  credentials: config.security.cors.credentials.value,
};

app.set('trust proxy', config.frontend.trust_proxy.value);
app.use(cors(corsOptions));
app.options('*splat', cors(corsOptions));
app.use(express.json({ limit: '50mb' }));

app.use(express.static('./ui'));

const UserModel = db.user;

log.database.info('Sequelize models loaded and ready');

const SessionStore = SequelizeStore(session.Store);
const sessionStore = new SessionStore({
  db: db.sequelize,
  tableName: 'Sessions',
  checkExpirationInterval: 15 * 60 * 1000,
  expiration: 30 * 60 * 1000,
});

/**
 * Key separation: derive the session-cookie signing key from the JWT secret instead of
 * reusing it verbatim — one master secret in config, two independent per-purpose keys.
 */
const sessionSecret = crypto
  .createHash('sha256')
  .update(`hyperweaver-session:${jwtSecret}`)
  .digest('hex');

app.use(
  session({
    secret: sessionSecret,
    store: sessionStore,
    name: 'hyperweaver-server.sid',
    resave: false,
    saveUninitialized: false,
    rolling: true,
    cookie: {
      secure: config.server.ssl_enabled.value,
      httpOnly: true,
      maxAge: 30 * 60 * 1000,
      sameSite: 'lax',
    },
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

(async () => {
  try {
    await delay(1000);

    try {
      await UserModel.findOne({ limit: 1 });
      log.database.info('Database schema ready for authentication');
    } catch {
      log.database.info('Waiting for database migrations to complete...');
      await delay(3000);
    }

    const passportModule = await import('./auth/passport.js');
    passport = passportModule.default;

    app.use(passport.initialize());
    app.use(passport.session());
    log.auth.info('Passport.js initialized with session support');
  } catch (error) {
    log.auth.error('Failed to initialize Passport', { error: error.message });
    log.auth.warn('Authentication will fall back to JWT-only mode');
  }
})();

startAgentHealthPoller();

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

app.use(csrfProtection);

app.use(router);

app.use('/api-docs', swaggerUi.serve, (req, res, next) => {
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

/**
 * Selected-agent API docs (Aggregated mode). The Hyperweaver UI's "Agent API" reference
 * opens /agent/api-docs?server={id}, where id is the host selected in the navbar. This
 * themed shell loads swagger-ui from /api-docs and its spec from the relay below.
 */
app.get('/agent/api-docs', (req, res) => {
  void req;
  res.type('html').send(agentApiDocsHtml);
});

/**
 * Relay: fetch the selected agent's own OpenAPI spec server-side (no browser CORS,
 * and NAT'd agents still work since the Server reaches them), then point "Try it out"
 * back through this Server's authenticated agent proxy.
 */
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

app.get('*splat', staticFileLimiter, (req, res) => {
  void req;
  res.sendFile('./ui/index.html', { root: '.' });
});

(async () => {
  if (config.server.ssl_enabled.value) {
    await generateSSLCertificatesIfNeeded();

    try {
      const privateKey = fs.readFileSync(config.server.ssl_key_path.value, 'utf8');
      const certificate = fs.readFileSync(config.server.ssl_cert_path.value, 'utf8');

      const credentials = { key: privateKey, cert: certificate };

      if (config.server.ssl_ca_path?.value) {
        const ca = fs.readFileSync(config.server.ssl_ca_path.value, 'utf8');
        credentials.ca = ca;
      }

      const httpsServer = https.createServer(credentials, app);

      httpsServer.on('upgrade', handleWebSocketUpgrade);

      httpsServer.listen(port, () => {
        log.app.info('HTTPS Server started', { port });
      });

      /**
       * server.force_secure (AGREED cross-repo contract, default true):
       * true  → the plain-HTTP port serves ONLY 308 redirects to the HTTPS listener
       *         (client's host kept, HTTPS port pinned, path+query preserved; WS upgrades
       *         are dropped — no upgrade handler on this listener).
       * false → dual-serve: the HTTP port serves the full app + WS upgrades alongside HTTPS.
       */
      const forceSecure = config.server.force_secure?.value !== false;
      if (forceSecure) {
        const redirectApp = express();
        redirectApp.use((req, res) => {
          const rawHost = req.headers.host || config.server.hostname.value;
          const hostname = rawHost.startsWith('[')
            ? rawHost.replace(/^(?<bracketed>\[[^\]]+\]).*$/, '$<bracketed>')
            : rawHost.replace(/:\d+$/, '');
          const portSuffix = Number(port) === 443 ? '' : `:${port}`;
          res.redirect(308, `https://${hostname}${portSuffix}${req.url}`);
        });

        const httpServer = http.createServer(redirectApp);
        httpServer.listen(80, () => {
          log.app.info('HTTP Server started - 308 redirect to HTTPS (force_secure)', {
            port: 80,
            httpsPort: port,
          });
        });
      } else {
        const httpServer = http.createServer(app);
        httpServer.on('upgrade', handleWebSocketUpgrade);
        httpServer.listen(80, () => {
          log.app.info('HTTP Server started - dual-serve mode (force_secure=false)', {
            port: 80,
            httpsPort: port,
          });
        });
      }
    } catch (error) {
      log.app.error('SSL Certificate Error', { error: error.message });
      log.app.warn('Falling back to HTTP server...');

      const httpServer = http.createServer(app);
      httpServer.on('upgrade', handleWebSocketUpgrade);

      httpServer.listen(port, () => {
        log.app.warn('HTTP Server started (SSL certificates not found)', { port });
      });
    }
  } else {
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

export { config };
