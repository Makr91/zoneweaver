import { getAllOrganizations } from './organizations/list.js';
import { deactivateOrganization, deleteOrganization } from './organizations/lifecycle.js';
import { getOrganization, updateOrganization } from './organizations/detail.js';
import {
  getOrganizationUsers,
  getOrganizationStats,
  checkOrganizationExists,
} from './organizations/members.js';

const OrganizationController = {
  getAllOrganizations,
  deactivateOrganization,
  deleteOrganization,
  getOrganization,
  updateOrganization,
  getOrganizationUsers,
  getOrganizationStats,
  checkOrganizationExists,
};

export default OrganizationController;
