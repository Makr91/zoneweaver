import { useState } from "react";
import PropTypes from "prop-types";

const BridgeTable = ({ bridges, loading, onDelete, onViewDetails }) => {
  const [deleteLoading, setDeleteLoading] = useState({});

  const handleDelete = async (bridge) => {
    const key = bridge.name;
    setDeleteLoading((prev) => ({ ...prev, [key]: true }));

    try {
      await onDelete(bridge.name);
    } finally {
      setDeleteLoading((prev) => ({ ...prev, [key]: false }));
    }
  };

  const getProtectionTag = (protection) => {
    switch (protection?.toLowerCase()) {
      case "stp":
        return <span className="tag is-success is-small">STP</span>;
      case "rstp":
        return <span className="tag is-info is-small">RSTP</span>;
      case "none":
        return <span className="tag is-grey is-small">None</span>;
      default:
        return (
          <span className="tag is-grey is-small">
            {protection || "Unknown"}
          </span>
        );
    }
  };

  const formatLinks = (links) => {
    if (!links || !Array.isArray(links)) {
      return "N/A";
    }
    if (links.length === 0) {
      return "None";
    }
    if (links.length <= 2) {
      return links.join(", ");
    }
    return `${links.slice(0, 2).join(", ")} +${links.length - 2}`;
  };

  if (loading && bridges.length === 0) {
    return (
      <div className="has-text-centered p-4">
        <span className="icon is-large">
          <i className="fas fa-spinner fa-spin fa-2x" />
        </span>
        <p className="mt-2">Loading bridges...</p>
      </div>
    );
  }

  if (bridges.length === 0) {
    return (
      <div className="has-text-centered p-4">
        <span className="icon is-large has-text-grey">
          <i className="fas fa-bridge-water fa-2x" />
        </span>
        <p className="mt-2 has-text-grey">No bridges found</p>
      </div>
    );
  }

  return (
    <div className="table-container">
      <table className="table is-fullwidth is-hoverable is-striped">
        <thead>
          <tr>
            <th>Bridge Name</th>
            <th>Protection</th>
            <th>Priority</th>
            <th>Member Links</th>
            <th>Max Age</th>
            <th>Hello Time</th>
            <th>Forward Delay</th>
            <th width="120">Actions</th>
          </tr>
        </thead>
        <tbody>
          {bridges.map((bridge, index) => {
            const isDeleting = deleteLoading[bridge.name];

            return (
              <tr key={bridge.name || index}>
                <td>
                  <strong className="is-family-monospace">{bridge.name}</strong>
                </td>
                <td>{getProtectionTag(bridge.protection)}</td>
                <td>
                  <span className="tag is-grey is-small">
                    {bridge.priority !== undefined ? bridge.priority : "N/A"}
                  </span>
                </td>
                <td>
                  <span
                    className="is-family-monospace is-size-7"
                    title={bridge.links?.join(", ")}
                  >
                    {formatLinks(bridge.links)}
                  </span>
                  {bridge.links && bridge.links.length > 0 && (
                    <div className="is-size-7 has-text-grey">
                      {bridge.links.length} link
                      {bridge.links.length !== 1 ? "s" : ""}
                    </div>
                  )}
                </td>
                <td>
                  <span className="is-size-7">
                    {bridge.max_age !== undefined
                      ? `${bridge.max_age}s`
                      : "N/A"}
                  </span>
                </td>
                <td>
                  <span className="is-size-7">
                    {bridge.hello_time !== undefined
                      ? `${bridge.hello_time}s`
                      : "N/A"}
                  </span>
                </td>
                <td>
                  <span className="is-size-7">
                    {bridge.forward_delay !== undefined
                      ? `${bridge.forward_delay}s`
                      : "N/A"}
                  </span>
                </td>
                <td>
                  <div className="buttons are-small">
                    {/* View Details Button */}
                    <button
                      className="button"
                      onClick={() => onViewDetails(bridge)}
                      disabled={loading || isDeleting}
                      title="View Details"
                    >
                      <span className="icon is-small">
                        <i className="fas fa-info-circle" />
                      </span>
                    </button>

                    {/* Delete Button */}
                    <button
                      className={`button is-danger ${isDeleting ? "is-loading" : ""}`}
                      onClick={() => handleDelete(bridge)}
                      disabled={loading || isDeleting}
                      title="Delete Bridge"
                    >
                      <span className="icon is-small">
                        <i className="fas fa-trash" />
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

BridgeTable.propTypes = {
  bridges: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string.isRequired,
      protection: PropTypes.string,
      priority: PropTypes.number,
      links: PropTypes.arrayOf(PropTypes.string),
      max_age: PropTypes.number,
      hello_time: PropTypes.number,
      forward_delay: PropTypes.number,
    })
  ).isRequired,
  loading: PropTypes.bool.isRequired,
  onDelete: PropTypes.func.isRequired,
  onViewDetails: PropTypes.func.isRequired,
};

export default BridgeTable;
