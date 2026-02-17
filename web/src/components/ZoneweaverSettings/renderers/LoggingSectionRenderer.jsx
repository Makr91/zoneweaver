import PropTypes from "prop-types";

const LoggingSectionRenderer = ({ values, handleFieldChange, loading }) => (
  <div className="columns is-vcentered">
    {/* Logging Level - Left Column */}
    <div className="column is-6">
      <div className="field">
        <label
          className="label has-text-weight-semibold"
          htmlFor="logging-level"
        >
          <span className="icon is-small mr-2">
            <i className="fas fa-layer-group" />
          </span>
          Logging Level
        </label>
        <div className="control has-icons-left">
          <div className="select is-fullwidth">
            <select
              id="logging-level"
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
        <label
          className="label has-text-weight-semibold"
          htmlFor="logging-enabled"
        >
          <span className="icon is-small mr-2">
            <i className="fas fa-power-off" />
          </span>
          Enable Logging
        </label>
        <div className="control">
          <div className="field">
            <label className="switch is-medium" htmlFor="logging-enabled">
              <input
                id="logging-enabled"
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

LoggingSectionRenderer.propTypes = {
  values: PropTypes.object.isRequired,
  handleFieldChange: PropTypes.func.isRequired,
  loading: PropTypes.bool.isRequired,
};

export default LoggingSectionRenderer;
