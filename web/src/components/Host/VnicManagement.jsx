import PropTypes from "prop-types";
import { useState, useEffect, useCallback } from "react";

import { useServers } from "../../contexts/ServerContext";
import { ConfirmModal } from "../common";

import VnicCreateModal from "./VnicCreateModal";
import VnicDetailsModal from "./VnicDetailsModal";
import VnicTable from "./VnicTable";

const VnicManagement = ({ server, onError }) => {
  const [vnics, setVnics] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedVnic, setSelectedVnic] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [availableLinks, setAvailableLinks] = useState([]);
  const [availableZones, setAvailableZones] = useState([]);
  const [filters, setFilters] = useState({
    over: "",
    zone: "",
    state: "",
  });
  const [vnicToDelete, setVnicToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const { makeZoneweaverAPIRequest } = useServers();

  const loadFilterOptions = useCallback(async () => {
    if (!server || !makeZoneweaverAPIRequest) {
      return;
    }

    try {
      // Load links and zones for filter dropdowns
      const [linksResult, zonesResult] = await Promise.all([
        makeZoneweaverAPIRequest(
          server.hostname,
          server.port,
          server.protocol,
          "monitoring/network/interfaces",
          "GET"
        ),
        makeZoneweaverAPIRequest(
          server.hostname,
          server.port,
          server.protocol,
          "zones",
          "GET"
        ),
      ]);

      // Process links
      if (linksResult.success && linksResult.data?.interfaces) {
        const links = linksResult.data.interfaces
          .filter((link) => link.class === "phys")
          .map((link) => link.link)
          .filter(Boolean);
        const uniqueLinks = [...new Set(links)].sort();
        setAvailableLinks(uniqueLinks);
      }

      // Process zones
      if (zonesResult.success && zonesResult.data?.zones) {
        const zones = zonesResult.data.zones
          .map((zone) => zone.name)
          .filter(Boolean);
        const uniqueZones = [...new Set(zones)].sort();
        setAvailableZones(uniqueZones);
      }
    } catch (err) {
      console.error("Error loading filter options:", err);
    }
  }, [server, makeZoneweaverAPIRequest]);

  const loadVnics = useCallback(async () => {
    if (!server || !makeZoneweaverAPIRequest) {
      return;
    }

    try {
      setLoading(true);
      onError("");

      const params = {};
      if (filters.over) {
        params.over = filters.over;
      }
      if (filters.zone) {
        params.zone = filters.zone;
      }
      if (filters.state) {
        params.state = filters.state;
      }

      const result = await makeZoneweaverAPIRequest(
        server.hostname,
        server.port,
        server.protocol,
        "network/vnics",
        "GET",
        null,
        params
      );

      if (result.success) {
        // Deduplicate VNICs by link name to avoid duplicate entries
        const rawVnics = result.data?.vnics || [];
        const uniqueVnics = rawVnics.filter(
          (vnic, index, self) =>
            index === self.findIndex((v) => v.link === vnic.link)
        );
        setVnics(uniqueVnics);
      } else {
        onError(result.message || "Failed to load VNICs");
        setVnics([]);
      }
    } catch (err) {
      onError(`Error loading VNICs: ${err.message}`);
      setVnics([]);
    } finally {
      setLoading(false);
    }
  }, [server, makeZoneweaverAPIRequest, filters, onError]);

  // Load VNICs on component mount and when filters change
  useEffect(() => {
    loadVnics();
    loadFilterOptions();
  }, [loadVnics, loadFilterOptions]);

  const handleDeleteVnic = (vnicName) => {
    setVnicToDelete(vnicName);
  };

  const confirmDeleteVnic = async () => {
    if (!server || !makeZoneweaverAPIRequest || !vnicToDelete) {
      return;
    }

    try {
      setDeleting(true);
      onError("");

      // Use query parameters instead of request body for DELETE request
      const result = await makeZoneweaverAPIRequest(
        server.hostname,
        server.port,
        server.protocol,
        `network/vnics/${encodeURIComponent(vnicToDelete)}`,
        "DELETE",
        null, // No request body to avoid parsing issues
        {
          // Query parameters instead
          temporary: false,
          created_by: "api",
        }
      );

      if (result.success) {
        // Refresh VNICs list after deletion
        await loadVnics();
      } else {
        onError(result.message || `Failed to delete VNIC "${vnicToDelete}"`);
      }
    } catch (err) {
      onError(`Error deleting VNIC "${vnicToDelete}": ${err.message}`);
    } finally {
      setDeleting(false);
      setVnicToDelete(null);
    }
  };

  const handleViewDetails = async (vnic) => {
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
        `network/vnics/${encodeURIComponent(vnic.link)}`,
        "GET"
      );

      if (result.success) {
        setSelectedVnic({ ...vnic, details: result.data });
        setShowDetailsModal(true);
      } else {
        onError(result.message || "Failed to load VNIC details");
      }
    } catch (err) {
      onError(`Error loading VNIC details: ${err.message}`);
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
      over: "",
      zone: "",
      state: "",
    });
  };

  return (
    <div>
      <div className="mb-4">
        <h2 className="title is-5">VNIC Management</h2>
        <p className="content">
          Manage Virtual Network Interface Cards (VNICs) on{" "}
          <strong>{server.hostname}</strong>.
        </p>
      </div>

      {/* VNIC Filters */}
      <div className="box mb-4">
        <div className="columns">
          <div className="column">
            <div className="field">
              <label className="label" htmlFor="filter-over">
                Filter by Physical Link
              </label>
              <div className="control">
                <div className="select is-fullwidth">
                  <select
                    id="filter-over"
                    value={filters.over}
                    onChange={(e) => handleFilterChange("over", e.target.value)}
                  >
                    <option value="">All Physical Links</option>
                    {availableLinks.map((link) => (
                      <option key={link} value={link}>
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
              <label className="label" htmlFor="filter-zone">
                Filter by Zone
              </label>
              <div className="control">
                <div className="select is-fullwidth">
                  <select
                    id="filter-zone"
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
              <label className="label" htmlFor="filter-state">
                Filter by State
              </label>
              <div className="control">
                <div className="select is-fullwidth">
                  <select
                    id="filter-state"
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
              <div className="label">&nbsp;</div>
              <div className="control">
                <button
                  className="button is-info"
                  onClick={loadVnics}
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
              <div className="label">&nbsp;</div>
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

      {/* VNICs Table */}
      <div className="box">
        <div className="level is-mobile mb-4">
          <div className="level-left">
            <h3 className="title is-6">
              VNICs ({vnics.length})
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
              <span>Create VNIC</span>
            </button>
          </div>
        </div>

        <VnicTable
          vnics={vnics}
          loading={loading}
          onDelete={handleDeleteVnic}
          onViewDetails={handleViewDetails}
        />
      </div>

      {/* VNIC Details Modal */}
      {showDetailsModal && selectedVnic && (
        <VnicDetailsModal
          vnic={selectedVnic}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedVnic(null);
          }}
        />
      )}

      {/* VNIC Create Modal */}
      {showCreateModal && (
        <VnicCreateModal
          server={server}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            loadVnics();
          }}
          onError={onError}
        />
      )}

      {/* Delete Confirmation Modal */}
      {vnicToDelete && (
        <ConfirmModal
          isOpen={!!vnicToDelete}
          onClose={() => setVnicToDelete(null)}
          onConfirm={confirmDeleteVnic}
          title="Delete VNIC"
          message={`Are you sure you want to delete VNIC "${vnicToDelete}"? This action cannot be undone.`}
          confirmText="Delete"
          confirmVariant="is-danger"
          loading={deleting}
        />
      )}
    </div>
  );
};

VnicManagement.propTypes = {
  server: PropTypes.shape({
    hostname: PropTypes.string,
    port: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    protocol: PropTypes.string,
  }).isRequired,
  onError: PropTypes.func.isRequired,
};

export default VnicManagement;
