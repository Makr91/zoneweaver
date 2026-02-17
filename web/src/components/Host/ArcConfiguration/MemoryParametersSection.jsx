import PropTypes from "prop-types";

import {
  computeSliderBackground,
  formatGbValue,
  safeBytesToGb,
  safeParseFloat,
} from "./arcUtils";

const MemoryParametersSection = ({
  formData,
  currentConfig,
  loading,
  handleFormChange,
}) => {
  const constraints = currentConfig?.system_constraints;

  // ARC Max slider bounds (computed once, used in slider attrs + help text + gradient)
  const arcMaxMin = constraints
    ? Math.max(
        safeParseFloat(formData.arc_min_gb) || 0,
        safeBytesToGb(constraints.min_recommended_arc_bytes)
      ).toFixed(2)
    : "1";
  const arcMaxMax = constraints
    ? safeBytesToGb(constraints.max_safe_arc_bytes).toFixed(2)
    : "100";
  const arcMaxValue =
    formData.arc_max_gb ||
    (constraints
      ? safeBytesToGb(constraints.max_safe_arc_bytes).toFixed(2)
      : "50");

  // ARC Min slider bounds
  const arcMinMin = constraints
    ? safeBytesToGb(constraints.min_recommended_arc_bytes).toFixed(2)
    : "0.5";
  const maxSafeArc = constraints
    ? safeBytesToGb(constraints.max_safe_arc_bytes)
    : 100;
  const arcMinMax = formData.arc_max_gb
    ? Math.min(parseFloat(formData.arc_max_gb), maxSafeArc).toFixed(2)
    : maxSafeArc.toFixed(2);
  const arcMinValue =
    formData.arc_min_gb ||
    (constraints
      ? safeBytesToGb(constraints.min_recommended_arc_bytes).toFixed(2)
      : "1");

  return (
    <>
      <h5 className="title is-6 mb-3 has-text-primary">
        <span className="icon-text">
          <span className="icon">
            <i className="fas fa-memory" />
          </span>
          <span>Memory Parameters</span>
        </span>
      </h5>

      {/* ARC Max / ARC Min */}
      <div className="columns">
        <div className="column is-6">
          <div className="field mb-4">
            <label className="label">
              Maximum ARC Size:{" "}
              {formatGbValue(formData.arc_max_gb)
                ? `${formatGbValue(formData.arc_max_gb)} GB`
                : "Auto"}
            </label>
            <div className="control mt-4 mb-4">
              <input
                className="zw-range-slider-primary"
                type="range"
                min={arcMaxMin}
                max={arcMaxMax}
                step="0.25"
                value={arcMaxValue}
                onChange={(e) => handleFormChange("arc_max_gb", e.target.value)}
                disabled={loading}
                onClick={(e) => e.stopPropagation()}
                style={{
                  background: computeSliderBackground(
                    formData.arc_max_gb,
                    parseFloat(arcMaxMin),
                    parseFloat(arcMaxMax),
                    "#007bff"
                  ),
                }}
              />
            </div>
            <div className="help is-size-7">
              Range: {arcMaxMin} GB to {arcMaxMax} GB
              <br />
              Leave unset for auto-calculation based on system memory.
            </div>
            <div className="field mt-3">
              <div className="control">
                <button
                  className="button is-small is-light"
                  onClick={() => handleFormChange("arc_max_gb", "")}
                  disabled={loading}
                  title="Reset to auto-calculation"
                >
                  <span className="icon is-small">
                    <i className="fas fa-undo" />
                  </span>
                  <span>Auto</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="column is-6">
          <div className="field mb-4">
            <label className="label">
              Minimum ARC Size:{" "}
              {formatGbValue(formData.arc_min_gb)
                ? `${formatGbValue(formData.arc_min_gb)} GB`
                : "Auto"}
            </label>
            <div className="control mt-4 mb-4">
              <input
                className="zw-range-slider-info"
                type="range"
                min={arcMinMin}
                max={arcMinMax}
                step="0.25"
                value={arcMinValue}
                onChange={(e) => handleFormChange("arc_min_gb", e.target.value)}
                disabled={loading}
                onClick={(e) => e.stopPropagation()}
                style={{
                  background: computeSliderBackground(
                    formData.arc_min_gb,
                    parseFloat(arcMinMin),
                    parseFloat(arcMinMax),
                    "#17a2b8"
                  ),
                }}
              />
            </div>
            <div className="help is-size-7">
              Range: {arcMinMin} GB to {arcMinMax} GB
              <br />
              Leave unset for auto-calculation based on system memory.
            </div>
            <div className="field mt-3">
              <div className="control">
                <button
                  className="button is-small is-light"
                  onClick={() => handleFormChange("arc_min_gb", "")}
                  disabled={loading}
                  title="Reset to auto-calculation"
                >
                  <span className="icon is-small">
                    <i className="fas fa-undo" />
                  </span>
                  <span>Auto</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ARC Max Percent / User Reserve Hint */}
      <div className="columns">
        <div className="column is-6">
          <div className="field mb-4">
            <label className="label">
              ARC Max Percent:{" "}
              {formData.arc_max_percent
                ? `${formData.arc_max_percent}%`
                : "Auto"}
              <span className="tag is-success is-small ml-2">Dynamic</span>
            </label>
            <div className="control mt-4 mb-4">
              <input
                className="zw-range-slider-primary"
                type="range"
                min="1"
                max="100"
                step="1"
                value={formData.arc_max_percent || "90"}
                onChange={(e) =>
                  handleFormChange("arc_max_percent", e.target.value)
                }
                disabled={loading}
                onClick={(e) => e.stopPropagation()}
                style={{
                  background: computeSliderBackground(
                    formData.arc_max_percent,
                    0,
                    100,
                    "#007bff"
                  ),
                }}
              />
            </div>
            <div className="help is-size-7">
              Alternative to ARC max GB - sets ARC as percentage of physical
              memory (1-100%).
              <br />
              Takes effect immediately without reboot.
            </div>
            <div className="field mt-3">
              <div className="control">
                <button
                  className="button is-small is-light"
                  onClick={() => handleFormChange("arc_max_percent", "")}
                  disabled={loading}
                  title="Reset to auto-calculation"
                >
                  <span className="icon is-small">
                    <i className="fas fa-undo" />
                  </span>
                  <span>Auto</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="column is-6">
          <div className="field mb-4">
            <label className="label">
              User Reserve Hint:{" "}
              {formData.user_reserve_hint_pct
                ? `${formData.user_reserve_hint_pct}%`
                : "None"}
              <span className="tag is-success is-small ml-2">Dynamic</span>
            </label>
            <div className="control mt-4 mb-4">
              <input
                className="zw-range-slider-info"
                type="range"
                min="0"
                max="99"
                step="1"
                value={formData.user_reserve_hint_pct || "0"}
                onChange={(e) =>
                  handleFormChange("user_reserve_hint_pct", e.target.value)
                }
                disabled={loading}
                onClick={(e) => e.stopPropagation()}
                style={{
                  background: computeSliderBackground(
                    formData.user_reserve_hint_pct,
                    0,
                    100,
                    "#17a2b8"
                  ),
                }}
              />
            </div>
            <div className="help is-size-7">
              Memory reserved for applications (0-99%). Alternative to setting
              ARC max.
              <br />
              Recommended for database servers. Takes effect immediately.
            </div>
            <div className="field mt-3">
              <div className="control">
                <button
                  className="button is-small is-light"
                  onClick={() => handleFormChange("user_reserve_hint_pct", "")}
                  disabled={loading}
                  title="Reset to no reservation"
                >
                  <span className="icon is-small">
                    <i className="fas fa-undo" />
                  </span>
                  <span>None</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

MemoryParametersSection.propTypes = {
  formData: PropTypes.object.isRequired,
  currentConfig: PropTypes.object,
  loading: PropTypes.bool.isRequired,
  handleFormChange: PropTypes.func.isRequired,
};

export default MemoryParametersSection;
