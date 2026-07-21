/**
 * @fileoverview Multi-tenancy org-access layer (D11/D15: the org layer lives ONLY in the
 * Server; agents stay org-blind). Membership comes live from the OIDC organizations
 * claim for federated logins, or from the local organizations table for local logins —
 * one enforcement mechanism, two membership sources.
 *
 * Access model (D15):
 * - An agent is owned by one or more orgs (server_orgs). Owning-org users see the whole
 *   agent, including machines with no org assignment.
 * - A machine may belong to org(s) (machine_orgs). Users whose orgs own only machines on
 *   an agent see the agent with ONLY those machines.
 * - An agent with NO org rows behaves as before multi-tenancy: open to every
 *   authenticated user of this Server.
 * - Roles: OWNER/ADMIN = manage everything in scope (host too when the org owns the
 *   agent); MEMBER = view, consoles, and power actions only. Local users map:
 *   super-admin = bypass, admin = ADMIN of their org, user = MEMBER of their org.
 * - Machine names are immutable on the Agent API (no machine-rename wire exists), so
 *   name-keyed org stickers cannot orphan.
 */

import db from '../models/index.js';
import { log } from './Logger.js';

const { user: UserModel, serverOrg: ServerOrgModel, machineOrg: MachineOrgModel } = db;

const ROLE_RANK = { OWNER: 3, ADMIN: 2, MEMBER: 1 };

const bestRole = (a, b) => ((ROLE_RANK[a] || 0) >= (ROLE_RANK[b] || 0) ? a : b);

export const isManagerRole = role => role === 'OWNER' || role === 'ADMIN';

/**
 * Resolve the requesting user's org membership as a Map of org_uuid → role, plus a
 * bypass flag for local super-admins.
 * @param {import('express').Request} req
 * @returns {Promise<{bypass: boolean, orgs: Map<string, string>, primaryOrg: string|null}>}
 */
export const getUserOrgAccess = async req => {
  const orgs = new Map();
  let primaryOrg = null;

  if (req.user?.role === 'super-admin') {
    return { bypass: true, orgs, primaryOrg };
  }

  const oidc = req.session?.oidc;
  if (oidc && oidc.userId === req.user?.userId && Array.isArray(oidc.organizations)) {
    for (const org of oidc.organizations) {
      if (!org?.uuid) {
        continue;
      }
      const roles = Array.isArray(org.roles) ? org.roles : [];
      const role = roles.reduce((acc, r) => bestRole(acc, r), 'MEMBER');
      orgs.set(org.uuid, role);
      if (org.primary) {
        primaryOrg = org.uuid;
      }
    }
    return { bypass: false, orgs, primaryOrg };
  }

  const user = await UserModel.findByPk(req.user?.userId, {
    include: [{ association: 'organization', attributes: ['id', 'org_uuid'] }],
  });
  if (user?.organization?.org_uuid) {
    const role = req.user?.role === 'admin' ? 'ADMIN' : 'MEMBER';
    orgs.set(user.organization.org_uuid, role);
    primaryOrg = user.organization.org_uuid;
  }
  return { bypass: false, orgs, primaryOrg };
};

/**
 * Resolve what the requesting user may do on a given agent.
 * @param {import('express').Request} req
 * @param {number} serverId - servers.id
 * @returns {Promise<Object>} Access descriptor:
 *   { level: 'full'|'vm'|'none', role, machines: Map<name, role>|null, stampOrgs: string[], userOrgs: Map }
 */
export const resolveAgentAccess = async (req, serverId) => {
  const userAccess = await getUserOrgAccess(req);

  if (userAccess.bypass) {
    return { level: 'full', role: 'OWNER', machines: null, stampOrgs: [], userOrgs: new Map() };
  }

  const agentOrgRows = await ServerOrgModel.findOrgsForServer(serverId);

  if (agentOrgRows.length === 0) {
    return {
      level: 'full',
      role: 'ADMIN',
      machines: null,
      stampOrgs: [...userAccess.orgs.keys()],
      userOrgs: userAccess.orgs,
      primaryOrg: userAccess.primaryOrg,
    };
  }

  let agentRole = null;
  for (const row of agentOrgRows) {
    const role = userAccess.orgs.get(row.org_uuid);
    if (role) {
      agentRole = agentRole ? bestRole(agentRole, role) : role;
    }
  }
  if (agentRole) {
    return {
      level: 'full',
      role: agentRole,
      machines: null,
      stampOrgs: [...userAccess.orgs.keys()],
      userOrgs: userAccess.orgs,
      primaryOrg: userAccess.primaryOrg,
    };
  }

  const machineRows = await MachineOrgModel.findForServer(serverId);
  const machines = new Map();
  for (const row of machineRows) {
    const role = userAccess.orgs.get(row.org_uuid);
    if (role) {
      machines.set(row.machine_name, bestRole(machines.get(row.machine_name), role));
    }
  }
  if (machines.size > 0 || [...userAccess.orgs.values()].some(isManagerRole)) {
    return {
      level: machines.size > 0 ? 'vm' : 'none',
      role: null,
      machines,
      stampOrgs: [...userAccess.orgs.keys()].filter(uuid =>
        isManagerRole(userAccess.orgs.get(uuid))
      ),
      userOrgs: userAccess.orgs,
      primaryOrg: userAccess.primaryOrg,
    };
  }

  return { level: 'none', role: null, machines: null, stampOrgs: [], userOrgs: userAccess.orgs };
};

