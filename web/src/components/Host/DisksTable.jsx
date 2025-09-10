import React from "react";

import { formatBytes, getHealthColor } from "./StorageUtils";

const DisksTable = ({
  storageDisks,
  diskSort,
  handleDiskSort,
  getSortIcon,
  resetDiskSort,
  sectionsCollapsed,
  toggleSection,
}) => (
  <div className="box mb-4">
    <div className="level is-mobile mb-3">
      <div className="level-left">
        <h4
                      className='title is-5 mb-0 is-clickable'
          onClick={resetDiskSort}
          title="Click to reset sorting to default"
        >
          <span className="icon-text">
            <span className="icon">
              <i className="fas fa-hard-drive"></i>
            </span>
            <span>Physical Disks ({storageDisks.length})</span>
            {diskSort.length > 1 && (
              <span className="icon has-text-info ml-2">
                <i className="fas fa-sort-amount-down"></i>
              </span>
            )}
          </span>
        </h4>
      </div>
      <div className="level-right">
          <button
                      className='button is-small is-ghost'
                      onClick={() => toggleSection('disks')}
                      title={sectionsCollapsed.disks ? 'Expand section' : 'Collapse section'}
        >
          <span className="icon">
            <i
              className={`fas ${sectionsCollapsed.disks ? "fa-chevron-down" : "fa-chevron-up"}`}
            ></i>
          </span>
        </button>
      </div>
    </div>
    {!sectionsCollapsed.disks && (
      <>
        {storageDisks.length > 0 ? (
          <div className="table-container">
            <table className="table is-fullwidth is-striped">
              <thead>
                <tr>
                  <th
                    className="is-clickable"
                                          onClick={() => handleDiskSort('device_name')}
                    title="Click to sort by device name"
                  >
                    Device{" "}
                    <i
                      className={`fas ${getSortIcon(diskSort, "device_name")}`}
                    ></i>
                  </th>
                  <th
                                          className="is-clickable"
                                          onClick={() => handleDiskSort('model')}
                    title="Click to sort by model"
                  >
                    Model{" "}
                    <i className={`fas ${getSortIcon(diskSort, "model")}`} />
                  </th>
                  <th
                    className="is-clickable"
                                          onClick={() => handleDiskSort('serial_number')}
                    title="Click to sort by serial number"
                  >
                    Serial{" "}
                    <i
                      className={`fas ${getSortIcon(diskSort, "serial_number")}`}
                    ></i>
                  </th>
                  <th
                    className="is-clickable"
                                          onClick={() => handleDiskSort('capacity_bytes')}
                    title="Click to sort by capacity"
                  >
                    Size{" "}
                    <i
                      className={`fas ${getSortIcon(diskSort, "capacity_bytes")}`}
                    ></i>
                  </th>
                  <th
                                          className="is-clickable"
                                          onClick={() => handleDiskSort('disk_type')}
                    title="Click to sort by disk type"
                  >
                    Type{" "}
                    <i
                      className={`fas ${getSortIcon(diskSort, "disk_type")}`}
                    ></i>
                  </th>
                  <th
                    className="is-clickable"
                                          onClick={() => handleDiskSort('health')}
                    title="Click to sort by health status"
                  >
                    Health{" "}
                    <i className={`fas ${getSortIcon(diskSort, "health")}`} />
                  </th>
                  <th
                    className="is-clickable"
                                          onClick={() => handleDiskSort('temperature')}
                    title="Click to sort by temperature"
                  >
                    Temperature{" "}
                    <i
                      className={`fas ${getSortIcon(diskSort, "temperature")}`}
                    ></i>
                  </th>
                  <th
                    className="is-clickable"
                                          onClick={() => handleDiskSort('pool_assignment')}
                    title="Click to sort by pool assignment"
                  >
                    Pool{" "}
                    <i
                      className={`fas ${getSortIcon(diskSort, "pool_assignment")}`}
                    ></i>
                  </th>
                </tr>
              </thead>
              <tbody>
                {storageDisks.map((disk, index) => (
                  <tr key={index}>
                    <td>
                      <strong>
                        {disk.device_name || disk.device || disk.name}
                      </strong>
                    </td>
                    <td>{disk.model || disk.product || "N/A"}</td>
                    <td>
                      <code className="is-size-7">
                        {disk.serial_number ||
                          disk.serial ||
                          disk.serialNumber ||
                          "N/A"}
                      </code>
                    </td>
                    <td>
                      {formatBytes(
                        disk.capacity_bytes || disk.size || disk.capacity
                      )}
                    </td>
                    <td>
                      <span className="tag is-info">
                        {disk.disk_type ||
                          disk.type ||
                          disk.mediaType ||
                          "Unknown"}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`tag ${getHealthColor(disk.health || disk.status)}`}
                      >
                        {disk.health || disk.status || "Unknown"}
                      </span>
                    </td>
                    <td>
                      {disk.temperature ? (
                        <span
                          className={`tag ${
                            disk.temperature > 60
                              ? "is-danger"
                              : disk.temperature > 45
                                ? "is-warning"
                                : "is-success"
                          }`}
                        >
                          {disk.temperature}°C
                        </span>
                      ) : (
                        <span className="tag is-info">N/A</span>
                      )}
                    </td>
                    <td>
                      {disk.pool_assignment && disk.pool_assignment !== null ? (
                        <strong>{disk.pool_assignment}</strong>
                      ) : disk.pool ? (
                        <strong>{disk.pool}</strong>
                      ) : (
                        <span className="has-text-grey">
                          {disk.is_available ? "Available" : "Unassigned"}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="notification is-info">
            <p>
              No physical disk data available or monitoring endpoint not
              configured.
            </p>
          </div>
        )}
      </>
    )}
  </div>
);

export default DisksTable;
