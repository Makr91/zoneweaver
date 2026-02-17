import PropTypes from "prop-types";
import { useState, useEffect } from "react";

import { useServers } from "../../contexts/ServerContext";

import BootEnvironmentTable from "./BootEnvironmentTable";
import ConfirmActionModal from "./ConfirmActionModal";
import CreateBEModal from "./CreateBEModal";

const BootEnvironmentManagement = ({ server }) => {
  const [bootEnvironments, setBootEnvironments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedBE, setSelectedBE] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showActionModal, setShowActionModal] = useState(false);
  const [actionType, setActionType] = useState("");
  const [filters, setFilters] = useState({
    name: "",
    status: "",
    showDetailed: false,
    showSnapshots: false,
  });

  const { makeZoneweaverAPIRequest } = useServers();

  // Load boot environments on component mount and when filters change
  useEffect(() => {
    loadBootEnvironments();
  }, [server, filters.showDetailed, filters.showSnapshots]);

  const loadBootEnvironments = async () => {
    if (!server || !makeZoneweaverAPIRequest) {
      return;
    }

    try {
      setLoading(true);
      setError("");

      const params = {};
      if (filters.showDetailed) {
        params.detailed = true;
      }
      if (filters.showSnapshots) {
        params.snapshots = true;
      }
      if (filters.name) {
        params.name = filters.name;
      }

      const result = await makeZoneweaverAPIRequest(
        server.hostname,
        server.port,
        server.protocol,
        "system/boot-environments",
        "GET",
        null,
        params
      );

      if (result.success) {
        const beList = result.data?.boot_environments || [];
        // Filter by status on client side
        const filteredBEs = beList.filter((be) => {
          if (filters.status) {
            if (filters.status === "active" && !be.is_active_now) {
              return false;
            }
            if (filters.status === "reboot" && !be.is_active_on_reboot) {
              return false;
            }
            if (
              filters.status === "inactive" &&
              (be.is_active_now || be.is_active_on_reboot)
            ) {
              return false;
            }
          }
          return true;
        });
        setBootEnvironments(filteredBEs);
      } else {
        setError(result.message || "Failed to load boot environments");
        setBootEnvironments([]);
      }
    } catch (err) {
      setError(`Error loading boot environments: ${err.message}`);
      setBootEnvironments([]);
    } finally {
      setLoading(false);
    }
  };

  const handleBEAction = async (beName, action, options = {}) => {
    if (!server || !makeZoneweaverAPIRequest) {
      return;
    }

    try {
      setLoading(true);
      setError("");

      let endpoint;
      let method;
      let requestData;

      switch (action) {
        case "activate":
          endpoint = `system/boot-environments/${encodeURIComponent(beName)}/activate`;
          method = "POST";
          requestData = {
            temporary: options.temporary || false,
            created_by: "api",
          };
          break;
        case "mount":
          endpoint = `system/boot-environments/${encodeURIComponent(beName)}/mount`;
          method = "POST";
          requestData = {
            mountpoint: options.mountpoint || `/mnt/${beName}`,
            shared_mode: options.sharedMode || "ro",
            created_by: "api",
          };
          break;
        case "unmount":
          endpoint = `system/boot-environments/${encodeURIComponent(beName)}/unmount`;
          method = "POST";
          requestData = {
            force: options.force || false,
            created_by: "api",
          };
          break;
        case "delete":
          endpoint = `system/boot-environments/${encodeURIComponent(beName)}`;
          method = "DELETE";
          requestData = null;
          // Use query parameters for delete
          const deleteParams = {};
          if (options.force) {
            deleteParams.force = true;
          }
          if (options.snapshots) {
            deleteParams.snapshots = true;
          }

          const result = await makeZoneweaverAPIRequest(
            server.hostname,
            server.port,
            server.protocol,
            endpoint,
            method,
            requestData,
            deleteParams
          );

          if (result.success) {
            await loadBootEnvironments();
            return { success: true, data: result.data };
          }
          setError(result.message || `Failed to ${action} boot environment`);
          return { success: false, message: result.message };

        default:
          throw new Error(`Unknown action: ${action}`);
      }

      const result = await makeZoneweaverAPIRequest(
        server.hostname,
        server.port,
        server.protocol,
        endpoint,
        method,
        requestData
      );

      if (result.success) {
        // Refresh BE list after action
        await loadBootEnvironments();
        return { success: true, data: result.data };
      }
      setError(result.message || `Failed to ${action} boot environment`);
      return { success: false, message: result.message };
    } catch (err) {
      const errorMsg = `Error during boot environment ${action}: ${err.message}`;
      setError(errorMsg);
      return { success: false, message: errorMsg };
    } finally {
      setLoading(false);
    }
  };

  const handleShowActionModal = (be, action) => {
    setSelectedBE(be);
    setActionType(action);
    setShowActionModal(true);
  };

  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const clearFilters = () => {
    setFilters({
      name: "",
      status: "",
      showDetailed: false,
      showSnapshots: false,
    });
  };

  if (!server || !makeZoneweaverAPIRequest) {
    return (
      <div className="notification is-info">
        <p>Please select a server to manage boot environments.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4">
        <h2 className="title is-5">Boot Environment Management</h2>
        <p className="content">
          Manage boot environments on <strong>{server.hostname}</strong>.
          Create, activate, mount, and delete boot environments.
        </p>
      </div>

      {/* Error Display */}
      {error && (
        <div className="notification is-danger mb-4">
          <button className="delete" onClick={() => setError("")} />
          <p>{error}</p>
        </div>
      )}

      {/* Boot Environment Filters */}
      <div className="box mb-4">
        <div className="columns">
          <div className="column">
            <div className="field">
              <label htmlFor="be-filter-name" className="label">
                Filter by Name
              </label>
              <div className="control">
                <input
                  id="be-filter-name"
                  className="input"
                  type="text"
                  placeholder="Enter boot environment name..."
                  value={filters.name}
                  onChange={(e) => handleFilterChange("name", e.target.value)}
                />
              </div>
            </div>
          </div>
          <div className="column">
            <div className="field">
              <label htmlFor="be-filter-status" className="label">
                Filter by Status
              </label>
              <div className="control">
                <div className="select is-fullwidth">
                  <select
                    id="be-filter-status"
                    value={filters.status}
                    onChange={(e) =>
                      handleFilterChange("status", e.target.value)
                    }
                  >
                    <option value="">All Status</option>
                    <option value="active">Active Now</option>
                    <option value="reboot">Active on Reboot</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
          <div className="column is-narrow">
            <div className="field">
              <span className="label">Show Detailed</span>
              <div className="control">
                <label className="switch is-medium">
                  <input
                    type="checkbox"
                    checked={filters.showDetailed}
                    onChange={(e) =>
                      handleFilterChange("showDetailed", e.target.checked)
                    }
                  />
                  <span className="check" />
                  <span className="control-label">Details</span>
                </label>
              </div>
            </div>
          </div>
          <div className="column is-narrow">
            <div className="field">
              <span className="label">Show Snapshots</span>
              <div className="control">
                <label className="switch is-medium">
                  <input
                    type="checkbox"
                    checked={filters.showSnapshots}
                    onChange={(e) =>
                      handleFilterChange("showSnapshots", e.target.checked)
                    }
                  />
                  <span className="check" />
                  <span className="control-label">Snapshots</span>
                </label>
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
                  onClick={loadBootEnvironments}
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

      {/* Boot Environments Table */}
      <div className="box">
        <div className="level is-mobile mb-4">
          <div className="level-left">
            <h3 className="title is-6">
              Boot Environments ({bootEnvironments.length})
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
              <span>Create Boot Environment</span>
            </button>
          </div>
        </div>

        <BootEnvironmentTable
          bootEnvironments={bootEnvironments}
          loading={loading}
          onActivate={(be) => handleShowActionModal(be, "activate")}
          onMount={(be) => handleShowActionModal(be, "mount")}
          onUnmount={(be) => handleShowActionModal(be, "unmount")}
          onDelete={(be) => handleShowActionModal(be, "delete")}
        />
      </div>

      {/* Create Boot Environment Modal */}
      {showCreateModal && (
        <CreateBEModal
          server={server}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            loadBootEnvironments();
          }}
          onError={setError}
        />
      )}

      {/* Confirm Action Modal */}
      {showActionModal && selectedBE && (
        <ConfirmActionModal
          bootEnvironment={selectedBE}
          action={actionType}
          onClose={() => {
            setShowActionModal(false);
            setSelectedBE(null);
          }}
          onConfirm={handleBEAction}
        />
      )}
    </div>
  );
};

BootEnvironmentManagement.propTypes = {
  server: PropTypes.object.isRequired,
};

export default BootEnvironmentManagement;
