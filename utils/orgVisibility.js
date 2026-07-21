/**
 * @fileoverview Org visibility + assignment-management checks built on the orgAccess
 * layer (D15): registry-list filtering and the self-service rules for who may edit an
 * agent's or a machine's org assignment.
 */

import db from '../models/index.js';
import { getUserOrgAccess, resolveAgentAccess, isManagerRole } from './orgAccess.js';

const { serverOrg: ServerOrgModel, machineOrg: MachineOrgModel } = db;

/**
 * Which agents is this user allowed to SEE in the registry list? Unassigned agents are
 * open to all; owned agents require org membership or a machine sticker on that agent.
 * @param {import('express').Request} req
 * @param {Array<Object>} servers - servers rows
 * @returns {Promise<Array<Object>>} Visible subset
 */
export const filterVisibleServers = async (req, servers) => {
  const userAccess = await getUserOrgAccess(req);
  if (userAccess.bypass) {
    return servers;
  }

  const orgUuids = [...userAccess.orgs.keys()];
  const [allAgentOrgRows, machineServerIds] = await Promise.all([
    ServerOrgModel.findAll({ where: {} }),
    orgUuids.length > 0 ? MachineOrgModel.findAll({ where: { org_uuid: orgUuids } }) : [],
  ]);

  const ownedServers = new Map();
  for (const row of allAgentOrgRows) {
    if (!ownedServers.has(row.server_id)) {
      ownedServers.set(row.server_id, new Set());
    }
    ownedServers.get(row.server_id).add(row.org_uuid);
  }

  const machineVisible = new Set(machineServerIds.map(row => row.server_id));

  return servers.filter(server => {
    const owners = ownedServers.get(server.id);
    if (!owners) {
      return true;
    }
    if (machineVisible.has(server.id)) {
      return true;
    }
    return orgUuids.some(uuid => owners.has(uuid));
  });
};

/**
 * May this user manage org assignment on an agent? Local admins/super-admins always;
 * otherwise OWNER/ADMIN of an org that owns the agent (self-service, D15). Unassigned
 * agents are claimable only by local admins.
 * @param {import('express').Request} req
 * @param {number} serverId
 * @returns {Promise<boolean>}
 */
export const canManageAgentOrgs = async (req, serverId) => {
  if (req.user?.role === 'admin' || req.user?.role === 'super-admin') {
    return true;
  }
  const access = await resolveAgentAccess(req, serverId);
  return access.level === 'full' && isManagerRole(access.role);
};

/**
 * May this user manage org assignment on a machine? Agent-org managers may assign ANY
 * machine on their agent (unstickered included); machine-org managers may re-assign
 * their own machine; local admins/super-admins always.
 * @param {import('express').Request} req
 * @param {number} serverId
 * @param {string} machineName
 * @returns {Promise<boolean>}
 */
export const canManageMachineOrgs = async (req, serverId, machineName) => {
  if (req.user?.role === 'admin' || req.user?.role === 'super-admin') {
    return true;
  }
  const access = await resolveAgentAccess(req, serverId);
  if (access.level === 'full' && isManagerRole(access.role)) {
    return true;
  }
  if (access.level === 'vm') {
    return isManagerRole(access.machines.get(machineName));
  }
  return false;
};
