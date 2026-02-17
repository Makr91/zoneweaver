import PropTypes from "prop-types";

const ConfigEditor = ({
  configContent,
  setConfigContent,
  backupConfig,
  setBackupConfig,
  isConfigValid,
  saving,
}) => (
  <div className="box mb-4">
    <h3 className="title is-6">Configuration Editor</h3>

    <div className="field">
      <div className="control">
        <textarea
          className={`textarea is-family-monospace ${!isConfigValid && configContent ? "is-danger" : ""}`}
          rows="15"
          placeholder="Enter NTP configuration..."
          value={configContent}
          onChange={(e) => setConfigContent(e.target.value)}
          disabled={saving}
        />
      </div>
      {configContent && !isConfigValid && (
        <p className="help is-danger">
          Configuration appears to be invalid. Make sure to include at least one
          server or pool directive.
        </p>
      )}
    </div>

    <div className="field">
      <div className="control">
        <label className="checkbox">
          <input
            type="checkbox"
            checked={backupConfig}
            onChange={(e) => setBackupConfig(e.target.checked)}
            disabled={saving}
          />
          <span className="ml-2">Create backup of existing configuration</span>
        </label>
      </div>
      <p className="help">
        Recommended: Create a backup copy before making changes to allow easy
        recovery.
      </p>
    </div>
  </div>
);

ConfigEditor.propTypes = {
  configContent: PropTypes.string.isRequired,
  setConfigContent: PropTypes.func.isRequired,
  backupConfig: PropTypes.bool.isRequired,
  setBackupConfig: PropTypes.func.isRequired,
  isConfigValid: PropTypes.bool.isRequired,
  saving: PropTypes.bool.isRequired,
};

export default ConfigEditor;
