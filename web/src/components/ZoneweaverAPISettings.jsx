import { Helmet } from "@dr.pogodin/react-helmet";
import { useState, useEffect, useCallback } from "react";

import { useAuth } from "../contexts/AuthContext";
import { useServers } from "../contexts/ServerContext";
import { useHostSystemManagement } from "../hooks/useHostSystemManagement";
import { canManageSettings } from "../utils/permissions";

import ApiKeysTab from "./ApiKeysTab";
import { ContentModal, FormModal } from "./common";

// Helper function moved outside component
const organizeBySection = (settingsData) => {
  const sections = [];

  const collectSectionContent = (obj, basePath = []) => {
    const content = [];

    Object.entries(obj).forEach(([key, value]) => {
      if (
        typeof value === "object" &&
        value !== null &&
        !Array.isArray(value)
      ) {
        // This is a subsection
        content.push({
          type: "subsection",
          name: key,
          fields: collectSectionContent(value, [...basePath, key]),
        });
      } else {
        // This is a field
        content.push({
          type: "field",
          key,
          value,
          path: [...basePath, key],
        });
      }
    });

    return content;
  };

  Object.entries(settingsData).forEach(([key, value]) => {
    if (typeof value === "object" && value !== null && !Array.isArray(value)) {
      sections.push({
        name: key,
        content: collectSectionContent(value, [key]),
      });
    }
  });

  return sections;
};

