import PropTypes from "prop-types";

import {
  canModifyUser,
  getRoleBadgeClass,
  getNotificationClass,
} from "./accountUtils";

/**
 * Users tab content - user info, invite section, and users table
 */
const UsersTab = ({
  user,
  allUsers,
  loading,
  viewScope,
  editingUser,
  setEditingUser,
  newRole,
  setNewRole,
  organizations,
  setShowInviteModal,
  inviteLoading,
  inviteMsg,
  handleRoleChange,
  handleDeactivateUser,
  handleReactivateUser,
  setDeleteModalUser,
  loadOrganizations,
}) => (
  <>
    {/* Current User Info */}
    <div className="box mb-4">
      <h2 className="title is-5">Your Account</h2>
      <div className="content">
        <p>
          <strong>Username:</strong> {user?.username}
          <span className={`tag ml-2 ${getRoleBadgeClass(user?.role)}`}>
            {user?.role}
          </span>
        </p>
        <p>
          <strong>Email:</strong> {user?.email}
        </p>
        <p className="is-size-7 has-text-grey">
          You can manage your profile and change your password in the Profile
          section.
        </p>
      </div>
    </div>

    {/* Invite User Section */}
    {(user?.role === "admin" || user?.role === "super-admin") && (
      <div className="box mb-4">
        <div className="level">
          <div className="level-left">
            <div>
              <h2 className="title is-6 mb-2">Invite New User</h2>
              <p className="subtitle is-7 has-text-grey">
                Send an email invitation to join{" "}
                {user?.role === "super-admin" && viewScope === "all"
                  ? "the system"
                  : "your organization"}
              </p>
            </div>
          </div>
          <div className="level-right">
            <button
              className="button is-primary"
              onClick={() => {
                setShowInviteModal(true);
                if (
                  user?.role === "super-admin" &&
                  organizations.length === 0
                ) {
                  loadOrganizations();
                }
              }}
              disabled={loading || inviteLoading}
            >
              <span className="icon is-small">
                <i className="fas fa-envelope" />
              </span>
              <span>Invite User</span>
            </button>
          </div>
        </div>

        {inviteMsg && (
          <div
            className={`notification ${getNotificationClass(inviteMsg)} mt-3`}
          >
            <p>{inviteMsg}</p>
          </div>
        )}
      </div>
    )}

    {/* Users Table */}
    <div className="box">
      <div className="level mb-3">
        <div className="level-left">
          <h2 className="title is-5">
            {viewScope === "all"
              ? "All Users (System-wide)"
              : "Organization Users"}
          </h2>
        </div>
        <div className="level-right">
          {viewScope === "all" && (
            <span className="tag is-warning">Super Admin View</span>
          )}
          {viewScope === "organization" && (
            <span className="tag is-info">Organization View</span>
          )}
        </div>
      </div>

      {loading ? (
        <div className="has-text-centered p-4">
          <div className="button is-loading is-large is-ghost" />
          <p className="mt-2">Loading users...</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="table is-fullwidth is-hoverable">
            <thead>
              <tr>
                <th>Username</th>
                <th>Email</th>
                <th>Organization</th>
                <th>Role</th>
                <th>Created</th>
                <th>Last Login</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {allUsers.map((targetUser) => (
                <tr key={targetUser.id}>
                  <td>
                    <strong>
                      {targetUser.id === user.id
                        ? user.username
                        : targetUser.username}
                    </strong>
                    {targetUser.id === user.id && (
                      <span className="tag is-small is-info ml-2">You</span>
                    )}
                  </td>
                  <td>{targetUser.email}</td>
                  <td>
                    {targetUser.organization_name ? (
                      targetUser.organization_name
                    ) : (
                      <span className="has-text-grey is-italic">
                        {targetUser.role === "super-admin"
                          ? "System Admin"
                          : "No Organization"}
                      </span>
                    )}
                  </td>
                  <td>
                    {editingUser === targetUser.id ? (
                      <div className="field has-addons">
                        <div className="control">
                          <div className="select is-small">
                            <select
                              value={newRole}
                              onChange={(e) => setNewRole(e.target.value)}
                            >
                              <option value="">Select Role</option>
                              <option value="user">User</option>
                              <option value="admin">Admin</option>
                              {user.role === "super-admin" && (
                                <option value="super-admin">Super Admin</option>
                              )}
                            </select>
                          </div>
                        </div>
                        <div className="control">
                          <button
                            className="button is-small is-success"
                            onClick={() =>
                              handleRoleChange(targetUser.id, newRole)
                            }
                            disabled={!newRole || loading}
                          >
                            Save
                          </button>
                        </div>
                        <div className="control">
                          <button
                            className="button is-small"
                            onClick={() => {
                              setEditingUser(null);
                              setNewRole("");
                            }}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <span
                        className={`tag ${getRoleBadgeClass(targetUser.role)}`}
                      >
                        {targetUser.role}
                      </span>
                    )}
                  </td>
                  <td>
                    {new Date(targetUser.created_at).toLocaleDateString()}
                  </td>
                  <td>
                    {targetUser.last_login
                      ? new Date(targetUser.last_login).toLocaleDateString()
                      : "Never"}
                  </td>
                  <td>
                    <span
                      className={`tag ${targetUser.is_active ? "is-success" : "is-danger"}`}
                    >
                      {targetUser.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td>
                    {canModifyUser(user, targetUser) ? (
                      <div className="buttons are-small">
                        {editingUser !== targetUser.id && (
                          <>
                            <button
                              className="button is-small is-warning"
                              onClick={() => {
                                setEditingUser(targetUser.id);
                                setNewRole(targetUser.role);
                              }}
                              disabled={loading}
                            >
                              Edit Role
                            </button>
                            {targetUser.is_active ? (
                              <button
                                className="button is-small is-danger"
                                onClick={() =>
                                  handleDeactivateUser(targetUser.id)
                                }
                                disabled={loading}
                              >
                                Deactivate
                              </button>
                            ) : (
                              <button
                                className="button is-small is-success"
                                onClick={() =>
                                  handleReactivateUser(targetUser.id)
                                }
                                disabled={loading}
                              >
                                Reactivate
                              </button>
                            )}
                            {user.role === "super-admin" && (
                              <button
                                className="button is-small is-danger is-outlined"
                                onClick={() => setDeleteModalUser(targetUser)}
                                disabled={loading}
                                title="Permanent deletion (Super Admin only)"
                              >
                                Delete
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    ) : (
                      <span className="has-text-grey is-size-7">
                        {targetUser.id === user.id
                          ? "Cannot modify self"
                          : "No permission"}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  </>
);

UsersTab.propTypes = {
  user: PropTypes.object.isRequired,
  allUsers: PropTypes.array.isRequired,
  loading: PropTypes.bool.isRequired,
  viewScope: PropTypes.string.isRequired,
  editingUser: PropTypes.number,
  setEditingUser: PropTypes.func.isRequired,
  newRole: PropTypes.string.isRequired,
  setNewRole: PropTypes.func.isRequired,
  organizations: PropTypes.array.isRequired,
  setShowInviteModal: PropTypes.func.isRequired,
  inviteLoading: PropTypes.bool.isRequired,
  inviteMsg: PropTypes.string.isRequired,
  handleRoleChange: PropTypes.func.isRequired,
  handleDeactivateUser: PropTypes.func.isRequired,
  handleReactivateUser: PropTypes.func.isRequired,
  setDeleteModalUser: PropTypes.func.isRequired,
  loadOrganizations: PropTypes.func.isRequired,
};

export default UsersTab;
