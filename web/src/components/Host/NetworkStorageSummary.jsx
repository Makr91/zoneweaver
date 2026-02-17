import PropTypes from "prop-types";

const NetworkStorageSummary = ({ serverStats, storageSummary }) => (
  <div className="columns is-multiline mb-5">
    {/* Network Summary Card */}
    <div className="column is-6">
      <div className="box">
        <h3 className="title is-5 mb-4">
          <span className="icon-text">
            <span className="icon">
              <i className="fas fa-network-wired" />
            </span>
            <span>Network Interfaces</span>
          </span>
        </h3>
        {Object.keys(serverStats.networkInterfaces || {}).length > 0 ? (
          <>
            <table className="table is-fullwidth">
              <thead>
                <tr>
                  <th>Interface</th>
                  <th>Address</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(serverStats.networkInterfaces || {})
                  .slice(0, 5)
                  .map(([interfaceName, addresses]) => (
                    <tr key={interfaceName}>
                      <td>
                        <strong>{interfaceName}</strong>
                      </td>
                      <td>
                        {Array.isArray(addresses) && addresses.length > 0
                          ? addresses[0].address
                          : "No IP"}
                      </td>
                      <td>
                        <span className="tag is-success is-small">UP</span>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
            {Object.keys(serverStats.networkInterfaces || {}).length > 5 && (
              <p className="has-text-grey is-size-7 mt-2">
                Showing 5 of{" "}
                {Object.keys(serverStats.networkInterfaces || {}).length}{" "}
                interfaces.
                <a href="/ui/host-networking" className="has-text-link ml-1">
                  View all →
                </a>
              </p>
            )}
          </>
        ) : (
          <p className="has-text-grey">No network interfaces found</p>
        )}
      </div>
    </div>

    {/* Storage Summary Card */}
    <div className="column is-6">
      <div className="box">
        <h3 className="title is-5 mb-4">
          <span className="icon-text">
            <span className="icon">
              <i className="fas fa-hard-drive" />
            </span>
            <span>Storage Summary</span>
          </span>
        </h3>
        {Object.keys(storageSummary).length > 0 ? (
          <div className="content">
            <table className="table is-fullwidth">
              <tbody>
                <tr>
                  <td>
                    <strong>ZFS Pools</strong>
                  </td>
                  <td>{storageSummary.pools?.length || 0}</td>
                </tr>
                <tr>
                  <td>
                    <strong>Datasets</strong>
                  </td>
                  <td>{storageSummary.datasets?.length || 0}</td>
                </tr>
              </tbody>
            </table>
          </div>
        ) : (
          <div className="content">
            <p className="has-text-grey mb-4">
              Storage monitoring data not available
            </p>
          </div>
        )}
      </div>
    </div>
  </div>
);

NetworkStorageSummary.propTypes = {
  serverStats: PropTypes.shape({
    networkInterfaces: PropTypes.objectOf(
      PropTypes.arrayOf(
        PropTypes.shape({
          address: PropTypes.string,
        })
      )
    ),
  }).isRequired,
  storageSummary: PropTypes.shape({
    pools: PropTypes.arrayOf(PropTypes.any),
    datasets: PropTypes.arrayOf(PropTypes.any),
  }).isRequired,
};

export default NetworkStorageSummary;
