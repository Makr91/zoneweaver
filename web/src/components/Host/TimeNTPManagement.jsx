import React, { useState } from "react";

import { useServers } from "../../contexts/ServerContext";

import TimeSyncConfig from "./TimeSyncConfig";
import TimeSyncStatus from "./TimeSyncStatus";
import TimezoneSettings from "./TimezoneSettings";

const TimeNTPManagement = ({ server }) => {
  const [activeSection, setActiveSection] = useState("status");
  const [error, setError] = useState("");

  const { makeZoneweaverAPIRequest } = useServers();

  if (!server || !makeZoneweaverAPIRequest) {
    return (
      <div className="notification is-info">
        <p>Please select a server to manage time synchronization.</p>
      </div>
    );
  }

  const sections = [
    { key: "status", label: "Time Sync Status", icon: "fa-clock" },
    { key: "config", label: "NTP Configuration", icon: "fa-cog" },
    { key: "timezone", label: "Timezone", icon: "fa-globe" },
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
              <a onClick={() => setActiveSection(section.key)}>
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
        {activeSection === "status" && (
          <TimeSyncStatus server={server} onError={setError} />
        )}

        {activeSection === "config" && (
          <TimeSyncConfig server={server} onError={setError} />
        )}

        {activeSection === "timezone" && (
          <TimezoneSettings server={server} onError={setError} />
        )}
      </div>
    </div>
  );
};

export default TimeNTPManagement;
