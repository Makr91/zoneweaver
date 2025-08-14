import database from './Database.js';
import axios from 'axios';
import https from 'https';

/**
 * Server model for managing Zoneweaver API connections
 * This replaces the per-user API key system with application-level server management
 */
class ServerModel {
  /**
   * Initialize the servers table
   */
  static async init() {
    try {
      const db = database.getDb();
      
      // Create servers table if it doesn't exist
      await db.exec(`
        CREATE TABLE IF NOT EXISTS servers (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          hostname TEXT NOT NULL,
          port INTEGER NOT NULL,
          protocol TEXT NOT NULL DEFAULT 'https',
          entity_name TEXT NOT NULL,
          description TEXT,
          api_key TEXT NOT NULL,
          is_active INTEGER DEFAULT 1,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          last_used DATETIME,
          UNIQUE(hostname, port, protocol)
        )
      `);

      console.log('Servers table initialized');
    } catch (error) {
      console.error('Error initializing servers table:', error);
      throw error;
    }
  }

  /**
   * Add a new Zoneweaver API Server connection
   * @param {Object} serverData - Server data
   * @param {string} serverData.hostname - Server hostname
   * @param {number} serverData.port - Server port
   * @param {string} serverData.protocol - Server protocol (http/https)
   * @param {string} serverData.entityName - Entity name for the API key
   * @param {string} [serverData.description] - Description
   * @param {string} [serverData.apiKey] - Existing API key (if not provided, will bootstrap)
   * @returns {Promise<Object>} Server record with API key
   */
  static async addServer({ hostname, port, protocol, entityName, description, apiKey }) {
    try {
      const db = database.getDb();
      
      // Check if server already exists (only check active servers)
      const existingServer = await db.get(
        'SELECT id FROM servers WHERE hostname = ? AND port = ? AND protocol = ? AND is_active = 1',
        [hostname, port, protocol]
      );
      
      if (existingServer) {
        throw new Error(`Server ${hostname}:${port} (${protocol}) already exists`);
      }

      let finalApiKey;
      
      if (apiKey) {
        // Use provided API key - validate it by testing the server
        const testResult = await this.testServerWithApiKey(hostname, port, protocol, apiKey);
        if (!testResult.success) {
          throw new Error(`Provided API key is invalid: ${testResult.error}`);
        }
        finalApiKey = apiKey;
      } else {
        // Bootstrap API key from Zoneweaver API Server
        const apiKeyResult = await this.bootstrapApiKey({ hostname, port, protocol, entityName });
        finalApiKey = apiKeyResult.apiKey;
      }

      // Store server in database
      const result = await db.run(
        `INSERT INTO servers (hostname, port, protocol, entity_name, description, api_key) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [hostname, port, protocol, entityName, description, finalApiKey]
      );

      return await db.get('SELECT * FROM servers WHERE id = ?', [result.lastID]);
    } catch (error) {
      console.error('Error adding server:', error);
      throw error;
    }
  }

  /**
   * Get all active servers
   * @returns {Promise<Array>} Array of server records
   */
  static async getAllServers() {
    try {
      const db = database.getDb();
      
      const servers = await db.all(
        'SELECT * FROM servers ORDER BY last_used DESC, created_at DESC'
      );

      // Don't expose API keys in the response
      return servers.map(server => ({
        id: server.id,
        hostname: server.hostname,
        port: server.port,
        protocol: server.protocol,
        entityName: server.entity_name,
        description: server.description,
        createdAt: server.created_at,
        updatedAt: server.updated_at,
        lastUsed: server.last_used,
        isActive: server.is_active
      }));
    } catch (error) {
      console.error('Error getting servers:', error);
      throw error;
    }
  }

  /**
   * Get server by hostname and port
   * @param {string} hostname - Server hostname
   * @param {number} port - Server port
   * @param {string} protocol - Server protocol
   * @returns {Promise<Object|null>} Server record or null
   */
  static async getServer(hostname, port, protocol) {
    try {
      const db = database.getDb();
      
      const server = await db.get(
        'SELECT * FROM servers WHERE hostname = ? AND port = ? AND protocol = ?',
        [hostname, port, protocol]
      );

      return server || null;
    } catch (error) {
      console.error('Error getting server:', error);
      throw error;
    }
  }

  /**
   * Get API key for a server
   * @param {string} hostname - Server hostname
   * @param {number} port - Server port
   * @param {string} protocol - Server protocol
   * @returns {Promise<string|null>} API key or null
   */
  static async getApiKey(hostname, port, protocol) {
    try {
      const db = database.getDb();
      
      const server = await db.get(
        'SELECT api_key FROM servers WHERE hostname = ? AND port = ? AND protocol = ?',
        [hostname, port, protocol]
      );

      return server?.api_key || null;
    } catch (error) {
      console.error('Error getting API key:', error);
      throw error;
    }
  }

  /**
   * Update last used timestamp for a server
   * @param {string} hostname - Server hostname
   * @param {number} port - Server port
   * @param {string} protocol - Server protocol
   * @returns {Promise<boolean>} Success status
   */
  static async updateLastUsed(hostname, port, protocol) {
    try {
      const db = database.getDb();
      
      const result = await db.run(
        'UPDATE servers SET last_used = CURRENT_TIMESTAMP WHERE hostname = ? AND port = ? AND protocol = ?',
        [hostname, port, protocol]
      );

      return result.changes > 0;
    } catch (error) {
      console.error('Error updating last used:', error);
      throw error;
    }
  }

  /**
   * Remove a server
   * @param {number} serverId - Server ID
   * @returns {Promise<boolean>} Success status
   */
  static async removeServer(serverId) {
    try {
      const db = database.getDb();
      
      const result = await db.run(
        'DELETE FROM servers WHERE id = ?',
        [serverId]
      );

      return result.changes > 0;
    } catch (error) {
      console.error('Error removing server:', error);
      throw error;
    }
  }

  /**
   * Test server connectivity
   * @param {string} hostname - Server hostname
   * @param {number} port - Server port
   * @param {string} protocol - Server protocol
   * @returns {Promise<Object>} Test result
   */
  static async testServer(hostname, port, protocol) {
    try {
      const apiKey = await this.getApiKey(hostname, port, protocol);
      if (!apiKey) {
        return { success: false, error: 'No API key found for server' };
      }

      const serverUrl = `${protocol}://${hostname}:${port}`;
      
      // Test API key by calling stats endpoint (general API route)
      const response = await axios.get(`${serverUrl}/stats`, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 5000
      });

      // Update last used on successful test
      await this.updateLastUsed(hostname, port, protocol);

      return {
        success: true,
        status: response.status,
        data: response.data
      };
    } catch (error) {
      console.error('Error testing server:', error);
      
      return {
        success: false,
        error: error.response?.data?.message || error.message,
        status: error.response?.status || null
      };
    }
  }

