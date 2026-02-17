import PropTypes from "prop-types";

const TimeSyncActions = ({
  onAction,
  onRefresh,
  loading,
  syncing,
  statusAvailable,
}) => (
  <div className="box">
    <h3 className="title is-6">Quick Actions</h3>

    <div className="field is-grouped">
      <div className="control">
        <button
          className={`button is-primary ${syncing ? "is-loading" : ""}`}
          onClick={() => onAction("sync")}
          disabled={!statusAvailable || syncing || loading}
        >
          <span className="icon">
            <i className="fas fa-sync-alt" />
          </span>
          <span>Force Sync Now</span>
        </button>
      </div>
      <div className="control">
        <button
          className={`button is-info ${loading ? "is-loading" : ""}`}
          onClick={onRefresh}
          disabled={loading || syncing}
        >
          <span className="icon">
            <i className="fas fa-refresh" />
          </span>
          <span>Refresh Status</span>
        </button>
      </div>
      <div className="control">
        <button
          className="button is-warning"
          onClick={() => onAction("restart")}
          disabled={!statusAvailable || syncing || loading}
        >
          <span className="icon">
            <i className="fas fa-redo" />
          </span>
          <span>Restart Service</span>
        </button>
      </div>
    </div>
  </div>
);

TimeSyncActions.propTypes = {
  onAction: PropTypes.func.isRequired,
  onRefresh: PropTypes.func.isRequired,
  loading: PropTypes.bool,
  syncing: PropTypes.bool,
  statusAvailable: PropTypes.bool,
};

export default TimeSyncActions;
