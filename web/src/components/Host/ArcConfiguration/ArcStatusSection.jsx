import PropTypes from "prop-types";

import { formatBytes } from "./arcUtils";

const ArcStatusSection = ({ currentConfig }) => {
  if (!currentConfig) {
    return null;
  }

  return (
    <div className="box mb-4">
      <h4 className="title is-6 mb-3">
        <span className="icon-text">
          <span className="icon">
            <i className="fas fa-info-circle" />
          </span>
          <span>Current ARC Status</span>
        </span>
      </h4>

      <div className="columns">
        <div className="column">
          <div className="field">
            <p className="label is-small">Current ARC Size</p>
            <p className="control">
              <span className="tag is-info">
                {formatBytes(currentConfig.current_config?.arc_size_bytes)}
              </span>
            </p>
          </div>
        </div>
        <div className="column">
          <div className="field">
            <p className="label is-small">Max ARC Size</p>
            <p className="control">
              <span className="tag is-primary">
                {formatBytes(currentConfig.current_config?.arc_max_bytes)}
              </span>
            </p>
          </div>
        </div>
        <div className="column">
          <div className="field">
            <p className="label is-small">Min ARC Size</p>
            <p className="control">
              <span className="tag is-dark">
                {formatBytes(currentConfig.current_config?.arc_min_bytes)}
              </span>
            </p>
          </div>
        </div>
        <div className="column">
          <div className="field">
            <p className="label is-small">Physical Memory</p>
            <p className="control">
              <span className="tag is-light">
                {formatBytes(
                  currentConfig.system_constraints?.physical_memory_bytes
                )}
              </span>
            </p>
          </div>
        </div>
      </div>

      {currentConfig.system_constraints && (
        <div className="notification is-dark mt-3">
          <h5 className="title is-6 mb-2">System Constraints</h5>
          <div className="content is-small">
            <p>
              <strong>Max Safe ARC:</strong>{" "}
              {formatBytes(currentConfig.system_constraints.max_safe_arc_bytes)}
              (85% of physical memory)
            </p>
            <p>
              <strong>Min Recommended:</strong>{" "}
              {formatBytes(
                currentConfig.system_constraints.min_recommended_arc_bytes
              )}
              (1% of physical memory)
            </p>
            <p>
              <strong>Configuration Source:</strong>{" "}
              {currentConfig.config_source || "auto-calculated"}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

ArcStatusSection.propTypes = {
  currentConfig: PropTypes.object,
};

export default ArcStatusSection;
