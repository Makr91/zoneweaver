import { useState } from "react";

const AggregateTable = ({ aggregates, loading, onDelete, onViewDetails }) => {
  const [deleteLoading, setDeleteLoading] = useState({});

  const handleDelete = async (aggregate) => {
    const key = aggregate.name || aggregate.link;
    setDeleteLoading((prev) => ({ ...prev, [key]: true }));

    try {
      await onDelete(aggregate.name || aggregate.link);
    } finally {
      setDeleteLoading((prev) => ({ ...prev, [key]: false }));
    }
  };

  const getStateIcon = (state) => {
    switch (state?.toLowerCase()) {
      case "up":
        return (
          <span className="icon has-text-success">
            <i className="fas fa-check-circle" />
          </span>
        );
      case "down":
        return (
          <span className="icon has-text-danger">
            <i className="fas fa-times-circle" />
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
      case "up":
        return <span className="tag is-success is-small">{state}</span>;
      case "down":
        return <span className="tag is-danger is-small">{state}</span>;
      default:
        return (
          <span className="tag is-grey is-small">{state || "Unknown"}</span>
        );
    }
  };

  const getPolicyTag = (policy) => {
    const policyColors = {
      L2: "is-info",
      L3: "is-primary",
      L4: "is-link",
      L2L3: "is-success",
      L2L4: "is-warning",
      L3L4: "is-danger",
      L2L3L4: "is-dark",
    };

    const colorClass = policyColors[policy] || "";
    return (
      <span className={`tag ${colorClass} is-small`}>
        {policy || "Unknown"}
      </span>
    );
  };

  const getLacpModeTag = (mode) => {
    switch (mode?.toLowerCase()) {
      case "active":
        return <span className="tag is-success is-small">{mode}</span>;
      case "passive":
        return <span className="tag is-info is-small">{mode}</span>;
      case "off":
        return <span className="tag is-grey is-small">{mode}</span>;
      default:
        return <span className="tag is-grey is-small">{mode || "N/A"}</span>;
    }
  };

  const formatLinks = (linksData) => {
    // Handle both array format and comma-separated string format
    let links;
    if (Array.isArray(linksData)) {
      links = linksData;
    } else if (typeof linksData === "string" && linksData) {
      links = linksData.split(",").map((link) => link.trim());
    } else {
      return "N/A";
    }

    if (links.length === 0) {
      return "None";
    }
    if (links.length <= 2) {
      return links.join(", ");
    }
    return `${links.slice(0, 2).join(", ")} +${links.length - 2}`;
  };

  const getLinksArray = (linksData) => {
    if (Array.isArray(linksData)) {
      return linksData;
    } else if (typeof linksData === "string" && linksData) {
      return linksData.split(",").map((link) => link.trim());
    }
    return [];
  };

  if (loading && aggregates.length === 0) {
    return (
      <div className="has-text-centered p-4">
        <span className="icon is-large">
          <i className="fas fa-spinner fa-spin fa-2x" />
        </span>
        <p className="mt-2">Loading link aggregates...</p>
      </div>
    );
  }

  if (aggregates.length === 0) {
    return (
      <div className="has-text-centered p-4">
        <span className="icon is-large has-text-grey">
          <i className="fas fa-link fa-2x" />
        </span>
        <p className="mt-2 has-text-grey">No link aggregates found</p>
      </div>
    );
  }

  return (
    <div className="table-container">
      <table className="table is-fullwidth is-hoverable is-striped">
        <thead>
          <tr>
            <th>Aggregate</th>
            <th>Policy</th>
            <th>Member Links</th>
            <th>State</th>
            <th>LACP Mode</th>
            <th>Timer</th>
            <th width="120">Actions</th>
          </tr>
        </thead>
        <tbody>
          {aggregates.map((aggregate, index) => {
            const aggregateName = aggregate.name || aggregate.link;
            const memberLinks = aggregate.links || aggregate.over;
            const isDeleting = deleteLoading[aggregateName];

            return (
              <tr key={aggregateName || index}>
                <td>
                  <div className="is-flex is-align-items-center">
                    {getStateIcon(aggregate.state)}
                    <span className="ml-2">
                      <strong className="is-family-monospace">
                        {aggregateName}
                      </strong>
                    </span>
                  </div>
                </td>
                <td>{getPolicyTag(aggregate.policy)}</td>
                <td>
                  <span
                    className="is-family-monospace is-size-7"
                    title={getLinksArray(memberLinks).join(", ")}
                  >
                    {formatLinks(memberLinks)}
                  </span>
                  {getLinksArray(memberLinks).length > 0 && (
                    <div className="is-size-7 has-text-grey">
                      {getLinksArray(memberLinks).length} link
                      {getLinksArray(memberLinks).length !== 1 ? "s" : ""}
                    </div>
                  )}
                </td>
                <td>{getStateTag(aggregate.state)}</td>
                <td>{getLacpModeTag(aggregate.lacp_mode)}</td>
                <td>
                  <span className="is-size-7">
                    {aggregate.lacp_timer || "N/A"}
                  </span>
                </td>
                <td>
                  <div className="buttons are-small">
                    {/* View Details Button */}
                    <button
                      className="button"
                      onClick={() => onViewDetails(aggregate)}
                      disabled={loading || isDeleting}
                      title="View Details"
                    >
                      <span className="icon is-small">
                        <i className="fas fa-info-circle" />
                      </span>
                    </button>

                    {/* Delete Button */}
                    <button
                      className={`button is-danger ${isDeleting ? "is-loading" : ""}`}
                      onClick={() => handleDelete(aggregate)}
                      disabled={loading || isDeleting}
                      title="Delete Aggregate"
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

export default AggregateTable;
