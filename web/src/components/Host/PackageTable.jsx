import { useState } from "react";

const PackageTable = ({
  packages,
  loading,
  onInstall,
  onUninstall,
  onViewDetails,
  isSearchMode,
}) => {
  const [actionLoading, setActionLoading] = useState({});

  const handleAction = async (pkg, action) => {
    const key = `${pkg.name}-${action}`;
    setActionLoading((prev) => ({ ...prev, [key]: true }));

    try {
      if (action === "install") {
        await onInstall(pkg);
      } else if (action === "uninstall") {
        await onUninstall(pkg);
      }
    } finally {
      setActionLoading((prev) => ({ ...prev, [key]: false }));
    }
  };

  const getStatusIcon = (pkg) => {
    if (pkg.installed && pkg.manually_installed) {
      return (
        <span className="icon has-text-warning">
          <i className="fas fa-star" />
        </span>
      );
    }
    if (pkg.installed) {
      return (
        <span className="icon has-text-success">
          <i className="fas fa-check-circle" />
        </span>
      );
    }
    if (pkg.frozen) {
      return (
        <span className="icon has-text-info">
          <i className="fas fa-snowflake" />
        </span>
      );
    }
    return (
      <span className="icon has-text-grey">
        <i className="fas fa-circle" />
      </span>
    );
  };

  const getStatusTag = (pkg) => {
    if (pkg.installed && pkg.manually_installed) {
      return <span className="tag is-warning is-small">Manual</span>;
    }
    if (pkg.installed) {
      return <span className="tag is-success is-small">Installed</span>;
    }
    if (pkg.frozen) {
      return <span className="tag is-info is-small">Frozen</span>;
    }
    if (isSearchMode) {
      return <span className="tag is-grey is-small">Available</span>;
    }
    return <span className="tag is-grey is-small">Not Installed</span>;
  };

  const getAvailableActions = (pkg) => {
    const actions = [];

    if (pkg.installed) {
      // Package is installed - can uninstall
      if (!pkg.frozen) {
        actions.push({
          key: "uninstall",
          label: "Uninstall",
          icon: "fa-trash",
          class: "has-background-danger-dark has-text-danger-light",
        });
      }
    } else {
      // Package is not installed - can install
      actions.push({
        key: "install",
        label: "Install",
        icon: "fa-download",
        class: "has-background-success-dark has-text-success-light",
      });
    }

    return actions;
  };

  const formatSize = (size) => {
    if (!size) {
      return "N/A";
    }

    // Parse size strings like "2.61 MB", "1.2 GB", etc.
    const sizeStr = size.toString();
    if (sizeStr.includes("GB")) {
      return sizeStr;
    }
    if (sizeStr.includes("MB")) {
      return sizeStr;
    }
    if (sizeStr.includes("KB")) {
      return sizeStr;
    }

    // If it's just a number, assume bytes and convert
    const bytes = parseInt(size);
    if (isNaN(bytes)) {
      return size;
    }

    if (bytes >= 1024 * 1024 * 1024) {
      return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
    }
    if (bytes >= 1024 * 1024) {
      return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    }
    if (bytes >= 1024) {
      return `${(bytes / 1024).toFixed(2)} KB`;
    }
    return `${bytes} B`;
  };

  if (loading && packages.length === 0) {
    return (
      <div className="has-text-centered p-4">
        <span className="icon is-large">
          <i className="fas fa-spinner fa-spin fa-2x" />
        </span>
        <p className="mt-2">Loading packages...</p>
      </div>
    );
  }

  if (packages.length === 0) {
    return (
      <div className="has-text-centered p-4">
        <span className="icon is-large has-text-grey">
          <i className="fas fa-cube fa-2x" />
        </span>
        <p className="mt-2 has-text-grey">
          {isSearchMode
            ? "No packages found for your search"
            : "No packages found"}
        </p>
      </div>
    );
  }

  return (
    <div className="table-container">
      <table className="table is-fullwidth is-hoverable is-striped">
        <thead>
          <tr>
            <th>Package</th>
            <th>Publisher</th>
            <th>Version</th>
            <th>Status</th>
            <th>Size</th>
            <th width="200">Actions</th>
          </tr>
        </thead>
        <tbody>
          {packages.map((pkg, index) => {
            const availableActions = getAvailableActions(pkg);

            return (
              <tr key={pkg.name || index}>
                <td>
                  <div className="is-flex is-align-items-center">
                    {getStatusIcon(pkg)}
                    <span className="ml-2">
                      <strong className="is-family-monospace">
                        {pkg.name}
                      </strong>
                    </span>
                  </div>
                </td>
                <td>
                  <span className="tag is-info is-small">
                    {pkg.publisher || "Unknown"}
                  </span>
                </td>
                <td>
                  <span className="is-family-monospace is-size-7">
                    {pkg.version || "N/A"}
                  </span>
                </td>
                <td>{getStatusTag(pkg)}</td>
                <td>
                  <span className="is-size-7">{formatSize(pkg.size)}</span>
                </td>
                <td>
                  <div className="buttons are-small">
                    {/* Action Buttons */}
                    {availableActions.map((action) => {
                      const key = `${pkg.name}-${action.key}`;
                      const isLoading = actionLoading[key];

                      return (
                        <button
                          key={action.key}
                          className={`button ${action.class} ${isLoading ? "is-loading" : ""}`}
                          onClick={() => handleAction(pkg, action.key)}
                          disabled={loading || isLoading}
                          title={action.label}
                        >
                          <span className="icon is-small">
                            <i className={`fas ${action.icon}`} />
                          </span>
                        </button>
                      );
                    })}

                    {/* View Details Button */}
                    <button
                      className="button"
                      onClick={() => onViewDetails(pkg)}
                      disabled={loading}
                      title="View Details"
                    >
                      <span className="icon is-small">
                        <i className="fas fa-info-circle" />
                      </span>
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default PackageTable;
