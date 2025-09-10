import React from "react";

const PptDevicesTable = ({
  pptStatus,
  sectionsCollapsed,
  toggleSection,
  setSelectedDevice,
}) => {
  if (!pptStatus.ppt_devices || pptStatus.ppt_devices.length === 0) {
    return null;
  }

  return (
    <div className="box mb-4">
      <div className="level is-mobile mb-3">
        <div className="level-left">
          <h4 className="title is-5 mb-0">
            <span className="icon-text">
              <span className="icon">
                <i className="fas fa-bolt"></i>
              </span>
              <span>
                PPT-Capable Devices ({pptStatus.ppt_devices.length} devices)
              </span>
            </span>
          </h4>
        </div>
        <div className="level-right">
          <button
                      className='button is-small is-ghost'
                      onClick={() => toggleSection('pptDevices')}
                      title={sectionsCollapsed.pptDevices ? 'Expand section' : 'Collapse section'}
            }
          >
            <span className="icon">
              <i
                className={`fas ${sectionsCollapsed.pptDevices ? "fa-chevron-down" : "fa-chevron-up"}`}
              ></i>
            </span>
          </button>
        </div>
      </div>
      {!sectionsCollapsed.pptDevices && (
        <div className="table-container">
          <table className="table is-fullwidth is-striped">
            <thead>
              <tr>
                <th>Device Name</th>
                <th>PCI Address</th>
                <th>PPT Device Path</th>
                <th>Assignment Status</th>
                <th>Assigned Zones</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {pptStatus.ppt_devices.map((device, index) => (
                <tr key={device.id || index}>
                  <td>
                    <strong>{device.device_name || "Unknown Device"}</strong>
                  </td>
                  <td>
                    <code>{device.pci_address || "N/A"}</code>
                  </td>
                  <td>
                    <code>{device.ppt_device_path || "N/A"}</code>
                  </td>
                  <td>
                    <span
                      className={`tag ${
                        device.assigned_to_zones?.length
                          ? "is-warning"
                          : "is-success"
                      }`}
                    >
                      {device.assigned_to_zones?.length
                        ? "Assigned"
                        : "Available"}
                    </span>
                  </td>
                  <td>
                    {device.assigned_to_zones?.length ? (
                      <div className="tags">
                        {device.assigned_to_zones.map((zone) => (
                          <span key={zone} className="tag is-warning is-small">
                            {zone}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="has-text-grey">None</span>
                    )}
                  </td>
                  <td>
                    <button
                                          className='button is-small is-info'
                      onClick={() => setSelectedDevice(device)}
                      title="View device details"
                    >
                      <span className="icon">
                        <i className="fas fa-info-circle"></i>
                      </span>
                      <span>Details</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default PptDevicesTable;
