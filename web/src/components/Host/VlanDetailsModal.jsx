import PropTypes from "prop-types";

import { ContentModal } from "../common";

const VlanDetailsModal = ({ vlan, onClose }) => {
  const renderDetailRow = (label, value, monospace = false) => (
    <div className="columns is-mobile">
      <div className="column is-4">
        <strong>{label}:</strong>
      </div>
      <div className="column">
        <span className={monospace ? "is-family-monospace" : ""}>
          {value || "N/A"}
        </span>
      </div>
    </div>
  );

  const getStateTag = (state) => {
    switch (state?.toLowerCase()) {
      case "up":
        return <span className="tag is-success">{state}</span>;
      case "down":
        return <span className="tag is-danger">{state}</span>;
      default:
        return <span className="tag is-grey">{state || "Unknown"}</span>;
    }
  };

  const getVlanTag = (vid) => {
    if (vid === undefined || vid === null || vid === "") {
      return <span className="tag is-dark">No VID</span>;
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

    return <span className={`tag ${colorClass}`}>{vid}</span>;
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) {
      return "N/A";
    }
    try {
      return new Date(timestamp).toLocaleString();
    } catch {
      return timestamp;
    }
  };

  return (
    <ContentModal
      isOpen
      onClose={onClose}
      title={`VLAN Details: ${vlan.link}`}
      icon="fas fa-tags"
    >
      <div className="content">
        {/* Basic VLAN Information */}
        <div className="box">
          <h4 className="title is-6 mb-3">
            <span className="icon-text">
              <span className="icon">
                <i className="fas fa-info-circle" />
              </span>
              <span>Basic Information</span>
            </span>
          </h4>

          {renderDetailRow("VLAN Name", vlan.link, true)}

          <div className="columns is-mobile">
            <div className="column is-4">
              <strong>VLAN ID:</strong>
            </div>
            <div className="column">{getVlanTag(vlan.vid)}</div>
          </div>

          {renderDetailRow("Physical Link", vlan.over, true)}

          <div className="columns is-mobile">
            <div className="column is-4">
              <strong>State:</strong>
            </div>
            <div className="column">{getStateTag(vlan.state)}</div>
          </div>

          {renderDetailRow("Class", vlan.class)}
          {renderDetailRow("MTU", vlan.mtu || "1500")}
          {renderDetailRow("Flags", vlan.flags)}
        </div>

        {/* Technical Details */}
        {vlan.details && (
          <div className="box">
            <h4 className="title is-6 mb-3">
              <span className="icon-text">
                <span className="icon">
                  <i className="fas fa-cogs" />
                </span>
                <span>Technical Details</span>
              </span>
            </h4>

            {vlan.details.link &&
              renderDetailRow("Link Name", vlan.details.link, true)}
            {vlan.details.class &&
              renderDetailRow("Link Class", vlan.details.class)}
            {vlan.details.vid && renderDetailRow("VLAN ID", vlan.details.vid)}
            {vlan.details.over &&
              renderDetailRow("Over Link", vlan.details.over, true)}
            {vlan.details.state && (
              <div className="columns is-mobile">
                <div className="column is-4">
                  <strong>Current State:</strong>
                </div>
                <div className="column">{getStateTag(vlan.details.state)}</div>
              </div>
            )}
            {vlan.details.mtu && renderDetailRow("MTU Size", vlan.details.mtu)}
            {vlan.details.flags &&
              renderDetailRow("Interface Flags", vlan.details.flags)}
          </div>
        )}

        {/* Metadata */}
        <div className="box">
          <h4 className="title is-6 mb-3">
            <span className="icon-text">
              <span className="icon">
                <i className="fas fa-clock" />
              </span>
              <span>Metadata</span>
            </span>
          </h4>

          {vlan.scan_timestamp &&
            renderDetailRow(
              "Last Scanned",
              formatTimestamp(vlan.scan_timestamp)
            )}
          {vlan.created_at &&
            renderDetailRow("Created At", formatTimestamp(vlan.created_at))}
          {vlan.updated_at &&
            renderDetailRow("Updated At", formatTimestamp(vlan.updated_at))}

          <div className="columns is-mobile">
            <div className="column is-4">
              <strong>Data Source:</strong>
            </div>
            <div className="column">
              <span className="tag is-info is-small">
                {vlan.source || "database"}
              </span>
            </div>
          </div>
        </div>

        {/* Raw Data for Debugging */}
        {import.meta.env.MODE === "development" && (
          <div className="box">
            <h4 className="title is-6 mb-3">
              <span className="icon-text">
                <span className="icon">
                  <i className="fas fa-code" />
                </span>
                <span>Raw Data (Development)</span>
              </span>
            </h4>

            <pre className="has-background-light p-3 is-size-7">
              {JSON.stringify(vlan, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </ContentModal>
  );
};

VlanDetailsModal.propTypes = {
  vlan: PropTypes.shape({
    link: PropTypes.string,
    vid: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    over: PropTypes.string,
    state: PropTypes.string,
    class: PropTypes.string,
    mtu: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    flags: PropTypes.string,
    details: PropTypes.object,
    scan_timestamp: PropTypes.string,
    created_at: PropTypes.string,
    updated_at: PropTypes.string,
    source: PropTypes.string,
  }).isRequired,
  onClose: PropTypes.func.isRequired,
};

export default VlanDetailsModal;