/**
 * MEMBER's exact allowed non-GET actions, verified against the agent's real route
 * registry (zoneweaver-agent routes/MachineRoutes.js) — power verbs, console-session
 * start/stop, guest ping. No create/modify/delete/clone/snapshot/zoneadm/provisioning.
 * Per-machine sub-paths (after machines/{name}/):
 */
const MEMBER_MACHINE_ACTIONS = new Map([
  ['start', ['POST']],
  ['stop', ['POST']],
  ['restart', ['POST']],
  ['reset', ['POST']],
  ['suspend', ['POST']],
  ['resume', ['POST']],
  ['vnc/start', ['POST']],
  ['vnc/stop', ['DELETE']],
  ['zlogin/start', ['POST']],
  ['ssh/start', ['POST']],
]);

/**
 * MEMBER's allowed non-GET agent-wide session paths (stop your console session).
 */
const MEMBER_SESSION_PATTERNS = [
  { pattern: /^zlogin\/sessions\/[^/]+\/stop$/, methods: ['DELETE'] },
  { pattern: /^ssh\/sessions\/[^/]+\/stop$/, methods: ['DELETE'] },
];

/**
 * Machine sub-paths MEMBER may NOT even read: the provisioning document carries
 * secrets/vars — manager-only.
 */
const MEMBER_READ_DENIED = new Set(['hosts-yml']);

/**
 * Method gate for MEMBER role: view everything in scope (except the machine document),
 * consoles, and power actions — no create/modify/delete. Explicit route allowlist, no
 * pattern guessing.
 */
const memberMethodAllowed = (method, subPath) => {
  const machineAction = subPath.match(/^machines\/[^/]+\/(?<action>.+)$/);

  if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') {
    return !(machineAction && MEMBER_READ_DENIED.has(machineAction.groups.action));
  }

  if (machineAction) {
    const allowed = MEMBER_MACHINE_ACTIONS.get(machineAction.groups.action);
    return Boolean(allowed && allowed.includes(method));
  }

  return MEMBER_SESSION_PATTERNS.some(
    entry => entry.pattern.test(subPath) && entry.methods.includes(method)
  );
};

const machinePathName = subPath => {
  const match = subPath.match(/^machines\/(?<name>[^/]+)(?:\/|$)/);
  return match ? decodeURIComponent(match.groups.name) : null;
};

/**
 * For vm-scoped users, resolve which machine an agent-wide task or console-session
 * path refers to by asking the agent, so ownership can be enforced on paths that
 * carry only a task/session id. Returns the machine name or null.
 * @param {Object} server - servers row (withApiKey) exposing makeRequest
 * @param {string} lookupPath - Agent path that returns an object naming the machine
 */
const lookupMachineForPath = async (server, lookupPath) => {
  const result = await server.makeRequest(lookupPath, { method: 'GET' });
  if (!result.success || !result.data) {
    return null;
  }
  const row = result.data.task ?? result.data.session ?? result.data;
  return row?.machine_name ?? row?.zone_name ?? null;
};

/**
 * Agent-wide id-keyed paths a vm-scoped user may reach AFTER an ownership lookup:
 * task detail/output/cancel and console-session info/stop. Maps the request path to
 * the lookup path that reveals the machine, plus the role needed per method.
 * @param {string} subPath
 * @returns {{lookupPath: string, managerMethods: string[]}|null}
 */
const vmScopedLookupRule = subPath => {
  const task = subPath.match(/^tasks\/(?<taskId>[a-fA-F0-9-]+)(?:\/output)?$/);
  if (task) {
    return { lookupPath: `tasks/${task.groups.taskId}`, managerMethods: ['DELETE'] };
  }
  const session = subPath.match(
    /^(?<family>zlogin|ssh)\/sessions\/(?<sessionId>[^/]+?)(?:\/stop)?$/
  );
  if (session) {
    return {
      lookupPath: `${session.groups.family}/sessions/${session.groups.sessionId}`,
      managerMethods: [],
    };
  }
  return null;
};

