import React, { useState, useEffect } from "react";

import { useServers } from "../../contexts/ServerContext";

const HostnameSettings = ({ server, onError }) => {
  const [hostnameInfo, setHostnameInfo] = useState(null);
  const [newHostname, setNewHostname] = useState("");
  const [loading, setLoading] = useState(false);
  const [changing, setChanging] = useState(false);
  const [applyImmediately, setApplyImmediately] = useState(false);

  const { makeZoneweaverAPIRequest } = useServers();

  // Load current hostname information
  useEffect(() => {
    loadHostnameInfo();
  }, [server]);

  const loadHostnameInfo = async () => {
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
        "network/hostname",
        "GET"
      );

      if (result.success) {
        setHostnameInfo(result.data);
        setNewHostname(result.data.hostname || "");
      } else {
        onError(result.message || "Failed to load hostname information");
      }
    } catch (err) {
      onError(`Error loading hostname information: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleChangeHostname = async (e) => {
    e.preventDefault();

    if (!newHostname.trim()) {
      onError("Hostname cannot be empty");
      return;
    }

    if (newHostname === hostnameInfo?.hostname) {
      onError("New hostname is the same as current hostname");
      return;
    }

    try {
      setChanging(true);
      onError("");

      const result = await makeZoneweaverAPIRequest(
        server.hostname,
        server.port,
        server.protocol,
        "network/hostname",
        "PUT",
        {
          hostname: newHostname.trim(),
          apply_immediately: applyImmediately,
          created_by: "api",
        }
      );

      if (result.success) {
        // Refresh hostname info after successful change
        await loadHostnameInfo();

        // Show success message
        const message = applyImmediately
          ? `Hostname changed to "${newHostname}" and applied immediately`
          : `Hostname change to "${newHostname}" scheduled (requires reboot)`;

        // You might want to show a success notification here
        console.log(message);
      } else {
        onError(result.message || "Failed to change hostname");
      }
    } catch (err) {
      onError(`Error changing hostname: ${err.message}`);
    } finally {
      setChanging(false);
    }
  };

  const isHostnameValid = (hostname) => {
    // RFC compliant hostname/FQDN validation
    if (!hostname || hostname.length === 0 || hostname.length > 253) {
      return false;
    }

    // Split into labels (parts separated by dots)
    const labels = hostname.split(".");

    // Each label must be valid
    for (const label of labels) {
      // Label length check (1-63 characters)
      if (label.length === 0 || label.length > 63) {
        return false;
      }

      // Label format check: start/end with alphanumeric, hyphens allowed in middle
      const labelRegex = /^[a-zA-Z0-9]([a-zA-Z0-9\-]*[a-zA-Z0-9])?$/;
      if (!labelRegex.test(label)) {
        return false;
      }
    }

    return true;
  };

  const hasChanges = newHostname !== hostnameInfo?.hostname;

  if (loading && !hostnameInfo) {
    return (
      <div className="has-text-centered p-4">
        <span className="icon is-large">
          <i className="fas fa-spinner fa-spin fa-2x" />
        </span>
        <p className="mt-2">Loading hostname information...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4">
        <h2 className="title is-5">Hostname Configuration</h2>
        <p className="content">
          View and modify the system hostname for{" "}
          <strong>{server.hostname}</strong>.
        </p>
      </div>

      {/* Current Hostname Information */}
      {hostnameInfo && (
        <div className="box mb-4">
          <h3 className="title is-6">Current Hostname Information</h3>
          <div className="table-container">
            <table className="table is-fullwidth">
              <tbody>
                <tr>
                  <td>
                    <strong>Current Hostname</strong>
                  </td>
                  <td className="is-family-monospace">
                    {hostnameInfo.hostname}
                  </td>
                </tr>
                <tr>
                  <td>
                    <strong>Nodename File</strong>
                  </td>
                  <td className="is-family-monospace">
                    {hostnameInfo.nodename_file}
                  </td>
                </tr>
                <tr>
                  <td>
                    <strong>System Hostname</strong>
                  </td>
                  <td className="is-family-monospace">
                    {hostnameInfo.system_hostname}
                  </td>
                </tr>
                <tr>
                  <td>
                    <strong>Configuration Match</strong>
                  </td>
                  <td>
                    <span
                      className={`tag ${hostnameInfo.matches ? "is-success" : "is-warning"}`}
                    >
                      {hostnameInfo.matches ? "Yes" : "No"}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {!hostnameInfo.matches && (
            <div className="notification is-warning">
              <p>
                <strong>Warning:</strong> The system hostname does not match the
                configuration file. This may indicate a pending hostname change
                that requires a reboot.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Change Hostname Form */}
      <div className="box">
        <h3 className="title is-6">Change Hostname</h3>

        <form onSubmit={handleChangeHostname}>
          <div className="field">
            <label className="label">New Hostname</label>
            <div className="control">
              <input
                className={`input ${newHostname && !isHostnameValid(newHostname) ? "is-danger" : ""}`}
                type="text"
                placeholder="Enter new hostname"
                value={newHostname}
                onChange={(e) => setNewHostname(e.target.value)}
                disabled={changing}
              />
            </div>
            {newHostname && !isHostnameValid(newHostname) && (
              <p className="help is-danger">
                Invalid hostname. Must be a valid hostname or FQDN
              </p>
            )}
          </div>

          <div className="field">
            <div className="control">
              <label className="checkbox">
                <input
                  type="checkbox"
                  checked={applyImmediately}
                  onChange={(e) => setApplyImmediately(e.target.checked)}
                  disabled={changing}
                />
                <span className="ml-2">
                  Apply immediately (no reboot required)
                </span>
              </label>
            </div>
            <p className="help">
              {applyImmediately
                ? "The hostname will be changed immediately without requiring a reboot."
                : "The hostname will be changed in configuration files and applied after next reboot."}
            </p>
          </div>

          <div className="field is-grouped">
            <div className="control">
              <button
                type="submit"
                className={`button is-primary ${changing ? "is-loading" : ""}`}
                disabled={
                  !hasChanges || !isHostnameValid(newHostname) || changing
                }
              >
                Change Hostname
              </button>
            </div>
            <div className="control">
              <button
                type="button"
                className="button"
                onClick={() => setNewHostname(hostnameInfo?.hostname || "")}
                disabled={!hasChanges || changing}
              >
                Reset
              </button>
            </div>
            <div className="control">
              <button
                type="button"
                className={`button is-info ${loading ? "is-loading" : ""}`}
                onClick={loadHostnameInfo}
                disabled={loading || changing}
              >
                <span className="icon">
                  <i className="fas fa-sync-alt" />
                </span>
                <span>Refresh</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default HostnameSettings;
