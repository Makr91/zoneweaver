import PropTypes from "prop-types";
import { useState } from "react";

import ArcConfiguration from "./ArcConfiguration";
import { ArtifactManagement } from "./ArtifactStorage";

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
      <div className="tabs is-boxed mb-0">
        <ul>
          <li className={activeTab === "arc" ? "is-active" : ""}>
            <button
              tabIndex={0}
              onClick={(e) => {
                e.preventDefault();
                setActiveTab("arc");
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setActiveTab("arc");
                }
              }}
              className="button"
            >
              <span className="icon is-small">
                <i className="fas fa-memory" />
              </span>
              <span>ZFS ARC</span>
            </button>
          </li>
          <li className={activeTab === "artifacts" ? "is-active" : ""}>
            <button
              tabIndex={0}
              onClick={(e) => {
                e.preventDefault();
                setActiveTab("artifacts");
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setActiveTab("artifacts");
                }
              }}
              className="button"
            >
              <span className="icon is-small">
                <i className="fas fa-compact-disc" />
              </span>
              <span>ISO & Artifacts</span>
            </button>
          </li>
          <li className="is-disabled">
            <button className="button" disabled>
              <span className="icon is-small">
                <i className="fas fa-database" />
              </span>
              <span>ZFS Pools</span>
            </button>
          </li>
          <li className="is-disabled">
            <button className="button" disabled>
              <span className="icon is-small">
                <i className="fas fa-folder-tree" />
              </span>
              <span>ZFS Datasets</span>
            </button>
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
                <strong>{server.hostname}</strong>. The ARC is ZFS&apos;s
                intelligent caching layer that stores frequently accessed data
                in system memory to improve performance.
              </p>
            </div>

            <ArcConfiguration server={server} />
          </div>
        )}

        {/* ISO & Artifacts Tab */}
        {activeTab === "artifacts" && (
          <div>
            <div className="mb-4">
              <h3 className="title is-6">
                <span className="icon-text">
                  <span className="icon">
                    <i className="fas fa-compact-disc" />
                  </span>
                  <span>ISO & Artifact Management</span>
                </span>
              </h3>
              <p className="content">
                Manage ISO files, VM images, and artifact storage locations on{" "}
                <strong>{server.hostname}</strong>. Configure storage paths,
                upload files, download from URLs, and organize your
                virtualization resources.
              </p>
            </div>

            <ArtifactManagement server={server} />
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

StorageManagement.propTypes = {
  server: PropTypes.shape({
    hostname: PropTypes.string,
  }),
};

export default StorageManagement;
