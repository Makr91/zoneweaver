import PropTypes from "prop-types";

const TimeSyncServiceInfo = ({ statusInfo }) => {
  const getServiceStatusBadge = (service, status, available) => {
    if (service === "none" || !available) {
      return <span className="tag is-grey">Not Available</span>;
    }

    let serviceLabel = service.toUpperCase();
    if (service === "ntp") {
      serviceLabel = "NTP";
    } else if (service === "chrony") {
      serviceLabel = "Chrony";
    }

    switch (status) {
      case "available":
        return <span className="tag is-success">{serviceLabel} - Online</span>;
      case "disabled":
        return (
          <span className="tag is-warning">{serviceLabel} - Disabled</span>
        );
      case "unavailable":
        return (
          <span className="tag is-danger">{serviceLabel} - Unavailable</span>
        );
      default:
        return <span className="tag is-grey">{serviceLabel} - Unknown</span>;
    }
  };

  return (
    <div className="box mb-4">
      <h3 className="title is-6">Service Information</h3>
      <div className="table-container">
        <table className="table is-fullwidth">
          <tbody>
            <tr>
              <td>
                <strong>Service Type</strong>
              </td>
              <td>
                {getServiceStatusBadge(
                  statusInfo.service,
                  statusInfo.status,
                  statusInfo.available
                )}
              </td>
            </tr>
            <tr>
              <td>
                <strong>Current Timezone</strong>
              </td>
              <td className="is-family-monospace">
                {statusInfo.timezone || "Unknown"}
              </td>
            </tr>
            <tr>
              <td>
                <strong>Last Status Check</strong>
              </td>
              <td>
                {statusInfo.last_checked
                  ? new Date(statusInfo.last_checked).toLocaleString()
                  : "Unknown"}
              </td>
            </tr>
            {statusInfo.service_details && (
              <>
                <tr>
                  <td>
                    <strong>Service State</strong>
                  </td>
                  <td className="is-family-monospace">
                    {statusInfo.service_details.state || "Unknown"}
                  </td>
                </tr>
                <tr>
                  <td>
                    <strong>Service FMRI</strong>
                  </td>
                  <td className="is-family-monospace">
                    {statusInfo.service_details.fmri || "Unknown"}
                  </td>
                </tr>
              </>
            )}
          </tbody>
        </table>
      </div>

      {!statusInfo.available && (
        <div className="notification is-warning">
          <p>
            <strong>No Time Synchronization Service Available</strong>
            <br />
            Neither NTP nor Chrony services are available on this system. You
            may need to install and configure a time synchronization service.
          </p>
        </div>
      )}
    </div>
  );
};

TimeSyncServiceInfo.propTypes = {
  statusInfo: PropTypes.shape({
    service: PropTypes.string,
    status: PropTypes.string,
    available: PropTypes.bool,
    timezone: PropTypes.string,
    last_checked: PropTypes.string,
    service_details: PropTypes.shape({
      state: PropTypes.string,
      fmri: PropTypes.string,
    }),
  }).isRequired,
};

export default TimeSyncServiceInfo;
