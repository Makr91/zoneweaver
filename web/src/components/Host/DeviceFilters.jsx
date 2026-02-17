import PropTypes from "prop-types";

import { exportDeviceData } from "./DeviceUtils";

const DeviceFilters = ({
  filters,
  setFilters,
  deviceCategories,
  sectionsCollapsed,
  toggleSection,
  devices,
  selectedServer,
}) => (
  <div className="box mb-4">
    <div className="level is-mobile mb-3">
      <div className="level-left">
        <h4 className="title is-5 mb-0">
          <span className="icon-text">
            <span className="icon">
              <i className="fas fa-filter" />
            </span>
            <span>Device Filters & Search</span>
          </span>
        </h4>
      </div>
      <div className="level-right">
        <div className="field is-grouped">
          <div className="control">
            <button
              className="button is-small is-info"
              onClick={() =>
                setFilters({
                  category: "",
                  pptStatus: "",
                  driverStatus: "",
                  searchText: "",
                })
              }
              title="Clear all filters"
            >
              <span className="icon">
                <i className="fas fa-times" />
              </span>
              <span>Clear</span>
            </button>
          </div>
          <div className="control">
            <div className="dropdown is-hoverable">
              <div className="dropdown-trigger">
                <button className="button is-small" aria-haspopup="true">
                  <span className="icon">
                    <i className="fas fa-download" />
                  </span>
                  <span>Export</span>
                  <span className="icon is-small">
                    <i className="fas fa-angle-down" />
                  </span>
                </button>
              </div>
              <div className="dropdown-menu">
                <div className="dropdown-content">
                  <button
                    type="button"
                    className="dropdown-item button is-ghost"
                    onClick={() =>
                      exportDeviceData("csv", devices, selectedServer)
                    }
                  >
                    <span className="icon mr-2">
                      <i className="fas fa-file-csv" />
                    </span>
                    <span>Export as CSV</span>
                  </button>
                  <button
                    type="button"
                    className="dropdown-item button is-ghost"
                    onClick={() =>
                      exportDeviceData("json", devices, selectedServer)
                    }
                  >
                    <span className="icon mr-2">
                      <i className="fas fa-file-code" />
                    </span>
                    <span>Export as JSON</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div className="control">
            <button
              className="button is-small is-ghost"
              onClick={() => toggleSection("filters")}
              title={
                sectionsCollapsed.filters
                  ? "Expand section"
                  : "Collapse section"
              }
            >
              <span className="icon">
                <i
                  className={`fas ${sectionsCollapsed.filters ? "fa-chevron-down" : "fa-chevron-up"}`}
                />
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
    {!sectionsCollapsed.filters && (
      <div className="columns">
        <div className="column is-3">
          <div className="field">
            <label htmlFor="device-search" className="label is-small">
              Search Devices
            </label>
            <div className="control has-icons-left">
              <input
                id="device-search"
                className="input is-small"
                type="text"
                placeholder="Device name, vendor, PCI address..."
                value={filters.searchText}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    searchText: e.target.value,
                  }))
                }
              />
              <span className="icon is-small is-left">
                <i className="fas fa-search" />
              </span>
            </div>
          </div>
        </div>
        <div className="column is-3">
          <div className="field">
            <label htmlFor="device-category" className="label is-small">
              Category
            </label>
            <div className="control">
              <div className="select is-small is-fullwidth">
                <select
                  id="device-category"
                  value={filters.category}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      category: e.target.value,
                    }))
                  }
                >
                  <option value="">All Categories</option>
                  {Object.keys(deviceCategories).map((category) => (
                    <option key={category} value={category}>
                      {category.charAt(0).toUpperCase() + category.slice(1)} (
                      {deviceCategories[category].total})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
        <div className="column is-3">
          <div className="field">
            <label htmlFor="device-ppt-status" className="label is-small">
              PPT Status
            </label>
            <div className="control">
              <div className="select is-small is-fullwidth">
                <select
                  id="device-ppt-status"
                  value={filters.pptStatus}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      pptStatus: e.target.value,
                    }))
                  }
                >
                  <option value="">All PPT Status</option>
                  <option value="enabled">PPT Capable</option>
                  <option value="disabled">Not PPT Capable</option>
                  <option value="available">PPT Available</option>
                  <option value="assigned">PPT Assigned</option>
                </select>
              </div>
            </div>
          </div>
        </div>
        <div className="column is-3">
          <div className="field">
            <label htmlFor="device-driver-status" className="label is-small">
              Driver Status
            </label>
            <div className="control">
              <div className="select is-small is-fullwidth">
                <select
                  id="device-driver-status"
                  value={filters.driverStatus}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      driverStatus: e.target.value,
                    }))
                  }
                >
                  <option value="">All Driver Status</option>
                  <option value="attached">Driver Attached</option>
                  <option value="detached">No Driver</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>
    )}
  </div>
);

DeviceFilters.propTypes = {
  filters: PropTypes.object.isRequired,
  setFilters: PropTypes.func.isRequired,
  deviceCategories: PropTypes.object.isRequired,
  sectionsCollapsed: PropTypes.object.isRequired,
  toggleSection: PropTypes.func.isRequired,
  devices: PropTypes.array.isRequired,
  selectedServer: PropTypes.object,
};

export default DeviceFilters;
