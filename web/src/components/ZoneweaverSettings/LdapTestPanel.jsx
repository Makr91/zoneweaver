import axios from "axios";
import PropTypes from "prop-types";
import { useCallback } from "react";

const LdapTestPanel = ({
  values,
  testResults,
  setTestResults,
  testLoading,
  setTestLoading,
  ldapTestCredentials,
  setLdapTestCredentials,
  setMsg,
  loading,
}) => {
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

LdapTestPanel.propTypes = {
  values: PropTypes.object.isRequired,
  testResults: PropTypes.object.isRequired,
  setTestResults: PropTypes.func.isRequired,
  testLoading: PropTypes.object.isRequired,
  setTestLoading: PropTypes.func.isRequired,
  ldapTestCredentials: PropTypes.shape({
    testUsername: PropTypes.string,
    testPassword: PropTypes.string,
  }).isRequired,
  setLdapTestCredentials: PropTypes.func.isRequired,
  setMsg: PropTypes.func.isRequired,
  loading: PropTypes.bool.isRequired,
};

export default LdapTestPanel;
