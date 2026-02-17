import PropTypes from "prop-types";

const ConfigActions = ({
  onSave,
  onReset,
  onRestart,
  hasChanges,
  isConfigValid,
  saving,
  loading,
}) => (
  <div className="box">
    <h3 className="title is-6">Configuration Actions</h3>

    <div className="field is-grouped">
      <div className="control">
        <button
          className={`button is-primary ${saving ? "is-loading" : ""}`}
          onClick={onSave}
          disabled={!hasChanges || !isConfigValid || saving || loading}
        >
          <span className="icon">
            <i className="fas fa-save" />
          </span>
          <span>Save Configuration</span>
        </button>
      </div>
      <div className="control">
        <button
          className="button"
          onClick={onReset}
          disabled={!hasChanges || saving}
        >
          <span className="icon">
            <i className="fas fa-undo" />
          </span>
          <span>Reset Changes</span>
        </button>
      </div>
      <div className="control">
        <button
          className="button is-warning"
          onClick={onRestart}
          disabled={saving || loading}
        >
          <span className="icon">
            <i className="fas fa-redo" />
          </span>
          <span>Restart Service</span>
        </button>
      </div>
    </div>

    {hasChanges && (
      <div className="notification is-info is-light mt-3">
        <p>
          You have unsaved changes. Remember to restart the time synchronization
          service after saving to apply the new configuration.
        </p>
      </div>
    )}
  </div>
);

ConfigActions.propTypes = {
  onSave: PropTypes.func.isRequired,
  onReset: PropTypes.func.isRequired,
  onRestart: PropTypes.func.isRequired,
  hasChanges: PropTypes.bool.isRequired,
  isConfigValid: PropTypes.bool.isRequired,
  saving: PropTypes.bool.isRequired,
  loading: PropTypes.bool.isRequired,
};

export default ConfigActions;
