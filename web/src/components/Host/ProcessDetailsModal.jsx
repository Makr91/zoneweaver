import { useState, useEffect } from "react";

import { useServers } from "../../contexts/ServerContext";
import { ContentModal } from "../common";

const ProcessDetailsModal = ({ process, server, onClose }) => {
  const [activeTab, setActiveTab] = useState("basic");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [additionalData, setAdditionalData] = useState({
    files: null,
    limits: null,
    stack: null,
  });

  const { makeZoneweaverAPIRequest } = useServers();

  const loadAdditionalData = async (type) => {
    if (!server || !makeZoneweaverAPIRequest || additionalData[type] !== null) {
      return;
    }

    try {
      setLoading(true);
      setError("");

      const result = await makeZoneweaverAPIRequest(
        server.hostname,
        server.port,
        server.protocol,
        `system/processes/${process.pid}/${type}`,
        "GET"
      );

      if (result.success) {
        setAdditionalData((prev) => ({
          ...prev,
          [type]: result.data,
        }));
      } else {
        setError(result.message || `Failed to load ${type} data`);
      }
    } catch (err) {
      setError(`Error loading ${type} data: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "files" && additionalData.files === null) {
      loadAdditionalData("files");
    } else if (activeTab === "limits" && additionalData.limits === null) {
      loadAdditionalData("limits");
    } else if (activeTab === "stack" && additionalData.stack === null) {
      loadAdditionalData("stack");
    }
  }, [activeTab]);

  const formatMemory = (bytes) => {
    if (!bytes) {
      return "N/A";
    }
    const kb = bytes / 1024;
    const mb = kb / 1024;
    const gb = mb / 1024;

    if (gb >= 1) {
      return `${gb.toFixed(2)} GB (${bytes} bytes)`;
    }
    if (mb >= 1) {
      return `${mb.toFixed(2)} MB (${bytes} bytes)`;
    }
    if (kb >= 1) {
      return `${kb.toFixed(2)} KB (${bytes} bytes)`;
    }
    return `${bytes} bytes`;
  };

  const formatBasicDetails = (details) => {
    if (!details) {
      return [];
    }

    return [
      { label: "Process ID", value: details.pid },
      { label: "Parent PID", value: details.ppid || "N/A" },
      { label: "Zone", value: details.zone || "N/A" },
      { label: "User ID", value: details.uid || "N/A" },
      { label: "Virtual Size", value: formatMemory(details.vsz) },
      { label: "Resident Size", value: formatMemory(details.rss) },
      { label: "Command", value: details.command || "N/A" },
    ];
  };

  const renderBasicTab = () => {
    const basicDetails = formatBasicDetails(process.details);

    return (
      <div>
        <div className="box mb-4">
          <h4 className="title is-6">Process Information</h4>
          <div className="table-container">
            <table className="table is-fullwidth">
              <tbody>
                {basicDetails.map((detail, index) => (
                  <tr key={index}>
                    <td>
                      <strong>{detail.label}</strong>
                    </td>
                    <td className="is-family-monospace">{detail.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {process.details?.open_files_sample && (
          <div className="box">
            <h4 className="title is-6">Open Files Sample</h4>
            <pre className="is-size-7 p-3 has-background-light">
              {process.details.open_files_sample}
            </pre>
          </div>
        )}
      </div>
    );
  };

  const renderFilesTab = () => {
    if (loading && !additionalData.files) {
      return (
        <div className="has-text-centered p-4">
          <span className="icon is-large">
            <i className="fas fa-spinner fa-spin fa-2x" />
          </span>
          <p className="mt-2">Loading open files...</p>
        </div>
      );
    }

    if (!additionalData.files || additionalData.files.length === 0) {
      return (
        <div className="notification is-info">
          <p>No open files information available or no files found.</p>
        </div>
      );
    }

    return (
      <div className="box">
        <h4 className="title is-6">Open File Descriptors</h4>
        <div className="table-container">
          <table className="table is-fullwidth is-hoverable">
            <thead>
              <tr>
                <th>FD</th>
                <th>Description</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {additionalData.files.map((file, index) => (
                <tr key={index}>
                  <td className="is-family-monospace">{file.fd}</td>
                  <td className="is-family-monospace is-size-7">
                    {file.description}
                  </td>
                  <td className="is-family-monospace is-size-7">
                    {file.details}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderLimitsTab = () => {
    if (loading && !additionalData.limits) {
      return (
        <div className="has-text-centered p-4">
          <span className="icon is-large">
            <i className="fas fa-spinner fa-spin fa-2x" />
          </span>
          <p className="mt-2">Loading resource limits...</p>
        </div>
      );
    }

    if (!additionalData.limits) {
      return (
        <div className="notification is-info">
          <p>No resource limits information available.</p>
        </div>
      );
    }

    return (
      <div className="box">
        <h4 className="title is-6">Resource Limits</h4>
        <div className="table-container">
          <table className="table is-fullwidth">
            <thead>
              <tr>
                <th>Resource</th>
                <th>Limit</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(additionalData.limits).map(
                ([resource, limit], index) => (
                  <tr key={index}>
                    <td>
                      <strong>{resource}</strong>
                    </td>
                    <td className="is-family-monospace">{limit}</td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderStackTab = () => {
    if (loading && !additionalData.stack) {
      return (
        <div className="has-text-centered p-4">
          <span className="icon is-large">
            <i className="fas fa-spinner fa-spin fa-2x" />
          </span>
          <p className="mt-2">Loading stack trace...</p>
        </div>
      );
    }

    if (!additionalData.stack) {
      return (
        <div className="notification is-info">
          <p>No stack trace information available.</p>
        </div>
      );
    }

    return (
      <div className="box">
        <h4 className="title is-6">Process Stack Trace</h4>
        <pre
          className="is-size-7 p-3 has-background-light"
          style={{ maxHeight: "400px", overflow: "auto" }}
        >
          {typeof additionalData.stack === "string"
            ? additionalData.stack
            : JSON.stringify(additionalData.stack, null, 2)}
        </pre>
      </div>
    );
  };

  const tabs = [
    { key: "basic", label: "Basic Info", icon: "fa-info-circle" },
    { key: "files", label: "Open Files", icon: "fa-folder-open" },
    { key: "limits", label: "Resource Limits", icon: "fa-chart-bar" },
    { key: "stack", label: "Stack Trace", icon: "fa-layer-group" },
  ];

  return (
    <ContentModal
      isOpen
      onClose={onClose}
      title={`Process Details - PID ${process.pid}`}
      icon="fas fa-tasks"
      className="is-large"
    >
      {/* Error Display */}
      {error && (
        <div className="notification is-danger mb-4">
          <button className="delete" onClick={() => setError("")} />
          <p>{error}</p>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="tabs is-boxed mb-0">
        <ul>
          {tabs.map((tab) => (
            <li
              key={tab.key}
              className={activeTab === tab.key ? "is-active" : ""}
            >
              <a onClick={() => setActiveTab(tab.key)}>
                <span className="icon is-small">
                  <i className={`fas ${tab.icon}`} />
                </span>
                <span>{tab.label}</span>
              </a>
            </li>
          ))}
        </ul>
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {activeTab === "basic" && renderBasicTab()}
        {activeTab === "files" && renderFilesTab()}
        {activeTab === "limits" && renderLimitsTab()}
        {activeTab === "stack" && renderStackTab()}
      </div>
    </ContentModal>
  );
};

export default ProcessDetailsModal;
