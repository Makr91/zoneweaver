import { useState } from "react";

const UserTable = ({
  users,
  loading,
  onEdit,
  onDelete,
  onLock,
  onUnlock,
  onSetPassword,
  onViewDetails,
}) => {
  const [actionLoading, setActionLoading] = useState({});

  const handleAction = async (user, action) => {
    const key = `${user.username}-${action}`;
    setActionLoading((prev) => ({ ...prev, [key]: true }));

    try {
      if (action === "delete") {
        if (
          window.confirm(
            `Are you sure you want to delete user "${user.username}"?\n\nThis will also remove their home directory and personal group.`
          )
        ) {
          await onDelete(user);
        }
      } else if (action === "lock") {
        if (
          window.confirm(
            `Are you sure you want to lock user "${user.username}"?`
          )
        ) {
          await onLock(user);
        }
      } else if (action === "unlock") {
        await onUnlock(user);
      } else if (action === "edit") {
        onEdit(user);
      } else if (action === "setPassword") {
        onSetPassword(user);
      }
    } finally {
      setActionLoading((prev) => ({ ...prev, [key]: false }));
    }
  };

  const getUserStatusIcon = (user) => {
    // Determine user status based on available information
    // This is a simplified approach - actual implementation might need more logic
    if (user.uid < 100 && !user.comment?.includes("User")) {
      return (
        <span className="icon has-text-info" title="System User">
          <i className="fas fa-cog" />
        </span>
      );
    }
    return (
      <span className="icon has-text-success" title="Regular User">
        <i className="fas fa-user" />
      </span>
    );
  };

  const getUserStatusTag = (user) => {
    if (user.uid < 100 && !user.comment?.includes("User")) {
      return <span className="tag is-info is-small">System</span>;
    }
    return <span className="tag is-success is-small">Active</span>;
  };

  const formatShell = (shell) => {
    if (!shell) {
      return "N/A";
    }
    const parts = shell.split("/");
    return parts[parts.length - 1] || shell;
  };

  const formatHome = (home) => {
    if (!home) {
      return "N/A";
    }
    if (home.length > 25) {
      return `...${home.slice(-22)}`;
    }
    return home;
  };

  if (loading && users.length === 0) {
    return (
      <div className="has-text-centered p-4">
        <span className="icon is-large">
          <i className="fas fa-spinner fa-spin fa-2x" />
        </span>
        <p className="mt-2">Loading users...</p>
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="has-text-centered p-4">
        <span className="icon is-large has-text-grey">
          <i className="fas fa-users fa-2x" />
        </span>
        <p className="mt-2 has-text-grey">No users found</p>
      </div>
    );
  }

  return (
    <div className="table-container">
      <table className="table is-fullwidth is-hoverable">
        <thead>
          <tr>
            <th>Username</th>
            <th>UID</th>
            <th>GID</th>
            <th>Comment</th>
            <th>Home Directory</th>
            <th>Shell</th>
            <th>Status</th>
            <th width="280">Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user, index) => (
            <tr key={user.username || index}>
              <td>
                <div className="is-flex is-align-items-center">
                  {getUserStatusIcon(user)}
                  <span className="ml-2">
                    <strong>{user.username}</strong>
                  </span>
                </div>
              </td>
              <td>
                <span className="is-family-monospace">{user.uid}</span>
              </td>
              <td>
                <span className="is-family-monospace">{user.gid}</span>
              </td>
              <td>
                <span className="is-size-7" title={user.comment}>
                  {user.comment || "N/A"}
                </span>
              </td>
              <td>
                <span
                  className="is-family-monospace is-size-7"
                  title={user.home}
                >
                  {formatHome(user.home)}
                </span>
              </td>
              <td>
                <span
                  className="is-family-monospace is-size-7"
                  title={user.shell}
                >
                  {formatShell(user.shell)}
                </span>
              </td>
              <td>{getUserStatusTag(user)}</td>
              <td>
                <div className="buttons are-small">
                  {/* Edit Button */}
                  <button
                    className="button"
                    onClick={() => handleAction(user, "edit")}
                    disabled={loading}
                    title="Edit User"
                  >
                    <span className="icon is-small">
                      <i className="fas fa-edit" />
                    </span>
                  </button>

                  {/* Set Password Button */}
                  <button
                    className="button is-info"
                    onClick={() => handleAction(user, "setPassword")}
                    disabled={loading}
                    title="Set Password"
                  >
                    <span className="icon is-small">
                      <i className="fas fa-key" />
                    </span>
                  </button>

                  {/* Lock/Unlock Button - only for non-system users */}
                  {user.uid >= 100 && (
                    <button
                      className="button is-warning"
                      onClick={() => handleAction(user, "lock")}
                      disabled={loading}
                      title="Lock Account"
                    >
                      <span className="icon is-small">
                        <i className="fas fa-lock" />
                      </span>
                    </button>
                  )}

                  {/* View Details Button */}
                  <button
                    className="button"
                    onClick={() => onViewDetails(user)}
                    disabled={loading}
                    title="View Details"
                  >
                    <span className="icon is-small">
                      <i className="fas fa-info-circle" />
                    </span>
                  </button>

                  {/* Delete Button - only for non-system users */}
                  {user.uid >= 100 && (
                    <button
                      className={`button is-danger ${
                        actionLoading[`${user.username}-delete`]
                          ? "is-loading"
                          : ""
                      }`}
                      onClick={() => handleAction(user, "delete")}
                      disabled={loading}
                      title="Delete User"
                    >
                      <span className="icon is-small">
                        <i className="fas fa-trash" />
                      </span>
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default UserTable;
