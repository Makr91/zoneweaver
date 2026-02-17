import { useState } from "react";

const VlanTable = ({ vlans, loading, onDelete, onViewDetails }) => {
  const [deleteLoading, setDeleteLoading] = useState({});

  const handleDelete = async (vlan) => {
    const key = vlan.link;
    setDeleteLoading((prev) => ({ ...prev, [key]: true }));

    try {
      await onDelete(vlan.link);
    } finally {
      setDeleteLoading((prev) => ({ ...prev, [key]: false }));
    }
  };

  const getStateIcon = (state) => {
    switch (state?.toLowerCase()) {
      case "up":
        return (
          <span className="icon has-text-success">
            <i className="fas fa-check-circle" />
          </span>
        );
      case "down":
        return (
          <span className="icon has-text-danger">
            <i className="fas fa-times-circle" />
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

  const getStateTag = (state) => {
    switch (state?.toLowerCase()) {
      case "up":
        return <span className="tag is-success is-small">{state}</span>;
      case "down":
        return <span className="tag is-danger is-small">{state}</span>;
      default:
        return (
          <span className="tag is-grey is-small">{state || "Unknown"}</span>
        );
    }
  };

  const getVlanTag = (vid) => {
    if (vid === undefined || vid === null || vid === "") {
      return <span className="tag is-dark is-small">No VID</span>;
    }

    // Assign colors based on VLAN ID to make each VLAN visually distinct
    const colors = [
      "is-primary", // Blue
      "is-info", // Cyan
      "is-success", // Green
      "is-warning", // Yellow
      "is-danger", // Red
      "is-link", // Blue-ish
      "is-primary", // Repeat for more VLANs
      "is-info",
      "is-success",
    ];

    const colorIndex = parseInt(vid) % colors.length;
    const colorClass = colors[colorIndex];

    return <span className={`tag ${colorClass} is-small`}>{vid}</span>;
  };

  if (loading && vlans.length === 0) {
    return (
      <div className="has-text-centered p-4">
        <span className="icon is-large">
          <i className="fas fa-spinner fa-spin fa-2x" />
        </span>
        <p className="mt-2">Loading VLANs...</p>
      </div>
    );
  }

  if (vlans.length === 0) {
    return (
      <div className="has-text-centered p-4">
        <span className="icon is-large has-text-grey">
          <i className="fas fa-tags fa-2x" />
        </span>
        <p className="mt-2 has-text-grey">No VLANs found</p>
      </div>
    );
  }

  return (
    <div className="table-container">
      <table className="table is-fullwidth is-hoverable is-striped">
        <thead>
          <tr>
            <th>VLAN Name</th>
            <th>VLAN ID</th>
            <th>Physical Link</th>
            <th>State</th>
            <th>MTU</th>
            <th>Flags</th>
            <th width="120">Actions</th>
          </tr>
        </thead>
        <tbody>
          {vlans.map((vlan, index) => {
            const isDeleting = deleteLoading[vlan.link];

            return (
              <tr key={vlan.link || index}>
                <td>
                  <div className="is-flex is-align-items-center">
                    {getStateIcon(vlan.state)}
                    <span className="ml-2">
                      <strong className="is-family-monospace">
                        {vlan.link}
                      </strong>
                    </span>
                  </div>
                </td>
                <td>{getVlanTag(vlan.vid)}</td>
                <td>
                  <span className="is-family-monospace">
                    {vlan.over || "N/A"}
                  </span>
                </td>
                <td>{getStateTag(vlan.state)}</td>
                <td>
                  <span className="is-size-7">{vlan.mtu || "1500"}</span>
                </td>
                <td>
                  <span className="is-size-7 has-text-grey">
                    {vlan.flags || "-"}
                  </span>
                </td>
                <td>
                  <div className="buttons are-small">
                    {/* View Details Button */}
                    <button
                      className="button"
                      onClick={() => onViewDetails(vlan)}
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
                      onClick={() => handleDelete(vlan)}
                      disabled={loading || isDeleting}
                      title="Delete VLAN"
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

export default VlanTable;
