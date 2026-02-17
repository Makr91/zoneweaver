import PropTypes from "prop-types";

const ConfigInfo = ({ configInfo }) => {
  if (!configInfo) {
    return null;
  }

  const getServiceType = (service) => {
    if (service === "ntp") {
      return "NTP";
    }
    if (service === "chrony") {
      return "Chrony";
    }
    return "Auto-detect";
  };

  return (
    <div className="box mb-4">
      <h3 className="title is-6">Configuration File Information</h3>
      <div className="table-container">
        <table className="table is-fullwidth">
          <tbody>
            <tr>
              <td>
                <strong>Service Type</strong>
              </td>
              <td className="is-family-monospace">
                {getServiceType(configInfo.service)}
              </td>
            </tr>
            <tr>
              <td>
                <strong>Configuration File</strong>
              </td>
              <td className="is-family-monospace">{configInfo.config_file}</td>
            </tr>
            <tr>
              <td>
                <strong>File Exists</strong>
              </td>
              <td>
                <span
                  className={`tag ${configInfo.config_exists ? "is-success" : "is-warning"}`}
                >
                  {configInfo.config_exists ? "Yes" : "No"}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

ConfigInfo.propTypes = {
  configInfo: PropTypes.shape({
    service: PropTypes.string,
    config_file: PropTypes.string,
    config_exists: PropTypes.bool,
  }),
};

export default ConfigInfo;