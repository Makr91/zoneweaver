import React, { useState } from "react";

import FormModal from "../common/FormModal";

const SetPasswordModal = ({ user, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
    forceChange: false,
    unlockAccount: true,
  });
  const [error, setError] = useState("");

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.password) {
      setError("Password is required");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters long");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const passwordData = {
        password: formData.password,
        forceChange: formData.forceChange,
        unlockAccount: formData.unlockAccount,
      };

      await onSuccess(passwordData);
    } catch (err) {
      setError(`Error setting password: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <FormModal
      isOpen={true}
      onClose={onClose}
      onSubmit={handleSubmit}
      title={`Set Password for ${user.username}`}
      icon="fas fa-key"
      submitText="Set Password"
      submitIcon="fas fa-key"
      loading={loading}
      showCancelButton={true}
      aria-label={`Set password for user ${user.username}`}
    >
      {error && (
        <div className="notification is-danger mb-4">
          <button className="delete" onClick={() => setError("")} />
          <p>{error}</p>
        </div>
      )}

      <div className="field">
        <label className="label">
          New Password <span className="has-text-danger">*</span>
        </label>
        <div className="control">
          <input
            className="input"
            type="password"
            value={formData.password}
            onChange={(e) =>
              handleInputChange("password", e.target.value)
            }
            required
            disabled={loading}
            placeholder="Enter new password"
            autoComplete="new-password"
          />
        </div>
        <p className="help">
          Password must be at least 8 characters long
        </p>
      </div>

      <div className="field">
        <label className="label">
          Confirm Password <span className="has-text-danger">*</span>
        </label>
        <div className="control">
          <input
            className="input"
            type="password"
            value={formData.confirmPassword}
            onChange={(e) =>
              handleInputChange("confirmPassword", e.target.value)
            }
            required
            disabled={loading}
            placeholder="Confirm new password"
            autoComplete="new-password"
          />
        </div>
      </div>

      <hr />

      <div className="field">
        <div className="control">
          <label className="switch">
            <input
              type="checkbox"
              checked={formData.forceChange}
              onChange={(e) =>
                handleInputChange("forceChange", e.target.checked)
              }
              disabled={loading}
            />
            <span className="check" />
            <span className="control-label">
              Force password change on next login
            </span>
          </label>
        </div>
        <p className="help">
          User will be required to change password on their next login
        </p>
      </div>

      <div className="field">
        <div className="control">
          <label className="switch">
            <input
              type="checkbox"
              checked={formData.unlockAccount}
              onChange={(e) =>
                handleInputChange("unlockAccount", e.target.checked)
              }
              disabled={loading}
            />
            <span className="check" />
            <span className="control-label">
              Unlock account if locked
            </span>
          </label>
        </div>
        <p className="help">
          Automatically unlock the account when setting the password
        </p>
      </div>
    </FormModal>
  );
};

export default SetPasswordModal;
