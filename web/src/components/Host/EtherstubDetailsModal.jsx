import PropTypes from "prop-types";

import { ContentModal } from "../common";

const EtherstubDetailsModal = ({ etherstub, etherstubDetails, onClose }) => {
  const formatValue = (value) => {
    if (value === null || value === undefined) {
      return "N/A";
    }
    if (typeof value === "boolean") {
      return value ? "Yes" : "No";
    }
    if (typeof value === "object") {
      return JSON.stringify(value, null, 2);
    }
    return String(value);
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

  const etherstubName = etherstub.name || etherstub.link;

  return (
    <ContentModal
      isOpen
      onClose={onClose}
      title="Etherstub Details"
      icon="fas fa-network-wired"
    >
      <h5 className="title is-6">Basic Information</h5>
      <div className="table-container">
        <table className="table is-fullwidth is-striped">
          <tbody>
            <tr>
              <td>
                <strong>Name</strong>
              </td>
              <td>
                <span className="is-family-monospace">{etherstubName}</span>
              </td>
            </tr>
            <tr>
              <td>
                <strong>Class</strong>
              </td>
              <td>
                <span className="tag is-info is-small">
                  {etherstub.class || "etherstub"}
                </span>
              </td>
            </tr>
            <tr>
              <td>
                <strong>State</strong>
              </td>
              <td>{getStateTag(etherstub.state)}</td>
            </tr>
            <tr>
              <td>
                <strong>MTU</strong>
              </td>
              <td>{formatValue(etherstub.mtu)}</td>
            </tr>
            <tr>
              <td>
                <strong>Over</strong>
              </td>
              <td>{formatValue(etherstub.over)}</td>
            </tr>
            <tr>
              <td>
                <strong>Zone</strong>
              </td>
              <td>{formatValue(etherstub.zone)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {etherstubDetails &&
        etherstubDetails.vnics &&
        etherstubDetails.vnics.length > 0 && (
          <>
            <h5 className="title is-6 mt-5">Associated VNICs</h5>
            <div className="table-container">
              <table className="table is-fullwidth is-striped">
                <thead>
                  <tr>
                    <th>VNIC Name</th>
                    <th>Over</th>
                    <th>State</th>
                    <th>Zone</th>
                  </tr>
                </thead>
                <tbody>
                  {etherstubDetails.vnics.map((vnic, index) => (
                    <tr key={index}>
                      <td>
                        <span className="is-family-monospace">
                          {vnic.link || vnic.name}
                        </span>
                      </td>
                      <td>{formatValue(vnic.over)}</td>
                      <td>{getStateTag(vnic.state)}</td>
                      <td>{formatValue(vnic.zone)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

      <h5 className="title is-6 mt-5">Technical Details</h5>
      <div className="table-container">
        <table className="table is-fullwidth is-striped">
          <tbody>
            <tr>
              <td>
                <strong>MAC Address</strong>
              </td>
              <td>
                <span className="is-family-monospace">
                  {formatValue(etherstub.macaddress)}
                </span>
              </td>
            </tr>
            <tr>
              <td>
                <strong>MAC Address Type</strong>
              </td>
              <td>{formatValue(etherstub.macaddrtype)}</td>
            </tr>
            <tr>
              <td>
                <strong>VLAN ID</strong>
              </td>
              <td>{formatValue(etherstub.vid)}</td>
            </tr>
            <tr>
              <td>
                <strong>Speed</strong>
              </td>
              <td>{formatValue(etherstub.speed)}</td>
            </tr>
            <tr>
              <td>
                <strong>Media</strong>
              </td>
              <td>{formatValue(etherstub.media)}</td>
            </tr>
            <tr>
              <td>
                <strong>Duplex</strong>
              </td>
              <td>{formatValue(etherstub.duplex)}</td>
            </tr>
            <tr>
              <td>
                <strong>Device</strong>
              </td>
              <td>{formatValue(etherstub.device)}</td>
            </tr>
            <tr>
              <td>
                <strong>Bridge</strong>
              </td>
              <td>{formatValue(etherstub.bridge)}</td>
            </tr>
            <tr>
              <td>
                <strong>Pause</strong>
              </td>
              <td>{formatValue(etherstub.pause)}</td>
            </tr>
            <tr>
              <td>
                <strong>Auto</strong>
              </td>
              <td>{formatValue(etherstub.auto)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h5 className="title is-6 mt-5">Timestamps</h5>
      <div className="table-container">
        <table className="table is-fullwidth is-striped">
          <tbody>
            <tr>
              <td>
                <strong>Last Scan</strong>
              </td>
              <td>
                <span className="is-family-monospace">
                  {etherstub.scan_timestamp
                    ? new Date(etherstub.scan_timestamp).toLocaleString()
                    : "N/A"}
                </span>
              </td>
            </tr>
            <tr>
              <td>
                <strong>Created</strong>
              </td>
              <td>
                <span className="is-family-monospace">
                  {etherstub.createdAt
                    ? new Date(etherstub.createdAt).toLocaleString()
                    : "N/A"}
                </span>
              </td>
            </tr>
            <tr>
              <td>
                <strong>Updated</strong>
              </td>
              <td>
                <span className="is-family-monospace">
                  {etherstub.updatedAt
                    ? new Date(etherstub.updatedAt).toLocaleString()
                    : "N/A"}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </ContentModal>
  );
};

EtherstubDetailsModal.propTypes = {
  etherstub: PropTypes.object.isRequired,
  etherstubDetails: PropTypes.object,
  onClose: PropTypes.func.isRequired,
};

export default EtherstubDetailsModal;
