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
                  <span
                    className={`tag ${
                      service.state === "online"
                        ? "is-success"
                        : service.state === "disabled"
                          ? "is-grey"
                          : service.state === "offline"
                            ? "is-danger"
                            : service.state === "legacy_run"
                              ? "is-info"
                              : "is-light"
                    }`}
                  >
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
                {detailsArray.map((detail, index) => (
                  <tr key={index}>
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

export default ServiceDetailsModal;
