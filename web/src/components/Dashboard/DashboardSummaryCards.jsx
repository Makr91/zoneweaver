import PropTypes from "prop-types";

import { bytesToSize } from "./dashboardUtils";

/**
 * Infrastructure summary cards — servers, zones, memory, health status.
 */
const DashboardSummaryCards = ({ summary, onShowHealthModal }) => (
  <div className="columns is-multiline mb-3">
    <div className="column is-3">
      <div className="box has-text-centered">
        <div className="heading">Total Servers</div>
        <div className="title is-2 has-text-info">{summary.totalServers}</div>
        <div className="level is-mobile mt-2">
          <div className="level-item has-text-centered">
            <div>
              <div className="heading has-text-success">Online</div>
              <div className="title is-6">{summary.onlineServers}</div>
            </div>
          </div>
          <div className="level-item has-text-centered">
            <div>
              <div className="heading has-text-danger">Offline</div>
              <div className="title is-6">{summary.offlineServers}</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div className="column is-3">
      <div className="box has-text-centered">
        <div className="heading">Total Zones</div>
        <div className="title is-2 has-text-primary">{summary.totalZones}</div>
        <div className="level is-mobile mt-2">
          <div className="level-item has-text-centered">
            <div>
              <div className="heading has-text-success">Running</div>
              <div className="title is-6">{summary.runningZones}</div>
            </div>
          </div>
          <div className="level-item has-text-centered">
            <div>
              <div className="heading has-text-warning">Stopped</div>
              <div className="title is-6">{summary.stoppedZones}</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div className="column is-3">
      <div className="box has-text-centered">
        <div className="heading">Memory Usage</div>
        <div className="title is-2 has-text-link">
          {summary.totalMemory > 0
            ? `${Math.round((summary.usedMemory / summary.totalMemory) * 100)}%`
            : "N/A"}
        </div>
        <div className="mt-2">
          <div className="heading">
            {summary.totalMemory > 0
              ? `${bytesToSize(summary.usedMemory)} / ${bytesToSize(summary.totalMemory)}`
              : "No data available"}
          </div>
          {summary.totalMemory > 0 && (
            <progress
              className="progress is-small is-link mt-2"
              value={summary.usedMemory}
              max={summary.totalMemory}
            />
          )}
        </div>
      </div>
    </div>

    <div className="column is-3">
      <button
        type="button"
        className={`box has-text-centered button is-ghost p-4 ${summary.totalIssues > 0 ? "is-clickable" : ""}`}
        onClick={() => {
          if (summary.totalIssues > 0) {
            onShowHealthModal();
          }
        }}
        title={summary.totalIssues > 0 ? "Click to view details" : ""}
        style={{ width: "100%", border: "none" }}
        disabled={summary.totalIssues === 0}
      >
        <div className="heading">Health Status</div>
        <div className="title is-2 has-text-success">
          {summary.healthyServers}
        </div>
        <div className="level is-mobile mt-2">
          <div className="level-item has-text-centered">
            <div>
              <div className="heading has-text-success">Healthy</div>
              <div className="title is-6">{summary.healthyServers}</div>
            </div>
          </div>
          <div className="level-item has-text-centered">
            <div>
              <div className="heading has-text-warning">Issues</div>
              <div className="title is-6">{summary.totalIssues}</div>
            </div>
          </div>
        </div>
      </button>
    </div>
  </div>
);

DashboardSummaryCards.propTypes = {
  summary: PropTypes.shape({
    totalServers: PropTypes.number.isRequired,
    onlineServers: PropTypes.number.isRequired,
    offlineServers: PropTypes.number.isRequired,
    totalZones: PropTypes.number.isRequired,
    runningZones: PropTypes.number.isRequired,
    stoppedZones: PropTypes.number.isRequired,
    totalMemory: PropTypes.number.isRequired,
    usedMemory: PropTypes.number.isRequired,
    healthyServers: PropTypes.number.isRequired,
    totalIssues: PropTypes.number.isRequired,
  }).isRequired,
  onShowHealthModal: PropTypes.func.isRequired,
};

export default DashboardSummaryCards;
