import PropTypes from "prop-types";

/**
 * Quick action buttons and zone distribution sidebar.
 */
const ZoneDistribution = ({ servers, summary }) => (
  <div className="content">
    {servers && servers.length > 0 ? (
      <>
        {servers
          .filter((s) => s.success && s.data)
          .map((serverResult) => {
            const zoneCount = serverResult.data.allzones?.length || 0;
            const runningCount = serverResult.data.runningzones?.length || 0;
            const percentage =
              summary.totalZones > 0
                ? Math.round((zoneCount / summary.totalZones) * 100)
                : 0;

            return (
              <div
                key={`${serverResult.server.hostname}-${serverResult.server.port}`}
                className="mb-3"
              >
                <div className="level is-mobile mb-1">
                  <div className="level-left">
                    <div className="level-item">
                      <strong className="is-size-7">
                        {serverResult.server.hostname}
                      </strong>
                    </div>
                  </div>
                  <div className="level-right">
                    <div className="level-item">
                      <span className="is-size-7">
                        {zoneCount} zones ({percentage}%)
                      </span>
                    </div>
                  </div>
                </div>
                <progress
                  className="progress is-small is-primary"
                  value={zoneCount}
                  max={summary.totalZones || 1}
                />
                <p className="is-size-7 has-text-grey">
                  {runningCount} running, {zoneCount - runningCount} stopped
                </p>
              </div>
            );
          })}

        <hr className="my-3" />

        <div className="has-text-centered">
          <p className="heading">Total Infrastructure</p>
          <p className="title is-5">{summary?.totalZones || 0} Zones</p>
          <p className="subtitle is-7 has-text-grey">
            Across {summary?.onlineServers || 0} active hosts
          </p>
        </div>
      </>
    ) : (
      <div className="has-text-centered has-text-grey">
        <p>No zone data available</p>
      </div>
    )}
  </div>
);

ZoneDistribution.propTypes = {
  servers: PropTypes.arrayOf(PropTypes.object).isRequired,
  summary: PropTypes.shape({
    totalZones: PropTypes.number,
    onlineServers: PropTypes.number,
  }).isRequired,
};

const DashboardQuickActions = ({
  servers,
  summary,
  onNavigateZoneRegister,
  onNavigateZones,
  onNavigateServerRegister,
  onNavigateSettings,
}) => (
  <div className="columns mb-3">
    <div className="column is-8">
      <div className="box">
        <h2 className="title is-4 mb-4">
          <span className="icon-text">
            <span className="icon">
              <i className="fas fa-bolt" />
            </span>
            <span>Quick Actions</span>
          </span>
        </h2>

        <div className="columns is-multiline">
          <div className="column is-6">
            <button
              className="button is-fullwidth is-primary is-medium"
              onClick={onNavigateZoneRegister}
            >
              <span className="icon">
                <i className="fas fa-plus" />
              </span>
              <span>Create New Zone</span>
            </button>
          </div>
          <div className="column is-6">
            <button
              className="button is-fullwidth is-info is-medium"
              onClick={onNavigateZones}
            >
              <span className="icon">
                <i className="fas fa-list" />
              </span>
              <span>Manage Zones</span>
            </button>
          </div>
          <div className="column is-6">
            <button
              className="button is-fullwidth is-success is-medium"
              onClick={onNavigateServerRegister}
            >
              <span className="icon">
                <i className="fas fa-server" />
              </span>
              <span>Add New Host</span>
            </button>
          </div>
          <div className="column is-6">
            <button
              className="button is-fullwidth is-link is-medium"
              onClick={onNavigateSettings}
            >
              <span className="icon">
                <i className="fas fa-cog" />
              </span>
              <span>Settings</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <div className="column is-4">
      <div className="box">
        <h2 className="title is-4 mb-4">
          <span className="icon-text">
            <span className="icon">
              <i className="fas fa-chart-pie" />
            </span>
            <span>Zone Distribution</span>
          </span>
        </h2>
        <ZoneDistribution servers={servers} summary={summary} />
      </div>
    </div>
  </div>
);

DashboardQuickActions.propTypes = {
  servers: PropTypes.arrayOf(PropTypes.object).isRequired,
  summary: PropTypes.shape({
    totalZones: PropTypes.number,
    onlineServers: PropTypes.number,
  }).isRequired,
  onNavigateZoneRegister: PropTypes.func.isRequired,
  onNavigateZones: PropTypes.func.isRequired,
  onNavigateServerRegister: PropTypes.func.isRequired,
  onNavigateSettings: PropTypes.func.isRequired,
};

export default DashboardQuickActions;
