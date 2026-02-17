import { Helmet } from "@dr.pogodin/react-helmet";
import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";

import { useAuth } from "../../contexts/AuthContext";
import { useServers } from "../../contexts/ServerContext";
import useSettingsAPI from "../../hooks/useSettingsAPI";
import useSettingsState from "../../hooks/useSettingsState";
import { canManageSettings } from "../../utils/permissions";
import { ConfirmModal } from "../common";

import BackupManager from "./BackupManager";
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
  const [showRestartConfirm, setShowRestartConfirm] = useState(false);

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

  // Get API handlers from custom hook
  const {
    loadServers,
    loadSettings,
    loadBackups,
    handleSaveSettings,
    executeServerRestart: executeRestart,
    createBackup,
    handleSslFileUpload,
  } = useSettingsAPI({
    setSections,
    setValues,
    setMsg,
    setLoading,
    setRequiresRestart,
    setServers,
    setBackups,
    setUploadingFiles,
    setSslFiles,
    handleFieldChange,
    values,
    serverContext,
  });

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

  // Reset OIDC Provider Form
  const resetOidcProviderForm = useCallback(() => {
    setOidcProviderForm({
      name: "",
      displayName: "",
      issuer: "",
      clientId: "",
      clientSecret: "",
      scope: "openid profile email",
      responseType: "code",
      enabled: true,
    });
  }, [setOidcProviderForm]);

  // Show restart confirmation dialog
  const handleRestartServer = useCallback(() => {
    setShowRestartConfirm(true);
  }, []);

  // Open backup modal handler
  const handleOpenBackupModal = useCallback(async () => {
    await loadBackups();
    setShowBackupModal(true);
  }, [loadBackups, setShowBackupModal]);

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
                <a
                  href="#servers"
                  onClick={(e) => {
                    e.preventDefault();
                    setActiveTab("servers");
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setActiveTab("servers");
                    }
                  }}
                  role="tab"
                  aria-selected={activeTab === "servers"}
                >
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
                  <a
                    href={`#${sectionName}`}
                    onClick={(e) => {
                      e.preventDefault();
                      setActiveTab(sectionName);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setActiveTab(sectionName);
                      }
                    }}
                    role="tab"
                    aria-selected={activeTab === sectionName}
                  >
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
            {msg &&
              (() => {
                let messageClass = "is-warning";
                if (msg.includes("successfully")) {
                  messageClass = "is-success";
                } else if (msg.includes("Error")) {
                  messageClass = "is-danger";
                }
                return (
                  <div
                    className={`notification ${messageClass} mb-4 mx-4 mt-4`}
                  >
                    <p>{msg}</p>
                  </div>
                );
              })()}

            {/* Server Management Tab */}
            {activeTab === "servers" && (
              <ServerManagementTab
                servers={servers}
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
                setMsg={setMsg}
                serverContext={serverContext}
              />
            )}

            {/* Dynamic Configuration Sections */}
            {Object.entries(sections).map(
              ([sectionName, section]) =>
                activeTab === sectionName && (
                  <div key={sectionName} className="px-4">
                    <SettingsContent
                      activeTab={sectionName}
                      sections={{ [sectionName]: section }}
                      values={values}
                      collapsedSubsections={collapsedSubsections}
                      setCollapsedSubsections={setCollapsedSubsections}
                      sslFiles={sslFiles}
                      uploadingFiles={uploadingFiles}
                      loading={loading}
                      onFieldChange={handleFieldChange}
                      onSslFileUpload={handleSslFileUpload}
                      resetOidcProviderForm={resetOidcProviderForm}
                      setShowOidcProviderModal={setShowOidcProviderModal}
                    />

                    {/* Testing Panel for Authentication and Mail */}
                    {(sectionName === "Authentication" ||
                      sectionName === "Mail") && (
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
                        resetOidcProviderForm={resetOidcProviderForm}
                        setMsg={setMsg}
                        loading={loading}
                        section={section}
                        sectionName={sectionName}
                      />
                    )}
                  </div>
                )
            )}

            {/* Restart Warning */}
            {requiresRestart && activeTab !== "servers" && (
              <div className="notification is-warning mx-4 mt-4">
                <h3 className="title is-6">Server Restart Required</h3>
                <p>
                  Some of your changes require a server restart to take effect.
                </p>
                <div className="mt-3">
                  <button
                    className="button is-danger"
                    onClick={handleRestartServer}
                    disabled={loading}
                  >
                    <span className="icon">
                      <i className="fas fa-power-off" />
                    </span>
                    <span>Restart Server Now</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Backup Manager Modal */}
          <BackupManager
            backups={backups}
            setBackups={setBackups}
            showBackupModal={showBackupModal}
            setShowBackupModal={setShowBackupModal}
            setMsg={setMsg}
            onBackupRestore={loadSettings}
          />

          {/* Help Section */}
          {activeTab !== "servers" && Object.keys(sections).length > 0 && (
            <div className="box mx-4 mb-4">
              <h2 className="title is-6">Settings Information</h2>
              <div className="content is-size-7">
                <p>
                  <strong>Important:</strong> These settings affect the entire
                  Zoneweaver application for all users.
                </p>
                <ul>
                  <li>
                    Changes require super-admin privileges and take effect
                    immediately
                  </li>
                  <li>
                    Some settings may require users to refresh their browsers
                  </li>
                  <li>
                    Performance settings affect resource usage and
                    responsiveness
                  </li>
                  <li>
                    Security settings impact user sessions and authentication
                  </li>
                </ul>
                <p className="mt-3">
                  <strong>Current User:</strong> {user.username}{" "}
                  <span className="tag is-danger is-small">Super Admin</span>
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Restart Server Confirmation Modal */}
      <ConfirmModal
        isOpen={showRestartConfirm}
        onClose={() => setShowRestartConfirm(false)}
        onConfirm={() => {
          setShowRestartConfirm(false);
          executeRestart();
        }}
        title="Restart Server"
        message="Are you sure you want to restart the server? This will briefly interrupt service for all users."
        confirmText="Restart Server"
        confirmVariant="is-danger"
        icon="fas fa-redo"
        loading={loading}
      />
    </div>
  );
};

export default ZoneweaverSettings;
