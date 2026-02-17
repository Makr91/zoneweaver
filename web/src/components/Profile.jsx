import { Helmet } from "@dr.pogodin/react-helmet";
import axios from "axios";
import { useState } from "react";

import { useAuth } from "../contexts/AuthContext";

import { FormModal } from "./common";
import PasswordManagement from "./Profile/PasswordManagement";
import ProfileInfo from "./Profile/ProfileInfo";

const Profile = () => {
  const { user, logout } = useAuth();
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [deleteData, setDeleteData] = useState({
    password: "",
    confirmText: "",
  });
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  /**
   * Handle password change
   */
  const handlePasswordChange = async (e) => {
    e.preventDefault();

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMsg("New passwords do not match");
      return;
    }

    if (passwordData.newPassword.length < 8) {
      setMsg("New password must be at least 8 characters long");
      return;
    }

    try {
      setLoading(true);
      setMsg("");

      const response = await axios.post("/api/auth/change-password", {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
        confirmPassword: passwordData.confirmPassword,
      });

      if (response.data.success) {
        setMsg("Password changed successfully!");
        setPasswordData({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
        setShowPasswordChange(false);
      } else {
        setMsg(response.data.message);
      }
    } catch (error) {
      console.error("Error changing password:", error);
      setMsg(
        `Error changing password: ${
          error.response?.data?.message || error.message
        }`
      );
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle account deletion
   */
  const handleDeleteAccount = async () => {
    if (deleteData.confirmText !== "DELETE") {
      setMsg('You must type "DELETE" to confirm account deletion');
      return;
    }

    try {
      setLoading(true);
      setMsg("");

      const response = await axios.delete("/api/auth/delete-account", {
        data: {
          password: deleteData.password,
          confirmText: deleteData.confirmText,
        },
      });

      if (response.data.success) {
        // Account deleted successfully, redirect to login
        await logout();
        window.location.href = "/ui/login?message=Account deleted successfully";
      } else {
        setMsg(response.data.message);
      }
    } catch (error) {
      console.error("Error deleting account:", error);
      setMsg(
        `Error deleting account: ${
          error.response?.data?.message || error.message
        }`
      );
    } finally {
      setLoading(false);
    }
  };

  /**
   * Close delete modal and reset form
   */
  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setDeleteData({ password: "", confirmText: "" });
    setMsg("");
  };

  /**
   * Get role badge color
   */
  const getRoleBadgeClass = (role) => {
    switch (role) {
      case "super-admin":
        return "is-danger";
      case "admin":
        return "is-warning";
      case "user":
        return "is-success";
      default:
        return "is-light";
    }
  };

  const getNotificationClass = () => {
    if (msg.includes("successfully")) {
      return "is-success";
    }
    if (msg.includes("Error") || msg.includes("must")) {
      return "is-danger";
    }
    return "is-warning";
  };

  return (
    <div className="zw-page-content-scrollable">
      <Helmet>
        <meta charSet="utf-8" />
        <title>Profile - Zoneweaver</title>
        <link rel="canonical" href={window.location.origin} />
      </Helmet>
      <div className="container is-fluid p-0">
        <div className="box p-0 is-radiusless">
          <div className="titlebar box active level is-mobile mb-0 p-3">
            <div className="level-left">
              <strong>User Profile</strong>
            </div>
          </div>

          <div className="px-4">
            {msg && (
              <div className={`notification ${getNotificationClass()}`}>
                <p>{msg}</p>
              </div>
            )}

            <div className="columns">
              <div className="column is-one-third">
                <ProfileInfo user={user} />
              </div>

              <div className="column">
                {/* Account Information */}
                <div className="box">
                  <h2 className="title is-5">Account Information</h2>
                  <div className="content">
                    <div className="field">
                      <label className="label" htmlFor="username">
                        Username
                      </label>
                      <div className="control">
                        <input
                          id="username"
                          className="input"
                          type="text"
                          value={user?.username || ""}
                          disabled
                        />
                      </div>
                    </div>

                    <div className="field">
                      <label className="label" htmlFor="email">
                        Email
                      </label>
                      <div className="control">
                        <input
                          id="email"
                          className="input"
                          type="email"
                          value={user?.email || ""}
                          disabled
                        />
                      </div>
                    </div>

                    <div className="field">
                      <p className="label">Role</p>
                      <div className="control">
                        <span
                          className={`tag is-medium ${getRoleBadgeClass(user?.role)}`}
                        >
                          {user?.role || "Unknown"}
                        </span>
                      </div>
                    </div>

                    <div className="field">
                      <label className="label" htmlFor="createdAt">
                        Member Since
                      </label>
                      <div className="control">
                        <input
                          id="createdAt"
                          className="input"
                          type="text"
                          value={
                            user?.createdAt
                              ? new Date(user.createdAt).toLocaleDateString()
                              : "Unknown"
                          }
                          disabled
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <PasswordManagement
                  showPasswordChange={showPasswordChange}
                  setShowPasswordChange={setShowPasswordChange}
                  passwordData={passwordData}
                  setPasswordData={setPasswordData}
                  handlePasswordChange={handlePasswordChange}
                  loading={loading}
                  setMsg={setMsg}
                />

                {/* Account Deletion */}
                <div className="box">
                  <h2 className="title is-5 has-text-danger">Danger Zone</h2>
                  <div className="notification is-danger">
                    <p>
                      <strong>Warning:</strong> Account deletion is permanent
                      and cannot be undone.
                    </p>
                    {user?.role === "super-admin" && (
                      <p>
                        <strong>Note:</strong> As a super-admin, you cannot
                        delete your account if you are the last super-admin.
                      </p>
                    )}
                  </div>

                  <button
                    className="button is-danger is-outlined"
                    onClick={() => setShowDeleteModal(true)}
                  >
                    Delete My Account
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Account Modal */}
      {showDeleteModal && (
        <FormModal
          isOpen={showDeleteModal}
          onClose={closeDeleteModal}
          onSubmit={handleDeleteAccount}
          title="⚠️ Delete Account"
          icon="fas fa-exclamation-triangle"
          submitText={loading ? "Deleting..." : "Delete Account Permanently"}
          submitVariant="is-danger"
          loading={loading}
          submitDisabled={
            deleteData.confirmText !== "DELETE" || !deleteData.password
          }
        >
          <div className="notification is-danger">
            <p>
              <strong>WARNING: This action cannot be undone!</strong>
            </p>
            <p>You are about to permanently delete your account:</p>
          </div>

          <div className="box has-background-grey-lighter">
            <p>
              <strong>Username:</strong> {user?.username}
            </p>
            <p>
              <strong>Email:</strong> {user?.email}
            </p>
            <p>
              <strong>Role:</strong> {user?.role}
            </p>
          </div>

          <div className="field">
            <label className="label" htmlFor="deletePassword">
              Current Password
            </label>
            <div className="control">
              <input
                id="deletePassword"
                className="input"
                type="password"
                value={deleteData.password}
                onChange={(e) =>
                  setDeleteData({ ...deleteData, password: e.target.value })
                }
                placeholder="Enter your current password"
              />
            </div>
          </div>

          <div className="field">
            <label className="label" htmlFor="deleteConfirm">
              Type &quot;DELETE&quot; to confirm account deletion:
            </label>
            <div className="control">
              <input
                id="deleteConfirm"
                className="input"
                type="text"
                value={deleteData.confirmText}
                onChange={(e) =>
                  setDeleteData({ ...deleteData, confirmText: e.target.value })
                }
                placeholder="Type DELETE to confirm"
                autoComplete="off"
              />
            </div>
            <p className="help">
              This will permanently remove your account and all associated data.
            </p>
          </div>
        </FormModal>
      )}
    </div>
  );
};

export default Profile;
