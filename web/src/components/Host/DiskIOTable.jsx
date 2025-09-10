import React from "react";

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
        <h4
                      className='title is-5 mb-0 is-clickable'
                      onClick={resetDiskIOSort}
          title="Click to reset sorting to default"
        >
          <span className="icon-text">
            <span className="icon">
              <i className="fas fa-chart-bar"></i>
            </span>
            <span>Real-Time Disk I/O Statistics ({diskIOStats.length})</span>
            {diskIOSort.length > 1 && (
              <span className="icon has-text-info ml-2">
                <i className="fas fa-sort-amount-down"></i>
              </span>
            )}
          </span>
        </h4>
      </div>
      <div className="level-right">
        <button
                      className='button is-small is-ghost'
                      onClick={() => toggleSection('diskIO')}
                      title={sectionsCollapsed.diskIO ? 'Expand section' : 'Collapse section'}
        >
          <span className="icon">
            <i
              className={`fas ${sectionsCollapsed.diskIO ? "fa-chevron-down" : "fa-chevron-up"}`}
            ></i>
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
                {diskIOStats.map((io, index) => {
                  const readMBps =
                    (io.read_bandwidth_bytes || 0) / (1024 * 1024);
                  const writeMBps =
                    (io.write_bandwidth_bytes || 0) / (1024 * 1024);
                  const totalMBps = readMBps + writeMBps;

                  return (
                    <tr key={index}>
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
                          {readMBps >= 1
                            ? `${readMBps.toFixed(2)} MB/s`
                            : readMBps > 0
                              ? `${(readMBps * 1024).toFixed(0)} KB/s`
                              : "0 B/s"}
                        </span>
                      </td>
                      <td>
                        <span className="tag is-warning">
                          {writeMBps >= 1
                            ? `${writeMBps.toFixed(2)} MB/s`
                            : writeMBps > 0
                              ? `${(writeMBps * 1024).toFixed(0)} KB/s`
                              : "0 B/s"}
                        </span>
                      </td>
                      <td>
                        <span
                          className={`tag ${
                            totalMBps > 50
                              ? "is-danger"
                              : totalMBps > 10
                                ? "is-warning"
                                : totalMBps > 0
                                  ? "is-success"
                                  : "is-grey"
                          }`}
                        >
                          {totalMBps >= 1
                            ? `${totalMBps.toFixed(2)} MB/s`
                            : totalMBps > 0
                              ? `${(totalMBps * 1024).toFixed(0)} KB/s`
                              : "0 B/s"}
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

export default DiskIOTable;
