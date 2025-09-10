import React, { useState } from "react";

import ArcConfiguration from "./ArcConfiguration";

const StorageManagement = ({ server }) => {
  const [activeTab, setActiveTab] = useState("arc");

  if (!server) {
    return (
      <div className="notification is-info">
        <p>No server selected for storage management.</p>
      </div>
    );
  }

  return (
    <div>
      {/* Sub-Tab Navigation */}
      <div className="tabs is-boxed">
        <ul>
          <li className={activeTab === "arc" ? "is-active" : ""}>
            <a onClick={() => setActiveTab("arc")}>
              <span className="icon is-small">
                <i className="fas fa-memory" />
              </span>
              <span>ZFS ARC</span>
            </a>
          </li>
          <li className="is-disabled">
            <a>
              <span className="icon is-small">
                <i className="fas fa-database" />
              </span>
              <span>ZFS Pools</span>
            </a>
          </li>
          <li className="is-disabled">
            <a>
              <span className="icon is-small">
                <i className="fas fa-folder-tree" />
              </span>
              <span>ZFS Datasets</span>
            </a>
          </li>
        </ul>
      </div>

      {/* Tab Content */}
      <div className="mt-4">
        {activeTab === "arc" && (
          <div>
            <div className="mb-4">
              <h3 className="title is-6">
                <span className="icon-text">
                  <span className="icon">
                    <i className="fas fa-memory" />
                  </span>
                  <span>ZFS ARC Configuration</span>
                </span>
              </h3>
              <p className="content">
                Configure ZFS Adaptive Replacement Cache (ARC) settings on{" "}
                <strong>{server.hostname}</strong>. The ARC is ZFS's intelligent
                caching layer that stores frequently accessed data in system
                memory to improve performance.
              </p>
            </div>

            <ArcConfiguration server={server} />
          </div>
        )}

        {/* Future: ZFS Pools tab content */}
        {activeTab === "pools" && (
          <div className="notification is-info">
            <p>ZFS Pool management will be available in a future update.</p>
          </div>
        )}

        {/* Future: ZFS Datasets tab content */}
        {activeTab === "datasets" && (
          <div className="notification is-info">
            <p>ZFS Dataset management will be available in a future update.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default StorageManagement;
