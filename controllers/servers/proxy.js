import axios from 'axios';
import https from 'https';
import db from '../../models/index.js';
import { log } from '../../utils/Logger.js';
import { serverCache, CACHE_TTL } from './cache.js';

const { server: ServerModel } = db;

/**
 * Resolve an agent by registry id (dual-mode plan §4.1). Id-keyed cache avoids the
 * F5 host:port protocol ambiguity — findByPk targets the exact row (with api_key).
 * @param {number|string} id - servers.id
 * @returns {Promise<Object|null>} Server row (with api_key) or null
 */
export const getAgentById = async id => {
  const cacheKey = `id:${id}`;
  const cached = serverCache.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.server;
  }

  const server = await ServerModel.withScope('withApiKey').findByPk(parseInt(id));
  serverCache.set(cacheKey, { server, timestamp: Date.now() });
  return server;
};

/**
 * Stream a proxied request to the agent. The https.Agent honors allow_insecure with
 * no keep-alive and no TLS session cache so a toggled-off flag fails closed.
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Object} proxyConfig - Proxy configuration (server, path, cleanHeaders, startTime)
 * @param {Object} streamConfig - Stream options (data, timeout, maxBodyLength, maxRedirects, label)
 * @returns {Promise<Object|undefined>} Express response on failure, undefined on success
 */
