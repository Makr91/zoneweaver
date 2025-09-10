import React from "react";

import { formatBytes } from "./StorageUtils";

const ArcStats = ({ arcStats, sectionsCollapsed, toggleSection }) => {
  if (arcStats.length === 0) {
    return null;
  }

  return (
    <div className="box mb-4">
      <div className="level is-mobile mb-3">
        <div className="level-left">
          <h4 className="title is-5 mb-0">
            <span className="icon-text">
              <span className="icon">
                <i className="fas fa-memory"></i>
              </span>
              <span>ZFS ARC Statistics</span>
            </span>
          </h4>
        </div>
        <div className="level-right">
          <button
                      className='button is-small is-ghost'
                      onClick={() => toggleSection('arcStats')}
                      title={sectionsCollapsed.arcStats ? 'Expand section' : 'Collapse section'}
            }
          >
            <span className="icon">
              <i
                className={`fas ${sectionsCollapsed.arcStats ? "fa-chevron-down" : "fa-chevron-up"}`}
              ></i>
            </span>
          </button>
        </div>
      </div>
      {!sectionsCollapsed.arcStats && (
        <>
          {arcStats.length > 0 ? (
            <div>
              {/* Main ARC Overview Table */}
              <div className="table-container mb-4">
                <h6 className="title is-6 mb-2 has-text-info">
                  <span className="icon-text">
                    <span className="icon">
                      <i className="fas fa-chart-pie"></i>
                    </span>
                    <span>ARC Overview</span>
                  </span>
                </h6>
                <table className="table is-fullwidth is-striped">
                  <thead>
                    <tr>
                      <th>Current Size</th>
                      <th>Target Size</th>
                      <th>Min/Max Size</th>
                      <th>Hit Ratio</th>
                      <th>Data Efficiency</th>
                      <th>Prefetch Efficiency</th>
                      <th>Compression Ratio</th>
                      <th>Last Updated</th>
                    </tr>
                  </thead>
                  <tbody>
                    {arcStats.slice(0, 1).map((arc, index) => {
                      const arcHits = parseFloat(arc.hits || arc.arc_hits) || 0;
                      const arcMisses =
                        parseFloat(arc.misses || arc.arc_misses) || 0;
                      const hitRatio =
                        arc.hit_ratio ||
                        (arcHits + arcMisses > 0
                          ? ((arcHits / (arcHits + arcMisses)) * 100).toFixed(1)
                          : 0);
                      const compressionRatio =
                        arc.uncompressed_size && arc.compressed_size
                          ? (
                              parseFloat(arc.uncompressed_size) /
                              parseFloat(arc.compressed_size)
                            ).toFixed(2)
                          : "N/A";

                      return (
                        <tr key={index}>
                          <td>
                            <span className="tag is-info">
                              {formatBytes(parseFloat(arc.arc_size) || 0)}
                            </span>
                          </td>
                          <td>
                            <span className="tag is-primary">
                              {formatBytes(
                                parseFloat(arc.arc_target_size) || 0
                              )}
                            </span>
                          </td>
                          <td>
                            <div className="tags">
                              <span
                                className="tag is-grey"
                                title="Minimum ARC Size"
                              >
                                {formatBytes(parseFloat(arc.arc_min_size) || 0)}
                              </span>
                              <span
                                className="tag is-dark"
                                title="Maximum ARC Size"
                              >
                                {formatBytes(parseFloat(arc.arc_max_size) || 0)}
                              </span>
                            </div>
                          </td>
                          <td>
                            <span
                              className={`tag ${
                                hitRatio > 95
                                  ? "is-success"
                                  : hitRatio > 90
                                    ? "is-info"
                                    : hitRatio > 80
                                      ? "is-warning"
                                      : "is-danger"
                              }`}
                            >
                              {typeof hitRatio === "number"
                                ? `${hitRatio}%`
                                : hitRatio}
                            </span>
                          </td>
                          <td>
                            <span
                              className={`tag ${
                                parseFloat(arc.data_demand_efficiency) > 95
                                  ? "is-success"
                                  : parseFloat(arc.data_demand_efficiency) > 90
                                    ? "is-info"
                                    : parseFloat(arc.data_demand_efficiency) >
                                        80
                                      ? "is-warning"
                                      : "is-dark"
                              }`}
                            >
                              {arc.data_demand_efficiency
                                ? `${arc.data_demand_efficiency}%`
                                : "N/A"}
                            </span>
                          </td>
                          <td>
                            <span
                              className={`tag ${
                                parseFloat(arc.data_prefetch_efficiency) > 50
                                  ? "is-success"
                                  : parseFloat(arc.data_prefetch_efficiency) >
                                      20
                                    ? "is-info"
                                    : parseFloat(arc.data_prefetch_efficiency) >
                                        5
                                      ? "is-warning"
                                      : "is-dark"
                              }`}
                            >
                              {arc.data_prefetch_efficiency
                                ? `${arc.data_prefetch_efficiency}%`
                                : "N/A"}
                            </span>
                          </td>
                          <td>
                            <span
                              className={`tag ${
                                parseFloat(compressionRatio) > 2
                                  ? "is-success"
                                  : parseFloat(compressionRatio) > 1.5
                                    ? "is-info"
                                    : parseFloat(compressionRatio) > 1.1
                                      ? "is-warning"
                                      : "is-dark"
                              }`}
                              title="Uncompressed / Compressed Size Ratio"
                            >
                              {compressionRatio}x
                            </span>
                          </td>
                          <td>
                            <span className="has-text-grey is-size-7">
                              {new Date(
                                arc.scan_timestamp
                              ).toLocaleTimeString()}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Detailed ARC Breakdown */}
              <div className="columns">
                {/* Memory Breakdown */}
                <div className="column is-4">
                  <h6 className="title is-6 mb-2 has-text-success">
                    <span className="icon-text">
                      <span className="icon">
                        <i className="fas fa-memory"></i>
                      </span>
                      <span>Memory Breakdown</span>
                    </span>
                  </h6>
                  <table className="table is-fullwidth is-striped is-narrow">
                    <tbody>
                      {arcStats.slice(0, 1).map((arc, index) => (
                        <React.Fragment key={index}>
                          <tr>
                            <td>
                              <strong>MRU Size</strong>
                            </td>
                            <td>
                              {formatBytes(parseFloat(arc.mru_size) || 0)}
                            </td>
                          </tr>
                          <tr>
                            <td>
                              <strong>MFU Size</strong>
                            </td>
                            <td>
                              {formatBytes(parseFloat(arc.mfu_size) || 0)}
                            </td>
                          </tr>
                          <tr>
                            <td>
                              <strong>Data Size</strong>
                            </td>
                            <td>
                              {formatBytes(parseFloat(arc.data_size) || 0)}
                            </td>
                          </tr>
                          <tr>
                            <td>
                              <strong>Metadata Size</strong>
                            </td>
                            <td>
                              {formatBytes(parseFloat(arc.metadata_size) || 0)}
                            </td>
                          </tr>
                          <tr>
                            <td>
                              <strong>Meta Used</strong>
                            </td>
                            <td>
                              {formatBytes(parseFloat(arc.arc_meta_used) || 0)}
                            </td>
                          </tr>
                          <tr>
                            <td>
                              <strong>Meta Limit</strong>
                            </td>
                            <td>
                              {formatBytes(parseFloat(arc.arc_meta_limit) || 0)}
                            </td>
                          </tr>
                        </React.Fragment>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Hit/Miss Statistics */}
                <div className="column is-4">
                  <h6 className="title is-6 mb-2 has-text-warning">
                    <span className="icon-text">
                      <span className="icon">
                        <i className="fas fa-bullseye"></i>
                      </span>
                      <span>Hit/Miss Statistics</span>
                    </span>
                  </h6>
                  <table className="table is-fullwidth is-striped is-narrow">
                    <tbody>
                      {arcStats.slice(0, 1).map((arc, index) => (
                        <React.Fragment key={index}>
                          <tr>
                            <td>
                              <strong>Total Hits</strong>
                            </td>
                            <td>
                              <span className="tag is-success">
                                {(
                                  parseFloat(arc.hits || arc.arc_hits) || 0
                                ).toLocaleString()}
                              </span>
                            </td>
                          </tr>
                          <tr>
                            <td>
                              <strong>Total Misses</strong>
                            </td>
                            <td>
                              <span className="tag is-warning">
                                {(
                                  parseFloat(arc.misses || arc.arc_misses) || 0
                                ).toLocaleString()}
                              </span>
                            </td>
                          </tr>
                          <tr>
                            <td>
                              <strong>MRU Hits</strong>
                            </td>
                            <td>
                              {(parseFloat(arc.mru_hits) || 0).toLocaleString()}
                            </td>
                          </tr>
                          <tr>
                            <td>
                              <strong>MFU Hits</strong>
                            </td>
                            <td>
                              {(parseFloat(arc.mfu_hits) || 0).toLocaleString()}
                            </td>
                          </tr>
                          <tr>
                            <td>
                              <strong>MRU Ghost Hits</strong>
                            </td>
                            <td>
                              {(
                                parseFloat(arc.mru_ghost_hits) || 0
                              ).toLocaleString()}
                            </td>
                          </tr>
                          <tr>
                            <td>
                              <strong>MFU Ghost Hits</strong>
                            </td>
                            <td>
                              {(
                                parseFloat(arc.mfu_ghost_hits) || 0
                              ).toLocaleString()}
                            </td>
                          </tr>
                        </React.Fragment>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Demand vs Prefetch */}
                <div className="column is-4">
                  <h6 className="title is-6 mb-2 has-text-info">
                    <span className="icon-text">
                      <span className="icon">
                        <i className="fas fa-exchange-alt"></i>
                      </span>
                      <span>Demand vs Prefetch</span>
                    </span>
                  </h6>
                  <table className="table is-fullwidth is-striped is-narrow">
                    <tbody>
                      {arcStats.slice(0, 1).map((arc, index) => (
                        <React.Fragment key={index}>
                          <tr>
                            <td>
                              <strong>Demand Data Hits</strong>
                            </td>
                            <td>
                              <span className="tag is-success is-small">
                                {(
                                  parseFloat(arc.demand_data_hits) || 0
                                ).toLocaleString()}
                              </span>
                            </td>
                          </tr>
                          <tr>
                            <td>
                              <strong>Demand Data Misses</strong>
                            </td>
                            <td>
                              <span className="tag is-warning is-small">
                                {(
                                  parseFloat(arc.demand_data_misses) || 0
                                ).toLocaleString()}
                              </span>
                            </td>
                          </tr>
                          <tr>
                            <td>
                              <strong>Demand Meta Hits</strong>
                            </td>
                            <td>
                              <span className="tag is-success is-small">
                                {(
                                  parseFloat(arc.demand_metadata_hits) || 0
                                ).toLocaleString()}
                              </span>
                            </td>
                          </tr>
                          <tr>
                            <td>
                              <strong>Demand Meta Misses</strong>
                            </td>
                            <td>
                              <span className="tag is-warning is-small">
                                {(
                                  parseFloat(arc.demand_metadata_misses) || 0
                                ).toLocaleString()}
                              </span>
                            </td>
                          </tr>
                          <tr>
                            <td>
                              <strong>Prefetch Data Hits</strong>
                            </td>
                            <td>
                              <span className="tag is-info is-small">
                                {(
                                  parseFloat(arc.prefetch_data_hits) || 0
                                ).toLocaleString()}
                              </span>
                            </td>
                          </tr>
                          <tr>
                            <td>
                              <strong>Prefetch Data Misses</strong>
                            </td>
                            <td>
                              <span className="tag is-dark is-small">
                                {(
                                  parseFloat(arc.prefetch_data_misses) || 0
                                ).toLocaleString()}
                              </span>
                            </td>
                          </tr>
                        </React.Fragment>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* L2ARC Statistics (if available) */}
              {arcStats
                .slice(0, 1)
                .some((arc) => parseFloat(arc.l2_size) > 0) && (
                <div className="mt-4">
                  <h6 className="title is-6 mb-2 has-text-danger">
                    <span className="icon-text">
                      <span className="icon">
                        <i className="fas fa-layer-group"></i>
                      </span>
                      <span>L2ARC Statistics</span>
                    </span>
                  </h6>
                  <table className="table is-fullwidth is-striped is-narrow">
                    <thead>
                      <tr>
                        <th>L2 Size</th>
                        <th>L2 Hits</th>
                        <th>L2 Misses</th>
                        <th>L2 Hit Ratio</th>
                      </tr>
                    </thead>
                    <tbody>
                      {arcStats.slice(0, 1).map((arc, index) => {
                        const l2Hits = parseFloat(arc.l2_hits) || 0;
                        const l2Misses = parseFloat(arc.l2_misses) || 0;
                        const l2HitRatio =
                          l2Hits + l2Misses > 0
                            ? ((l2Hits / (l2Hits + l2Misses)) * 100).toFixed(1)
                            : 0;

                        return (
                          <tr key={index}>
                            <td>
                              <span className="tag is-info">
                                {formatBytes(parseFloat(arc.l2_size) || 0)}
                              </span>
                            </td>
                            <td>
                              <span className="tag is-success">
                                {l2Hits.toLocaleString()}
                              </span>
                            </td>
                            <td>
                              <span className="tag is-warning">
                                {l2Misses.toLocaleString()}
                              </span>
                            </td>
                            <td>
                              <span
                                className={`tag ${
                                  l2HitRatio > 80
                                    ? "is-success"
                                    : l2HitRatio > 60
                                      ? "is-info"
                                      : l2HitRatio > 40
                                        ? "is-warning"
                                        : "is-danger"
                                }`}
                              >
                                {l2HitRatio}%
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
          ) : (
            <div className="notification is-info">
              <p>
                No ZFS ARC statistics available. The backend may still be
                collecting data.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ArcStats;
