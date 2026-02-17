import PropTypes from "prop-types";
import { useState, useEffect, useCallback } from "react";

import { useServers } from "../../contexts/ServerContext";
import { useDebounce } from "../../utils/debounce";
import { ConfirmModal } from "../common";

import RoleCreateModal from "./RoleCreateModal";
import RoleDetailsModal from "./RoleDetailsModal";
import RoleTable from "./RoleTable";

const RoleSection = ({ server, onError }) => {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState(null);
  const [filters, setFilters] = useState({
    pattern: "",
    limit: 50,
  });

  const { makeZoneweaverAPIRequest } = useServers();

  // Debounce the pattern filter to avoid excessive API calls
  const debouncedPattern = useDebounce(filters.pattern, 500);

  const loadRoles = useCallback(async () => {
    if (!server || !makeZoneweaverAPIRequest) {
      return;
    }

    try {
      setLoading(true);
      onError("");

      const params = {};
      if (debouncedPattern) {
        params.rolename = debouncedPattern;
      }
      if (filters.limit) {
        params.limit = filters.limit;
      }

      const result = await makeZoneweaverAPIRequest(
        server.hostname,
        server.port,
        server.protocol,
        "system/roles",
        "GET",
        null,
        params
      );

      if (result.success) {
        setRoles(result.data?.roles || []);
      } else {
        onError(result.message || "Failed to load roles");
        setRoles([]);
      }
    } catch (err) {
      onError(`Error loading roles: ${err.message}`);
      setRoles([]);
    } finally {
      setLoading(false);
    }
  }, [
    server,
    makeZoneweaverAPIRequest,
    debouncedPattern,
    filters.limit,
    onError,
  ]);

  const pollTask = useCallback(
    (taskId) => {
      const checkTaskStatus = async (pollCount) => {
        const maxPolls = 30;

        if (pollCount >= maxPolls) {
          return;
        }

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
              return;
            }
          }

          // Schedule next poll after delay
          setTimeout(() => {
            void checkTaskStatus(pollCount + 1);
          }, 1000);
        } catch (err) {
          console.error("Error polling task:", err);
        }
      };

      void checkTaskStatus(0);
    },
    [server, makeZoneweaverAPIRequest, onError]
  );

  // Load roles on component mount and when filters change
  useEffect(() => {
    loadRoles();
  }, [loadRoles]);

  const handleRoleAction = async (rolename, action, options = {}) => {
    if (!server || !makeZoneweaverAPIRequest) {
      return { success: false, message: "Server not available" };
    }

    try {
      setLoading(true);
      onError("");

      let endpoint;
      let method;
      const params = {};

      if (action === "delete") {
        endpoint = `system/roles/${encodeURIComponent(rolename)}`;
        method = "DELETE";
        if (options.removeHome !== undefined) {
          params.remove_home = options.removeHome;
        }
      }

      const result = await makeZoneweaverAPIRequest(
        server.hostname,
        server.port,
        server.protocol,
        endpoint,
        method,
        null,
        params
      );

      if (result.success) {
        // Poll task if task_id is returned
        if (result.data?.task_id) {
          pollTask(result.data.task_id);
        }
        await loadRoles();
        return { success: true, message: result.message };
      }
      onError(result.message || `Failed to ${action} role`);
      return { success: false, message: result.message };
    } catch (err) {
      const errorMsg = `Error performing ${action}: ${err.message}`;
      onError(errorMsg);
      return { success: false, message: errorMsg };
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRole = (role) => {
    setRoleToDelete(role);
  };

  const handleConfirmDelete = async () => {
    if (roleToDelete) {
      await handleRoleAction(roleToDelete.rolename, "delete", {
        removeHome: true,
      });
      setRoleToDelete(null);
    }
  };

  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const clearFilters = () => {
    setFilters({
      pattern: "",
      limit: 50,
    });
  };

  return (
    <div>
      <div className="mb-4">
        <h2 className="title is-5">Role Management</h2>
        <p className="content">
          Manage RBAC roles on <strong>{server.hostname}</strong>. Create,
          modify, and delete roles, and manage role authorizations and profiles.
        </p>
      </div>

      {/* Role Filters */}
      <div className="box mb-4">
        <div className="columns">
          <div className="column">
            <div className="field">
              <label className="label" htmlFor="filter-pattern">
                Filter by Role Name
              </label>
              <div className="control">
                <input
                  id="filter-pattern"
                  className="input"
                  type="text"
                  placeholder="Enter role name pattern..."
                  value={filters.pattern}
                  onChange={(e) =>
                    handleFilterChange("pattern", e.target.value)
                  }
                />
              </div>
            </div>
          </div>
          <div className="column is-narrow">
            <div className="field">
              <label className="label" htmlFor="filter-limit">
                Limit Results
              </label>
              <div className="control">
                <div className="select">
                  <select
                    id="filter-limit"
                    value={filters.limit}
                    onChange={(e) =>
                      handleFilterChange("limit", parseInt(e.target.value))
                    }
                  >
                    <option value={25}>25 Roles</option>
                    <option value={50}>50 Roles</option>
                    <option value={100}>100 Roles</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
          <div className="column is-narrow">
            <div className="field">
              <label className="label" htmlFor="refresh-button">
                Refresh
              </label>
              <div className="control">
                <button
                  id="refresh-button"
                  className="button is-info"
                  onClick={loadRoles}
                  disabled={loading}
                >
                  <span className="icon">
                    <i className="fas fa-sync-alt" />
                  </span>
                  <span>Refresh</span>
                </button>
              </div>
            </div>
          </div>
          <div className="column is-narrow">
            <div className="field">
              <label className="label" htmlFor="clear-button">
                Clear
              </label>
              <div className="control">
                <button
                  id="clear-button"
                  className="button"
                  onClick={clearFilters}
                  disabled={loading}
                >
                  <span className="icon">
                    <i className="fas fa-times" />
                  </span>
                  <span>Clear</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Roles Table */}
      <div className="box">
        <div className="level is-mobile mb-4">
          <div className="level-left">
            <h3 className="title is-6">
              Roles ({roles.length})
              {loading && (
                <span className="ml-2">
                  <i className="fas fa-spinner fa-spin" />
                </span>
              )}
            </h3>
          </div>
          <div className="level-right">
            <button
              className="button is-primary"
              onClick={() => setShowCreateModal(true)}
              disabled={loading}
            >
              <span className="icon">
                <i className="fas fa-plus" />
              </span>
              <span>Create Role</span>
            </button>
          </div>
        </div>

        <RoleTable
          roles={roles}
          loading={loading}
          onDelete={handleDeleteRole}
          onViewDetails={(role) => {
            setSelectedRole(role);
            setShowDetailsModal(true);
          }}
        />
      </div>

      {/* Role Details Modal */}
      {showDetailsModal && selectedRole && (
        <RoleDetailsModal
          role={selectedRole}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedRole(null);
          }}
        />
      )}

      {/* Role Create Modal */}
      {showCreateModal && (
        <RoleCreateModal
          server={server}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            loadRoles();
          }}
          onError={onError}
        />
      )}

      {/* Delete Confirmation Modal */}
      {roleToDelete && (
        <ConfirmModal
          isOpen={!!roleToDelete}
          onClose={() => setRoleToDelete(null)}
          onConfirm={handleConfirmDelete}
          title="Delete Role"
          message={`Are you sure you want to delete role "${roleToDelete.rolename}"?\n\nThis will also remove any home directory if one exists.`}
          confirmText="Delete"
          confirmVariant="is-danger"
          loading={loading}
        />
      )}
    </div>
  );
};

RoleSection.propTypes = {
  server: PropTypes.object.isRequired,
  onError: PropTypes.func.isRequired,
};

export default RoleSection;
