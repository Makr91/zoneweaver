import React from "react";

import {
  calculateBandwidth,
  formatBandwidth,
  getBandwidthColor,
} from "./NetworkingUtils";

const BandwidthTable = ({
  networkUsage,
  bandwidthSort,
  handleBandwidthSort,
  getSortIcon,
  resetBandwidthSort,
  sectionsCollapsed,
  toggleSection,
}) => (
  <div className="box mb-4">
    <div className="level is-mobile mb-3">
      <div className="level-left">
        <h4
                      className='title is-5 mb-0 is-clickable'
          onClick={resetBandwidthSort}
                      title="Click to reset sorting to default"
        >
          <span className="icon-text">
            <span className="icon">
              <i className="fas fa-chart-line"></i>
            </span>
            <span>Real-Time Network Bandwidth</span>
            {bandwidthSort.length > 1 && (
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
                      onClick={() => toggleSection('bandwidth')}
                      title={sectionsCollapsed.bandwidth ? 'Expand section' : 'Collapse section'}
        >
          <span className="icon">
            <i
              className={`fas ${sectionsCollapsed.bandwidth ? "fa-chevron-down" : "fa-chevron-up"}`}
            ></i>
          </span>
        </button>
      </div>
    </div>
    {!sectionsCollapsed.bandwidth &&
      (networkUsage.length > 0 ? (
        <div className="table-container">
          <table className="table is-fullwidth is-striped">
            <thead>
              <tr>
                <th
                  className="is-clickable"
                                      onClick={() => handleBandwidthSort('link')}
                  title="Click to sort by interface name"
                >
                  Interface{" "}
                  <i
                    className={`fas ${getSortIcon(bandwidthSort, "link")}`}
                  ></i>
                </th>
                <th
                  className="is-clickable"
                                      onClick={() => handleBandwidthSort('totalMbps')}
                  title="Click to sort by total bandwidth"
                >
                  Total Bandwidth{" "}
                  <i
                    className={`fas ${getSortIcon(bandwidthSort, "totalMbps")}`}
                  ></i>
                </th>
                <th
                  className="is-clickable"
                                      onClick={() => handleBandwidthSort('rxMbps')}
                                      title="Click to sort by RX rate"
                >
                  RX Rate{" "}
                  <i
                    className={`fas ${getSortIcon(bandwidthSort, "rxMbps")}`}
                  ></i>
                </th>
                <th
                  className="is-clickable"
                                      onClick={() => handleBandwidthSort('txMbps')}
                  title="Click to sort by TX rate"
                >
                  TX Rate{" "}
                  <i
                    className={`fas ${getSortIcon(bandwidthSort, "txMbps")}`}
                  ></i>
                </th>
                <th
                  className="is-clickable"
                                      onClick={() => handleBandwidthSort('time_delta_seconds')}
                  title="Click to sort by measurement interval"
                >
                  Interval{" "}
                  <i
                    className={`fas ${getSortIcon(bandwidthSort, "time_delta_seconds")}`}
                  ></i>
                </th>
                <th
                  className="is-clickable"
                                      onClick={() => handleBandwidthSort('ipackets_delta')}
                  title="Click to sort by RX packet count"
                >
                  RX Packets{" "}
                  <i
                    className={`fas ${getSortIcon(bandwidthSort, "ipackets_delta")}`}
                  ></i>
                </th>
                <th
                  className="is-clickable"
                                      onClick={() => handleBandwidthSort('opackets_delta')}
                  title="Click to sort by TX packet count"
                >
                  TX Packets{" "}
                  <i
                    className={`fas ${getSortIcon(bandwidthSort, "opackets_delta")}`}
                  ></i>
                </th>
              </tr>
            </thead>
            <tbody>
              {networkUsage.map((usage, index) => {
                const bandwidth = calculateBandwidth(usage);
                return (
                  <tr key={index}>
                    <td>
                      <strong>{usage.link}</strong>
                    </td>
                    <td>
                      <span
                        className={`tag ${getBandwidthColor(bandwidth.totalMbps)}`}
                      >
                        {formatBandwidth(bandwidth.totalMbps)}
                      </span>
                    </td>
                    <td>
                      <span className="tag is-info">
                        ↓ {formatBandwidth(bandwidth.rxMbps)}
                      </span>
                    </td>
                    <td>
                      <span className="tag is-warning">
                        ↑ {formatBandwidth(bandwidth.txMbps)}
                      </span>
                    </td>
                    <td>
                      {usage.time_delta_seconds
                        ? `${usage.time_delta_seconds.toFixed(1)}s`
                        : "N/A"}
                    </td>
                    <td>
                      <span className="has-text-info">
                        {usage.ipackets_delta
                          ? parseInt(usage.ipackets_delta).toLocaleString()
                          : "0"}
                      </span>
                    </td>
                    <td>
                      <span className="has-text-warning">
                        {usage.opackets_delta
                          ? parseInt(usage.opackets_delta).toLocaleString()
                          : "0"}
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
            No real-time bandwidth data available. The backend may still be
            collecting delta measurements.
          </p>
        </div>
      ))}
  </div>
);

export default BandwidthTable;
