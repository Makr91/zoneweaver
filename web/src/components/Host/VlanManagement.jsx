import { useState, useEffect } from "react";

import { useServers } from "../../contexts/ServerContext";

import VlanCreateModal from "./VlanCreateModal";
import VlanDetailsModal from "./VlanDetailsModal";
import VlanTable from "./VlanTable";

const VlanManagement = ({ server, onError }) => {
  const [vlans, setVlans] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedVlan, setSelectedVlan] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [availableLinks, setAvailableLinks] = useState([]);
  const [filters, setFilters] = useState({
    vid: "",
    over: "",
    state: "",
  });

  const { makeZoneweaverAPIRequest } = useServers();

  // Load VLANs on component mount and when filters change
  useEffect(() => {
    loadVlans();
    loadFilterOptions();
  }, [server, filters.vid, filters.over, filters.state]);

  const loadFilterOptions = async () => {
    if (!server || !makeZoneweaverAPIRequest) {
      return;
    }

    try {
      // Load physical links for filter dropdown
      const linksResult = await makeZoneweaverAPIRequest(
        server.hostname,
        server.port,
        server.protocol,
        "monitoring/network/interfaces",
        "GET"
      );

      // Process physical links
      if (linksResult.success && linksResult.data?.interfaces) {
        const links = linksResult.data.interfaces
          .filter((link) => link.class === "phys")
          .map((link) => link.link)
          .filter(Boolean);
        const uniqueLinks = [...new Set(links)].sort();
        setAvailableLinks(uniqueLinks);
      }
    } catch (err) {
      console.error("Error loading filter options:", err);
    }
  };

  const loadVlans = async () => {
    if (!server || !makeZoneweaverAPIRequest) {
      return;
    }

    try {
      setLoading(true);
      onError("");

      const params = {};
      if (filters.vid) {
        params.vid = parseInt(filters.vid);
      }
      if (filters.over) {
        params.over = filters.over;
      }
      if (filters.state) {
        params.state = filters.state;
      }

      const result = await makeZoneweaverAPIRequest(
        server.hostname,
        server.port,
        server.protocol,
        "network/vlans",
        "GET",
        null,
        params
      );

      if (result.success) {
        // Deduplicate VLANs by link name to avoid duplicate entries
        const rawVlans = result.data?.vlans || [];
        const uniqueVlans = rawVlans.filter(
          (vlan, index, self) =>
            index === self.findIndex((v) => v.link === vlan.link)
        );
        setVlans(uniqueVlans);
      } else {
        onError(result.message || "Failed to load VLANs");
        setVlans([]);
      }
    } catch (err) {
      onError(`Error loading VLANs: ${err.message}`);
      setVlans([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteVlan = async (vlanName) => {
    if (!server || !makeZoneweaverAPIRequest) {
      return;
    }
    if (
      !window.confirm(`Are you sure you want to delete VLAN "${vlanName}"?`)
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
        `network/vlans/${encodeURIComponent(vlanName)}`,
        "DELETE",
        null, // No request body to avoid parsing issues
        {
          // Query parameters instead
          temporary: false,
          created_by: "api",
        }
      );

      if (result.success) {
        // Refresh VLANs list after deletion
        await loadVlans();
      } else {
        onError(result.message || `Failed to delete VLAN "${vlanName}"`);
      }
    } catch (err) {
      onError(`Error deleting VLAN "${vlanName}": ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = async (vlan) => {
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
        `network/vlans/${encodeURIComponent(vlan.link)}`,
        "GET"
      );

      if (result.success) {
        setSelectedVlan({ ...vlan, details: result.data });
        setShowDetailsModal(true);
      } else {
        onError(result.message || "Failed to load VLAN details");
      }
    } catch (err) {
      onError(`Error loading VLAN details: ${err.message}`);
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
      vid: "",
      over: "",
      state: "",
    });
  };

  return (
    <div>
      <div className="mb-4">
        <h2 className="title is-5">VLAN Management</h2>
        <p className="content">
          Manage Virtual Local Area Networks (VLANs) on{" "}
          <strong>{server.hostname}</strong>.
        </p>
      </div>

      {/* VLAN Filters */}
      <div className="box mb-4">
        <div className="columns">
          <div className="column">
            <div className="field">
              <label className="label">Filter by VLAN ID</label>
              <div className="control">
                <input
                  className="input"
                  type="number"
                  min="1"
                  max="4094"
                  placeholder="e.g., 100"
                  value={filters.vid}
                  onChange={(e) => handleFilterChange("vid", e.target.value)}
                />
              </div>
            </div>
          </div>
          <div className="column">
            <div className="field">
              <label className="label">Filter by Physical Link</label>
              <div className="control">
                <div className="select is-fullwidth">
                  <select
                    value={filters.over}
                    onChange={(e) => handleFilterChange("over", e.target.value)}
                  >
                    <option value="">All Physical Links</option>
                    {availableLinks.map((link, index) => (
                      <option key={index} value={link}>
                        {link}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>
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
          <div className="column is-narrow">
            <div className="field">
              <label className="label">&nbsp;</label>
              <div className="control">
                <button
                  className="button is-info"
                  onClick={loadVlans}
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

      {/* VLANs Table */}
      <div className="box">
        <div className="level is-mobile mb-4">
          <div className="level-left">
            <h3 className="title is-6">
              VLANs ({vlans.length})
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
              <span>Create VLAN</span>
            </button>
          </div>
        </div>

        <VlanTable
          vlans={vlans}
          loading={loading}
          onDelete={handleDeleteVlan}
          onViewDetails={handleViewDetails}
        />
      </div>

      {/* VLAN Details Modal */}
      {showDetailsModal && selectedVlan && (
        <VlanDetailsModal
          vlan={selectedVlan}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedVlan(null);
          }}
        />
      )}

      {/* VLAN Create Modal */}
      {showCreateModal && (
        <VlanCreateModal
          server={server}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            loadVlans();
          }}
          onError={onError}
        />
      )}
    </div>
  );
};

export default VlanManagement;
