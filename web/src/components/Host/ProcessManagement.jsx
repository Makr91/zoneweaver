import PropTypes from "prop-types";
import { useState, useEffect, useCallback } from "react";

import { useServers } from "../../contexts/ServerContext";
import { useDebounce } from "../../utils/debounce";

import ProcessActionModals from "./ProcessActionModals";
import ProcessDetailsModal from "./ProcessDetailsModal";
import ProcessTable from "./ProcessTable";

const ProcessManagement = ({ server }) => {
  const [processes, setProcesses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [availableZones, setAvailableZones] = useState([]);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [filters, setFilters] = useState({
    pattern: "",
    zone: "",
    user: "",
    detailed: true,
  });

  // Modal states
  const [selectedProcess, setSelectedProcess] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showKillModal, setShowKillModal] = useState(false);
  const [showSignalModal, setShowSignalModal] = useState(false);
  const [showBatchKillModal, setShowBatchKillModal] = useState(false);

  const { makeZoneweaverAPIRequest } = useServers();

  // Debounce the pattern filter to avoid excessive API calls
  const debouncedPattern = useDebounce(filters.pattern, 500);

  const loadZones = useCallback(async () => {
    if (!server || !makeZoneweaverAPIRequest) {
      return;
    }

    try {
      const result = await makeZoneweaverAPIRequest(
        server.hostname,
        server.port,
        server.protocol,
        "zones",
        "GET"
      );

      if (result.success && result.data?.zones) {
        const zones = result.data.zones
          .map((zone) => zone.name)
          .filter(Boolean);
        const uniqueZones = [...new Set(zones)].sort();
        setAvailableZones(["global", ...uniqueZones]);
      }
    } catch (err) {
      console.error("Error loading zones:", err);
    }
  }, [server, makeZoneweaverAPIRequest]);

  const loadProcesses = useCallback(async () => {
    if (!server || !makeZoneweaverAPIRequest) {
      return;
    }

    try {
      setLoading(true);
      setError("");

      const params = {};
      if (debouncedPattern) {
        params.command = debouncedPattern;
      }
      if (filters.zone) {
        params.zone = filters.zone;
      }
      if (filters.user) {
        params.user = filters.user;
      }
      if (filters.detailed) {
        params.detailed = true;
      }

      const result = await makeZoneweaverAPIRequest(
        server.hostname,
        server.port,
        server.protocol,
        "system/processes",
        "GET",
        null,
        params
      );

      if (result.success) {
        const processData = result.data || [];
        setProcesses(processData);

        // Extract unique users for filter dropdown
        const users = [
          ...new Set(processData.map((p) => p.username).filter(Boolean)),
        ].sort();
        setAvailableUsers(users);
      } else {
        setError(result.message || "Failed to load processes");
        setProcesses([]);
      }
    } catch (err) {
      setError(`Error loading processes: ${err.message}`);
      setProcesses([]);
    } finally {
      setLoading(false);
    }
  }, [
    server,
    makeZoneweaverAPIRequest,
    debouncedPattern,
    filters.zone,
    filters.user,
    filters.detailed,
  ]);

  // Load processes on component mount and when filters change
  useEffect(() => {
    loadProcesses();
    loadZones();
  }, [loadProcesses, loadZones]);

  const handleProcessAction = async (pid, action, options = {}) => {
    if (!server || !makeZoneweaverAPIRequest) {
      return { success: false, message: "Server not available" };
    }

    try {
      setLoading(true);
      setError("");

      let endpoint;
      let method;
      let body;

      if (action === "kill") {
        endpoint = `system/processes/${pid}/kill`;
        method = "POST";
        body = { force: options.force || false };
      } else if (action === "signal") {
        endpoint = `system/processes/${pid}/signal`;
        method = "POST";
        body = { signal: options.signal || "TERM" };
      }

      const result = await makeZoneweaverAPIRequest(
        server.hostname,
        server.port,
        server.protocol,
        endpoint,
        method,
        body
      );

      if (result.success) {
        // Refresh processes list after action
        await loadProcesses();
        return { success: true, message: result.message };
      }
      setError(result.message || `Failed to ${action} process`);
      return { success: false, message: result.message };
    } catch (err) {
      const errorMsg = `Error performing ${action}: ${err.message}`;
      setError(errorMsg);
      return { success: false, message: errorMsg };
    } finally {
      setLoading(false);
    }
  };

  const handleBatchKill = async (pattern, signal = "TERM", zone = "") => {
    if (!server || !makeZoneweaverAPIRequest) {
      return { success: false, message: "Server not available" };
    }

    try {
      setLoading(true);
      setError("");

      const body = { pattern, signal };
      if (zone) {
        body.zone = zone;
      }

      const result = await makeZoneweaverAPIRequest(
        server.hostname,
        server.port,
        server.protocol,
        "system/processes/batch-kill",
        "POST",
        body
      );

      if (result.success) {
        await loadProcesses();
        return {
          success: true, 
          message: result.message,
          killed: result.killed || [],
        };
      }
      setError(result.message || "Failed to perform batch kill");
      return { success: false, message: result.message }; 
    } catch (err) {
      const errorMsg = `Error performing batch kill: ${err.message}`;
      setError(errorMsg);
      return { success: false, message: errorMsg };
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = async (process) => {
    if (!server || !makeZoneweaverAPIRequest) {
      return;
    }

    try {
      setLoading(true);
      setError("");

      const result = await makeZoneweaverAPIRequest(
        server.hostname,
        server.port,
        server.protocol,
        `system/processes/${process.pid}`,
        "GET"
      );

      if (result.success) {
        setSelectedProcess({ ...process, details: result.data });
        setShowDetailsModal(true);
      } else {
        setError(result.message || "Failed to load process details");
      }
    } catch (err) {
      setError(`Error loading process details: ${err.message}`);
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
      zone: "",
      user: "",
      detailed: true,
    });
  };

  return (
    <div>
      {/* Process Filters */}
      <div className="box mb-4">
        <div className="columns">
          <div className="column">
            <div className="field">
              <label className="label" htmlFor="command-filter">
                Filter by Command
              </label>
              <div className="control">
                <input
                  id="command-filter"
                  className="input"
                  type="text"
                  placeholder="Enter command pattern..."
                  value={filters.pattern}
                  onChange={(e) =>
                    handleFilterChange("pattern", e.target.value)
                  }
                />
              </div>
            </div>
          </div>
          <div className="column">
            <div className="field">
              <label className="label" htmlFor="zone-filter">
                Filter by Zone
              </label>
              <div className="control">
                <div className="select is-fullwidth">
                  <select
                    id="zone-filter"
                    value={filters.zone}
                    onChange={(e) => handleFilterChange("zone", e.target.value)}
                  >
                    <option value="">All Zones</option>
                    {availableZones.map((zone) => (
                      <option key={zone} value={zone}>
                        {zone}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>
          <div className="column">
            <div className="field">
              <label className="label" htmlFor="user-filter">
                Filter by User
              </label>
              <div className="control">
                <div className="select is-fullwidth">
                  <select
                    id="user-filter"
                    value={filters.user}
                    onChange={(e) => handleFilterChange("user", e.target.value)}
                  >
                    <option value="">All Users</option>
                    {availableUsers.map((user) => (
                      <option key={user} value={user}>
                        {user}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>
          <div className="column is-narrow">
            <div className="field">
              <label className="label" htmlFor="detailed-view-toggle">
                Detailed View
              </label>
              <div className="control">
                <label className="switch is-medium" htmlFor="detailed-view-toggle">
                  <input
                    id="detailed-view-toggle"
                    type="checkbox"
                    checked={filters.detailed}
                    onChange={(e) =>
                      handleFilterChange("detailed", e.target.checked)
                    }
                  />
                  <span className="check" />
                  <span className="control-label">Show CPU/Memory</span>
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
                  id="refresh-button"
                  className="button is-info"
                  onClick={loadProcesses}
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
              <label className="label" htmlFor="clear-filters-button">
                Clear
              </label>
              <div className="control">
                <button
                  id="clear-filters-button"
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
          <div className="column is-narrow">
            <div className="field">
              <label className="label" htmlFor="batch-kill-button">
                Actions
              </label>
              <div className="control">
                <button
                  id="batch-kill-button"
                  className="button is-warning"
                  onClick={() => setShowBatchKillModal(true)}
                  disabled={loading}
                >
                  <span className="icon">
                    <i className="fas fa-stop-circle" />
                  </span>
                  <span>Batch Kill</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="notification is-danger mb-4">
          <button className="delete" onClick={() => setError("")} />
          <p>{error}</p>
        </div>
      )}

      {/* Processes Table */}
      <div className="box">
        <div className="level is-mobile mb-4">
          <div className="level-left">
            <h3 className="title is-6">
              Processes ({processes.length})
              {loading && (
                <span className="ml-2">
                  <i className="fas fa-spinner fa-spin" />
                </span>
              )}
            </h3>
          </div>
        </div>

        <ProcessTable
          processes={processes}
          loading={loading}
          onViewDetails={handleViewDetails}
          onKillProcess={(process) => {
            setSelectedProcess(process);
            setShowKillModal(true);
          }}
          onSendSignal={(process) => {
            setSelectedProcess(process);
            setShowSignalModal(true);
          }}
          showDetailedView={filters.detailed}
        />
      </div>

      {/* Process Details Modal */}
      {showDetailsModal && selectedProcess && (
        <ProcessDetailsModal
          process={selectedProcess}
          server={server}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedProcess(null);
          }}
        />
      )}

      {/* Action Modals */}
      <ProcessActionModals
        selectedProcess={selectedProcess}
        showKillModal={showKillModal}
        showSignalModal={showSignalModal}
        showBatchKillModal={showBatchKillModal}
        availableZones={availableZones}
        onCloseKillModal={() => {
          setShowKillModal(false);
          setSelectedProcess(null);
        }}
        onCloseSignalModal={() => {
          setShowSignalModal(false);
          setSelectedProcess(null);
        }}
        onCloseBatchKillModal={() => setShowBatchKillModal(false)}
        onProcessAction={handleProcessAction}
        onBatchKill={handleBatchKill}
      />
    </div>
  );
};

ProcessManagement.propTypes = {
  server: PropTypes.shape({
    hostname: PropTypes.string.isRequired,
    port: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    protocol: PropTypes.string.isRequired,
  }).isRequired,
};

export default ProcessManagement;
