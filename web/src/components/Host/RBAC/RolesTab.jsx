import PropTypes from "prop-types";

const RolesTab = ({ roles, loading, copyToClipboard }) => {
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
            <th>Description</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {roles.map((role) => (
            <tr key={role.name}>
              <td>
                <div className="is-flex is-align-items-center">
                  <span className="icon has-text-warning">
                    <i className="fas fa-user-shield" />
                  </span>
                  <span className="ml-2">
                    <strong>{role.name}</strong>
                  </span>
                </div>
              </td>
              <td className="is-size-7" title={role.description}>
                {role.description || "N/A"}
              </td>
              <td>
                <button
                  className="button is-small"
                  onClick={() => copyToClipboard(role.name)}
                  title="Copy to clipboard"
                >
                  <span className="icon is-small">
                    <i className="fas fa-copy" />
                  </span>
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

RolesTab.propTypes = {
  roles: PropTypes.array.isRequired,
  loading: PropTypes.bool.isRequired,
  copyToClipboard: PropTypes.func.isRequired,
};

export default RolesTab;
