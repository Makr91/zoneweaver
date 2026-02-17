import PropTypes from "prop-types";

import { FormModal } from "../common";

import { getNotificationClass } from "./accountUtils";

/**
 * Get submit button text for user confirm action modal
 * @param {boolean} isLoading - Whether action is in progress
 * @param {string} action - The confirm action type
 * @returns {string} Submit button text
 */
const getConfirmSubmitText = (isLoading, action) => {
  if (isLoading) {
    return action === "deactivate" ? "Deactivating..." : "Reactivating...";
  }
  return action === "deactivate" ? "Deactivate" : "Reactivate";
};

/**
 * All modal dialogs for the Accounts page
 */
const AccountModals = ({
  user,
  // Delete user modal
  deleteModalUser,
  deleteConfirmText,
  setDeleteConfirmText,
  loading,
  handleDeleteUser,
  closeDeleteModal,
  // Delete org modal
  deleteModalOrg,
  deleteOrgConfirmText,
  setDeleteOrgConfirmText,
  orgLoading,
  handleDeleteOrg,
  closeDeleteOrgModal,
  // Invite modal
  showInviteModal,
  inviteEmail,
  setInviteEmail,
  inviteOrganizationId,
  setInviteOrganizationId,
  inviteLoading,
  inviteMsg,
  organizations,
  viewScope,
  handleSendInvitation,
  closeInviteModal,
  // User action confirm modal
  confirmModalUser,
  confirmAction,
  confirmUserAction,
  closeConfirmModal,
  // Org deactivation confirm modal
  confirmModalOrg,
  confirmOrgAction,
  closeConfirmOrgModal,
}) => (
  <>
    {/* Delete User Confirmation Modal */}
    <FormModal
      isOpen={!!deleteModalUser}
      onClose={closeDeleteModal}
      onSubmit={handleDeleteUser}
      title="Permanent User Deletion"
      icon="fas fa-trash"
      submitText={loading ? "Deleting..." : "Delete User Permanently"}
      submitVariant="is-danger"
      loading={loading}
      disabled={deleteConfirmText !== "DELETE"}
    >
      <div className="notification is-danger">
        <p>
          <strong>WARNING: This action cannot be undone!</strong>
        </p>
        <p>You are about to permanently delete the following user:</p>
      </div>

      {deleteModalUser && (
        <div className="box">
          <p>
            <strong>Username:</strong> {deleteModalUser.username}
          </p>
          <p>
            <strong>Email:</strong> {deleteModalUser.email}
          </p>
          <p>
            <strong>Role:</strong> {deleteModalUser.role}
          </p>
          {deleteModalUser.organization_name && (
            <p>
              <strong>Organization:</strong> {deleteModalUser.organization_name}
            </p>
          )}
        </div>
      )}

      <div className="field">
        <label className="label" htmlFor="delete-user-confirm">
          Type &quot;DELETE&quot; to confirm permanent deletion:
        </label>
        <div className="control">
          <input
            id="delete-user-confirm"
            className="input"
            type="text"
            value={deleteConfirmText}
            onChange={(e) => setDeleteConfirmText(e.target.value)}
            placeholder="Type DELETE to confirm"
            autoComplete="off"
          />
        </div>
        <p className="help">
          This will permanently remove the user and all associated data.
        </p>
      </div>
    </FormModal>

    {/* Organization Delete Confirmation Modal */}
    <FormModal
      isOpen={!!deleteModalOrg}
      onClose={closeDeleteOrgModal}
      onSubmit={handleDeleteOrg}
      title="Permanent Organization Deletion"
      icon="fas fa-trash"
      submitText={
        orgLoading ? "Deleting..." : "Delete Organization Permanently"
      }
      submitVariant="is-danger"
      loading={orgLoading}
      disabled={deleteOrgConfirmText !== "DELETE"}
    >
      <div className="notification is-danger">
        <p>
          <strong>WARNING: This action cannot be undone!</strong>
        </p>
        <p>You are about to permanently delete the following organization:</p>
      </div>

      {deleteModalOrg && (
        <div className="box">
          <p>
            <strong>Organization Name:</strong> {deleteModalOrg.name}
          </p>
          <p>
            <strong>Description:</strong>{" "}
            {deleteModalOrg.description || "No description"}
          </p>
          <p>
            <strong>Total Users:</strong> {deleteModalOrg.total_users || 0}
          </p>
          <p>
            <strong>Active Users:</strong> {deleteModalOrg.active_users || 0}
          </p>
          <p>
            <strong>Created:</strong>{" "}
            {new Date(deleteModalOrg.created_at).toLocaleDateString()}
          </p>
        </div>
      )}

      {deleteModalOrg && deleteModalOrg.active_users > 0 && (
        <div className="notification is-warning">
          <p>
            <strong>Note:</strong> This organization has{" "}
            {deleteModalOrg.active_users} active users. All users in this
            organization will be permanently deleted along with the
            organization.
          </p>
        </div>
      )}

      <div className="field">
        <label className="label" htmlFor="delete-org-confirm">
          Type &quot;DELETE&quot; to confirm permanent deletion:
        </label>
        <div className="control">
          <input
            id="delete-org-confirm"
            className="input"
            type="text"
            value={deleteOrgConfirmText}
            onChange={(e) => setDeleteOrgConfirmText(e.target.value)}
            placeholder="Type DELETE to confirm"
            autoComplete="off"
          />
        </div>
        <p className="help">
          This will permanently remove the organization and all associated data.
        </p>
      </div>
    </FormModal>

    {/* Invite User Modal */}
    <FormModal
      isOpen={showInviteModal}
      onClose={closeInviteModal}
      onSubmit={handleSendInvitation}
      title="Invite New User"
      icon="fas fa-envelope"
      submitText={inviteLoading ? "Sending..." : "Send Invitation"}
      submitVariant="is-primary"
      loading={inviteLoading}
      disabled={!inviteEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(inviteEmail)}
    >
      <p className="mb-4">
        Send an email invitation to a new user to join{" "}
        {user?.role === "super-admin" && viewScope === "all"
          ? "the system"
          : "your organization"}
        . The invitation will be valid for 7 days and can only be used once.
      </p>

      <div className="field">
        <label className="label" htmlFor="invite-email">
          Email Address
        </label>
        <div className="control has-icons-left">
          <input
            id="invite-email"
            className="input"
            type="email"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            placeholder="Enter email address"
            autoComplete="off"
            disabled={inviteLoading}
          />
          <span className="icon is-small is-left">
            <i className="fas fa-envelope" />
          </span>
        </div>
        <p className="help">
          The user will receive an email with a registration link that expires
          in 7 days.
        </p>
      </div>

      {user?.role === "super-admin" && (
        <div className="field">
          <label className="label" htmlFor="invite-org">
            Organization (Optional)
          </label>
          <div className="control">
            <div className="select is-fullwidth">
              <select
                id="invite-org"
                value={inviteOrganizationId}
                onChange={(e) => setInviteOrganizationId(e.target.value)}
                disabled={inviteLoading}
              >
                <option value="">Select Organization</option>
                {organizations.map((org) => (
                  <option key={org.id} value={org.id}>
                    {org.name} ({org.active_users} active users)
                  </option>
                ))}
              </select>
            </div>
          </div>
          <p className="help">
            Choose an organization for the user to join, or leave blank for a
            system-level invitation.
          </p>
        </div>
      )}

      {user?.role === "admin" && (
        <div className="notification is-info">
          <p>
            <strong>Organization Admin:</strong> This invitation will allow the
            user to join your organization with a &apos;user&apos; role by
            default.
          </p>
        </div>
      )}

      {inviteMsg && (
        <div className={`notification ${getNotificationClass(inviteMsg)}`}>
          <p>{inviteMsg}</p>
        </div>
      )}
    </FormModal>

    {/* User Action Confirmation Modal */}
    <FormModal
      isOpen={!!confirmModalUser}
      onClose={closeConfirmModal}
      onSubmit={confirmUserAction}
      title={
        confirmAction === "deactivate" ? "Deactivate User" : "Reactivate User"
      }
      icon={`fas ${confirmAction === "deactivate" ? "fa-user-slash" : "fa-user-check"}`}
      submitText={getConfirmSubmitText(loading, confirmAction)}
      submitVariant={
        confirmAction === "deactivate" ? "is-danger" : "is-success"
      }
      loading={loading}
    >
      {confirmModalUser && (
        <p>
          Are you sure you want to {confirmAction}{" "}
          <strong>{confirmModalUser.username}</strong>?
        </p>
      )}
    </FormModal>

    {/* Organization Deactivation Confirmation Modal */}
    <FormModal
      isOpen={!!confirmModalOrg}
      onClose={closeConfirmOrgModal}
      onSubmit={confirmOrgAction}
      title="Deactivate Organization"
      icon="fas fa-building"
      submitText={orgLoading ? "Deactivating..." : "Deactivate Organization"}
      submitVariant="is-danger"
      loading={orgLoading}
    >
      {confirmModalOrg && (
        <div>
          <p>
            Are you sure you want to deactivate{" "}
            <strong>{confirmModalOrg.name}</strong>?
          </p>
          <p className="mt-3 has-text-grey">
            This will prevent new users from joining this organization.
          </p>
        </div>
      )}
    </FormModal>
  </>
);

