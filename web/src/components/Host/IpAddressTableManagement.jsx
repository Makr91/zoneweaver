import { useState } from "react";

const IpAddressTable = ({ addresses, loading, onDelete, onToggle }) => {
  const [actionLoading, setActionLoading] = useState({});

  const handleAction = async (address, action) => {
    const key = `${address.addrobj}-${action}`;
    setActionLoading((prev) => ({ ...prev, [key]: true }));

    try {
      if (action === "delete") {
        await onDelete(address.addrobj);
      } else {
        await onToggle(address, action);
      }
    } finally {
      setActionLoading((prev) => ({ ...prev, [key]: false }));
    }
  };

  const getStateIcon = (state) => {
    switch (state?.toLowerCase()) {
      case "ok":
        return (
          <span className="icon has-text-success">
            <i className="fas fa-check-circle" />
          </span>
        );
      case "disabled":
        return (
          <span className="icon has-text-warning">
            <i className="fas fa-pause-circle" />
          </span>
        );
      case "down":
        return (
          <span className="icon has-text-danger">
            <i className="fas fa-times-circle" />
          </span>
        );
      case "duplicate":
        return (
          <span className="icon has-text-danger">
            <i className="fas fa-exclamation-triangle" />
          </span>
        );
      default:
        return (
          <span className="icon has-text-grey">
            <i className="fas fa-question-circle" />
          </span>
        );
    }
  };

  const getStateTag = (state) => {
    switch (state?.toLowerCase()) {
      case "ok":
        return <span className="tag is-success is-small">{state}</span>;
      case "disabled":
        return <span className="tag is-warning is-small">{state}</span>;
      case "down":
        return <span className="tag is-danger is-small">{state}</span>;
      case "duplicate":
        return <span className="tag is-danger is-small">{state}</span>;
      default:
        return (
          <span className="tag is-grey is-small">{state || "Unknown"}</span>
        );
    }
  };

  const getTypeTag = (type) => {
    switch (type?.toLowerCase()) {
      case "static":
        return <span className="tag is-info is-small">{type}</span>;
      case "dhcp":
        return <span className="tag is-link is-small">{type}</span>;
      case "addrconf":
        return <span className="tag is-primary is-small">auto</span>;
      default:
        return (
          <span className="tag is-grey is-small">{type || "Unknown"}</span>
        );
    }
  };

  const getVersionTag = (version) => {
    switch (version?.toLowerCase()) {
      case "v4":
        return <span className="tag is-info is-small">IPv4</span>;
      case "v6":
        return <span className="tag is-dark is-small">IPv6</span>;
      default:
        return (
          <span className="tag is-grey is-small">{version || "Unknown"}</span>
        );
    }
  };

  const formatAddress = (addr, ipAddress, prefixLength) => {
    if (addr) {
      return addr;
    }
    if (ipAddress && prefixLength) {
      return `${ipAddress}/${prefixLength}`;
    }
    return ipAddress || "N/A";
  };

  const canEnable = (address) => address.state?.toLowerCase() === "disabled";

  const canDisable = (address) => address.state?.toLowerCase() === "ok";

  if (loading && addresses.length === 0) {
    return (
      <div className="has-text-centered p-4">
        <span className="icon is-large">
          <i className="fas fa-spinner fa-spin fa-2x" />
        </span>
        <p className="mt-2">Loading IP addresses...</p>
      </div>
    );
  }

  if (addresses.length === 0) {
    return (
      <div className="has-text-centered p-4">
        <span className="icon is-large has-text-grey">
          <i className="fas fa-globe fa-2x" />
        </span>
        <p className="mt-2 has-text-grey">No IP addresses found</p>
      </div>
    );
  }

  return (
    <div className="table-container">
      <table className="table is-fullwidth is-hoverable is-striped">
        <thead>
          <tr>
            <th>Interface</th>
            <th>Address Object</th>
            <th>IP Address</th>
            <th>Type</th>
            <th>Version</th>
            <th>State</th>
            <th width="140">Actions</th>
          </tr>
        </thead>
        <tbody>
          {addresses.map((address, index) => {
            const enableLoading = actionLoading[`${address.addrobj}-enable`];
            const disableLoading = actionLoading[`${address.addrobj}-disable`];
            const deleteLoading = actionLoading[`${address.addrobj}-delete`];

            return (
              <tr key={address.id || address.addrobj || index}>
                <td>
                  <div className="is-flex is-align-items-center">
                    {getStateIcon(address.state)}
                    <span className="ml-2">
                      <strong className="is-family-monospace">
                        {address.interface}
                      </strong>
                    </span>
                  </div>
                </td>
                <td>
                  <span className="is-family-monospace is-size-7">
                    {address.addrobj}
                  </span>
                </td>
                <td>
                  <div>
                    <span className="is-family-monospace">
                      {formatAddress(
                        address.addr,
                        address.ip_address,
                        address.prefix_length
                      )}
                    </span>
                  </div>
                </td>
                <td>{getTypeTag(address.type)}</td>
                <td>{getVersionTag(address.ip_version)}</td>
                <td>{getStateTag(address.state)}</td>
                <td>
                  <div className="buttons are-small">
                    {/* Enable Button */}
                    {canEnable(address) && (
                      <button
                        className={`button is-success ${enableLoading ? "is-loading" : ""}`}
                        onClick={() => handleAction(address, "enable")}
                        disabled={
                          loading ||
                          enableLoading ||
                          disableLoading ||
                          deleteLoading
                        }
                        title="Enable Address"
                      >
                        <span className="icon is-small">
                          <i className="fas fa-play" />
                        </span>
                      </button>
                    )}

                    {/* Disable Button */}
                    {canDisable(address) && (
                      <button
                        className={`button is-warning ${disableLoading ? "is-loading" : ""}`}
                        onClick={() => handleAction(address, "disable")}
                        disabled={
                          loading ||
                          enableLoading ||
                          disableLoading ||
                          deleteLoading
                        }
                        title="Disable Address"
                      >
                        <span className="icon is-small">
                          <i className="fas fa-pause" />
                        </span>
                      </button>
                    )}

                    {/* Delete Button */}
                    <button
                      className={`button is-danger ${deleteLoading ? "is-loading" : ""}`}
                      onClick={() => handleAction(address, "delete")}
                      disabled={
                        loading ||
                        enableLoading ||
                        disableLoading ||
                        deleteLoading
                      }
                      title="Delete Address"
                    >
                      <span className="icon is-small">
                        <i className="fas fa-trash" />
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

export default IpAddressTable;
