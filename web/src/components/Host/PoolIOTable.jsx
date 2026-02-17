import PropTypes from "prop-types";

const PoolIOTable = ({ poolIOStats, sectionsCollapsed, toggleSection }) => {
  if (poolIOStats.length === 0) {
    return null;
  }

  const getPoolTypeClass = (type) => {
    switch (type) {
      case "raidz2":
        return "is-success";
      case "raidz1":
        return "is-info";
      case "mirror":
        return "is-warning";
      default:
        return "is-dark";
    }
  };

  return (
    <div className="box mb-4">
      <div className="level is-mobile mb-3">
        <div className="level-left">
          <h4 className="title is-5 mb-0">
            <span className="icon-text">
              <span className="icon">
                <i className="fas fa-database" />
              </span>
              <span>ZFS Pool I/O Performance ({poolIOStats.length})</span>
            </span>
          </h4>
        </div>
        <div className="level-right">
          <button
            className="button is-small is-ghost"
            onClick={() => toggleSection("poolIO")}
            title={
              sectionsCollapsed.poolIO ? "Expand section" : "Collapse section"
            }
          >
            <span className="icon">
              <i
                className={`fas ${sectionsCollapsed.poolIO ? "fa-chevron-down" : "fa-chevron-up"}`}
              />
            </span>
          </button>
        </div>
      </div>
      {!sectionsCollapsed.poolIO && (
        <div className="table-container">
          <table className="table is-fullwidth is-striped">
            <thead>
              <tr>
                <th>Pool</th>
                <th>Type</th>
                <th>Allocation</th>
                <th>Free Space</th>
                <th>Read Ops</th>
                <th>Write Ops</th>
                <th>Read Bandwidth</th>
                <th>Write Bandwidth</th>
                <th>Total Wait</th>
                <th>Disk Wait</th>
                <th>Last Updated</th>
              </tr>
            </thead>
            <tbody>
              {poolIOStats.map((poolIO) => {
                const readBandwidthMB =
                  (poolIO.read_bandwidth_bytes || 0) / (1024 * 1024);
                const writeBandwidthMB =
                  (poolIO.write_bandwidth_bytes || 0) / (1024 * 1024);

                return (
                  <tr key={poolIO.pool}>
                    <td>
                      <strong>{poolIO.pool}</strong>
                    </td>
                    <td>
                      <span
                        className={`tag ${getPoolTypeClass(poolIO.pool_type)}`}
                      >
                        {poolIO.pool_type}
                      </span>
                    </td>
                    <td>{poolIO.alloc}</td>
                    <td>{poolIO.free}</td>
                    <td>
                      <span className="tag is-info">{poolIO.read_ops}</span>
                    </td>
                    <td>
                      <span className="tag is-warning">{poolIO.write_ops}</span>
                    </td>
                    <td>
                      <span className="tag is-info">
                        {readBandwidthMB >= 1
                          ? `${readBandwidthMB.toFixed(2)} MB/s`
                          : `${(readBandwidthMB * 1024).toFixed(0)} KB/s`}
                      </span>
                    </td>
                    <td>
                      <span className="tag is-warning">
                        {writeBandwidthMB >= 1
                          ? `${writeBandwidthMB.toFixed(2)} MB/s`
                          : `${(writeBandwidthMB * 1024).toFixed(0)} KB/s`}
                      </span>
                    </td>
                    <td>
                      <span className="has-text-grey is-size-7">
                        R: {poolIO.total_wait_read}, W:{" "}
                        {poolIO.total_wait_write}
                      </span>
                    </td>
                    <td>
                      <span className="has-text-grey is-size-7">
                        R: {poolIO.disk_wait_read}, W: {poolIO.disk_wait_write}
                      </span>
                    </td>
                    <td>
                      <span className="has-text-grey is-size-7">
                        {new Date(poolIO.scan_timestamp).toLocaleTimeString()}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

PoolIOTable.propTypes = {
  poolIOStats: PropTypes.array.isRequired,
  sectionsCollapsed: PropTypes.object.isRequired,
  toggleSection: PropTypes.func.isRequired,
};

export default PoolIOTable;