const deny = (res, message) => res.status(403).json({ success: false, message });

const ROLE_DENIED = 'Your organization role does not permit this action';

/**
 * Authorize a machine-scoped path (machines/{name}/...) for a vm-level user.
 * Sends the response on denial; returns true when the request may proceed.
 */
const authorizeVmMachinePath = (req, res, access, subPath, machineName) => {
  const role = access.machines.get(machineName);
  if (!role) {
    deny(res, 'No access to this machine');
    return false;
  }
  if (role === 'MEMBER' && !memberMethodAllowed(req.method, subPath)) {
    deny(res, ROLE_DENIED);
    return false;
  }
  return true;
};

/**
 * Authorize the agent-wide surfaces a vm-level user may reach without a lookup:
 * list endpoints (flagged for response filtering), machine create (flagged for org
 * stamping), ws-ticket, and stats. Returns 'allow', 'deny', or 'unmatched'.
 */
const authorizeVmAgentSurface = (req, access, subPath) => {
  if (subPath === 'machines' && req.method === 'GET') {
    access.filterMachines = true;
    access.decorateMachines = true;
    return 'allow';
  }
  if (subPath === 'machines' && req.method === 'POST') {
    if (access.stampOrgs.length === 0) {
      return 'deny';
    }
    access.stampCreate = true;
    return 'allow';
  }
  if (subPath === 'tasks' && req.method === 'GET') {
    access.filterTasks = true;
    return 'allow';
  }
  if (subPath === 'vnc/sessions' && req.method === 'GET') {
    access.filterSessions = true;
    return 'allow';
  }
  if (subPath === 'ws-ticket' && req.method === 'GET') {
    const machine = req.query?.machine;
    return machine && access.machines.has(machine) ? 'allow' : 'deny-ticket';
  }
  if (subPath === 'stats' && req.method === 'GET') {
    access.filterStats = true;
    return 'allow';
  }
  return 'unmatched';
};

/**
 * Authorize an id-keyed task/console-session path for a vm-level user via an
 * ownership lookup at the agent. Sends the response on denial; returns true when the
 * request may proceed.
 */
const authorizeVmLookupPath = async (req, res, access, subPath, serverId, lookupRule) => {
  const server = await db.server.withScope('withApiKey').findByPk(serverId);
  if (!server) {
    res.status(404).json({ success: false, message: 'Agent not found' });
    return false;
  }
  const owner = await lookupMachineForPath(server, lookupRule.lookupPath);
  const role = owner ? access.machines.get(owner) : null;
  if (!role) {
    deny(res, 'No access to this resource');
    return false;
  }
  if (lookupRule.managerMethods.includes(req.method) && !isManagerRole(role)) {
    deny(res, ROLE_DENIED);
    return false;
  }
  if (role === 'MEMBER' && !memberMethodAllowed(req.method, subPath)) {
    deny(res, ROLE_DENIED);
    return false;
  }
  return true;
};

/**
 * Express middleware for /api/agents/:id/*: resolves org access and either passes
 * (annotating req.orgAccess for response filtering + create stamping) or 403s.
 */
export const orgAuthorizeAgent = async (req, res, next) => {
  try {
    const serverId = parseInt(req.params.id);
    const subPath = Array.isArray(req.params.splat)
      ? req.params.splat.join('/')
      : req.params.splat || '';

    const access = await resolveAgentAccess(req, serverId);
    req.orgAccess = access;

    if (access.level === 'none') {
      return deny(res, 'No access to this agent');
    }

    if (access.level === 'full') {
      if (access.role === 'MEMBER') {
        if (subPath === 'ws-ticket' && req.method === 'GET' && !req.query?.machine) {
          return deny(res, 'Members must request a machine-scoped ticket (?machine=)');
        }
        if (!memberMethodAllowed(req.method, subPath)) {
          return deny(res, ROLE_DENIED);
        }
      }
      if (subPath === 'machines' && req.method === 'GET') {
        access.decorateMachines = true;
      }
      return next();
    }

    const machineName = machinePathName(subPath);
    if (machineName) {
      return authorizeVmMachinePath(req, res, access, subPath, machineName) ? next() : undefined;
    }

    const surface = authorizeVmAgentSurface(req, access, subPath);
    if (surface === 'allow') {
      return next();
    }
    if (surface === 'deny') {
      return deny(res, 'Your organization role does not permit creating machines');
    }
    if (surface === 'deny-ticket') {
      return deny(res, 'Tickets must be scoped to a machine you can access (?machine=)');
    }

    const lookupRule = vmScopedLookupRule(subPath);
    if (lookupRule) {
      const allowed = await authorizeVmLookupPath(req, res, access, subPath, serverId, lookupRule);
      return allowed ? next() : undefined;
    }

    return deny(res, 'No access to this agent surface');
  } catch (error) {
    log.auth.error('Org access resolution failed', { error: error.message });
    return res.status(500).json({ success: false, message: 'Access check failed' });
  }
};

