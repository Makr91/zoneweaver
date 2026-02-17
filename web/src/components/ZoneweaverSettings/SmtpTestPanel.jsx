import axios from "axios";
import PropTypes from "prop-types";
import { useCallback } from "react";

const SmtpTestPanel = ({
  testResults,
  setTestResults,
  testLoading,
  setTestLoading,
  testEmail,
  setTestEmail,
  setMsg,
  loading,
}) => {
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
            <strong>Note:</strong> Save settings first, then use the test button
            to verify configuration.
          </p>
        </div>
      </div>
    </div>
  );
};

SmtpTestPanel.propTypes = {
  testResults: PropTypes.object.isRequired,
  setTestResults: PropTypes.func.isRequired,
  testLoading: PropTypes.object.isRequired,
  setTestLoading: PropTypes.func.isRequired,
  testEmail: PropTypes.string.isRequired,
  setTestEmail: PropTypes.func.isRequired,
  setMsg: PropTypes.func.isRequired,
  loading: PropTypes.bool.isRequired,
};

export default SmtpTestPanel;
