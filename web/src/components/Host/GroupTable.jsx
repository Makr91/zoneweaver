import PropTypes from "prop-types";
import { useState } from "react";

const GroupTable = ({ groups, loading, onDelete, onViewDetails }) => {
  const [actionLoading, setActionLoading] = useState({});

  const handleAction = async (group, action) => {
    const key = `${group.groupname}-${action}`;
    setActionLoading((prev) => ({ ...prev, [key]: true }));

    try {
      if (action === "delete") {
        await onDelete(group);
      } else if (action === "viewDetails") {
        onViewDetails(group);
      }
    } finally {
      setActionLoading((prev) => ({ ...prev, [key]: false }));
    }
  };

  const getGroupType = (group) => {
    if (group.gid < 100) {
      return { type: "System", class: "is-info" };
    }
    return { type: "Regular", class: "is-success" };
  };

  if (loading && groups.length === 0) {
    return (
      <div className="has-text-centered p-4">
        <span className="icon is-large">
          <i className="fas fa-spinner fa-spin fa-2x" />
        </span>
        <p className="mt-2">Loading groups...</p>
      </div>
    );
  }

  if (groups.length === 0) {
    return (
      <div className="has-text-centered p-4">
        <span className="icon is-large has-text-grey">
          <i className="fas fa-users fa-2x" />
        </span>
        <p className="mt-2 has-text-grey">No groups found</p>
      </div>
    );
  }

  return (
    <div className="table-container">
      <table className="table is-fullwidth is-hoverable">
        <thead>
          <tr>
            <th>Group Name</th>
            <th>GID</th>
            <th>Members</th>
            <th>Type</th>
            <th width="200">Actions</th>
          </tr>
        </thead>
        <tbody>
          {groups.map((group) => {
            const groupType = getGroupType(group);

            return (
              <tr key={`${group.gid}-${group.groupname}`}>
                <td>
                  <div className="is-flex is-align-items-center">
                    <span className="icon has-text-primary">
                      <i className="fas fa-users" />
                    </span>
                    <span className="ml-2">
                      <strong>{group.groupname}</strong>
                    </span>
                  </div>
                </td>
                <td>
                  <span className="is-family-monospace">{group.gid}</span>
                </td>
                <td>
                  {group.members && group.members.length > 0 ? (
                    <div className="tags">
                      {group.members.slice(0, 3).map((member) => (
                        <span key={member} className="tag is-light is-small">
                          {member}
                        </span>
                      ))}
                      {group.members.length > 3 && (
                        <span className="tag is-light is-small">
                          +{group.members.length - 3} more
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="has-text-grey is-italic">No members</span>
                  )}
                </td>
                <td>
                  <span className={`tag ${groupType.class} is-small`}>
                    {groupType.type}
                  </span>
                </td>
                <td>
                  <div className="buttons are-small">
                    {/* View Details Button */}
                    <button
                      className="button"
                      onClick={() => handleAction(group, "viewDetails")}
                      disabled={loading}
                      title="View Details"
                    >
                      <span className="icon is-small">
                        <i className="fas fa-info-circle" />
                      </span>
                    </button>

                    {/* Delete Button - only for non-system groups */}
                    {group.gid >= 100 && (
                      <button
                        className={`button is-danger ${
                          actionLoading[`${group.groupname}-delete`]
                            ? "is-loading"
                            : ""
                        }`}
                        onClick={() => handleAction(group, "delete")}
                        disabled={loading}
                        title="Delete Group"
                      >
                        <span className="icon is-small">
                          <i className="fas fa-trash" />
                        </span>
                      </button>
                    )}
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

GroupTable.propTypes = {
  groups: PropTypes.arrayOf(
    PropTypes.shape({
      groupname: PropTypes.string.isRequired,
      gid: PropTypes.number.isRequired,
      members: PropTypes.arrayOf(PropTypes.string),
    })
  ).isRequired,
  loading: PropTypes.bool.isRequired,
  onDelete: PropTypes.func.isRequired,
  onViewDetails: PropTypes.func.isRequired,
};

export default GroupTable;
