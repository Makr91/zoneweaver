import PropTypes from "prop-types";

const formatBandwidth = (mbps) => {
  if (mbps >= 1) return `${mbps.toFixed(2)} MB/s`;
  if (mbps > 0) return `${(mbps * 1024).toFixed(0)} KB/s`;
  return "0 B/s";
};

const getTotalIOClass = (totalMBps) => {
  if (totalMBps > 50) return "is-danger";
  if (totalMBps > 10) return "is-warning";
  if (totalMBps > 0) return "is-success";
  return "is-grey";
};

const DiskIOTable = ({
  diskIOStats,
  diskIOSort,
  handleDiskIOSort,
  getSortIcon,
  resetDiskIOSort,
  sectionsCollapsed,
  toggleSection,
}) => (
  <div className="box mb-4">
    <div className="level is-mobile mb-3">
      <div className="level-left">
        <button
          className="title is-5 mb-0 is-clickable button is-ghost p-0"
          onClick={resetDiskIOSort}
          title="Click to reset sorting to default"
          type="button"
        >
          <span className="icon-text">
            <span className="icon">
              <i className="fas fa-chart-bar" />
            </span>
            <span>Real-Time Disk I/O Statistics ({diskIOStats.length})</span>
            {diskIOSort.length > 1 && (
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
          onClick={() => toggleSection("diskIO")}
          title={
            sectionsCollapsed.diskIO ? "Expand section" : "Collapse section"
          }
        >
          <span className="icon">
            <i
              className={`fas ${sectionsCollapsed.diskIO ? "fa-chevron-down" : "fa-chevron-up"}`}
            />
          </span>
        </button>
      </div>
    </div>
    {!sectionsCollapsed.diskIO && (
      <>
        {diskIOStats.length > 0 ? (
          <div className="table-container">
            <table className="table is-fullwidth is-striped">
              <thead>
                <tr>
                  <th>Device</th>
                  <th>Pool</th>
                  <th>Read Ops</th>
                  <th>Write Ops</th>
                  <th>Read Bandwidth</th>
                  <th>Write Bandwidth</th>
                  <th>Total I/O</th>
                  <th>Last Updated</th>
                </tr>
              </thead>
              <tbody>
                {diskIOStats.map((io) => {
                  const readMBps =
                    (io.read_bandwidth_bytes || 0) / (1024 * 1024);
                  const writeMBps =
                    (io.write_bandwidth_bytes || 0) / (1024 * 1024);
                  const totalMBps = readMBps + writeMBps;

                  return (
                    <tr key={`diskio-${io.device_name}-${io.scan_timestamp}`}>
                      <td>
                        <strong>{io.device_name}</strong>
                      </td>
                      <td>
                        <span className="tag is-primary">{io.pool}</span>
                      </td>
                      <td>{io.read_ops}</td>
                      <td>{io.write_ops}</td>
                      <td>
                        <span className="tag is-info">
                          {formatBandwidth(readMBps)}
                        </span>
                      </td>
                      <td>
                        <span className="tag is-warning">
                          {formatBandwidth(writeMBps)}
                        </span>
                      </td>
                      <td>
                        <span
                          className={`tag ${getTotalIOClass(totalMBps)}`}
                        >
                          {formatBandwidth(totalMBps)}
                        </span>
                      </td>
                      <td>
                        <span className="has-text-grey is-size-7">
                          {new Date(io.scan_timestamp).toLocaleTimeString()}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="notification is-info">
            <p>
              No disk I/O statistics available. The backend may still be
              collecting data.
            </p>
          </div>
        )}
      </>
    )}
  </div>
);

DiskIOTable.propTypes = {
  diskIOStats: PropTypes.array.isRequired,
  diskIOSort: PropTypes.array.isRequired,
  handleDiskIOSort: PropTypes.func.isRequired,
  getSortIcon: PropTypes.func.isRequired,
  resetDiskIOSort: PropTypes.func.isRequired,
  sectionsCollapsed: PropTypes.object.isRequired,
  toggleSection: PropTypes.func.isRequired,
};

export default DiskIOTable;
