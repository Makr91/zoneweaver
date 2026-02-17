import { useState } from "react";

const ProcessTable = ({
  processes,
  loading,
  onViewDetails,
  onKillProcess,
  onSendSignal,
  showDetailedView,
}) => {
  const [sortField, setSortField] = useState("pid");
  const [sortDirection, setSortDirection] = useState("asc");

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const getSortedProcesses = () =>
    [...processes].sort((a, b) => {
      let aVal;
      let bVal;

      switch (sortField) {
        case "pid":
          aVal = parseInt(a.pid);
          bVal = parseInt(b.pid);
          break;
        case "cpu_percent":
          aVal = parseFloat(a.cpu_percent) || 0;
          bVal = parseFloat(b.cpu_percent) || 0;
          break;
        case "rss":
          // Convert memory format like "7434M" to MB
          aVal = parseMemorySize(a.rss) || 0;
          bVal = parseMemorySize(b.rss) || 0;
          break;
        default:
          aVal = (a[sortField] || "").toString().toLowerCase();
          bVal = (b[sortField] || "").toString().toLowerCase();
      }

      if (sortDirection === "asc") {
        return aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      }
      return aVal > bVal ? -1 : aVal < bVal ? 1 : 0;
    });

  const parseMemorySize = (memStr) => {
    if (!memStr && memStr !== 0) {
      return 0;
    }

    // Convert to string to ensure we can call .match()
    const memString = String(memStr);
    const match = memString.match(/^(\d+(?:\.\d+)?)(K|M|G|T)?$/);
    if (!match) {
      // If it's just a number (bytes), convert it
      const numValue = parseFloat(memString);
      if (!isNaN(numValue)) {
        return numValue / 1024 / 1024; // Convert bytes to MB
      }
      return 0;
    }

    const value = parseFloat(match[1]);
    const unit = match[2] || "";

    switch (unit) {
      case "K":
        return value / 1024;
      case "M":
        return value;
      case "G":
        return value * 1024;
      case "T":
        return value * 1024 * 1024;
      default:
        return value / 1024 / 1024; // Assume bytes
    }
  };

  const formatMemory = (memStr) => {
    if (!memStr) {
      return "N/A";
    }
    return memStr;
  };

  const formatCPU = (cpuPercent) => {
    if (cpuPercent === null || cpuPercent === undefined) {
      return "N/A";
    }
    return `${parseFloat(cpuPercent).toFixed(1)}%`;
  };

  const getUserIcon = (username) => {
    if (username === "root") {
      return (
        <span className="icon has-text-danger">
          <i className="fas fa-user-shield" />
        </span>
      );
    }
    return (
      <span className="icon has-text-info">
        <i className="fas fa-user" />
      </span>
    );
  };

  const getZoneTag = (zone) => {
    if (zone === "global") {
      return <span className="tag is-primary is-small">{zone}</span>;
    }
    return <span className="tag is-info is-small">{zone}</span>;
  };

  const getSortIcon = (field) => {
    if (sortField !== field) {
      return <i className="fas fa-sort" />;
    }
    return sortDirection === "asc" ? (
      <i className="fas fa-sort-up" />
    ) : (
      <i className="fas fa-sort-down" />
    );
  };

  const truncateCommand = (command, maxLength = 50) => {
    if (!command) {
      return "N/A";
    }
    if (command.length <= maxLength) {
      return command;
    }
    return `${command.substring(0, maxLength)}...`;
  };

  if (loading && processes.length === 0) {
    return (
      <div className="has-text-centered p-4">
        <span className="icon is-large">
          <i className="fas fa-spinner fa-spin fa-2x" />
        </span>
        <p className="mt-2">Loading processes...</p>
      </div>
    );
  }

  if (processes.length === 0) {
    return (
      <div className="has-text-centered p-4">
        <span className="icon is-large has-text-grey">
          <i className="fas fa-tasks fa-2x" />
        </span>
        <p className="mt-2 has-text-grey">No processes found</p>
      </div>
    );
  }

  const sortedProcesses = getSortedProcesses();

  return (
    <div className="table-container">
      <table className="table is-fullwidth is-hoverable">
        <thead>
          <tr>
            <th className="is-clickable" onClick={() => handleSort("pid")}>
              <span className="is-flex is-align-items-center">
                PID
                <span className="icon is-small ml-1">{getSortIcon("pid")}</span>
              </span>
            </th>
            <th className="is-clickable" onClick={() => handleSort("username")}>
              <span className="is-flex is-align-items-center">
                User
                <span className="icon is-small ml-1">
                  {getSortIcon("username")}
                </span>
              </span>
            </th>
            <th className="is-clickable" onClick={() => handleSort("zone")}>
              <span className="is-flex is-align-items-center">
                Zone
                <span className="icon is-small ml-1">
                  {getSortIcon("zone")}
                </span>
              </span>
            </th>
            {showDetailedView && (
              <>
                <th
                  className="is-clickable"
                  onClick={() => handleSort("cpu_percent")}
                >
                  <span className="is-flex is-align-items-center">
                    CPU %
                    <span className="icon is-small ml-1">
                      {getSortIcon("cpu_percent")}
                    </span>
                  </span>
                </th>
                <th className="is-clickable" onClick={() => handleSort("rss")}>
                  <span className="is-flex is-align-items-center">
                    Memory
                    <span className="icon is-small ml-1">
                      {getSortIcon("rss")}
                    </span>
                  </span>
                </th>
              </>
            )}
            <th className="is-clickable" onClick={() => handleSort("command")}>
              <span className="is-flex is-align-items-center">
                Command
                <span className="icon is-small ml-1">
                  {getSortIcon("command")}
                </span>
              </span>
            </th>
            <th width="200">Actions</th>
          </tr>
        </thead>
        <tbody>
          {sortedProcesses.map((process, index) => (
            <tr key={process.pid || index}>
              <td>
                <span className="is-family-monospace has-text-weight-bold">
                  {process.pid}
                </span>
                {process.ppid && (
                  <div className="is-size-7 has-text-grey">
                    PPID: {process.ppid}
                  </div>
                )}
              </td>
              <td>
                <div className="is-flex is-align-items-center">
                  {getUserIcon(process.username)}
                  <span className="ml-2">{process.username || "N/A"}</span>
                </div>
              </td>
              <td>{getZoneTag(process.zone || "N/A")}</td>
              {showDetailedView && (
                <>
                  <td>
                    <span className="is-family-monospace">
                      {formatCPU(process.cpu_percent)}
                    </span>
                  </td>
                  <td>
                    <span className="is-family-monospace">
                      {formatMemory(process.rss)}
                    </span>
                  </td>
                </>
              )}
              <td>
                <span
                  className="is-family-monospace is-size-7"
                  title={process.command}
                >
                  {truncateCommand(process.command)}
                </span>
              </td>
              <td>
                <div className="buttons are-small">
                  {/* View Details Button */}
                  <button
                    className="button is-info"
                    onClick={() => onViewDetails(process)}
                    disabled={loading}
                    title="View Process Details"
                  >
                    <span className="icon is-small">
                      <i className="fas fa-info-circle" />
                    </span>
                  </button>

                  {/* Send Signal Button */}
                  <button
                    className="button is-warning"
                    onClick={() => onSendSignal(process)}
                    disabled={loading}
                    title="Send Signal"
                  >
                    <span className="icon is-small">
                      <i className="fas fa-bolt" />
                    </span>
                  </button>

                  {/* Kill Process Button */}
                  <button
                    className="button is-danger"
                    onClick={() => onKillProcess(process)}
                    disabled={loading}
                    title="Kill Process"
                  >
                    <span className="icon is-small">
                      <i className="fas fa-times" />
                    </span>
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ProcessTable;
