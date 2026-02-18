import PropTypes from "prop-types";

import { formatBytes, parseSize } from "./StorageUtils";

const DatasetsTable = ({
  storageDatasets,
  datasetSort,
  handleDatasetSort,
  getSortIcon,
  resetDatasetSort,
  sectionsCollapsed,
  toggleSection,
}) => (
  <div className="box mb-4">
    <div className="level is-mobile mb-3">
      <div className="level-left">
        <button
          className="title is-5 mb-0 is-clickable button is-ghost p-0"
          onClick={resetDatasetSort}
          title="Click to reset sorting to default"
          type="button"
        >
          <span className="icon-text">
            <span className="icon">
              <i className="fas fa-folder-tree" />
            </span>
            <span>ZFS Datasets ({storageDatasets.length})</span>
            {datasetSort.length > 1 && (
              <span className="icon has-text-info ml-2">
                <i className="fas fa-sort-amount-down" />
              </span>
            )}
          </span>
        </button>
      </div>
      <div className="level-right">
        <button
          className="button is-small is-ghost"
          onClick={() => toggleSection("datasets")}
          title={
            sectionsCollapsed.datasets ? "Expand section" : "Collapse section"
          }
        >
          <span className="icon">
            <i
              className={`fas ${sectionsCollapsed.datasets ? "fa-chevron-down" : "fa-chevron-up"}`}
            />
          </span>
        </button>
      </div>
    </div>
    {!sectionsCollapsed.datasets && (
      <>
        {storageDatasets.length > 0 ? (
          <div className="table-container">
            <table className="table is-fullwidth is-striped">
              <thead>
                <tr>
                  <th
                    className="is-clickable"
                    onClick={(e) => handleDatasetSort("name", e)}
                    title="Click to sort by dataset name. Hold Ctrl/Cmd to add to existing sort."
                  >
                    Dataset Name{" "}
                    <i className={`fas ${getSortIcon(datasetSort, "name")}`} />
                  </th>
                  <th
                    className="is-clickable"
                    onClick={(e) => handleDatasetSort("type", e)}
                    title="Click to sort by dataset type. Hold Ctrl/Cmd to add to existing sort."
                  >
                    Type{" "}
                    <i className={`fas ${getSortIcon(datasetSort, "type")}`} />
                  </th>
                  <th
                    className="is-clickable"
                    onClick={(e) => handleDatasetSort("used", e)}
                    title="Click to sort by used space. Hold Ctrl/Cmd to add to existing sort."
                  >
                    Used{" "}
                    <i className={`fas ${getSortIcon(datasetSort, "used")}`} />
                  </th>
                  <th
                    className="is-clickable"
                    onClick={(e) => handleDatasetSort("available", e)}
                    title="Click to sort by available space. Hold Ctrl/Cmd to add to existing sort."
                  >
                    Available{" "}
                    <i
                      className={`fas ${getSortIcon(datasetSort, "available")}`}
                    />
                  </th>
                  <th
                    className="is-clickable"
                    onClick={(e) => handleDatasetSort("referenced", e)}
                    title="Click to sort by referenced space. Hold Ctrl/Cmd to add to existing sort."
                  >
                    Referenced{" "}
                    <i
                      className={`fas ${getSortIcon(datasetSort, "referenced")}`}
                    />
                  </th>
                  <th
                    className="is-clickable"
                    onClick={(e) => handleDatasetSort("compression", e)}
                    title="Click to sort by compression. Hold Ctrl/Cmd to add to existing sort."
                  >
                    Compression{" "}
                    <i
                      className={`fas ${getSortIcon(datasetSort, "compression")}`}
                    />
                  </th>
                  <th
                    className="is-clickable"
                    onClick={(e) => handleDatasetSort("mountpoint", e)}
                    title="Click to sort by mountpoint. Hold Ctrl/Cmd to add to existing sort."
                  >
                    Mountpoint{" "}
                    <i
                      className={`fas ${getSortIcon(datasetSort, "mountpoint")}`}
                    />
                  </th>
                </tr>
              </thead>
              <tbody>
                {storageDatasets.map((dataset) => (
                  <tr key={dataset.name || dataset.dataset}>
                    <td>
                      <code className="is-size-7">
                        {dataset.name || dataset.dataset}
                      </code>
                    </td>
                    <td>
                      <span className="tag is-info">
                        {dataset.type || "filesystem"}
                      </span>
                    </td>
                    <td>
                      {formatBytes(
                        dataset.used_bytes || parseSize(dataset.used)
                      )}
                    </td>
                    <td>
                      {formatBytes(
                        dataset.available_bytes || parseSize(dataset.available)
                      )}
                    </td>
                    <td>
                      {formatBytes(
                        dataset.referenced_bytes ||
                          parseSize(dataset.referenced)
                      )}
                    </td>
                    <td>
                      <span className="tag">
                        {dataset.compression || dataset.compressRatio || "off"}
                      </span>
                    </td>
                    <td>
                      <code className="is-size-7">
                        {dataset.mountpoint || dataset.mount || "N/A"}
                      </code>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="notification is-info">
            <p>
              No ZFS dataset data available or monitoring endpoint not
              configured.
            </p>
          </div>
        )}
      </>
    )}
  </div>
);

DatasetsTable.propTypes = {
  storageDatasets: PropTypes.array.isRequired,
  datasetSort: PropTypes.array.isRequired,
  handleDatasetSort: PropTypes.func.isRequired,
  getSortIcon: PropTypes.func.isRequired,
  resetDatasetSort: PropTypes.func.isRequired,
  sectionsCollapsed: PropTypes.object.isRequired,
  toggleSection: PropTypes.func.isRequired,
};

export default DatasetsTable;