const ZoneweaverAPISettings = () => {
  const { user } = useAuth();
  const { currentServer, makeZoneweaverAPIRequest } = useServers();
  const [settings, setSettings] = useState(null);
  const [backups, setBackups] = useState([]);
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState(null);

  // Zone orchestration state
  const [orchestrationStatus, setOrchestrationStatus] = useState(null);
  const [zonePriorities, setZonePriorities] = useState(null);
  const [orchestrationLoading, setOrchestrationLoading] = useState(false);

  // Confirmation Modal State
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: null,
    confirmText: "Confirm",
    variant: "is-primary",
  });

  const [showBackupModal, setShowBackupModal] = useState(false);

  // Hook for orchestration functions
  const {
    getZoneOrchestrationStatus,
    enableZoneOrchestration,
    disableZoneOrchestration,
    getZonePriorities,
    testZoneOrchestration,
  } = useHostSystemManagement();

  const loadSettings = useCallback(async () => {
    if (!currentServer) {
      return;
    }
    try {
      setLoading(true);
      const response = await makeZoneweaverAPIRequest(
        currentServer.hostname,
        currentServer.port,
        currentServer.protocol,
        "settings"
      );

      if (response.success) {
        setSettings(response.data);
        // Set the first tab as active if none is selected
        const sections = organizeBySection(response.data);
        if (!activeTab && sections.length > 0) {
          setActiveTab(sections[0].name);
        }
      } else {
        setMsg(`Failed to load settings: ${response.message}`);
      }
    } catch (error) {
      console.error("Error loading settings:", error);
      setMsg(
        `Error loading settings: ${
          error.response?.data?.message || error.message
        }`
      );
    } finally {
      setLoading(false);
    }
  }, [currentServer, makeZoneweaverAPIRequest, activeTab]);

  const loadBackups = useCallback(async () => {
    if (!currentServer) {
      return;
    }
    try {
      const response = await makeZoneweaverAPIRequest(
        currentServer.hostname,
        currentServer.port,
        currentServer.protocol,
        "settings/backups"
      );
      if (response.success) {
        setBackups(response.data);
      }
    } catch (error) {
      console.error("Error loading backups:", error);
    }
  }, [currentServer, makeZoneweaverAPIRequest]);

  // Zone orchestration functions
  const loadOrchestrationStatus = useCallback(async () => {
    if (!currentServer) {
      return;
    }

    try {
      const result = await getZoneOrchestrationStatus(
        currentServer.hostname,
        currentServer.port,
        currentServer.protocol
      );

      if (result.success) {
        setOrchestrationStatus(result.data);
      }
    } catch (error) {
      console.error("Error loading orchestration status:", error);
    }
  }, [currentServer, getZoneOrchestrationStatus]);

  const loadZonePriorities = useCallback(async () => {
    if (!currentServer) {
      return;
    }

    try {
      const result = await getZonePriorities(
        currentServer.hostname,
        currentServer.port,
        currentServer.protocol
      );

      if (result.success) {
        setZonePriorities(result.data);
      }
    } catch (error) {
      console.error("Error loading zone priorities:", error);
    }
  }, [currentServer, getZonePriorities]);

  // Load settings on component mount
  useEffect(() => {
    if (user && canManageSettings(user.role) && currentServer) {
      loadSettings();
      loadBackups();
    }
  }, [user, currentServer, loadSettings, loadBackups]);

  // Load orchestration data when component mounts or server changes
  useEffect(() => {
    if (currentServer && user && canManageSettings(user.role)) {
      loadOrchestrationStatus();
      loadZonePriorities();
    }
  }, [currentServer, user, loadOrchestrationStatus, loadZonePriorities]);

  const handleSettingChange = (path, value) => {
    setSettings((prev) => {
      const newSettings = { ...prev };
      let current = newSettings;
      for (let i = 0; i < path.length - 1; i++) {
        current = current[path[i]];
      }
      current[path[path.length - 1]] = value;
      return newSettings;
    });
  };

  const saveSettings = async () => {
    if (!currentServer) {
      return;
    }
    setLoading(true);
    setMsg("");

    try {
      const response = await makeZoneweaverAPIRequest(
        currentServer.hostname,
        currentServer.port,
        currentServer.protocol,
        "settings",
        "PUT",
        settings
      );

      if (response.success) {
        setMsg("Settings saved successfully.");
      } else {
        setMsg(`Failed to save settings: ${response.message}`);
      }
    } catch (error) {
      console.error("Error saving settings:", error);
      setMsg(
        `Error saving settings: ${
          error.response?.data?.message || error.message
        }`
      );
    } finally {
      setLoading(false);
    }
  };

  const performRestoreBackup = async (filename) => {
    try {
      setLoading(true);
      setMsg("");

      const response = await makeZoneweaverAPIRequest(
        currentServer.hostname,
        currentServer.port,
        currentServer.protocol,
        `settings/restore/${filename}`,
        "POST"
      );

      if (response.success) {
        setMsg("Backup restored successfully.");
        await loadSettings();
      } else {
        setMsg(`Failed to restore backup: ${response.message}`);
      }
    } catch (error) {
      console.error("Error restoring backup:", error);
      setMsg(
        `Error restoring backup: ${
          error.response?.data?.message || error.message
        }`
      );
    } finally {
      setLoading(false);
      setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
    }
  };

  const requestRestoreBackup = (filename) => {
    if (!currentServer) {
      return;
    }
    setConfirmDialog({
      isOpen: true,
      title: "Restore Backup",
      message: `Are you sure you want to restore the configuration from ${filename}? This will overwrite current settings.`,
      onConfirm: () => performRestoreBackup(filename),
      confirmText: "Restore",
      variant: "is-warning",
    });
  };

  const performRestartServer = async () => {
    try {
      setLoading(true);
      setMsg("Initiating server restart...");

      const response = await makeZoneweaverAPIRequest(
        currentServer.hostname,
        currentServer.port,
        currentServer.protocol,
        "server/restart",
        "POST"
      );

      if (response.success) {
        setMsg("Server restart initiated.");
      } else {
        setMsg(`Failed to restart server: ${response.message}`);
      }
    } catch (error) {
      console.error("Error restarting server:", error);
      setMsg(
        `Error restarting server: ${
          error.response?.data?.message || error.message
        }`
      );
    } finally {
      setLoading(false);
      setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
    }
  };

  const requestRestartServer = () => {
    if (!currentServer) {
      return;
    }
    setConfirmDialog({
      isOpen: true,
      title: "Restart Server",
      message: "Are you sure you want to restart the Zoneweaver server?",
      onConfirm: performRestartServer,
      confirmText: "Restart",
      variant: "is-danger",
    });
  };

  const performDeleteBackup = async (filename) => {
    try {
      setLoading(true);
      setMsg("");

      const response = await makeZoneweaverAPIRequest(
        currentServer.hostname,
        currentServer.port,
        currentServer.protocol,
        `settings/backups/${filename}`,
        "DELETE"
      );

      if (response.success) {
        setMsg("Backup deleted successfully.");
        await loadBackups(); // Refresh the list
      } else {
        setMsg(`Failed to delete backup: ${response.message}`);
      }
    } catch (error) {
      console.error("Error deleting backup:", error);
      setMsg(
        `Error deleting backup: ${
          error.response?.data?.message || error.message
        }`
      );
    } finally {
      setLoading(false);
      setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
    }
  };

  const requestDeleteBackup = (filename) => {
    if (!currentServer) {
      return;
    }
    setConfirmDialog({
      isOpen: true,
      title: "Delete Backup",
      message: `Are you sure you want to permanently delete the backup ${filename}? This action cannot be undone.`,
      onConfirm: () => performDeleteBackup(filename),
      confirmText: "Delete",
      variant: "is-danger",
    });
  };

  const createBackup = async () => {
    try {
      setLoading(true);
      setMsg("Creating backup...");

      // Trigger a save which creates a backup automatically
      await saveSettings();
      await loadBackups();
      setMsg("Backup created successfully");
    } catch (error) {
      console.error("Error creating backup:", error);
      setMsg(
        `Error creating backup: ${
          error.response?.data?.message || error.message
        }`
      );
    } finally {
      setLoading(false);
    }
  };

  const handleEnableOrchestration = async () => {
    if (!currentServer) {
      return;
    }

    try {
      setOrchestrationLoading(true);
      const result = await enableZoneOrchestration(
        currentServer.hostname,
        currentServer.port,
        currentServer.protocol
      );

      if (result.success) {
        setMsg("Zone orchestration enabled successfully");
        await loadOrchestrationStatus();
      } else {
        setMsg(`Failed to enable orchestration: ${result.message}`);
      }
    } catch (error) {
      console.error("Error enabling orchestration:", error);
      setMsg("Error enabling zone orchestration");
    } finally {
      setOrchestrationLoading(false);
    }
  };

  const handleDisableOrchestration = async () => {
    if (!currentServer) {
      return;
    }

    try {
      setOrchestrationLoading(true);
      const result = await disableZoneOrchestration(
        currentServer.hostname,
        currentServer.port,
        currentServer.protocol
      );

      if (result.success) {
        setMsg("Zone orchestration disabled successfully");
        await loadOrchestrationStatus();
      } else {
        setMsg(`Failed to disable orchestration: ${result.message}`);
      }
    } catch (error) {
      console.error("Error disabling orchestration:", error);
      setMsg("Error disabling zone orchestration");
    } finally {
      setOrchestrationLoading(false);
    }
  };

  const handleTestOrchestration = async (strategy = "parallel_by_priority") => {
    if (!currentServer) {
      return;
    }

    try {
      setOrchestrationLoading(true);
      const result = await testZoneOrchestration(
        currentServer.hostname,
        currentServer.port,
        currentServer.protocol,
        strategy
      );

      if (result.success) {
        setMsg(
          `Orchestration test completed: ${result.data.total_zones} zones, estimated ${result.data.estimated_duration}s duration`
        );
        console.log("Orchestration test result:", result.data);
      } else {
        setMsg(`Failed to test orchestration: ${result.message}`);
      }
    } catch (error) {
      console.error("Error testing orchestration:", error);
      setMsg("Error testing zone orchestration");
    } finally {
      setOrchestrationLoading(false);
    }
  };

  // Check if a section is orchestration-related
  const isOrchestrationSection = (sectionName) =>
    sectionName === "zones" ||
    sectionName.includes("orchestration") ||
    sectionName.includes("zone_management");

  // Render orchestration control panel
  const renderOrchestrationControls = () => (
    <div className="box mb-4 is-dark">
      <h4 className="title is-6 mb-3">
        <span className="icon-text">
          <span className="icon has-text-info">
            <i className="fas fa-layer-group" />
          </span>
          <span>Zone Orchestration Control</span>
        </span>
      </h4>

      <div className="columns">
        <div className="column is-half">
          <div className="field">
            <p className="label is-size-7">Status</p>
            <div className="control">
              <span
                className={`tag ${orchestrationStatus?.orchestration_enabled ? "is-success" : "is-grey"}`}
              >
                {orchestrationStatus?.orchestration_enabled
                  ? "🟢 Enabled"
                  : "🔴 Disabled"}
              </span>
              <span className="tag is-info ml-2">
                Controller: {orchestrationStatus?.controller || "unknown"}
              </span>
            </div>
          </div>
        </div>
        <div className="column is-half">
          <div className="field is-grouped">
            <div className="control">
              <button
                className="button is-small is-success"
                onClick={handleEnableOrchestration}
                disabled={
                  orchestrationLoading ||
                  orchestrationStatus?.orchestration_enabled
                }
              >
                <span className="icon is-small">
                  <i className="fas fa-play" />
                </span>
                <span>Enable</span>
              </button>
            </div>
            <div className="control">
              <button
                className="button is-small is-warning"
                onClick={handleDisableOrchestration}
                disabled={
                  orchestrationLoading ||
                  !orchestrationStatus?.orchestration_enabled
                }
              >
                <span className="icon is-small">
                  <i className="fas fa-pause" />
                </span>
                <span>Disable</span>
              </button>
            </div>
            <div className="control">
              <button
                className="button is-small is-info"
                onClick={() => handleTestOrchestration()}
                disabled={orchestrationLoading}
              >
                <span className="icon is-small">
                  <i className="fas fa-vial" />
                </span>
                <span>Test</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {zonePriorities && (
        <div className="mt-4">
          <p className="label is-size-7">Zone Priorities</p>
          <div className="field">
            <div className="control">
              <div className="tags">
                {Object.entries(zonePriorities.priority_groups || {}).map(
                  ([priority, zones]) => (
                    <span key={priority} className="tag is-light">
                      Priority {priority}: {zones.length} zones
                    </span>
                  )
                )}
              </div>
            </div>
          </div>
          <p className="help">
            Total zones: {zonePriorities.total_zones || 0} |
            <button
              className="button is-text is-small p-0 ml-1"
              onClick={loadZonePriorities}
              disabled={orchestrationLoading}
            >
              Refresh
            </button>
          </p>
        </div>
      )}
    </div>
  );

  if (!user || !canManageSettings(user.role)) {
    return <div>Access Denied</div>;
  }

  const renderField = (item, isIndented = false) => {
    const { key, value, path } = item;
    const fieldId = path.join(".");

    let inputElement;
    if (typeof value === "boolean") {
      inputElement = (
        <label className="switch is-medium">
          <input
            id={fieldId}
            type="checkbox"
            checked={value}
            onChange={(e) => handleSettingChange(path, e.target.checked)}
          />
          <span className="check" />
          <span className="control-label">
            {key.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
          </span>
        </label>
      );
    } else if (Array.isArray(value)) {
      inputElement = (
        <textarea
          id={fieldId}
          className="textarea is-small"
          rows="10"
          value={value.join("\n")}
          onChange={(e) =>
            handleSettingChange(path, e.target.value.split("\n"))
          }
        />
      );
    } else {
      inputElement = (
        <input
          id={fieldId}
          className="input is-small"
          type={typeof value === "number" ? "number" : "text"}
          value={value}
          onChange={(e) =>
            handleSettingChange(
              path,
              typeof value === "number"
                ? Number(e.target.value)
                : e.target.value
            )
          }
        />
      );
    }

    return (
      <div key={fieldId} className="field is-horizontal mb-1">
        <div
          className={`field-label is-small is-flex-grow-0 ${
            isIndented ? "pl-5" : "pl-0"
          }`}
        >
          <label className="label is-size-7 has-text-left" htmlFor={fieldId}>
            {key.replace(/_/g, " ")}
          </label>
        </div>
        <div className="field-body">
          <div className="field">
            <div className="control">{inputElement}</div>
          </div>
        </div>
      </div>
    );
  };

  const renderSectionContent = (content) =>
    content.map((item) => {
      if (item.type === "subsection") {
        return (
          <div key={item.name} className="mb-4">
            <h5 className="subtitle is-6 has-text-weight-semibold has-text-grey mb-2">
              {item.name
                .replace(/_/g, " ")
                .replace(/\b\w/g, (l) => l.toUpperCase())}
            </h5>
            <div className="ml-4">{renderSectionContent(item.fields)}</div>
          </div>
        );
      }
      return renderField(item, false);
    });

  return (
    <div className="zw-page-content-scrollable">
      <Helmet>
        <meta charSet="utf-8" />
        <title>Zoneweaver API Settings - Zoneweaver</title>
        <link rel="canonical" href={window.location.origin} />
      </Helmet>
      {/* Use consistent toggle switch styling with main Zoneweaver settings */}
      <div className="container is-fluid p-0">
        <div className="box p-0 is-radiusless">
          <div className="titlebar box active level is-mobile mb-0 p-3">
            <div className="level-left">
              <strong>Zoneweaver API System Settings</strong>
            </div>
            <div className="level-right">
              <button
                className="button is-small is-primary mr-2"
                onClick={saveSettings}
                disabled={loading || !settings}
              >
                <span className="icon is-small">
                  <i className="fas fa-save" />
                </span>
                <span>Save</span>
              </button>
              <button
                className="button is-small is-info mr-2"
                onClick={createBackup}
                disabled={loading}
              >
                <span className="icon is-small">
                  <i className="fas fa-download" />
                </span>
                <span>Backup</span>
              </button>
              <button
                className="button is-small is-warning mr-2"
                onClick={() => setShowBackupModal(true)}
                disabled={loading}
              >
                <span className="icon is-small">
                  <i className="fas fa-history" />
                </span>
                <span>Restore</span>
              </button>
              <button
                className="button is-small is-danger"
                onClick={requestRestartServer}
                disabled={loading}
              >
                <span className="icon is-small">
                  <i className="fas fa-redo" />
                </span>
                <span>Restart</span>
              </button>
            </div>
          </div>
          <div className="px-4">
            {msg && <div className="notification is-infopy-2 mb-3">{msg}</div>}
            {!currentServer && (
              <div className="notification is-warning">
                Please select a host from the navbar to manage its settings.
              </div>
            )}
            {loading && <p className="has-text-grey">Loading...</p>}
            {settings && currentServer && (
              <>
                <div className="tabs is-boxed is-small">
                  <ul>
                    {organizeBySection(settings).map((section) => (
                      <li
                        key={section.name}
                        className={
                          activeTab === section.name ? "is-active" : ""
                        }
                      >
                        <button
                          className="button is-ghost"
                          onClick={() => setActiveTab(section.name)}
                          style={{ textDecoration: "none" }}
                        >
                          <span>
                            {section.name
                              .replace(/_/g, " ")
                              .replace(/\b\w/g, (l) => l.toUpperCase())}
                          </span>
                        </button>
                      </li>
                    ))}
                    <li
                      className={
                        activeTab === "api_management" ? "is-active" : ""
                      }
                    >
                      <button
                        className="button is-ghost"
                        onClick={() => setActiveTab("api_management")}
                        style={{ textDecoration: "none" }}
                      >
                        <span>API Management</span>
                      </button>
                    </li>
                  </ul>
                </div>

                <div className="tab-content">
                  {organizeBySection(settings).map((section) => (
                    <div
                      key={section.name}
                      className={`tab-pane ${activeTab !== section.name ? "is-hidden" : ""}`}
                    >
                      {/* Special handling for orchestration sections */}
                      {isOrchestrationSection(section.name) &&
                        renderOrchestrationControls()}

                      {section.name === "host_monitoring" ? (
                        <div className="columns">
                          <div className="column is-8">
                            {renderSectionContent(section.content)}
                          </div>
                        </div>
                      ) : (
                        <div className="columns">
                          <div className="column is-6">
                            {renderSectionContent(
                              section.content.slice(
                                0,
                                Math.ceil(section.content.length / 2)
                              )
                            )}
                          </div>
                          <div className="column is-6">
                            {renderSectionContent(
                              section.content.slice(
                                Math.ceil(section.content.length / 2)
                              )
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                  <div
                    className={`tab-pane ${activeTab !== "api_management" ? "is-hidden" : ""}`}
                  >
                    <ApiKeysTab />
                  </div>
                </div>
              </>
            )}

            {/* Backup Modal */}
            {showBackupModal && (
              <ContentModal
                isOpen={showBackupModal}
                onClose={() => setShowBackupModal(false)}
                title="Configuration Backups"
                icon="fas fa-history"
              >
                {backups.length === 0 ? (
                  <p className="has-text-grey">No backups available</p>
                ) : (
                  <table className="table is-fullwidth is-striped">
                    <thead>
                      <tr>
                        <th>Filename</th>
                        <th>Created</th>
                        <th className="has-text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {backups.map((backup) => (
                        <tr key={backup.filename}>
                          <td>{backup.filename}</td>
                          <td>{new Date(backup.createdAt).toLocaleString()}</td>
                          <td className="has-text-right">
                            <div className="field is-grouped is-grouped-right">
                              <p className="control is-expanded">
                                <button
                                  className="button is-small is-warning is-fullwidth"
                                  onClick={() => {
                                    requestRestoreBackup(backup.filename);
                                    setShowBackupModal(false);
                                  }}
                                  disabled={loading}
                                >
                                  Restore
                                </button>
                              </p>
                              <p className="control is-expanded">
                                <button
                                  className="button is-small is-danger is-fullwidth"
                                  onClick={() =>
                                    requestDeleteBackup(backup.filename)
                                  }
                                  disabled={loading}
                                >
                                  Delete
                                </button>
                              </p>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </ContentModal>
            )}

            {/* Confirmation Modal */}
            {confirmDialog.isOpen && (
              <FormModal
                isOpen={confirmDialog.isOpen}
                onClose={() =>
                  setConfirmDialog((prev) => ({ ...prev, isOpen: false }))
                }
                onSubmit={(e) => {
                  e.preventDefault();
                  if (confirmDialog.onConfirm) {
                    confirmDialog.onConfirm();
                  }
                }}
                title={confirmDialog.title}
                submitText={confirmDialog.confirmText}
                submitVariant={confirmDialog.variant}
                loading={loading}
                showCancelButton
              >
                <p>{confirmDialog.message}</p>
              </FormModal>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ZoneweaverAPISettings;
