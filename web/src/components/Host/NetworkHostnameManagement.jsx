import React, { useState } from "react";

import { useServers } from "../../contexts/ServerContext";

import AggregateManagement from "./AggregateManagement";
import BridgeManagement from "./BridgeManagement";
import EtherstubManagement from "./EtherstubManagement";
import HostnameSettings from "./HostnameSettings";
import IpAddressManagement from "./IpAddressManagement";
import VnicManagement from "./VnicManagement";

const NetworkHostnameManagement = ({ server }) => {
  const [activeSection, setActiveSection] = useState("hostname");
  const [error, setError] = useState("");

  const { makeZoneweaverAPIRequest } = useServers();

  if (!server || !makeZoneweaverAPIRequest) {
    return (
      <div className="notification is-info">
        <p>Please select a server to manage network configuration.</p>
      </div>
    );
  }

  const sections = [
    { key: "hostname", label: "Hostname", icon: "fa-server" },
    { key: "vnics", label: "VNICs", icon: "fa-network-wired" },
    { key: "addresses", label: "IP Addresses", icon: "fa-globe" },
    { key: "aggregates", label: "Link Aggregates", icon: "fa-link" },
    { key: "bridges", label: "Bridges", icon: "fa-bridge-water" },
    { key: "etherstubs", label: "Etherstubs", icon: "fa-ethernet" },
  ];

  return (
    <div>
      {/* Section Navigation */}
      <div className="tabs is-boxed">
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
        {activeSection === "hostname" && (
          <HostnameSettings server={server} onError={setError} />
        )}

        {activeSection === "vnics" && (
          <VnicManagement server={server} onError={setError} />
        )}

        {activeSection === "addresses" && (
          <IpAddressManagement server={server} onError={setError} />
        )}

        {activeSection === "aggregates" && (
          <AggregateManagement server={server} onError={setError} />
        )}

        {activeSection === "bridges" && (
          <BridgeManagement server={server} onError={setError} />
        )}

        {activeSection === "etherstubs" && (
          <EtherstubManagement server={server} onError={setError} />
        )}
      </div>
    </div>
  );
};

export default NetworkHostnameManagement;
