import { useState } from "react";

/**
 * Custom hook for managing all ZoneweaverSettings state
 * Consolidates 27 useState declarations into organized domains
 *
 * @returns {object} State object with organized state and setters
 */
const useSettingsState = () => {
  // Core settings state
  const [activeTab, setActiveTab] = useState("");
  const [sections, setSections] = useState({});
  const [values, setValues] = useState({});
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [requiresRestart, setRequiresRestart] = useState(false);

  // Subsection UI state
  const [collapsedSubsections, setCollapsedSubsections] = useState({});

  // SSL file upload state
  const [sslFiles, setSslFiles] = useState({});
  const [uploadingFiles, setUploadingFiles] = useState({});

  // Backup management state
  const [backups, setBackups] = useState([]);
  const [showBackupModal, setShowBackupModal] = useState(false);

  // Test functionality state
  const [testResults, setTestResults] = useState({});
  const [testLoading, setTestLoading] = useState({});
  const [testEmail, setTestEmail] = useState("");
  const [ldapTestCredentials, setLdapTestCredentials] = useState({
    testUsername: "",
    testPassword: "",
  });

  // OIDC Provider management state
  const [showOidcProviderModal, setShowOidcProviderModal] = useState(false);
  const [oidcProviderForm, setOidcProviderForm] = useState({
    name: "",
    displayName: "",
    issuer: "",
    clientId: "",
    clientSecret: "",
    scope: "openid profile email",
    responseType: "code",
    enabled: true,
  });
  const [oidcProviderLoading, setOidcProviderLoading] = useState(false);

  // Server management state
  const [servers, setServers] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [hostname, setHostname] = useState("");
  const [port, setPort] = useState("5001");
  const [protocol, setProtocol] = useState("https");
  const [entityName, setEntityName] = useState("Zoneweaver-Production");
  const [apiKey, setApiKey] = useState("");
  const [useExistingApiKey, setUseExistingApiKey] = useState(false);
  const [testResult, setTestResult] = useState(null);

  return {
    // Core settings
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

    // Subsection UI
    ui: {
      collapsedSubsections,
      setCollapsedSubsections,
    },

    // SSL file uploads
    ssl: {
      sslFiles,
      setSslFiles,
      uploadingFiles,
      setUploadingFiles,
    },

    // Backup management
    backup: {
      backups,
      setBackups,
      showBackupModal,
      setShowBackupModal,
    },

    // Testing functionality
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

    // OIDC provider
    oidc: {
      showOidcProviderModal,
      setShowOidcProviderModal,
      oidcProviderForm,
      setOidcProviderForm,
      oidcProviderLoading,
      setOidcProviderLoading,
    },

    // Server management
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
  };
};

export default useSettingsState;
