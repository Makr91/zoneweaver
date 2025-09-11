import React from "react";

import ContentModal from "../common/ContentModal";

const RoleDetailsModal = ({ role, onClose }) => {
  const formatValue = (value) => {
    if (value === null || value === undefined || value === "") {
      return <span className="has-text-grey">N/A</span>;
    }
    if (Array.isArray(value)) {
      return value.length > 0 ? value.join(", ") : <span className="has-text-grey">None</span>;
    }
    return value;
  };

  const formatShell = (shell) => {
    if (!shell) return "N/A";
    return shell;
  };

  return (
    <ContentModal
      isOpen={true}
      onClose={onClose}
      title={`Role Details: ${role.rolename}`}
      icon="fas fa-user-shield"
      className="is-large"
      aria-label={`Role details for ${role.rolename}`}
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
                  <td><strong>Role Name</strong></td>
                  <td className="is-family-monospace">{role.rolename}</td>
                </tr>
                <tr>
                  <td><strong>Comment</strong></td>
                  <td>{formatValue(role.comment)}</td>
                </tr>
                <tr>
                  <td><strong>Shell</strong></td>
                  <td className="is-family-monospace">{formatShell(role.shell)}</td>
                </tr>
                <tr>
                  <td><strong>Home Directory</strong></td>
                  <td className="is-family-monospace">{formatValue(role.home)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* RBAC Configuration */}
        <div className="column">
          <h4 className="title is-5">
            <span className="icon">
              <i className="fas fa-shield-alt" />
            </span>
            <span>RBAC Configuration</span>
          </h4>

          <div className="table-container">
            <table className="table is-fullwidth">
              <tbody>
                <tr>
                  <td><strong>Authorizations</strong></td>
                  <td>
                    {role.authorizations && role.authorizations.length > 0 ? (
                      <div className="content">
                        {role.authorizations.map((auth, index) => (
                          <div key={index} className="is-family-monospace is-size-7">
                            <span className="tag is-info is-light mr-1">
                              {auth}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="has-text-grey">None</span>
                    )}
                  </td>
                </tr>

                <tr>
                  <td><strong>Profiles</strong></td>
                  <td>
                    {role.profiles && role.profiles.length > 0 ? (
                      <div className="tags">
                        {role.profiles.map((profile, index) => (
                          <span key={index} className="tag is-primary is-light">
                            {profile}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="has-text-grey">None</span>
                    )}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Role Usage Information */}
      <hr />
      <h4 className="title is-6">
        <span className="icon">
          <i className="fas fa-user-friends" />
        </span>
        <span>Role Usage</span>
      </h4>
      
      <div className="content">
        <div className="notification is-light">
          <p><strong>How Roles Work:</strong></p>
          <ul>
            <li>Roles are special accounts that provide collections of privileges</li>
            <li>Users can be granted the ability to assume roles using <code>su</code> or <code>pfexec</code></li>
            <li>When a user assumes a role, they gain the role's authorizations and profiles</li>
            <li>Roles typically use the profile shell (<code>/bin/pfsh</code>) for RBAC enforcement</li>
            <li>Users must be explicitly granted permission to assume specific roles</li>
          </ul>
        </div>

        <div className="notification is-info">
          <p><strong>Assigning Roles to Users:</strong></p>
          <p>To allow users to assume this role, edit their user account and add "<strong>{role.rolename}</strong>" to their roles list in the User Management section.</p>
        </div>
      </div>

      {/* Shell Information */}
      {role.shell && (
        <div className="notification is-warning">
          <p><strong>Shell Configuration:</strong></p>
          <p>
            This role uses <code>{role.shell}</code>. 
            {role.shell === "/bin/pfsh" ? (
              " This is the recommended profile shell for RBAC roles."
            ) : (
              " Consider using /bin/pfsh for proper RBAC privilege enforcement."
            )}
          </p>
        </div>
      )}
    </ContentModal>
  );
};

export default RoleDetailsModal;
