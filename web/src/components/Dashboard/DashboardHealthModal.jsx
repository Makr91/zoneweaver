import PropTypes from "prop-types";

import { ContentModal } from "../common";

import { getServerHealthStatus } from "./dashboardUtils";

/**
 * Modal showing detailed health issues for unhealthy servers.
 */
const HealthIssueCard = ({ serverResult }) => {
  const status = getServerHealthStatus(serverResult);
  const statusColor = status === "offline" ? "is-danger" : "is-warning";
  const issues = [];
  const rebootInfo = serverResult.healthData?.reboot_info;

  if (status === "offline") {
    issues.push(serverResult.error || "Connection failed");
  } else if (status === "warning" && serverResult.data) {
    if (serverResult.data.loadavg?.[0] > 2) {
      issues.push(`High CPU load: ${serverResult.data.loadavg[0].toFixed(2)}`);
    }
    if (
      serverResult.data.totalmem &&
      serverResult.data.freemem &&
      serverResult.data.freemem / serverResult.data.totalmem < 0.1
    ) {
      const memUsed = Math.round(
        ((serverResult.data.totalmem - serverResult.data.freemem) /
          serverResult.data.totalmem) *
          100
      );
      issues.push(`Low memory: ${memUsed}% used`);
    }
  }

  if (serverResult.healthData?.reboot_required) {
    const reasons = rebootInfo?.reasons?.join(", ") || "Configuration changes";
    const ageMinutes = rebootInfo?.age_minutes || 0;
    const timeAgo =
      ageMinutes > 60
        ? `${Math.floor(ageMinutes / 60)}h ${ageMinutes % 60}m ago`
        : `${ageMinutes}m ago`;
    issues.push(`Reboot required (${reasons}) - Changed ${timeAgo}`);
  }

  if (serverResult.healthData?.faultStatus?.hasFaults) {
    const { faultStatus } = serverResult.healthData;
    const faultSummary = faultStatus.severityLevels?.join(", ") || "Unknown";
    issues.push(
      `${faultStatus.faultCount} system fault${faultStatus.faultCount === 1 ? "" : "s"} (${faultSummary})`
    );
  }

  return (
    <div
      className={`notification ${serverResult.healthData?.reboot_required ? "is-warning" : statusColor} mb-3`}
    >
      <div className="level is-mobile">
        <div className="level-left">
          <strong>{serverResult.server.hostname}</strong>
        </div>
        <div className="level-right">
          {serverResult.healthData?.reboot_required && (
            <span className="tag is-warning">
              <span className="icon is-small">
                <i className="fas fa-redo" />
              </span>
              <span>Reboot Required</span>
            </span>
          )}
        </div>
      </div>
      <ul className="mt-2">
        {issues.map((issue) => (
          <li key={issue}>{issue}</li>
        ))}
      </ul>
    </div>
  );
};

HealthIssueCard.propTypes = {
  serverResult: PropTypes.shape({
    server: PropTypes.object.isRequired,
    success: PropTypes.bool.isRequired,
    data: PropTypes.object,
    error: PropTypes.string,
    healthData: PropTypes.object,
  }).isRequired,
};

const DashboardHealthModal = ({ isOpen, onClose, servers }) => {
  const unhealthyServers =
    servers?.filter(
      (s) =>
        getServerHealthStatus(s) !== "healthy" || s.healthData?.reboot_required
    ) || [];

  return (
    <ContentModal
      isOpen={isOpen}
      onClose={onClose}
      title="Infrastructure Health Issues"
      icon="fas fa-exclamation-triangle"
    >
      {unhealthyServers.map((serverResult) => (
        <HealthIssueCard
          key={`${serverResult.server.hostname}-${serverResult.server.port}-health`}
          serverResult={serverResult}
        />
      ))}
    </ContentModal>
  );
};

DashboardHealthModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  servers: PropTypes.arrayOf(PropTypes.object).isRequired,
};

export default DashboardHealthModal;
