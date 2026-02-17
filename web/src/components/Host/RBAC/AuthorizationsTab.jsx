import PropTypes from "prop-types";

const AuthorizationsTab = ({ authorizations, loading, copyToClipboard }) => {
  if (loading && authorizations.length === 0) {
    return (
      <div className="has-text-centered p-4">
        <span className="icon is-large">
          <i className="fas fa-spinner fa-spin fa-2x" />
        </span>
        <p className="mt-2">Loading authorizations...</p>
      </div>
    );
  }

  if (authorizations.length === 0) {
    return (
      <div className="has-text-centered p-4">
        <span className="icon is-large has-text-grey">
          <i className="fas fa-shield-alt fa-2x" />
        </span>
        <p className="mt-2 has-text-grey">No authorizations found</p>
      </div>
    );
  }

  return (
    <div className="table-container">
      <table className="table is-fullwidth is-hoverable">
        <thead>
          <tr>
            <th>Authorization</th>
            <th>Short Description</th>
            <th>Long Description</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {authorizations.map((auth) => (
            <tr key={auth.name}>
              <td>
                <code className="is-size-7">{auth.name}</code>
              </td>
              <td className="is-size-7">{auth.short_description || "N/A"}</td>
              <td className="is-size-7" title={auth.long_description}>
                {auth.long_description && auth.long_description.length > 50
                  ? `${auth.long_description.substring(0, 50)}...`
                  : auth.long_description || "N/A"}
              </td>
              <td>
                <button
                  className="button is-small"
                  onClick={() => copyToClipboard(auth.name)}
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

AuthorizationsTab.propTypes = {
  authorizations: PropTypes.array.isRequired,
  loading: PropTypes.bool.isRequired,
  copyToClipboard: PropTypes.func.isRequired,
};

export default AuthorizationsTab;
