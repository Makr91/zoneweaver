import PropTypes from "prop-types";
import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";

import { ConfirmModal } from "../common";
import ServerForm from "../Host/ServerForm";
import ServerHelpPanel from "../Host/ServerHelpPanel";
import ServerStatusCard from "../Host/ServerStatusCard";
import ServerTable from "../Host/ServerTable";

/**
 * ServerManagementTab - Server management UI for Zoneweaver Settings
 * Handles adding, editing, deleting, and testing Zoneweaver API servers
 */
const ServerManagementTab = ({
  servers,
  showAddForm,
  setShowAddForm,
  hostname,
  setHostname,
  port,
  setPort,
  protocol,
  setProtocol,
  entityName,
  setEntityName,
  apiKey,
  setApiKey,
  useExistingApiKey,
  setUseExistingApiKey,
  testResult,
  setTestResult,
  setMsg,
  serverContext,
}) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const { removeServer, addServer, testServer, refreshServers, selectServer } =
    serverContext;

  // Reset form to initial state
  const resetForm = useCallback(() => {
    setHostname("");
    setPort("5001");
    setProtocol("https");
    setEntityName("Zoneweaver-Production");
    setApiKey("");
    setUseExistingApiKey(false);
    setTestResult(null);
    setMsg("");
  }, [
    setHostname,
    setPort,
    setProtocol,
    setEntityName,
    setApiKey,
    setUseExistingApiKey,
    setTestResult,
    setMsg,
  ]);

  // Handle server deletion
  const handleDeleteServer = useCallback(
    async (serverId) => {
      try {
        setLoading(true);
        setMsg("");
        const result = await removeServer(serverId);
        if (result.success) {
          setMsg("Server removed successfully!");
        } else {
          setMsg(result.message || "Failed to remove server");
        }
      } catch {
        setMsg("Error removing server. Please try again.");
      } finally {
        setLoading(false);
        setConfirmDelete(null);
      }
    },
    [removeServer, setMsg]
  );

  // Handle server editing
  const handleEditServer = useCallback(
    (serverHostname) => {
      const server = servers.find((s) => s.hostname === serverHostname);
      if (server) {
        selectServer(server);
        navigate("/ui/host-manage");
      }
    },
    [servers, selectServer, navigate]
  );

  // Handle connection test
  const handleTestConnection = useCallback(async () => {
    if (!hostname || !port || !protocol) {
      setMsg("Please fill in hostname, port, and protocol first");
      return;
    }
    try {
      setLoading(true);
      setMsg("Testing connection...");
      setTestResult(null);
      const result = await testServer({
        hostname,
        port: parseInt(port),
        protocol,
      });
      if (result.success) {
        setTestResult("success");
        setMsg(
          "Connection test successful! Server is reachable and ready for bootstrap."
        );
      } else {
        setTestResult("error");
        setMsg(`Connection test failed: ${result.message}`);
      }
    } catch {
      setTestResult("error");
      setMsg("Connection test failed. Please check your server details.");
    } finally {
      setLoading(false);
    }
  }, [hostname, port, protocol, testServer, setMsg, setTestResult]);

  // Handle server addition
  const handleAddServer = useCallback(
    async (e) => {
      e.preventDefault();
      if (!hostname || !port || !protocol) {
        setMsg("Hostname, port, and protocol are required");
        return;
      }
      if (useExistingApiKey && !apiKey) {
        setMsg("API key is required when using existing API key option");
        return;
      }
      if (!useExistingApiKey && !entityName) {
        setMsg("Entity name is required when bootstrapping");
        return;
      }
      const isDuplicate = servers.some(
        (server) =>
          server.hostname === hostname &&
          server.port === parseInt(port) &&
          server.protocol === protocol
      );
      if (isDuplicate) {
        setTestResult("error");
        setMsg(
          `Server ${protocol}://${hostname}:${port} is already registered.`
        );
        return;
      }
      try {
        setLoading(true);
        setMsg("");
        setTestResult(null);
        const serverData = {
          hostname,
          port: parseInt(port),
          protocol,
          entityName: entityName || "Zoneweaver-Production",
        };
        if (useExistingApiKey) {
          serverData.apiKey = apiKey;
        }
        const result = await addServer(serverData);
        if (result.success) {
          setTestResult("success");
          setMsg("Server added successfully! Refreshing servers...");
          await refreshServers();
          setShowAddForm(false);
          resetForm();
        } else {
          setTestResult("error");
          setMsg(result.message);
        }
      } catch {
        setTestResult("error");
        setMsg("An unexpected error occurred. Please try again.");
      } finally {
        setLoading(false);
      }
    },
    [
      hostname,
      port,
      protocol,
      useExistingApiKey,
      apiKey,
      entityName,
      servers,
      addServer,
      refreshServers,
      setShowAddForm,
      resetForm,
      setMsg,
      setTestResult,
    ]
  );

  return (
    <>
      {/* Server Management Header */}
      <div className="level is-mobile mb-4">
        <div className="level-left">
          <h2 className="title is-5">Zoneweaver API Servers</h2>
        </div>
        <div className="level-right">
          <button
            className="button is-primary"
            onClick={() => {
              setShowAddForm(!showAddForm);
              if (!showAddForm) {
                resetForm();
              }
            }}
          >
            <span className="icon">
              <i className={`fas fa-${showAddForm ? "times" : "plus"}`} />
            </span>
            <span>{showAddForm ? "Cancel" : "Add Server"}</span>
          </button>
        </div>
      </div>

      {/* Add Server Form or Server Table */}
      {showAddForm ? (
        <form onSubmit={handleAddServer} autoComplete="off">
          <div className="columns">
            <div className="column is-8">
              <ServerForm
                hostname={hostname}
                setHostname={setHostname}
                port={port}
                setPort={setPort}
                protocol={protocol}
                setProtocol={setProtocol}
                entityName={entityName}
                setEntityName={setEntityName}
                apiKey={apiKey}
                setApiKey={setApiKey}
                useExistingApiKey={useExistingApiKey}
                setUseExistingApiKey={setUseExistingApiKey}
                loading={loading}
              />
            </div>
            <div className="column is-4">
              <ServerHelpPanel useExistingApiKey={useExistingApiKey} />
              <ServerStatusCard
                testResult={testResult}
                useExistingApiKey={useExistingApiKey}
              />
            </div>
          </div>
          <div className="buttons is-centered">
            <button
              type="button"
              className={`button is-info ${loading ? "is-loading" : ""}`}
              onClick={handleTestConnection}
              disabled={loading}
            >
              Test Connection
            </button>
            <button
              type="submit"
              className={`button is-primary ${loading ? "is-loading" : ""}`}
              disabled={loading}
            >
              {useExistingApiKey ? "Add Server" : "Bootstrap Server"}
            </button>
          </div>
        </form>
      ) : (
        <ServerTable
          servers={servers}
          onEdit={handleEditServer}
          onDelete={(serverId) => {
            setConfirmDelete(serverId);
          }}
          loading={loading}
        />
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmDelete !== null}
        onClose={() => {
          setConfirmDelete(null);
        }}
        onConfirm={() => {
          handleDeleteServer(confirmDelete);
        }}
        title="Remove Server"
        message="Are you sure you want to remove this server? This will remove the server connection."
        confirmText="Remove Server"
        confirmVariant="is-danger"
        icon="fas fa-trash"
        loading={loading}
      />
    </>
  );
};

