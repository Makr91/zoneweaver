import React, { useState } from "react";

import { useServers } from "../../contexts/ServerContext";
import FormModal from "../common/FormModal";

const RoleCreateModal = ({ server, onClose, onSuccess, onError }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    rolename: "",
    comment: "",
    shell: "/bin/pfsh",
    authorizations: [],
    profiles: [],
    create_home: false,
  });

  const { makeZoneweaverAPIRequest } = useServers();

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

    if (!formData.rolename.trim()) {
      onError("Role name is required");
      return;
    }

    try {
      setLoading(true);
      onError("");

      const payload = {
        rolename: formData.rolename.trim(),
        comment: formData.comment.trim() || "RBAC Role",
        shell: formData.shell || "/bin/pfsh",
        create_home: formData.create_home,
      };

      if (formData.authorizations.length > 0) {
        payload.authorizations = formData.authorizations;
      }

      if (formData.profiles.length > 0) {
        payload.profiles = formData.profiles;
      }

      const result = await makeZoneweaverAPIRequest(
        server.hostname,
        server.port,
        server.protocol,
        "system/roles",
        "POST",
        payload
      );

      if (result.success) {
        // Poll task if task_id is returned
        if (result.data?.task_id) {
          await pollTask(result.data.task_id);
        }
        onSuccess();
      } else {
        onError(result.message || "Failed to create role");
      }
    } catch (err) {
      onError(`Error creating role: ${err.message}`);
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
    "/bin/pfsh",
    "/bin/bash",
    "/bin/sh",
    "/bin/zsh",
    "/bin/ksh",
  ];

  return (
    <FormModal
      isOpen={true}
      onClose={onClose}
      onSubmit={handleSubmit}
      title="Create Role"
      icon="fas fa-user-shield-plus"
      submitText="Create Role"
      submitIcon="fas fa-plus"
      loading={loading}
      showCancelButton={true}
      aria-label="Create new RBAC role"
    >
      <div className="field">
        <label className="label">
          Role Name <span className="has-text-danger">*</span>
        </label>
        <div className="control">
          <input
            className="input"
            type="text"
            value={formData.rolename}
            onChange={(e) =>
              handleInputChange("rolename", e.target.value)
            }
            required
            disabled={loading}
            placeholder="Enter role name"
          />
        </div>
        <p className="help">
          Role name must be unique and contain only valid characters
        </p>
      </div>

      <div className="field">
        <label className="label">Comment</label>
        <div className="control">
          <input
            className="input"
            type="text"
            value={formData.comment}
            onChange={(e) => handleInputChange("comment", e.target.value)}
            disabled={loading}
            placeholder="Role description"
          />
        </div>
      </div>

      <div className="field">
        <label className="label">Shell</label>
        <div className="control">
          <div className="select is-fullwidth">
            <select
              value={formData.shell}
              onChange={(e) => handleInputChange("shell", e.target.value)}
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
        <p className="help">
          Profile shell (pfsh) is recommended for RBAC roles
        </p>
      </div>

      <hr />

      <h5 className="title is-6">RBAC Configuration</h5>

      <div className="field">
        <label className="label">Authorizations</label>
        <div className="control">
          <textarea
            className="textarea"
            rows="3"
            value={formData.authorizations.join(", ")}
            onChange={(e) =>
              handleArrayInputChange("authorizations", e.target.value)
            }
            disabled={loading}
            placeholder="solaris.admin.dcmgr.*, solaris.smf.read (comma-separated)"
          />
        </div>
        <p className="help">
          Enter authorizations separated by commas. Use * for wildcards.
        </p>
      </div>

      <div className="field">
        <label className="label">Profiles</label>
        <div className="control">
          <input
            className="input"
            type="text"
            value={formData.profiles.join(", ")}
            onChange={(e) =>
              handleArrayInputChange("profiles", e.target.value)
            }
            disabled={loading}
            placeholder="Media Backup, File System Management (comma-separated)"
          />
        </div>
        <p className="help">
          Enter profile names separated by commas
        </p>
      </div>

      <hr />

      <div className="field">
        <div className="control">
          <label className="switch">
            <input
              type="checkbox"
              checked={formData.create_home}
              onChange={(e) =>
                handleInputChange("create_home", e.target.checked)
              }
              disabled={loading}
            />
            <span className="check" />
            <span className="control-label">Create Home Directory</span>
          </label>
        </div>
        <p className="help">
          Usually not needed for roles unless they require file storage
        </p>
      </div>

      <div className="notification is-info">
        <p>
          <strong>Note:</strong> Roles are special user accounts used for RBAC.
          Users can assume roles to gain additional privileges without needing
          direct assignment of authorizations.
        </p>
      </div>
    </FormModal>
  );
};

export default RoleCreateModal;
