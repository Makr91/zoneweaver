import PropTypes from "prop-types";
import { useState } from "react";

const EtherstubTable = ({ etherstubs, loading, onDelete, onViewDetails }) => {
  const [deleteLoading, setDeleteLoading] = useState({});

  const handleDelete = async (etherstub) => {
    const key = etherstub.name || etherstub.link;
    setDeleteLoading((prev) => ({ ...prev, [key]: true }));

    try {
      await onDelete(etherstub.name || etherstub.link);
    } finally {
      setDeleteLoading((prev) => ({ ...prev, [key]: false }));
    }
  };

  if (loading && etherstubs.length === 0) {
    return (
      <div className="has-text-centered p-4">
        <span className="icon is-large">
          <i className="fas fa-spinner fa-spin fa-2x" />
        </span>
        <p className="mt-2">Loading etherstubs...</p>
      </div>
    );
  }

  if (etherstubs.length === 0) {
    return (
      <div className="has-text-centered p-4">
        <span className="icon is-large has-text-grey">
          <i className="fas fa-ethernet fa-2x" />
        </span>
        <p className="mt-2 has-text-grey">No etherstubs found</p>
      </div>
    );
  }

  return (
    <div className="table-container">
      <table className="table is-fullwidth is-hoverable is-striped">
        <thead>
          <tr>
            <th>Etherstub Name</th>
            <th>Class</th>
            <th>State</th>
            <th>Over</th>
            <th>VNICs</th>
            <th width="120">Actions</th>
          </tr>
        </thead>
        <tbody>
          {etherstubs.map((etherstub, index) => {
            const etherstubName = etherstub.name || etherstub.link;
            const isDeleting = deleteLoading[etherstubName];

            return (
              <tr key={etherstubName || index}>
                <td>
                  <strong className="is-family-monospace">
                    {etherstubName}
                  </strong>
                </td>
                <td>
                  <span className="tag is-info is-small">
                    {etherstub.class || "etherstub"}
                  </span>
                </td>
                <td>
                  <span className="tag is-success is-small">
                    {etherstub.state || "up"}
                  </span>
                </td>
                <td>
                  <span className="is-size-7">{etherstub.over || "--"}</span>
                </td>
                <td>
                  <span className="is-size-7">
                    {etherstub.vnics
                      ? `${etherstub.vnics.length} VNICs`
                      : "0 VNICs"}
                  </span>
                </td>
                <td>
                  <div className="buttons are-small">
                    {/* View Details Button */}
                    <button
                      className="button"
                      onClick={() => onViewDetails(etherstub)}
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
                      onClick={() => handleDelete(etherstub)}
                      disabled={loading || isDeleting}
                      title="Delete Etherstub"
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

EtherstubTable.propTypes = {
  etherstubs: PropTypes.array.isRequired,
  loading: PropTypes.bool.isRequired,
  onDelete: PropTypes.func.isRequired,
  onViewDetails: PropTypes.func.isRequired,
};

export default EtherstubTable;
