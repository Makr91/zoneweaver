import PropTypes from "prop-types";

const PackageFilters = ({
  filters,
  handleFilterChange,
  handleSearch,
  clearFilters,
  isSearchMode,
  loading,
  loadPackages,
}) => (
  <div className="box mb-4">
    <div className="columns">
      <div className="column">
        <div className="field">
          <label className="label" htmlFor="package-name-filter">
            Filter by Package Name
          </label>
          <div className="control">
            <input
              id="package-name-filter"
              className="input"
              type="text"
              placeholder="Enter package name pattern..."
              value={filters.pattern}
              onChange={(e) => handleFilterChange("pattern", e.target.value)}
              disabled={isSearchMode}
            />
          </div>
        </div>
      </div>
      <div className="column">
        <div className="field">
          <label className="label" htmlFor="publisher-filter">
            Filter by Publisher
          </label>
          <div className="control">
            <div className="select is-fullwidth">
              <select
                id="publisher-filter"
                value={filters.publisher}
                onChange={(e) =>
                  handleFilterChange("publisher", e.target.value)
                }
                disabled={isSearchMode}
              >
                <option value="">All Publishers</option>
                <option value="omnios">omnios</option>
                <option value="extra.omnios">extra.omnios</option>
                <option value="ooce">ooce</option>
              </select>
            </div>
          </div>
        </div>
      </div>
      <div className="column">
        <div className="field">
          <label className="label" htmlFor="status-filter">
            Filter by Status
          </label>
          <div className="control">
            <div className="select is-fullwidth">
              <select
                id="status-filter"
                value={filters.status}
                onChange={(e) => handleFilterChange("status", e.target.value)}
                disabled={isSearchMode}
              >
                <option value="">All Status</option>
                <option value="installed">Installed</option>
                <option value="frozen">Frozen</option>
                <option value="manual">Manual</option>
              </select>
            </div>
          </div>
        </div>
      </div>
      <div className="column is-narrow">
        <div className="field">
          <label className="label" htmlFor="show-all-toggle">
            Show All
          </label>
          <div className="control">
            <label className="switch is-medium" htmlFor="show-all-toggle">
              <input
                id="show-all-toggle"
                type="checkbox"
                checked={filters.showAll}
                onChange={(e) =>
                  handleFilterChange("showAll", e.target.checked)
                }
                disabled={isSearchMode}
              />
              <span className="check" />
              <span className="control-label">All Packages</span>
            </label>
          </div>
        </div>
      </div>
    </div>

    {/* Search Row */}
    <div className="columns">
      <div className="column">
        <div className="field">
          <label className="label" htmlFor="search-query-input">
            Search Available Packages
          </label>
          <div className="control has-icons-right">
            <input
              id="search-query-input"
              className="input"
              type="text"
              placeholder="Search for packages..."
              value={filters.searchQuery}
              onChange={(e) =>
                handleFilterChange("searchQuery", e.target.value)
              }
              onKeyPress={(e) => e.key === "Enter" && handleSearch()}
            />
            <span className="icon is-small is-right">
              <i className="fas fa-search" />
            </span>
          </div>
        </div>
      </div>
      <div className="column is-narrow">
        <div className="field">
          <label className="label" htmlFor="search-button">
            Search
          </label>
          <button
            id="search-button"
            className="button is-info"
            onClick={handleSearch}
            disabled={loading}
          >
            <span className="icon">
              <i className="fas fa-search" />
            </span>
            <span>Search</span>
          </button>
        </div>
      </div>
      <div className="column is-narrow">
        <div className="field">
          <label className="label" htmlFor="refresh-button">
            Refresh
          </label>
          <button
            id="refresh-button"
            className="button is-info"
            onClick={loadPackages}
            disabled={loading}
          >
            <span className="icon">
              <i className="fas fa-sync-alt" />
            </span>
            <span>Refresh</span>
          </button>
        </div>
      </div>
      <div className="column is-narrow">
        <div className="field">
          <label className="label" htmlFor="clear-button">
            Clear
          </label>
          <button
            id="clear-button"
            className="button"
            onClick={clearFilters}
            disabled={loading}
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
);

PackageFilters.propTypes = {
  filters: PropTypes.object.isRequired,
  handleFilterChange: PropTypes.func.isRequired,
  handleSearch: PropTypes.func.isRequired,
  clearFilters: PropTypes.func.isRequired,
  isSearchMode: PropTypes.bool.isRequired,
  loading: PropTypes.bool.isRequired,
  loadPackages: PropTypes.func.isRequired,
};

export default PackageFilters;
