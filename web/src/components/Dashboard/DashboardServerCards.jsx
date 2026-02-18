import PropTypes from "prop-types";

import { getServerHealthStatus, getStatusColor } from "./dashboardUtils";

/**
 * Individual server status cards with health indicators.
 */
const ServerCard = ({ serverResult, onNavigateToServer }) => {
  const { server, success, data, error: serverError } = serverResult;
  const status = getServerHealthStatus(serverResult);
  const statusColor = getStatusColor(status);

  let statusTooltip = "Host is healthy";
  if (status === "offline") {
    statusTooltip = serverError || "Connection failed";
  } else if (status === "warning") {
    const issues = [];
    if (data?.loadavg?.[0] > 2) {
      issues.push("High CPU load");
    }
    if (data?.totalmem && data?.freemem && data.freemem / data.totalmem < 0.1) {
      issues.push("Low memory");
    }
    statusTooltip = issues.join(", ");
  }

  return (
    <div className="column is-6">
      <div className="box">
        <h2 className="title is-5 mb-3">
          <span className="icon-text">
            <span className={`icon ${statusColor}`} title={statusTooltip}>
              <i className="fas fa-circle is-size-7" />
            </span>
            <span>{server.hostname}</span>
          </span>
        </h2>

        {success && data ? (
          <>
            <p className="subtitle is-6 has-text-grey mb-3">
              {data?.type || "Unknown"} {data?.release || ""}
            </p>

            <div className="columns is-mobile mb-3">
              <div className="column">
                <div className="has-text-centered">
                  <div className="heading">Zones</div>
                  <div className="title is-4">
                    {data.runningzones?.length || 0} /{" "}
                    {data.allzones?.length || 0}
                  </div>
                </div>
              </div>
              <div className="column">
                <div className="has-text-centered">
                  <div className="heading">CPU Load</div>
                  <div className="title is-4">
                    {data.loadavg ? data.loadavg[0].toFixed(2) : "N/A"}
                  </div>
                </div>
              </div>
              <div className="column">
                <div className="has-text-centered">
                  <div className="heading">Memory</div>
                  <div className="title is-4">
                    {data.totalmem && data.freemem
                      ? `${Math.round(((data.totalmem - data.freemem) / data.totalmem) * 100)}%`
                      : "N/A"}
                  </div>
                </div>
              </div>
            </div>

            <button
              className="button is-fullwidth is-primary"
              onClick={() => onNavigateToServer(server)}
            >
              <span className="icon">
                <i className="fas fa-arrow-right" />
              </span>
              <span>View Details</span>
            </button>
          </>
        ) : (
          <>
            <p className="subtitle is-6 has-text-grey mb-3">
              Connection Failed
            </p>

            <div className="columns is-mobile mb-3">
              <div className="column">
                <div className="has-text-centered">
                  <div className="heading">Zones</div>
                  <div className="title is-4 has-text-grey">-</div>
                </div>
              </div>
              <div className="column">
                <div className="has-text-centered">
                  <div className="heading">CPU Load</div>
                  <div className="title is-4 has-text-grey">-</div>
                </div>
              </div>
              <div className="column">
                <div className="has-text-centered">
                  <div className="heading">Memory</div>
                  <div className="title is-4 has-text-grey">-</div>
                </div>
              </div>
            </div>

            <button
              className="button is-fullwidth is-primary"
              onClick={() => onNavigateToServer(server)}
              disabled
            >
              <span className="icon">
                <i className="fas fa-arrow-right" />
              </span>
              <span>View Details</span>
            </button>
          </>
        )}
      </div>
    </div>
  );
};

ServerCard.propTypes = {
  serverResult: PropTypes.shape({
    server: PropTypes.object.isRequired,
    success: PropTypes.bool.isRequired,
    data: PropTypes.object,
    error: PropTypes.string,
  }).isRequired,
  onNavigateToServer: PropTypes.func.isRequired,
};

const DashboardServerCards = ({ servers, onNavigateToServer }) => (
  <div className="columns is-multiline is-variable is-2 mb-0">
    {servers?.map((serverResult) => (
      <ServerCard
        key={`${serverResult.server.hostname}-${serverResult.server.port}-card`}
        serverResult={serverResult}
        onNavigateToServer={onNavigateToServer}
      />
    ))}
  </div>
);

DashboardServerCards.propTypes = {
  servers: PropTypes.arrayOf(PropTypes.object).isRequired,
  onNavigateToServer: PropTypes.func.isRequired,
};

export default DashboardServerCards;