export const machineIdentifier = item =>
  item?.name ?? item?.machine_name ?? item?.zone_name ?? item?.machineName ?? null;

/**
 * Filter a proxied agent response for vm-scoped users. Shapes verified against the
 * agent source: GET /machines returns {machines: [...], total} with `name` rows
 * (ZoneQueryController.listZones); GET /stats returns allmachines/runningmachines as
 * machine-name string arrays (ServerStats.serverStats); task and VNC-session rows carry
 * machine_name/zone_name. Runs only when the authorize middleware flagged the request;
 * everything else passes through verbatim.
 * @param {import('express').Request} req
 * @param {*} data - Agent response body
 * @returns {*} Filtered body (same shape)
 */
export const filterProxyResponse = (req, data) => {
  const access = req.orgAccess;
  if (!access || access.level !== 'vm') {
    return data;
  }

  if (access.filterMachines) {
    const keep = item => {
      const id = machineIdentifier(item);
      return id !== null && access.machines.has(id);
    };
    if (Array.isArray(data)) {
      return data.filter(keep);
    }
    if (data && Array.isArray(data.machines)) {
      const machines = data.machines.filter(keep);
      const filtered = { ...data, machines };
      if (typeof data.total === 'number') {
        filtered.total = machines.length;
      }
      return filtered;
    }
  }

  if (access.filterTasks) {
    const keep = task => {
      const id = task?.machine_name ?? task?.zone_name ?? null;
      return id !== null && access.machines.has(id);
    };
    if (Array.isArray(data)) {
      return data.filter(keep);
    }
    if (data && Array.isArray(data.tasks)) {
      return { ...data, tasks: data.tasks.filter(keep) };
    }
  }

  if (access.filterSessions) {
    const keep = session => {
      const id = session?.machine_name ?? session?.zone_name ?? null;
      return id !== null && access.machines.has(id);
    };
    if (Array.isArray(data)) {
      return data.filter(keep);
    }
    if (data && Array.isArray(data.sessions)) {
      return { ...data, sessions: data.sessions.filter(keep) };
    }
  }

  if (access.filterStats && data && typeof data === 'object') {
    const keepName = value => {
      const name = typeof value === 'string' ? value.trim() : null;
      return name !== null && access.machines.has(name);
    };
    const filtered = { ...data };
    if (Array.isArray(data.allmachines)) {
      filtered.allmachines = data.allmachines.filter(keepName);
    }
    if (Array.isArray(data.runningmachines)) {
      filtered.runningmachines = data.runningmachines.filter(keepName);
    }
    return filtered;
  }

  return data;
};

/**
 * After a successful machine create through the proxy, stamp the new machine with the
 * creating user's org so vm-scoped ownership exists from birth. Org choice: explicit
 * org_uuid in the create body wins (when the user manages that org), else the user's
 * primary org, else their first manager org. No-op for agent-owning-org creators on
 * their own agents (unassigned machines are already theirs).
 * @param {import('express').Request} req
 * @param {number} serverId
 * @param {*} responseData - Agent create response (carries the machine name)
 */
export const stampCreatedMachine = async (req, serverId, responseData) => {
  const access = req.orgAccess;
  if (!access?.stampCreate || access.stampOrgs.length === 0) {
    return;
  }

  const requested = req.body?.org_uuid;
  let orgUuid;
  if (requested && access.stampOrgs.includes(requested)) {
    orgUuid = requested;
  } else if (access.primaryOrg && access.stampOrgs.includes(access.primaryOrg)) {
    orgUuid = access.primaryOrg;
  } else {
    [orgUuid] = access.stampOrgs;
  }

  const machineName =
    machineIdentifier(responseData) ??
    machineIdentifier(responseData?.machine) ??
    req.body?.name ??
    req.body?.zone_name ??
    null;

  if (!machineName) {
    log.auth.warn('Machine created but could not determine name to stamp org ownership', {
      serverId,
      orgUuid,
    });
    return;
  }

  try {
    await MachineOrgModel.stampMachine(serverId, machineName, orgUuid);
    log.auth.info('Stamped machine org ownership', { serverId, machineName, orgUuid });
  } catch (error) {
    log.auth.error('Failed to stamp machine org ownership', {
      serverId,
      machineName,
      orgUuid,
      error: error.message,
    });
  }
};