AccountModals.propTypes = {
  user: PropTypes.object.isRequired,
  deleteModalUser: PropTypes.object,
  deleteConfirmText: PropTypes.string.isRequired,
  setDeleteConfirmText: PropTypes.func.isRequired,
  loading: PropTypes.bool.isRequired,
  handleDeleteUser: PropTypes.func.isRequired,
  closeDeleteModal: PropTypes.func.isRequired,
  deleteModalOrg: PropTypes.object,
  deleteOrgConfirmText: PropTypes.string.isRequired,
  setDeleteOrgConfirmText: PropTypes.func.isRequired,
  orgLoading: PropTypes.bool.isRequired,
  handleDeleteOrg: PropTypes.func.isRequired,
  closeDeleteOrgModal: PropTypes.func.isRequired,
  showInviteModal: PropTypes.bool.isRequired,
  inviteEmail: PropTypes.string.isRequired,
  setInviteEmail: PropTypes.func.isRequired,
  inviteOrganizationId: PropTypes.string.isRequired,
  setInviteOrganizationId: PropTypes.func.isRequired,
  inviteLoading: PropTypes.bool.isRequired,
  inviteMsg: PropTypes.string.isRequired,
  organizations: PropTypes.array.isRequired,
  viewScope: PropTypes.string.isRequired,
  handleSendInvitation: PropTypes.func.isRequired,
  closeInviteModal: PropTypes.func.isRequired,
  confirmModalUser: PropTypes.object,
  confirmAction: PropTypes.string.isRequired,
  confirmUserAction: PropTypes.func.isRequired,
  closeConfirmModal: PropTypes.func.isRequired,
  confirmModalOrg: PropTypes.object,
  confirmOrgAction: PropTypes.func.isRequired,
  closeConfirmOrgModal: PropTypes.func.isRequired,
};

export default AccountModals;
