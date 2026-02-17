import PropTypes from "prop-types";

const ZoneNetwork = ({ configuration }) => {
  if (!configuration || !configuration.net || configuration.net.length === 0) {
    return null;
  }

  return (
    <div className="box mb-0 pt-0 pd-0">
      <h4 className="title is-6 mb-3">
        <span className="icon-text">
          <span className="icon">
            <i className="fas fa-network-wired" />
          </span>
          <span>Network Configuration</span>
        </span>
      </h4>

      {/* Network Interface and IP Type */}
      <div className="mb-3">
        <div className="table-container">
          <table className="table is-fullwidth is-striped is-size-7">
            <tbody>
              <tr>
                <td className="px-3 py-2">
                  <strong>Network Interface Driver</strong>
                </td>
                <td className="px-3 py-2">
                  <span className="has-text-grey is-family-monospace">
                    {configuration.netif || "N/A"}
                  </span>
                </td>
              </tr>
              <tr>
                <td className="px-3 py-2">
                  <strong>IP Type</strong>
                </td>
                <td className="px-3 py-2">
                  <span className="has-text-grey is-family-monospace">
                    {configuration["ip-type"] || "N/A"}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Virtual NICs (dladm show-vnic format) */}
      <div className="mb-3">
        <h5 className="subtitle is-6 mb-2">Virtual NICs</h5>
        <div className="table-container">
          <table className="table is-fullwidth is-striped is-size-7">
            <thead>
              <tr>
                <th className="px-3 py-2">LINK</th>
                <th className="px-3 py-2">OVER</th>
                <th className="px-3 py-2">MACADDRESS</th>
                <th className="px-3 py-2">VID</th>
                <th className="px-3 py-2">MACADDRTYPE</th>
              </tr>
            </thead>
            <tbody>
              {(configuration.net || [])
                .filter(
                  (netInterface) =>
                    netInterface !== null && netInterface !== undefined
                )
                .map((netInterface, index) => (
                  <tr key={netInterface?.["mac-addr"] || index}>
                    <td className="px-3 py-2">
                      <span className="has-text-grey is-family-monospace">
                        {netInterface?.["global-nic"] || "N/A"}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <span className="has-text-grey is-family-monospace">
                        {netInterface?.physical || "N/A"}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <span className="has-text-grey is-family-monospace">
                        {netInterface?.["mac-addr"] || "N/A"}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <span className="has-text-grey is-family-monospace">
                        {netInterface?.["vlan-id"] || "0"}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <span className="has-text-grey is-family-monospace">
                        {netInterface?.["mac-addr-type"] || "fixed"}
                      </span>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

ZoneNetwork.propTypes = {
  configuration: PropTypes.shape({
    netif: PropTypes.string,
    "ip-type": PropTypes.string,
    net: PropTypes.arrayOf(
      PropTypes.shape({
        "global-nic": PropTypes.string,
        physical: PropTypes.string,
        "mac-addr": PropTypes.string,
        "vlan-id": PropTypes.string,
        "mac-addr-type": PropTypes.string,
      })
    ),
  }),
};

export default ZoneNetwork;
