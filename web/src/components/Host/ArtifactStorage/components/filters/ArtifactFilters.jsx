import { useEffect, useState } from "react";

import { useDebounce } from "../../../../../utils/debounce";

const ArtifactFilters = ({
  filters,
  storagePaths,
  onFilterChange,
  onRefresh,
  onScan,
  onUpload,
  onDownload,
  loading,
}) => {
  const [localSearch, setLocalSearch] = useState(filters.search || "");

  // Debounce search input to avoid excessive API calls
  const debouncedSearch = useDebounce(localSearch, 500);

  useEffect(() => {
    onFilterChange("search", debouncedSearch);
  }, [debouncedSearch, onFilterChange]);

  const handleSearchChange = (e) => {
    setLocalSearch(e.target.value);
  };

  const handleTypeChange = (e) => {
    onFilterChange("type", e.target.value);
  };

  const handleStorageLocationChange = (e) => {
    onFilterChange("storage_location", e.target.value);
  };

  const clearFilters = () => {
    setLocalSearch("");
    onFilterChange("search", "");
    onFilterChange("type", "");
    onFilterChange("storage_location", "");
  };

  const hasActiveFilters =
    filters.search || filters.type || filters.storage_location;

  return (
    <div className="box mb-4">
      <div className="columns">
        <div className="column">
          <div className="field">
            <label className="label">Search Artifacts</label>
            <div className="control has-icons-left">
              <input
                className="input"
                type="text"
                placeholder="Search by filename..."
                value={localSearch}
                onChange={handleSearchChange}
              />
              <span className="icon is-small is-left">
                <i className="fas fa-search" />
              </span>
            </div>
          </div>
        </div>
        <div className="column">
          <div className="field">
            <label className="label">Filter by Type</label>
            <div className="control">
              <div className="select is-fullwidth">
                <select value={filters.type || ""} onChange={handleTypeChange}>
                  <option value="">All Types</option>
                  <option value="iso">ISO Files</option>
                  <option value="image">VM Images</option>
                </select>
              </div>
            </div>
          </div>
        </div>
        <div className="column">
          <div className="field">
            <label className="label">Filter by Location</label>
            <div className="control">
              <div className="select is-fullwidth">
                <select
                  value={filters.storage_location || ""}
                  onChange={handleStorageLocationChange}
                >
                  <option value="">All Locations</option>
                  {storagePaths.map((path) => (
                    <option key={path.id} value={path.id}>
                      {path.name} ({path.type})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
        <div className="column is-narrow">
          <div className="field">
            <label className="label">&nbsp;</label>
            <div className="control">
              <button
                className="button is-info"
                onClick={onRefresh}
                disabled={loading}
                title="Refresh artifact list"
              >
                <span className="icon">
                  <i className="fas fa-sync-alt" />
                </span>
                <span>Refresh</span>
              </button>
            </div>
          </div>
        </div>
        <div className="column is-narrow">
          <div className="field">
            <label className="label">&nbsp;</label>
            <div className="control">
              <button
                className="button"
                onClick={clearFilters}
                disabled={loading || !hasActiveFilters}
                title="Clear all filters"
              >
                <span className="icon">
                  <i className="fas fa-times" />
                </span>
                <span>Clear</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons Row */}
      <div className="columns">
        <div className="column">
          <div className="field is-grouped">
            <p className="control">
              <button
                className="button is-primary"
                onClick={onUpload}
                disabled={loading || storagePaths.length === 0}
                title={
                  storagePaths.length === 0
                    ? "No storage locations configured"
                    : "Upload files from your computer"
                }
              >
                <span className="icon">
                  <i className="fas fa-upload" />
                </span>
                <span>Upload Files</span>
              </button>
            </p>
            <p className="control">
              <button
                className="button is-success"
                onClick={onDownload}
                disabled={loading || storagePaths.length === 0}
                title={
                  storagePaths.length === 0
                    ? "No storage locations configured"
                    : "Download files from URLs"
                }
              >
                <span className="icon">
                  <i className="fas fa-download" />
                </span>
                <span>Download from URL</span>
              </button>
            </p>
            <p className="control">
              <button
                className="button is-warning"
                onClick={onScan}
                disabled={loading}
                title="Scan storage locations for new or changed files"
              >
                <span className="icon">
                  <i className="fas fa-search" />
                </span>
                <span>Scan Storage</span>
              </button>
            </p>
          </div>
        </div>

        {/* Storage Status Info */}
        <div className="column is-narrow">
          <div className="field">
            <div className="tags">
              <span className="tag is-light">
                <span className="icon is-small">
                  <i className="fas fa-folder" />
                </span>
                <span>
                  {storagePaths.length} storage location
                  {storagePaths.length !== 1 ? "s" : ""}
                </span>
              </span>
              {storagePaths.length > 0 && (
                <span className="tag is-light">
                  <span className="icon is-small">
                    <i className="fas fa-check" />
                  </span>
                  <span>
                    {storagePaths.filter((p) => p.enabled).length} enabled
                  </span>
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* No Storage Paths Warning */}
      {storagePaths.length === 0 && (
        <div className="notification is-warning">
          <p>
            <strong>No storage locations configured.</strong>
            You need to create at least one storage location before you can
            upload or download artifacts. Switch to the "Storage Locations" tab
            to get started.
          </p>
        </div>
      )}

      {/* Disabled Storage Paths Warning */}
      {storagePaths.length > 0 && storagePaths.every((p) => !p.enabled) && (
        <div className="notification is-warning">
          <p>
            <strong>All storage locations are disabled.</strong>
            Enable at least one storage location to upload or download
            artifacts.
          </p>
        </div>
      )}

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="notification is-light">
          <p className="has-text-weight-semibold mb-2">Active Filters:</p>
          <div className="tags">
            {filters.search && (
              <span className="tag is-info">Search: "{filters.search}"</span>
            )}
            {filters.type && (
              <span className="tag is-info">
                Type: {filters.type.toUpperCase()}
              </span>
            )}
            {filters.storage_location && (
              <span className="tag is-info">
                Location:{" "}
                {storagePaths.find((p) => p.id === filters.storage_location)
                  ?.name || filters.storage_location}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ArtifactFilters;
