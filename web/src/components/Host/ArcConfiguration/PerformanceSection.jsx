import PropTypes from "prop-types";

import { computeSliderBackground } from "./arcUtils";

const PerformanceSection = ({ formData, loading, handleFormChange }) => (
  <>
    <hr />
    <h5 className="title is-6 mb-3 has-text-info">
      <span className="icon-text">
        <span className="icon">
          <i className="fas fa-tachometer-alt" />
        </span>
        <span>Performance Parameters</span>
      </span>
    </h5>

    <div className="columns">
      <div className="column is-6">
        <div className="field mb-4">
          <label className="label">
            VDev Max Pending:{" "}
            {formData.vdev_max_pending ? formData.vdev_max_pending : "Auto"}
            <span className="tag is-success is-small ml-2">Dynamic</span>
          </label>
          <div className="control mt-4 mb-4">
            <input
              className="zw-range-slider-primary"
              type="range"
              min="1"
              max="100"
              step="1"
              value={formData.vdev_max_pending || "10"}
              onChange={(e) =>
                handleFormChange("vdev_max_pending", e.target.value)
              }
              disabled={loading}
              onClick={(e) => e.stopPropagation()}
              style={{
                background: computeSliderBackground(
                  formData.vdev_max_pending,
                  0,
                  100,
                  "#007bff"
                ),
              }}
            />
          </div>
          <div className="help is-size-7">
            Max concurrent I/Os per device (1-100). Higher values for storage
            arrays.
            <br />
            Typical: 10 (default), 35-50 (high-performance storage).
          </div>
          <div className="field mt-3">
            <div className="control">
              <button
                className="button is-small is-light"
                onClick={() => handleFormChange("vdev_max_pending", "")}
                disabled={loading}
                title="Reset to default (10)"
              >
                <span className="icon is-small">
                  <i className="fas fa-undo" />
                </span>
                <span>Default</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="column is-6">
        <div className="field">
          <p className="label">
            ZFS Prefetching
            <span className="tag is-success is-small ml-2">Dynamic</span>
          </p>
          <div className="control">
            <label className="checkbox">
              <input
                type="checkbox"
                checked={!formData.prefetch_disable}
                onChange={(e) =>
                  handleFormChange("prefetch_disable", !e.target.checked)
                }
                disabled={loading}
                onClick={(e) => e.stopPropagation()}
              />
              <span className="ml-2">Enable ZFS file-level prefetching</span>
            </label>
          </div>
          <div className="help is-size-7 mt-2">
            Prefetching improves sequential read performance by predicting
            future reads.
            <br />
            Keep enabled for most workloads. Disable only for specific use
            cases.
          </div>
        </div>
      </div>
    </div>

    <div className="columns">
      <div className="column is-6">
        <div className="field">
          <label className="label" htmlFor="apply-method">
            Apply Method
          </label>
          <div className="control">
            <div className="select is-fullwidth">
              <select
                id="apply-method"
                value={formData.apply_method}
                onChange={(e) =>
                  handleFormChange("apply_method", e.target.value)
                }
                disabled={loading}
              >
                <option value="runtime">Runtime Only (Temporary)</option>
                <option value="persistent">
                  Persistent Only (Reboot Required)
                </option>
                <option value="both">Both Runtime + Persistent</option>
              </select>
            </div>
          </div>
          <p className="help">Choose how to apply the changes.</p>
        </div>
      </div>
      <div className="column is-6">{/* Empty column for layout balance */}</div>
    </div>
  </>
);

PerformanceSection.propTypes = {
  formData: PropTypes.object.isRequired,
  loading: PropTypes.bool.isRequired,
  handleFormChange: PropTypes.func.isRequired,
};

export default PerformanceSection;
