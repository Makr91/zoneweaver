import PropTypes from "prop-types";
import { useState, useEffect, useCallback } from "react";

import { useServers } from "../../contexts/ServerContext";
import { ConfirmModal } from "../common";

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
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [filters, setFilters] = useState({
    state: "",
    policy: "",
  });

  const { makeZoneweaverAPIRequest } = useServers();

  const loadAggregates = useCallback(async () => {
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
      params.extended = true;

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
  }, [
    server,
    makeZoneweaverAPIRequest,
    onError,
    filters.state,
    filters.policy,
  ]);

  const checkCdpServiceStatus = useCallback(async () => {
    if (!server || !makeZoneweaverAPIRequest) {
      return;
    }

    try {
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
        const cdpService = result.data.find(
          (service) => service.fmri && service.fmri.includes("network/cdp")
        );
        setCdpServiceRunning(cdpService && cdpService.state === "online");
      } else {
        setCdpServiceRunning(false);
      }
    } catch (err) {
      void err;
      setCdpServiceRunning(false);
    }
  }, [server, makeZoneweaverAPIRequest]);

  useEffect(() => {
    loadAggregates();
    checkCdpServiceStatus();
  }, [loadAggregates, checkCdpServiceStatus]);

  const handleDeleteAggregate = async () => {
    if (!server || !makeZoneweaverAPIRequest || !deleteTarget) {
      return;
    }

    try {
      setLoading(true);
      onError("");

      const result = await makeZoneweaverAPIRequest(
        server.hostname,
        server.port,
        server.protocol,
        `network/aggregates/${encodeURIComponent(deleteTarget)}`,
        "DELETE",
        null,
        {
          temporary: false,
          created_by: "api",
        }
      );

      if (result.success) {
        await loadAggregates();
      } else {
        onError(
          result.message || `Failed to delete link aggregate "${deleteTarget}"`
        );
      }
    } catch (err) {
      onError(
        `Error deleting link aggregate "${deleteTarget}": ${err.message}`
      );
    } finally {
      setDeleteTarget(null);
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
      <ConfirmModal
        isOpen={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteAggregate}
        title="Delete Link Aggregate"
        message={`Are you sure you want to delete link aggregate "${deleteTarget}"?`}
        confirmText="Delete"
        confirmVariant="is-danger"
        icon="fas fa-trash"
        loading={loading}
      />

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
              <label htmlFor="aggregate-filter-state" className="label">
                Filter by State
              </label>
              <div className="control">
                <div className="select is-fullwidth">
                  <select
                    id="aggregate-filter-state"
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
              <label htmlFor="aggregate-filter-policy" className="label">
                Filter by Policy
              </label>
              <div className="control">
                <div className="select is-fullwidth">
                  <select
                    id="aggregate-filter-policy"
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
              <span className="label" aria-hidden="true">
                &nbsp;
              </span>
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
          onDelete={setDeleteTarget}
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
            checkCdpServiceStatus();
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

AggregateManagement.propTypes = {
  server: PropTypes.object.isRequired,
  onError: PropTypes.func.isRequired,
};

export default AggregateManagement;
