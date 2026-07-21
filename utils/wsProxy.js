/**
 * @fileoverview WebSocket proxying for the unified agent namespace (dual-mode plan §4.2):
 * zlogin, term, ssh, logs/stream, tasks/:id/stream, VNC websockify, and the browser-RDP
 * bridge — all keyed by registry id. The UI derives these paths itself; agents keep
 * returning raw sessions.
 */

import db from '../models/index.js';
import { log } from './Logger.js';

const ServerModel = db.server;
const serverModelReady = true;

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
 * Create a binary-safe WebSocket proxy (VNC websockify, RDP bridge) for a resolved
 * agent. Both streams are raw binary protocols: frames relay with their binary flag
 * intact and compression stays off end to end.
 */
const createBinaryWsProxy = async (
  server,
  backendUrl,
  subprotocols,
  request,
  socket,
  head,
  logContext
) => {
  const { WebSocket, WebSocketServer } = await import('ws');

  log.websocket.info('Connecting to backend binary WebSocket', { ...logContext, backendUrl });

  const wss = new WebSocketServer({
    noServer: true,
    perMessageDeflate: false,
    compression: 'DISABLED',
    handleProtocols: protocols =>
      Array.from(protocols).includes('binary') ? 'binary' : Array.from(protocols)[0] || null,
  });

  const backendWs = new WebSocket(backendUrl, subprotocols, {
    headers: {
      Authorization: `Bearer ${server.api_key}`,
      'User-Agent': 'Hyperweaver-Server/1.0',
    },
    perMessageDeflate: false,
    extensions: {},
    compression: 'DISABLED',
    rejectUnauthorized: !server.allow_insecure,
  });

  backendWs.on('error', err => {
    log.websocket.error('Backend binary WebSocket connection failed', {
      ...logContext,
      error: err.message,
    });
    socket.destroy();
  });

  wss.handleUpgrade(request, socket, head, clientWs => {
    log.websocket.info('Client binary WebSocket established', logContext);

    backendWs.on('open', () => {
      log.websocket.info('Backend binary WebSocket connected', logContext);

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
        log.websocket.info('Client binary WebSocket disconnected', logContext);
        backendWs.close();
      });

      clientWs.on('error', err => {
        log.websocket.error('Client binary WebSocket error', {
          ...logContext,
          error: err.message,
        });
        backendWs.close();
      });

      backendWs.on('close', () => {
        log.websocket.info('Backend binary WebSocket closed', logContext);
        if (clientWs.readyState === WebSocket.OPEN) {
          clientWs.close();
        }
      });

      backendWs.on('error', err => {
        log.websocket.error('Backend binary WebSocket error', {
          ...logContext,
          error: err.message,
        });
        if (clientWs.readyState === WebSocket.OPEN) {
          clientWs.close();
        }
      });
    });

    backendWs.on('error', err => {
      log.websocket.error('Failed to connect to backend binary WebSocket', {
        ...logContext,
        error: err.message,
      });
      clientWs.close();
    });
  });
};

/**
 * Proxy a VNC websockify WS upgrade for /api/agents/:id/machines/:machineName/vnc/websockify.
 * The agent's websockify side speaks the 'binary' subprotocol.
 */
const handleAgentVncUpgrade = async (id, machineName, search, request, socket, head) => {
  const server = await resolveAgentForWs(id);
  if (!server || !server.api_key) {
    log.websocket.error('WebSocket VNC: agent not found or missing API key', { id, machineName });
    socket.destroy();
    return;
  }
  const backendUrl = `${server.protocol.replace('http', 'ws')}://${server.hostname}:${server.port}/machines/${encodeURIComponent(machineName)}/vnc/websockify${search}`;
  await createBinaryWsProxy(server, backendUrl, ['binary'], request, socket, head, {
    type: 'vnc',
    machineName,
  });
};

/**
 * Proxy a browser-RDP (RDCleanPath) WS upgrade for
 * /api/agents/:id/machines/:machineName/rdp-bridge. The agent's ?ticket= auth and
 * ?target=console|guest ride the forwarded query string verbatim; the agent
 * negotiates no subprotocol, so none is requested backend-side.
 */
const handleAgentRdpUpgrade = async (id, machineName, search, request, socket, head) => {
  const server = await resolveAgentForWs(id);
  if (!server || !server.api_key) {
    log.websocket.error('WebSocket RDP: agent not found or missing API key', { id, machineName });
    socket.destroy();
    return;
  }
  const backendUrl = `${server.protocol.replace('http', 'ws')}://${server.hostname}:${server.port}/machines/${encodeURIComponent(machineName)}/rdp-bridge${search}`;
  await createBinaryWsProxy(server, backendUrl, [], request, socket, head, {
    type: 'rdp-bridge',
    machineName,
  });
};

/**
 * Handle WebSocket upgrades for the unified agent namespace. The query string is
 * forwarded verbatim to the agent backend (WS ticket auth rides ?ticket=…); pathname
 * segments are decoded exactly once — each handler re-encodes once and the agent
 * decodes once, so passing the raw segment through would double-encode it.
 */
export const handleWebSocketUpgrade = async (request, socket, head) => {
  try {
    const url = new URL(request.url, `https://${request.headers.host}`);
    const { pathname, search } = url;

    const vncMatch = pathname.match(
      /^\/api\/agents\/(?<id>[^/]+)\/machines\/(?<machine>[^/]+)\/vnc\/websockify/
    );
    if (vncMatch) {
      await handleAgentVncUpgrade(
        vncMatch.groups.id,
        decodeURIComponent(vncMatch.groups.machine),
        search,
        request,
        socket,
        head
      );
      return;
    }

    const rdpMatch = pathname.match(
      /^\/api\/agents\/(?<id>[^/]+)\/machines\/(?<machine>[^/]+)\/rdp-bridge/
    );
    if (rdpMatch) {
      await handleAgentRdpUpgrade(
        rdpMatch.groups.id,
        decodeURIComponent(rdpMatch.groups.machine),
        search,
        request,
        socket,
        head
      );
      return;
    }

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