export const proxyStreamingRequest = async (req, res, proxyConfig, streamConfig) => {
  const { cleanHeaders, hostname, port, protocol, path, startTime } = proxyConfig;
  const serverUrl = `${protocol}://${hostname}:${port}`;
  const targetUrl = `${serverUrl}/${path}`;

  const { server } = proxyConfig;
  if (!server || !server.api_key) {
    return res.status(500).json({
      success: false,
      message: 'Server configuration not found',
    });
  }

  try {
    const streamHeaders = {
      ...cleanHeaders,
      Authorization: `Bearer ${server.api_key}`,
      'User-Agent': 'Hyperweaver-Server/1.0',
    };

    const response = await axios({
      method: req.method,
      url: targetUrl,
      data: streamConfig.data,
      headers: streamHeaders,
      params: req.query,
      responseType: 'stream',
      timeout: streamConfig.timeout,
      maxBodyLength: streamConfig.maxBodyLength || Infinity,
      maxContentLength: Infinity,
      httpsAgent: new https.Agent({
        rejectUnauthorized: !server.allow_insecure,
        keepAlive: false,
        maxCachedSessions: 0,
      }),
      ...(streamConfig.maxRedirects !== undefined && { maxRedirects: streamConfig.maxRedirects }),
    });

    Object.keys(response.headers).forEach(key => {
      if (!['connection', 'transfer-encoding'].includes(key.toLowerCase())) {
        res.set(key, response.headers[key]);
      }
    });

    res.status(response.status);
    response.data.pipe(res);

    const duration = Date.now() - startTime;
    log.proxy.info(`STREAM: ${streamConfig.label} completed successfully`, {
      duration: `${duration}ms`,
      status: response.status,
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    log.proxy.error(`STREAM: ${streamConfig.label} failed`, {
      error: error.message,
      duration: `${duration}ms`,
      isTimeout: error.code === 'ECONNABORTED',
    });

    const status = error.response?.status || 500;
    return res.status(status).json({
      success: false,
      message: error.response?.data?.message || error.message || `${streamConfig.label} failed`,
    });
  }

  return undefined;
};

/**
 * Log the outcome of a proxied file operation.
 * @param {Object} result - makeRequest result
 * @param {Object} req - Express request object
 * @param {string} fileOperation - Operation label (UPLOAD/DOWNLOAD/OTHER)
 * @param {boolean} isFileUpload - Whether the request was an upload
 * @param {boolean} isFileDownload - Whether the request was a download
 * @param {number} duration - Elapsed time in ms
 * @param {Object} requestData - Forwarded request body
 */
export const logFileOperationResult = (
  result,
  req,
  fileOperation,
  isFileUpload,
  isFileDownload,
  duration,
  requestData
) => {
  log.proxy.info('FILE OP: Proxy request completed', {
    operation: fileOperation,
    success: result.success,
    status: result.status,
    duration: `${duration}ms`,
    responseSize: result.data ? JSON.stringify(result.data).length : 0,
    error: result.error || null,
  });

  if (isFileUpload && result.success) {
    log.proxy.info('UPLOAD: File uploaded successfully through proxy', {
      fileName: result.data?.file?.name || 'unknown',
      filePath: result.data?.file?.path || 'unknown',
      fileSize: result.data?.file?.size || 'unknown',
      duration: `${duration}ms`,
    });
  }

  if (isFileDownload && result.success) {
    log.proxy.info('DOWNLOAD: File download prepared through proxy', {
      filePath: req.query.path,
      duration: `${duration}ms`,
      hasData: !!result.data,
    });
  }

  if (!result.success) {
    log.proxy.error('FILE OP: File operation failed through proxy', {
      operation: fileOperation,
      error: result.error,
      status: result.status,
      duration: `${duration}ms`,
      requestData,
      query: req.query,
    });
  }
};

/**
 * Detect file operation type and log initial file operation details
 * @param {Object} req - Express request object
 * @param {string} path - API path
 * @returns {Object} - File operation info
 */
export const detectFileOperation = (req, path) => {
  const isFileUpload = path === 'filesystem/upload' && req.method === 'POST';
  const isFileDownload = path === 'filesystem/download' && req.method === 'GET';
  const isFileOperation = path.startsWith('filesystem');
  const fileOpType = isFileUpload ? 'UPLOAD' : 'OTHER';
  const fileOperation = isFileDownload ? 'DOWNLOAD' : fileOpType;

  if (isFileOperation) {
    log.proxy.info('FILE OP: Proxying file operation through zoneweaver proxy', {
      operation: fileOperation,
      method: req.method,
      path,
      query: req.query,
      contentType: req.headers['content-type'] || 'none',
      contentLength: req.headers['content-length'] || 'unknown',
      userAgent: req.headers['user-agent'] || 'unknown',
      hasAuth: !!req.headers.authorization,
    });

    if (isFileUpload) {
      log.proxy.info('UPLOAD: Processing file upload through proxy', {
        contentType: req.headers['content-type'],
        contentLength: req.headers['content-length'],
        boundary: req.headers['content-type']?.includes('boundary') ? 'present' : 'missing',
        query: req.query,
        bodyKeys: req.body ? Object.keys(req.body) : 'no body',
      });
    }

    if (isFileDownload) {
      log.proxy.info('DOWNLOAD: Processing file download through proxy', {
        filePath: req.query.path || 'unknown',
        query: req.query,
        accept: req.headers.accept || 'none',
      });
    }
  }

  return { isFileUpload, isFileDownload, isFileOperation, fileOperation };
};

/**
 * Build clean headers for proxying, excluding headers that shouldn't be forwarded
 * @param {Object} req - Express request object
 * @returns {Object} - Cleaned headers
 */
export const buildCleanHeaders = req => {
  const cleanHeaders = {};
  for (const [key, value] of Object.entries(req.headers)) {
    if (!['host', 'authorization', 'cookie'].includes(key.toLowerCase())) {
      cleanHeaders[key] = value;
    }
  }
  return cleanHeaders;
};

/**
 * Handle standard (non-streaming) proxy requests through the resolved agent row.
 * Agent bodies (success and error) pass through verbatim; the substitute error shape
 * is only for bodyless failures (network error / timeout).
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Object} proxyConfig - Proxy configuration (server, path, cleanHeaders, startTime)
 * @param {Object} fileOpInfo - File operation info from detectFileOperation
 * @returns {Object} - Express response
 */
export const proxyStandardRequest = async (req, res, proxyConfig, fileOpInfo) => {
  const { server, path, cleanHeaders, startTime } = proxyConfig;
  const { isFileUpload, isFileDownload, isFileOperation, fileOperation } = fileOpInfo;

  let requestData;
  const requestOptions = {
    method: req.method,
    params: req.query,
    headers: cleanHeaders,
  };

  if (req.method !== 'GET' && req.body && Object.keys(req.body).length > 0) {
    requestData = req.body;
    requestOptions.data = requestData;
  }

  const result = await server.makeRequest(path, requestOptions);

  const duration = Date.now() - startTime;

  if (isFileOperation) {
    logFileOperationResult(
      result,
      req,
      fileOperation,
      isFileUpload,
      isFileDownload,
      duration,
      requestData
    );
  }

  if (result.success) {
    return res.status(result.status || 200).json(result.data);
  }
  const status = result.status || 500;
  return res.status(status).json(
    result.data ?? {
      success: false,
      message: result.error || 'Proxy request failed',
    }
  );
};

/**
 * @swagger
 * /api/agents/{id}/{path}:
 *   get:
 *     summary: Proxy any request to a registered agent by id
 *     description: Forwards the request (any HTTP method) to the agent identified by its registry id. The sub-path is passed through verbatim to the agent's root-mounted API. Settings and server-restart sub-paths require super-admin; host power-action, ZFS ARC, fault-management, logs, syslog, hosts-file, and database-maintenance sub-paths require admin.
 *     tags: [Agent Proxy]
 *     security:
 *       - JwtAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Registry id of the agent (servers.id)
 *         example: 1
 *       - in: path
 *         name: path
 *         required: true
 *         schema:
 *           type: string
 *         description: Agent API path to forward to
 *         example: "machines"
 *     responses:
 *       200:
 *         description: Response from the agent (varies by endpoint)
 *       401:
 *         description: Not authenticated
 *       404:
 *         description: Agent not found
 *       409:
 *         description: Registered backend is not an agent
 *       500:
 *         description: Proxy error or agent error
 */
/**
 * Unified id-addressed agent proxy (dual-mode plan §4.1): ALL /api/agents/:id/:path.
 * Resolves the agent by registry id (fixes F5), preserves the streaming special-cases
 * (F14) and clean-header logic of the legacy zapi proxy, and excludes non-agent rows.
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const proxyToAgent = async (req, res) => {
  try {
    const { id } = req.params;
    const path = Array.isArray(req.params.splat)
      ? req.params.splat.join('/')
      : req.params.splat || '';

    const server = await getAgentById(id);
    if (!server || !server.api_key) {
      return res.status(404).json({ success: false, message: 'Agent not found' });
    }

    if (server.capabilities?.role && server.capabilities.role !== 'agent') {
      return res.status(409).json({
        success: false,
        message: 'Registered backend is not an agent',
      });
    }

    const { hostname, port, protocol } = server;
    const fileOpInfo = detectFileOperation(req, path);
    const cleanHeaders = buildCleanHeaders(req);
    const startTime = Date.now();
    const proxyConfig = { cleanHeaders, hostname, port, protocol, path, startTime, server };

    if (path.includes('artifacts/') && path.endsWith('/download') && req.method === 'GET') {
      return await proxyStreamingRequest(req, res, proxyConfig, {
        timeout: 300000,
        label: 'Artifact download',
      });
    }

    if (path.endsWith('vnc/screenshot') && req.method === 'GET') {
      return await proxyStreamingRequest(req, res, proxyConfig, {
        timeout: 20000,
        label: 'VNC screenshot',
      });
    }

    if (req.headers['content-type']?.includes('multipart/form-data')) {
      return await proxyStreamingRequest(req, res, proxyConfig, {
        data: req,
        timeout: 1800000,
        maxBodyLength: Infinity,
        label: 'Upload',
      });
    }

    return await proxyStandardRequest(req, res, proxyConfig, fileOpInfo);
  } catch (error) {
    log.proxy.error('PROXY: Agent proxy error', {
      error: error.message,
      stack: error.stack,
      method: req.method,
      id: req.params.id,
      path: req.params.splat,
    });
    return res.status(500).json({ success: false, message: 'Proxy request failed' });
  }
};
