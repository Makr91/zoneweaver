import PropTypes from "prop-types";
import { useState } from "react";

const FaultTable = ({ faults, loading, onAction, onViewDetails }) => {
  const [actionLoading, setActionLoading] = useState({});

  const handleAction = async (fault, action, fmri = null) => {
    const key = `${fault.uuid}-${action}`;
    setActionLoading((prev) => ({ ...prev, [key]: true }));

    try {
      await onAction(fault.uuid, action, fmri);
    } finally {
      setActionLoading((prev) => ({ ...prev, [key]: false }));
    }
  };

  const extractFmriFromAffects = (affects) => {
    // affects = "zfs://pool=Array-0 faulted but still in service"
    // Extract just the FMRI part before the status
    if (!affects) {
      return null;
    }
    return affects.split(/\s+/)[0]; // Returns "zfs://pool=Array-0"
  };

  const getSeverityIcon = (severity) => {
    switch (severity.toLowerCase()) {
      case "critical":
        return (
          <span className="icon has-text-danger">
            <i className="fas fa-exclamation-circle" />
          </span>
        );
      case "major":
        return (
          <span className="icon has-text-warning">
            <i className="fas fa-exclamation-triangle" />
          </span>
        );
      case "minor":
        return (
          <span className="icon has-text-info">
            <i className="fas fa-info-circle" />
          </span>
        );
      default:
        return (
          <span className="icon has-text-grey">
            <i className="fas fa-question-circle" />
          </span>
        );
    }
  };

  const getSeverityTag = (severity) => {
    switch (severity.toLowerCase()) {
      case "critical":
        return <span className="tag is-danger is-small">{severity}</span>;
      case "major":
        return <span className="tag is-warning is-small">{severity}</span>;
      case "minor":
        return <span className="tag is-info is-small">{severity}</span>;
      default:
        return <span className="tag is-light is-small">{severity}</span>;
    }
  };

  const getAvailableActions = () =>
    // Standard fault management actions
    [
      {
        key: "acquit",
        label: "Acquit",
        icon: "fa-check",
        class: "is-success",
        requiresConfirm: true,
      },
      {
        key: "repaired",
        label: "Mark Repaired",
        icon: "fa-wrench",
        class: "is-info",
        requiresConfirm: true,
      },
      {
        key: "replaced",
        label: "Mark Replaced",
        icon: "fa-exchange-alt",
        class: "is-warning",
        requiresConfirm: true,
      },
    ];
  const getFaultClass = (msgId) => {
    // Extract readable fault class from message ID
    if (msgId.startsWith("ZFS-")) {
      return "ZFS";
    }
    if (msgId.startsWith("FMD-")) {
      return "FMD";
    }
    if (msgId.startsWith("CPU-")) {
      return "CPU";
    }
    if (msgId.startsWith("MEM-")) {
      return "Memory";
    }
    return msgId.split("-")[0] || "Unknown";
  };

  if (loading && faults.length === 0) {
    return (
      <div className="has-text-centered p-4">
        <span className="icon is-large">
          <i className="fas fa-spinner fa-spin fa-2x" />
        </span>
        <p className="mt-2">Loading faults...</p>
      </div>
    );
  }

  if (faults.length === 0) {
    return (
      <div className="has-text-centered p-4">
        <span className="icon is-large has-text-success">
          <i className="fas fa-check-circle fa-2x" />
        </span>
        <p className="mt-2 has-text-success">
          <strong>No system faults found</strong>
        </p>
        <p className="is-size-7 has-text-grey">System is operating normally</p>
      </div>
    );
  }

  return (
    <div className="table-container">
      <table className="table is-fullwidth is-hoverable">
        <thead>
          <tr>
            <th>Time</th>
            <th>Severity</th>
            <th>Class</th>
            <th>Message ID</th>
            <th>UUID</th>
            <th width="280">Actions</th>
          </tr>
        </thead>
        <tbody>
          {faults.map((fault, index) => {
            const availableActions = getAvailableActions();

            return (
              <tr key={fault.uuid || index}>
                <td>
                  <span className="is-size-7">{fault.time || "N/A"}</span>
                </td>
                <td>
                  <div className="is-flex is-align-items-center">
                    {getSeverityIcon(fault.severity)}
                    <span className="ml-2">
                      {getSeverityTag(fault.severity)}
                    </span>
                  </div>
                </td>
                <td>
                  <span className="tag is-light is-small">
                    {getFaultClass(fault.msgId)}
                  </span>
                </td>
                <td>
                  <span className="is-family-monospace is-size-7 has-text-weight-semibold">
                    {fault.msgId}
                  </span>
                </td>
                <td>
                  <span
                    className="is-family-monospace is-size-7"
                    title={fault.uuid}
                  >
                    {fault.uuid ? `${fault.uuid.substring(0, 8)}...` : "N/A"}
                  </span>
                </td>
                <td>
                  <div className="buttons are-small">
                    {/* Action Buttons */}
                    {availableActions.map((action) => {
                      const key = `${fault.uuid}-${action.key}`;
                      const isLoading = actionLoading[key];

                      return (
                        <button
                          key={action.key}
                          className={`button ${action.class} ${isLoading ? "is-loading" : ""}`}
                          onClick={() => {
                            if (action.requiresConfirm) {
                              if (
                                window.confirm(
                                  `Are you sure you want to ${action.label.toLowerCase()} this fault?`
                                )
                              ) {
                                // Extract real FMRI from affects field
                                const fmri = extractFmriFromAffects(
                                  fault.details?.affects
                                );
                                handleAction(fault, action.key, fmri);
                              }
                            } else {
                              const fmri = extractFmriFromAffects(
                                fault.details?.affects
                              );
                              handleAction(fault, action.key, fmri);
                            }
                          }}
                          disabled={loading || isLoading}
                          title={action.label}
                        >
                          <span className="icon is-small">
                            <i className={`fas ${action.icon}`} />
                          </span>
                        </button>
                      );
                    })}

                    {/* View Details Button */}
                    <button
                      className="button"
                      onClick={() => onViewDetails(fault)}
                      disabled={loading}
                      title="View Details"
                    >
                      <span className="icon is-small">
                        <i className="fas fa-info-circle" />
                      </span>
                    </button>
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

FaultTable.propTypes = {
  faults: PropTypes.array.isRequired,
  loading: PropTypes.bool.isRequired,
  onAction: PropTypes.func.isRequired,
  onViewDetails: PropTypes.func.isRequired,
};

export default FaultTable;
