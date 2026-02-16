import React from "react";

import ContentModal from "../common/ContentModal";

const GroupDetailsModal = ({ group, onClose }) => {
  const getGroupType = () => {
    if (group.gid < 100) {
      return { type: "System Group", class: "is-info" };
    }
    return { type: "Regular Group", class: "is-success" };
  };

  const groupType = getGroupType();

  return (
    <ContentModal
      isOpen
      onClose={onClose}
      title={`Group Details: ${group.groupname}`}
      icon="fas fa-users"
      className="is-medium"
      aria-label={`Group details for ${group.groupname}`}
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
                    <strong>Group Name</strong>
                  </td>
                  <td className="is-family-monospace">{group.groupname}</td>
                </tr>
                <tr>
                  <td>
                    <strong>Group ID (GID)</strong>
                  </td>
                  <td className="is-family-monospace">{group.gid}</td>
                </tr>
                <tr>
                  <td>
                    <strong>Group Type</strong>
                  </td>
                  <td>
                    <span className={`tag ${groupType.class}`}>
                      {groupType.type}
                    </span>
                  </td>
                </tr>
                <tr>
                  <td>
                    <strong>Member Count</strong>
                  </td>
                  <td>
                    <span className="tag is-light">
                      {group.members ? group.members.length : 0} members
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Members */}
        <div className="column">
          <h4 className="title is-5">
            <span className="icon">
              <i className="fas fa-user-friends" />
            </span>
            <span>Group Members</span>
          </h4>

          {group.members && group.members.length > 0 ? (
            <div className="content">
              <div className="tags">
                {group.members.map((member, index) => (
                  <span key={index} className="tag is-primary is-light">
                    <span className="icon is-small">
                      <i className="fas fa-user" />
                    </span>
                    <span className="ml-1">{member}</span>
                  </span>
                ))}
              </div>
            </div>
          ) : (
            <div className="notification is-info">
              <p>This group has no members assigned.</p>
              <p className="mt-2">
                <strong>Tip:</strong> Add users to this group by editing their
                user accounts in the Users section.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Additional Information */}
      <hr />
      <h4 className="title is-6">
        <span className="icon">
          <i className="fas fa-cog" />
        </span>
        <span>Group Management</span>
      </h4>

      <div className="content">
        <div className="notification is-light">
          <p>
            <strong>Managing Group Membership:</strong>
          </p>
          <ul>
            <li>
              To add users to this group, edit the user's secondary groups in
              User Management
            </li>
            <li>
              To remove users, edit their user account and remove this group
              from their secondary groups
            </li>
            <li>
              Primary group assignments are managed automatically during user
              creation
            </li>
          </ul>
        </div>

        {group.gid < 100 && (
          <div className="notification is-warning">
            <p>
              <strong>System Group:</strong>
            </p>
            <p>
              This is a system group (GID &lt; 100). Modifying system groups may
              affect system functionality.
            </p>
          </div>
        )}
      </div>
    </ContentModal>
  );
};

export default GroupDetailsModal;
