/**
 * @fileoverview Agent health & capability poller (dual-mode plan §6.2, architecture D11).
 * The Hyperweaver Server owns capability freshness: on a jittered interval it polls
 * every registered agent's public /status and persists capabilities + last_seen.
 */

import db from '../models/index.js';
import { loadConfig } from './config.js';
import { log } from './Logger.js';

const { server: ServerModel } = db;

const getPollConfig = () => {
  const config = loadConfig();
  const agents = config.agents || {};
  return {
    interval: agents.poll_interval?.value || 60000,
    timeout: agents.poll_timeout?.value || 5000,
  };
};

/**
 * Poll every registered agent once, in parallel, persisting capabilities + last_seen.
 * Logs any row whose /status reports a non-agent role (§6.2 role validation — the
 * proxy excludes such rows; here we surface the mismatch).
 * @param {number} timeout - Per-agent poll timeout (ms)
 */
const pollOnce = async timeout => {
  const servers = await ServerModel.getAllServers();
  if (servers.length === 0) {
    return;
  }

  const results = await Promise.allSettled(servers.map(server => server.refreshStatus(timeout)));

  results.forEach((result, idx) => {
    if (result.status !== 'fulfilled' || !result.value?.success) {
      return;
    }
    const role = result.value.data?.role;
    if (role !== 'agent') {
      log.server.warn('Registered agent reports non-agent role — excluded from proxying', {
        server: `${servers[idx].hostname}:${servers[idx].port}`,
        role,
      });
    }
  });
};

/**
 * Start the background poll loop with a jittered first run (avoids a restart stampede).
 */
export const startAgentHealthPoller = () => {
  const { interval, timeout } = getPollConfig();

  const run = () => {
    pollOnce(timeout).catch(error =>
      log.server.error('Agent health poll failed', { error: error.message })
    );
  };

  const jitter = Math.floor(Math.random() * interval);
  log.server.info('Agent health poller starting', { intervalMs: interval, jitterMs: jitter });

  setTimeout(() => {
    run();
    setInterval(run, interval);
  }, jitter);
};
