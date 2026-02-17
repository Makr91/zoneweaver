import PropTypes from "prop-types";

import { formatBytes, getHealthColor, parseSize } from "./StorageUtils";

const PoolsTable = ({
  storagePools,
  poolSort,
  handlePoolSort,
  getSortIcon,
  resetPoolSort,
  sectionsCollapsed,
  toggleSection,
}) => {
  const getUsageColor = (percent) => {
    if (percent > 80) {
      return "is-danger";
    }
    if (percent > 60) {
      return "is-warning";
    }
    return "is-success";
  };

  return (
    <div className="box mb-4">
      <div className="level is-mobile mb-3">
        <div className="level-left">
          <button
            className="button is-text title is-5 mb-0 p-0"
            onClick={resetPoolSort}
            title="Click to reset sorting to default"
          >
            <span className="icon-text">
              <span className="icon">
                <i className="fas fa-database" />
              </span>
              <span>ZFS Storage Pools ({storagePools.length})</span>
              {poolSort.length > 1 && (
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
            onClick={() => toggleSection("pools")}
            title={
              sectionsCollapsed.pools ? "Expand section" : "Collapse section"
            }
          >
            <span className="icon">
              <i
                className={`fas ${sectionsCollapsed.pools ? "fa-chevron-down" : "fa-chevron-up"}`}
              />
            </span>
          </button>
        </div>
      </div>
      {!sectionsCollapsed.pools && (
        <>
          {storagePools.length > 0 ? (
            <div className="table-container">
              <table className="table is-fullwidth is-striped">
                <thead>
                  <tr>
                    <th
                      className="is-clickable"
                      onClick={(e) => handlePoolSort("pool", e)}
                      title="Click to sort by pool name. Hold Ctrl/Cmd to add to existing sort."
                    >
                      Pool Name{" "}
                      <i className={`fas ${getSortIcon(poolSort, "pool")}`} />
                    </th>
                    <th
                      className="is-clickable"
                      onClick={(e) => handlePoolSort("health", e)}
                      title="Click to sort by health status. Hold Ctrl/Cmd to add to existing sort."
                    >
                      Health{" "}
                      <i className={`fas ${getSortIcon(poolSort, "health")}`} />
                    </th>
                    <th>Size</th>
                    <th>Used</th>
                    <th>Available</th>
                    <th>Usage %</th>
                    <th>Dedup Ratio</th>
                    <th>Fragmentation</th>
                  </tr>
                </thead>
                <tbody>
                  {storagePools.map((pool) => {
                    const allocBytes =
                      parseSize(pool.alloc) || pool.alloc_bytes || 0;
                    const freeBytes =
                      parseSize(pool.free) || pool.free_bytes || 0;
                    const totalBytes = allocBytes + freeBytes;
                    const usagePercent =
                      totalBytes > 0
                        ? ((allocBytes / totalBytes) * 100).toFixed(1)
                        : 0;

                    return (
                      <tr key={pool.pool || pool.name}>
                        <td>
                          <strong>{pool.pool || pool.name}</strong>
                        </td>
                        <td>
                          <span
                            className={`tag ${getHealthColor(pool.health || pool.status)}`}
                          >
                            {pool.health || pool.status || "Unknown"}
                          </span>
                        </td>
                        <td>{formatBytes(totalBytes)}</td>
                        <td>{formatBytes(allocBytes)}</td>
                        <td>{formatBytes(freeBytes)}</td>
                        <td>
                          <span
                            className={`tag ${getUsageColor(usagePercent)}`}
                          >
                            {usagePercent}%
                          </span>
                        </td>
                        <td>{pool.dedup || pool.dedupRatio || "1.00x"}</td>
                        <td>{pool.fragmentation || pool.frag || "N/A"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="notification is-info">
              <p>
                No ZFS pool data available or monitoring endpoint not
                configured.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

PoolsTable.propTypes = {
  storagePools: PropTypes.array.isRequired,
  poolSort: PropTypes.array.isRequired,
  handlePoolSort: PropTypes.func.isRequired,
  getSortIcon: PropTypes.func.isRequired,
  resetPoolSort: PropTypes.func.isRequired,
  sectionsCollapsed: PropTypes.shape({
    pools: PropTypes.bool,
  }).isRequired,
  toggleSection: PropTypes.func.isRequired,
};

export default PoolsTable;
