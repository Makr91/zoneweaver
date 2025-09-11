import React, { useState } from "react";

const ArtifactTable = ({
  artifacts,
  activeDownloads,
  pagination,
  loading,
  onDetails,
  onDelete,
  onPaginationChange,
  onSort,
  onCancelDownload
}) => {
  const [selectedArtifacts, setSelectedArtifacts] = useState(new Set());
  const [sortBy, setSortBy] = useState("filename");
  const [sortOrder, setSortOrder] = useState("asc");

  const formatSize = (bytes) => {
    if (!bytes) return "0 B";
    
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString() + " " + date.toLocaleTimeString();
    } catch (err) {
      return dateString;
    }
  };

  const getTypeIcon = (fileType, extension) => {
    const type = fileType?.toLowerCase() || extension?.toLowerCase();
    
    if (type === "iso" || extension?.toLowerCase() === ".iso") {
      return <i className="fas fa-compact-disc has-text-info" />;
    } else if (type === "image" || [".vmdk", ".vhd", ".vhdx", ".qcow2", ".img"].includes(extension?.toLowerCase())) {
      return <i className="fas fa-hdd has-text-warning" />;
    } else {
      return <i className="fas fa-file has-text-grey" />;
    }
  };

  const getTypeTag = (fileType, extension) => {
    const type = fileType?.toLowerCase();
    
    if (type === "iso") {
      return <span className="tag is-info is-small">ISO</span>;
    } else if (type === "image") {
      return <span className="tag is-warning is-small">Image</span>;
    } else {
      return <span className="tag is-light is-small">{extension || "File"}</span>;
    }
  };

  const getChecksumStatus = (artifact) => {
    if (artifact.checksum_verified === true) {
      return (
        <span className="icon has-text-success" title="Checksum verified">
          <i className="fas fa-check-circle" />
        </span>
      );
    } else if (artifact.checksum_verified === false) {
      return (
        <span className="icon has-text-danger" title="Checksum mismatch">
          <i className="fas fa-times-circle" />
        </span>
      );
    } else if (artifact.calculated_checksum && !artifact.user_provided_checksum) {
      return (
        <span className="icon has-text-info" title="Checksum calculated">
          <i className="fas fa-info-circle" />
        </span>
      );
    } else {
      return (
        <span className="icon has-text-grey" title="No checksum">
          <i className="fas fa-minus-circle" />
        </span>
      );
    }
  };

  const handleSort = (field) => {
    let newOrder = "asc";
    if (sortBy === field && sortOrder === "asc") {
      newOrder = "desc";
    }
    
    setSortBy(field);
    setSortOrder(newOrder);
    onSort(field, newOrder);
  };

  const getSortIcon = (field) => {
    if (sortBy !== field) {
      return <i className="fas fa-sort has-text-grey-light" />;
    }
    
    return sortOrder === "asc" ? (
      <i className="fas fa-sort-up has-text-primary" />
    ) : (
      <i className="fas fa-sort-down has-text-primary" />
    );
  };

  const handleSelectArtifact = (artifactId) => {
    const newSelected = new Set(selectedArtifacts);
    if (newSelected.has(artifactId)) {
      newSelected.delete(artifactId);
    } else {
      newSelected.add(artifactId);
    }
    setSelectedArtifacts(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedArtifacts.size === artifacts.length) {
      setSelectedArtifacts(new Set());
    } else {
      setSelectedArtifacts(new Set(artifacts.map(a => a.id)));
    }
  };

  const handleBulkDelete = () => {
    if (selectedArtifacts.size > 0) {
      onDelete([...selectedArtifacts]);
      setSelectedArtifacts(new Set());
    }
  };

  const getDownloadStatusIcon = (status) => {
    switch (status) {
      case 'queued':
        return <i className="fas fa-clock has-text-info" />;
      case 'running':
        return <i className="fas fa-spinner fa-spin has-text-primary" />;
      case 'completed':
        return <i className="fas fa-check-circle has-text-success" />;
      case 'failed':
        return <i className="fas fa-times-circle has-text-danger" />;
      default:
        return <i className="fas fa-question-circle has-text-grey" />;
    }
  };

  const getDownloadStatusText = (status) => {
    switch (status) {
      case 'queued':
        return 'Queued';
      case 'running':
        return 'Downloading...';
      case 'completed':
        return 'Completed';
      case 'failed':
        return 'Failed';
      default:
        return status;
    }
  };

  const getDownloadStatusTag = (status) => {
    switch (status) {
      case 'queued':
        return <span className="tag is-info is-small">Queued</span>;
      case 'running':
        return <span className="tag is-primary is-small">Downloading</span>;
      case 'completed':
        return <span className="tag is-success is-small">Completed</span>;
      case 'failed':
        return <span className="tag is-danger is-small">Failed</span>;
      default:
        return <span className="tag is-light is-small">{status}</span>;
    }
  };

  // Convert activeDownloads Map to array for rendering
  const activeDownloadsList = activeDownloads ? Array.from(activeDownloads.values()) : [];

  const renderPagination = () => {
    if (!pagination || pagination.total <= pagination.limit) {
      return null;
    }

    const currentPage = Math.floor(pagination.offset / pagination.limit) + 1;
    const totalPages = Math.ceil(pagination.total / pagination.limit);
    const hasNext = pagination.has_more;
    const hasPrev = pagination.offset > 0;

    return (
      <nav className="pagination is-centered mt-4" role="navigation" aria-label="pagination">
        <button
          className="pagination-previous"
          disabled={!hasPrev || loading}
          onClick={() => onPaginationChange(Math.max(0, pagination.offset - pagination.limit))}
        >
          Previous
        </button>
        <button
          className="pagination-next"
          disabled={!hasNext || loading}
          onClick={() => onPaginationChange(pagination.offset + pagination.limit)}
        >
          Next
        </button>
        <ul className="pagination-list">
          <li>
            <span className="pagination-ellipsis">
              Page {currentPage} of {totalPages} ({pagination.total} total)
            </span>
          </li>
        </ul>
      </nav>
    );
  };

  if (loading && artifacts.length === 0 && activeDownloadsList.length === 0) {
    return (
      <div className="has-text-centered p-4">
        <span className="icon is-large">
          <i className="fas fa-spinner fa-spin fa-2x" />
        </span>
        <p className="mt-2">Loading artifacts...</p>
      </div>
    );
  }

  if (artifacts.length === 0 && activeDownloadsList.length === 0) {
    return (
      <div className="has-text-centered p-4">
        <span className="icon is-large has-text-grey">
          <i className="fas fa-compact-disc fa-2x" />
        </span>
        <p className="mt-2 has-text-grey">No artifacts found</p>
        <p className="has-text-grey is-size-7">
          Upload files or download from URLs to get started
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Bulk Actions */}
      {selectedArtifacts.size > 0 && (
        <div className="notification is-light mb-4">
          <div className="level is-mobile">
            <div className="level-left">
              <span className="level-item">
                <strong>{selectedArtifacts.size}</strong> artifacts selected
              </span>
            </div>
            <div className="level-right">
              <div className="level-item">
                <button
                  className="button is-danger is-small"
                  onClick={handleBulkDelete}
                  disabled={loading}
                >
                  <span className="icon is-small">
                    <i className="fas fa-trash" />
                  </span>
                  <span>Delete Selected</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="table-container">
        <table className="table is-fullwidth is-hoverable">
          <thead>
            <tr>
              <th width="30">
                <label className="checkbox">
                  <input
                    type="checkbox"
                    checked={selectedArtifacts.size === artifacts.length && artifacts.length > 0}
                    onChange={handleSelectAll}
                  />
                </label>
              </th>
              <th 
                className="is-clickable" 
                onClick={() => handleSort("filename")}
                title="Click to sort by filename"
              >
                <span className="icon-text">
                  <span>Filename</span>
                  <span className="icon is-small ml-1">
                    {getSortIcon("filename")}
                  </span>
                </span>
              </th>
              <th>Type</th>
              <th 
                className="is-clickable" 
                onClick={() => handleSort("size")}
                title="Click to sort by size"
              >
                <span className="icon-text">
                  <span>Size</span>
                  <span className="icon is-small ml-1">
                    {getSortIcon("size")}
                  </span>
                </span>
              </th>
              <th>Checksum</th>
              <th>Storage Location</th>
              <th 
                className="is-clickable" 
                onClick={() => handleSort("discovered_at")}
                title="Click to sort by date"
              >
                <span className="icon-text">
                  <span>Added</span>
                  <span className="icon is-small ml-1">
                    {getSortIcon("discovered_at")}
                  </span>
                </span>
              </th>
              <th width="150">Actions</th>
            </tr>
          </thead>
          <tbody>
            {/* Active Downloads - Placeholder Rows */}
            {activeDownloadsList.map((download) => (
              <tr key={`download-${download.taskId}`} className="has-background-light">
                <td>
                  <span className="icon has-text-grey">
                    <i className="fas fa-clock" />
                  </span>
                </td>
                <td>
                  <div className="is-flex is-align-items-center">
                    <span className="icon mr-2">
                      {getDownloadStatusIcon(download.status)}
                    </span>
                    <div>
                      <div className="has-text-weight-semibold has-text-grey">
                        {download.filename || "Downloading..."}
                      </div>
                      <div className="is-size-7 has-text-grey">
                        <i className="fas fa-download mr-1" />
                        {download.url && (
                          <span title={download.url}>
                            {download.url.length > 50 ? 
                              `${download.url.substring(0, 47)}...` : 
                              download.url
                            }
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </td>
                <td>
                  {getDownloadStatusTag(download.status)}
                </td>
                <td>
                  {download.progress_info && download.progress_info.total_mb ? (
                    <div>
                      <div className="has-text-weight-semibold">
                        {formatSize(download.progress_info.downloaded_mb * 1024 * 1024)} / {formatSize(download.progress_info.total_mb * 1024 * 1024)}
                      </div>
                      {download.progress_info.speed_kbps && (
                        <div className="is-size-7 has-text-grey">
                          {Math.round(download.progress_info.speed_kbps / 1024)} MB/s
                        </div>
                      )}
                    </div>
                  ) : download.progress_info && download.progress_info.file_size_mb ? (
                    <div className="has-text-weight-semibold">
                      {formatSize(download.progress_info.file_size_mb * 1024 * 1024)}
                    </div>
                  ) : (
                    <span className="has-text-grey">
                      {download.status === 'running' ? 'Processing...' : 'Pending'}
                    </span>
                  )}
                </td>
                <td>
                  <span className="icon has-text-grey" title="Download in progress">
                    <i className="fas fa-clock" />
                  </span>
                </td>
                <td>
                  {download.storage_location && (
                    <div>
                      <div className="has-text-weight-semibold is-size-7 has-text-grey">
                        {download.storage_location.name}
                      </div>
                      <div className="is-size-7 has-text-grey">
                        {download.storage_location.path}
                      </div>
                    </div>
                  )}
                </td>
                <td>
                  <span className="is-size-7 has-text-grey">
                    {formatDate(download.created_at)}
                  </span>
                </td>
                <td>
                  <div className="buttons are-small">
                    {download.status === 'failed' && download.error_message && (
                      <button
                        className="button is-danger is-small"
                        title={`Download failed: ${download.error_message}`}
                        disabled
                      >
                        <span className="icon is-small">
                          <i className="fas fa-exclamation-circle" />
                        </span>
                      </button>
                    )}
                    
                    {(['queued', 'running'].includes(download.status)) && onCancelDownload && (
                      <button
                        className="button is-warning is-small"
                        onClick={() => onCancelDownload(download.taskId)}
                        title="Cancel download"
                      >
                        <span className="icon is-small">
                          <i className="fas fa-times" />
                        </span>
                      </button>
                    )}

                    <span className="tag is-small has-text-grey">
                      {getDownloadStatusText(download.status)}
                    </span>
                  </div>
                </td>
              </tr>
            ))}

            {/* Regular Artifacts */}
            {artifacts.map((artifact) => (
              <tr key={artifact.id}>
                <td>
                  <label className="checkbox">
                    <input
                      type="checkbox"
                      checked={selectedArtifacts.has(artifact.id)}
                      onChange={() => handleSelectArtifact(artifact.id)}
                    />
                  </label>
                </td>
                <td>
                  <div className="is-flex is-align-items-center">
                    <span className="icon mr-2">
                      {getTypeIcon(artifact.file_type, artifact.extension)}
                    </span>
                    <div>
                      <div className="has-text-weight-semibold">
                        {artifact.filename}
                      </div>
                      {artifact.source_url && (
                        <div className="is-size-7 has-text-grey">
                          <i className="fas fa-download mr-1" />
                          Downloaded from URL
                        </div>
                      )}
                    </div>
                  </div>
                </td>
                <td>
                  {getTypeTag(artifact.file_type, artifact.extension)}
                </td>
                <td>
                  <span className="has-text-weight-semibold">
                    {formatSize(artifact.size)}
                  </span>
                </td>
                <td>
                  <div className="is-flex is-align-items-center">
                    {getChecksumStatus(artifact)}
                    {artifact.checksum_algorithm && (
                      <span className="tag is-small is-light ml-1">
                        {artifact.checksum_algorithm.toUpperCase()}
                      </span>
                    )}
                  </div>
                </td>
                <td>
                  {artifact.storage_location && (
                    <div>
                      <div className="has-text-weight-semibold is-size-7">
                        {artifact.storage_location.name}
                      </div>
                      <div className="is-size-7 has-text-grey">
                        {artifact.storage_location.path}
                      </div>
                    </div>
                  )}
                </td>
                <td>
                  <span className="is-size-7">
                    {formatDate(artifact.discovered_at)}
                  </span>
                </td>
                <td>
                  <div className="buttons are-small">
                    <button
                      className="button"
                      onClick={() => onDetails(artifact)}
                      disabled={loading}
                      title="View details"
                    >
                      <span className="icon is-small">
                        <i className="fas fa-info-circle" />
                      </span>
                    </button>

                    <button
                      className="button is-danger"
                      onClick={() => onDelete([artifact.id])}
                      disabled={loading}
                      title="Delete artifact"
                    >
                      <span className="icon is-small">
                        <i className="fas fa-trash" />
                      </span>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {renderPagination()}
    </div>
  );
};

export default ArtifactTable;
