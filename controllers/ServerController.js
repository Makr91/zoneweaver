/**
 * @fileoverview Server controller for managing registered host agents. This application is
 * 50% GUI and 50% proxy server to the host agents (zoneweaver-agent for Bhyve/OmniOS,
 * hyperweaver-agent for VirtualBox). Never hardcode limits or timeouts — anything tunable
 * belongs in production-config.yaml via the config loader.
 */

import { addServer, getAllServers, testServer } from './servers/registry.js';
import { removeServer, updateServer } from './servers/manage.js';
import {
  getAgentById,
  proxyStreamingRequest,
  logFileOperationResult,
  detectFileOperation,
  buildCleanHeaders,
  proxyStandardRequest,
  proxyToAgent,
} from './servers/proxy.js';

const ServerController = {
  addServer,
  getAllServers,
  testServer,
  removeServer,
  updateServer,
  getAgentById,
  proxyStreamingRequest,
  logFileOperationResult,
  detectFileOperation,
  buildCleanHeaders,
  proxyStandardRequest,
  proxyToAgent,
};

export default ServerController;
