import PropTypes from "prop-types";

const TimeSyncServiceManagement = ({
  availableSystems,
  loading,
  syncing,
  onSwitch,
}) => {
  const getSystemInfo = (systemKey) => {
    const systemData = {
      ntp: {
        name: "Traditional NTP",
        icon: "fa-clock",
        description:
          "Network Time Protocol - Traditional UNIX time synchronization service.",
        features: [
          "Mature and widely supported",
          "Standard on most UNIX systems",
          "Uses /etc/inet/ntp.conf",
        ],
      },
      chrony: {
        name: "Chrony",
        icon: "fa-stopwatch",
        description:
          "Modern time synchronization daemon with enhanced features.",
        features: [
          "Better for intermittent connections",
          "Faster synchronization",
          "Uses /etc/inet/chrony.conf",
        ],
      },
      ntpsec: {
        name: "NTPsec",
        icon: "fa-shield-alt",
        description:
          "Security-focused NTP implementation with enhanced security features.",
        features: [
          "Enhanced security and code quality",
          "Backward compatible with NTP",
          "Active security maintenance",
        ],
      },
    };
    return systemData[systemKey] || systemData.ntp;
  };

  const getSystemStatus = (systemKey) => {
    if (!availableSystems?.available) {
      return null;
    }
    return availableSystems.available[systemKey];
  };

  const getSwitchButtonLabel = (isCurrent, systemData, systemInfo) => {
    if (isCurrent) {
      return "Current Service";
    }
    if (!systemData?.can_switch_to) {
      return "Cannot Switch";
    }
    if (!systemData?.installed) {
      return "Install & Switch";
    }
    return `Switch to ${systemInfo.name}`;
  };

  return (
    <div className="box">
      <h3 className="title is-6">Time Synchronization Service Management</h3>

      {/* Available Systems */}
      {availableSystems?.available && (
        <div className="columns is-multiline">
          {Object.keys(availableSystems.available).map((systemKey) => {
            const systemData = getSystemStatus(systemKey);
            const systemInfo = getSystemInfo(systemKey);
            const isCurrent = availableSystems.current?.service === systemKey;

            return (
              <div key={systemKey} className="column is-one-third">
                <div
                  className={`card ${isCurrent ? "has-background-info-soft" : ""}`}
                >
                  <div className="card-header">
                    <p className="card-header-title">
                      <span className="icon mr-2">
                        <i className={`fas ${systemInfo.icon}`} />
                      </span>
                      {systemInfo.name}
                      {isCurrent && (
                        <span className="tag is-success is-small ml-2">
                          Current
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="card-content">
                    <div className="content">
                      <p>{systemInfo.description}</p>
                      <ul className="is-size-7">
                        {systemInfo.features.map((feature) => (
                          <li key={feature}>{feature}</li>
                        ))}
                      </ul>

                      {systemData && (
                        <div className="mt-3">
                          <div className="tags">
                            <span
                              className={`tag is-small ${systemData.installed ? "is-success" : "is-warning"}`}
                            >
                              {systemData.installed
                                ? "Installed"
                                : "Not Installed"}
                            </span>
                            {systemData.installed && (
                              <span
                                className={`tag is-small ${systemData.enabled ? "is-info" : "is-grey"}`}
                              >
                                {systemData.enabled ? "Enabled" : "Disabled"}
                              </span>
                            )}
                          </div>
                          {systemData.package_name && (
                            <p className="is-size-7 has-text-grey">
                              Package: {systemData.package_name}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="card-footer">
                    <div className="card-footer-item">
                      <button
                        className={`button is-small ${isCurrent ? "is-success" : "is-info"} ${syncing ? "is-loading" : ""}`}
                        onClick={() => onSwitch(systemKey)}
                        disabled={
                          isCurrent ||
                          !systemData?.can_switch_to ||
                          loading ||
                          syncing
                        }
                      >
                        <span className="icon">
                          <i
                            className={`fas ${isCurrent ? "fa-check" : "fa-exchange-alt"}`}
                          />
                        </span>
                        <span>
                          {getSwitchButtonLabel(
                            isCurrent,
                            systemData,
                            systemInfo
                          )}
                        </span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* No systems available fallback */}
      {!availableSystems?.available && !loading && (
        <div className="notification is-warning">
          <p>
            <strong>No Time Synchronization Systems Available</strong>
            <br />
            Unable to detect available time synchronization systems. The system
            may need package installation or configuration.
          </p>
        </div>
      )}
    </div>
  );
};

TimeSyncServiceManagement.propTypes = {
  availableSystems: PropTypes.shape({
    available: PropTypes.object,
    current: PropTypes.shape({
      service: PropTypes.string,
    }),
  }),
  loading: PropTypes.bool,
  syncing: PropTypes.bool,
  onSwitch: PropTypes.func.isRequired,
};

export default TimeSyncServiceManagement;
