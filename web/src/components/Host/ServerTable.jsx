import React, { useState } from "react";

const ServerTable = ({ servers, onEdit, onDelete, loading }) => {
  const [copiedKey, setCopiedKey] = useState(null);

  // Mask API key for security (show first 6 and last 4 characters)
  const maskApiKey = (apiKey) => {
    if (!apiKey || apiKey.length < 10) {
      return "Not Set";
    }
    const start = apiKey.substring(0, 6);
    const end = apiKey.substring(apiKey.length - 4);
    return `${start}...${end}`;
  };

  // Copy API key to clipboard
  const copyApiKey = async (apiKey, serverId) => {
    if (!apiKey) {
      return;
    }

    try {
      await navigator.clipboard.writeText(apiKey);
      setCopiedKey(serverId);
      setTimeout(() => setCopiedKey(null), 2000);
    } catch (error) {
      console.error("Failed to copy API key:", error);
    }
  };
  if (servers.length === 0) {
    return (
      <div className="has-text-centered p-6">
        <div className="icon is-large mb-3 has-text-grey">
          <i className="fas fa-server fa-3x" />
        </div>
        <h3 className="title is-4 has-text-grey">No Servers Configured</h3>
        <p className="has-text-grey mb-4">
          You haven't added any Zoneweaver API Servers yet. Add a server to
          start managing zones.
        </p>
      </div>
    );
  }

  return (
    <div className="table-container">
      <table className="table is-fullwidth is-striped is-hoverable">
        <thead>
          <tr>
            <th>No</th>
            <th>Hostname</th>
            <th>Protocol</th>
            <th>Port</th>
            <th>Entity Name</th>
            <th>API Key</th>
            <th>Last Used</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {servers.map((server, index) => (
            <tr key={`${server.hostname}:${server.port}`}>
              <td>{index + 1}</td>
              <td>
                <strong>
                  {server.hostname || server.serverHostname || "No hostname"}
                </strong>
                {!server.hostname && !server.serverHostname && (
                  <small className="has-text-danger is-block">
                    Missing hostname data - Check console
                  </small>
                )}
              </td>
              <td>{server.protocol}</td>
              <td>{server.port}</td>
              <td>{server.entityName}</td>
              <td>
                <div className="field has-addons">
                  {server.api_key && (
                    <div className="control">
                      <button
                        className={`button is-small ${copiedKey === server.id ? "is-success" : "is-light"}`}
                        onClick={() => copyApiKey(server.api_key, server.id)}
                        title={
                          copiedKey === server.id ? "Copied!" : "Copy API Key"
                        }
                        disabled={loading}
                      >
                        <span className="icon is-small">
                          <i
                            className={`fas ${copiedKey === server.id ? "fa-check" : "fa-copy"}`}
                          />
                        </span>
                      </button>
                    </div>
                  )}
                  <div className="control">
                    <span className="tag is-light is-medium">
                      {maskApiKey(server.api_key)}
                    </span>
                  </div>
                </div>
              </td>
              <td>
                {server.lastUsed
                  ? new Date(server.lastUsed).toLocaleDateString()
                  : "Never"}
              </td>
              <td>
                <div className="buttons are-small">
                  <button
                    className="button is-small is-warning"
                    onClick={() => onEdit(server.hostname)}
                    disabled={loading}
                    title="Edit Server"
                  >
                    <span className="icon">
                      <i className="fas fa-edit" />
                    </span>
                  </button>
                  <button
                    className="button is-small is-danger"
                    onClick={() => onDelete(server.id)}
                    disabled={loading}
                    title="Remove Server"
                  >
                    <span className="icon">
                      <i className="fas fa-trash" />
                    </span>
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ServerTable;
