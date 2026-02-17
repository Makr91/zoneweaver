import PropTypes from "prop-types";

import { ContentModal } from "../common";

const ServiceDetailsModal = ({ service, onClose }) => {
  const formatDetails = (details) => {
    if (!details) {
      return [];
    }

    // Convert details object to array of key-value pairs for display
    return Object.entries(details).map(([key, value]) => ({
      label: key.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
      value:
        typeof value === "object"
          ? JSON.stringify(value, null, 2)
          : String(value),
    }));
  };

  const detailsArray = formatDetails(service.details);

  const getStateTagClass = (state) => {
    switch (state) {
      case "online":
        return "is-success";
      case "disabled":
        return "is-grey";
      case "offline":
        return "is-danger";
      case "legacy_run":
        return "is-info";
      case "maintenance":
        return "is-warning";
      default:
        return "is-light";
    }
  };

  return (
    <ContentModal
      isOpen
      onClose={onClose}
      title="Service Details"
      icon="fas fa-cogs"
    >
      {/* Service Basic Info */}
      <div className="box mb-4">
        <h3 className="title is-6">Basic Information</h3>
        <div className="table-container">
          <table className="table is-fullwidth">
            <tbody>
              <tr>
                <td>
                  <strong>FMRI</strong>
                </td>
                <td className="is-family-monospace">{service.fmri}</td>
              </tr>
              <tr>
                <td>
                  <strong>State</strong>
                </td>
                <td>
                  <span className={`tag ${getStateTagClass(service.state)}`}>
                    {service.state}
                  </span>
                </td>
              </tr>
              <tr>
                <td>
                  <strong>Start Time</strong>
                </td>
                <td>{service.stime || "N/A"}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Detailed Information */}
      {detailsArray.length > 0 && (
        <div className="box">
          <h3 className="title is-6">Detailed Information</h3>
          <div className="table-container">
            <table className="table is-fullwidth">
              <tbody>
                {detailsArray.map((detail) => (
                  <tr key={detail.label}>
                    <td>
                      <strong>{detail.label}</strong>
                    </td>
                    <td>
                      {detail.value.includes("\n") ? (
                        <pre className="is-size-7 p-2">{detail.value}</pre>
                      ) : (
                        <span className="is-family-monospace is-size-7">
                          {detail.value}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Show message if no details available */}
      {detailsArray.length === 0 && (
        <div className="notification is-info">
          <p>No detailed information available for this service.</p>
        </div>
      )}
    </ContentModal>
  );
};

ServiceDetailsModal.propTypes = {
  service: PropTypes.shape({
    fmri: PropTypes.string,
    state: PropTypes.string,
    stime: PropTypes.string,
    details: PropTypes.object,
  }).isRequired,
  onClose: PropTypes.func.isRequired,
};

export default ServiceDetailsModal;
