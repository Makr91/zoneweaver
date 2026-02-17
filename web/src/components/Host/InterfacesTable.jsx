import PropTypes from "prop-types";

import { formatSpeed } from "./NetworkingUtils";

const getClassTagColor = (ifaceClass) => {
  if (ifaceClass === "phys") {
    return "is-primary";
  }
  if (ifaceClass === "vnic") {
    return "is-info";
  }
  return "is-dark";
};

const InterfacesTable = ({
  networkInterfaces,
  interfaceSort,
  handleInterfaceSort,
  getSortIcon,
  resetInterfaceSort,
  sectionsCollapsed,
  toggleSection,
}) => (
  <div className="box mb-4">
    <div className="level is-mobile mb-3">
      <div className="level-left">
        <button
          className="button is-ghost title is-5 mb-0 p-0"
          onClick={resetInterfaceSort}
          title="Click to reset sorting to default"
        >
          <span className="icon-text">
            <span className="icon">
              <i className="fas fa-ethernet" />
            </span>
            <span>
              Network Interfaces ({networkInterfaces.length} interfaces)
            </span>
            {interfaceSort.length > 1 && (
              <span className="icon has-text-info ml-2">
                <i className="fas fa-sort-amount-down" />
              </span>
            )}
          </span>
        </button>
      </div>
      <div className="level-right">
        <button
          className="button is-small is-ghost"
          onClick={() => toggleSection("interfaces")}
          title={
            sectionsCollapsed.interfaces ? "Expand section" : "Collapse section"
          }
        >
          <span className="icon">
            <i
              className={`fas ${sectionsCollapsed.interfaces ? "fa-chevron-down" : "fa-chevron-up"}`}
            />
          </span>
        </button>
      </div>
    </div>
    {!sectionsCollapsed.interfaces &&
      (networkInterfaces.length > 0 ? (
        <div className="table-container">
          <table className="table is-fullwidth is-striped">
            <thead>
              <tr>
                <th
                  className="is-clickable"
                  onClick={() => handleInterfaceSort("link")}
                  title="Click to sort by interface name"
                >
                  Link{" "}
                  <i className={`fas ${getSortIcon(interfaceSort, "link")}`} />
                </th>
                <th
                  className="is-clickable"
                  onClick={() => handleInterfaceSort("class")}
                  title="Click to sort by interface class"
                >
                  Class{" "}
                  <i className={`fas ${getSortIcon(interfaceSort, "class")}`} />
                </th>
                <th
                  className="is-clickable"
                  onClick={() => handleInterfaceSort("state")}
                  title="Click to sort by interface state"
                >
                  State{" "}
                  <i className={`fas ${getSortIcon(interfaceSort, "state")}`} />
                </th>
                <th
                  className="is-clickable"
                  onClick={() => handleInterfaceSort("speed")}
                  title="Click to sort by interface speed"
                >
                  Speed{" "}
                  <i className={`fas ${getSortIcon(interfaceSort, "speed")}`} />
                </th>
                <th
                  className="is-clickable"
                  onClick={() => handleInterfaceSort("mtu")}
                  title="Click to sort by MTU"
                >
                  MTU{" "}
                  <i className={`fas ${getSortIcon(interfaceSort, "mtu")}`} />
                </th>
                <th
                  className="is-clickable"
                  onClick={() => handleInterfaceSort("macaddress")}
                  title="Click to sort by MAC address"
                >
                  MAC Address{" "}
                  <i
                    className={`fas ${getSortIcon(interfaceSort, "macaddress")}`}
                  />
                </th>
                <th
                  className="is-clickable"
                  onClick={() => handleInterfaceSort("vid")}
                  title="Click to sort by VLAN ID"
                >
                  VLAN{" "}
                  <i className={`fas ${getSortIcon(interfaceSort, "vid")}`} />
                </th>
                <th
                  className="is-clickable"
                  onClick={() => handleInterfaceSort("zone")}
                  title="Click to sort by zone"
                >
                  Zone{" "}
                  <i className={`fas ${getSortIcon(interfaceSort, "zone")}`} />
                </th>
              </tr>
            </thead>
            <tbody>
              {networkInterfaces.map((iface) => (
                <tr key={iface.link}>
                  <td>
                    <strong>{iface.link}</strong>
                  </td>
                  <td>
                    <span className={`tag ${getClassTagColor(iface.class)}`}>
                      {iface.class}
                    </span>
                  </td>
                  <td>
                    <span
                      className={`tag ${iface.state === "up" ? "is-success" : "is-danger"}`}
                    >
                      {iface.state}
                    </span>
                  </td>
                  <td>{formatSpeed(iface.speed)}</td>
                  <td>{iface.mtu || "N/A"}</td>
                  <td>
                    <code>{iface.macaddress || "N/A"}</code>
                  </td>
                  <td>{iface.vid || "N/A"}</td>
                  <td>
                    {iface.zone && iface.zone !== "--" ? (
                      <button
                        className="button is-small is-warning py-1 px-2 is-size-7"
                        onClick={() =>
                          (window.location.href = `/ui/zones?zone=${encodeURIComponent(iface.zone)}`)
                        }
                        title={`Go to zone: ${iface.zone}`}
                      >
                        <span className="icon-text">
                          <span className="icon is-small">
                            <i className="fas fa-external-link-alt" />
                          </span>
                          <span>{iface.zone}</span>
                        </span>
                      </button>
                    ) : (
                      <span className="has-text-grey">Global</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="notification is-info">
          <p>
            No network interface data available or monitoring endpoint not
            configured.
          </p>
        </div>
      ))}
  </div>
);

InterfacesTable.propTypes = {
  networkInterfaces: PropTypes.arrayOf(
    PropTypes.shape({
      link: PropTypes.string.isRequired,
      class: PropTypes.string,
      state: PropTypes.string,
      speed: PropTypes.number,
      mtu: PropTypes.number,
      macaddress: PropTypes.string,
      vid: PropTypes.number,
      zone: PropTypes.string,
    })
  ).isRequired,
  interfaceSort: PropTypes.arrayOf(PropTypes.string).isRequired,
  handleInterfaceSort: PropTypes.func.isRequired,
  getSortIcon: PropTypes.func.isRequired,
  resetInterfaceSort: PropTypes.func.isRequired,
  sectionsCollapsed: PropTypes.shape({
    interfaces: PropTypes.bool.isRequired,
  }).isRequired,
  toggleSection: PropTypes.func.isRequired,
};

export default InterfacesTable;
