import React, { useState, useEffect, useCallback } from "react";

import { useServers } from "../../../contexts/ServerContext";

import ArtifactFilters from "./components/filters/ArtifactFilters";
import ArtifactTable from "./components/tables/ArtifactTable";
import StoragePathTable from "./components/tables/StoragePathTable";
import ArtifactDetailsModal from "./components/modals/ArtifactDetailsModal";
import ArtifactDownloadModal from "./components/modals/ArtifactDownloadModal";
import ArtifactUploadModal from "./components/modals/ArtifactUploadModal";
import StoragePathCreateModal from "./components/modals/StoragePathCreateModal";
import StoragePathEditModal from "./components/modals/StoragePathEditModal";

const ArtifactManagement = ({ server }) => {
  const [activeTab, setActiveTab] = useState("storage-paths");
  
  // Storage Paths state
  const [storagePaths, setStoragePaths] = useState([]);
  const [storagePathsLoading, setStoragePathsLoading] = useState(false);
  
  // Artifacts state
  const [artifacts, setArtifacts] = useState([]);
  const [artifactsLoading, setArtifactsLoading] = useState(false);
  const [artifactsPagination, setArtifactsPagination] = useState({
    total: 0,
    limit: 25,
    offset: 0,
    has_more: false
  });
  
  // Filters state
  const [filters, setFilters] = useState({
    search: "",
    type: "",
    storage_location: "",
    sort_by: "filename",
    sort_order: "asc"
  });
  
  // Modal states
  const [showStoragePathCreateModal, setShowStoragePathCreateModal] = useState(false);
  const [showStoragePathEditModal, setShowStoragePathEditModal] = useState(false);
  const [showArtifactUploadModal, setShowArtifactUploadModal] = useState(false);
  const [showArtifactDownloadModal, setShowArtifactDownloadModal] = useState(false);
  const [showArtifactDetailsModal, setShowArtifactDetailsModal] = useState(false);
  const [selectedStoragePath, setSelectedStoragePath] = useState(null);
  const [selectedArtifact, setSelectedArtifact] = useState(null);
  const [artifactDetails, setArtifactDetails] = useState(null);
  
  // General state
  const [error, setError] = useState("");

  const { makeZoneweaverAPIRequest } = useServers();

  // Use useCallback to stabilize function references
  const loadArtifacts = useCallback(async (resetOffset = true) => {
    if (!server || !makeZoneweaverAPIRequest) {
      return;
    }

    try {
      setArtifactsLoading(true);
      setError("");

      const params = {
        limit: artifactsPagination.limit,
        offset: resetOffset ? 0 : artifactsPagination.offset,
        sort_by: filters.sort_by,
        sort_order: filters.sort_order
      };

      if (filters.search.trim()) {
        params.search = filters.search.trim();
      }
      if (filters.type) {
        params.type = filters.type;
      }
      if (filters.storage_location) {
        params.storage_location_id = filters.storage_location;
      }

      const result = await makeZoneweaverAPIRequest(
        server.hostname,
        server.port,
        server.protocol,
        "artifacts",
        "GET",
        null,
        params
      );

      if (result.success && result.data) {
        setArtifacts(result.data.artifacts || []);
        if (result.data.pagination) {
          setArtifactsPagination(result.data.pagination);
        }
      } else {
        setError(result.message || "Failed to load artifacts");
        setArtifacts([]);
      }
    } catch (err) {
      setError(`Error loading artifacts: ${err.message}`);
      setArtifacts([]);
    } finally {
      setArtifactsLoading(false);
    }
  }, [server, makeZoneweaverAPIRequest, artifactsPagination.limit, artifactsPagination.offset, filters.sort_by, filters.sort_order, filters.search, filters.type, filters.storage_location]);

  // Load data on component mount and when tab changes
  useEffect(() => {
    if (activeTab === "storage-paths") {
      loadStoragePaths();
    } else if (activeTab === "artifacts") {
      loadArtifacts();
    }
  }, [server, activeTab, loadArtifacts]);

  // Load artifacts when filters change (but only individual filter values to prevent infinite loop)
  useEffect(() => {
    if (activeTab === "artifacts") {
      loadArtifacts();
    }
  }, [activeTab, loadArtifacts, filters.search, filters.type, filters.storage_location, filters.sort_by, filters.sort_order]);

  const loadStoragePaths = async () => {
    if (!server || !makeZoneweaverAPIRequest) {
      return;
    }

    try {
      setStoragePathsLoading(true);
      setError("");

      const result = await makeZoneweaverAPIRequest(
        server.hostname,
        server.port,
        server.protocol,
        "artifacts/storage/paths",
        "GET"
      );

      if (result.success && result.data) {
        setStoragePaths(result.data.paths || []);
      } else {
        setError(result.message || "Failed to load storage paths");
        setStoragePaths([]);
      }
    } catch (err) {
      setError(`Error loading storage paths: ${err.message}`);
      setStoragePaths([]);
    } finally {
      setStoragePathsLoading(false);
    }
  };


  const handleStoragePathCreate = () => {
    setShowStoragePathCreateModal(false);
    loadStoragePaths();
  };

  const handleStoragePathEdit = (storagePath) => {
    setSelectedStoragePath(storagePath);
    setShowStoragePathEditModal(true);
  };

  const handleStoragePathEditComplete = () => {
    setShowStoragePathEditModal(false);
    setSelectedStoragePath(null);
    loadStoragePaths();
  };

  const handleStoragePathDelete = async (storagePath) => {
    if (!window.confirm(`Are you sure you want to delete storage path "${storagePath.name}"? This will remove the storage location but not the files themselves.`)) {
      return;
    }

    try {
      setStoragePathsLoading(true);
      setError("");

      const result = await makeZoneweaverAPIRequest(
        server.hostname,
        server.port,
        server.protocol,
        `artifacts/storage/paths/${storagePath.id}`,
        "DELETE",
        {
          recursive: false,
          remove_db_records: true,
          force: false
        }
      );

      if (result.success) {
        await loadStoragePaths();
      } else {
        setError(result.message || "Failed to delete storage path");
      }
    } catch (err) {
      setError(`Error deleting storage path: ${err.message}`);
    } finally {
      setStoragePathsLoading(false);
    }
  };

  const handleStoragePathToggle = async (storagePath) => {
    try {
      setStoragePathsLoading(true);
      setError("");

      const result = await makeZoneweaverAPIRequest(
        server.hostname,
        server.port,
        server.protocol,
        `artifacts/storage/paths/${storagePath.id}`,
        "PUT",
        {
          enabled: !storagePath.enabled
        }
      );

      if (result.success) {
        await loadStoragePaths();
      } else {
        setError(result.message || "Failed to update storage path");
      }
    } catch (err) {
      setError(`Error updating storage path: ${err.message}`);
    } finally {
      setStoragePathsLoading(false);
    }
  };

  const handleArtifactDetails = async (artifact) => {
    try {
      setArtifactsLoading(true);
      setError("");

      const result = await makeZoneweaverAPIRequest(
        server.hostname,
        server.port,
        server.protocol,
        `artifacts/${artifact.id}`,
        "GET"
      );

      if (result.success && result.data) {
        setSelectedArtifact(artifact);
        setArtifactDetails(result.data);
        setShowArtifactDetailsModal(true);
      } else {
        setError(result.message || "Failed to load artifact details");
      }
    } catch (err) {
      setError(`Error loading artifact details: ${err.message}`);
    } finally {
      setArtifactsLoading(false);
    }
  };

  const handleArtifactDelete = async (artifactIds) => {
    if (!window.confirm(`Are you sure you want to delete ${artifactIds.length} artifact(s)? This will permanently remove the files from storage.`)) {
      return;
    }

    try {
      setArtifactsLoading(true);
      setError("");

      const result = await makeZoneweaverAPIRequest(
        server.hostname,
        server.port,
        server.protocol,
        "artifacts/files",
        "DELETE",
        {
          artifact_ids: artifactIds,
          delete_files: true,
          force: false
        }
      );

      if (result.success) {
        await loadArtifacts();
      } else {
        setError(result.message || "Failed to delete artifacts");
      }
    } catch (err) {
      setError(`Error deleting artifacts: ${err.message}`);
    } finally {
      setArtifactsLoading(false);
    }
  };

  const handleScanStorage = async () => {
    try {
      setArtifactsLoading(true);
      setError("");

      const result = await makeZoneweaverAPIRequest(
        server.hostname,
        server.port,
        server.protocol,
        "artifacts/scan",
        "POST",
        {
          verify_checksums: false,
          remove_orphaned: false
        }
      );

      if (result.success) {
        // Show success message and refresh after a delay to allow scan to process
        setTimeout(() => {
          loadArtifacts();
        }, 3000);
      } else {
        setError(result.message || "Failed to start storage scan");
      }
    } catch (err) {
      setError(`Error starting storage scan: ${err.message}`);
    } finally {
      setArtifactsLoading(false);
    }
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handlePaginationChange = (newOffset) => {
    setArtifactsPagination(prev => ({
      ...prev,
      offset: newOffset
    }));
    loadArtifacts(false);
  };

  // Handler for clicking on storage path name to filter artifacts
  const handleStoragePathClick = (storagePath) => {
    // Switch to artifacts tab
    setActiveTab("artifacts");
    
    // Set filter to show only artifacts from this storage location
    setFilters(prev => ({
      ...prev,
      storage_location: storagePath.id,
      search: "", // Clear other filters for better UX
      type: ""
    }));

    // Reset pagination
    setArtifactsPagination(prev => ({
      ...prev,
      offset: 0
    }));
  };

  const clearError = () => setError("");

  if (!server) {
    return (
      <div className="notification is-info">
        <p>No server selected for artifact management.</p>
      </div>
    );
  }

  return (
    <div>
      {/* Sub-Tab Navigation */}
      <div className="tabs is-boxed">
        <ul>
          <li className={activeTab === "storage-paths" ? "is-active" : ""}>
            <a onClick={() => setActiveTab("storage-paths")}>
              <span className="icon is-small">
                <i className="fas fa-folder" />
              </span>
              <span>Storage Locations</span>
            </a>
          </li>
          <li className={activeTab === "artifacts" ? "is-active" : ""}>
            <a onClick={() => setActiveTab("artifacts")}>
              <span className="icon is-small">
                <i className="fas fa-compact-disc" />
              </span>
              <span>Artifacts</span>
            </a>
          </li>
        </ul>
      </div>

      {/* Error Display */}
      {error && (
        <div className="notification is-danger mb-4">
          <button className="delete" onClick={clearError} />
          <p>{error}</p>
        </div>
      )}

      {/* Tab Content */}
      <div className="mt-4">
        {/* Storage Paths Tab */}
        {activeTab === "storage-paths" && (
          <div>
            <div className="mb-4">
              <h3 className="title is-6">
                <span className="icon-text">
                  <span className="icon">
                    <i className="fas fa-folder" />
                  </span>
                  <span>Storage Locations</span>
                </span>
              </h3>
              <p className="content">
                Configure designated storage locations for ISO files and VM artifacts on <strong>{server.hostname}</strong>.
              </p>
            </div>

            <div className="box">
              <div className="level is-mobile mb-4">
                <div className="level-left">
                  <h4 className="title is-6">
                    Storage Paths ({storagePaths.length})
                    {storagePathsLoading && (
                      <span className="ml-2">
                        <i className="fas fa-spinner fa-spin" />
                      </span>
                    )}
                  </h4>
                </div>
                <div className="level-right">
                  <div className="field is-grouped">
                    <p className="control">
                      <button
                        className="button is-info"
                        onClick={loadStoragePaths}
                        disabled={storagePathsLoading}
                      >
                        <span className="icon">
                          <i className="fas fa-sync-alt" />
                        </span>
                        <span>Refresh</span>
                      </button>
                    </p>
                    <p className="control">
                      <button
                        className="button is-primary"
                        onClick={() => setShowStoragePathCreateModal(true)}
                        disabled={storagePathsLoading}
                      >
                        <span className="icon">
                          <i className="fas fa-plus" />
                        </span>
                        <span>Create Storage Path</span>
                      </button>
                    </p>
                  </div>
                </div>
              </div>

              <StoragePathTable
                storagePaths={storagePaths}
                loading={storagePathsLoading}
                onEdit={handleStoragePathEdit}
                onDelete={handleStoragePathDelete}
                onToggle={handleStoragePathToggle}
                onNameClick={handleStoragePathClick}
              />
            </div>
          </div>
        )}

        {/* Artifacts Tab */}
        {activeTab === "artifacts" && (
          <div>
            <div className="mb-4">
              <h3 className="title is-6">
                <span className="icon-text">
                  <span className="icon">
                    <i className="fas fa-compact-disc" />
                  </span>
                  <span>Artifacts</span>
                </span>
              </h3>
              <p className="content">
                Manage ISO files, VM images, and other artifacts stored on <strong>{server.hostname}</strong>.
              </p>
            </div>

            {/* Filters */}
            <ArtifactFilters
              filters={filters}
              storagePaths={storagePaths}
              onFilterChange={handleFilterChange}
              onRefresh={() => loadArtifacts(true)}
              onScan={handleScanStorage}
              onUpload={() => setShowArtifactUploadModal(true)}
              onDownload={() => setShowArtifactDownloadModal(true)}
              loading={artifactsLoading}
            />

            {/* Artifacts Table */}
            <div className="box">
              <ArtifactTable
                artifacts={artifacts}
                pagination={artifactsPagination}
                loading={artifactsLoading}
                onDetails={handleArtifactDetails}
                onDelete={handleArtifactDelete}
                onPaginationChange={handlePaginationChange}
                onSort={(sortBy, sortOrder) => {
                  handleFilterChange("sort_by", sortBy);
                  handleFilterChange("sort_order", sortOrder);
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {showStoragePathCreateModal && (
        <StoragePathCreateModal
          server={server}
          onClose={() => setShowStoragePathCreateModal(false)}
          onSuccess={handleStoragePathCreate}
          onError={setError}
        />
      )}

      {showStoragePathEditModal && selectedStoragePath && (
        <StoragePathEditModal
          server={server}
          storagePath={selectedStoragePath}
          onClose={() => {
            setShowStoragePathEditModal(false);
            setSelectedStoragePath(null);
          }}
          onSuccess={handleStoragePathEditComplete}
          onError={setError}
        />
      )}

      {showArtifactUploadModal && (
        <ArtifactUploadModal
          server={server}
          storagePaths={storagePaths}
          onClose={() => setShowArtifactUploadModal(false)}
          onSuccess={() => {
            setShowArtifactUploadModal(false);
            loadArtifacts(true);
          }}
          onError={setError}
        />
      )}

      {showArtifactDownloadModal && (
        <ArtifactDownloadModal
          server={server}
          storagePaths={storagePaths}
          onClose={() => setShowArtifactDownloadModal(false)}
          onSuccess={() => {
            setShowArtifactDownloadModal(false);
            loadArtifacts(true);
          }}
          onError={setError}
        />
      )}

      {showArtifactDetailsModal && selectedArtifact && artifactDetails && (
        <ArtifactDetailsModal
          artifact={selectedArtifact}
          details={artifactDetails}
          server={server}
          onClose={() => {
            setShowArtifactDetailsModal(false);
            setSelectedArtifact(null);
            setArtifactDetails(null);
          }}
        />
      )}
    </div>
  );
};

export default ArtifactManagement;
