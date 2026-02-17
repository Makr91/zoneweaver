import axios from "axios";
import { useCallback } from "react";

import { FormModal } from "../common";

const TestingPanel = ({
  values,
  testResults,
  setTestResults,
  testLoading,
  setTestLoading,
  testEmail,
  setTestEmail,
  ldapTestCredentials,
  setLdapTestCredentials,
  showOidcProviderModal,
  setShowOidcProviderModal,
  oidcProviderForm,
  setOidcProviderForm,
  oidcProviderLoading,
  setOidcProviderLoading,
  setMsg,
  loading,
  section,
  sectionName,
}) => {
  // Test LDAP Connection
  const testLdapConnection = useCallback(async () => {
    const testKey = "ldap";
    try {
      setTestLoading((prev) => ({ ...prev, [testKey]: true }));
      setTestResults((prev) => ({ ...prev, [testKey]: null }));
      setMsg("Testing LDAP connection...");

      const payload = {};
      if (
        ldapTestCredentials.testUsername &&
        ldapTestCredentials.testPassword
      ) {
        payload.testUsername = ldapTestCredentials.testUsername;
        payload.testPassword = ldapTestCredentials.testPassword;
      }

      const response = await axios.post("/api/auth/ldap/test", payload);

      if (response.data.success) {
        setTestResults((prev) => ({
          ...prev,
          [testKey]: {
            success: true,
            message: response.data.message,
            details: response.data.details,
          },
        }));
        setMsg("LDAP connection test successful!");
      } else {
        setTestResults((prev) => ({
          ...prev,
          [testKey]: {
            success: false,
            message: response.data.message,
            error: response.data.error,
          },
        }));
        setMsg(`LDAP connection test failed: ${response.data.message}`);
      }
    } catch (error) {
      console.error("LDAP test error:", error);
      setTestResults((prev) => ({
        ...prev,
        [testKey]: {
          success: false,
          message: "LDAP test failed",
          error: error.response?.data?.error || error.message,
        },
      }));
      setMsg(
        `LDAP test error: ${error.response?.data?.message || error.message}`
      );
    } finally {
      setTestLoading((prev) => ({ ...prev, [testKey]: false }));
    }
  }, [
    ldapTestCredentials.testUsername,
    ldapTestCredentials.testPassword,
    setTestLoading,
    setTestResults,
    setMsg,
  ]);

  // Test Mail Connection
  const testMailConnection = useCallback(async () => {
    const testKey = "mail";
    if (!testEmail) {
      setMsg("Please enter a test email address");
      return;
    }

    try {
      setTestLoading((prev) => ({ ...prev, [testKey]: true }));
      setTestResults((prev) => ({ ...prev, [testKey]: null }));
      setMsg("Testing SMTP connection and sending test email...");

      const response = await axios.post("/api/mail/test", { testEmail });

      if (response.data.success) {
        setTestResults((prev) => ({
          ...prev,
          [testKey]: {
            success: true,
            message: response.data.message,
            details: response.data.details,
          },
        }));
        setMsg("Test email sent successfully! Check your inbox.");
      } else {
        setTestResults((prev) => ({
          ...prev,
          [testKey]: {
            success: false,
            message: response.data.message,
            error: response.data.error,
          },
        }));
        setMsg(`Mail test failed: ${response.data.message}`);
      }
    } catch (error) {
      console.error("Mail test error:", error);
      setTestResults((prev) => ({
        ...prev,
        [testKey]: {
          success: false,
          message: "Mail test failed",
          error: error.response?.data?.error || error.message,
        },
      }));
      setMsg(
        `Mail test error: ${error.response?.data?.message || error.message}`
      );
    } finally {
      setTestLoading((prev) => ({ ...prev, [testKey]: false }));
    }
  }, [testEmail, setTestLoading, setTestResults, setMsg]);

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

  // Handle OIDC Provider Form Change
  const handleOidcProviderFormChange = useCallback(
    (field, value) => {
      setOidcProviderForm((prev) => ({
        ...prev,
        [field]: value,
      }));
    },
    [setOidcProviderForm]
  );

  // Add OIDC Provider
  const addOidcProvider = useCallback(
    async (e) => {
      e.preventDefault();
      const {
        name,
        displayName,
        issuer,
        clientId,
        clientSecret,
        scope,
        responseType,
        enabled,
      } = oidcProviderForm;

      // Validation
      if (!name || !displayName || !issuer || !clientId || !clientSecret) {
        setMsg(
          "Provider name, display name, issuer, client ID, and client secret are required"
        );
        return;
      }

      // Validate provider name format (alphanumeric and underscores only)
      if (!/^[a-z0-9_]+$/i.test(name)) {
        setMsg(
          "Provider name must contain only letters, numbers, and underscores"
        );
        return;
      }

      // Check if provider already exists
      const existingProviderPath = `authentication.oidc_providers.${name}`;
      if (values[`${existingProviderPath}.enabled`] !== undefined) {
        setMsg(`OIDC provider &apos;${name}&apos; already exists`);
        return;
      }

      try {
        setOidcProviderLoading(true);
        setMsg("Adding OIDC provider...");

        // Add provider to values
        const providerSettings = {
          [`${existingProviderPath}.enabled`]: enabled,
          [`${existingProviderPath}.display_name`]: displayName,
          [`${existingProviderPath}.issuer`]: issuer,
          [`${existingProviderPath}.client_id`]: clientId,
          [`${existingProviderPath}.client_secret`]: clientSecret,
          [`${existingProviderPath}.scope`]: scope,
          [`${existingProviderPath}.response_type`]: responseType,
        };

        // Save the settings
        const response = await axios.put("/api/settings", {
          ...values,
          ...providerSettings,
        });

        if (response.data.success) {
          setMsg(
            `OIDC provider &apos;${name}&apos; added successfully. Refreshing...`
          );
          setShowOidcProviderModal(false);
          resetOidcProviderForm();
          // Reload the page to refresh the configuration
          window.location.reload();
        } else {
          setMsg(
            `Failed to add OIDC provider: ${response.data.message || "Unknown error"}`
          );
        }
      } catch (error) {
        console.error("Error adding OIDC provider:", error);
        setMsg(
          `Error adding OIDC provider: ${error.response?.data?.message || error.message}`
        );
      } finally {
        setOidcProviderLoading(false);
      }
    },
    [
      oidcProviderForm,
      values,
      setMsg,
      setOidcProviderLoading,
      setShowOidcProviderModal,
      resetOidcProviderForm,
    ]
  );

  // Render LDAP test section
  const renderLdapTest = () => {
    if (!values["authentication.ldap_enabled"]) {
      return null;
    }

    const isLdapSuccess = testResults.ldap?.success;

    return (
      <div className="box mt-4 has-background-light">
        <h3 className="title is-6">
          <span className="icon is-small mr-2">
            <i className="fas fa-vial" />
          </span>
          Test LDAP Connection
        </h3>

        <div className="columns">
          <div className="column is-6">
            <div className="field">
              <label className="label" htmlFor="ldap-test-username">
                Test Username (Optional)
              </label>
              <div className="control">
                <input
                  id="ldap-test-username"
                  className="input"
                  type="text"
                  placeholder="test.user"
                  value={ldapTestCredentials.testUsername}
                  onChange={(e) =>
                    setLdapTestCredentials((prev) => ({
                      ...prev,
                      testUsername: e.target.value,
                    }))
                  }
                  disabled={testLoading.ldap || loading}
                />
              </div>
              <p className="help is-size-7">
                Optional: Provide a username to test user authentication
              </p>
            </div>
          </div>
          <div className="column is-6">
            <div className="field">
              <label className="label" htmlFor="ldap-test-password">
                Test Password (Optional)
              </label>
              <div className="control">
                <input
                  id="ldap-test-password"
                  className="input"
                  type="password"
                  placeholder="user-password"
                  value={ldapTestCredentials.testPassword}
                  onChange={(e) =>
                    setLdapTestCredentials((prev) => ({
                      ...prev,
                      testPassword: e.target.value,
                    }))
                  }
                  disabled={testLoading.ldap || loading}
                />
              </div>
              <p className="help is-size-7">
                Optional: Password for the test user
              </p>
            </div>
          </div>
        </div>

        <div className="field">
          <div className="control">
            <button
              className={`button is-info ${testLoading.ldap ? "is-loading" : ""}`}
              onClick={testLdapConnection}
              disabled={testLoading.ldap || loading}
            >
              <span className="icon">
                <i className="fas fa-plug" />
              </span>
              <span>Test LDAP Connection</span>
            </button>
          </div>
          <p className="help has-text-grey">
            Tests server connection, bind credentials, search functionality, and
            optional user authentication
          </p>
        </div>

        {testResults.ldap && (
          <div
            className={`notification mt-3 ${isLdapSuccess ? "is-success" : "is-danger"}`}
          >
            <div className="media">
              <div className="media-left">
                <span className="icon is-large">
                  <i
                    className={`fas fa-2x ${isLdapSuccess ? "fa-check-circle" : "fa-times-circle"}`}
                  />
                </span>
              </div>
              <div className="media-content">
                <p className="is-size-6 has-text-weight-semibold">
                  {testResults.ldap.message}
                </p>
                {testResults.ldap.details && (
                  <div className="content mt-2">
                    <ul className="is-size-7">
                      <li>
                        <span
                          className={`icon is-small ${testResults.ldap.details.connectionTest ? "has-text-success" : "has-text-danger"}`}
                        >
                          <i
                            className={`fas ${testResults.ldap.details.connectionTest ? "fa-check" : "fa-times"}`}
                          />
                        </span>
                        <span className="ml-1">Server Connection</span>
                      </li>
                      <li>
                        <span
                          className={`icon is-small ${testResults.ldap.details.bindTest ? "has-text-success" : "has-text-danger"}`}
                        >
                          <i
                            className={`fas ${testResults.ldap.details.bindTest ? "fa-check" : "fa-times"}`}
                          />
                        </span>
                        <span className="ml-1">Bind with Service Account</span>
                      </li>
                      <li>
                        <span
                          className={`icon is-small ${testResults.ldap.details.searchTest ? "has-text-success" : "has-text-danger"}`}
                        >
                          <i
                            className={`fas ${testResults.ldap.details.searchTest ? "fa-check" : "fa-times"}`}
                          />
                        </span>
                        <span className="ml-1">Directory Search</span>
                      </li>
                      {testResults.ldap.details.authTest !== null && (
                        <li>
                          <span
                            className={`icon is-small ${testResults.ldap.details.authTest ? "has-text-success" : "has-text-warning"}`}
                          >
                            <i
                              className={`fas ${testResults.ldap.details.authTest ? "fa-check" : "fa-exclamation-triangle"}`}
                            />
                          </span>
                          <span className="ml-1">User Authentication Test</span>
                        </li>
                      )}
                    </ul>
                  </div>
                )}
                {testResults.ldap.error && (
                  <p className="is-size-7 has-text-grey mt-1">
                    <strong>Error:</strong> {testResults.ldap.error}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Render SMTP test section
  const renderSmtpTest = () => {
    const isMailSuccess = testResults.mail?.success;

    return (
      <div className="box mt-4 has-background-light">
        <h3 className="title is-6">
          <span className="icon is-small mr-2">
            <i className="fas fa-paper-plane" />
          </span>
          Test Email Configuration
        </h3>

        <div className="field">
          <label className="label" htmlFor="test-email-address">
            Test Email Address
          </label>
          <div className="control has-icons-right">
            <input
              id="test-email-address"
              className="input"
              type="email"
              placeholder="test@example.com"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              disabled={testLoading.mail || loading}
            />
            <span className="icon is-small is-right">
              <i className="fas fa-envelope" />
            </span>
          </div>
          <p className="help has-text-grey">
            Send a test email to verify SMTP configuration
          </p>
        </div>

        <div className="field">
          <div className="control">
            <button
              className={`button is-info ${testLoading.mail ? "is-loading" : ""}`}
              onClick={testMailConnection}
              disabled={testLoading.mail || loading || !testEmail}
            >
              <span className="icon">
                <i className="fas fa-paper-plane" />
              </span>
              <span>Send Test Email</span>
            </button>
          </div>
          <p className="help has-text-grey">
            Tests SMTP server connection and sends a test email
          </p>
        </div>

        {testResults.mail && (
          <div
            className={`notification mt-3 ${isMailSuccess ? "is-success" : "is-danger"}`}
          >
            <div className="media">
              <div className="media-left">
                <span className="icon is-large">
                  <i
                    className={`fas fa-2x ${isMailSuccess ? "fa-check-circle" : "fa-times-circle"}`}
                  />
                </span>
              </div>
              <div className="media-content">
                <p className="is-size-6 has-text-weight-semibold">
                  {testResults.mail.message}
                </p>
                {testResults.mail.details && (
                  <div className="content mt-2">
                    <p className="is-size-7">
                      <strong>Host:</strong> {testResults.mail.details.host}{" "}
                      <br />
                      <strong>Port:</strong> {testResults.mail.details.port}{" "}
                      <br />
                      <strong>Secure:</strong>{" "}
                      {testResults.mail.details.secure ? "Yes" : "No"}
                    </p>
                  </div>
                )}
                {testResults.mail.error && (
                  <p className="is-size-7 has-text-grey mt-1">
                    <strong>Error:</strong> {testResults.mail.error}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Configuration Help */}
        <div className="content mt-4">
          <h4 className="title is-6">Configuration Help</h4>
          <div className="columns">
            <div className="column">
              <p>
                <strong>Gmail:</strong>
              </p>
              <ul className="is-size-7">
                <li>Host: smtp.gmail.com</li>
                <li>Port: 587 (TLS) or 465 (SSL)</li>
                <li>Use App Password (not regular password)</li>
              </ul>
              <p>
                <strong>Outlook/Hotmail:</strong>
              </p>
              <ul className="is-size-7">
                <li>Host: smtp-mail.outlook.com</li>
                <li>Port: 587</li>
              </ul>
            </div>
            <div className="column">
              <p>
                <strong>Yahoo:</strong>
              </p>
              <ul className="is-size-7">
                <li>Host: smtp.mail.yahoo.com</li>
                <li>Port: 587 or 465</li>
              </ul>
              <p>
                <strong>Custom SMTP:</strong>
              </p>
              <ul className="is-size-7">
                <li>Contact your hosting provider</li>
                <li>Check documentation for settings</li>
              </ul>
            </div>
          </div>
          <div className="notification is-info is-light">
            <p className="is-size-7">
              <strong>Note:</strong> Save settings first, then use the test
              button to verify configuration.
            </p>
          </div>
        </div>
      </div>
    );
  };

  // Render OIDC management section
  const renderOidcManagement = () => {
    return (
      <div className="box mt-4 has-background-light">
        <div className="level is-mobile mb-3">
          <div className="level-left">
            <h3 className="title is-6">
              <span className="icon is-small mr-2">
                <i className="fab fa-openid" />
              </span>
              OIDC Providers
            </h3>
          </div>
          <div className="level-right">
            <button
              className="button is-primary is-small"
              onClick={(e) => {
                e.stopPropagation();
                resetOidcProviderForm();
                setShowOidcProviderModal(true);
              }}
              disabled={loading}
            >
              <span className="icon is-small">
                <i className="fas fa-plus" />
              </span>
              <span>Add OIDC Provider</span>
            </button>
          </div>
        </div>

        <p className="has-text-grey is-size-7 mb-3">
          Manage OpenID Connect authentication providers for single sign-on
          integration.
        </p>

        {/* Show existing providers */}
        {Object.entries(section.subsections || {}).length > 0 ? (
          <div className="notification is-info is-light">
            <p className="is-size-7">
              <strong>
                {Object.entries(section.subsections || {}).length}
              </strong>{" "}
              OIDC provider(s) configured. You can expand each provider section
              below to modify settings.
            </p>
          </div>
        ) : (
          <div className="notification is-warning is-light">
            <p className="is-size-7">
              No OIDC providers configured yet. Click &quot;Add OIDC
              Provider&quot; to set up authentication with providers like
              Google, Microsoft, GitHub, etc.
            </p>
          </div>
        )}
      </div>
    );
  };

  // Render OIDC Provider Modal
  const renderOidcProviderModal = () => {
    const isProviderEnabled = oidcProviderForm.enabled;

    return (
      <FormModal
        isOpen={showOidcProviderModal}
        onClose={() => setShowOidcProviderModal(false)}
        onSubmit={addOidcProvider}
        title="Add OIDC Provider"
        icon="fab fa-openid"
        submitText={oidcProviderLoading ? "Adding..." : "Add Provider"}
        submitVariant="is-primary"
        loading={oidcProviderLoading}
      >
        <div className="content">
          <p className="has-text-grey mb-4">
            Configure a new OpenID Connect authentication provider. You&apos;ll
            need to register your application with the provider first to get the
            client ID and client secret.
          </p>
        </div>

        <div className="columns is-multiline">
          {/* Provider Name */}
          <div className="column is-6">
            <div className="field">
              <label className="label" htmlFor="oidc-provider-name">
                Provider Name <span className="has-text-danger">*</span>
              </label>
              <div className="control has-icons-left">
                <input
                  id="oidc-provider-name"
                  className="input"
                  type="text"
                  placeholder="e.g., mycompany, enterprise, provider1"
                  value={oidcProviderForm.name}
                  onChange={(e) =>
                    handleOidcProviderFormChange(
                      "name",
                      e.target.value.toLowerCase()
                    )
                  }
                  disabled={oidcProviderLoading}
                  required
                />
                <span className="icon is-small is-left">
                  <i className="fas fa-tag" />
                </span>
              </div>
              <p className="help">
                Internal identifier (lowercase, letters, numbers, and
                underscores only)
              </p>
            </div>
          </div>

          {/* Display Name */}
          <div className="column is-6">
            <div className="field">
              <label className="label" htmlFor="oidc-display-name">
                Display Name <span className="has-text-danger">*</span>
              </label>
              <div className="control has-icons-left">
                <input
                  id="oidc-display-name"
                  className="input"
                  type="text"
                  placeholder="e.g., Sign in with Company SSO"
                  value={oidcProviderForm.displayName}
                  onChange={(e) =>
                    handleOidcProviderFormChange("displayName", e.target.value)
                  }
                  disabled={oidcProviderLoading}
                  required
                />
                <span className="icon is-small is-left">
                  <i className="fas fa-eye" />
                </span>
              </div>
              <p className="help">Name shown to users on the login page</p>
            </div>
          </div>

          {/* Issuer URL */}
          <div className="column is-full">
            <div className="field">
              <label className="label" htmlFor="oidc-issuer">
                Issuer URL <span className="has-text-danger">*</span>
              </label>
              <div className="control has-icons-left">
                <input
                  id="oidc-issuer"
                  className="input"
                  type="url"
                  placeholder="https://your-provider.com or https://your-domain.auth0.com"
                  value={oidcProviderForm.issuer}
                  onChange={(e) =>
                    handleOidcProviderFormChange("issuer", e.target.value)
                  }
                  disabled={oidcProviderLoading}
                  required
                />
                <span className="icon is-small is-left">
                  <i className="fas fa-link" />
                </span>
              </div>
              <p className="help">
                The OIDC issuer URL (check your provider&apos;s documentation
                for the correct URL)
              </p>
            </div>
          </div>

          {/* Client ID */}
          <div className="column is-6">
            <div className="field">
              <label className="label" htmlFor="oidc-client-id">
                Client ID <span className="has-text-danger">*</span>
              </label>
              <div className="control has-icons-left">
                <input
                  id="oidc-client-id"
                  className="input"
                  type="text"
                  placeholder="Your OAuth client ID"
                  value={oidcProviderForm.clientId}
                  onChange={(e) =>
                    handleOidcProviderFormChange("clientId", e.target.value)
                  }
                  disabled={oidcProviderLoading}
                  required
                />
                <span className="icon is-small is-left">
                  <i className="fas fa-key" />
                </span>
              </div>
              <p className="help">
                Client ID from your OAuth application registration
              </p>
            </div>
          </div>

          {/* Client Secret */}
          <div className="column is-6">
            <div className="field">
              <label className="label" htmlFor="oidc-client-secret">
                Client Secret <span className="has-text-danger">*</span>
              </label>
              <div className="control has-icons-left">
                <input
                  id="oidc-client-secret"
                  className="input"
                  type="password"
                  placeholder="Your OAuth client secret"
                  value={oidcProviderForm.clientSecret}
                  onChange={(e) =>
                    handleOidcProviderFormChange("clientSecret", e.target.value)
                  }
                  disabled={oidcProviderLoading}
                  required
                />
                <span className="icon is-small is-left">
                  <i className="fas fa-lock" />
                </span>
              </div>
              <p className="help">
                Client secret from your OAuth application registration
              </p>
            </div>
          </div>

          {/* Scope */}
          <div className="column is-6">
            <div className="field">
              <label className="label" htmlFor="oidc-scope">
                Scope
              </label>
              <div className="control has-icons-left">
                <input
                  id="oidc-scope"
                  className="input"
                  type="text"
                  value={oidcProviderForm.scope}
                  onChange={(e) =>
                    handleOidcProviderFormChange("scope", e.target.value)
                  }
                  disabled={oidcProviderLoading}
                />
                <span className="icon is-small is-left">
                  <i className="fas fa-list" />
                </span>
              </div>
              <p className="help">
                OAuth scopes (space-separated). Default is usually sufficient.
              </p>
            </div>
          </div>

          {/* Response Type */}
          <div className="column is-6">
            <div className="field">
              <label className="label" htmlFor="oidc-response-type">
                Response Type
              </label>
              <div className="control has-icons-left">
                <div className="select is-fullwidth">
                  <select
                    id="oidc-response-type"
                    value={oidcProviderForm.responseType}
                    onChange={(e) =>
                      handleOidcProviderFormChange(
                        "responseType",
                        e.target.value
                      )
                    }
                    disabled={oidcProviderLoading}
                  >
                    <option value="code">
                      Authorization Code (Recommended)
                    </option>
                    <option value="id_token">ID Token</option>
                    <option value="code id_token">Code + ID Token</option>
                  </select>
                </div>
                <span className="icon is-small is-left">
                  <i className="fas fa-cog" />
                </span>
              </div>
              <p className="help">
                OAuth flow type. Use &quot;code&quot; for most providers.
              </p>
            </div>
          </div>

          {/* Enabled Toggle */}
          <div className="column is-full">
            <div className="field">
              <label className="label" htmlFor="oidc-enabled">
                Status
              </label>
              <div className="control">
                <label className="switch">
                  <input
                    id="oidc-enabled"
                    type="checkbox"
                    checked={oidcProviderForm.enabled}
                    onChange={(e) =>
                      handleOidcProviderFormChange("enabled", e.target.checked)
                    }
                    disabled={oidcProviderLoading}
                  />
                  <span className="check" />
                  <span className="control-label">
                    {isProviderEnabled ? (
                      <span className="has-text-success">
                        <span className="icon is-small mr-1">
                          <i className="fas fa-check-circle" />
                        </span>
                        Provider enabled
                      </span>
                    ) : (
                      <span className="has-text-danger">
                        <span className="icon is-small mr-1">
                          <i className="fas fa-times-circle" />
                        </span>
                        Provider disabled
                      </span>
                    )}
                  </span>
                </label>
              </div>
              <p className="help">
                Enable this provider for user authentication
              </p>
            </div>
          </div>
        </div>

        {/* Configuration Help */}
        <div className="notification is-info is-light mt-4">
          <h4 className="title is-6">Configuration Instructions</h4>
          <div className="content">
            <p>
              <strong>Setup Steps:</strong>
            </p>
            <ol className="is-size-7">
              <li>
                Register your application with your OIDC provider&apos;s
                developer console
              </li>
              <li>
                Add <code>https://your-domain.com/api/auth/oidc/callback</code>{" "}
                as an allowed redirect URI
              </li>
              <li>
                Copy the Client ID and Client Secret from your provider&apos;s
                console
              </li>
              <li>
                Find your provider&apos;s issuer URL in their documentation
              </li>
              <li>Fill in the form above with these details</li>
            </ol>
          </div>
        </div>
      </FormModal>
    );
  };

  // Main render
  return (
    <>
      {sectionName === "Authentication" && renderLdapTest()}
      {sectionName === "Authentication" && renderOidcManagement()}
      {sectionName === "Mail" && renderSmtpTest()}
      {showOidcProviderModal && renderOidcProviderModal()}
    </>
  );
};

export default TestingPanel;
