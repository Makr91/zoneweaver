import PropTypes from "prop-types";

import { getValidationColor } from "./syslogUtils";

/**
 * Configuration text editor with validation and action buttons
 */
const ConfigEditorView = ({
  configContent,
  setConfigContent,
  validation,
  loading,
  validationLoading,
  validateConfiguration,
  applyConfiguration,
  reloadSyslog,
}) => (
  <div className="box">
    <h4 className="title is-6 mb-4">
      <span className="icon-text">
        <span className="icon">
          <i className="fas fa-edit" />
        </span>
        <span>Configuration Editor</span>
      </span>
    </h4>

    <div className="field">
      <label className="label" htmlFor="syslog-config-editor">
        Syslog Configuration Content
      </label>
      <div className="control">
        <textarea
          id="syslog-config-editor"
          className="textarea is-family-monospace"
          rows="20"
          value={configContent}
          onChange={(e) => setConfigContent(e.target.value)}
          placeholder="# Enter syslog configuration rules here
# Example:
*.notice			/var/adm/messages
mail.info			/var/log/maillog
kern.err			@loghost
*.emerg				*"
          disabled={loading}
          style={{ fontSize: "0.85rem" }}
        />
      </div>
      <p className="help">
        Edit the complete syslog.conf file content. Use TAB to separate
        selectors from actions.
      </p>
    </div>

    {/* Validation Results */}
    {validation && (
      <div
        className={`notification ${getValidationColor(validation.errors, validation.warnings)} mt-4`}
      >
        <h5 className="title is-6">Validation Results</h5>

        {validation.errors && validation.errors.length > 0 && (
          <div className="content">
            <p className="has-text-weight-semibold has-text-danger">Errors:</p>
            <ul>
              {validation.errors.map((error) => (
                <li key={error}>{error}</li>
              ))}
            </ul>
          </div>
        )}

        {validation.warnings && validation.warnings.length > 0 && (
          <div className="content">
            <p className="has-text-weight-semibold has-text-warning">
              Warnings:
            </p>
            <ul>
              {validation.warnings.map((warning) => (
                <li key={warning}>{warning}</li>
              ))}
            </ul>
          </div>
        )}

        {validation.parsed_rules && validation.parsed_rules.length > 0 && (
          <div className="content">
            <p className="has-text-weight-semibold">Parsed Rules:</p>
            <div className="notification is-light is-small">
              <p className="is-size-7">
                {validation.parsed_rules.length} rule(s) will be active after
                applying this configuration.
              </p>
            </div>
          </div>
        )}
      </div>
    )}

    {/* Editor Action Buttons */}
    <div className="field is-grouped mt-4">
      <div className="control">
        <button
          type="button"
          className={`button is-info ${validationLoading ? "is-loading" : ""}`}
          onClick={validateConfiguration}
          disabled={loading || validationLoading}
        >
          <span className="icon">
            <i className="fas fa-check-circle" />
          </span>
          <span>Validate Configuration</span>
        </button>
      </div>

      <div className="control">
        <button
          type="button"
          className={`button is-primary ${loading ? "is-loading" : ""}`}
          onClick={applyConfiguration}
          disabled={loading || validationLoading}
        >
          <span className="icon">
            <i className="fas fa-save" />
          </span>
          <span>Apply Configuration</span>
        </button>
      </div>

      <div className="control">
        <button
          type="button"
          className={`button is-warning ${loading ? "is-loading" : ""}`}
          onClick={reloadSyslog}
          disabled={loading || validationLoading}
        >
          <span className="icon">
            <i className="fas fa-redo" />
          </span>
          <span>Reload Service</span>
        </button>
      </div>
    </div>
  </div>
);

ConfigEditorView.propTypes = {
  configContent: PropTypes.string.isRequired,
  setConfigContent: PropTypes.func.isRequired,
  validation: PropTypes.object,
  loading: PropTypes.bool.isRequired,
  validationLoading: PropTypes.bool.isRequired,
  validateConfiguration: PropTypes.func.isRequired,
  applyConfiguration: PropTypes.func.isRequired,
  reloadSyslog: PropTypes.func.isRequired,
};

export default ConfigEditorView;
