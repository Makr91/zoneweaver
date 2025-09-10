import React from "react";

const ZoneHardware = ({ zoneDetails }) => {
  if (
    !zoneDetails?.configuration ||
    Object.keys(zoneDetails.configuration).length === 0
  ) {
    return null;
  }

  const { configuration } = zoneDetails;

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
                <span
                  className={`has-text-weight-semibold ${configuration.acpi === "true" ? "has-text-success" : "has-text-danger"}`}
                >
                  {configuration.acpi === "true" ? "Enabled" : "Disabled"}
                </span>
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
                <span
                  className={`has-text-weight-semibold ${configuration.autoboot === "true" ? "has-text-success" : "has-text-danger"}`}
                >
                  {configuration.autoboot === "true" ? "Enabled" : "Disabled"}
                </span>
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
                <span
                  className={`has-text-weight-semibold ${configuration.uefivars === "on" ? "has-text-success" : "has-text-danger"}`}
                >
                  {configuration.uefivars === "on" ? "On" : "Off"}
                </span>
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
                <span
                  className={`has-text-weight-semibold ${configuration.xhci === "on" ? "has-text-success" : "has-text-danger"}`}
                >
                  {configuration.xhci === "on" ? "On" : "Off"}
                </span>
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
                <span
                  className={`has-text-weight-semibold ${configuration.rng === "on" ? "has-text-success" : "has-text-danger"}`}
                >
                  {configuration.rng === "on" ? "On" : "Off"}
                </span>
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
                <span
                  className={`has-text-weight-semibold ${configuration["cloud-init"] === "on" ? "has-text-success" : "has-text-danger"}`}
                >
                  {configuration["cloud-init"] === "on" ? "On" : "Off"}
                </span>
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
                {zoneDetails.vnc_session_info?.web_port ? (
                  <span className="has-text-grey is-family-monospace">
                    {zoneDetails.vnc_session_info.web_port}
                  </span>
                ) : configuration?.vnc?.port ||
                  zoneDetails.zone_info?.vnc_port ? (
                  <span className="has-text-grey is-family-monospace">
                    {configuration.vnc?.port || zoneDetails.zone_info?.vnc_port}
                  </span>
                ) : (
                  <span className="has-text-weight-semibold has-text-success">
                    Auto
                  </span>
                )}
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

export default ZoneHardware;
