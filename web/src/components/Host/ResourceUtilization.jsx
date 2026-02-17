import PropTypes from "prop-types";

import { bytesToSize, getCpuCount } from "./utils";

const ResourceUtilization = ({ serverStats, swapSummaryData }) => (
  <div className="column is-6">
    <div className="content">
      <h4 className="subtitle is-6 mb-3">
        <span className="icon-text">
          <span className="icon has-text-warning">
            <i className="fas fa-chart-pie" />
          </span>
          <span>Resource Utilization</span>
        </span>
      </h4>
      {/* CPU Usage */}
      <div className="level is-mobile mb-3">
        <div className="level-left">
          <span className="icon">
            <i className="fas fa-microchip" />
          </span>
          <span className="ml-2">CPU Usage</span>
        </div>
        <div className="level-right">
          <span>
            {serverStats.loadavg && getCpuCount(serverStats) !== "N/A"
              ? `${((parseFloat(serverStats.loadavg[0]) / getCpuCount(serverStats)) * 100).toFixed(1)}%`
              : "0%"}
          </span>
        </div>
      </div>
      <progress
        className="progress is-small is-info mb-4"
        value={
          serverStats.loadavg && getCpuCount(serverStats) !== "N/A"
            ? Math.min(
                (parseFloat(serverStats.loadavg[0]) /
                  getCpuCount(serverStats)) *
                  100,
                100
              )
            : 0
        }
        max="100"
      />

      {/* Memory Usage */}
      <div className="level is-mobile mb-1">
        <div className="level-left">
          <span className="icon">
            <i className="fas fa-memory" />
          </span>
          <span className="ml-2">Memory Usage</span>
          <span className="is-size-7 has-text-grey ml-2">
            (Total:{" "}
            {serverStats.totalmem ? bytesToSize(serverStats.totalmem) : "N/A"})
          </span>
        </div>
        <div className="level-right">
          <span>
            {serverStats.totalmem && serverStats.freemem
              ? `${(((serverStats.totalmem - serverStats.freemem) / serverStats.totalmem) * 100).toFixed(1)}%`
              : "N/A"}
          </span>
        </div>
      </div>
      <progress
        className="progress is-small is-warning mb-4"
        value={
          serverStats.totalmem && serverStats.freemem
            ? ((serverStats.totalmem - serverStats.freemem) /
                serverStats.totalmem) *
              100
            : 0
        }
        max="100"
      />

      {/* Swap Usage */}
      {swapSummaryData && Object.keys(swapSummaryData).length > 0 && (
        <>
          <div className="level is-mobile mb-1">
            <div className="level-left">
              <span className="icon">
                <i className="fas fa-hdd" />
              </span>
              <span className="ml-2">Swap Usage</span>
              <span className="is-size-7 has-text-grey ml-2">
                (Total: {swapSummaryData.totalSwapGB || "N/A"} GB, Used:{" "}
                {swapSummaryData.usedSwapGB || "N/A"} GB, Free:{" "}
                {swapSummaryData.freeSwapGB || "N/A"} GB)
              </span>
            </div>
            <div className="level-right">
              <span>
                {typeof swapSummaryData.overallUtilization === "number"
                  ? `${swapSummaryData.overallUtilization.toFixed(1)}%`
                  : "N/A"}
              </span>
            </div>
          </div>
          <progress
            className="progress is-small is-link mb-4"
            value={
              typeof swapSummaryData.overallUtilization === "number"
                ? swapSummaryData.overallUtilization
                : 0
            }
            max="100"
          />
        </>
      )}
    </div>
  </div>
);

ResourceUtilization.propTypes = {
  serverStats: PropTypes.object,
  swapSummaryData: PropTypes.object,
};

export default ResourceUtilization;
