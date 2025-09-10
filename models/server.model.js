import axios from 'axios';
import https from 'https';

export default (sequelize, Sequelize) => {
  const Server = sequelize.define(
    'servers',
    {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      hostname: {
        type: Sequelize.STRING,
        allowNull: false,
        validate: {
          notEmpty: true,
        },
      },
      port: {
        type: Sequelize.INTEGER,
        allowNull: false,
        validate: {
          min: 1,
          max: 65535,
        },
      },
      protocol: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: 'https',
        validate: {
          isIn: [['http', 'https']],
        },
      },
      entity_name: {
        type: Sequelize.STRING,
        allowNull: false,
        field: 'entity_name',
        validate: {
          notEmpty: true,
        },
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      api_key: {
        type: Sequelize.STRING,
        allowNull: false,
        field: 'api_key',
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
        field: 'is_active',
      },
      last_used: {
        type: Sequelize.DATE,
        allowNull: true,
        field: 'last_used',
      },
      allow_insecure: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        field: 'allow_insecure',
      },
    },
    {
      // Table options
      tableName: 'servers',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',

      // Indexes
      indexes: [
        {
          // Unique constraint on hostname + port + protocol
          unique: true,
          fields: ['hostname', 'port', 'protocol'],
        },
        {
          fields: ['is_active'],
        },
        {
          fields: ['last_used'],
        },
        {
          fields: ['entity_name'],
        },
      ],

      // Default scope only includes active servers
      defaultScope: {
        where: {
          is_active: true,
        },
        attributes: {
          exclude: ['api_key'], // Don't expose API keys by default
        },
      },

      // Named scopes
      scopes: {
        // Include inactive servers
        withInactive: {
          where: {},
          attributes: {
            exclude: ['api_key'],
          },
        },
        // Include API key (for internal operations)
        withApiKey: {
          attributes: {},
        },
        // Order by last used
        byLastUsed: {
          order: [
            ['last_used', 'DESC'],
            ['created_at', 'DESC'],
          ],
        },
      },
    }
  );

  // Associations
  Server.associate = function (models) {
    // If we want to track who created servers
    if (models.user) {
      Server.belongsTo(models.user, {
        foreignKey: 'created_by',
        as: 'creator',
        onDelete: 'SET NULL',
      });
    }
  };

  // Virtual getters
  Server.prototype.getServerUrl = function () {
    return `${this.protocol}://${this.hostname}:${this.port}`;
  };

  Server.prototype.getDisplayName = function () {
    return `${this.hostname}:${this.port} (${this.protocol})`;
  };

  // Instance methods
  Server.prototype.updateLastUsed = function () {
    return this.update({ last_used: new Date() });
  };

  Server.prototype.deactivate = function () {
    return this.update({ is_active: false });
  };

  Server.prototype.activate = function () {
    return this.update({ is_active: true });
  };

  Server.prototype.testConnection = async function () {
    try {
      const serverUrl = this.getServerUrl();

      const response = await axios.get(`${serverUrl}/stats`, {
        headers: {
          Authorization: `Bearer ${this.api_key}`,
          'Content-Type': 'application/json',
        },
        timeout: 5000,
        httpsAgent: new https.Agent({
          rejectUnauthorized: !this.allow_insecure,
        }),
      });

      // Update last used on successful test
      await this.updateLastUsed();

      return {
        success: true,
        status: response.status,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || error.message,
        status: error.response?.status || null,
      };
    }
  };

  Server.prototype.makeRequest = async function (path, options = {}, _useVncAuth = false) {
    const timestamp = new Date().toISOString();
    const serverUrl = this.getServerUrl();
    const startTime = Date.now();

    try {
      console.log('🚀 SERVER MODEL: Starting zoneweaver-api request', {
        server: `${this.hostname}:${this.port}`,
        path,
        method: options.method || 'GET',
        hasData: !!options.data,
        hasParams: !!options.params,
        dataSize: options.data ? JSON.stringify(options.data).length : 0,
        timeout: options.timeout || 60000,
        timestamp,
      });

      // Smart FMRI detection and encoding
      let encodedPath;

      if (
        path.startsWith('services/') &&
        (path.includes(':/') || path.includes('lrc:') || path.includes('svc:'))
      ) {
        const parts = path.split('/');

        if (parts.length >= 2) {
          const fmriStart = 1;
          let fmriEnd = parts.length;

          if (parts[parts.length - 1] === 'properties' || parts[parts.length - 1] === 'details') {
            fmriEnd = parts.length - 1;
          }

          const fmriParts = parts.slice(fmriStart, fmriEnd);
          const fullFmri = fmriParts.join('/');
          const encodedFmri = encodeURIComponent(fullFmri);

          const beforeFmri = parts.slice(0, fmriStart);
          const afterFmri = parts.slice(fmriEnd);

          encodedPath = [...beforeFmri, encodedFmri, ...afterFmri].join('/');
        } else {
          encodedPath = path
            .split('/')
            .map(segment => (segment ? encodeURIComponent(segment) : segment))
            .join('/');
        }
      } else {
        encodedPath = path
          .split('/')
          .map(segment => {
            if (!segment) return segment;
            if (segment.includes('%')) return segment; // Already encoded
            return encodeURIComponent(segment);
          })
          .join('/');
      }

      const requestHeaders = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.api_key}`,
      };

      if (options.headers) {
        Object.keys(options.headers).forEach(key => {
          const lowerKey = key.toLowerCase();
          if (!['authorization', 'x-api-key', 'content-type'].includes(lowerKey)) {
            requestHeaders[key] = options.headers[key];
          }
        });
      }

      const finalUrl = `${serverUrl}/${encodedPath}`;

      console.log('📡 SERVER MODEL: Request details', {
        originalPath: path,
        encodedPath,
        finalUrl,
        headers: Object.keys(requestHeaders),
        hasApiKey: !!this.api_key,
        allowInsecure: this.allow_insecure,
        requestData: options.data,
        queryParams: options.params,
      });

      console.log(`${timestamp} - API Request - ${finalUrl}`);

      const agent = new https.Agent({
        rejectUnauthorized: !this.allow_insecure,
      });

      console.log('⏱️ SERVER MODEL: Making axios request...');
      const axiosStartTime = Date.now();

      const response = await axios({
        url: finalUrl,
        method: options.method || 'GET',
        headers: requestHeaders,
        data: options.data,
        params: options.params,
        timeout: options.timeout || 60000,
        httpsAgent: agent,
        validateStatus: status => status >= 200 && status < 400,
      });

      const axiosEndTime = Date.now();
      const totalDuration = axiosEndTime - startTime;
      const axiosDuration = axiosEndTime - axiosStartTime;

      console.log('✅ SERVER MODEL: Request successful', {
        status: response.status,
        axiosDuration: `${axiosDuration}ms`,
        totalDuration: `${totalDuration}ms`,
        responseSize: JSON.stringify(response.data).length,
        responseHeaders: Object.keys(response.headers),
        timestamp: new Date().toISOString(),
      });

      await this.updateLastUsed();
      return { success: true, data: response.data, status: response.status };
    } catch (error) {
      const totalDuration = Date.now() - startTime;
      const errorMsg = error.response?.data?.message || error.message;
      const status = error.response?.status;

      console.error('❌ SERVER MODEL: Request failed', {
        error: error.message,
        code: error.code,
        status,
        responseData: error.response?.data,
        duration: `${totalDuration}ms`,
        isTimeout: error.code === 'ECONNABORTED' || error.message.includes('timeout'),
        isNetworkError: error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND',
        url: `${serverUrl}/${path}`,
        method: options.method || 'GET',
        requestData: options.data,
        timestamp: new Date().toISOString(),
      });

      if (status) {
        console.error(`Zoneweaver API request failed: ${status} - ${errorMsg}`);
      } else {
        console.error(`Zoneweaver API request failed: ${errorMsg}`);
      }

      return {
        success: false,
        error: errorMsg,
        status: status || null,
      };
    }
  };

  // Class methods
  Server.addServer = async function ({
    hostname,
    port,
    protocol,
    entityName,
    description,
    apiKey,
    allowInsecure = false,
  }) {
    const transaction = await sequelize.transaction();

    try {
      // Check if server already exists
      const existingServer = await this.scope('withInactive').findOne({
        where: { hostname, port, protocol },
      });

      if (existingServer && existingServer.is_active) {
        throw new Error(`Server ${hostname}:${port} (${protocol}) already exists`);
      }

      let finalApiKey;

      if (apiKey) {
        // Validate provided API key
        const testResult = await this.testServerWithApiKey(
          hostname,
          port,
          protocol,
          apiKey,
          allowInsecure
        );
        if (!testResult.success) {
          throw new Error(`Provided API key is invalid: ${testResult.error}`);
        }
        finalApiKey = apiKey;
      } else {
        // Bootstrap API key
        const apiKeyResult = await this.bootstrapApiKey({
          hostname,
          port,
          protocol,
          entityName,
          allowInsecure,
        });
        finalApiKey = apiKeyResult.apiKey;
      }

      // Create or update server
      let server;
      if (existingServer) {
        // Reactivate and update existing server
        server = await existingServer.update(
          {
            entity_name: entityName,
            description,
            api_key: finalApiKey,
            is_active: true,
            allow_insecure: allowInsecure,
          },
          { transaction }
        );
      } else {
        // Create new server
        server = await this.create(
          {
            hostname,
            port,
            protocol,
            entity_name: entityName,
            description,
            api_key: finalApiKey,
            allow_insecure: allowInsecure,
          },
          { transaction }
        );
      }

      await transaction.commit();

      // Return server without API key
      return await this.findByPk(server.id);
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  };

  Server.findByHostPortProtocol = function (hostname, port, protocol) {
    return this.scope('withApiKey').findOne({
      where: { hostname, port, protocol },
    });
  };

  Server.getAllServers = function () {
    return this.scope('byLastUsed').findAll();
  };

  Server.testServerWithApiKey = async function (
    hostname,
    port,
    protocol,
    apiKey,
    allowInsecure = false
  ) {
    try {
      const serverUrl = `${protocol}://${hostname}:${port}`;

      const response = await axios.get(`${serverUrl}/stats`, {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        timeout: 5000,
        httpsAgent: new https.Agent({
          rejectUnauthorized: !allowInsecure,
        }),
      });

      return {
        success: true,
        status: response.status,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || error.message,
        status: error.response?.status || null,
      };
    }
  };

  Server.bootstrapApiKey = async function ({
    hostname,
    port,
    protocol,
    entityName,
    allowInsecure = false,
  }) {
    try {
      const serverUrl = `${protocol}://${hostname}:${port}`;

      const response = await axios.post(
        `${serverUrl}/api-keys/bootstrap`,
        {
          name: entityName,
        },
        {
          timeout: 10000,
          headers: {
            'Content-Type': 'application/json',
          },
          httpsAgent: new https.Agent({
            rejectUnauthorized: !allowInsecure,
          }),
        }
      );

      if (response.data && response.data.api_key) {
        return {
          success: true,
          apiKey: response.data.api_key,
          message: response.data.message,
        };
      } else {
        throw new Error('Invalid response from Zoneweaver API Server');
      }
    } catch (error) {
      if (error.response) {
        const errorMessage =
          error.response.data?.message || error.response.data?.msg || error.response.statusText;

        if (
          error.response.status === 403 &&
          errorMessage.includes('Bootstrap endpoint auto-disabled')
        ) {
          throw new Error(
            'Bootstrap endpoint has been auto-disabled after first use for security. Please use the "I have an existing API key" option instead.'
          );
        }

        throw new Error(`Zoneweaver API Server error: ${errorMessage}`);
      } else if (error.code === 'ECONNREFUSED') {
        throw new Error(
          'Cannot connect to Zoneweaver API Server. Please check if the server is running.'
        );
      } else {
        throw new Error(`Bootstrap failed: ${error.message}`);
      }
    }
  };

  Server.makeRequest = async function (hostname, port, protocol, path, options = {}) {
    const server = await this.findByHostPortProtocol(hostname, port, protocol);
    if (!server) {
      throw new Error(`Server ${hostname}:${port} not found`);
    }

    return server.makeRequest(path, options);
  };

  // ===== MISSING METHODS FROM ORIGINAL SQLite ServerModel =====
  // These methods were lost during the SQLite-to-Sequelize conversion

  /**
   * Get server by hostname, port, and protocol
   * @param {string} hostname - Server hostname
   * @param {number} port - Server port
   * @param {string} protocol - Server protocol
   * @returns {Promise<Object|null>} Server record or null
   */
  Server.getServer = function (hostname, port, protocol) {
    return this.findByHostPortProtocol(hostname, port, protocol);
  };

  /**
   * Get API key for a server
   * @param {string} hostname - Server hostname
   * @param {number} port - Server port
   * @param {string} protocol - Server protocol
   * @returns {Promise<string|null>} API key or null
   */
  Server.getApiKey = async function (hostname, port, protocol) {
    const server = await this.findByHostPortProtocol(hostname, port, protocol);
    return server?.api_key || null;
  };

  /**
   * Update last used timestamp for a server (static version)
   * @param {string} hostname - Server hostname
   * @param {number} port - Server port
   * @param {string} protocol - Server protocol
   * @returns {Promise<boolean>} Success status
   */
  Server.updateLastUsed = async function (hostname, port, protocol) {
    const [updated] = await this.update(
      { last_used: new Date() },
      { where: { hostname, port, protocol } }
    );
    return updated > 0;
  };

  /**
   * Remove a server by ID
   * @param {number} serverId - Server ID
   * @returns {Promise<boolean>} Success status
   */
  Server.removeServer = async function (serverId) {
    const deleted = await this.destroy({ where: { id: serverId } });
    return deleted > 0;
  };

  /**
   * Test server connectivity (static version)
   * @param {string} hostname - Server hostname
   * @param {number} port - Server port
   * @param {string} protocol - Server protocol
   * @returns {Promise<Object>} Test result
   */
  Server.testServer = async function (hostname, port, protocol) {
    const server = await this.findByHostPortProtocol(hostname, port, protocol);
    if (!server) {
      return { success: false, error: 'Server not found' };
    }
    return server.testConnection();
  };

  return Server;
};
