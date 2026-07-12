import axios from 'axios';
import https from 'https';
import { DataTypes } from '@sequelize/core';
import { log } from '../utils/Logger.js';
import { loadConfig } from '../utils/config.js';

export default sequelize => {
  const Server = sequelize.define(
    'servers',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      hostname: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notEmpty: true,
        },
      },
      port: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
          min: 1,
          max: 65535,
        },
      },
      protocol: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'https',
        validate: {
          isIn: [['http', 'https']],
        },
      },
      entity_name: {
        type: DataTypes.STRING,
        allowNull: false,
        columnName: 'entity_name',
        validate: {
          notEmpty: true,
        },
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      api_key: {
        type: DataTypes.STRING,
        allowNull: false,
        columnName: 'api_key',
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        columnName: 'is_active',
      },
      last_used: {
        type: DataTypes.DATE,
        allowNull: true,
        columnName: 'last_used',
      },
      allow_insecure: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        columnName: 'allow_insecure',
      },
      capabilities: {
        // Slim /status payload harvested from the agent (role, hypervisors, features, console, auth, …)
        type: DataTypes.JSON,
        allowNull: true,
        columnName: 'capabilities',
      },
      last_seen: {
        // Last successful /status poll; stale => agent unreachable (not auto-deactivated)
        type: DataTypes.DATE,
        allowNull: true,
        columnName: 'last_seen',
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
        // Include API key (for internal operations). Still scoped to active rows —
        // a deactivated server must not resolve for proxying/WS (the empty-attrs
        // form would otherwise drop the defaultScope's is_active filter).
        withApiKey: {
          where: {
            is_active: true,
          },
          attributes: {},
        },
        // Order by last used. Declares the active-only filter and api_key exclusion
        // explicitly — a named scope must not depend on the default scope surviving
        // withScope (same reason withApiKey re-declares is_active above).
        byLastUsed: {
          where: {
            is_active: true,
          },
          attributes: {
            exclude: ['api_key'],
          },
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
        foreignKey: { name: 'created_by', onDelete: 'SET NULL' },
        as: 'creator',
      });
    }
  };

  // Virtual getters
  Server.prototype.getServerUrl = function () {
    return `${this.protocol}://${this.hostname}:${this.port}`;
  };

  // Instance methods
  Server.prototype.updateLastUsed = function () {
    return this.update({ last_used: new Date() });
  };

  // Poll the agent's public /status endpoint (dual-mode plan §3.1): slim identity +
  // capabilities, no API key required, no zoneadm exec (unlike the fat /stats).
  Server.prototype.fetchStatus = async function (timeoutMs = 5000) {
    const serverUrl = this.getServerUrl();
    try {
      const response = await axios.get(`${serverUrl}/status`, {
        timeout: timeoutMs,
        httpsAgent: new https.Agent({
          rejectUnauthorized: !this.allow_insecure,
          keepAlive: false,
          maxCachedSessions: 0,
        }),
      });
      return { success: true, status: response.status, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || error.message,
        status: error.response?.status || null,
      };
    }
  };

  // Harvest + persist capabilities and freshness from /status (D11 health loop). On
  // failure, leave capabilities as-is and do NOT refresh last_seen (it ages → stale).
  Server.prototype.refreshStatus = async function (timeoutMs = 5000) {
    const result = await this.fetchStatus(timeoutMs);
    if (result.success) {
      try {
        await this.update({ capabilities: result.data, last_seen: new Date() });
      } catch (error) {
        log.server.warn('Failed to persist agent status', { error: error.message });
      }
    }
    return result;
  };

  // Encode path segments with special handling for FMRI service paths
  const encodeFmriPath = pathStr => {
    if (
      pathStr.startsWith('services/') &&
      (pathStr.includes(':/') || pathStr.includes('lrc:') || pathStr.includes('svc:'))
    ) {
      const parts = pathStr.split('/');

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

        return [...beforeFmri, encodedFmri, ...afterFmri].join('/');
      }
      return pathStr
        .split('/')
        .map(segment => (segment ? encodeURIComponent(segment) : segment))
        .join('/');
    }
    return pathStr
      .split('/')
      .map(segment => {
        if (!segment) {
          return segment;
        }
        if (segment.includes('%')) {
          return segment;
        }
        return encodeURIComponent(segment);
      })
      .join('/');
  };

  // Resolve the per-request timeout: explicit option wins; file uploads get the
  // long configured window, everything else the configured default.
  const resolveRequestTimeout = (options, isFileUpload) => {
    if (options.timeout) {
      return options.timeout;
    }
    const config = loadConfig();
    if (isFileUpload) {
      return config.limits?.api_timeouts?.file_upload?.value || 1800000; // 30 min default
    }
    return config.limits?.api_timeouts?.default_request?.value || 60000; // 1 min default
  };

  // Data-size descriptor for request logging
  const describeDataSize = data => {
    if (data instanceof FormData) {
      return 'FormData (multipart)';
    }
    return data ? JSON.stringify(data).length : 0;
  };

  // Bearer auth + JSON default; caller headers forwarded except those that would
  // interfere with authentication (multipart uploads are handled via streaming)
  const buildRequestHeaders = (apiKey, extraHeaders) => {
    const requestHeaders = {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    };
    if (extraHeaders) {
      Object.keys(extraHeaders).forEach(key => {
        if (!['authorization', 'x-api-key'].includes(key.toLowerCase())) {
          requestHeaders[key] = extraHeaders[key];
        }
      });
    }
    return requestHeaders;
  };

  // Normalize an axios failure. Carries the agent's error body through (data) so
  // the proxy can forward it verbatim; the Go agent keys its error text as `error`.
  const toFailureResult = error => ({
    success: false,
    error: error.response?.data?.message || error.response?.data?.error || error.message,
    status: error.response?.status || null,
    data: error.response?.data,
  });

  Server.prototype.makeRequest = async function (path, options = {}) {
    const timestamp = new Date().toISOString();
    const serverUrl = this.getServerUrl();
    const startTime = Date.now();

    try {
      // Detect file upload operations that need extended timeouts
      const isFileUpload = path.includes('artifacts/upload') || path.includes('filesystem/upload');
      const requestTimeout = resolveRequestTimeout(options, isFileUpload);

      log.server.info('Starting agent request', {
        server: `${this.hostname}:${this.port}`,
        path,
        method: options.method || 'GET',
        hasData: !!options.data,
        hasParams: !!options.params,
        dataSize: describeDataSize(options.data),
        timeout: requestTimeout,
        isFileUpload,
        isFormData: options.data instanceof FormData,
      });

      const encodedPath = encodeFmriPath(path);
      const requestHeaders = buildRequestHeaders(this.api_key, options.headers);
      const finalUrl = `${serverUrl}/${encodedPath}`;

      log.server.debug('Request details', {
        originalPath: path,
        encodedPath,
        finalUrl,
        headers: Object.keys(requestHeaders),
        hasApiKey: !!this.api_key,
        allowInsecure: this.allow_insecure,
        queryParams: options.params,
        hasData: !!options.data,
      });

      log.server.debug('API Request', { url: finalUrl, timestamp });

      const agent = new https.Agent({
        rejectUnauthorized: !this.allow_insecure,
        // Fail CLOSED when allow_insecure is toggled back off: no keep-alive socket reuse and no
        // TLS session cache, so a connection once accepted under rejectUnauthorized:false can
        // never be resumed on an abbreviated handshake (which skips cert re-validation → the
        // "still loads over self-signed until restart" fail-open).
        keepAlive: false,
        maxCachedSessions: 0,
      });

      log.server.debug('Making axios request');
      const axiosStartTime = Date.now();

      // Build axios config for JSON/regular requests (multipart handled via streaming)
      const axiosConfig = {
        url: finalUrl,
        method: options.method || 'GET',
        headers: requestHeaders,
        data: options.data,
        params: options.params,
        timeout: requestTimeout,
        httpsAgent: agent,
        validateStatus: status => status >= 200 && status < 400,
      };

      const response = await axios(axiosConfig);

      const axiosEndTime = Date.now();
      const totalDuration = axiosEndTime - startTime;
      const axiosDuration = axiosEndTime - axiosStartTime;

      log.server.info('Request successful', {
        status: response.status,
        axiosDuration: `${axiosDuration}ms`,
        totalDuration: `${totalDuration}ms`,
        responseSize: JSON.stringify(response.data).length,
        responseHeaders: Object.keys(response.headers),
      });

      await this.updateLastUsed();
      return { success: true, data: response.data, status: response.status };
    } catch (error) {
      const totalDuration = Date.now() - startTime;

      log.server.error('Request failed', {
        error: error.message,
        code: error.code,
        status: error.response?.status,
        responseData: error.response?.data,
        duration: `${totalDuration}ms`,
        isTimeout: error.code === 'ECONNABORTED' || error.message.includes('timeout'),
        isNetworkError: error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND',
        url: `${serverUrl}/${path}`,
        method: options.method || 'GET',
        requestData: options.data,
      });

      return toFailureResult(error);
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
    const transaction = await sequelize.startUnmanagedTransaction();

    try {
      // Check if server already exists
      const existingServer = await this.withScope('withInactive').findOne({
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

      // Harvest capabilities immediately (best-effort; an unreachable agent must not fail the add)
      const created = await this.findByPk(server.id);
      if (created) {
        await created.refreshStatus();
      }
      return created;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  };

  Server.getAllServers = function () {
    return this.withScope('byLastUsed').findAll();
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

  // Probe a backend's public /status directly — no registry row required (the
  // add-form's Test Connection runs before the server exists). Same result shape
  // as fetchStatus.
  Server.probeStatus = async function (hostname, port, protocol, allowInsecure = false) {
    try {
      const response = await axios.get(`${protocol}://${hostname}:${port}/status`, {
        timeout: 5000,
        httpsAgent: new https.Agent({
          rejectUnauthorized: !allowInsecure,
          keepAlive: false,
          maxCachedSessions: 0,
        }),
      });
      return { success: true, status: response.status, data: response.data };
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
      }
      throw new Error('Invalid response from the agent');
    } catch (error) {
      if (error.response) {
        const errorMessage =
          error.response.data?.message || error.response.data?.msg || error.response.statusText;

        if (
          error.response.status === 403 &&
          errorMessage.includes('Bootstrap endpoint auto-disabled')
        ) {
          throw new Error(
            'Bootstrap endpoint has been auto-disabled after first use for security. Please use the "I have an existing API key" option instead.',
            { cause: error }
          );
        }

        throw new Error(`Agent error: ${errorMessage}`, { cause: error });
      } else if (error.code === 'ECONNREFUSED') {
        throw new Error('Cannot connect to the agent. Please check if it is running.', {
          cause: error,
        });
      } else {
        throw new Error(`Bootstrap failed: ${error.message}`, { cause: error });
      }
    }
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

  return Server;
};
