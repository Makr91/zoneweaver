import React from "react";

const ZoneStorage = ({ configuration }) => {
  if (
    !configuration ||
    (!configuration.diskif && !configuration.bootdisk && !configuration.disk)
  ) {
    return null;
  }

  return (
    <div className="box mb-0 pt-0 pd-0">
      <h4 className="title is-6 mb-3">
        <span className="icon-text">
          <span className="icon">
            <i className="fas fa-hdd" />
          </span>
          <span>Storage Configuration</span>
        </span>
      </h4>

      {/* Disk Interface Only */}
      <div className="mb-3">
        <div className="table-container">
          <table className="table is-fullwidth is-striped is-size-7">
            <tbody>
              <tr>
                <td className="px-3 py-2">
                  <strong>Disk Interface Driver</strong>
                </td>
                <td className="px-3 py-2">
                  <span className="has-text-grey is-family-monospace">
                    {configuration.diskif || "N/A"}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Boot Disk */}
      {configuration.bootdisk && (
        <div className="mb-3">
          <h5 className="subtitle is-6 mb-2">Boot Disk</h5>
          <div className="table-container">
            <table className="table is-fullwidth is-striped is-size-7">
              <thead>
                <tr>
                  <th className="px-3 py-2">NAME</th>
                  <th className="px-3 py-2">BLOCKSIZE</th>
                  <th className="px-3 py-2">SPARSE</th>
                  <th className="px-3 py-2">SIZE</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="px-3 py-2">
                    <span className="has-text-grey is-size-7 is-family-monospace">
                      {configuration.bootdisk.path}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <span className="has-text-grey is-family-monospace">
                      {configuration.bootdisk.blocksize}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <span className="has-text-grey is-family-monospace">
                      {configuration.bootdisk.sparse}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <span className="has-text-grey is-family-monospace">
                      {configuration.bootdisk.size}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Data Disks */}
      {configuration.disk && configuration.disk.length > 0 && (
        <div>
          <h5 className="subtitle is-6 mb-2">Data Disks</h5>
          <div className="table-container">
            <table className="table is-fullwidth is-striped is-size-7">
              <thead>
                <tr>
                  <th className="px-3 py-2">NAME</th>
                  <th className="px-3 py-2">BLOCKSIZE</th>
                  <th className="px-3 py-2">SPARSE</th>
                  <th className="px-3 py-2">SIZE</th>
                </tr>
              </thead>
              <tbody>
                {(configuration.disk || [])
                  .filter((disk) => disk !== null && disk !== undefined)
                  .map((disk, index) => (
                    <tr key={index}>
                      <td className="px-3 py-2">
                        <span className="has-text-grey is-size-7 is-family-monospace">
                          {disk?.path || "N/A"}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        <span className="has-text-grey is-family-monospace">
                          {disk?.blocksize || "N/A"}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        <span className="has-text-grey is-family-monospace">
                          {disk?.sparse || "N/A"}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        <span className="has-text-grey is-family-monospace">
                          {disk?.size || "N/A"}
                        </span>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default ZoneStorage;
