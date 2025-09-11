import React, { useState } from "react";

const RoleTable = ({ roles, loading, onDelete, onViewDetails }) => {
  const [actionLoading, setActionLoading] = useState({});

  const handleAction = async (role, action) => {
    const key = `${role.rolename}-${action}`;
    setActionLoading((prev) => ({ ...prev, [key]: true }));

    try {
      if (action === "delete") {
        await onDelete(role);
      } else if (action === "viewDetails") {
        onViewDetails(role);
      }
    } finally {
      setActionLoading((prev) => ({ ...prev, [key]: false }));
    }
  };

  const formatShell = (shell) => {
    if (!shell) return "N/A";
    const parts = shell.split("/");
    return parts[parts.length - 1] || shell;
  };

  if (loading && roles.length === 0) {
    return (
      <div className="has-text-centered p-4">
        <span className="icon is-large">
          <i className="fas fa-spinner fa-spin fa-2x" />
        </span>
        <p className="mt-2">Loading roles...</p>
      </div>
    );
  }

  if (roles.length === 0) {
    return (
      <div className="has-text-centered p-4">
        <span className="icon is-large has-text-grey">
          <i className="fas fa-user-shield fa-2x" />
        </span>
        <p className="mt-2 has-text-grey">No roles found</p>
      </div>
    );
  }

  return (
    <div className="table-container">
      <table className="table is-fullwidth is-hoverable">
        <thead>
          <tr>
            <th>Role Name</th>
            <th>Comment</th>
            <th>Shell</th>
            <th>Authorizations</th>
            <th>Profiles</th>
            <th width="200">Actions</th>
          </tr>
        </thead>
        <tbody>
          {roles.map((role, index) => {
            return (
              <tr key={role.rolename || index}>
                <td>
                  <div className="is-flex is-align-items-center">
                    <span className="icon has-text-warning">
                      <i className="fas fa-user-shield" />
                    </span>
                    <span className="ml-2">
                      <strong>{role.rolename}</strong>
                    </span>
                  </div>
                </td>
                <td>
                  <span className="is-size-7" title={role.comment}>
                    {role.comment || "N/A"}
                  </span>
                </td>
                <td>
                  <span
                    className="is-family-monospace is-size-7"
                    title={role.shell}
                  >
                    {formatShell(role.shell)}
                  </span>
                </td>
                <td>
                  {role.authorizations && role.authorizations.length > 0 ? (
                    <div className="tags">
                      {role.authorizations.slice(0, 2).map((auth, idx) => (
                        <span key={idx} className="tag is-info is-small">
                          {auth}
                        </span>
                      ))}
                      {role.authorizations.length > 2 && (
                        <span className="tag is-light is-small">
                          +{role.authorizations.length - 2} more
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="has-text-grey is-italic">None</span>
                  )}
                </td>
                <td>
                  {role.profiles && role.profiles.length > 0 ? (
                    <div className="tags">
                      {role.profiles.slice(0, 2).map((profile, idx) => (
                        <span key={idx} className="tag is-primary is-light is-small">
                          {profile}
                        </span>
                      ))}
                      {role.profiles.length > 2 && (
                        <span className="tag is-light is-small">
                          +{role.profiles.length - 2} more
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="has-text-grey is-italic">None</span>
                  )}
                </td>
                <td>
                  <div className="buttons are-small">
                    {/* View Details Button */}
                    <button
                      className="button"
                      onClick={() => handleAction(role, "viewDetails")}
                      disabled={loading}
                      title="View Details"
                    >
                      <span className="icon is-small">
                        <i className="fas fa-info-circle" />
                      </span>
                    </button>

                    {/* Delete Button */}
                    <button
                      className={`button is-danger ${
                        actionLoading[`${role.rolename}-delete`]
                          ? "is-loading"
                          : ""
                      }`}
                      onClick={() => handleAction(role, "delete")}
                      disabled={loading}
                      title="Delete Role"
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

export default RoleTable;
