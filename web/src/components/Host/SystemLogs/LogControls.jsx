import PropTypes from "prop-types";

const LogControls = ({
  filters,
  onFilterChange,
  onRefresh,
  loading,
  autoRefresh,
  onToggleAutoRefresh,
  isStreaming,
  onToggleStreaming,
  selectedLog,
}) => {
  const getStreamingTitle = () => {
    if (selectedLog?.type === "fault-manager") {
      return "Streaming not available for Fault Manager logs";
    }
    return isStreaming
      ? "Stop real-time streaming"
      : "Start real-time streaming";
  };

  return (
    <div className="box mb-4">
      <div className="columns">
        <div className="column is-2">
          <div className="field">
            <label className="label is-small" htmlFor="log-lines">
              Lines
            </label>
            <div className="control">
              <input
                id="log-lines"
                className="input is-small"
                type="number"
                min="10"
                max="1000"
                value={filters.lines}
                onChange={(e) =>
                  onFilterChange("lines", parseInt(e.target.value))
                }
              />
            </div>
          </div>
        </div>
        <div className="column is-3">
          <div className="field">
            <label className="label is-small" htmlFor="log-grep">
              Filter (grep)
            </label>
            <div className="control">
              <input
                id="log-grep"
                className="input is-small"
                type="text"
                placeholder="error, warning..."
                value={filters.grep}
                onChange={(e) => onFilterChange("grep", e.target.value)}
              />
            </div>
          </div>
        </div>
        <div className="column is-3">
          <div className="field">
            <label className="label is-small" htmlFor="log-since">
              Since
            </label>
            <div className="control">
              <input
                id="log-since"
                className="input is-small"
                type="datetime-local"
                value={filters.since}
                onChange={(e) => onFilterChange("since", e.target.value)}
              />
            </div>
          </div>
        </div>
        <div className="column is-1">
          <div className="field">
            <label className="label is-small" htmlFor="log-tail">
              Tail
            </label>
            <div className="control">
              <label className="checkbox">
                <input
                  id="log-tail"
                  type="checkbox"
                  checked={filters.tail}
                  onChange={(e) => onFilterChange("tail", e.target.checked)}
                />
                <span className="ml-1">Latest</span>
              </label>
            </div>
          </div>
        </div>
        <div className="column is-narrow">
          <div className="field">
            <div className="label is-small">&nbsp;</div>
            <div className="control">
              <button
                className="button is-small is-info"
                onClick={onRefresh}
                disabled={loading}
              >
                <span className="icon">
                  <i className="fas fa-sync-alt" />
                </span>
                <span>Refresh</span>
              </button>
            </div>
          </div>
        </div>
        <div className="column is-narrow">
          <div className="field">
            <div className="label is-small">&nbsp;</div>
            <div className="control">
              <button
                className={`button is-small ${autoRefresh ? "is-success" : ""}`}
                onClick={onToggleAutoRefresh}
                disabled={loading || isStreaming}
              >
                <span className="icon">
                  <i
                    className={`fas ${autoRefresh ? "fa-pause" : "fa-play"}`}
                  />
                </span>
                <span>{autoRefresh ? "Stop" : "Auto"}</span>
              </button>
            </div>
          </div>
        </div>
        <div className="column is-narrow">
          <div className="field">
            <div className="label is-small">&nbsp;</div>
            <div className="control">
              <button
                className={`button is-small ${isStreaming ? "is-primary" : "is-warning"}`}
                onClick={onToggleStreaming}
                disabled={loading || selectedLog?.type === "fault-manager"}
                title={getStreamingTitle()}
              >
                <span className="icon">
                  <i
                    className={`fas ${isStreaming ? "fa-stop" : "fa-stream"}`}
                  />
                </span>
                <span>{isStreaming ? "Stop Stream" : "Live Stream"}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

LogControls.propTypes = {
  filters: PropTypes.shape({
    lines: PropTypes.number,
    grep: PropTypes.string,
    since: PropTypes.string,
    tail: PropTypes.bool,
  }).isRequired,
  onFilterChange: PropTypes.func.isRequired,
  onRefresh: PropTypes.func.isRequired,
  loading: PropTypes.bool.isRequired,
  autoRefresh: PropTypes.bool.isRequired,
  onToggleAutoRefresh: PropTypes.func.isRequired,
  isStreaming: PropTypes.bool.isRequired,
  onToggleStreaming: PropTypes.func.isRequired,
  selectedLog: PropTypes.object,
};

export default LogControls;
