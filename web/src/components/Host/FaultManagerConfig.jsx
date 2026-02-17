import PropTypes from "prop-types";
import { useState, useEffect } from "react";

import { useServers } from "../../contexts/ServerContext";

const FaultManagerConfig = ({ server }) => {
  const [config, setConfig] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const { makeZoneweaverAPIRequest } = useServers();

  // Load config on component mount
  useEffect(() => {
    loadConfig();
  }, [server]);

  const loadConfig = async () => {
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
        "system/fault-management/config",
        "GET"
      );

      if (result.success) {
        setConfig(result.data?.config || []);
      } else {
        setError(
          result.message || "Failed to load fault manager configuration"
        );
        setConfig([]);
      }
    } catch (err) {
      setError(`Error loading fault manager configuration: ${err.message}`);
      setConfig([]);
    } finally {
      setLoading(false);
    }
  };

  const getModuleIcon = (module) => {
    if (module.includes("cpumem")) {
      return "fas fa-microchip";
    }
    if (module.includes("disk")) {
      return "fas fa-hdd";
    }
    if (module.includes("zfs")) {
      return "fas fa-database";
    }
    if (module.includes("network")) {
      return "fas fa-network-wired";
    }
    return "fas fa-cog";
  };

  const getModuleTypeTag = (module) => {
    if (module.includes("retire")) {
      return "is-info";
    }
    if (module.includes("detector")) {
      return "is-warning";
    }
    if (module.includes("response")) {
      return "is-success";
    }
    return "is-light";
  };

  if (loading) {
    return (
      <div className="box">
        <div className="has-text-centered p-4">
          <span className="icon is-large">
            <i className="fas fa-spinner fa-spin fa-2x" />
          </span>
          <p className="mt-2">Loading fault manager configuration...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Error Display */}
      {error && (
        <div className="notification is-danger mb-4">
          <button className="delete" onClick={() => setError("")} />
          <p>{error}</p>
        </div>
      )}

      {/* Configuration Summary */}
      <div className="box mb-4">
        <div className="level is-mobile mb-3">
          <div className="level-left">
            <h4 className="title is-6">
              <span className="icon-text">
                <span className="icon">
                  <i className="fas fa-info-circle" />
                </span>
                <span>Fault Manager Status</span>
              </span>
            </h4>
          </div>
          <div className="level-right">
            <button
              className="button is-small is-info"
              onClick={loadConfig}
              disabled={loading}
            >
              <span className="icon">
                <i className="fas fa-sync-alt" />
              </span>
              <span>Refresh</span>
            </button>
          </div>
        </div>

        <div className="columns">
          <div className="column">
            <div className="field">
              <span className="label is-small">Total Modules</span>
              <p className="control">
                <span className="tag is-info is-medium">{config.length}</span>
              </p>
            </div>
          </div>
          <div className="column">
            <div className="field">
              <span className="label is-small">Module Types</span>
              <div className="control">
                <div className="tags">
                  {[
                    ...new Set(config.map((m) => m.module.split("-").pop())),
                  ].map((type, index) => (
                    <span key={index} className="tag is-light is-small">
                      {type}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <div className="column">
            <div className="field">
              <span className="label is-small">Status</span>
              <p className="control">
                <span className="tag is-success">
                  <span className="icon is-small">
                    <i className="fas fa-check-circle" />
                  </span>
                  <span>Active</span>
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Modules Table */}
      <div className="box">
        <h4 className="title is-6 mb-4">
          <span className="icon-text">
            <span className="icon">
              <i className="fas fa-puzzle-piece" />
            </span>
            <span>Fault Management Modules</span>
          </span>
        </h4>

        {config.length > 0 ? (
          <div className="table-container">
            <table className="table is-fullwidth is-hoverable">
              <thead>
                <tr>
                  <th>Module</th>
                  <th>Version</th>
                  <th>Description</th>
                  <th>Type</th>
                </tr>
              </thead>
              <tbody>
                {config.map((module, index) => (
                  <tr key={index}>
                    <td>
                      <div className="is-flex is-align-items-center">
                        <span className="icon has-text-info">
                          <i className={getModuleIcon(module.module)} />
                        </span>
                        <span className="ml-2 is-family-monospace has-text-weight-semibold">
                          {module.module}
                        </span>
                      </div>
                    </td>
                    <td>
                      <span className="tag is-light is-small">
                        v{module.version}
                      </span>
                    </td>
                    <td>
                      <span className="is-size-7">
                        {module.description || "No description available"}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`tag ${getModuleTypeTag(module.module)} is-small`}
                      >
                        {module.module.includes("retire")
                          ? "Retire Agent"
                          : module.module.includes("detector")
                            ? "Detector"
                            : module.module.includes("response")
                              ? "Response"
                              : "Module"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="has-text-centered p-4">
            <span className="icon is-large has-text-grey">
              <i className="fas fa-puzzle-piece fa-2x" />
            </span>
            <p className="mt-2 has-text-grey">No fault manager modules found</p>
          </div>
        )}
      </div>

      {/* Help Section */}
      <div className="box">
        <h4 className="title is-6 mb-3">
          <span className="icon-text">
            <span className="icon">
              <i className="fas fa-question-circle" />
            </span>
            <span>Fault Manager Information</span>
          </span>
        </h4>

        <div className="content is-small">
          <div className="columns">
            <div className="column">
              <p>
                <strong>Common Modules:</strong>
              </p>
              <ul>
                <li>
                  <strong>cpumem-retire:</strong> CPU and memory fault
                  retirement
                </li>
                <li>
                  <strong>disk-retire:</strong> Storage device fault retirement
                </li>
                <li>
                  <strong>zfs-retire:</strong> ZFS pool and dataset fault
                  management
                </li>
              </ul>
            </div>
            <div className="column">
              <p>
                <strong>Module Types:</strong>
              </p>
              <ul>
                <li>
                  <strong>Retire Agents:</strong> Handle faulty component
                  retirement
                </li>
                <li>
                  <strong>Detectors:</strong> Identify and diagnose faults
                </li>
                <li>
                  <strong>Response Agents:</strong> Automated fault response
                  actions
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

FaultManagerConfig.propTypes = {
  server: PropTypes.object.isRequired,
};

export default FaultManagerConfig;
