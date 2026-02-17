import PropTypes from "prop-types";
import { useState, useEffect, useCallback } from "react";

import { useServers } from "../../contexts/ServerContext";
import FormModal from "../common/FormModal";

const UserCreateModal = ({ server, onClose, onSuccess, onError }) => {
  const [loading, setLoading] = useState(false);
  const [isAdvanced, setIsAdvanced] = useState(false);
  const [availableGroups, setAvailableGroups] = useState([]);
  const [availableRoles, setAvailableRoles] = useState([]);
  const [formData, setFormData] = useState({
    username: "",
    uid: "",
    comment: "",
    shell: "/bin/bash",
    groups: [],
    authorizations: [],
    profiles: [],
    roles: [],
    project: "",
    create_home: true,
    force_zfs: false,
    create_personal_group: true,
    created_by: "api_admin",
  });

  const { makeZoneweaverAPIRequest } = useServers();

  const loadAdvancedOptions = useCallback(async () => {
    if (!server || !makeZoneweaverAPIRequest) {
      return;
    }

    try {
      // Load available groups and roles for selection
      const [groupsResult, rolesResult] = await Promise.all([
        makeZoneweaverAPIRequest(
          server.hostname,
          server.port,
          server.protocol,
          "system/groups",
          "GET",
          null,
          { include_system: false, limit: 100 }
        ),
        makeZoneweaverAPIRequest(
          server.hostname,
          server.port,
          server.protocol,
          "system/roles",
          "GET",
          null,
          { limit: 50 }
        ),
      ]);

      if (groupsResult.success) {
        setAvailableGroups(groupsResult.data?.groups || []);
      }

      if (rolesResult.success) {
        setAvailableRoles(rolesResult.data?.roles || []);
      }
    } catch (err) {
      console.error("Error loading advanced options:", err);
    }
  }, [server, makeZoneweaverAPIRequest]);

  useEffect(() => {
    if (isAdvanced) {
      loadAdvancedOptions();
    }
  }, [isAdvanced, loadAdvancedOptions]);

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

  const pollTask = useCallback(
    async (taskId) => {
      const maxPolls = 30;
      let polls = 0;

      while (polls < maxPolls) {
        try {
          // eslint-disable-next-line no-await-in-loop
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

          // eslint-disable-next-line no-await-in-loop
          await new Promise((resolve) => {
            setTimeout(resolve, 1000);
          });
          polls++;
        } catch (err) {
          console.error("Error polling task:", err);
          break;
        }
      }
    },
    [server, makeZoneweaverAPIRequest, onError]
  );

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.username.trim()) {
      onError("Username is required");
      return;
    }

    try {
      setLoading(true);
      onError("");

      const payload = {
        username: formData.username.trim(),
        comment: formData.comment.trim() || undefined,
        shell: formData.shell || "/bin/bash",
        create_home: formData.create_home,
        create_personal_group: formData.create_personal_group,
      };

      // Add advanced options if in advanced mode
      if (isAdvanced) {
        if (formData.uid) {
          payload.uid = parseInt(formData.uid);
        }
        if (formData.groups.length > 0) {
          payload.groups = formData.groups;
        }
        if (formData.authorizations.length > 0) {
          payload.authorizations = formData.authorizations;
        }
        if (formData.profiles.length > 0) {
          payload.profiles = formData.profiles;
        }
        if (formData.roles.length > 0) {
          payload.roles = formData.roles;
        }
        if (formData.project.trim()) {
          payload.project = formData.project.trim();
        }
        if (formData.force_zfs) {
          payload.force_zfs = true;
        }
        if (formData.created_by.trim()) {
          payload.created_by = formData.created_by.trim();
        }
      }

      const result = await makeZoneweaverAPIRequest(
        server.hostname,
        server.port,
        server.protocol,
        "system/users",
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
        onError(result.message || "Failed to create user");
      }
    } catch (err) {
      onError(`Error creating user: ${err.message}`);
    } finally {
      setLoading(false);
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
      isOpen
      onClose={onClose}
      onSubmit={handleSubmit}
      title="Create User"
      icon="fas fa-user-plus"
      submitText="Create User"
      submitIcon="fas fa-plus"
      loading={loading}
      showCancelButton
      aria-label="Create new user account"
    >
      {/* Mode Toggle */}
      <div className="field">
        <div className="control">
          <label className="switch">
            <input
              type="checkbox"
              checked={isAdvanced}
              onChange={(e) => setIsAdvanced(e.target.checked)}
              disabled={loading}
            />
            <span className="check" />
            <span className="control-label">
              Advanced Mode (RBAC Configuration)
            </span>
          </label>
        </div>
      </div>

      <hr />

      {/* Basic Fields */}
      <div className="columns">
        <div className="column">
          <div className="field">
            <label className="label" htmlFor="user-create-username">
              Username <span className="has-text-danger">*</span>
            </label>
            <div className="control">
              <input
                id="user-create-username"
                className="input"
                type="text"
                value={formData.username}
                onChange={(e) => handleInputChange("username", e.target.value)}
                required
                disabled={loading}
                placeholder="Enter username"
              />
            </div>
          </div>
        </div>
        {isAdvanced && (
          <div className="column">
            <div className="field">
              <label className="label" htmlFor="user-create-uid">
                User ID (UID)
              </label>
              <div className="control">
                <input
                  id="user-create-uid"
                  className="input"
                  type="number"
                  value={formData.uid}
                  onChange={(e) => handleInputChange("uid", e.target.value)}
                  disabled={loading}
                  placeholder="Auto-assign if empty"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="field">
        <label className="label" htmlFor="user-create-comment">
          Comment
        </label>
        <div className="control">
          <input
            id="user-create-comment"
            className="input"
            type="text"
            value={formData.comment}
            onChange={(e) => handleInputChange("comment", e.target.value)}
            disabled={loading}
            placeholder="User description or full name"
          />
        </div>
      </div>

      <div className="field">
        <label className="label" htmlFor="user-create-shell">
          Shell
        </label>
        <div className="control">
          <div className="select is-fullwidth">
            <select
              id="user-create-shell"
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
      </div>

      {/* Advanced Fields */}
      {isAdvanced && (
        <>
          <hr />
          <h5 className="title is-6">RBAC Configuration</h5>

          <div className="field">
            <label className="label" htmlFor="user-create-groups">
              Groups
            </label>
            <div className="control">
              <input
                id="user-create-groups"
                className="input"
                type="text"
                value={formData.groups.join(", ")}
                onChange={(e) =>
                  handleArrayInputChange("groups", e.target.value)
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
            <label className="label" htmlFor="user-create-authorizations">
              Authorizations
            </label>
            <div className="control">
              <textarea
                id="user-create-authorizations"
                className="textarea"
                rows="2"
                value={formData.authorizations.join(", ")}
                onChange={(e) =>
                  handleArrayInputChange("authorizations", e.target.value)
                }
                disabled={loading}
                placeholder="solaris.admin.usermgr.*, solaris.network.* (comma-separated)"
              />
            </div>
          </div>

          <div className="field">
            <label className="label" htmlFor="user-create-profiles">
              Profiles
            </label>
            <div className="control">
              <input
                id="user-create-profiles"
                className="input"
                type="text"
                value={formData.profiles.join(", ")}
                onChange={(e) =>
                  handleArrayInputChange("profiles", e.target.value)
                }
                disabled={loading}
                placeholder="System Administrator, Network Management (comma-separated)"
              />
            </div>
          </div>

          <div className="field">
            <label className="label" htmlFor="user-create-roles">
              Roles
            </label>
            <div className="control">
              <input
                id="user-create-roles"
                className="input"
                type="text"
                value={formData.roles.join(", ")}
                onChange={(e) =>
                  handleArrayInputChange("roles", e.target.value)
                }
                disabled={loading}
                placeholder="admin_role, backup_role (comma-separated)"
              />
            </div>
            <p className="help">
              Available roles:{" "}
              {availableRoles.map((r) => r.rolename).join(", ")}
            </p>
          </div>

          <div className="field">
            <label className="label" htmlFor="user-create-project">
              Project
            </label>
            <div className="control">
              <input
                id="user-create-project"
                className="input"
                type="text"
                value={formData.project}
                onChange={(e) => handleInputChange("project", e.target.value)}
                disabled={loading}
                placeholder="admin_project"
              />
            </div>
          </div>

          <div className="field">
            <label className="label" htmlFor="user-create-created-by">
              Created By
            </label>
            <div className="control">
              <input
                id="user-create-created-by"
                className="input"
                type="text"
                value={formData.created_by}
                onChange={(e) =>
                  handleInputChange("created_by", e.target.value)
                }
                disabled={loading}
                placeholder="api_admin"
              />
            </div>
          </div>
        </>
      )}

      <hr />

      {/* Options */}
      <div className="field">
        <div className="control">
          <label className="switch">
            <input
              id="user-create-home"
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
      </div>

      <div className="field">
        <div className="control">
          <label className="switch">
            <input
              id="user-create-personal-group"
              type="checkbox"
              checked={formData.create_personal_group}
              onChange={(e) =>
                handleInputChange("create_personal_group", e.target.checked)
              }
              disabled={loading}
            />
            <span className="check" />
            <span className="control-label">Create Personal Group</span>
          </label>
        </div>
      </div>

      {isAdvanced && (
        <div className="field">
          <div className="control">
            <label className="switch">
              <input
                id="user-create-force-zfs"
                type="checkbox"
                checked={formData.force_zfs}
                onChange={(e) =>
                  handleInputChange("force_zfs", e.target.checked)
                }
                disabled={loading}
              />
              <span className="check" />
              <span className="control-label">Force ZFS Home Directory</span>
            </label>
          </div>
        </div>
      )}
    </FormModal>
  );
};

UserCreateModal.propTypes = {
  server: PropTypes.shape({
    hostname: PropTypes.string,
    port: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    protocol: PropTypes.string,
  }).isRequired,
  onClose: PropTypes.func.isRequired,
  onSuccess: PropTypes.func.isRequired,
  onError: PropTypes.func.isRequired,
};

export default UserCreateModal;
