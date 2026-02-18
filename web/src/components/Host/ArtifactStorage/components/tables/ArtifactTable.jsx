import PropTypes from "prop-types";
import { useState } from "react";

import ArtifactDownloadRow from "./ArtifactDownloadRow";
import ArtifactRow from "./ArtifactRow";

const ArtifactTable = ({
  artifacts,
  activeDownloads,
  pagination,
  loading,
  onDetails,
  onDelete,
  onMove,
  onCopy,
  onPaginationChange,
  onSort,
  onCancelDownload,
}) => {
  const [selectedArtifacts, setSelectedArtifacts] = useState(new Set());
  const [sortBy, setSortBy] = useState("filename");
  const [sortOrder, setSortOrder] = useState("asc");

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
      setSelectedArtifacts(new Set(artifacts.map((a) => a.id)));
    }
  };

  const handleBulkDelete = () => {
    if (selectedArtifacts.size > 0) {
      onDelete([...selectedArtifacts]);
      setSelectedArtifacts(new Set());
    }
  };

  const activeDownloadsList = activeDownloads
    ? Array.from(activeDownloads.values())
    : [];

  const renderPagination = () => {
    if (!pagination || pagination.total <= pagination.limit) {
      return null;
    }

    const currentPage = Math.floor(pagination.offset / pagination.limit) + 1;
    const totalPages = Math.ceil(pagination.total / pagination.limit);
    const hasNext = pagination.has_more;
    const hasPrev = pagination.offset > 0;

    return (
      <nav
        className="pagination is-centered mt-4"
        role="navigation"
        aria-label="pagination"
      >
        <button
          className="pagination-previous"
          disabled={!hasPrev || loading}
          onClick={() =>
            onPaginationChange(
              Math.max(0, pagination.offset - pagination.limit)
            )
          }
        >
          Previous
        </button>
        <button
          className="pagination-next"
          disabled={!hasNext || loading}
          onClick={() =>
            onPaginationChange(pagination.offset + pagination.limit)
          }
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
                    checked={
                      selectedArtifacts.size === artifacts.length &&
                      artifacts.length > 0
                    }
                    onChange={handleSelectAll}
                  />
                  <span className="is-sr-only">Select all artifacts</span>
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
            {activeDownloadsList.map((download) => (
              <ArtifactDownloadRow
                key={download.taskId}
                download={download}
                onCancelDownload={onCancelDownload}
              />
            ))}

            {artifacts.map((artifact) => (
              <ArtifactRow
                key={artifact.id}
                artifact={artifact}
                selected={selectedArtifacts.has(artifact.id)}
                loading={loading}
                onSelect={handleSelectArtifact}
                onDetails={onDetails}
                onDelete={onDelete}
                onMove={onMove}
                onCopy={onCopy}
              />
            ))}
          </tbody>
        </table>
      </div>

      {renderPagination()}
    </div>
  );
};

ArtifactTable.propTypes = {
  artifacts: PropTypes.array.isRequired,
  activeDownloads: PropTypes.instanceOf(Map),
  pagination: PropTypes.object,
  loading: PropTypes.bool.isRequired,
  onDetails: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  onMove: PropTypes.func.isRequired,
  onCopy: PropTypes.func.isRequired,
  onPaginationChange: PropTypes.func.isRequired,
  onSort: PropTypes.func.isRequired,
  onCancelDownload: PropTypes.func,
};

export default ArtifactTable;
