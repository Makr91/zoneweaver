import ServerModel from '../models/ServerModel.js';

// Cache for server lookups to avoid database hits on every asset request
const serverCache = new Map();
const CACHE_TTL = 30000; // 30 seconds

/**
 * Server controller for managing WebHyve backend connections
 * This replaces the per-user API key system with application-level server management
 */
class ServerController {
  
  /**
   * Get server with caching to improve performance
   * @param {string} hostname - Server hostname
   * @param {number} port - Server port
   * @param {string} protocol - Server protocol
   * @returns {Object|null} - Cached server object or null
   */
  static async getCachedServer(hostname, port, protocol) {
    const cacheKey = `${hostname}:${port}:${protocol}`;
    const cached = serverCache.get(cacheKey);
    
    if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
      return cached.server;
    }
    
    // Fetch from database
    const server = await ServerModel.getServer(hostname, port, protocol);
    
    // Cache the result
    serverCache.set(cacheKey, {
      server,
      timestamp: Date.now()
    });
    
    return server;
  }
  /**
   * Add a new WebHyve server (Admin only)
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async addServer(req, res) {
    try {
      const { hostname, port, protocol, entityName, description, apiKey } = req.body;

      // Validation
      if (!hostname || !port || !protocol || !entityName) {
        return res.status(400).json({ 
          success: false, 
          message: 'Hostname, port, protocol, and entity name are required' 
        });
      }

      // Add server with bootstrap or existing API key
      const server = await ServerModel.addServer({
        hostname,
        port: parseInt(port),
        protocol,
        entityName,
        description,
        apiKey
      });

      res.json({
        success: true,
        message: 'Server added successfully',
        server: {
          id: server.id,
          hostname: server.hostname,
          port: server.port,
          protocol: server.protocol,
          entityName: server.entity_name,
          description: server.description
        }
      });
    } catch (error) {
      console.error('Add server error:', error);
      res.status(500).json({ 
        success: false, 
        message: error.message || 'Failed to add server' 
      });
    }
  }

  /**
   * Get all servers (Available to all users)
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async getAllServers(req, res) {
    try {
      const servers = await ServerModel.getAllServers();

      res.json({
        success: true,
        servers: servers
      });
    } catch (error) {
      console.error('Get servers error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to retrieve servers' 
      });
    }
  }

  /**
   * Test server connectivity
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async testServer(req, res) {
    try {
      const { hostname, port, protocol } = req.body;

      // Validation
      if (!hostname || !port || !protocol) {
        return res.status(400).json({ 
          success: false, 
          message: 'Hostname, port, and protocol are required' 
        });
      }

      // Test the server
      const testResult = await ServerModel.testServer(hostname, parseInt(port), protocol);

      res.json({
        success: testResult.success,
        message: testResult.success ? 'Connection successful' : 'Connection failed',
        error: testResult.error || null,
        serverInfo: testResult.success ? testResult.data : null
      });
    } catch (error) {
      console.error('Test server error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to test server connection' 
      });
    }
  }

  /**
   * Remove a server (Admin only)
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async removeServer(req, res) {
    try {
      const { serverId } = req.params;

      if (!serverId) {
        return res.status(400).json({ 
          success: false, 
          message: 'Server ID is required' 
        });
      }

      const success = await ServerModel.removeServer(parseInt(serverId));

      if (!success) {
        return res.status(404).json({ 
          success: false, 
          message: 'Server not found or already removed' 
        });
      }

      res.json({
        success: true,
        message: 'Server removed successfully'
      });
    } catch (error) {
      console.error('Remove server error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to remove server' 
      });
    }
  }

  /**
   * Proxy request to WebHyve backend
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async proxyToWebHyve(req, res) {
    try {
      const { hostname, port, protocol } = req.params;
      const path = req.params[0] || ''; // Capture the rest of the path

      // Create clean headers for WebHyve request - explicitly exclude problematic headers
      const cleanHeaders = {};
      for (const [key, value] of Object.entries(req.headers)) {
        // Skip headers that should not be forwarded to WebHyve
        if (!['host', 'authorization', 'cookie'].includes(key.toLowerCase())) {
          cleanHeaders[key] = value;
        }
      }

      // Prepare request data - don't send empty objects
      let requestData = undefined;
      if (req.method !== 'GET' && req.method !== 'DELETE') {
        // Only send data if there's actual content
        if (req.body && Object.keys(req.body).length > 0) {
          requestData = req.body;
        }
      }

      // Make request through ServerModel
      const result = await ServerModel.makeRequest(
        hostname, 
        parseInt(port), 
        protocol, 
        path, 
        {
          method: req.method,
          data: requestData,
          params: req.query,
          headers: cleanHeaders
        }
      );

      if (result.success) {
        res.status(result.status || 200).json(result.data);
      } else {
        const status = result.status || 500;
        res.status(status).json({ 
          success: false, 
          message: result.error || 'Proxy request failed' 
        });
      }
    } catch (error) {
      console.error('WebHyve proxy error:', error.message);
      res.status(500).json({
        success: false,
        message: 'Proxy request failed'
      });
    }
  }

  /**
   * General VNC proxy for all VNC-related requests (WebSocket, static assets, etc.)
   * Enhanced to work with the new WebHyve backend implementation
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async proxyVncGeneral(req, res) {
    try {
      const { serverAddress, zoneName } = req.params;
      const vncPath = req.params[0] || ''; // Capture the VNC sub-path
      
      // Parse hostname and port from serverAddress
      const [hostname, port] = serverAddress.split(':');
      
      // Use cached server lookup to avoid database hits on every asset request
      const server = await ServerController.getCachedServer(hostname, parseInt(port || 5001), 'https');

      if (!server) {
        console.error(`🔗 VNC Asset: Server not found - ${hostname}:${port}`);
        return res.status(404).json({
          success: false,
          message: `WebHyve server ${hostname}:${port} not found in ZoneWeaver configuration`,
          asset_path: vncPath
        });
      }

      if (!server.api_key) {
        console.error(`🔗 VNC Asset: No API key for server ${hostname}:${port}`);
        return res.status(500).json({
          success: false,
          message: `No API key configured for WebHyve server ${hostname}:${port}`,
          asset_path: vncPath
        });
      }

      // Import required modules
      const axios = (await import('axios')).default;
      
      // Check if this is a WebSocket upgrade request
      if (req.headers.upgrade && req.headers.upgrade.toLowerCase() === 'websocket') {
        console.log(`🔌 WebSocket upgrade request for VNC path: ${vncPath}`);
        
        // Use native WebSocket implementation for better control
        // This will be handled by the WebSocket upgrade handler in index.js
        return;
      }

      // Handle regular HTTP requests (static assets, API calls)
      const queryString = req.url.split('?')[1];
      
      // Construct the WebHyve URL - aligned with backend's new asset routing
      let webhyveUrl = `${server.protocol}://${server.hostname}:${server.port}/zones/${encodeURIComponent(zoneName)}/vnc/${vncPath}`;
      
      // Append query parameters if present
      if (queryString) {
        webhyveUrl += `?${queryString}`;
      }
      
      // Only log CSS files and console requests to reduce noise
      const needsLogging = vncPath.includes('console') || vncPath.endsWith('.css');
      if (needsLogging) {
        console.log(`🔗 VNC Asset: Proxying ${vncPath || 'root'} to ${webhyveUrl}`);
      }

      try {
        // Make authenticated request to WebHyve backend
        const requestHeaders = {
          'Authorization': `Bearer ${server.api_key}`,
          'User-Agent': 'ZoneWeaver-Proxy/1.0'
        };

        // Forward relevant headers from original request
        if (req.headers.accept) requestHeaders.Accept = req.headers.accept;
        if (req.headers['accept-encoding']) requestHeaders['Accept-Encoding'] = req.headers['accept-encoding'];
        if (req.headers['accept-language']) requestHeaders['Accept-Language'] = req.headers['accept-language'];

        const response = await axios({
          method: req.method,
          url: webhyveUrl,
          headers: requestHeaders,
          data: req.method !== 'GET' && req.method !== 'DELETE' ? req.body : undefined,
          responseType: 'stream',
          timeout: 30000
        });

        // Apply aggressive no-cache headers for all VNC content
        res.set({
          'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0',
          'Pragma': 'no-cache',
          'Expires': '0',
          'X-Proxied-By': 'ZoneWeaver',
          'X-Frame-Options': 'SAMEORIGIN'
        });

        // Check if this is an iframe request - skip all processing for iframe isolation
        const isIframeRequest = req.headers['sec-fetch-dest'] === 'iframe' || 
                               req.headers.referer?.includes('/zones/') ||
                               req.get('X-Requested-With') === 'iframe';

        // Check if this is a CSS file that needs scoping - but skip for iframes
        const contentType = response.headers['content-type'] || '';
        const needsCssScoping = !isIframeRequest && (contentType.includes('text/css') || vncPath.endsWith('.css'));

        if (isIframeRequest) {
          // Only log first few assets and CSS files for iframe requests to reduce noise
          const shouldLog = needsLogging || vncPath.endsWith('.css') || vncPath.includes('core/rfb.js') || vncPath.includes('ui.js');
          if (shouldLog) {
            console.log(`🖼️ VNC IFRAME: Passing ${vncPath} through unmodified for iframe isolation`);
          }
          
          // Pass through completely unmodified for true iframe isolation
          res.set({
            'Content-Type': contentType,
            'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0',
            'Pragma': 'no-cache',
            'Expires': '0',
            'X-Proxied-By': 'ZoneWeaver-Iframe',
            'X-Frame-Options': 'SAMEORIGIN'
          });

          // Forward other headers except caching ones
          Object.keys(response.headers).forEach(key => {
            const lowerKey = key.toLowerCase();
            if (!['transfer-encoding', 'connection', 'content-type', 'cache-control', 'pragma', 'expires', 'etag', 'last-modified'].includes(lowerKey)) {
              res.set(key, response.headers[key]);
            }
          });

          res.status(response.status);
          response.data.pipe(res);

        } else if (needsCssScoping) {
          // Buffer CSS content for scoping
          let cssContent = '';
          
          response.data.on('data', (chunk) => {
            cssContent += chunk.toString();
          });
          
          response.data.on('end', () => {
            // Apply CSS scoping to prevent conflicts with main app
            const scopedCss = cssContent.replace(/([^{}]+){/g, (match, selector) => {
              const cleanSelector = selector.trim();
              
              // Skip @rules, already scoped selectors, and global selectors
              if (cleanSelector.startsWith('@') || cleanSelector.includes('.vnc-viewer') || cleanSelector === 'html' || cleanSelector === 'body') {
                return match;
              }
              
              // Add .vnc-viewer scope
              return `.vnc-viewer ${cleanSelector} {`;
            });
            
            console.log(`🎨 VNC CSS: Applied scoping to ${vncPath}`);
            
            // Set response headers
            res.set({
              'Content-Type': 'text/css',
              'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0',
              'Pragma': 'no-cache',
              'Expires': '0',
              'X-Proxied-By': 'ZoneWeaver',
              'Content-Length': Buffer.byteLength(scopedCss)
            });
            
            res.status(response.status).send(scopedCss);
          });
          
          response.data.on('error', (error) => {
            console.error('Error reading CSS content for scoping:', error);
            res.status(500).send('/* Error processing CSS */');
          });
          
        } else {
          // Forward response headers except caching ones
          Object.keys(response.headers).forEach(key => {
            const lowerKey = key.toLowerCase();
            if (!['transfer-encoding', 'connection', 'cache-control', 'pragma', 'expires', 'etag', 'last-modified'].includes(lowerKey)) {
              res.set(key, response.headers[key]);
            }
          });

          // Set status and pipe response
          res.status(response.status);
          response.data.pipe(res);
        }

      } catch (proxyError) {
        console.error(`🔗 VNC Asset proxy failed for ${vncPath}:`, proxyError.message);
        
        if (proxyError.response) {
          const statusCode = proxyError.response.status;
          // Handle backend-specific errors as documented by backend AI
          if (statusCode === 404) {
            return res.status(404).json({
              success: false,
              message: 'Asset not found',
              asset_path: vncPath,
              error: 'VNC session may not be active'
            });
          }
          
          res.status(statusCode).json({
            success: false,
            message: `VNC asset proxy error: ${statusCode}`,
            asset_path: vncPath
          });
        } else {
          res.status(500).json({
            success: false,
            message: `VNC asset proxy connection error: ${proxyError.message}`,
            asset_path: vncPath
          });
        }
      }

    } catch (error) {
      console.error('🔗 VNC general proxy error:', error.message);
      res.status(500).json({
        success: false,
        message: 'VNC proxy request failed',
        error: error.message
      });
    }
  }

  /**
   * Proxy VNC console requests with authentication and enhanced error handling
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async proxyVncConsole(req, res) {
    try {
      const { serverAddress, zoneName } = req.params;
      
      // Parse hostname and port from serverAddress
      const [hostname, port] = serverAddress.split(':');
      
      // Use cached server lookup to avoid database hits on every asset request
      const server = await ServerController.getCachedServer(hostname, parseInt(port || 5001), 'https');

      if (!server) {
        console.error(`🔗 VNC Console: Server not found - ${hostname}:${port}`);
        return res.status(404).send(`
          <html>
            <body style="font-family: Arial, sans-serif; padding: 20px; text-align: center;">
              <h2 style="color: #e74c3c;">Server Not Found</h2>
              <p>WebHyve server ${hostname}:${port} not found in ZoneWeaver configuration.</p>
              <p style="color: #7f8c8d; font-size: 0.9em;">Please add this server in ZoneWeaver settings.</p>
            </body>
          </html>
        `);
      }

      if (!server.api_key) {
        console.error(`🔗 VNC Console: No API key for server ${hostname}:${port}`);
        return res.status(500).send(`
          <html>
            <body style="font-family: Arial, sans-serif; padding: 20px; text-align: center;">
              <h2 style="color: #e74c3c;">Configuration Error</h2>
              <p>No API key configured for WebHyve server ${hostname}:${port}</p>
              <p style="color: #7f8c8d; font-size: 0.9em;">
                Please check the server configuration in ZoneWeaver settings.
              </p>
            </body>
          </html>
        `);
      }

      // Import axios for HTTP proxy requests
      const axios = (await import('axios')).default;
      
      // Extract query parameters from the request URL to forward to WebHyve
      const queryString = req.url.split('?')[1];
      
      // Construct the WebHyve VNC console URL - aligned with backend implementation
      let webhyveUrl = `${server.protocol}://${server.hostname}:${server.port}/zones/${encodeURIComponent(zoneName)}/vnc/console`;
      
      // Append query parameters if present (for noVNC configuration)
      if (queryString) {
        webhyveUrl += `?${queryString}`;
      }
      
      console.log(`🔗 VNC Console: Proxying request to ${webhyveUrl}`);

      try {
        // Make authenticated request to WebHyve backend
        const requestHeaders = {
          'Authorization': `Bearer ${server.api_key}`,
          'User-Agent': 'ZoneWeaver-Proxy/1.0',
          'Accept': req.headers.accept || '*/*'
        };
        
        console.log(`Making request with headers:`, { 
          'Authorization': `Bearer ${server.api_key.substring(0, 10)}...`, 
          'User-Agent': requestHeaders['User-Agent'],
          'Accept': requestHeaders['Accept']
        });

        const response = await axios({
          method: req.method,
          url: webhyveUrl,
          headers: requestHeaders,
          responseType: 'stream', // ✅ FIX: Enable streaming response
          timeout: 30000
        });

        // Check if this is an iframe request - if so, skip all processing for true isolation
        const isIframeRequest = req.headers['sec-fetch-dest'] === 'iframe' || 
                               req.headers.referer?.includes('/zones/') ||
                               req.get('X-Requested-With') === 'iframe';

        // Check if this content needs URL rewriting (HTML, JS, CSS) - but skip for iframes
        const contentType = response.headers['content-type'] || '';
        const needsRewriting = !isIframeRequest && (
          contentType.includes('text/html') || 
          contentType.includes('text/css') || 
          contentType.includes('application/javascript') ||
          contentType.includes('text/javascript')
        );

        if (isIframeRequest) {
          console.log(`🖼️ VNC IFRAME: Passing content through unmodified for iframe isolation`);
          
          // Pass through completely unmodified for true iframe isolation
          res.set({
            'Content-Type': contentType,
            'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0',
            'Pragma': 'no-cache',
            'Expires': '0',
            'X-Frame-Options': 'SAMEORIGIN',
            'X-Proxied-By': 'ZoneWeaver-Iframe'
          });

          // Forward other headers except caching ones
          Object.keys(response.headers).forEach(key => {
            const lowerKey = key.toLowerCase();
            if (!['transfer-encoding', 'connection', 'content-type', 'cache-control', 'pragma', 'expires', 'etag', 'last-modified'].includes(lowerKey)) {
              res.set(key, response.headers[key]);
            }
          });

          res.status(response.status);
          response.data.pipe(res);
          
        } else if (needsRewriting) {
          // Buffer the content for rewriting
          let content = '';
          
          response.data.on('data', (chunk) => {
            content += chunk.toString();
          });
          
          response.data.on('end', () => {
            // Get frontend URL details
            const frontendHost = req.get('host');
            const protocol = req.secure || req.get('x-forwarded-proto') === 'https' ? 'https' : 'http';
            const wsProtocol = protocol === 'https' ? 'wss' : 'ws';
            
            let rewrittenContent = content;
            
            // Comprehensive URL rewriting patterns
            const patterns = [
              // Rewrite relative asset paths that start with "app/"
              {
                pattern: /href="app\//g,
                replacement: `href="${protocol}://${frontendHost}/api/servers/${serverAddress}/zones/${encodeURIComponent(zoneName)}/vnc/app/`
              },
              {
                pattern: /src="app\//g,
                replacement: `src="${protocol}://${frontendHost}/api/servers/${serverAddress}/zones/${encodeURIComponent(zoneName)}/vnc/app/`
              },
              // WebSocket URLs
              {
                pattern: new RegExp(`wss?://${server.hostname.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}:${server.port}/websockify`, 'g'),
                replacement: `${wsProtocol}://${frontendHost}/api/servers/${serverAddress}/zones/${encodeURIComponent(zoneName)}/vnc/websockify`
              },
              // HTTP/HTTPS URLs (for assets, API calls, etc.)
              {
                pattern: new RegExp(`https?://${server.hostname.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}:${server.port}/zones/${zoneName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/vnc/`, 'g'),
                replacement: `${protocol}://${frontendHost}/api/servers/${serverAddress}/zones/${encodeURIComponent(zoneName)}/vnc/`
              },
              // Relative URLs that might be constructed dynamically
              {
                pattern: new RegExp(`["'](?:\\.\\./)*zones/${zoneName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/vnc/([^"']*?)["']`, 'g'),
                replacement: `"${protocol}://${frontendHost}/api/servers/${serverAddress}/zones/${encodeURIComponent(zoneName)}/vnc/$1"`
              },
              // JavaScript string concatenation patterns
              {
                pattern: new RegExp(`["']/zones/${zoneName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/vnc/["']`, 'g'),
                replacement: `"${protocol}://${frontendHost}/api/servers/${serverAddress}/zones/${encodeURIComponent(zoneName)}/vnc/"`
              },
              // CSS url() references
              {
                pattern: new RegExp(`url\\(["']?(?:\\.\\./)*zones/${zoneName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/vnc/([^"')]*?)["']?\\)`, 'g'),
                replacement: `url("${protocol}://${frontendHost}/api/servers/${serverAddress}/zones/${encodeURIComponent(zoneName)}/vnc/$1")`
              }
            ];
            
            // Apply all rewriting patterns
            patterns.forEach(({ pattern, replacement }) => {
              const before = rewrittenContent.length;
              rewrittenContent = rewrittenContent.replace(pattern, replacement);
              const after = rewrittenContent.length;
              if (before !== after) {
                console.log(`🔄 URL rewrite applied: ${pattern.source}`);
              }
            });
            
            // Set aggressive no-cache headers for all VNC content
            res.set({
              'Content-Type': contentType,
              'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0',
              'Pragma': 'no-cache',
              'Expires': '0',
              'X-Frame-Options': 'SAMEORIGIN',
              'X-Proxied-By': 'ZoneWeaver',
              'Content-Length': Buffer.byteLength(rewrittenContent),
              // Content Security Policy to block direct backend access
              'Content-Security-Policy': `connect-src 'self' ${wsProtocol}://${frontendHost}; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';`
            });
            
            res.status(response.status).send(rewrittenContent);
          });
          
          response.data.on('error', (error) => {
            console.error('Error reading content for rewriting:', error);
            res.status(500).send('Error processing content');
          });
          
        } else {
          // For binary content (images, etc.), pipe directly with no-cache headers
          res.set({
            'Content-Type': contentType,
            'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0',
            'Pragma': 'no-cache',
            'Expires': '0',
            'X-Frame-Options': 'SAMEORIGIN',
            'X-Proxied-By': 'ZoneWeaver'
          });

          // Forward other headers except caching ones
          Object.keys(response.headers).forEach(key => {
            const lowerKey = key.toLowerCase();
            if (!['transfer-encoding', 'connection', 'content-type', 'cache-control', 'pragma', 'expires', 'etag', 'last-modified'].includes(lowerKey)) {
              res.set(key, response.headers[key]);
            }
          });

          res.status(response.status);
          response.data.pipe(res);
        }

      } catch (proxyError) {
        console.error('VNC proxy request failed:', proxyError.message);
        
        if (proxyError.response) {
          // Handle specific HTTP errors from WebHyve
          const statusCode = proxyError.response.status;
          const errorMessage = proxyError.response.data || proxyError.message;
          
          res.status(statusCode).send(`
            <html>
              <body style="font-family: Arial, sans-serif; padding: 20px; text-align: center;">
                <h2 style="color: #e74c3c;">VNC Console Error</h2>
                <p><strong>Status:</strong> ${statusCode}</p>
                <p><strong>Message:</strong> ${errorMessage}</p>
                <p style="color: #7f8c8d; font-size: 0.9em;">
                  Make sure the zone is running and VNC is enabled.
                </p>
                <button onclick="window.location.reload()" style="padding: 8px 16px; margin-top: 10px;">
                  Retry
                </button>
              </body>
            </html>
          `);
        } else {
          // Network or other errors
          res.status(500).send(`
            <html>
              <body style="font-family: Arial, sans-serif; padding: 20px; text-align: center;">
                <h2 style="color: #e74c3c;">Connection Error</h2>
                <p>Failed to connect to WebHyve backend.</p>
                <p style="color: #7f8c8d; font-size: 0.9em;">
                  ${proxyError.message}
                </p>
                <button onclick="window.location.reload()" style="padding: 8px 16px; margin-top: 10px;">
                  Retry
                </button>
              </body>
            </html>
          `);
        }
      }

    } catch (error) {
      console.error('VNC console proxy error:', error.message);
      res.status(500).send(`
        <html>
          <body style="font-family: Arial, sans-serif; padding: 20px; text-align: center;">
            <h2 style="color: #e74c3c;">Proxy Error</h2>
            <p>Failed to proxy VNC console request.</p>
            <p style="color: #7f8c8d; font-size: 0.9em;">
              ${error.message}
            </p>
            <button onclick="window.location.reload()" style="padding: 8px 16px; margin-top: 10px;">
              Retry
            </button>
          </body>
        </html>
      `);
    }
  }

  /**
   * Start a new terminal session
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async startTerminalSession(req, res) {
    try {
      // For now, we'll just use the most recent server.
      // In the future, we might want to pass the server info from the client.
      const servers = await ServerModel.getAllServers();
      if (servers.length === 0) {
        return res.status(400).json({
          success: false,
          message: "No servers configured."
        });
      }
      const server = await ServerModel.getServer(servers[0].hostname, servers[0].port, servers[0].protocol);

      const result = await ServerModel.makeRequest(
        server.hostname,
        server.port,
        server.protocol,
        'terminal/start',
        { method: 'POST' }
      );

      if (result.success) {
        res.json({ success: true, session: result.data });
      } else {
        res.status(result.status || 500).json({
          success: false,
          message: result.error || 'Failed to start terminal session'
        });
      }
    } catch (error) {
      console.error('Start terminal session error:', error.message);
      res.status(500).json({
        success: false,
        message: 'Failed to start terminal session'
      });
    }
  }

  /**
   * Start a new zlogin session
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async startZloginSession(req, res) {
    try {
      const { serverAddress, zoneName } = req.params;
      console.log('🚀 ZLOGIN START: Received request', {
        serverAddress,
        zoneName,
        timestamp: new Date().toISOString()
      });

      const [hostname, port] = serverAddress.split(':');
      const server = await ServerController.getCachedServer(hostname, parseInt(port || 5001), 'https');

      if (!server) {
        console.error('❌ ZLOGIN START: Server not found', { serverAddress, hostname, port });
        return res.status(404).json({ success: false, message: 'Server not found' });
      }

      console.log('✅ ZLOGIN START: Server found', {
        hostname: server.hostname,
        port: server.port,
        protocol: server.protocol,
        hasApiKey: !!server.api_key
      });

      // First, get all zlogin sessions and stop any that are for the same zone
      console.log('🔍 ZLOGIN START: Checking for existing sessions');
      const sessionsResult = await ServerModel.makeRequest(
        server.hostname,
        server.port,
        server.protocol,
        'zlogin/sessions',
        { method: 'GET' }
      );

      console.log('📊 ZLOGIN START: Existing sessions response', {
        success: sessionsResult.success,
        status: sessionsResult.status,
        sessionCount: sessionsResult.success ? sessionsResult.data?.length : 'unknown',
        data: sessionsResult.data
      });

      if (sessionsResult.success) {
        const sessions = sessionsResult.data;
        const existingSession = sessions.find(session => session.zone_name === zoneName);
        if (existingSession) {
          console.log('🧹 ZLOGIN START: Found existing session, stopping it', {
            sessionId: existingSession.id,
            zoneName: existingSession.zone_name,
            status: existingSession.status
          });

          const stopResult = await ServerModel.makeRequest(
            server.hostname,
            server.port,
            server.protocol,
            `zlogin/sessions/${existingSession.id}/stop`,
            { method: 'DELETE' }
          );

          console.log('🛑 ZLOGIN START: Stop existing session result', {
            success: stopResult.success,
            status: stopResult.status,
            message: stopResult.message || stopResult.error
          });
        } else {
          console.log('✅ ZLOGIN START: No existing session found for zone');
        }
      }

      console.log('🎬 ZLOGIN START: Creating new session', {
        endpoint: `zones/${zoneName}/zlogin/start`,
        method: 'POST'
      });

      const result = await ServerModel.makeRequest(
        server.hostname,
        server.port,
        server.protocol,
        `zones/${zoneName}/zlogin/start`,
        { method: 'POST' }
      );

      console.log('📋 ZLOGIN START: Session creation result', {
        success: result.success,
        status: result.status,
        hasData: !!result.data,
        sessionId: result.data?.id,
        error: result.error,
        data: result.data
      });

      if (result.success) {
        console.log('🎉 ZLOGIN START: Session created successfully', {
          sessionId: result.data.id,
          zoneName: result.data.zone_name || zoneName,
          status: result.data.status
        });

        res.json({ success: true, session: result.data });
      } else {
        console.error('❌ ZLOGIN START: Session creation failed', {
          status: result.status,
          error: result.error,
          message: result.message
        });

        res.status(result.status || 500).json({
          success: false,
          message: result.error || 'Failed to start zlogin session'
        });
      }
    } catch (error) {
      console.error('💥 ZLOGIN START: Exception occurred', {
        error: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
      });

      res.status(500).json({
        success: false,
        message: 'Failed to start zlogin session'
      });
    }
  }

  /**
   * Get all zlogin sessions
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async getZloginSessions(req, res) {
    try {
      const { serverAddress } = req.params;
      const [hostname, port] = serverAddress.split(':');
      const server = await ServerController.getCachedServer(hostname, parseInt(port || 5001), 'https');

      if (!server) {
        return res.status(404).json({ success: false, message: 'Server not found' });
      }

      const result = await ServerModel.makeRequest(
        server.hostname,
        server.port,
        server.protocol,
        'zlogin/sessions',
        { method: 'GET' }
      );

      if (result.success) {
        res.json({ success: true, sessions: result.data });
      } else {
        res.status(result.status || 500).json({
          success: false,
          message: result.error || 'Failed to get zlogin sessions'
        });
      }
    } catch (error) {
      console.error('Get zlogin sessions error:', error.message);
      res.status(500).json({
        success: false,
        message: 'Failed to get zlogin sessions'
      });
    }
  }

  /**
   * Get a specific zlogin session
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async getZloginSession(req, res) {
    try {
      const { serverAddress, sessionId } = req.params;
      const [hostname, port] = serverAddress.split(':');
      const server = await ServerController.getCachedServer(hostname, parseInt(port || 5001), 'https');

      if (!server) {
        return res.status(404).json({ success: false, message: 'Server not found' });
      }

      const result = await ServerModel.makeRequest(
        server.hostname,
        server.port,
        server.protocol,
        `zlogin/sessions/${sessionId}`,
        { method: 'GET' }
      );

      if (result.success) {
        res.json({ success: true, session: result.data });
      } else {
        res.status(result.status || 500).json({
          success: false,
          message: result.error || 'Failed to get zlogin session'
        });
      }
    } catch (error) {
      console.error('Get zlogin session error:', error.message);
      res.status(500).json({
        success: false,
        message: 'Failed to get zlogin session'
      });
    }
  }

  /**
   * Stop a zlogin session
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async stopZloginSession(req, res) {
    try {
      const { serverAddress, sessionId } = req.params;
      const [hostname, port] = serverAddress.split(':');
      const server = await ServerController.getCachedServer(hostname, parseInt(port || 5001), 'https');

      if (!server) {
        return res.status(404).json({ success: false, message: 'Server not found' });
      }

      const result = await ServerModel.makeRequest(
        server.hostname,
        server.port,
        server.protocol,
        `zlogin/sessions/${sessionId}/stop`,
        { method: 'DELETE' }
      );

      if (result.success) {
        res.json({ success: true, message: 'Zlogin session stopped' });
      } else {
        res.status(result.status || 500).json({
          success: false,
          message: result.error || 'Failed to stop zlogin session'
        });
      }
    } catch (error) {
      console.error('Stop zlogin session error:', error.message);
      res.status(500).json({
        success: false,
        message: 'Failed to stop zlogin session'
      });
    }
  }
};

export default ServerController;
