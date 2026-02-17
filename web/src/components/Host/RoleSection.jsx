import { useState, useEffect } from "react";

import { useServers } from "../../contexts/ServerContext";
import { useDebounce } from "../../utils/debounce";

import RoleCreateModal from "./RoleCreateModal";
import RoleDetailsModal from "./RoleDetailsModal";
import RoleTable from "./RoleTable";

const RoleSection = ({ server, onError }) => {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filters, setFilters] = useState({
    pattern: "",
    limit: 50,
  });

  const { makeZoneweaverAPIRequest } = useServers();

  // Debounce the pattern filter to avoid excessive API calls
  const debouncedPattern = useDebounce(filters.pattern, 500);

  // Load roles on component mount and when filters change
  useEffect(() => {
    loadRoles();
  }, [server, debouncedPattern, filters.limit]);

  const loadRoles = async () => {
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
  };

  const handleRoleAction = async (rolename, action, options = {}) => {
    if (!server || !makeZoneweaverAPIRequest) {
      return;
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
          await pollTask(result.data.task_id);
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
              <label className="label">Filter by Role Name</label>
              <div className="control">
                <input
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
              <label className="label">Limit Results</label>
              <div className="control">
                <div className="select">
                  <select
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
              <label className="label">&nbsp;</label>
              <div className="control">
                <button
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
              <label className="label">&nbsp;</label>
              <div className="control">
                <button
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
          onDelete={(role) => {
            if (
              window.confirm(
                `Are you sure you want to delete role "${role.rolename}"?\n\nThis will also remove any home directory if one exists.`
              )
            ) {
              handleRoleAction(role.rolename, "delete", {
                removeHome: true,
              });
            }
          }}
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
    </div>
  );
};

export default RoleSection;
