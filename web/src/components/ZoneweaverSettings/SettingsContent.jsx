import { useCallback } from "react";
import FieldRenderer from "./FieldRenderer";

// Section-specific renderers to reduce cyclomatic complexity

const LoggingSectionRenderer = ({
  section,
  values,
  handleFieldChange,
  loading,
}) => (
  <div className="columns is-vcentered">
    {/* Logging Level - Left Column */}
    <div className="column is-6">
      <div className="field">
        <label className="label has-text-weight-semibold">
          <span className="icon is-small mr-2">
            <i className="fas fa-layer-group" />
          </span>
          Logging Level
        </label>
        <div className="control has-icons-left">
          <div className="select is-fullwidth">
            <select
              value={values["logging.level"] || "info"}
              onChange={(e) =>
                handleFieldChange("logging.level", e.target.value)
              }
              disabled={loading}
            >
              <option value="error">Error - Critical issues only</option>
              <option value="warn">Warning - Errors + warnings</option>
              <option value="info">Info - General operations</option>
              <option value="debug">Debug - Detailed diagnostics</option>
            </select>
          </div>
          <span className="icon is-small is-left">
            <i className="fas fa-list-ul" />
          </span>
        </div>
        <p className="help has-text-grey">
          Controls the minimum level of messages that will be logged to console
          and files
        </p>
      </div>
    </div>

    {/* Logging Enabled - Right Column */}
    <div className="column is-6">
      <div className="field">
        <label className="label has-text-weight-semibold">
          <span className="icon is-small mr-2">
            <i className="fas fa-power-off" />
          </span>
          Enable Logging
        </label>
        <div className="control">
          <div className="field">
            <label className="switch is-medium">
              <input
                type="checkbox"
                checked={!!values["logging.enabled"]}
                onChange={(e) =>
                  handleFieldChange("logging.enabled", e.target.checked)
                }
                disabled={loading}
              />
              <span className="check" />
              <span className="control-label">
                {values["logging.enabled"] ? (
                  <span className="has-text-success">
                    <span className="icon is-small mr-2">
                      <i className="fas fa-check-circle" />
                    </span>
                    Logging is enabled
                  </span>
                ) : (
                  <span className="has-text-danger">
                    <span className="icon is-small mr-2">
                      <i className="fas fa-times-circle" />
                    </span>
                    Logging is disabled
                  </span>
                )}
              </span>
            </label>
          </div>
        </div>
        <p className="help has-text-grey">
          Disable only for testing - logging is essential for troubleshooting
        </p>
      </div>
    </div>
  </div>
);

