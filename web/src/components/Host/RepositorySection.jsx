import PropTypes from "prop-types";
import { useState, useEffect, useCallback } from "react";

import { useServers } from "../../contexts/ServerContext";
import { ConfirmModal } from "../common";

import AddRepositoryModal from "./AddRepositoryModal";
import EditRepositoryModal from "./EditRepositoryModal";
import RepositoryTable from "./RepositoryTable";

const RepositorySection = ({ server, onError }) => {
  const [repositories, setRepositories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedRepository, setSelectedRepository] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [repoToDelete, setRepoToDelete] = useState(null);
  const [filters, setFilters] = useState({
    publisher: "",
    enabledOnly: false,
    type: "",
  });

  const { makeZoneweaverAPIRequest } = useServers();

  const loadRepositories = useCallback(async () => {
    if (!server || !makeZoneweaverAPIRequest) {
      return;
    }

    try {
      setLoading(true);
      onError("");

      const params = {};
      if (filters.enabledOnly) {
        params.enabled_only = true;
      }
      if (filters.publisher) {
        params.publisher = filters.publisher;
      }

      const result = await makeZoneweaverAPIRequest(
        server.hostname,
        server.port,
        server.protocol,
        "system/repositories",
        "GET",
        null,
        params
      );

      if (result.success) {
        const repoList = result.data?.publishers || [];
        // Filter by type on client side
        const filteredRepos = repoList.filter((repo) => {
          if (filters.type && repo.type !== filters.type) {
            return false;
          }
          return true;
        });
        setRepositories(filteredRepos);
      } else {
        onError(result.message || "Failed to load repositories");
        setRepositories([]);
      }
    } catch (err) {
      onError(`Error loading repositories: ${err.message}`);
      setRepositories([]);
    } finally {
      setLoading(false);
    }
  }, [
    server,
    makeZoneweaverAPIRequest,
    onError,
    filters.enabledOnly,
    filters.publisher,
    filters.type,
  ]);

  // Load repositories on component mount and when filters change
  useEffect(() => {
    loadRepositories();
  }, [loadRepositories]);

  const handleToggleRepository = async (publisherName, enable) => {
    if (!server || !makeZoneweaverAPIRequest) {
      return;
    }

    try {
      setLoading(true);
      onError("");

      const action = enable ? "enable" : "disable";
      const result = await makeZoneweaverAPIRequest(
        server.hostname,
        server.port,
        server.protocol,
        `system/repositories/${encodeURIComponent(publisherName)}/${action}`,
        "POST",
        { created_by: "api" }
      );

      if (result.success) {
        // Refresh repositories list after action
        await loadRepositories();
      } else {
        onError(result.message || `Failed to ${action} repository`);
      }
    } catch (err) {
      onError(
        `Error ${enable ? "enabling" : "disabling"} repository: ${err.message}`
      );
    } finally {
      setLoading(false);
    }
  };

  const performDeleteRepository = async (publisherName) => {
    try {
      setLoading(true);
      onError("");

      const result = await makeZoneweaverAPIRequest(
        server.hostname,
        server.port,
        server.protocol,
        `system/repositories/${encodeURIComponent(publisherName)}`,
        "DELETE"
      );

      if (result.success) {
        // Refresh repositories list after deletion
        await loadRepositories();
      } else {
        onError(
          result.message || `Failed to delete repository "${publisherName}"`
        );
      }
    } catch (err) {
      onError(`Error deleting repository "${publisherName}": ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRepository = (publisherName) => {
    setRepoToDelete(publisherName);
  };

  const handleConfirmDelete = async () => {
    if (repoToDelete) {
      await performDeleteRepository(repoToDelete);
      setRepoToDelete(null);
    }
  };

  const handleEditRepository = (repo) => {
    setSelectedRepository(repo);
    setShowEditModal(true);
  };

  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const clearFilters = () => {
    setFilters({
      publisher: "",
      enabledOnly: false,
      type: "",
    });
  };

  // Group repositories by publisher name for display
  const groupedRepositories = repositories.reduce((acc, repo) => {
    if (!acc[repo.name]) {
      acc[repo.name] = [];
    }
    acc[repo.name].push(repo);
    return acc;
  }, {});

  const repositoryGroups = Object.entries(groupedRepositories).map(
    ([name, repos]) => ({
      name,
      repositories: repos,
      enabled: repos.some((r) => r.enabled !== false),
      origins: repos.filter((r) => r.type === "origin"),
      mirrors: repos.filter((r) => r.type === "mirror"),
    })
  );

  return (
    <div>
      <div className="mb-4">
        <h2 className="title is-5">Repository Management</h2>
        <p className="content">
          Manage package repositories (publishers) on{" "}
          <strong>{server.hostname}</strong>. Add, remove, enable, and disable
          package repositories.
        </p>
      </div>

      {/* Repository Filters */}
      <div className="box mb-4">
        <div className="columns">
          <div className="column">
            <div className="field">
              <label className="label" htmlFor="publisher-filter">
                Filter by Publisher
              </label>

              <div className="control">
                <input
                  id="publisher-filter"
                  className="input"
                  type="text"
                  placeholder="Enter publisher name..."
                  value={filters.publisher}
                  onChange={(e) =>
                    handleFilterChange("publisher", e.target.value)
                  }
                />
              </div>
            </div>
          </div>
          <div className="column">
            <div className="field">
              <label className="label" htmlFor="type-filter">
                Filter by Type
              </label>

              <div className="control">
                <div className="select is-fullwidth">
                  <select
                    id="type-filter"
                    value={filters.type}
                    onChange={(e) => handleFilterChange("type", e.target.value)}
                  >
                    <option value="">All Types</option>
                    <option value="origin">Origin</option>
                    <option value="mirror">Mirror</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
          <div className="column is-narrow">
            <div className="field">
              <label className="label" htmlFor="enabled-only-filter">
                Enabled Only
              </label>

              <div className="control">
                <label className="switch is-medium">
                  <input
                    id="enabled-only-filter"
                    type="checkbox"
                    checked={filters.enabledOnly}
                    onChange={(e) =>
                      handleFilterChange("enabledOnly", e.target.checked)
                    }
                  />
                  <span className="check" />
                  <span className="control-label">Enabled</span>
                </label>
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
                  className="button is-info"
                  onClick={loadRepositories}
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

      {/* Repositories Table */}
      <div className="box">
        <div className="level is-mobile mb-4">
          <div className="level-left">
            <h3 className="title is-6">
              Repositories ({repositories.length})
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
              onClick={() => setShowAddModal(true)}
              disabled={loading}
            >
              <span className="icon">
                <i className="fas fa-plus" />
              </span>
              <span>Add Repository</span>
            </button>
          </div>
        </div>

        <RepositoryTable
          repositories={repositories}
          repositoryGroups={repositoryGroups}
          loading={loading}
          onToggle={handleToggleRepository}
          onEdit={handleEditRepository}
          onDelete={handleDeleteRepository}
        />
      </div>

      {/* Add Repository Modal */}
      {showAddModal && (
        <AddRepositoryModal
          server={server}
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false);
            loadRepositories();
          }}
          onError={onError}
        />
      )}

      {/* Edit Repository Modal */}
      {showEditModal && selectedRepository && (
        <EditRepositoryModal
          server={server}
          repository={selectedRepository}
          onClose={() => {
            setShowEditModal(false);
            setSelectedRepository(null);
          }}
          onSuccess={() => {
            setShowEditModal(false);
            setSelectedRepository(null);
            loadRepositories();
          }}
          onError={onError}
        />
      )}

      {/* Delete Confirmation Modal */}
      {repoToDelete && (
        <ConfirmModal
          isOpen={!!repoToDelete}
          onClose={() => setRepoToDelete(null)}
          onConfirm={handleConfirmDelete}
          title="Delete Repository"
          message={`Are you sure you want to delete repository "${repoToDelete}"?`}
          confirmText="Delete"
          confirmVariant="is-danger"
          loading={loading}
        />
      )}
    </div>
  );
};

RepositorySection.propTypes = {
  server: PropTypes.object.isRequired,
  onError: PropTypes.func.isRequired,
};

export default RepositorySection;
