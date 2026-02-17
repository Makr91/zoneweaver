import PropTypes from "prop-types";
import { useState } from "react";

const VncDisplaySettingsSubmenu = ({
  quality,
  compression,
  resize,
  showDot,
  onQualityChange,
  onCompressionChange,
  onResizeChange,
  onShowDotChange,
  calculateSubmenuPosition,
}) => {
  const [showDisplaySettings, setShowDisplaySettings] = useState(false);

  return (
    <div
      className="dropdown-item is-relative is-flex is-justify-content-space-between is-align-items-center"
      onMouseEnter={() => setShowDisplaySettings(true)}
      onMouseLeave={() => setShowDisplaySettings(false)}
    >
      <div className="is-flex is-align-items-center">
        <span className="icon mr-2">
          <i className="fas fa-desktop" />
        </span>
        <span>Display Settings</span>
      </div>
      <span className="icon">
        <i className="fas fa-chevron-right" />
      </span>

      {showDisplaySettings && (
        <div className={`dropdown-menu ${calculateSubmenuPosition(350)}`}>
          <div className="dropdown-content">
            <div className="dropdown-item">
              <div className="field">
                <label className="label is-small">Scaling Mode</label>
                <div className="control">
                  <div className="select is-small is-fullwidth">
                    <select
                      value={
                        resize === "scale"
                          ? "local"
                          : resize === "remote"
                            ? "remote"
                            : "none"
                      }
                      onChange={(e) => {
                        if (onResizeChange) {
                          const newValue =
                            e.target.value === "local"
                              ? "scale"
                              : e.target.value === "remote"
                                ? "remote"
                                : "none";
                          onResizeChange(newValue);
                        }
                      }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <option value="none">None (1:1)</option>
                      <option value="local">Local Scaling</option>
                      <option value="remote">Remote Resizing</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <div className="dropdown-item">
              <div className="field mb-4">
                <label className="label is-small">
                  Quality Level: {quality}
                </label>
                <div className="control mt-5 mb-5">
                  <input
                    className="zw-range-slider-primary"
                    type="range"
                    min="0"
                    max="9"
                    value={quality}
                    onChange={(e) => {
                      if (onQualityChange) {
                        onQualityChange(parseInt(e.target.value));
                      }
                    }}
                    onClick={(e) => e.stopPropagation()}
                    style={{
                      background: `linear-gradient(to right, #007bff 0%, #007bff ${(quality / 9) * 100}%, #ccc ${(quality / 9) * 100}%, #ccc 100%)`,
                    }}
                  />
                </div>
                <div className="help is-size-7 mt-2 mb-2">
                  0 = Lowest quality, 9 = Highest quality
                </div>
              </div>
            </div>

            <div className="dropdown-item">
              <div className="field mb-4">
                <label className="label is-small">
                  Compression Level: {compression}
                </label>
                <div className="control mt-5 mb-5">
                  <input
                    className="zw-range-slider-info"
                    type="range"
                    min="0"
                    max="9"
                    value={compression}
                    onChange={(e) => {
                      if (onCompressionChange) {
                        onCompressionChange(parseInt(e.target.value));
                      }
                    }}
                    onClick={(e) => e.stopPropagation()}
                    style={{
                      background: `linear-gradient(to right, #17a2b8 0%, #17a2b8 ${(compression / 9) * 100}%, #ccc ${(compression / 9) * 100}%, #ccc 100%)`,
                    }}
                  />
                </div>
                <div className="help is-size-7 mt-2 mb-2">
                  0 = No compression, 9 = Max compression
                </div>
              </div>
            </div>

            <div className="dropdown-item">
              <div className="field">
                <div className="control">
                  <label className="checkbox">
                    <input
                      type="checkbox"
                      checked={showDot}
                      onChange={(e) => {
                        if (onShowDotChange) {
                          onShowDotChange(e.target.checked);
                        }
                      }}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <span className="ml-2">Show cursor dot when no cursor</span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

VncDisplaySettingsSubmenu.propTypes = {
  quality: PropTypes.number,
  compression: PropTypes.number,
  resize: PropTypes.string,
  showDot: PropTypes.bool,
  onQualityChange: PropTypes.func,
  onCompressionChange: PropTypes.func,
  onResizeChange: PropTypes.func,
  onShowDotChange: PropTypes.func,
  calculateSubmenuPosition: PropTypes.func.isRequired,
};

export default VncDisplaySettingsSubmenu;
