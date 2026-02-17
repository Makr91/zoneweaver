import PropTypes from "prop-types";
import { useState, useEffect } from "react";

import { useServers } from "../../contexts/ServerContext";

import FaultDetailsModal from "./FaultDetailsModal";
import FaultTable from "./FaultTable";

const FaultList = ({ server }) => {
  const [faults, setFaults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [summary, setSummary] = useState(null);
  const [filters, setFilters] = useState({
    all: false,
    summary: false,
    limit: 50,
    force_refresh: false,
  });

  // Modal states
  const [selectedFault, setSelectedFault] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  const { makeZoneweaverAPIRequest } = useServers();

  // Load faults on component mount and when filters change
  useEffect(() => {
    loadFaults();
  }, [server, filters.all, filters.limit]);

  const loadFaults = async (forceRefresh = false) => {
    if (!server || !makeZoneweaverAPIRequest) {
      return;
    }

    try {
      setLoading(true);
      setError("");

      const params = {
        all: filters.all,
        summary: filters.summary,
        limit: filters.limit,
        force_refresh: forceRefresh,
      };

      const result = await makeZoneweaverAPIRequest(
        server.hostname,
        server.port,
        server.protocol,
        "system/fault-management/faults",
        "GET",
        null,
        params
      );

      if (result.success) {
        setFaults(result.data?.faults || []);
        setSummary(result.data?.summary || null);
      } else {
        setError(result.message || "Failed to load faults");
        setFaults([]);
        setSummary(null);
      }
    } catch (err) {
      setError(`Error loading faults: ${err.message}`);
      setFaults([]);
      setSummary(null);
    } finally {
      setLoading(false);
    }
  };

  const handleFaultAction = async (uuid, action, fmri = null) => {
    if (!server || !makeZoneweaverAPIRequest) {
      return;
    }

    try {
      setLoading(true);
      setError("");

      const payload = action === "acquit" ? { target: uuid } : { fmri };

      const result = await makeZoneweaverAPIRequest(
        server.hostname,
        server.port,
        server.protocol,
        `system/fault-management/actions/${action}`,
        "POST",
        payload
      );

      if (result.success) {
        // Refresh faults list after action
        setFilters((prev) => ({ ...prev, force_refresh: true }));
        await loadFaults();
      } else {
        setError(result.message || `Failed to ${action} fault`);
      }
    } catch (err) {
      setError(`Error performing ${action}: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (fault) => {
    // Details are already included in the fault list response, no need for API call
    setSelectedFault(fault);
    setShowDetailsModal(true);
  };

  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({
      ...prev,
      [field]: value,
      force_refresh: field === "all" || field === "limit", // Force refresh for these changes
    }));
  };

  const clearFilters = () => {
    setFilters({
      all: false,
      summary: false,
      limit: 50,
      force_refresh: true,
    });
  };

  return (
    <div>
      {/* Fault Summary */}
      {summary && (
        <div className="box mb-4">
          <h4 className="title is-6 mb-3">
            <span className="icon-text">
              <span className="icon">
                <i className="fas fa-chart-pie" />
              </span>
              <span>Fault Summary</span>
            </span>
          </h4>

          <div className="columns">
            <div className="column">
              <div className="field">
                <span className="label is-small">Total Faults</span>
                <p className="control">
                  <span className="tag is-info is-medium">
                    {summary.totalFaults}
                  </span>
                </p>
              </div>
            </div>
            {summary.severityLevels.length > 0 && (
              <div className="column">
                <div className="field">
                  <span className="label is-small">Severity Levels</span>
                  <div className="control">
                    <div className="tags">
                      {[
                        ...new Set(
                          summary.severityLevels.map((level) =>
                            level.toLowerCase()
                          )
                        ),
                      ].map((level, index) => {
                        const displayLevel =
                          level.charAt(0).toUpperCase() + level.slice(1);
                        return (
                          <span
                            key={index}
                            className={`tag ${
                              level === "critical"
                                ? "is-danger"
                                : level === "major"
                                  ? "is-warning"
                                  : level === "minor"
                                    ? "is-info"
                                    : "is-light"
                            }`}
                          >
                            {displayLevel}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}
            {summary.faultClasses.length > 0 && (
              <div className="column">
                <div className="field">
                  <span className="label is-small">Fault Classes</span>
                  <div className="control">
                    <div className="tags">
                      {summary.faultClasses.slice(0, 3).map((cls, index) => (
                        <span key={index} className="tag is-light is-small">
                          {cls.split(".").pop()}
                        </span>
                      ))}
                      {summary.faultClasses.length > 3 && (
                        <span className="tag is-grey is-small">
                          +{summary.faultClasses.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Fault Filters */}
      <div className="box mb-4">
        <div className="columns">
          <div className="column is-3">
            <div className="field">
              <label htmlFor="fault-limit" className="label">
                Max Faults
              </label>
              <div className="control">
                <div className="select is-fullwidth">
                  <select
                    id="fault-limit"
                    value={filters.limit}
                    onChange={(e) =>
                      handleFilterChange("limit", parseInt(e.target.value))
                    }
                  >
                    <option value={25}>25 faults</option>
                    <option value={50}>50 faults</option>
                    <option value={100}>100 faults</option>
                    <option value={200}>200 faults</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
          <div className="column is-narrow">
            <div className="field">
              <span className="label">Include Resolved</span>
              <div className="control">
                <label className="switch is-medium">
                  <input
                    type="checkbox"
                    checked={filters.all}
                    onChange={(e) =>
                      handleFilterChange("all", e.target.checked)
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
              <span className="label" aria-hidden="true">
                &nbsp;
              </span>
              <div className="control">
                <button
                  className="button is-info"
                  onClick={() => loadFaults(true)}
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

      {/* Error Display */}
      {error && (
        <div className="notification is-danger mb-4">
          <button className="delete" onClick={() => setError("")} />
          <p>{error}</p>
        </div>
      )}

      {/* Faults Table */}
      <div className="box">
        <div className="level is-mobile mb-4">
          <div className="level-left">
            <h3 className="title is-6">
              System Faults ({faults.length})
              {loading && (
                <span className="ml-2">
                  <i className="fas fa-spinner fa-spin" />
                </span>
              )}
            </h3>
          </div>
        </div>

        <FaultTable
          faults={faults}
          loading={loading}
          onAction={handleFaultAction}
          onViewDetails={handleViewDetails}
        />
      </div>

      {/* Fault Details Modal */}
      {showDetailsModal && selectedFault && (
        <FaultDetailsModal
          fault={selectedFault}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedFault(null);
          }}
        />
      )}
    </div>
  );
};

FaultList.propTypes = {
  server: PropTypes.object.isRequired,
};

export default FaultList;
