import PropTypes from "prop-types";

const ConfigTemplates = ({
  configInfo,
  selectedTemplate,
  setSelectedTemplate,
  onLoadTemplate,
  onRefresh,
  loading,
  saving,
}) => (
  <div className="box mb-4">
    <h3 className="title is-6">Configuration Templates</h3>

    <div className="field is-grouped">
      <div className="control is-expanded">
        <div className="select is-fullwidth">
          <select
            value={selectedTemplate}
            onChange={(e) => setSelectedTemplate(e.target.value)}
          >
            <option value="">Select a template...</option>
            {configInfo?.suggested_defaults?.config_template && (
              <option value="default">Default Pool Configuration</option>
            )}
          </select>
        </div>
      </div>
      <div className="control">
        <button
          className="button is-info"
          onClick={onLoadTemplate}
          disabled={!selectedTemplate || loading}
        >
          <span className="icon">
            <i className="fas fa-download" />
          </span>
          <span>Load Template</span>
        </button>
      </div>
      <div className="control">
        <button
          className={`button is-info ${loading ? "is-loading" : ""}`}
          onClick={onRefresh}
          disabled={loading || saving}
        >
          <span className="icon">
            <i className="fas fa-refresh" />
          </span>
          <span>Refresh</span>
        </button>
      </div>
    </div>
  </div>
);

ConfigTemplates.propTypes = {
  configInfo: PropTypes.object,
  selectedTemplate: PropTypes.string.isRequired,
  setSelectedTemplate: PropTypes.func.isRequired,
  onLoadTemplate: PropTypes.func.isRequired,
  onRefresh: PropTypes.func.isRequired,
  loading: PropTypes.bool.isRequired,
  saving: PropTypes.bool.isRequired,
};

export default ConfigTemplates;
