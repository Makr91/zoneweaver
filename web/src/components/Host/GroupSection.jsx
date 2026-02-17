import PropTypes from "prop-types";
import { useState, useEffect, useCallback } from "react";

import { useServers } from "../../contexts/ServerContext";
import { useDebounce } from "../../utils/debounce";

import GroupCreateModal from "./GroupCreateModal";
import GroupDetailsModal from "./GroupDetailsModal";
import GroupTable from "./GroupTable";

const GroupSection = ({ server, onError }) => {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [groupToDelete, setGroupToDelete] = useState(null);
  const [filters, setFilters] = useState({
    pattern: "",
    includeSystem: false,
    limit: 50,
  });

  const { makeZoneweaverAPIRequest } = useServers();

  // Debounce the pattern filter to avoid excessive API calls
  const debouncedPattern = useDebounce(filters.pattern, 500);

  const loadGroups = useCallback(async () => {
    if (!server || !makeZoneweaverAPIRequest) {
      return;
    }

    try {
      setLoading(true);
      onError("");

      const params = {};
      if (debouncedPattern) {
        params.groupname = debouncedPattern;
      }
      if (filters.includeSystem) {
        params.include_system = true;
      }
      if (filters.limit) {
        params.limit = filters.limit;
      }

      const result = await makeZoneweaverAPIRequest(
        server.hostname,
        server.port,
        server.protocol,
        "system/groups",
        "GET",
        null,
        params
      );

      if (result.success) {
        setGroups(result.data?.groups || []);
      } else {
        onError(result.message || "Failed to load groups");
        setGroups([]);
      }
    } catch (err) {
      onError(`Error loading groups: ${err.message}`);
      setGroups([]);
    } finally {
      setLoading(false);
    }
  }, [
    server,
    makeZoneweaverAPIRequest,
    debouncedPattern,
    filters.includeSystem,
    filters.limit,
    onError,
  ]);

  // Load groups on component mount and when filters change
  useEffect(() => {
    loadGroups();
  }, [loadGroups]);

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

  const handleGroupAction = async (groupname, action) => {
    if (!server || !makeZoneweaverAPIRequest) {
      return;
    }

    try {
      setLoading(true);
      onError("");

      const result = await makeZoneweaverAPIRequest(
        server.hostname,
        server.port,
        server.protocol,
        `system/groups/${encodeURIComponent(groupname)}`,
        "DELETE"
      );

      if (result.success) {
        // Poll task if task_id is returned
        if (result.data?.task_id) {
          pollTask(result.data.task_id);
        }
        await loadGroups();
      } else {
        onError(result.message || `Failed to ${action} group`);
      }
    } catch (err) {
      onError(`Error performing ${action}: ${err.message}`);
    } finally {
      setLoading(false);
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
      includeSystem: false,
      limit: 50,
    });
  };

  const handleDeleteGroup = (group) => {
    setGroupToDelete(group);
    setShowDeleteConfirmModal(true);
  };

  const confirmDeleteGroup = () => {
    if (groupToDelete) {
      handleGroupAction(groupToDelete.groupname, "delete");
      setShowDeleteConfirmModal(false);
      setGroupToDelete(null);
    }
  };

  const cancelDeleteGroup = () => {
    setShowDeleteConfirmModal(false);
    setGroupToDelete(null);
  };

  return (
    <div>
      <div className="mb-4">
        <h2 className="title is-5">Group Management</h2>
        <p className="content">
          Manage system groups on <strong>{server.hostname}</strong>. Create,
          modify, and delete groups, and manage group memberships.
        </p>
      </div>

      {/* Group Filters */}
      <div className="box mb-4">
        <div className="columns">
          <div className="column">
            <div className="field">
              <label className="label" htmlFor="filter-group-name">
                Filter by Group Name
              </label>
              <div className="control">
                <input
                  id="filter-group-name"
                  className="input"
                  type="text"
                  placeholder="Enter group name pattern..."
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
              <label className="label" htmlFor="filter-include-system">
                Include System Groups
              </label>
              <div className="control">
                <label className="switch is-medium">
                  <input
                    id="filter-include-system"
                    type="checkbox"
                    checked={filters.includeSystem}
                    onChange={(e) =>
                      handleFilterChange("includeSystem", e.target.checked)
                    }
                  />
                  <span className="check" />
                  <span className="control-label">Show All</span>
                </label>
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
                    <option value={25}>25 Groups</option>
                    <option value={50}>50 Groups</option>
                    <option value={100}>100 Groups</option>
                    <option value={200}>200 Groups</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
          <div className="column is-narrow">
            <div className="field">
              <span className="label" aria-hidden="true">
                &nbsp;
              </span>
              <div className="control">
                <button
                  className="button is-info"
                  onClick={loadGroups}
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
              <span className="label" aria-hidden="true">
                &nbsp;
              </span>
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

      {/* Groups Table */}
      <div className="box">
        <div className="level is-mobile mb-4">
          <div className="level-left">
            <h3 className="title is-6">
              Groups ({groups.length})
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
              <span>Create Group</span>
            </button>
          </div>
        </div>

        <GroupTable
          groups={groups}
          loading={loading}
          onDelete={handleDeleteGroup}
          onViewDetails={(group) => {
            setSelectedGroup(group);
            setShowDetailsModal(true);
          }}
        />
      </div>

      {/* Group Details Modal */}
      {showDetailsModal && selectedGroup && (
        <GroupDetailsModal
          group={selectedGroup}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedGroup(null);
          }}
        />
      )}

      {/* Group Create Modal */}
      {showCreateModal && (
        <GroupCreateModal
          server={server}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            loadGroups();
          }}
          onError={onError}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirmModal && groupToDelete && (
        <div className="modal is-active">
          <button
            className="modal-background"
            onClick={cancelDeleteGroup}
            type="button"
            aria-label="Close modal"
          />
          <div className="modal-card">
            <header className="modal-card-head">
              <p className="modal-card-title">Confirm Delete</p>
              <button
                className="delete"
                aria-label="close"
                onClick={cancelDeleteGroup}
              />
            </header>
            <section className="modal-card-body">
              <p>
                Are you sure you want to delete group{" "}
                <strong>{groupToDelete.groupname}</strong>?
              </p>
              <p className="mt-3 has-text-danger">
                <span className="icon">
                  <i className="fas fa-exclamation-triangle" />
                </span>
                <span>This action cannot be undone.</span>
              </p>
            </section>
            <footer className="modal-card-foot">
              <button
                className="button is-danger"
                onClick={confirmDeleteGroup}
                disabled={loading}
              >
                Delete Group
              </button>
              <button className="button" onClick={cancelDeleteGroup}>
                Cancel
              </button>
            </footer>
          </div>
        </div>
      )}
    </div>
  );
};

GroupSection.propTypes = {
  server: PropTypes.shape({
    hostname: PropTypes.string.isRequired,
    port: PropTypes.number.isRequired,
    protocol: PropTypes.string.isRequired,
  }).isRequired,
  onError: PropTypes.func.isRequired,
};

export default GroupSection;
