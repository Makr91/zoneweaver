import { Helmet } from "@dr.pogodin/react-helmet";
import axios from "axios";
import { useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";

import { useAuth } from "../../contexts/AuthContext";
import { useServers } from "../../contexts/ServerContext";
import useSettingsState from "../../hooks/useSettingsState";
import { canManageSettings } from "../../utils/permissions";
import { processConfig } from "../../utils/settingsUtils";

import BackupManager from "./BackupManager";
import FieldRenderer from "./FieldRenderer";
import ServerManagementTab from "./ServerManagementTab";
import SettingsContent from "./SettingsContent";
import TestingPanel from "./TestingPanel";

/**
 * ZoneweaverSettings - Main orchestrator for Zoneweaver system settings
 * Manages configuration, servers, backups, and testing functionality
 */
const ZoneweaverSettings = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const serverContext = useServers();

  // Get all state from the custom hook
  const state = useSettingsState();
  const {
    core: {
      activeTab,
      setActiveTab,
      sections,
      setSections,
      values,
      setValues,
      msg,
      setMsg,
      loading,
      setLoading,
      requiresRestart,
      setRequiresRestart,
    },
    ui: { collapsedSubsections, setCollapsedSubsections },
    ssl: { sslFiles, setSslFiles, uploadingFiles, setUploadingFiles },
    backup: { backups, setBackups, showBackupModal, setShowBackupModal },
    testing: {
      testResults,
      setTestResults,
      testLoading,
      setTestLoading,
      testEmail,
      setTestEmail,
      ldapTestCredentials,
      setLdapTestCredentials,
    },
    oidc: {
      showOidcProviderModal,
      setShowOidcProviderModal,
      oidcProviderForm,
      setOidcProviderForm,
      oidcProviderLoading,
      setOidcProviderLoading,
    },
    server: {
      servers,
      setServers,
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
    },
  } = state;

  // Load servers with API keys for settings page display
  const loadServers = useCallback(async () => {
    try {
      const response = await axios.get("/api/servers?includeApiKeys=true");
      if (response.data.success) {
        setServers(response.data.servers);
      } else {
        const serverList = serverContext.getServers();
        setServers(serverList);
      }
    } catch (error) {
      console.warn(
        "Failed to load servers with API keys, using fallback:",
        error.message
      );
      const serverList = serverContext.getServers();
      setServers(serverList);
    }
  }, [serverContext, setServers]);

  // Load settings from API
  const loadSettings = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get("/api/settings");

      if (response.data.success) {
        const { extractedValues, organizedSections } = processConfig(
          response.data.config
        );
        setValues(extractedValues);
        setSections(organizedSections);
      } else {
        setMsg(`Failed to load settings: ${response.data.message}`);
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
  }, [setLoading, setValues, setSections, setMsg]);

  // Load backups from API
  const loadBackups = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get("/api/settings/backups");

      if (response.data.success) {
        setBackups(response.data.backups);
      } else {
        setMsg(`Failed to load backups: ${response.data.message}`);
      }
    } catch (error) {
      console.error("Error loading backups:", error);
      setMsg(
        `Error loading backups: ${
          error.response?.data?.message || error.message
        }`
      );
    } finally {
      setLoading(false);
    }
  }, [setLoading, setBackups, setMsg]);

  // Load settings and servers on mount
  useEffect(() => {
    if (user && canManageSettings(user.role)) {
      loadSettings();
      loadServers();
    }
  }, [user, loadSettings, loadServers]);

  // Load servers when allServers changes
  useEffect(() => {
    if (user && canManageSettings(user.role)) {
      loadServers();
    }
  }, [serverContext.servers, user, loadServers]);

  // Handle URL parameter for direct tab navigation
  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab) {
      setActiveTab(tab);
      if (tab === "servers") {
        setShowAddForm(true);
      }
      setSearchParams({});
    } else if (!activeTab && Object.keys(sections).length > 0) {
      setActiveTab(Object.keys(sections)[0]);
    }
  }, [
    searchParams,
    setSearchParams,
    sections,
    activeTab,
    setActiveTab,
    setShowAddForm,
  ]);

  // Handle field value changes
  const handleFieldChange = useCallback(
    (fieldPath, value) => {
      setValues((prev) => ({
        ...prev,
        [fieldPath]: value,
      }));
    },
    [setValues]
  );

  // Toggle subsection collapse state
  const toggleSubsection = useCallback(
    (sectionName, subsectionName) => {
      const key = `${sectionName}-${subsectionName}`;
      setCollapsedSubsections((prev) => ({
        ...prev,
        [key]: !prev[key],
      }));
    },
    [setCollapsedSubsections]
  );

  // Check if subsection is collapsed
  const isSubsectionCollapsed = useCallback(
    (sectionName, subsectionName) => {
      const key = `${sectionName}-${subsectionName}`;
      return collapsedSubsections[key] || false;
    },
    [collapsedSubsections]
  );

  // SSL file upload handler
  const handleSslFileUpload = useCallback(
    async (fieldPath, file) => {
      if (!file) {
        return;
      }

      setUploadingFiles((prev) => ({ ...prev, [fieldPath]: true }));

      try {
        const formData = new FormData();
        formData.append("sslFile", file);
        formData.append("fieldPath", fieldPath);

        const response = await axios.post(
          "/api/settings/ssl/upload",
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          }
        );

        if (response.data.success) {
          handleFieldChange(fieldPath, response.data.filePath);
          setSslFiles((prev) => ({
            ...prev,
            [fieldPath]: {
              name: file.name,
              size: file.size,
              uploadedPath: response.data.filePath,
            },
          }));
          setMsg(`SSL certificate uploaded successfully: ${file.name}`);
        } else {
          setMsg(`Failed to upload SSL certificate: ${response.data.message}`);
        }
      } catch (error) {
        console.error("SSL file upload error:", error);
        setMsg(
          `Error uploading SSL certificate: ${error.response?.data?.message || error.message}`
        );
      } finally {
        setUploadingFiles((prev) => ({ ...prev, [fieldPath]: false }));
      }
    },
    [setUploadingFiles, handleFieldChange, setSslFiles, setMsg]
  );

  // SSL file delete handler
  const handleSslFileDelete = useCallback(
    async (fieldPath) => {
      try {
        const response = await axios.delete("/api/settings/ssl/delete", {
          data: { fieldPath },
        });

        if (response.data.success) {
          handleFieldChange(fieldPath, "");
          setSslFiles((prev) => {
            const updated = { ...prev };
            delete updated[fieldPath];
            return updated;
          });
          setMsg("SSL certificate deleted successfully");
        } else {
          setMsg(`Failed to delete SSL certificate: ${response.data.message}`);
        }
      } catch (error) {
        console.error("SSL file delete error:", error);
        setMsg(
          `Error deleting SSL certificate: ${error.response?.data?.message || error.message}`
        );
      }
    },
    [handleFieldChange, setSslFiles, setMsg]
  );

  // Save settings handler
  const handleSaveSettings = useCallback(async () => {
    setLoading(true);
    setMsg("");
    setRequiresRestart(false);

    try {
      const response = await axios.put("/api/settings", values);

      if (response.data.success) {
        setMsg(response.data.message);
        setRequiresRestart(response.data.requiresRestart);
        await loadSettings();
      } else {
        setMsg(`Failed to save settings: ${response.data.message}`);
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
  }, [setLoading, setMsg, setRequiresRestart, values, loadSettings]);

  // Monitor server restart
  const monitorServerRestart = useCallback(async () => {
    let attempts = 0;
    const maxAttempts = 30;
    const checkInterval = 3000;

    const checkHealth = async () => {
      attempts++;

      try {
        setMsg(`Checking server health... (${attempts}/${maxAttempts})`);

        const response = await axios.get("/api/health", {
          timeout: 5000,
        });

        if (response.data.success && response.data.status === "healthy") {
          setMsg("Server restart completed successfully! Reloading page...");
          setTimeout(() => {
            window.location.reload();
          }, 1000);
          return;
        }
      } catch (error) {
        console.log(`Health check attempt ${attempts} failed:`, error.message);
      }

      if (attempts >= maxAttempts) {
        setMsg("Server restart timeout. Please refresh the page manually.");
        setLoading(false);
        return;
      }

      setTimeout(checkHealth, checkInterval);
    };

    await checkHealth();
  }, [setMsg, setLoading]);

  // Restart server handler
  const handleRestartServer = useCallback(async () => {
    if (
      !window.confirm(
        "Are you sure you want to restart the server? This will briefly interrupt service for all users."
      )
    ) {
      return;
    }

    try {
      setLoading(true);
      setMsg("Initiating server restart...");

      const response = await axios.post("/api/settings/restart");

      if (response.data.success) {
        setMsg("Server restart initiated. Monitoring server health...");
        setTimeout(() => {
          monitorServerRestart();
        }, 3000);
      } else {
        setMsg(`Failed to restart server: ${response.data.message}`);
        setLoading(false);
      }
    } catch (error) {
      console.error("Error restarting server:", error);
      setMsg(
        `Error restarting server: ${
          error.response?.data?.message || error.message
        }`
      );
      setLoading(false);
    }
  }, [setLoading, setMsg, monitorServerRestart]);

  // Create backup handler
  const createBackup = useCallback(async () => {
    try {
      setLoading(true);
      setMsg("Creating backup...");

      await handleSaveSettings();
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
  }, [setLoading, setMsg, handleSaveSettings, loadBackups]);

  // Open backup modal handler
  const handleOpenBackupModal = useCallback(async () => {
    await loadBackups();
    setShowBackupModal(true);
  }, [loadBackups, setShowBackupModal]);

  // Check permissions
  if (!user || !canManageSettings(user.role)) {
    return (
      <div className="zw-page-content-scrollable">
        <Helmet>
          <meta charSet="utf-8" />
          <title>System Settings - Zoneweaver</title>
          <link rel="canonical" href={window.location.origin} />
        </Helmet>
        <div className="container is-fluid p-0">
          <div className="box p-0 is-radiusless">
            <div className="titlebar box active level is-mobile mb-0 p-3">
              <div className="level-left">
                <strong>Access Denied</strong>
              </div>
            </div>
            <div className="px-4">
              <div className="notification is-danger">
                <h2 className="title is-4">Super Admin Access Required</h2>
                <p>
                  Only super administrators can modify Zoneweaver system
                  settings.
                </p>
                <p className="mt-2">
                  Your current role:{" "}
                  <span className="tag is-warning">
                    {user?.role || "Unknown"}
                  </span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="zw-page-content-scrollable">
      <Helmet>
        <meta charSet="utf-8" />
        <title>Zoneweaver Settings - Zoneweaver</title>
        <link rel="canonical" href={window.location.origin} />
      </Helmet>
      <div className="container is-fluid p-0">
        <div className="box p-0 is-radiusless">
          {/* Title bar with action buttons */}
          <div className="titlebar box active level is-mobile mb-0 p-3">
            <div className="level-left">
              <strong>Zoneweaver System Settings</strong>
            </div>
            <div className="level-right">
              {activeTab !== "servers" && Object.keys(sections).length > 0 && (
                <>
                  <button
                    className="button is-small is-primary mr-2"
                    onClick={handleSaveSettings}
                    disabled={loading || !Object.keys(values).length}
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
                    onClick={handleOpenBackupModal}
                    disabled={loading}
                  >
                    <span className="icon is-small">
                      <i className="fas fa-history" />
                    </span>
                    <span>Restore</span>
                  </button>
                  <button
                    className="button is-small is-danger mr-2"
                    onClick={handleRestartServer}
                    disabled={loading}
                  >
                    <span className="icon is-small">
                      <i className="fas fa-redo" />
                    </span>
                    <span>Restart</span>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Tab navigation */}
          <div className="tabs is-boxed mb-0">
            <ul>
              <li className={activeTab === "servers" ? "is-active" : ""}>
                <a onClick={() => setActiveTab("servers")}>
                  <span className="icon is-small">
                    <i className="fas fa-server" />
                  </span>
                  <span>API Servers</span>
                </a>
              </li>
              {Object.entries(sections).map(([sectionName, section]) => (
                <li
                  key={sectionName}
                  className={activeTab === sectionName ? "is-active" : ""}
                >
                  <a onClick={() => setActiveTab(sectionName)}>
                    <span className="icon is-small">
                      <i className={section.icon} />
                    </span>
                    <span>{section.title}</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Message banner */}
          <div className="p-0">
            {msg && (
              <div
                className={`notification ${
                  msg.includes("successfully")
                    ? "is-success"
                    : msg.includes("Error")
                      ? "is-danger"
                      : "is-warning"
                } mb-4 mx-4 mt-4`}
              >
                <p>{msg}</p>
              </div>
            )}

            {/* Server Management Tab */}
            {activeTab === "servers" && (
              <ServerManagementTab
                servers={servers}
                setServers={setServers}
                showAddForm={showAddForm}
                setShowAddForm={setShowAddForm}
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
                testResult={testResult}
                setTestResult={setTestResult}
                msg={msg}
                setMsg={setMsg}
                serverContext={serverContext}
              />
            )}

            {/* Dynamic Configuration Sections */}
            {Object.entries(sections).map(
              ([sectionName, section]) =>
                activeTab === sectionName && (
                  <div key={sectionName}>
                    {sectionName === "Authentication" ? (
                      <TestingPanel
                        values={values}
                        testResults={testResults}
                        setTestResults={setTestResults}
                        testLoading={testLoading}
                        setTestLoading={setTestLoading}
                        testEmail={testEmail}
                        setTestEmail={setTestEmail}
                        ldapTestCredentials={ldapTestCredentials}
                        setLdapTestCredentials={setLdapTestCredentials}
                        showOidcProviderModal={showOidcProviderModal}
                        setShowOidcProviderModal={setShowOidcProviderModal}
                        oidcProviderForm={oidcProviderForm}
                        setOidcProviderForm={setOidcProviderForm}
                        oidcProviderLoading={oidcProviderLoading}
                        setOidcProviderLoading={setOidcProviderLoading}
                        setMsg={setMsg}
                        loading={loading}
                        section={section}
                        sectionName={sectionName}
                      />
                    ) : (
                      <SettingsContent
                        sectionName={sectionName}
                        section={section}
                        values={values}
                        handleFieldChange={handleFieldChange}
                        loading={loading}
                        toggleSubsection={toggleSubsection}
                        isSubsectionCollapsed={isSubsectionCollapsed}
                        sslFiles={sslFiles}
                        uploadingFiles={uploadingFiles}
                        handleSslFileUpload={handleSslFileUpload}
                        handleSslFileDelete={handleSslFileDelete}
                      />
                    )}
                  </div>
                )
            )}
          </div>

          {/* Backup Manager Modal */}
          {showBackupModal && (
            <BackupManager
              backups={backups}
              loading={loading}
              setLoading={setLoading}
              setMsg={setMsg}
              loadBackups={loadBackups}
              loadSettings={loadSettings}
              showBackupModal={showBackupModal}
              setShowBackupModal={setShowBackupModal}
            />
          )}

          {/* Help Section */}
          {activeTab !== "servers" && Object.keys(sections).length > 0 && (
            <div className="box mx-4 mb-4 has-background-light">
              <div className="content">
                <h3 className="title is-6">
                  <span className="icon is-small mr-2">
                    <i className="fas fa-question-circle" />
                  </span>
                  Need Help?
                </h3>
                <p className="is-size-7">
                  Changes to settings are saved immediately when you click the{" "}
                  <strong>Save</strong> button.
                  {requiresRestart && (
                    <>
                      {" "}
                      Some settings require a server restart to take effect.
                      Click the <strong>Restart</strong> button to apply these
                      changes.
                    </>
                  )}
                </p>
                <p className="is-size-7">
                  You can create backups of your settings at any time using the{" "}
                  <strong>Backup</strong> button, and restore them later using
                  the <strong>Restore</strong> button.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ZoneweaverSettings;
