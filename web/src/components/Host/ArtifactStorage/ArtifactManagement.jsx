import PropTypes from "prop-types";
import { useState, useEffect, useCallback } from "react";

import { useServers } from "../../../contexts/ServerContext";
import { ConfirmModal } from "../../common";

import ArtifactStorageModals from "./ArtifactStorageModals";
import ArtifactFilters from "./components/filters/ArtifactFilters";
import ArtifactTable from "./components/tables/ArtifactTable";
import StoragePathTable from "./components/tables/StoragePathTable";
import useArtifactDownloads from "./useArtifactDownloads";

const getDownloadTagClass = (status) => {
  if (status === "running") {
    return "is-primary";
  }
  if (status === "queued") {
    return "is-info";
  }
  if (status === "failed") {
    return "is-danger";
  }
  return "is-light";
};

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
    has_more: false,
  });

  // Filters state
  const [filters, setFilters] = useState({
    search: "",
    type: "",
    storage_location: "",
    sort_by: "filename",
    sort_order: "asc",
  });

  // Modal states
  const [showStoragePathCreateModal, setShowStoragePathCreateModal] =
    useState(false);
  const [showStoragePathEditModal, setShowStoragePathEditModal] =
    useState(false);
  const [showArtifactUploadModal, setShowArtifactUploadModal] = useState(false);
  const [showArtifactDownloadModal, setShowArtifactDownloadModal] =
    useState(false);
  const [showArtifactDetailsModal, setShowArtifactDetailsModal] =
    useState(false);
  const [showArtifactMoveModal, setShowArtifactMoveModal] = useState(false);
  const [showArtifactCopyModal, setShowArtifactCopyModal] = useState(false);
  const [selectedStoragePath, setSelectedStoragePath] = useState(null);
  const [selectedArtifact, setSelectedArtifact] = useState(null);
  const [artifactDetails, setArtifactDetails] = useState(null);

  // Confirm modal states
  const [deleteStoragePathTarget, setDeleteStoragePathTarget] = useState(null);
  const [deleteArtifactIds, setDeleteArtifactIds] = useState(null);

  // General state
  const [error, setError] = useState("");

  const { makeZoneweaverAPIRequest } = useServers();

  const loadArtifacts = useCallback(
    async (resetOffset = true) => {
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
          sort_order: filters.sort_order,
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
    },
    [
      server,
      makeZoneweaverAPIRequest,
      artifactsPagination.limit,
      artifactsPagination.offset,
      filters.sort_by,
      filters.sort_order,
      filters.search,
      filters.type,
      filters.storage_location,
    ]
  );

  const {
    activeDownloads,
    activeDownloadsList,
    startDownloadTracking,
    stopDownloadTracking,
  } = useArtifactDownloads({
    server,
    makeZoneweaverAPIRequest,
    onRefresh: () => loadArtifacts(false),
  });

  const loadStoragePaths = useCallback(async () => {
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
  }, [server, makeZoneweaverAPIRequest]);

  useEffect(() => {
    if (activeTab === "storage-paths") {
      loadStoragePaths();
    } else if (activeTab === "artifacts") {
      loadArtifacts(true);
    }
  }, [activeTab, loadArtifacts, loadStoragePaths]);

  useEffect(() => {
    if (activeTab === "artifacts") {
      loadArtifacts(true);
    }
  }, [
    activeTab,
    loadArtifacts,
    filters.search,
    filters.type,
    filters.storage_location,
    filters.sort_by,
    filters.sort_order,
  ]);

  const handleStoragePathDelete = async () => {
    if (!deleteStoragePathTarget) {
      return;
    }

    try {
      setStoragePathsLoading(true);
      setError("");

      const result = await makeZoneweaverAPIRequest(
        server.hostname,
        server.port,
        server.protocol,
        `artifacts/storage/paths/${deleteStoragePathTarget.id}`,
        "DELETE",
        {
          recursive: false,
          remove_db_records: true,
          force: false,
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
      setDeleteStoragePathTarget(null);
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
        { enabled: !storagePath.enabled }
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

  const handleArtifactDelete = async () => {
    if (!deleteArtifactIds) {
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
          artifact_ids: deleteArtifactIds,
          delete_files: true,
          force: false,
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
      setDeleteArtifactIds(null);
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
        { verify_checksums: false, remove_orphaned: false }
      );

      if (result.success) {
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
    setFilters((prev) => ({ ...prev, [field]: value }));
  };

  const handlePaginationChange = (newOffset) => {
    setArtifactsPagination((prev) => ({ ...prev, offset: newOffset }));
    loadArtifacts(false);
  };

  const handleStoragePathClick = (storagePath) => {
    setActiveTab("artifacts");
    setFilters((prev) => ({
      ...prev,
      storage_location: storagePath.id,
      search: "",
      type: "",
    }));
    setArtifactsPagination((prev) => ({ ...prev, offset: 0 }));
  };

  const handleUploadSuccess = (results) => {
    setShowArtifactUploadModal(false);
    results.forEach((result) => {
      if (result.success && result.task_id && result.data) {
        const storageLocation = storagePaths.find(
          (sp) => sp.id === result.data.storage_location?.id
        );
        startDownloadTracking(result.task_id, {
          taskId: result.task_id,
          filename: result.data.filename || result.file,
          isUpload: true,
          storage_location: result.data.storage_location || storageLocation,
          created_at: new Date().toISOString(),
        });
      }
    });
    setActiveTab("artifacts");
  };

  const handleDownloadSuccess = (result) => {
    setShowArtifactDownloadModal(false);
    if (result.task_id) {
      const storageLocation = storagePaths.find(
        (sp) => sp.id === result.storage_location?.id
      );
      startDownloadTracking(result.task_id, {
        taskId: result.task_id,
        filename: result.filename,
        url: result.url,
        storage_location: result.storage_location || storageLocation,
        created_at: new Date().toISOString(),
      });
      setActiveTab("artifacts");
    }
  };

  if (!server) {
    return (
      <div className="notification is-info">
        <p>No server selected for artifact management.</p>
      </div>
    );
  }

  return (
    <div>
      <ConfirmModal
        isOpen={deleteStoragePathTarget !== null}
        onClose={() => setDeleteStoragePathTarget(null)}
        onConfirm={handleStoragePathDelete}
        title="Delete Storage Path"
        message={`Are you sure you want to delete storage path "${deleteStoragePathTarget?.name}"? This will remove the storage location but not the files themselves.`}
        confirmText="Delete"
        confirmVariant="is-danger"
        icon="fas fa-trash"
        loading={storagePathsLoading}
      />

      <ConfirmModal
        isOpen={deleteArtifactIds !== null}
        onClose={() => setDeleteArtifactIds(null)}
        onConfirm={handleArtifactDelete}
        title="Delete Artifacts"
        message={`Are you sure you want to delete ${deleteArtifactIds?.length || 0} artifact(s)? This will permanently remove the files from storage.`}
        confirmText="Delete"
        confirmVariant="is-danger"
        icon="fas fa-trash"
        loading={artifactsLoading}
      />

      {/* Sub-Tab Navigation */}
      <div className="tabs is-boxed mb-0">
        <ul>
          <li className={activeTab === "storage-paths" ? "is-active" : ""}>
            <button
              type="button"
              className="button is-ghost"
              onClick={() => setActiveTab("storage-paths")}
            >
              <span className="icon is-small">
                <i className="fas fa-folder" />
              </span>
              <span>Storage Locations</span>
            </button>
          </li>
          <li className={activeTab === "artifacts" ? "is-active" : ""}>
            <button
              type="button"
              className="button is-ghost"
              onClick={() => setActiveTab("artifacts")}
            >
              <span className="icon is-small">
                <i className="fas fa-compact-disc" />
              </span>
              <span>Artifacts</span>
            </button>
          </li>
        </ul>
      </div>

      {error && (
        <div className="notification is-danger mb-4">
          <button className="delete" onClick={() => setError("")} />
          <p>{error}</p>
        </div>
      )}

      <div className="mt-4">
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
                Configure designated storage locations for ISO files and VM
                artifacts on <strong>{server.hostname}</strong>.
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
                onEdit={(sp) => {
                  setSelectedStoragePath(sp);
                  setShowStoragePathEditModal(true);
                }}
                onDelete={setDeleteStoragePathTarget}
                onToggle={handleStoragePathToggle}
                onNameClick={handleStoragePathClick}
              />
            </div>
          </div>
        )}

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
                Manage ISO files, VM images, and other artifacts stored on{" "}
                <strong>{server.hostname}</strong>.
              </p>
            </div>

            {activeDownloadsList.length > 0 && (
              <div className="notification is-info mb-4">
                <div className="level is-mobile">
                  <div className="level-left">
                    <div className="level-item">
                      <span className="icon">
                        <i className="fas fa-download" />
                      </span>
                      <span className="ml-2">
                        <strong>{activeDownloadsList.length}</strong> download
                        {activeDownloadsList.length !== 1 ? "s" : ""} in
                        progress
                      </span>
                    </div>
                  </div>
                  <div className="level-right">
                    <div className="level-item">
                      <div className="tags">
                        {activeDownloadsList.map((download) => (
                          <span
                            key={download.taskId}
                            className={`tag is-small ${getDownloadTagClass(download.status)}`}
                          >
                            {download.filename || "Unknown"}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

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

            <div className="box">
              <ArtifactTable
                artifacts={artifacts}
                activeDownloads={activeDownloads}
                pagination={artifactsPagination}
                loading={artifactsLoading}
                onDetails={handleArtifactDetails}
                onDelete={setDeleteArtifactIds}
                onMove={(artifact) => {
                  setSelectedArtifact(artifact);
                  setShowArtifactMoveModal(true);
                }}
                onCopy={(artifact) => {
                  setSelectedArtifact(artifact);
                  setShowArtifactCopyModal(true);
                }}
                onPaginationChange={handlePaginationChange}
                onSort={(sortBy, sortOrder) => {
                  handleFilterChange("sort_by", sortBy);
                  handleFilterChange("sort_order", sortOrder);
                }}
                onCancelDownload={stopDownloadTracking}
              />
            </div>
          </div>
        )}
      </div>

      <ArtifactStorageModals
        server={server}
        storagePaths={storagePaths}
        selectedStoragePath={selectedStoragePath}
        selectedArtifact={selectedArtifact}
        artifactDetails={artifactDetails}
        showStoragePathCreateModal={showStoragePathCreateModal}
        showStoragePathEditModal={showStoragePathEditModal}
        showArtifactUploadModal={showArtifactUploadModal}
        showArtifactDownloadModal={showArtifactDownloadModal}
        showArtifactDetailsModal={showArtifactDetailsModal}
        showArtifactMoveModal={showArtifactMoveModal}
        showArtifactCopyModal={showArtifactCopyModal}
        onCloseStoragePathCreate={() => setShowStoragePathCreateModal(false)}
        onSuccessStoragePathCreate={() => {
          setShowStoragePathCreateModal(false);
          loadStoragePaths();
        }}
        onCloseStoragePathEdit={() => {
          setShowStoragePathEditModal(false);
          setSelectedStoragePath(null);
        }}
        onSuccessStoragePathEdit={() => {
          setShowStoragePathEditModal(false);
          setSelectedStoragePath(null);
          loadStoragePaths();
        }}
        onCloseArtifactUpload={() => setShowArtifactUploadModal(false)}
        onSuccessArtifactUpload={handleUploadSuccess}
        onCloseArtifactDownload={() => setShowArtifactDownloadModal(false)}
        onSuccessArtifactDownload={handleDownloadSuccess}
        onCloseArtifactDetails={() => {
          setShowArtifactDetailsModal(false);
          setSelectedArtifact(null);
          setArtifactDetails(null);
        }}
        onCloseArtifactMove={() => {
          setShowArtifactMoveModal(false);
          setSelectedArtifact(null);
        }}
        onSuccessArtifactMove={() => {
          setShowArtifactMoveModal(false);
          setSelectedArtifact(null);
        }}
        onCloseArtifactCopy={() => {
          setShowArtifactCopyModal(false);
          setSelectedArtifact(null);
        }}
        onSuccessArtifactCopy={() => {
          setShowArtifactCopyModal(false);
          setSelectedArtifact(null);
        }}
        onError={setError}
        loadArtifacts={loadArtifacts}
      />
    </div>
  );
};

ArtifactManagement.propTypes = {
  server: PropTypes.object.isRequired,
};

export default ArtifactManagement;
