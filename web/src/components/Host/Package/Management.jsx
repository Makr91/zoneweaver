import PropTypes from "prop-types";
import { useState } from "react";

import { useServers } from "../../../contexts/ServerContext";
import RepositorySection from "../RepositorySection";
import SystemUpdatesSection from "../SystemUpdatesSection";

import PackageSection from "./Section";

const PackageManagement = ({ server }) => {
  const [activeSection, setActiveSection] = useState("packages");
  const [error, setError] = useState("");

  const { makeZoneweaverAPIRequest } = useServers();

  if (!server || !makeZoneweaverAPIRequest) {
    return (
      <div className="notification is-info">
        <p>Please select a server to manage packages and repositories.</p>
      </div>
    );
  }

  const sections = [
    { key: "packages", label: "Packages", icon: "fa-cube" },
    { key: "repositories", label: "Repositories", icon: "fa-database" },
    { key: "updates", label: "Updates", icon: "fa-download" },
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
              <button
                className="button is-text"
                onClick={() => setActiveSection(section.key)}
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
              </button>
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
        {activeSection === "packages" && (
          <PackageSection server={server} onError={setError} />
        )}

        {activeSection === "repositories" && (
          <RepositorySection server={server} onError={setError} />
        )}

        {activeSection === "updates" && (
          <SystemUpdatesSection server={server} onError={setError} />
        )}
      </div>
    </div>
  );
};

PackageManagement.propTypes = {
  server: PropTypes.shape({
    hostname: PropTypes.string,
    port: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    protocol: PropTypes.string,
  }),
};

export default PackageManagement;
