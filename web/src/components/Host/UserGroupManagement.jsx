import PropTypes from "prop-types";
import { useState } from "react";

import { useServers } from "../../contexts/ServerContext";

import GroupSection from "./GroupSection";
import RBACDiscoverySection from "./RBACDiscoverySection";
import RoleSection from "./RoleSection";
import UserSection from "./UserSection";

const UserGroupManagement = ({ server }) => {
  const [activeSection, setActiveSection] = useState("users");
  const [error, setError] = useState("");

  const { makeZoneweaverAPIRequest } = useServers();

  if (!server || !makeZoneweaverAPIRequest) {
    return (
      <div className="notification is-info">
        <p>Please select a server to manage users and groups.</p>
      </div>
    );
  }

  const sections = [
    { key: "users", label: "Users", icon: "fa-user" },
    { key: "groups", label: "Groups", icon: "fa-users" },
    { key: "roles", label: "Roles", icon: "fa-user-shield" },
    { key: "rbac", label: "RBAC Discovery", icon: "fa-search" },
  ];

  return (
    <div>
      {/* Section Navigation */}
      <div className="tabs is-boxed mb-0">
        <ul>
          {sections.map((section) => (
            <li
              key={section.key}
              className={activeSection === section.key ? "is-active" : ""}
            >
              <a
                href={`#${section.key}`}
                onClick={(e) => {
                  e.preventDefault();
                  setActiveSection(section.key);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setActiveSection(section.key);
                  }
                }}
              >
                <span className="icon is-small">
                  <i className={`fas ${section.icon}`} />
                </span>
                <span>{section.label}</span>
              </a>
            </li>
          ))}
        </ul>
      </div>

      {/* Error Display */}
      {error && (
        <div className="notification is-danger mb-4">
          <button className="delete" onClick={() => setError("")} />
          <p>{error}</p>
        </div>
      )}

      {/* Section Content */}
      <div className="section-content">
        {activeSection === "users" && (
          <UserSection server={server} onError={setError} />
        )}

        {activeSection === "groups" && (
          <GroupSection server={server} onError={setError} />
        )}

        {activeSection === "roles" && (
          <RoleSection server={server} onError={setError} />
        )}

        {activeSection === "rbac" && (
          <RBACDiscoverySection server={server} onError={setError} />
        )}
      </div>
    </div>
  );
};

UserGroupManagement.propTypes = {
  server: PropTypes.shape({
    hostname: PropTypes.string,
    port: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    protocol: PropTypes.string,
  }).isRequired,
};

export default UserGroupManagement;
