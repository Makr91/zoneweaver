import { useState } from "react";
import PropTypes from "prop-types";

const BootEnvironmentTable = ({
  bootEnvironments,
  loading,
  onActivate,
  onMount,
  onUnmount,
  onDelete,
}) => {
  const [actionLoading, setActionLoading] = useState({});

  const handleAction = async (be, action) => {
    const key = `${be.name}-${action}`;
    setActionLoading((prev) => ({ ...prev, [key]: true }));

    try {
      if (action === "activate") {
        await onActivate(be);
      } else if (action === "mount") {
        await onMount(be);
      } else if (action === "unmount") {
        await onUnmount(be);
      } else if (action === "delete") {
        await onDelete(be);
      }
    } finally {
      setActionLoading((prev) => ({ ...prev, [key]: false }));
    }
  };

  const getActiveStatusBadge = (be) => {
    if (be.is_active_now && be.is_active_on_reboot) {
      return <span className="tag is-success is-small">NR</span>;
    }
    if (be.is_active_now) {
      return <span className="tag is-success is-small">N</span>;
    }
    if (be.is_active_on_reboot) {
      return <span className="tag is-info is-small">R</span>;
    }
    return <span className="tag is-grey is-small">-</span>;
  };

  const getActiveIcon = (be) => {
    if (be.is_active_now && be.is_active_on_reboot) {
      return (
        <span className="icon has-text-success">
          <i className="fas fa-check-double" />
        </span>
      );
    }
    if (be.is_active_now) {
      return (
        <span className="icon has-text-success">
          <i className="fas fa-check-circle" />
        </span>
      );
    }
    if (be.is_active_on_reboot) {
      return (
        <span className="icon has-text-info">
          <i className="fas fa-clock" />
        </span>
      );
    }
    return (
      <span className="icon has-text-grey">
        <i className="fas fa-circle" />
      </span>
    );
  };

  const getPolicyTag = (policy) => {
    switch (policy?.toLowerCase()) {
      case "static":
        return <span className="tag is-info is-small">Static</span>;
      case "dynamic":
        return <span className="tag is-warning is-small">Dynamic</span>;
      default:
        return (
          <span className="tag is-grey is-small">{policy || "Unknown"}</span>
        );
    }
  };

  const getAvailableActions = (be) => {
    const actions = [];

    // Can't activate the currently active BE
    if (!be.is_active_on_reboot) {
      actions.push({
        key: "activate",
        label: "Activate",
        icon: "fa-power-off",
        class: "has-background-success-dark has-text-success-light",
      });
    }

    // Mount/Unmount actions based on current state
    if (be.mountpoint === "-" || !be.mountpoint) {
      actions.push({
        key: "mount",
        label: "Mount",
        icon: "fa-folder-open",
        class: "has-background-info-dark has-text-info-light",
      });
    } else {
      actions.push({
        key: "unmount",
        label: "Unmount",
        icon: "fa-folder",
        class: "has-background-warning-dark has-text-warning-light",
      });
    }

    // Can't delete the currently active BE
    if (!be.is_active_now && !be.is_active_on_reboot) {
      actions.push({
        key: "delete",
        label: "Delete",
        icon: "fa-trash",
        class: "has-background-danger-dark has-text-danger-light",
      });
    }

    return actions;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) {
      return "N/A";
    }
    try {
      // Handle various date formats from OmniOS
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) {
        // Try parsing as YYYY-MM-DD HH:MM format
        const parts = dateStr.match(/(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2})/);
        if (parts) {
          return `${parts[1]}-${parts[2]}-${parts[3]} ${parts[4]}:${parts[5]}`;
        }
        return dateStr; // Return as-is if we can't parse it
      }
      return date.toLocaleString();
    } catch (err) {
      return dateStr;
    }
  };

  if (loading && bootEnvironments.length === 0) {
    return (
      <div className="has-text-centered p-4">
        <span className="icon is-large">
          <i className="fas fa-spinner fa-spin fa-2x" />
        </span>
        <p className="mt-2">Loading boot environments...</p>
      </div>
    );
  }

  if (bootEnvironments.length === 0) {
    return (
      <div className="has-text-centered p-4">
        <span className="icon is-large has-text-grey">
          <i className="fas fa-layer-group fa-2x" />
        </span>
        <p className="mt-2 has-text-grey">No boot environments found</p>
      </div>
    );
  }

  return (
    <div className="table-container">
      <table className="table is-fullwidth is-hoverable is-striped">
        <thead>
          <tr>
            <th>Boot Environment</th>
            <th>Active Status</th>
            <th>Mountpoint</th>
            <th>Space Used</th>
            <th>Policy</th>
            <th>Created</th>
            <th width="200">Actions</th>
          </tr>
        </thead>
        <tbody>
          {bootEnvironments.map((be, index) => {
            const availableActions = getAvailableActions(be);

            return (
              <tr key={be.name || index}>
                <td>
                  <div className="is-flex is-align-items-center">
                    {getActiveIcon(be)}
                    <span className="ml-2">
                      <strong className="is-family-monospace">{be.name}</strong>
                      {be.is_temporary && (
                        <span className="tag is-warning is-small ml-2">
                          Temporary
                        </span>
                      )}
                    </span>
                  </div>
                </td>
                <td>
                  <div className="is-flex is-align-items-center">
                    {getActiveStatusBadge(be)}
                    <span className="ml-2 is-size-7">
                      {be.is_active_now &&
                        be.is_active_on_reboot &&
                        "Active + Reboot"}
                      {be.is_active_now &&
                        !be.is_active_on_reboot &&
                        "Active Now"}
                      {!be.is_active_now &&
                        be.is_active_on_reboot &&
                        "Active on Reboot"}
                      {!be.is_active_now &&
                        !be.is_active_on_reboot &&
                        "Inactive"}
                    </span>
                  </div>
                </td>
                <td>
                  <span className="is-family-monospace is-size-7">
                    {be.mountpoint === "-" ? "Not Mounted" : be.mountpoint}
                  </span>
                </td>
                <td>
                  <span className="is-size-7">{be.space || "N/A"}</span>
                </td>
                <td>{getPolicyTag(be.policy)}</td>
                <td>
                  <span className="is-size-7">{formatDate(be.created)}</span>
                </td>
                <td>
                  <div className="buttons are-small">
                    {/* Action Buttons */}
                    {availableActions.map((action) => {
                      const key = `${be.name}-${action.key}`;
                      const isLoading = actionLoading[key];

                      return (
                        <button
                          key={action.key}
                          className={`button ${action.class} ${isLoading ? "is-loading" : ""}`}
                          onClick={() => handleAction(be, action.key)}
                          disabled={loading || isLoading}
                          title={action.label}
                        >
                          <span className="icon is-small">
                            <i className={`fas ${action.icon}`} />
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

BootEnvironmentTable.propTypes = {
  bootEnvironments: PropTypes.array.isRequired,
  loading: PropTypes.bool.isRequired,
  onActivate: PropTypes.func.isRequired,
  onMount: PropTypes.func.isRequired,
  onUnmount: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
};

export default BootEnvironmentTable;
