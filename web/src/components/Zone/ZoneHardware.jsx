import PropTypes from "prop-types";

const ZoneHardware = ({ zoneDetails }) => {
  if (
    !zoneDetails?.configuration ||
    Object.keys(zoneDetails.configuration).length === 0
  ) {
    return null;
  }

  const { configuration } = zoneDetails;

  const renderStatusBadge = (
    value,
    trueCondition,
    onLabel = "Enabled",
    offLabel = "Disabled"
  ) => (
    <span
      className={`has-text-weight-semibold ${value === trueCondition ? "has-text-success" : "has-text-danger"}`}
    >
      {value === trueCondition ? onLabel : offLabel}
    </span>
  );

  const renderVncPort = () => {
    if (zoneDetails.vnc_session_info?.web_port) {
      return (
        <span className="has-text-grey is-family-monospace">
          {zoneDetails.vnc_session_info.web_port}
        </span>
      );
    }

    const configPort = configuration?.vnc?.port;
    const infoPort = zoneDetails.zone_info?.vnc_port;

    if (configPort || infoPort) {
      return (
        <span className="has-text-grey is-family-monospace">
          {configPort || infoPort}
        </span>
      );
    }

    return <span className="has-text-weight-semibold has-text-success">Auto</span>;
  };

  return (
    <div className="box mb-0 pt-0 pd-0">
      <h4 className="title is-6 mb-3">
        <span className="icon-text">
          <span className="icon">
            <i className="fas fa-microchip" />
          </span>
          <span>Hardware & System</span>
        </span>
      </h4>
      <div className="table-container">
        <table className="table is-fullwidth is-striped is-size-7">
          <tbody>
            <tr>
              <td className="px-3 py-2">
                <strong>RAM</strong>
              </td>
              <td className="px-3 py-2">{configuration.ram}</td>
              <td className="px-3 py-2">
                <strong>ACPI</strong>
              </td>
              <td className="px-3 py-2">
                {renderStatusBadge(configuration.acpi, "true")}
              </td>
            </tr>
            <tr>
              <td className="px-3 py-2">
                <strong>vCPUs</strong>
              </td>
              <td className="px-3 py-2">{configuration.vcpus}</td>
              <td className="px-3 py-2">
                <strong>Auto Boot</strong>
              </td>
              <td className="px-3 py-2">
                {renderStatusBadge(configuration.autoboot, "true")}
              </td>
            </tr>
            <tr>
              <td className="px-3 py-2">
                <strong>Boot ROM</strong>
              </td>
              <td className="px-3 py-2">
                <span className="has-text-grey is-family-monospace">
                  {configuration.bootrom}
                </span>
              </td>
              <td className="px-3 py-2">
                <strong>UEFI Vars</strong>
              </td>
              <td className="px-3 py-2">
                {renderStatusBadge(configuration.uefivars, "on", "On", "Off")}
              </td>
            </tr>
            <tr>
              <td className="px-3 py-2">
                <strong>Host Bridge</strong>
              </td>
              <td className="px-3 py-2">
                <span className="has-text-grey is-family-monospace">
                  {configuration.hostbridge}
                </span>
              </td>
              <td className="px-3 py-2">
                <strong>xHCI</strong>
              </td>
              <td className="px-3 py-2">
                {renderStatusBadge(configuration.xhci, "on", "On", "Off")}
              </td>
            </tr>
            <tr>
              <td className="px-3 py-2">
                <strong>Brand</strong>
              </td>
              <td className="px-3 py-2">
                <span className="has-text-grey is-family-monospace">
                  {configuration.brand}
                </span>
              </td>
              <td className="px-3 py-2">
                <strong>RNG</strong>
              </td>
              <td className="px-3 py-2">
                {renderStatusBadge(configuration.rng, "on", "On", "Off")}
              </td>
            </tr>
            <tr>
              <td className="px-3 py-2">
                <strong>Type</strong>
              </td>
              <td className="px-3 py-2">
                <span className="has-text-grey is-family-monospace">
                  {configuration.type || "N/A"}
                </span>
              </td>
              <td className="px-3 py-2">
                <strong>Cloud Init</strong>
              </td>
              <td className="px-3 py-2">
                {renderStatusBadge(
                  configuration["cloud-init"],
                  "on",
                  "On",
                  "Off"
                )}
              </td>
            </tr>
            <tr>
              <td className="px-3 py-2">
                <strong>VNC Console</strong>
              </td>
              <td className="px-3 py-2">
                <span
                  className={`has-text-weight-semibold ${zoneDetails.vnc_session_info ? "has-text-success" : "has-text-danger"}`}
                >
                  {zoneDetails.vnc_session_info ? "Active" : "Inactive"}
                </span>
              </td>
              <td className="px-3 py-2">
                <strong>VNC Port</strong>
              </td>
              <td className="px-3 py-2">
                {renderVncPort()}
              </td>
            </tr>
            <tr>
              <td className="px-3 py-2">
                <strong>zlogin</strong>
              </td>
              <td className="px-3 py-2">
                <span
                  className={`has-text-weight-semibold ${zoneDetails.zlogin_session ? "has-text-success" : "has-text-danger"}`}
                >
                  {zoneDetails.zlogin_session ? "Active" : "Inactive"}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

ZoneHardware.propTypes = {
  zoneDetails: PropTypes.shape({
    configuration: PropTypes.shape({
      ram: PropTypes.string,
      acpi: PropTypes.string,
      vcpus: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      autoboot: PropTypes.string,
      bootrom: PropTypes.string,
      uefivars: PropTypes.string,
      hostbridge: PropTypes.string,
      xhci: PropTypes.string,
      brand: PropTypes.string,
      rng: PropTypes.string,
      type: PropTypes.string,
      "cloud-init": PropTypes.string,
      vnc: PropTypes.shape({
        port: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      }),
    }),
    vnc_session_info: PropTypes.shape({
      web_port: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    }),
    zone_info: PropTypes.shape({
      vnc_port: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    }),
    zlogin_session: PropTypes.object,
  }),
};

export default ZoneHardware;