  /**
   * Test server connectivity with a specific API key
   * @param {string} hostname - Server hostname
   * @param {number} port - Server port
   * @param {string} protocol - Server protocol
   * @param {string} apiKey - API key to test
   * @returns {Promise<Object>} Test result
   */
  static async testServerWithApiKey(hostname, port, protocol, apiKey) {
    try {
      const serverUrl = `${protocol}://${hostname}:${port}`;
      
      // Test API key by calling stats endpoint (general API route)
      const response = await axios.get(`${serverUrl}/stats`, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 5000
      });

      return {
        success: true,
        status: response.status,
        data: response.data
      };
    } catch (error) {
      console.error('Error testing server with API key:', error);
      
      return {
        success: false,
        error: error.response?.data?.message || error.message,
        status: error.response?.status || null
      };
    }
  }

  /**
   * Bootstrap API key from Zoneweaver API Server
   * @param {Object} serverData - Server data
   * @param {string} serverData.hostname - Server hostname
   * @param {number} serverData.port - Server port
   * @param {string} serverData.protocol - Server protocol
   * @param {string} serverData.entityName - Entity name for the API key
   * @returns {Promise<Object>} Bootstrap response with API key
   */
  static async bootstrapApiKey({ hostname, port, protocol, entityName }) {
    try {
      const serverUrl = `${protocol}://${hostname}:${port}`;
      
      // Call bootstrap endpoint on Zoneweaver API Server
      const response = await axios.post(`${serverUrl}/api-keys/bootstrap`, {
        name: entityName
      }, {
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.data && response.data.api_key) {
        return {
          success: true,
          apiKey: response.data.api_key,
          message: response.data.message
        };
      } else {
        throw new Error('Invalid response from Zoneweaver API Server');
      }
    } catch (error) {
      console.error('Error bootstrapping API key:', error);
      
      if (error.response) {
        const errorMessage = error.response.data?.message || error.response.data?.msg || error.response.statusText;
        
        // Handle bootstrap endpoint disabled case specifically
        if (error.response.status === 403 && errorMessage.includes('Bootstrap endpoint auto-disabled')) {
          throw new Error('Bootstrap endpoint has been auto-disabled after first use for security. Please use the "I have an existing API key" option instead. You can get an API key from your Zoneweaver API Server\'s API key management interface.');
        }
        
        throw new Error(`Zoneweaver API Server error: ${errorMessage}`);
      } else if (error.code === 'ECONNREFUSED') {
        throw new Error('Cannot connect to Zoneweaver API Server. Please check if the server is running.');
      } else {
        throw new Error(`Bootstrap failed: ${error.message}`);
      }
    }
  }

  /**
   * Make a request to a Zoneweaver API Server
   * @param {string} hostname - Server hostname
   * @param {number} port - Server port
   * @param {string} protocol - Server protocol
   * @param {string} path - API path
   * @param {Object} options - Axios request options
   * @param {boolean} useVncAuth - Whether to use VNC authentication (X-API-Key) instead of general auth (Authorization: Bearer)
   * @returns {Promise<Object>} Request result
   */
  static async makeRequest(hostname, port, protocol, path, options = {}, useVncAuth = false) {
    const timestamp = new Date().toISOString();
    const serverUrl = `${protocol}://${hostname}:${port}`;
    
    try {
      const server = await this.getServer(hostname, port, protocol);
      if (!server) {
        throw new Error(`Server ${hostname}:${port} not found`);
      }
      const apiKey = server.api_key;
      
      if (!apiKey) {
        throw new Error(`No API key found for server ${hostname}:${port} (${protocol})`);
      }

      // Smart FMRI detection and encoding
      // Handle common patterns like: services/{FMRI}/properties, services/{FMRI}, zones/{zoneName}/...
      let encodedPath;
      
      // Check if this looks like a services request with an FMRI
      if (path.startsWith('services/') && (path.includes(':/') || path.includes('lrc:') || path.includes('svc:'))) {
        const parts = path.split('/');
        
        if (parts.length >= 2) {
          // Find where the FMRI starts (after 'services/')
          let fmriStart = 1;
          let fmriEnd = parts.length;
          
          // Look for 'properties' or other endpoints at the end
          if (parts[parts.length - 1] === 'properties' || parts[parts.length - 1] === 'details') {
            fmriEnd = parts.length - 1;
          }
          
          // Reconstruct FMRI from the middle parts
          const fmriParts = parts.slice(fmriStart, fmriEnd);
          const fullFmri = fmriParts.join('/');
          
          // Encode the FMRI as a single unit
          const encodedFmri = encodeURIComponent(fullFmri);
          
          // Rebuild the path
          const beforeFmri = parts.slice(0, fmriStart);
          const afterFmri = parts.slice(fmriEnd);
          
          encodedPath = [...beforeFmri, encodedFmri, ...afterFmri].join('/');
        } else {
          // Fallback to segment-by-segment encoding
          encodedPath = path.split('/').map(segment => segment ? encodeURIComponent(segment) : segment).join('/');
        }
      } else {
        // For non-services requests, use segment-by-segment encoding
        encodedPath = path.split('/').map(segment => {
          if (!segment) return segment;
          if (segment.includes('%')) return segment; // Already encoded
          return encodeURIComponent(segment);
        }).join('/');
      }
      
      // Create headers with appropriate authentication format
      const requestHeaders = {
        'Content-Type': 'application/json'
      };
      
      // All Zoneweaver API routes use Authorization: Bearer
      requestHeaders['Authorization'] = `Bearer ${apiKey}`;
      
      // Add any additional headers from options, but don't allow overwriting auth headers
      if (options.headers) {
        Object.keys(options.headers).forEach(key => {
          const lowerKey = key.toLowerCase();
          if (!['authorization', 'x-api-key', 'content-type'].includes(lowerKey)) {
            requestHeaders[key] = options.headers[key];
          }
        });
      }

      console.log(`${timestamp} - API Request - ${serverUrl}/${encodedPath}`);

      const agent = new https.Agent({
        rejectUnauthorized: !server.allow_insecure
      });

      const response = await axios({
        url: `${serverUrl}/${encodedPath}`,
        method: options.method || 'GET',
        headers: requestHeaders,
        data: options.data,
        params: options.params,
        timeout: options.timeout || 60000,
        httpsAgent: agent,
        validateStatus: (status) => {
          // Accept all 2xx and 3xx status codes as successful
          return status >= 200 && status < 400;
        }
      });

      // Update last used on successful request
      await this.updateLastUsed(hostname, port, protocol);

      return { success: true, data: response.data, status: response.status };
    } catch (error) {
      // Simplified error logging - only log essential information
      const errorMsg = error.response?.data?.message || error.message;
      const status = error.response?.status;
      
      if (status) {
        console.error(`Zoneweaver API request failed: ${status} - ${errorMsg}`);
      } else {
        console.error(`Zoneweaver API request failed: ${errorMsg}`);
      }
      
      return {
        success: false,
        error: errorMsg,
        status: status || null
      };
    }
  }
}

export default ServerModel;
