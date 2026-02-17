import { useState } from "react";

const VnicTable = ({ vnics, loading, onDelete, onViewDetails }) => {
  const [deleteLoading, setDeleteLoading] = useState({});

  const handleDelete = async (vnic) => {
    const key = vnic.link;
    setDeleteLoading((prev) => ({ ...prev, [key]: true }));

    try {
      await onDelete(vnic.link);
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

  const formatSpeed = (speed) => {
    if (!speed) {
      return "N/A";
    }
    if (speed >= 1000) {
      return `${speed / 1000}G`;
    }
    return `${speed}M`;
  };

  const formatMac = (mac) => {
    if (!mac) {
      return "N/A";
    }
    // Format MAC address with colons if not already formatted
    if (mac.includes(":")) {
      return mac;
    }
    return mac.match(/.{2}/g)?.join(":") || mac;
  };

  const getVlanTag = (vid) => {
    if (vid === undefined || vid === null || vid === "") {
      return <span className="tag is-dark is-small">No VLAN</span>;
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

  if (loading && vnics.length === 0) {
    return (
      <div className="has-text-centered p-4">
        <span className="icon is-large">
          <i className="fas fa-spinner fa-spin fa-2x" />
        </span>
        <p className="mt-2">Loading VNICs...</p>
      </div>
    );
  }

  if (vnics.length === 0) {
    return (
      <div className="has-text-centered p-4">
        <span className="icon is-large has-text-grey">
          <i className="fas fa-network-wired fa-2x" />
        </span>
        <p className="mt-2 has-text-grey">No VNICs found</p>
      </div>
    );
  }

  return (
    <div className="table-container">
      <table className="table is-fullwidth is-hoverable is-striped">
        <thead>
          <tr>
            <th>VNIC</th>
            <th>Physical Link</th>
            <th>State</th>
            <th>MAC Address</th>
            <th>VLAN</th>
            <th>Zone</th>
            <th>Speed</th>
            <th>MTU</th>
            <th width="120">Actions</th>
          </tr>
        </thead>
        <tbody>
          {vnics.map((vnic, index) => {
            const isDeleting = deleteLoading[vnic.link];

            return (
              <tr key={vnic.id || vnic.link || index}>
                <td>
                  <div className="is-flex is-align-items-center">
                    {getStateIcon(vnic.state)}
                    <span className="ml-2">
                      <strong className="is-family-monospace">
                        {vnic.link}
                      </strong>
                    </span>
                  </div>
                </td>
                <td>
                  <span className="is-family-monospace">
                    {vnic.over || "N/A"}
                  </span>
                </td>
                <td>{getStateTag(vnic.state)}</td>
                <td>
                  <span className="is-family-monospace is-size-7">
                    {formatMac(vnic.macaddress)}
                  </span>
                  {vnic.macaddrtype && (
                    <div className="is-size-7 has-text-grey">
                      {vnic.macaddrtype}
                    </div>
                  )}
                </td>
                <td>{getVlanTag(vnic.vid)}</td>
                <td>
                  <span className="is-size-7" title={vnic.zone}>
                    {vnic.zone && vnic.zone !== "--"
                      ? vnic.zone.length > 20
                        ? `${vnic.zone.substring(0, 20)}...`
                        : vnic.zone
                      : "Global"}
                  </span>
                </td>
                <td>
                  <span className="tag is-info is-small">
                    {formatSpeed(vnic.speed)}
                  </span>
                </td>
                <td>
                  <span className="is-size-7">{vnic.mtu || "N/A"}</span>
                </td>
                <td>
                  <div className="buttons are-small">
                    {/* View Details Button */}
                    <button
                      className="button"
                      onClick={() => onViewDetails(vnic)}
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
                      onClick={() => handleDelete(vnic)}
                      disabled={loading || isDeleting}
                      title="Delete VNIC"
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

export default VnicTable;
