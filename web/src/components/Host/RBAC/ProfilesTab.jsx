import PropTypes from "prop-types";

const ProfilesTab = ({ profiles, loading, copyToClipboard }) => {
  if (loading && profiles.length === 0) {
    return (
      <div className="has-text-centered p-4">
        <span className="icon is-large">
          <i className="fas fa-spinner fa-spin fa-2x" />
        </span>
        <p className="mt-2">Loading profiles...</p>
      </div>
    );
  }

  if (profiles.length === 0) {
    return (
      <div className="has-text-centered p-4">
        <span className="icon is-large has-text-grey">
          <i className="fas fa-id-card fa-2x" />
        </span>
        <p className="mt-2 has-text-grey">No profiles found</p>
      </div>
    );
  }

  return (
    <div className="table-container">
      <table className="table is-fullwidth is-hoverable">
        <thead>
          <tr>
            <th>Profile Name</th>
            <th>Description</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {profiles.map((profile) => (
            <tr key={profile.name}>
              <td>
                <strong>{profile.name}</strong>
              </td>
              <td className="is-size-7" title={profile.description}>
                {profile.description || "N/A"}
              </td>
              <td>
                <button
                  className="button is-small"
                  onClick={() => copyToClipboard(profile.name)}
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

ProfilesTab.propTypes = {
  profiles: PropTypes.array.isRequired,
  loading: PropTypes.bool.isRequired,
  copyToClipboard: PropTypes.func.isRequired,
};

export default ProfilesTab;
