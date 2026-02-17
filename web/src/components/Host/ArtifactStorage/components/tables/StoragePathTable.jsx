import PropTypes from "prop-types";

const StoragePathTable = ({
  storagePaths,
  loading,
  onEdit,
  onDelete,
  onToggle,
  onNameClick,
}) => {
  const formatSize = (bytes) => {
    if (!bytes) {
      return "0 B";
    }

    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / 1024 ** i).toFixed(1)} ${sizes[i]}`;
  };

  const formatDate = (dateString) => {
    if (!dateString) {
      return "Never";
    }

    try {
      const date = new Date(dateString);
      return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
    } catch (err) {
      return dateString;
    }
  };

  const getTypeIcon = (type) => {
    switch (type?.toLowerCase()) {
      case "iso":
        return <i className="fas fa-compact-disc" />;
      case "image":
        return <i className="fas fa-hdd" />;
      default:
        return <i className="fas fa-folder" />;
    }
  };

  const getTypeTag = (type) => {
    switch (type?.toLowerCase()) {
      case "iso":
        return <span className="tag is-info is-small">ISO</span>;
      case "image":
        return <span className="tag is-warning is-small">Image</span>;
      default:
        return <span className="tag is-light is-small">{type}</span>;
    }
  };

  const getStatusTag = (enabled) =>
    enabled ? (
      <span className="tag is-success is-small">Enabled</span>
    ) : (
      <span className="tag is-danger is-small">Disabled</span>
    );

  const getDiskUsageBar = (diskUsage) => {
    if (!diskUsage || !diskUsage.use_percent) {
      return null;
    }

    const percentage = parseInt(diskUsage.use_percent.replace("%", ""));
    let colorClass = "is-success";

    if (percentage >= 90) {
      colorClass = "is-danger";
    } else if (percentage >= 75) {
      colorClass = "is-warning";
    }

    return (
      <div className="field">
        <span className="label is-size-7">Disk Usage</span>
        <progress
          className={`progress is-small ${colorClass}`}
          value={percentage}
          max="100"
          title={`${diskUsage.used} / ${diskUsage.total} (${diskUsage.use_percent})`}
        >
          {diskUsage.use_percent}
        </progress>
        <p className="help is-size-7">
          {diskUsage.used} / {diskUsage.total} ({diskUsage.use_percent})
        </p>
      </div>
    );
  };

  if (loading && storagePaths.length === 0) {
    return (
      <div className="has-text-centered p-4">
        <span className="icon is-large">
          <i className="fas fa-spinner fa-spin fa-2x" />
        </span>
        <p className="mt-2">Loading storage paths...</p>
      </div>
    );
  }

  if (storagePaths.length === 0) {
    return (
      <div className="has-text-centered p-4">
        <span className="icon is-large has-text-grey">
          <i className="fas fa-folder fa-2x" />
        </span>
        <p className="mt-2 has-text-grey">No storage paths configured</p>
        <p className="has-text-grey is-size-7">
          Create a storage path to begin managing artifacts
        </p>
      </div>
    );
  }

  return (
    <div className="table-container">
      <table className="table is-fullwidth is-hoverable">
        <thead>
          <tr>
            <th>Name</th>
            <th>Path</th>
            <th>Type</th>
            <th>Status</th>
            <th>Files</th>
            <th>Size</th>
            <th>Last Scan</th>
            <th>Usage</th>
            <th width="200">Actions</th>
          </tr>
        </thead>
        <tbody>
          {storagePaths.map((storagePath) => (
            <tr key={storagePath.id}>
              <td>
                <div className="is-flex is-align-items-center">
                  <span className="icon mr-2">
                    {getTypeIcon(storagePath.type)}
                  </span>
                  {onNameClick ? (
                    <button
                      type="button"
                      className="has-text-weight-bold is-clickable has-text-link button is-ghost p-0"
                      onClick={() => onNameClick(storagePath)}
                      title={`View artifacts in ${storagePath.name} (${storagePath.file_count || 0} files)`}
                      style={{
                        cursor: "pointer",
                        border: "none",
                        background: "none",
                      }}
                    >
                      {storagePath.name}
                      <span className="icon is-small ml-1">
                        <i className="fas fa-external-link-alt is-size-7" />
                      </span>
                    </button>
                  ) : (
                    <strong>{storagePath.name}</strong>
                  )}
                </div>
              </td>
              <td>
                <span
                  className="is-family-monospace is-size-7"
                  title={storagePath.path}
                >
                  {storagePath.path}
                </span>
              </td>
              <td>{getTypeTag(storagePath.type)}</td>
              <td>{getStatusTag(storagePath.enabled)}</td>
              <td>
                <span className="has-text-weight-semibold">
                  {storagePath.file_count || 0}
                </span>
              </td>
              <td>{formatSize(storagePath.total_size)}</td>
              <td>
                <span className="is-size-7">
                  {formatDate(storagePath.last_scan_at)}
                </span>
              </td>
              <td>
                {storagePath.disk_usage ? (
                  <div style={{ minWidth: "120px" }}>
                    {getDiskUsageBar(storagePath.disk_usage)}
                  </div>
                ) : (
                  <span className="has-text-grey is-size-7">N/A</span>
                )}
              </td>
              <td>
                <div className="buttons are-small">
                  <button
                    className="button"
                    onClick={() => onEdit(storagePath)}
                    disabled={loading}
                    title="Edit storage path"
                  >
                    <span className="icon is-small">
                      <i className="fas fa-edit" />
                    </span>
                  </button>

                  <button
                    className={`button ${storagePath.enabled ? "is-warning" : "is-success"}`}
                    onClick={() => onToggle(storagePath)}
                    disabled={loading}
                    title={
                      storagePath.enabled
                        ? "Disable storage path"
                        : "Enable storage path"
                    }
                  >
                    <span className="icon is-small">
                      <i
                        className={`fas ${storagePath.enabled ? "fa-pause" : "fa-play"}`}
                      />
                    </span>
                  </button>

                  <button
                    className="button is-danger"
                    onClick={() => onDelete(storagePath)}
                    disabled={loading}
                    title="Delete storage path"
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
  );
};

StoragePathTable.propTypes = {
  storagePaths: PropTypes.array.isRequired,
  loading: PropTypes.bool.isRequired,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  onToggle: PropTypes.func.isRequired,
  onNameClick: PropTypes.func,
};

export default StoragePathTable;
