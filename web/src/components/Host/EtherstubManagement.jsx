import { useState, useEffect } from "react";

import { useServers } from "../../contexts/ServerContext";

import EtherstubCreateModal from "./EtherstubCreateModal";
import EtherstubDetailsModal from "./EtherstubDetailsModal";
import EtherstubTable from "./EtherstubTable";

const EtherstubManagement = ({ server, onError }) => {
  const [etherstubs, setEtherstubs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedEtherstub, setSelectedEtherstub] = useState(null);
  const [etherstubDetails, setEtherstubDetails] = useState(null);
  const [filters, setFilters] = useState({
    name: "",
  });

  const { makeZoneweaverAPIRequest } = useServers();

  // Load etherstubs on component mount and when filters change
  useEffect(() => {
    loadEtherstubs();
  }, [server, filters.name]);

  const loadEtherstubs = async () => {
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

      const result = await makeZoneweaverAPIRequest(
        server.hostname,
        server.port,
        server.protocol,
        "network/etherstubs",
        "GET",
        null,
        params
      );

      if (result.success) {
        setEtherstubs(result.data?.etherstubs || []);
      } else {
        onError(result.message || "Failed to load etherstubs");
        setEtherstubs([]);
      }
    } catch (err) {
      onError(`Error loading etherstubs: ${err.message}`);
      setEtherstubs([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEtherstub = async (etherstubName) => {
    if (!server || !makeZoneweaverAPIRequest) {
      return;
    }
    if (
      !window.confirm(
        `Are you sure you want to delete etherstub "${etherstubName}"?`
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
        `network/etherstubs/${encodeURIComponent(etherstubName)}`,
        "DELETE",
        null, // No request body to avoid parsing issues
        {
          // Query parameters instead
          temporary: false,
          force: false,
          created_by: "api",
        }
      );

      if (result.success) {
        // Refresh etherstubs list after deletion
        await loadEtherstubs();
      } else {
        onError(
          result.message || `Failed to delete etherstub "${etherstubName}"`
        );
      }
    } catch (err) {
      onError(`Error deleting etherstub "${etherstubName}": ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = async (etherstub) => {
    if (!server || !makeZoneweaverAPIRequest) {
      return;
    }

    try {
      setLoading(true);
      onError("");

      const etherstubName = etherstub.name || etherstub.link;

      // Debug logging
      console.log("Etherstub object:", etherstub);
      console.log("Etherstub name resolved to:", etherstubName);

      if (!etherstubName) {
        onError("Unable to determine etherstub name");
        return;
      }

      const result = await makeZoneweaverAPIRequest(
        server.hostname,
        server.port,
        server.protocol,
        `network/etherstubs/${encodeURIComponent(etherstubName)}?show_vnics=true`,
        "GET"
      );

      if (result.success) {
        setSelectedEtherstub(etherstub);
        setEtherstubDetails(result.data);
        setShowDetailsModal(true);
      } else {
        onError(result.message || "Failed to load etherstub details");
      }
    } catch (err) {
      onError(`Error loading etherstub details: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCloseDetailsModal = () => {
    setShowDetailsModal(false);
    setSelectedEtherstub(null);
    setEtherstubDetails(null);
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
        <h2 className="title is-5">Etherstub Management</h2>
        <p className="content">
          Manage etherstubs on <strong>{server.hostname}</strong>. Etherstubs
          provide a virtual Layer 2 switch for connecting VNICs.
        </p>
      </div>

      {/* Etherstub Filters */}
      <div className="box mb-4">
        <div className="columns">
          <div className="column">
            <div className="field">
              <label className="label">Filter by Name</label>
              <div className="control">
                <input
                  className="input"
                  type="text"
                  placeholder="Etherstub name"
                  value={filters.name}
                  onChange={(e) => handleFilterChange("name", e.target.value)}
                />
              </div>
            </div>
          </div>
          <div className="column is-narrow">
            <div className="field">
              <label className="label">&nbsp;</label>
              <div className="control">
                <button
                  className="button is-info"
                  onClick={loadEtherstubs}
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

      {/* Etherstubs Table */}
      <div className="box">
        <div className="level is-mobile mb-4">
          <div className="level-left">
            <h3 className="title is-6">
              Etherstubs ({etherstubs.length})
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
              <span>Create Etherstub</span>
            </button>
          </div>
        </div>

        <EtherstubTable
          etherstubs={etherstubs}
          loading={loading}
          onDelete={handleDeleteEtherstub}
          onViewDetails={handleViewDetails}
        />
      </div>

      {/* Etherstub Create Modal */}
      {showCreateModal && (
        <EtherstubCreateModal
          server={server}
          existingEtherstubs={etherstubs}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            loadEtherstubs();
          }}
          onError={onError}
        />
      )}

      {/* Etherstub Details Modal */}
      {showDetailsModal && selectedEtherstub && (
        <EtherstubDetailsModal
          etherstub={selectedEtherstub}
          etherstubDetails={etherstubDetails}
          onClose={handleCloseDetailsModal}
        />
      )}
    </div>
  );
};

export default EtherstubManagement;
