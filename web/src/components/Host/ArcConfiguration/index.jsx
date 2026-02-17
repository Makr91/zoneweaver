import PropTypes from "prop-types";

import ConfirmModal from "../../common/ConfirmModal";

import ArcStatusSection from "./ArcStatusSection";
import { getValidationColor } from "./arcUtils";
import HelpSection from "./HelpSection";
import MemoryParametersSection from "./MemoryParametersSection";
import PerformanceSection from "./PerformanceSection";
import { useArcConfig } from "./useArcConfig";

const ArcConfiguration = ({ server }) => {
  const {
    currentConfig,
    formData,
    validation,
    loading,
    validationLoading,
    message,
    setMessage,
    messageType,
    handleFormChange,
    validateConfiguration,
    applyConfiguration,
    showResetConfirm,
    requestResetToDefaults,
    cancelReset,
    confirmResetToDefaults,
  } = useArcConfig(server);

  if (loading && !currentConfig) {
    return (
      <div className="box">
        <div className="has-text-centered">
          <div className="loader" />
          <p className="mt-3">Loading ARC configuration...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Status Messages */}
      {message && (
        <div className={`notification ${messageType} mb-4`}>
          <button className="delete" onClick={() => setMessage("")} />
          <p>{message}</p>
        </div>
      )}

      {/* Current Status */}
      <ArcStatusSection currentConfig={currentConfig} />

      {/* Configuration Form */}
      <div className="box">
        <h4 className="title is-6 mb-4">
          <span className="icon-text">
            <span className="icon">
              <i className="fas fa-cog" />
            </span>
            <span>ZFS Configuration</span>
          </span>
        </h4>

        <MemoryParametersSection
          formData={formData}
          currentConfig={currentConfig}
          loading={loading}
          handleFormChange={handleFormChange}
        />

        <PerformanceSection
          formData={formData}
          loading={loading}
          handleFormChange={handleFormChange}
        />

        {/* Validation Results */}
        {validation && (
          <div
            className={`notification ${getValidationColor(validation.errors, validation.warnings)} mt-4`}
          >
            <h5 className="title is-6">Validation Results</h5>

            {validation.errors && validation.errors.length > 0 && (
              <div className="content">
                <p className="has-text-weight-semibold has-text-danger">
                  Errors:
                </p>
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

            {validation.proposed_settings && (
              <div className="content">
                <p className="has-text-weight-semibold">Proposed Settings:</p>
                <div className="tags">
                  {validation.proposed_settings.arc_max_gb && (
                    <span className="tag is-info">
                      Max: {validation.proposed_settings.arc_max_gb} GB
                    </span>
                  )}
                  {validation.proposed_settings.arc_min_gb && (
                    <span className="tag is-info">
                      Min: {validation.proposed_settings.arc_min_gb} GB
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="field is-grouped mt-4">
          <div className="control">
            <button
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
              className={`button is-warning ${loading ? "is-loading" : ""}`}
              onClick={requestResetToDefaults}
              disabled={loading || validationLoading}
            >
              <span className="icon">
                <i className="fas fa-undo" />
              </span>
              <span>Reset to Defaults</span>
            </button>
          </div>
        </div>
      </div>

      {/* Help Section */}
      <HelpSection />

      <ConfirmModal
        isOpen={showResetConfirm}
        onClose={cancelReset}
        onConfirm={confirmResetToDefaults}
        title="Reset ARC Configuration"
        message="Are you sure you want to reset ARC configuration to defaults? This will remove all custom settings."
        confirmText="Reset to Defaults"
        confirmVariant="is-warning"
        loading={loading}
      />
    </div>
  );
};

ArcConfiguration.propTypes = {
  server: PropTypes.object,
};

export default ArcConfiguration;
