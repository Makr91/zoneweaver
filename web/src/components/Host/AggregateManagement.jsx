import React, { useState, useEffect } from "react";

import { useServers } from "../../contexts/ServerContext";

import AggregateCreateModal from "./AggregateCreateModal";
import AggregateDetailsModal from "./AggregateDetailsModal";
import AggregateTable from "./AggregateTable";

const AggregateManagement = ({ server, onError }) => {
  const [aggregates, setAggregates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedAggregate, setSelectedAggregate] = useState(null);
  const [aggregateDetails, setAggregateDetails] = useState(null);
  const [cdpServiceRunning, setCdpServiceRunning] = useState(false);
  const [loadingCdpStatus, setLoadingCdpStatus] = useState(false);
  const [filters, setFilters] = useState({
    state: "",
    policy: "",
  });

  const { makeZoneweaverAPIRequest } = useServers();

  // Load aggregates and CDP status on component mount and when filters change
  useEffect(() => {
    loadAggregates();
    checkCdpServiceStatus();
  }, [server, filters.state, filters.policy]);

  const loadAggregates = async () => {
    if (!server || !makeZoneweaverAPIRequest) {
      return;
    }

    try {
      setLoading(true);
      onError("");

      const params = {};
      if (filters.state) {
        params.state = filters.state;
      }
      if (filters.policy) {
        params.policy = filters.policy;
      }
      params.extended = true; // Include detailed port information

      const result = await makeZoneweaverAPIRequest(
        server.hostname,
        server.port,
        server.protocol,
        "network/aggregates",
        "GET",
        null,
        params
      );

      if (result.success) {
        setAggregates(result.data?.aggregates || []);
      } else {
        onError(result.message || "Failed to load link aggregates");
        setAggregates([]);
      }
    } catch (err) {
      onError(`Error loading link aggregates: ${err.message}`);
      setAggregates([]);
    } finally {
      setLoading(false);
    }
  };

  const checkCdpServiceStatus = async () => {
    if (!server || !makeZoneweaverAPIRequest) {
      return;
    }

    try {
      setLoadingCdpStatus(true);

      const result = await makeZoneweaverAPIRequest(
        server.hostname,
        server.port,
        server.protocol,
        "services",
        "GET",
        null,
        { pattern: "cdp" }
      );

      if (result.success && result.data) {
        // Look for CDP service in the services list
        const cdpService = result.data.find(
          (service) => service.fmri && service.fmri.includes("network/cdp")
        );

        // CDP is running if the service exists and is online
        setCdpServiceRunning(cdpService && cdpService.state === "online");
      } else {
        setCdpServiceRunning(false);
      }
    } catch (err) {
      console.error("Error checking CDP service status:", err);
      setCdpServiceRunning(false);
    } finally {
      setLoadingCdpStatus(false);
    }
  };

  const handleDeleteAggregate = async (aggregateName) => {
    if (!server || !makeZoneweaverAPIRequest) {
      return;
    }
    if (
      !window.confirm(
        `Are you sure you want to delete link aggregate "${aggregateName}"?`
      )
    ) {
      return;
    }

    try {
      setLoading(true);
      onError("");

      // Use query parameters instead of request body for DELETE request
      const result = await makeZoneweaverAPIRequest(
        server.hostname,
        server.port,
        server.protocol,
        `network/aggregates/${encodeURIComponent(aggregateName)}`,
        "DELETE",
        null, // No request body to avoid parsing issues
        {
          // Query parameters instead
          temporary: false,
          created_by: "api",
        }
      );

      if (result.success) {
        // Refresh aggregates list after deletion
        await loadAggregates();
      } else {
        onError(
          result.message || `Failed to delete link aggregate "${aggregateName}"`
        );
      }
    } catch (err) {
      onError(
        `Error deleting link aggregate "${aggregateName}": ${err.message}`
      );
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = async (aggregate) => {
    if (!server || !makeZoneweaverAPIRequest) {
      return;
    }

    try {
      setLoading(true);
      onError("");

      const aggregateName = aggregate.name || aggregate.link;

      // Debug logging
      console.log("Aggregate object:", aggregate);
      console.log("Aggregate name resolved to:", aggregateName);

      if (!aggregateName) {
        onError("Unable to determine aggregate name");
        return;
      }

      const result = await makeZoneweaverAPIRequest(
        server.hostname,
        server.port,
        server.protocol,
        `network/aggregates/${encodeURIComponent(aggregateName)}?extended=true&lacp=true`,
        "GET"
      );

      if (result.success) {
        setSelectedAggregate(aggregate);
        setAggregateDetails(result.data);
        setShowDetailsModal(true);
      } else {
        onError(result.message || "Failed to load aggregate details");
      }
    } catch (err) {
      onError(`Error loading aggregate details: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCloseDetailsModal = () => {
    setShowDetailsModal(false);
    setSelectedAggregate(null);
    setAggregateDetails(null);
  };

  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const clearFilters = () => {
    setFilters({
      state: "",
      policy: "",
    });
  };

  return (
    <div>
      <div className="mb-4">
        <h2 className="title is-5">Link Aggregation Management</h2>
        <p className="content">
          Manage link aggregates (LAGs) on <strong>{server.hostname}</strong>.
        </p>
      </div>

      {/* CDP Warning */}
      {cdpServiceRunning && (
        <div className="notification is-warning mb-4">
          <div className="is-flex is-align-items-center">
            <span className="icon">
              <i className="fas fa-exclamation-triangle" />
            </span>
            <div className="ml-2">
              <strong>CDP Service Detected</strong>
              <br />
              The Cisco Discovery Protocol (CDP) service is currently running.
              Link aggregates cannot be created while CDP is active. You can
              disable CDP when creating a new aggregate.
            </div>
          </div>
        </div>
      )}

      {/* Aggregate Filters */}
      <div className="box mb-4">
        <div className="columns">
          <div className="column">
            <div className="field">
              <label className="label">Filter by State</label>
              <div className="control">
                <div className="select is-fullwidth">
                  <select
                    value={filters.state}
                    onChange={(e) =>
                      handleFilterChange("state", e.target.value)
                    }
                  >
                    <option value="">All States</option>
                    <option value="up">Up</option>
                    <option value="down">Down</option>
                    <option value="unknown">Unknown</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
          <div className="column">
            <div className="field">
              <label className="label">Filter by Policy</label>
              <div className="control">
                <div className="select is-fullwidth">
                  <select
                    value={filters.policy}
                    onChange={(e) =>
                      handleFilterChange("policy", e.target.value)
                    }
                  >
                    <option value="">All Policies</option>
                    <option value="L2">L2</option>
                    <option value="L3">L3</option>
                    <option value="L4">L4</option>
                    <option value="L2L3">L2L3</option>
                    <option value="L2L4">L2L4</option>
                    <option value="L3L4">L3L4</option>
                    <option value="L2L3L4">L2L3L4</option>
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
                  onClick={loadAggregates}
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

      {/* Aggregates Table */}
      <div className="box">
        <div className="level is-mobile mb-4">
          <div className="level-left">
            <h3 className="title is-6">
              Link Aggregates ({aggregates.length})
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
              <span>Create Aggregate</span>
            </button>
          </div>
        </div>

        <AggregateTable
          aggregates={aggregates}
          loading={loading}
          onDelete={handleDeleteAggregate}
          onViewDetails={handleViewDetails}
        />
      </div>

      {/* Aggregate Create Modal */}
      {showCreateModal && (
        <AggregateCreateModal
          server={server}
          existingAggregates={aggregates}
          cdpServiceRunning={cdpServiceRunning}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            loadAggregates();
            checkCdpServiceStatus(); // Refresh CDP status after creation
          }}
          onError={onError}
        />
      )}

      {/* Aggregate Details Modal */}
      {showDetailsModal && selectedAggregate && (
        <AggregateDetailsModal
          aggregate={selectedAggregate}
          aggregateDetails={aggregateDetails}
          onClose={handleCloseDetailsModal}
        />
      )}
    </div>
  );
};

export default AggregateManagement;
