import ContentModal from "../common/ContentModal";

const UserDetailsModal = ({ user, onClose }) => {
  const formatValue = (value) => {
    if (value === null || value === undefined || value === "") {
      return <span className="has-text-grey">N/A</span>;
    }
    if (Array.isArray(value)) {
      return value.length > 0 ? (
        value.join(", ")
      ) : (
        <span className="has-text-grey">None</span>
      );
    }
    return value;
  };

  const getUserType = () => {
    if (user.uid < 100 && !user.comment?.includes("User")) {
      return { type: "System User", class: "is-info" };
    }
    return { type: "Regular User", class: "is-success" };
  };

  const userType = getUserType();

  return (
    <ContentModal
      isOpen
      onClose={onClose}
      title={`User Details: ${user.username}`}
      icon="fas fa-user"
      className="is-large"
      aria-label={`User details for ${user.username}`}
    >
      <div className="columns">
        {/* Basic Information */}
        <div className="column">
          <h4 className="title is-5">
            <span className="icon">
              <i className="fas fa-info-circle" />
            </span>
            <span>Basic Information</span>
          </h4>

          <div className="table-container">
            <table className="table is-fullwidth">
              <tbody>
                <tr>
                  <td>
                    <strong>Username</strong>
                  </td>
                  <td className="is-family-monospace">{user.username}</td>
                </tr>
                <tr>
                  <td>
                    <strong>User ID (UID)</strong>
                  </td>
                  <td className="is-family-monospace">{user.uid}</td>
                </tr>
                <tr>
                  <td>
                    <strong>Group ID (GID)</strong>
                  </td>
                  <td className="is-family-monospace">{user.gid}</td>
                </tr>
                <tr>
                  <td>
                    <strong>User Type</strong>
                  </td>
                  <td>
                    <span className={`tag ${userType.class}`}>
                      {userType.type}
                    </span>
                  </td>
                </tr>
                <tr>
                  <td>
                    <strong>Comment</strong>
                  </td>
                  <td>{formatValue(user.comment)}</td>
                </tr>
                <tr>
                  <td>
                    <strong>Home Directory</strong>
                  </td>
                  <td className="is-family-monospace">
                    {formatValue(user.home)}
                  </td>
                </tr>
                <tr>
                  <td>
                    <strong>Shell</strong>
                  </td>
                  <td className="is-family-monospace">
                    {formatValue(user.shell)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Extended Attributes */}
        <div className="column">
          <h4 className="title is-5">
            <span className="icon">
              <i className="fas fa-shield-alt" />
            </span>
            <span>RBAC Attributes</span>
          </h4>

          {user.attributes ? (
            <div className="table-container">
              <table className="table is-fullwidth">
                <tbody>
                  {user.attributes.groups && (
                    <tr>
                      <td>
                        <strong>Secondary Groups</strong>
                      </td>
                      <td>
                        {user.attributes.groups.length > 0 ? (
                          <div className="tags">
                            {user.attributes.groups.map((group, index) => (
                              <span key={index} className="tag is-light">
                                {group}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="has-text-grey">None</span>
                        )}
                      </td>
                    </tr>
                  )}

                  {user.attributes.authorizations && (
                    <tr>
                      <td>
                        <strong>Authorizations</strong>
                      </td>
                      <td>
                        {user.attributes.authorizations.length > 0 ? (
                          <div className="content">
                            {user.attributes.authorizations.map(
                              (auth, index) => (
                                <div
                                  key={index}
                                  className="is-family-monospace is-size-7"
                                >
                                  {auth}
                                </div>
                              )
                            )}
                          </div>
                        ) : (
                          <span className="has-text-grey">None</span>
                        )}
                      </td>
                    </tr>
                  )}

                  {user.attributes.profiles && (
                    <tr>
                      <td>
                        <strong>Profiles</strong>
                      </td>
                      <td>
                        {user.attributes.profiles.length > 0 ? (
                          <div className="tags">
                            {user.attributes.profiles.map((profile, index) => (
                              <span
                                key={index}
                                className="tag is-primary is-light"
                              >
                                {profile}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="has-text-grey">None</span>
                        )}
                      </td>
                    </tr>
                  )}

                  {user.attributes.roles && (
                    <tr>
                      <td>
                        <strong>Roles</strong>
                      </td>
                      <td>
                        {user.attributes.roles.length > 0 ? (
                          <div className="tags">
                            {user.attributes.roles.map((role, index) => (
                              <span
                                key={index}
                                className="tag is-warning is-light"
                              >
                                {role}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="has-text-grey">None</span>
                        )}
                      </td>
                    </tr>
                  )}

                  {user.attributes.project && (
                    <tr>
                      <td>
                        <strong>Project</strong>
                      </td>
                      <td className="is-family-monospace">
                        {user.attributes.project}
                      </td>
                    </tr>
                  )}

                  {user.attributes.account_status && (
                    <tr>
                      <td>
                        <strong>Account Status</strong>
                      </td>
                      <td>
                        <span
                          className={`tag ${
                            user.attributes.account_status === "active"
                              ? "is-success"
                              : user.attributes.account_status === "locked"
                                ? "is-danger"
                                : "is-warning"
                          }`}
                        >
                          {user.attributes.account_status}
                        </span>
                      </td>
                    </tr>
                  )}

                  {user.attributes.password_status && (
                    <tr>
                      <td>
                        <strong>Password Status</strong>
                      </td>
                      <td>
                        <span
                          className={`tag ${
                            user.attributes.password_status === "set"
                              ? "is-success"
                              : user.attributes.password_status === "expired"
                                ? "is-warning"
                                : "is-light"
                          }`}
                        >
                          {user.attributes.password_status}
                        </span>
                      </td>
                    </tr>
                  )}

                  {user.attributes.last_login && (
                    <tr>
                      <td>
                        <strong>Last Login</strong>
                      </td>
                      <td className="is-family-monospace">
                        {user.attributes.last_login}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="notification is-info">
              <p>
                Extended attributes not loaded. Click "View Details" to load
                full user information.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Additional System Information */}
      {user.attributes && Object.keys(user.attributes).length > 0 && (
        <>
          <hr />
          <h4 className="title is-6">
            <span className="icon">
              <i className="fas fa-cog" />
            </span>
            <span>Raw Attributes</span>
          </h4>
          <div className="content">
            <pre className="has-background-light p-3 is-size-7">
              {JSON.stringify(user.attributes, null, 2)}
            </pre>
          </div>
        </>
      )}
    </ContentModal>
  );
};

export default UserDetailsModal;
