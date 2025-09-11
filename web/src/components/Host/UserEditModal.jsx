import React, { useState, useEffect } from "react";

import { useServers } from "../../contexts/ServerContext";
import FormModal from "../common/FormModal";

const UserEditModal = ({ server, user, onClose, onSuccess, onError }) => {
  const [loading, setLoading] = useState(false);
  const [availableGroups, setAvailableGroups] = useState([]);
  const [formData, setFormData] = useState({
    new_comment: user.comment || "",
    new_shell: user.shell || "/bin/bash",
    new_groups: [],
    new_authorizations: [],
    new_profiles: [],
  });

  const { makeZoneweaverAPIRequest } = useServers();

  useEffect(() => {
    loadEditOptions();
  }, []);

  const loadEditOptions = async () => {
    if (!server || !makeZoneweaverAPIRequest) return;

    try {
      // Load available groups for selection
      const groupsResult = await makeZoneweaverAPIRequest(
        server.hostname,
        server.port,
        server.protocol,
        "system/groups",
        "GET",
        null,
        { include_system: false, limit: 100 }
      );

      if (groupsResult.success) {
        setAvailableGroups(groupsResult.data?.groups || []);
      }

      // Load current user attributes to populate form
      const userResult = await makeZoneweaverAPIRequest(
        server.hostname,
        server.port,
        server.protocol,
        `system/users/${encodeURIComponent(user.username)}/attributes`,
        "GET"
      );

      if (userResult.success && userResult.data) {
        setFormData((prev) => ({
          ...prev,
          new_groups: userResult.data.groups || [],
          new_authorizations: userResult.data.authorizations || [],
          new_profiles: userResult.data.profiles || [],
        }));
      }
    } catch (err) {
      console.error("Error loading edit options:", err);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleArrayInputChange = (field, value) => {
    const items = value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
    setFormData((prev) => ({
      ...prev,
      [field]: items,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);
      onError("");

      // Build payload with only changed fields
      const payload = {};
      
      if (formData.new_comment !== user.comment) {
        payload.new_comment = formData.new_comment.trim() || undefined;
      }
      
      if (formData.new_shell !== user.shell) {
        payload.new_shell = formData.new_shell;
      }
      
      // Always include arrays if they have values
      if (formData.new_groups.length > 0) {
        payload.new_groups = formData.new_groups;
      }
      
      if (formData.new_authorizations.length > 0) {
        payload.new_authorizations = formData.new_authorizations;
      }
      
      if (formData.new_profiles.length > 0) {
        payload.new_profiles = formData.new_profiles;
      }

      // Only proceed if we have changes to make
      if (Object.keys(payload).length === 0) {
        onError("No changes detected");
        return;
      }

      const result = await makeZoneweaverAPIRequest(
        server.hostname,
        server.port,
        server.protocol,
        `system/users/${encodeURIComponent(user.username)}`,
        "PUT",
        payload
      );

      if (result.success) {
        // Poll task if task_id is returned
        if (result.data?.task_id) {
          await pollTask(result.data.task_id);
        }
        onSuccess();
      } else {
        onError(result.message || "Failed to update user");
      }
    } catch (err) {
      onError(`Error updating user: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const pollTask = async (taskId) => {
    const maxPolls = 30;
    let polls = 0;

    while (polls < maxPolls) {
      try {
        const taskResult = await makeZoneweaverAPIRequest(
          server.hostname,
          server.port,
          server.protocol,
          `tasks/${taskId}`,
          "GET"
        );

        if (taskResult.success) {
          const status = taskResult.data?.status;
          if (status === "completed" || status === "failed") {
            if (status === "failed" && taskResult.data?.error_message) {
              onError(taskResult.data.error_message);
            }
            break;
          }
        }

        await new Promise((resolve) => setTimeout(resolve, 1000));
        polls++;
      } catch (err) {
        console.error("Error polling task:", err);
        break;
      }
    }
  };

  const shells = [
    "/bin/bash",
    "/bin/sh",
    "/bin/zsh",
    "/bin/ksh",
    "/bin/tcsh",
    "/bin/false",
  ];

  return (
    <FormModal
      isOpen={true}
      onClose={onClose}
      onSubmit={handleSubmit}
      title={`Edit User: ${user.username}`}
      icon="fas fa-user-edit"
      submitText="Update User"
      submitIcon="fas fa-save"
      loading={loading}
      showCancelButton={true}
      aria-label={`Edit user ${user.username}`}
    >
      <div className="field">
        <label className="label">Username</label>
        <div className="control">
          <input
            className="input"
            type="text"
            value={user.username}
            disabled
            readOnly
          />
        </div>
        <p className="help">Username cannot be changed</p>
      </div>

      <div className="field">
        <label className="label">Comment</label>
        <div className="control">
          <input
            className="input"
            type="text"
            value={formData.new_comment}
            onChange={(e) => handleInputChange("new_comment", e.target.value)}
            disabled={loading}
            placeholder="User description or full name"
          />
        </div>
      </div>

      <div className="field">
        <label className="label">Shell</label>
        <div className="control">
          <div className="select is-fullwidth">
            <select
              value={formData.new_shell}
              onChange={(e) => handleInputChange("new_shell", e.target.value)}
              disabled={loading}
            >
              {shells.map((shell) => (
                <option key={shell} value={shell}>
                  {shell}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <hr />

      <h5 className="title is-6">RBAC Configuration</h5>

      <div className="field">
        <label className="label">Secondary Groups</label>
        <div className="control">
          <input
            className="input"
            type="text"
            value={formData.new_groups.join(", ")}
            onChange={(e) =>
              handleArrayInputChange("new_groups", e.target.value)
            }
            disabled={loading}
            placeholder="staff, admin, developers (comma-separated)"
          />
        </div>
        <p className="help">
          Available groups:{" "}
          {availableGroups.map((g) => g.groupname).join(", ")}
        </p>
      </div>

      <div className="field">
        <label className="label">Authorizations</label>
        <div className="control">
          <textarea
            className="textarea"
            rows="2"
            value={formData.new_authorizations.join(", ")}
            onChange={(e) =>
              handleArrayInputChange("new_authorizations", e.target.value)
            }
            disabled={loading}
            placeholder="solaris.admin.usermgr.*, solaris.network.* (comma-separated)"
          />
        </div>
      </div>

      <div className="field">
        <label className="label">Profiles</label>
        <div className="control">
          <input
            className="input"
            type="text"
            value={formData.new_profiles.join(", ")}
            onChange={(e) =>
              handleArrayInputChange("new_profiles", e.target.value)
            }
            disabled={loading}
            placeholder="System Administrator, Network Management (comma-separated)"
          />
        </div>
      </div>

      <div className="notification is-info">
        <p>
          <strong>Note:</strong> Only fields that have been changed will be updated.
          User ID (UID) and primary group (GID) cannot be modified.
        </p>
      </div>
    </FormModal>
  );
};

export default UserEditModal;
