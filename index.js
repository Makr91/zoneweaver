import express from "express";
import https from "https";
import http from "http";
import fs from "fs";
import cors from "cors";
import session from "express-session";
import YAML from "yaml";
import rateLimit from "express-rate-limit";
import router from "./routes/index.js";
import db from "./models/index.js";
import { createProxyMiddleware } from "http-proxy-middleware";
import { specs, swaggerUi } from "./config/swagger.js";
import { loadConfig } from "./utils/config.js";

// Prevent server crashes from unhandled WebSocket errors
process.on('uncaughtException', (err) => {
  console.error('🚨 Uncaught Exception:', err.message);
  console.error('Stack:', err.stack);
  // Don't exit, just log the error to prevent crashes
});

// Load configuration from YAML file
const config = loadConfig();

// 🛡️ Static File Rate Limiting Configuration (CodeQL Security Fix)
// Create rate limiter for static file serving endpoints
const rlConfig = config.rateLimiting || {};
const staticFileLimiter = rateLimit({
  windowMs: rlConfig.staticFiles?.windowMs?.value || 15 * 60 * 1000,
  max: rlConfig.staticFiles?.max?.value || 1000,
  message: { error: rlConfig.staticFiles?.message?.value || 'Too many static file requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

const app = express();
const port = process.env.PORT || config.frontend.port;

// Track active VNC sessions for WebSocket fallback
const activeVncSessions = new Map();

// CORS configuration from YAML
const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || config.cors.whitelist.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  origin: config.cors.options.origin,
  preflightContinue: config.cors.options.preflightContinue,
  credentials: config.cors.options.credentials,
};

app.set("trust proxy", config.environment.trust_proxy);
app.use(cors(corsOptions));
app.options("*splat", cors(corsOptions));
app.use(express.json());

// Serve static files from the React app build
app.use(express.static('./web/dist'));

// Session store configuration using connect-session-sequelize
let sessionStore;
try {
  const SequelizeStore = (await import('connect-session-sequelize')).default(session.Store);
  const sessionTableName = config.session?.table?.value || 'sessions';
  
  sessionStore = new SequelizeStore({
    db: db.sequelize,
    tableName: sessionTableName,
    checkExpirationInterval: 15 * 60 * 1000, // 15 minutes
    expiration: 24 * 60 * 60 * 1000 // 24 hours
  });
  
  // Sync session table
  sessionStore.sync();
  
  console.log(`✅ Using Sequelize session store (table: ${sessionTableName})`);
} catch (error) {
  console.error('Failed to initialize Sequelize session store:', error.message);
  console.log('Falling back to MemoryStore (not recommended for production)');
  sessionStore = null; // Will use default MemoryStore
}

// Session configuration
app.use(session({
  store: sessionStore,
  secret: config.security.jwt_secret || 'fallback-session-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: config.server.ssl.enabled, // Use secure cookies in production with HTTPS
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Database and models are already initialized via models/index.js import
// Access models via db.server, db.user, etc.
const ServerModel = db.server;
const UserModel = db.user;
const OrganizationModel = db.organization;
const InvitationModel = db.invitation;
let serverModelReady = true; // Models are ready immediately after import

console.log('✅ Sequelize models loaded and ready');

// Middleware to track VNC console requests for WebSocket fallback
app.use('/api/servers/:serverAddress/zones/:zoneName/vnc/console', (req, res, next) => {
  const { serverAddress, zoneName } = req.params;
  const clientId = req.ip || req.connection.remoteAddress;
  
  console.log(`🔗 VNC Console: Tracking session ${zoneName} on ${serverAddress} for client ${clientId}`);
  
  // Store the mapping for WebSocket fallback
  activeVncSessions.set(clientId, { serverAddress, zoneName });
  
  // Clean up old sessions after 5 minutes
  setTimeout(() => {
    activeVncSessions.delete(clientId);
  }, 5 * 60 * 1000);
  
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
        description: 'Current server (auto-detected)'
      },
      {
        url: '{protocol}://{host}',
        description: 'Custom server',
        variables: {
          protocol: {
            enum: ['http', 'https'],
            default: 'https',
            description: 'The protocol used to access the server'
          },
          host: {
            default: 'localhost:3000',
            description: 'The hostname and port of the server'
          }
        }
      }
    ]
  };
  
  swaggerUi.setup(dynamicSpecs, {
    explorer: true,
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'Zoneweaver API Documentation',
    swaggerOptions: {
      url: `${protocol}://${host}/api-docs/swagger.json`
    }
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
        description: 'Current server (auto-detected)'
      }
    ]
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
    
    // Check if this is a VNC or Terminal WebSocket request
    const vncMatch = url.pathname.match(/^\/api\/servers\/([^\/]+)\/zones\/([^\/]+)\/vnc\/websockify/);
    const termMatch = url.pathname.match(/^\/term\/([^\/]+)/);
    const zloginMatch = url.pathname.match(/^\/zlogin\/([^\/]+)/);

    if (zloginMatch) {
      const sessionId = zloginMatch[1];

      if (!serverModelReady || !ServerModel) {
        console.error(`${timestamp} - WebSocket zlogin - /zlogin/${sessionId} - ServerModel not initialized`);
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
        console.error(`${timestamp} - WebSocket zlogin - /zlogin/${sessionId} - Could not determine target server`);
        socket.destroy();
        return;
      }

      const [hostname, port] = serverAddress.split(':');
      const server = await ServerModel.getServer(hostname, parseInt(port || 5001), 'https');

      if (!server || !server.api_key) {
        console.error(`${timestamp} - WebSocket zlogin - /zlogin/${sessionId} - No server or API key for ${hostname}:${port}`);
        socket.destroy();
        return;
      }

      const { WebSocket, WebSocketServer } = await import('ws');
      const backendUrl = `${server.protocol.replace('http', 'ws')}://${server.hostname}:${server.port}/zlogin/${sessionId}`;

      const wss = new WebSocketServer({ noServer: true });
      const backendWs = new WebSocket(backendUrl, {
        headers: {
          'Authorization': `Bearer ${server.api_key}`,
          'User-Agent': 'Zoneweaver-Proxy/1.0'
        }
      });

      // Add immediate error handler to prevent server crashes
      backendWs.on('error', (err) => {
        console.error(`${timestamp} - WebSocket zlogin - ${backendUrl} - ${err.message}`);
        socket.destroy(); // Close the client connection gracefully
      });

      wss.handleUpgrade(request, socket, head, (clientWs) => {
        backendWs.on('open', () => {
          console.log(`${timestamp} - WebSocket zlogin - ${backendUrl}`);
          clientWs.on('message', (data) => backendWs.send(data));
          backendWs.on('message', (data) => clientWs.send(data));
          clientWs.on('close', () => backendWs.close());
          backendWs.on('close', () => clientWs.close());
        });
      });
      return;
    }

    if (termMatch) {
      const sessionId = termMatch[1];
      console.log(`🔌 WebSocket upgrade for terminal session: ${sessionId}`);

      if (!serverModelReady || !ServerModel) {
        console.error(`🔌 WebSocket upgrade failed: ServerModel not fully initialized yet for terminal session ${sessionId}`);
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
        console.error(`🔌 WebSocket upgrade failed: Could not determine target server for terminal session ${sessionId}`);
        socket.destroy();
        return;
      }

      const [hostname, port] = serverAddress.split(':');
      const server = await ServerModel.getServer(hostname, parseInt(port || 5001), 'https');

      if (!server || !server.api_key) {
        console.error(`🔌 WebSocket upgrade failed: No server or API key for ${hostname}:${port}`);
        socket.destroy();
        return;
      }

      const { WebSocket, WebSocketServer } = await import('ws');
      const backendUrl = `${server.protocol.replace('http', 'ws')}://${server.hostname}:${server.port}/term/${sessionId}`;
      console.log(`🔌 Connecting to backend terminal WebSocket: ${backendUrl}`);

      const wss = new WebSocketServer({ noServer: true });
      const backendWs = new WebSocket(backendUrl, {
        headers: {
          'Authorization': `Bearer ${server.api_key}`,
          'User-Agent': 'Zoneweaver-Proxy/1.0'
        }
      });

      // Add immediate error handler to prevent server crashes
      backendWs.on('error', (err) => {
        console.error(`🔌 Backend WebSocket connection failed for terminal ${sessionId}:`, err.message);
        socket.destroy(); // Close the client connection gracefully
      });

      wss.handleUpgrade(request, socket, head, (clientWs) => {
        console.log(`🔌 Client WebSocket established for terminal session ${sessionId}`);
        backendWs.on('open', () => {
          console.log(`🔌 Backend WebSocket connected for terminal session ${sessionId}`);
          clientWs.on('message', (data) => backendWs.send(data));
          backendWs.on('message', (data) => clientWs.send(data));
          clientWs.on('close', () => backendWs.close());
          backendWs.on('close', () => clientWs.close());
        });
      });
      return;
    }
    
    // Handle fallback for noVNC default /websockify path
    if (url.pathname === '/websockify') {
      console.log(`🔌 WebSocket fallback: /websockify detected, need to extract server/zone from referer`);
      console.log(`🔌 WebSocket fallback: referer = ${request.headers.referer}`);
      console.log(`🔌 WebSocket fallback: origin = ${request.headers.origin}`);
      
      // Since referer might not have API path, try to maintain a mapping of active VNC sessions
      // For now, let's add a simple mapping based on recent VNC console requests
      
      // Check if we can extract zone info from URL params in referer
      const referer = request.headers.referer || request.headers.origin;
      let serverAddress = null;
      let zoneName = null;
      
      if (referer) {
        // Try to find zone info in URL fragments or query params
        const urlMatch = referer.match(/\/zones\/([^\/\?#]+)/);
        if (urlMatch) {
          zoneName = urlMatch[1];
          console.log(`🔌 WebSocket fallback: found zone in URL: ${zoneName}`);
          
          // For now, assume the most recent server (could be improved with session mapping)
          serverAddress = 'hv-04-backend.home.m4kr.net:5001'; // Default from your logs
          console.log(`🔌 WebSocket fallback: using default server: ${serverAddress}`);
        }
      }
      
      if (serverAddress && zoneName) {
        console.log(`🔌 WebSocket fallback: extracted ${zoneName} on ${serverAddress}`);
        
        // Redirect to proper VNC WebSocket handling
        request.url = `/api/servers/${serverAddress}/zones/${zoneName}/vnc/websockify`;
        url.pathname = request.url;
        console.log(`🔌 WebSocket fallback: redirected to ${request.url}`);
      } else {
        console.log(`🔌 WebSocket fallback: could not extract server/zone info from referer`);
        
        // Try to get from stored active sessions
        const clientId = request.connection.remoteAddress || request.socket.remoteAddress;
        console.log(`🔌 WebSocket fallback: checking stored sessions for client ${clientId}`);
        
        const storedSession = activeVncSessions.get(clientId);
        if (storedSession) {
          serverAddress = storedSession.serverAddress;
          zoneName = storedSession.zoneName;
          console.log(`🔌 WebSocket fallback: found stored session ${zoneName} on ${serverAddress}`);
          
          // Redirect to proper VNC WebSocket handling
          request.url = `/api/servers/${serverAddress}/zones/${zoneName}/vnc/websockify`;
          url.pathname = request.url;
          console.log(`🔌 WebSocket fallback: redirected to ${request.url} from stored session`);
        } else {
          console.log(`🔌 WebSocket fallback: no stored session found for client ${clientId}`);
          console.log(`🔌 WebSocket fallback: active sessions:`, Array.from(activeVncSessions.keys()));
        }
      }
    }
    
    const finalVncMatch = url.pathname.match(/^\/api\/servers\/([^\/]+)\/zones\/([^\/]+)\/vnc\/websockify/);
    
    if (!finalVncMatch) {
      console.log(`🔌 WebSocket upgrade rejected: URL doesn't match VNC pattern: ${url.pathname}`);
      socket.destroy();
      return;
    }
    
    const [, serverAddress, zoneName] = finalVncMatch;
    const [hostname, port] = serverAddress.split(':');
    
    console.log(`🔌 WebSocket upgrade for ${zoneName} on ${hostname}:${port}`);
    
    if (!serverModelReady || !ServerModel) {
      console.error(`🔌 WebSocket upgrade failed: ServerModel not fully initialized yet for VNC session ${zoneName}`);
      socket.destroy();
      return;
    }
    
    const server = await ServerModel.getServer(hostname, parseInt(port || 5001), 'https');
    
    if (!server || !server.api_key) {
      console.error(`🔌 WebSocket upgrade failed: No server or API key for ${hostname}:${port}`);
      socket.destroy();
      return;
    }
    
    // Import WebSocket and WebSocketServer for proper WebSocket-to-WebSocket proxying
    const { WebSocket, WebSocketServer } = await import('ws');
    
    // Create WebSocket connection to backend
    const backendUrl = `${server.protocol.replace('http', 'ws')}://${server.hostname}:${server.port}/zones/${encodeURIComponent(zoneName)}/vnc/websockify`;
    
    console.log(`🔌 Connecting to backend WebSocket: ${backendUrl}`);
    
    // Create WebSocket server for the client connection with no compression
    const wss = new WebSocketServer({ 
      noServer: true,
      perMessageDeflate: false,
      compression: 'DISABLED',
      handleProtocols: (protocols) => {
        // Handle binary subprotocol for VNC connections
        return Array.from(protocols).includes('binary') ? 'binary' : Array.from(protocols)[0] || null;
      }
    });
    
    // Create backend WebSocket with binary subprotocol but no compression/extensions
    const backendWs = new WebSocket(backendUrl, ['binary'], {
      headers: {
        'Authorization': `Bearer ${server.api_key}`,
        'User-Agent': 'Zoneweaver-Proxy/1.0'
      },
      // Disable all extensions to prevent frame issues  
      perMessageDeflate: false,
      extensions: {},
      compression: 'DISABLED'
    });
    
    // Add immediate error handler to prevent server crashes
    backendWs.on('error', (err) => {
      console.error(`🔌 Backend WebSocket connection failed for VNC ${zoneName}:`, err.message);
      socket.destroy(); // Close the client connection gracefully
    });
    
    // Handle WebSocket upgrade
    wss.handleUpgrade(request, socket, head, (clientWs) => {
      console.log(`🔌 Client WebSocket established for ${zoneName}`);
      
      // Wait for backend connection before setting up forwarding
      backendWs.on('open', () => {
        console.log(`🔌 Backend WebSocket connected for ${zoneName}`);
        
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
          console.log(`🔌 Client WebSocket disconnected for ${zoneName}`);
          backendWs.close();
        });
        
        clientWs.on('error', (err) => {
          console.error(`🔌 Client WebSocket error for ${zoneName}:`, err.message);
          backendWs.close();
        });
        
        backendWs.on('close', () => {
          console.log(`🔌 Backend WebSocket closed for ${zoneName}`);
          if (clientWs.readyState === WebSocket.OPEN) {
            clientWs.close();
          }
        });
        
        backendWs.on('error', (err) => {
          console.error(`🔌 Backend WebSocket error for ${zoneName}:`, err.message);
          if (clientWs.readyState === WebSocket.OPEN) {
            clientWs.close();
          }
        });
      });
      
      backendWs.on('error', (err) => {
        console.error(`🔌 Failed to connect to backend WebSocket for ${zoneName}:`, err.message);
        clientWs.close();
      });
    });
    
  } catch (error) {
    console.error('🔌 WebSocket upgrade error:', error.message);
    socket.destroy();
  }
}

/**
 * Generate SSL certificates if they don't exist and generate_ssl is enabled
 */
async function generateSSLCertificatesIfNeeded() {
  if (!config.server.ssl.generate_ssl) {
    return false; // SSL generation disabled
  }

  const keyPath = config.server.ssl.key;
  const certPath = config.server.ssl.cert;

  // Check if certificates already exist
  if (fs.existsSync(keyPath) && fs.existsSync(certPath)) {
    console.log('SSL certificates already exist, skipping generation');
    return false; // Certificates exist, no need to generate
  }

  try {
    console.log('Generating SSL certificates...');
    
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
    
    console.log('SSL certificates generated successfully');
    console.log(`Key: ${keyPath}`);
    console.log(`Certificate: ${certPath}`);
    
    return true; // Certificates generated successfully
  } catch (error) {
    console.error('Failed to generate SSL certificates:', error.message);
    console.error('Continuing with HTTP fallback...');
    return false; // Generation failed
  }
}

// SSL/HTTPS Configuration
(async () => {
  if (config.server.ssl.enabled) {
    // Try to generate SSL certificates if needed
    await generateSSLCertificatesIfNeeded();
    
    try {
      const privateKey = fs.readFileSync(config.server.ssl.key, 'utf8');
      const certificate = fs.readFileSync(config.server.ssl.cert, 'utf8');
      
      let credentials = { key: privateKey, cert: certificate };
      
      // Add CA certificate if specified
      if (config.server.ssl.ca) {
        const ca = fs.readFileSync(config.server.ssl.ca, 'utf8');
        credentials.ca = ca;
      }

      const httpsServer = https.createServer(credentials, app);
      
      // Add WebSocket upgrade handling for VNC proxy
      httpsServer.on('upgrade', handleWebSocketUpgrade);
      
      httpsServer.listen(port, () => {
        console.log(`HTTPS Server running at port ${port}`);
      });
      
      // Optional: Redirect HTTP to HTTPS
      const httpApp = express();
      httpApp.use((req, res) => {
        res.redirect(`https://${req.headers.host}${req.url}`);
      });
      
      const httpServer = http.createServer(httpApp);
      httpServer.listen(80, () => {
        console.log('HTTP Server running at port 80 - redirecting to HTTPS');
      });
      
    } catch (error) {
      console.error('SSL Certificate Error:', error.message);
      console.log('Falling back to HTTP server...');
      
      // Fallback to HTTP if SSL certificates are not available
      const httpServer = http.createServer(app);
      httpServer.on('upgrade', handleWebSocketUpgrade);
      
      httpServer.listen(port, () => {
        console.log(`HTTP Server running at port ${port} (SSL certificates not found)`);
      });
    }
  } else {
    // HTTP only mode
    const httpServer = http.createServer(app);
    httpServer.on('upgrade', handleWebSocketUpgrade);
    
    httpServer.listen(port, () => {
      console.log(`HTTP Server running at port ${port}`);
      console.log(`API Documentation: http://localhost:${port}/api-docs`);
    });
  }
})();

// Export config for use in other modules
export { config };