const AuthenticationSectionRenderer = ({
  section,
  values,
  renderField,
  ldapTestCredentials,
  setLdapTestCredentials,
  testLoading,
  loading,
  testLdapConnection,
  testResults,
  resetOidcProviderForm,
  setShowOidcProviderModal,
}) => (
  <>
    <div className="columns is-multiline">
      {section.fields.map((field) => (
        <div
          key={field.path}
          className={
            field.type === "textarea" || field.type === "array"
              ? "column is-full"
              : "column is-half"
          }
        >
          {renderField(field)}
        </div>
      ))}
    </div>

    {/* LDAP Connection Test */}
    {values["authentication.ldap_enabled"] && (
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
              <label className="label">Test Username (Optional)</label>
              <div className="control">
                <input
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
              <label className="label">Test Password (Optional)</label>
              <div className="control">
                <input
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

        {/* Test Results */}
        {testResults.ldap && (
          <div
            className={`notification mt-3 ${testResults.ldap.success ? "is-success" : "is-danger"}`}
          >
            <div className="media">
              <div className="media-left">
                <span className="icon is-large">
                  <i
                    className={`fas fa-2x ${testResults.ldap.success ? "fa-check-circle" : "fa-times-circle"}`}
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
    )}

    {/* OIDC Provider Management */}
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
    </div>
  </>
);

const MailSectionRenderer = ({
  section,
  renderField,
  testEmail,
  setTestEmail,
  testLoading,
  loading,
  testMailConnection,
  testResults,
}) => (
  <>
    <div className="columns is-multiline">
      {section.fields.map((field) => (
        <div
          key={field.path}
          className={
            field.type === "textarea" || field.type === "array"
              ? "column is-full"
              : "column is-half"
          }
        >
          {renderField(field)}
        </div>
      ))}
    </div>

    {/* SMTP Connection Test */}
    <div className="box mt-4 has-background-light">
      <h3 className="title is-6">
        <span className="icon is-small mr-2">
          <i className="fas fa-paper-plane" />
        </span>
        Test Email Configuration
      </h3>

      <div className="field">
        <label className="label">Test Email Address</label>
        <div className="control has-icons-right">
          <input
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

      {/* Test Results */}
      {testResults.mail && (
        <div
          className={`notification mt-3 ${testResults.mail.success ? "is-success" : "is-danger"}`}
        >
          <div className="media">
            <div className="media-left">
              <span className="icon is-large">
                <i
                  className={`fas fa-2x ${testResults.mail.success ? "fa-check-circle" : "fa-times-circle"}`}
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
          </div>
        </div>
      </div>
    </div>
  </>
);

const ServerSectionRenderer = ({
  section,
  renderField,
  renderSSLFileField,
}) => (
  <div className="columns is-multiline">
    {section.fields.map((field) => {
      // Check if this is an SSL certificate field
      const isSSLField =
        (field.path.includes("ssl_") &&
          (field.path.includes("_path") ||
            field.path.includes("_cert") ||
            field.path.includes("_key"))) ||
        field.path.includes("ca_cert") ||
        field.path.includes("ca_certificate") ||
        (field.type === "string" &&
          (field.path.includes("cert") || field.path.includes("key")) &&
          (field.path.includes("path") ||
            field.description?.toLowerCase().includes("certificate") ||
            field.description?.toLowerCase().includes("key")));

      if (isSSLField) {
        return (
          <div key={field.path} className="column is-full">
            {renderSSLFileField(field)}
          </div>
        );
      }

      return (
        <div
          key={field.path}
          className={
            field.type === "textarea" || field.type === "array"
              ? "column is-full"
              : "column is-half"
          }
        >
          {renderField(field)}
        </div>
      );
    })}
  </div>
);

const StandardSectionRenderer = ({ section, renderField }) => (
  <div className="columns is-multiline">
    {section.fields.map((field) => (
      <div
        key={field.path}
        className={
          field.type === "textarea" || field.type === "array"
            ? "column is-full"
            : "column is-half"
        }
      >
        {renderField(field)}
      </div>
    ))}
  </div>
);

const SubsectionRenderer = ({
  sectionName,
  subsectionName,
  subsection,
  section,
  isCollapsed,
  toggleSubsection,
  renderField,
  resetOidcProviderForm,
  setShowOidcProviderModal,
  loading,
}) => {
  const handleToggle = useCallback(() => {
    toggleSubsection(sectionName, subsectionName);
  }, [sectionName, subsectionName, toggleSubsection]);

  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        handleToggle();
      }
    },
    [handleToggle]
  );

  // Special handling for OIDC Providers subsection
  if (subsectionName === "OIDC Providers") {
    return (
      <div className="box mb-4">
        <div
          className="is-clickable pb-2"
          onClick={handleToggle}
          onKeyDown={handleKeyDown}
          role="button"
          tabIndex={0}
          aria-expanded={!isCollapsed}
        >
          <h3 className="title is-6 mb-2">
            <span className="icon is-small mr-2">
              <i
                className={`fas ${isCollapsed ? "fa-chevron-right" : "fa-chevron-down"}`}
              />
            </span>
            <span className="icon is-small mr-2">
              <i className="fab fa-openid" />
            </span>
            {subsection.title}
            <span className="tag is-light is-small ml-2">
              {
                Object.entries(section.subsections || {}).filter(
                  ([name]) =>
                    name.toLowerCase().includes("oidc") &&
                    name !== "OIDC Providers"
                ).length
              }{" "}
              provider
              {Object.entries(section.subsections || {}).filter(
                ([name]) =>
                  name.toLowerCase().includes("oidc") &&
                  name !== "OIDC Providers"
              ).length !== 1
                ? "s"
                : ""}
            </span>
          </h3>
        </div>

        {/* Collapsible Content */}
        {!isCollapsed && (
          <div className="mt-3">
            {/* OIDC Provider Management */}
            <div className="level is-mobile mb-4">
              <div className="level-left">
                <div className="content">
                  <p className="has-text-grey is-size-7 mb-0">
                    Manage OpenID Connect authentication providers for single
                    sign-on integration.
                  </p>
                </div>
              </div>
              <div className="level-right">
                <button
                  className="button is-primary is-small"
                  onClick={() => {
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

            {/* Show existing providers status */}
            {Object.entries(section.subsections || {}).filter(
              ([name]) =>
                name.toLowerCase().includes("oidc") && name !== "OIDC Providers"
            ).length > 0 ? (
              <div className="notification is-info is-light mb-4">
                <p className="is-size-7">
                  <strong>
                    {
                      Object.entries(section.subsections || {}).filter(
                        ([name]) =>
                          name.toLowerCase().includes("oidc") &&
                          name !== "OIDC Providers"
                      ).length
                    }
                  </strong>{" "}
                  OIDC provider(s) configured. Individual providers are shown as
                  expandable sections below.
                </p>
              </div>
            ) : (
              <div className="notification is-warning is-light mb-4">
                <p className="is-size-7">
                  No OIDC providers configured yet. Click "Add OIDC Provider" to
                  set up authentication with providers like Google, Microsoft,
                  GitHub, etc.
                </p>
              </div>
            )}

            {/* Render any fields if they exist */}
            {subsection.fields.length > 0 && (
              <div className="columns is-multiline">
                {subsection.fields.map((field) => (
                  <div
                    key={field.path}
                    className={
                      field.type === "textarea" || field.type === "array"
                        ? "column is-full"
                        : "column is-half"
                    }
                  >
                    {renderField(field)}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // Regular subsection rendering
  return (
    <div className="box mb-4">
      <div
        className="is-clickable pb-2"
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
        role="button"
        tabIndex={0}
        aria-expanded={!isCollapsed}
      >
        <h3 className="title is-6 mb-2">
          <span className="icon is-small mr-2">
            <i
              className={`fas ${isCollapsed ? "fa-chevron-right" : "fa-chevron-down"}`}
            />
          </span>
          <span className="icon is-small mr-2">
            <i className={section.icon} />
          </span>
          {subsection.title}
          <span className="tag is-light is-small ml-2">
            {subsection.fields.length} setting
            {subsection.fields.length !== 1 ? "s" : ""}
          </span>
        </h3>
      </div>

      {/* Collapsible Content */}
      {!isCollapsed && (
        <div className="mt-3">
          <div className="columns is-multiline">
            {subsection.fields.map((field) => (
              <div
                key={field.path}
                className={
                  field.type === "textarea" || field.type === "array"
                    ? "column is-full"
                    : "column is-half"
                }
              >
                {renderField(field)}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const SettingsContent = ({
  activeTab,
  sections,
  values,
  collapsedSubsections,
  setCollapsedSubsections,
  sslFiles,
  uploadingFiles,
  loading,
  onFieldChange,
  onSslFileUpload,
  onSetMsg,
  renderField,
  renderSSLFileField,
  shouldShowSubsection,
  // Testing panel props
  testEmail,
  setTestEmail,
  testLoading,
  testResults,
  testMailConnection,
  ldapTestCredentials,
  setLdapTestCredentials,
  testLdapConnection,
  resetOidcProviderForm,
  setShowOidcProviderModal,
}) => {
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

  const isSubsectionCollapsed = useCallback(
    (sectionName, subsectionName) => {
      const key = `${sectionName}-${subsectionName}`;
      return collapsedSubsections[key] || false;
    },
    [collapsedSubsections]
  );

  const renderSectionFields = useCallback(
    (sectionName, section) => {
      if (sectionName === "Logging") {
        return (
          <LoggingSectionRenderer
            section={section}
            values={values}
            handleFieldChange={onFieldChange}
            loading={loading}
          />
        );
      }

      if (sectionName === "Authentication") {
        return (
          <AuthenticationSectionRenderer
            section={section}
            values={values}
            renderField={renderField}
            ldapTestCredentials={ldapTestCredentials}
            setLdapTestCredentials={setLdapTestCredentials}
            testLoading={testLoading}
            loading={loading}
            testLdapConnection={testLdapConnection}
            testResults={testResults}
            resetOidcProviderForm={resetOidcProviderForm}
            setShowOidcProviderModal={setShowOidcProviderModal}
          />
        );
      }

      if (sectionName === "Mail") {
        return (
          <MailSectionRenderer
            section={section}
            renderField={renderField}
            testEmail={testEmail}
            setTestEmail={setTestEmail}
            testLoading={testLoading}
            loading={loading}
            testMailConnection={testMailConnection}
            testResults={testResults}
          />
        );
      }

      if (sectionName === "Server") {
        return (
          <ServerSectionRenderer
            section={section}
            renderField={renderField}
            renderSSLFileField={renderSSLFileField}
          />
        );
      }

      return (
        <StandardSectionRenderer section={section} renderField={renderField} />
      );
    },
    [
      values,
      onFieldChange,
      loading,
      renderField,
      ldapTestCredentials,
      setLdapTestCredentials,
      testLoading,
      testLdapConnection,
      testResults,
      resetOidcProviderForm,
      setShowOidcProviderModal,
      testEmail,
      setTestEmail,
      testMailConnection,
      renderSSLFileField,
    ]
  );

  return (
    <>
      {/* Dynamic Configuration Sections */}
      {Object.entries(sections).map(
        ([sectionName, section]) =>
          activeTab === sectionName && (
            <div key={sectionName}>
              {/* Main Section Fields */}
              {section.fields.length > 0 && (
                <div className="box mb-4">
                  <h2 className="title is-5">
                    <span className="icon is-small mr-2">
                      <i className={section.icon} />
                    </span>
                    {section.title} Settings
                    <span className="tag is-light is-small ml-2">
                      {section.fields.length} setting
                      {section.fields.length !== 1 ? "s" : ""}
                    </span>
                  </h2>

                  {/* Section description from config */}
                  {section.description && (
                    <p className="subtitle is-6 has-text-grey mt-2 mb-4">
                      {section.description}
                    </p>
                  )}

                  {renderSectionFields(sectionName, section)}
                </div>
              )}

              {/* Subsections with Collapsible Cards */}
              {Object.entries(section.subsections || {}).map(
                ([subsectionName, subsection]) => {
                  // Skip subsection if none of its fields should be shown
                  if (!shouldShowSubsection(subsection, subsectionName)) {
                    return null;
                  }

                  const isCollapsed = isSubsectionCollapsed(
                    sectionName,
                    subsectionName
                  );

                  return (
                    <SubsectionRenderer
                      key={subsectionName}
                      sectionName={sectionName}
                      subsectionName={subsectionName}
                      subsection={subsection}
                      section={section}
                      isCollapsed={isCollapsed}
                      toggleSubsection={toggleSubsection}
                      renderField={renderField}
                      resetOidcProviderForm={resetOidcProviderForm}
                      setShowOidcProviderModal={setShowOidcProviderModal}
                      loading={loading}
                    />
                  );
                }
              )}

              {/* Show default message if section has no fields or subsections */}
              {section.fields.length === 0 &&
                Object.keys(section.subsections || {}).length === 0 && (
                  <div className="box mb-4">
                    <h2 className="title is-5">
                      <span className="icon is-small mr-2">
                        <i className={section.icon} />
                      </span>
                      {section.title} Settings
                    </h2>

                    {section.description && (
                      <p className="subtitle is-6 has-text-grey mb-4">
                        {section.description}
                      </p>
                    )}

                    <div className="notification is-info">
                      <p>No settings available in this section yet.</p>
                    </div>
                  </div>
                )}
            </div>
          )
      )}
    </>
  );
};

export default SettingsContent;
