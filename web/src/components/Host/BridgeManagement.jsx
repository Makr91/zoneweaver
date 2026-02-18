import PropTypes from "prop-types";
import { useState, useEffect, useCallback } from "react";

import { useServers } from "../../contexts/ServerContext";
import { ConfirmModal, ContentModal } from "../common";

import BridgeCreateModal from "./BridgeCreateModal";
import BridgeTable from "./BridgeTable";

const BridgeManagement = ({ server, onError }) => {
  const [bridges, setBridges] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [bridgeDetails, setBridgeDetails] = useState(null);
  const [filters, setFilters] = useState({
    name: "",
  });

  const { makeZoneweaverAPIRequest } = useServers();

  const loadBridges = useCallback(async () => {
    if (!server || !makeZoneweaverAPIRequest) {
      return;
    }

    try {
      setLoading(true);
      onError("");

      const params = {};
      if (filters.name) {
        params.name = filters.name;
      }
      params.extended = true;

      const result = await makeZoneweaverAPIRequest(
        server.hostname,
        server.port,
        server.protocol,
        "network/bridges",
        "GET",
        null,
        params
      );

      if (result.success) {
        setBridges(result.data?.bridges || []);
      } else {
        onError(result.message || "Failed to load bridges");
        setBridges([]);
      }
    } catch (err) {
      onError(`Error loading bridges: ${err.message}`);
      setBridges([]);
    } finally {
      setLoading(false);
    }
  }, [server, makeZoneweaverAPIRequest, onError, filters]);

  useEffect(() => {
    loadBridges();
  }, [loadBridges]);

  const handleDeleteBridge = async (bridgeName) => {
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
        `network/bridges/${encodeURIComponent(bridgeName)}`,
        "DELETE",
        null,
        {
          force: false,
          created_by: "api",
        }
      );

      if (result.success) {
        await loadBridges();
      } else {
        onError(result.message || `Failed to delete bridge "${bridgeName}"`);
      }
    } catch (err) {
      onError(`Error deleting bridge "${bridgeName}": ${err.message}`);
    } finally {
      setLoading(false);
      setDeleteTarget(null);
    }
  };

  const handleViewDetails = async (bridge) => {
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
        `network/bridges/${encodeURIComponent(bridge.name)}?show_links=true&show_forwarding=true`,
        "GET"
      );

      if (result.success) {
        setBridgeDetails(result.data);
      } else {
        onError(result.message || "Failed to load bridge details");
      }
    } catch (err) {
      onError(`Error loading bridge details: ${err.message}`);
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
      name: "",
    });
  };

  return (
    <div>
      <div className="mb-4">
        <h2 className="title is-5">Bridge Management</h2>
        <p className="content">
          Manage 802.1D bridges on <strong>{server.hostname}</strong>.
        </p>
      </div>

      {/* Bridge Filters */}
      <div className="box mb-4">
        <div className="columns">
          <div className="column">
            <div className="field">
              <label htmlFor="bridge-filter-name" className="label">
                Filter by Name
              </label>
              <div className="control">
                <input
                  id="bridge-filter-name"
                  className="input"
                  type="text"
                  placeholder="Bridge name"
                  value={filters.name}
                  onChange={(e) => handleFilterChange("name", e.target.value)}
                />
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
                  onClick={loadBridges}
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

      {/* Bridges Table */}
      <div className="box">
        <div className="level is-mobile mb-4">
          <div className="level-left">
            <h3 className="title is-6">
              Bridges ({bridges.length})
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
              <span>Create Bridge</span>
            </button>
          </div>
        </div>

        <BridgeTable
          bridges={bridges}
          loading={loading}
          onDelete={(bridgeName) => setDeleteTarget(bridgeName)}
          onViewDetails={handleViewDetails}
        />
      </div>

      {showCreateModal && (
        <BridgeCreateModal
          server={server}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            loadBridges();
          }}
          onError={onError}
        />
      )}

      <ConfirmModal
        isOpen={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => handleDeleteBridge(deleteTarget)}
        title="Delete Bridge"
        message={`Are you sure you want to delete bridge "${deleteTarget}"?`}
        confirmText="Delete"
        confirmVariant="is-danger"
        icon="fas fa-trash"
      />

      {bridgeDetails && (
        <ContentModal
          isOpen
          onClose={() => setBridgeDetails(null)}
          title="Bridge Details"
          icon="fas fa-network-wired"
        >
          <pre className="is-size-7">
            {JSON.stringify(bridgeDetails, null, 2)}
          </pre>
        </ContentModal>
      )}
    </div>
  );
};

BridgeManagement.propTypes = {
  server: PropTypes.object.isRequired,
  onError: PropTypes.func.isRequired,
};

export default BridgeManagement;
