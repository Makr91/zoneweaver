import PropTypes from "prop-types";

import ResourceUtilization from "./ResourceUtilization.jsx";
import { formatUptime } from "./utils";

const SystemInfo = ({
  serverStats,
  monitoringStatus,
  monitoringHealth,
  taskStats,
  swapSummaryData,
}) => {
  const getHealthStatusClass = (status) => {
    if (status === "healthy") {
      return "is-success";
    }
    if (status === "warning") {
      return "is-warning";
    }
    return "is-danger";
  };

  return (
    <div className="box mb-5">
      <h3 className="title is-5 mb-4">
        <span className="icon-text">
          <span className="icon">
            <i className="fas fa-tachometer-alt" />
          </span>
          <span>Host Overview</span>
        </span>
      </h3>

      <div className="columns">
        {/* System Information with Monitoring & Tasks */}
        <div className="column is-6">
          <div className="content">
            <h4 className="subtitle is-6 mb-3">
              <span className="icon-text">
                <span className="icon has-text-info">
                  <i className="fas fa-server" />
                </span>
                <span>System Information</span>
              </span>
            </h4>
            <table className="table is-fullwidth is-narrow">
              <tbody>
                <tr>
                  <td>
                    <strong>Hostname</strong>
                  </td>
                  <td>{serverStats.hostname || "N/A"}</td>
                </tr>
                <tr>
                  <td>
                    <strong>Platform</strong>
                  </td>
                  <td>
                    {serverStats.type || "N/A"} {serverStats.release || ""}
                  </td>
                </tr>
                <tr>
                  <td>
                    <strong>Architecture</strong>
                  </td>
                  <td>{serverStats.arch || "N/A"}</td>
                </tr>
                <tr>
                  <td>
                    <strong>Zoneweaver API Version</strong>
                  </td>
                  <td>{serverStats.version || "N/A"}</td>
                </tr>
                <tr>
                  <td>
                    <strong>Uptime</strong>
                  </td>
                  <td>{formatUptime(serverStats.uptime)}</td>
                </tr>
                {/* Monitoring Status in table */}
                {Object.keys(monitoringStatus).length > 0 && (
                  <>
                    <tr>
                      <td>
                        <strong>Monitoring Service</strong>
                      </td>
                      <td>
                        <span
                          className={`tag ${monitoringStatus.isRunning ? "is-success" : "is-danger"}`}
                        >
                          {monitoringStatus.isRunning ? "Running" : "Stopped"}
                        </span>
                        {monitoringStatus.isInitialized && (
                          <span className="tag is-success ml-1">
                            Initialized
                          </span>
                        )}
                      </td>
                    </tr>
                  </>
                )}
                {monitoringHealth.status && (
                  <tr>
                    <td>
                      <strong>Service Health</strong>
                    </td>
                    <td>
                      <span
                        className={`tag ${getHealthStatusClass(monitoringHealth.status)}`}
                      >
                        {monitoringHealth.status}
                      </span>
                    </td>
                  </tr>
                )}
                {/* Task Queue Status in table */}
                {Object.keys(taskStats).length > 0 && (
                  <tr>
                    <td>
                      <strong>Task Queue</strong>
                    </td>
                    <td>
                      <span className="tag is-info mr-1">
                        {taskStats.pending || 0} Pending
                      </span>
                      <span className="tag is-success mr-1">
                        {taskStats.completed || 0} Done
                      </span>
                      {(taskStats.failed || 0) > 0 && (
                        <span className="tag is-danger">
                          {taskStats.failed} Failed
                        </span>
                      )}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Resource Utilization */}
        <ResourceUtilization
          serverStats={serverStats}
          swapSummaryData={swapSummaryData}
        />
      </div>
    </div>
  );
};

SystemInfo.propTypes = {
  serverStats: PropTypes.shape({
    hostname: PropTypes.string,
    type: PropTypes.string,
    release: PropTypes.string,
    arch: PropTypes.string,
    version: PropTypes.string,
    uptime: PropTypes.number,
    loadavg: PropTypes.array,
    totalmem: PropTypes.number,
    freemem: PropTypes.number,
  }),
  monitoringStatus: PropTypes.shape({
    isRunning: PropTypes.bool,
    isInitialized: PropTypes.bool,
  }),
  monitoringHealth: PropTypes.shape({
    status: PropTypes.string,
  }),
  taskStats: PropTypes.shape({
    pending: PropTypes.number,
    completed: PropTypes.number,
    failed: PropTypes.number,
  }),
  swapSummaryData: PropTypes.object,
};

export default SystemInfo;
