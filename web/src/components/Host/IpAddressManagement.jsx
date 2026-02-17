import PropTypes from "prop-types";
import { useState, useEffect, useCallback } from "react";

import { useServers } from "../../contexts/ServerContext";
import { FormModal } from "../common";

import IpAddressCreateModal from "./IpAddressCreateModal";
import IpAddressTableManagement from "./IpAddressTableManagement";

const IpAddressManagement = ({ server, onError }) => {
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [addressToDelete, setAddressToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [filters, setFilters] = useState({
    interface: "",
    ip_version: "",
    type: "",
    state: "",
  });

  const { makeZoneweaverAPIRequest } = useServers();

  const loadAddresses = useCallback(async () => {
    if (!server || !makeZoneweaverAPIRequest) {
      return;
    }

    try {
      setLoading(true);
      onError("");

      const params = {};
      if (filters.interface) {
        params.interface = filters.interface;
      }
      if (filters.ip_version) {
        params.ip_version = filters.ip_version;
      }
      if (filters.type) {
        params.type = filters.type;
      }
      if (filters.state) {
        params.state = filters.state;
      }

      const result = await makeZoneweaverAPIRequest(
        server.hostname,
        server.port,
        server.protocol,
        "network/addresses",
        "GET",
        null,
        params
      );

      if (result.success) {
        // Deduplicate IP addresses by addrobj to avoid duplicate entries
        const rawAddresses = result.data?.addresses || [];
        const uniqueAddresses = rawAddresses.filter(
          (addr, index, self) =>
            index === self.findIndex((a) => a.addrobj === addr.addrobj)
        );
        setAddresses(uniqueAddresses);
      } else {
        onError(result.message || "Failed to load IP addresses");
        setAddresses([]);
      }
    } catch (err) {
      onError(`Error loading IP addresses: ${err.message}`);
      setAddresses([]);
    } finally {
      setLoading(false);
    }
  }, [
    makeZoneweaverAPIRequest,
    server,
    filters.interface,
    filters.ip_version,
    filters.type,
    filters.state,
    onError,
  ]);

  // Load IP addresses on component mount and when filters change
  useEffect(() => {
    loadAddresses();
  }, [loadAddresses]);

  const handleDeleteAddress = (addrobj) => {
    setAddressToDelete(addrobj);
    setShowDeleteModal(true);
  };

  const confirmDeleteAddress = async () => {
    if (!server || !makeZoneweaverAPIRequest || !addressToDelete) {
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
        `network/addresses/${encodeURIComponent(addressToDelete)}`,
        "DELETE",
        null, // No request body to avoid parsing issues
        {
          // Query parameters instead
          release: false,
          created_by: "api",
        }
      );

      if (result.success) {
        setShowDeleteModal(false);
        setAddressToDelete(null);
        // Refresh addresses list after deletion
        await loadAddresses();
      } else {
        onError(
          result.message || `Failed to delete IP address "${addressToDelete}"`
        );
      }
    } catch (err) {
      onError(`Error deleting IP address "${addressToDelete}": ${err.message}`);
    } finally {
      setDeleting(false);
    }
  };

  const handleToggleAddress = async (address, action) => {
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
        `network/addresses/${encodeURIComponent(address.addrobj)}/${action}`,
        "PUT"
      );

      if (result.success) {
        // Refresh addresses list after action
        await loadAddresses();
      } else {
        onError(
          result.message ||
            `Failed to ${action} IP address "${address.addrobj}"`
        );
      }
    } catch (err) {
      onError(
        `Error ${action}ing IP address "${address.addrobj}": ${err.message}`
      );
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
      interface: "",
      ip_version: "",
      type: "",
      state: "",
    });
  };

  return (
    <div>
      <div className="mb-4">
        <h2 className="title is-5">IP Address Management</h2>
        <p className="content">
          Manage IP address assignments on <strong>{server.hostname}</strong>.
        </p>
      </div>

      {/* IP Address Filters */}
      <div className="box mb-4">
        <div className="columns">
          <div className="column">
            <div className="field">
              <label className="label" htmlFor="filter-interface">
                Filter by Interface
              </label>
              <div className="control">
                <input
                  id="filter-interface"
                  className="input"
                  type="text"
                  placeholder="e.g., vnic0"
                  value={filters.interface}
                  onChange={(e) =>
                    handleFilterChange("interface", e.target.value)
                  }
                />
              </div>
            </div>
          </div>
          <div className="column">
            <div className="field">
              <label className="label" htmlFor="filter-ip-version">
                IP Version
              </label>
              <div className="control">
                <div className="select is-fullwidth">
                  <select
                    id="filter-ip-version"
                    value={filters.ip_version}
                    onChange={(e) =>
                      handleFilterChange("ip_version", e.target.value)
                    }
                  >
                    <option value="">All Versions</option>
                    <option value="v4">IPv4</option>
                    <option value="v6">IPv6</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
          <div className="column">
            <div className="field">
              <label className="label" htmlFor="filter-type">
                Address Type
              </label>
              <div className="control">
                <div className="select is-fullwidth">
                  <select
                    id="filter-type"
                    value={filters.type}
                    onChange={(e) => handleFilterChange("type", e.target.value)}
                  >
                    <option value="">All Types</option>
                    <option value="static">Static</option>
                    <option value="dhcp">DHCP</option>
                    <option value="addrconf">Auto Config</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
          <div className="column">
            <div className="field">
              <label className="label" htmlFor="filter-state">
                State
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
                    <option value="ok">OK</option>
                    <option value="disabled">Disabled</option>
                    <option value="down">Down</option>
                    <option value="duplicate">Duplicate</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="columns">
          <div className="column is-narrow">
            <div className="field">
              <span className="label" aria-hidden="true">
                &nbsp;
              </span>
              <div className="control">
                <button
                  className="button is-info"
                  onClick={loadAddresses}
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

      {/* IP Addresses Table */}
      <div className="box">
        <div className="level is-mobile mb-4">
          <div className="level-left">
            <h3 className="title is-6">
              IP Addresses ({addresses.length})
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
              <span>Create IP Address</span>
            </button>
          </div>
        </div>

        <IpAddressTableManagement
          addresses={addresses}
          loading={loading}
          onDelete={handleDeleteAddress}
          onToggle={handleToggleAddress}
        />
      </div>

      {/* IP Address Create Modal */}
      {showCreateModal && (
        <IpAddressCreateModal
          server={server}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            loadAddresses();
          }}
          onError={onError}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && addressToDelete && (
        <FormModal
          isOpen
          onClose={() => {
            setShowDeleteModal(false);
            setAddressToDelete(null);
          }}
          onSubmit={confirmDeleteAddress}
          title="Delete IP Address"
          icon="fas fa-trash"
          submitText="Delete"
          submitVariant="is-danger"
          loading={deleting}
        >
          <div className="notification is-danger is-light">
            <p>
              <strong>Warning:</strong> This action cannot be undone.
            </p>
          </div>
          <p className="mb-4">
            Are you sure you want to delete the IP address{" "}
            <strong className="is-family-monospace">{addressToDelete}</strong>?
          </p>
          <p className="has-text-grey is-size-7">
            This will remove the IP address configuration from the system.
          </p>
        </FormModal>
      )}
    </div>
  );
};

IpAddressManagement.propTypes = {
  server: PropTypes.shape({
    hostname: PropTypes.string.isRequired,
    port: PropTypes.number.isRequired,
    protocol: PropTypes.string.isRequired,
  }).isRequired,
  onError: PropTypes.func.isRequired,
};

export default IpAddressManagement;
