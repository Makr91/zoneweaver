import PropTypes from "prop-types";

const OidcProviderForm = ({
  oidcProviderForm,
  handleOidcProviderFormChange,
  oidcProviderLoading,
}) => {
  const isProviderEnabled = oidcProviderForm.enabled;

  return (
    <>
      <div className="content">
        <p className="has-text-grey mb-4">
          Configure a new OpenID Connect authentication provider. You&apos;ll
          need to register your application with the provider first to get the
          client ID and client secret.
        </p>
      </div>

      <div className="columns is-multiline">
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
              Internal identifier (lowercase, letters, numbers, and underscores
              only)
            </p>
          </div>
        </div>

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
              The OIDC issuer URL (check your provider&apos;s documentation for
              the correct URL)
            </p>
          </div>
        </div>

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
                    handleOidcProviderFormChange("responseType", e.target.value)
                  }
                  disabled={oidcProviderLoading}
                >
                  <option value="code">Authorization Code (Recommended)</option>
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

        <div className="column is-full">
          <div className="field">
            <label className="label" htmlFor="oidc-enabled">
              Status
            </label>
            <div className="control">
              <label className="switch" htmlFor="oidc-enabled">
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
            <p className="help">Enable this provider for user authentication</p>
          </div>
        </div>
      </div>

      <div className="notification is-info is-light mt-4">
        <h4 className="title is-6">Configuration Instructions</h4>
        <div className="content">
          <p>
            <strong>Setup Steps:</strong>
          </p>
          <ol className="is-size-7">
            <li>
              Register your application with your OIDC provider&apos;s developer
              console
            </li>
            <li>
              Add <code>https://your-domain.com/api/auth/oidc/callback</code> as
              an allowed redirect URI
            </li>
            <li>
              Copy the Client ID and Client Secret from your provider&apos;s
              console
            </li>
            <li>Find your provider&apos;s issuer URL in their documentation</li>
            <li>Fill in the form above with these details</li>
          </ol>
        </div>
      </div>
    </>
  );
};

OidcProviderForm.propTypes = {
  oidcProviderForm: PropTypes.shape({
    name: PropTypes.string,
    displayName: PropTypes.string,
    issuer: PropTypes.string,
    clientId: PropTypes.string,
    clientSecret: PropTypes.string,
    scope: PropTypes.string,
    responseType: PropTypes.string,
    enabled: PropTypes.bool,
  }).isRequired,
  handleOidcProviderFormChange: PropTypes.func.isRequired,
  oidcProviderLoading: PropTypes.bool.isRequired,
};

export default OidcProviderForm;
