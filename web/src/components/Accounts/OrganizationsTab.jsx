import PropTypes from "prop-types";

import { canEditOrg, getNotificationClass } from "./accountUtils";

/**
 * Organizations tab content - org table with inline editing
 */
const OrganizationsTab = ({
  user,
  organizations,
  orgLoading,
  orgMsg,
  editingOrg,
  editOrgName,
  setEditOrgName,
  editOrgDescription,
  setEditOrgDescription,
  handleEditOrg,
  handleCancelEditOrg,
  handleSaveOrgChanges,
  canModifyOrg,
  handleDeactivateOrg,
  setDeleteModalOrg,
}) => (
  <div className="box mb-4">
    <h2 className="title is-5">Organizations Overview</h2>
    {orgMsg && (
      <div className={`notification ${getNotificationClass(orgMsg)} mb-4`}>
        <p>{orgMsg}</p>
      </div>
    )}

    {orgLoading ? (
      <div className="has-text-centered p-4">
        <div className="button is-loading is-large is-ghost" />
        <p className="mt-2">Loading organizations...</p>
      </div>
    ) : (
      <div className="table-container">
        <table className="table is-fullwidth is-hoverable">
          <thead>
            <tr>
              <th>Organization Name</th>
              <th>Description</th>
              <th>Total Users</th>
              <th>Active Users</th>
              <th>Admins</th>
              <th>Created</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {organizations.map((org) => (
              <tr key={org.id}>
                <td>
                  {editingOrg === org.id ? (
                    <div className="field">
                      <div className="control">
                        <input
                          className="input is-small"
                          type="text"
                          value={editOrgName}
                          onChange={(e) => setEditOrgName(e.target.value)}
                          placeholder="Organization name"
                          disabled={orgLoading}
                        />
                      </div>
                    </div>
                  ) : (
                    <strong>{org.name}</strong>
                  )}
                </td>
                <td>
                  {editingOrg === org.id ? (
                    <div className="field">
                      <div className="control">
                        <textarea
                          className="textarea is-small"
                          rows="2"
                          value={editOrgDescription}
                          onChange={(e) =>
                            setEditOrgDescription(e.target.value)
                          }
                          placeholder="Organization description (optional)"
                          disabled={orgLoading}
                        />
                      </div>
                    </div>
                  ) : (
                    org.description || (
                      <span className="has-text-grey is-italic">
                        No description
                      </span>
                    )
                  )}
                </td>
                <td>
                  <span className="tag is-info">{org.total_users || 0}</span>
                </td>
                <td>
                  <span className="tag is-success">
                    {org.active_users || 0}
                  </span>
                </td>
                <td>
                  <span className="tag is-warning">{org.admin_users || 0}</span>
                </td>
                <td>{new Date(org.created_at).toLocaleDateString()}</td>
                <td>
                  <span
                    className={`tag ${org.is_active ? "is-success" : "is-danger"}`}
                  >
                    {org.is_active ? "Active" : "Inactive"}
                  </span>
                </td>
                <td>
                  <div className="buttons are-small">
                    {editingOrg === org.id ? (
                      <>
                        <button
                          className="button is-small is-success"
                          onClick={() => handleSaveOrgChanges(org.id)}
                          disabled={!editOrgName.trim() || orgLoading}
                        >
                          Save
                        </button>
                        <button
                          className="button is-small"
                          onClick={handleCancelEditOrg}
                          disabled={orgLoading}
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        {canEditOrg(user, org) && (
                          <button
                            className="button is-small is-info"
                            onClick={() => handleEditOrg(org)}
                            disabled={orgLoading || editingOrg !== null}
                            title="Edit organization name and description"
                          >
                            Edit
                          </button>
                        )}
                        {canModifyOrg(org) && org.is_active && (
                          <button
                            className="button is-small is-warning"
                            onClick={() => handleDeactivateOrg(org.id)}
                            disabled={orgLoading || editingOrg !== null}
                            title="Deactivate organization"
                          >
                            Deactivate
                          </button>
                        )}
                        {canModifyOrg(org) && (
                          <button
                            className="button is-small is-danger is-outlined"
                            onClick={() => setDeleteModalOrg(org)}
                            disabled={orgLoading || editingOrg !== null}
                            title="Permanently delete organization (and all users)"
                          >
                            Delete
                          </button>
                        )}
                        {!canEditOrg(user, org) && !canModifyOrg(org) && (
                          <span className="has-text-grey is-size-7">
                            No permission
                          </span>
                        )}
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {organizations.length === 0 && (
              <tr>
                <td
                  colSpan="7"
                  className="has-text-centered has-text-grey is-italic p-4"
                >
                  No organizations found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    )}
  </div>
);

OrganizationsTab.propTypes = {
  user: PropTypes.object.isRequired,
  organizations: PropTypes.array.isRequired,
  orgLoading: PropTypes.bool.isRequired,
  orgMsg: PropTypes.string.isRequired,
  editingOrg: PropTypes.number,
  editOrgName: PropTypes.string.isRequired,
  setEditOrgName: PropTypes.func.isRequired,
  editOrgDescription: PropTypes.string.isRequired,
  setEditOrgDescription: PropTypes.func.isRequired,
  handleEditOrg: PropTypes.func.isRequired,
  handleCancelEditOrg: PropTypes.func.isRequired,
  handleSaveOrgChanges: PropTypes.func.isRequired,
  canModifyOrg: PropTypes.func.isRequired,
  handleDeactivateOrg: PropTypes.func.isRequired,
  setDeleteModalOrg: PropTypes.func.isRequired,
};

export default OrganizationsTab;