ServerManagementTab.propTypes = {
  servers: PropTypes.array.isRequired,
  showAddForm: PropTypes.bool.isRequired,
  setShowAddForm: PropTypes.func.isRequired,
  hostname: PropTypes.string.isRequired,
  setHostname: PropTypes.func.isRequired,
  port: PropTypes.string.isRequired,
  setPort: PropTypes.func.isRequired,
  protocol: PropTypes.string.isRequired,
  setProtocol: PropTypes.func.isRequired,
  entityName: PropTypes.string.isRequired,
  setEntityName: PropTypes.func.isRequired,
  apiKey: PropTypes.string.isRequired,
  setApiKey: PropTypes.func.isRequired,
  useExistingApiKey: PropTypes.bool.isRequired,
  setUseExistingApiKey: PropTypes.func.isRequired,
  testResult: PropTypes.string,
  setTestResult: PropTypes.func.isRequired,
  setMsg: PropTypes.func.isRequired,
  serverContext: PropTypes.shape({
    removeServer: PropTypes.func.isRequired,
    addServer: PropTypes.func.isRequired,
    testServer: PropTypes.func.isRequired,
    refreshServers: PropTypes.func.isRequired,
    selectServer: PropTypes.func.isRequired,
  }).isRequired,
};

export default ServerManagementTab;
