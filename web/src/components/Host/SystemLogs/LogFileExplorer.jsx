import PropTypes from "prop-types";

const LogFileExplorer = ({ logFiles, selectedLog, onLogSelect, loading }) => {
  const getLogIcon = (type) => {
    switch (type) {
      case "system":
        return "fas fa-server";
      case "authentication":
        return "fas fa-key";
      case "fault-manager":
        return "fas fa-exclamation-triangle";
      default:
        return "fas fa-file-alt";
    }
  };

  // Group log files by type for the file explorer
  const groupedLogs = logFiles.reduce((acc, log) => {
    if (!acc[log.type]) {
      acc[log.type] = [];
    }
    acc[log.type].push(log);
    return acc;
  }, {});

  // Add fault manager special logs if not present (though usually they come from API or static list in parent)
  // The parent `SystemLogs` was adding them if missing. I should probably move that logic here or keep it in parent.
  // In the original code, `logFiles` state is populated from API. Then `groupedLogs` logic adds fault manager logs if missing.
  // It's better if `logFiles` passed to this component already contains everything or this component handles the static additions.
  // I will keep the logic here to match original behavior if `logFiles` doesn't have them.
  if (!groupedLogs["fault-manager"]) {
    groupedLogs["fault-manager"] = [
      {
        name: "faults",
        displayName: "Faults",
        type: "fault-manager",
        subtype: "faults",
      },
      {
        name: "errors",
        displayName: "Errors",
        type: "fault-manager",
        subtype: "errors",
      },
      {
        name: "info",
        displayName: "Info",
        type: "fault-manager",
        subtype: "info",
      },
      {
        name: "info-hival",
        displayName: "Info (High Value)",
        type: "fault-manager",
        subtype: "info-hival",
      },
    ];
  }

  return (
    <div className="box">
      <h4 className="title is-6 mb-3">
        <span className="icon-text">
          <span className="icon">
            <i className="fas fa-folder-open" />
          </span>
          <span>Log Files</span>
        </span>
      </h4>

      {loading ? (
        <div className="has-text-centered p-4">
          <span className="icon">
            <i className="fas fa-spinner fa-spin" />
          </span>
          <p className="mt-2 is-size-7">Loading...</p>
        </div>
      ) : (
        <div className="menu">
          {Object.entries(groupedLogs).map(([type, logs]) => (
            <div key={type}>
              <p className="menu-label">
                {type
                  .replace(/-/g, " ")
                  .replace(/\b\w/g, (l) => l.toUpperCase())}{" "}
                Logs
              </p>
              <ul className="menu-list">
                {logs.map((log) => (
                  <li key={log.name}>
                    <a
                      className={
                        selectedLog?.name === log.name ? "is-active" : ""
                      }
                      onClick={(e) => {
                        e.preventDefault();
                        onLogSelect(log);
                      }}
                      href={`#log-${log.name}`}
                    >
                      <span className="icon">
                        <i className={getLogIcon(log.type)} />
                      </span>
                      <span>{log.displayName || log.name}</span>
                      {log.sizeFormatted && (
                        <span className="tag is-small is-light ml-auto">
                          {log.sizeFormatted}
                        </span>
                      )}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

LogFileExplorer.propTypes = {
  logFiles: PropTypes.array.isRequired,
  selectedLog: PropTypes.object,
  onLogSelect: PropTypes.func.isRequired,
  loading: PropTypes.bool.isRequired,
};

export default LogFileExplorer;
