import PropTypes from "prop-types";

const getNodeTypeLabel = (nodeType) => {
  const labels = {
    physicalNic: "Physical NICs",
    aggregate: "Aggregates",
    etherstub: "Etherstubs",
    vnic: "VNICs",
    zone: "Zones",
  };
  return labels[nodeType] || nodeType;
};

const NetworkTopologyControls = (props) => {
  const {
    filters,
    onFilterChange,
    showFilters,
    onToggleFilters,
    networkData,
    horizontal = false,
    edgeType = "floating",
    onEdgeTypeChange,
  } = props;

  const handleNodeTypeChange = (nodeType) => {
    onFilterChange({
      nodeTypes: {
        ...filters.nodeTypes,
        [nodeType]: !filters.nodeTypes[nodeType],
      },
    });
  };

  const handleEdgeTypeChange = (type) => {
    onEdgeTypeChange?.(type);
  };

  // Get available VLANs and zones from network data
  const availableVlans = [
    ...new Set(
      (networkData?.vnics || [])
        .filter((vnic) => vnic.vid)
        .map((vnic) => vnic.vid)
    ),
  ].sort((a, b) => parseInt(a) - parseInt(b));

  const availableZones = [
    ...new Set((networkData?.zones || []).map((zone) => zone.name)),
  ].sort();

  return (
    <div className="network-topology-controls">
      {/* Header with main controls */}
      <div className={`level is-mobile ${horizontal ? "" : "mb-3"}`}>
        <div className="level-left">
          {/* Edge Type Toggle */}
          <div className="level-item">
            <div className="field is-grouped">
              <div className="control">
                <label
                  className="label is-small mb-1"
                  htmlFor="edge-type-select"
                >
                  Edge Type:
                </label>
              </div>
              <div className="control">
                <div className="select is-small">
                  <select
                    id="edge-type-select"
                    value={edgeType}
                    onChange={(e) => handleEdgeTypeChange(e.target.value)}
                    title="Select edge visualization type"
                  >
                    <optgroup label="Custom Edges">
                      <option value="floating">Floating Edges</option>
                      <option value="bandwidth">Enhanced Bandwidth</option>
                      <option value="bidirectional">Bidirectional</option>
                    </optgroup>
                    <optgroup label="React Flow Built-in">
                      <option value="default">Bezier (Default)</option>
                      <option value="straight">Straight Lines</option>
                      <option value="step">Step Lines</option>
                      <option value="smoothstep">Smooth Step</option>
                    </optgroup>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="level-right">
          {/* Filters Toggle */}
          <div className="level-item">
            <button
              className={`button is-small ${showFilters ? "is-primary" : "is-light"}`}
              onClick={onToggleFilters}
              title="Toggle filters"
            >
              <span className="icon is-small">
                <i className="fas fa-filter" />
              </span>
              <span>Filters</span>
            </button>
          </div>
        </div>
      </div>

      {/* Expandable filter controls */}
      {showFilters && (
        <div className="box">
          <div className={horizontal ? "columns" : ""}>
            {/* Node Type Filters */}
            <div className={horizontal ? "column" : "mb-4"}>
              <h6 className="title is-6 mb-2">Node Types</h6>
              <div className="field is-grouped is-grouped-multiline">
                {Object.entries(filters.nodeTypes).map(
                  ([nodeType, enabled]) => (
                    <div key={nodeType} className="control">
                      <label className="checkbox">
                        <input
                          type="checkbox"
                          checked={enabled}
                          onChange={() => handleNodeTypeChange(nodeType)}
                        />
                        <span className="ml-1">
                          {getNodeTypeLabel(nodeType)}
                        </span>
                      </label>
                    </div>
                  )
                )}
              </div>
            </div>

            {/* VLAN Filters */}
            {availableVlans.length > 0 && (
              <div className={horizontal ? "column" : "mb-4"}>
                <h6 className="title is-6 mb-2">VLANs</h6>
                <div className="field is-grouped is-grouped-multiline">
                  {availableVlans.map((vlan) => (
                    <div key={vlan} className="control">
                      <label className="checkbox">
                        <input
                          type="checkbox"
                          checked={filters.vlans?.includes(vlan) || false}
                          onChange={(e) => {
                            const currentVlans = filters.vlans || [];
                            const newVlans = e.target.checked
                              ? [...currentVlans, vlan]
                              : currentVlans.filter((v) => v !== vlan);
                            onFilterChange({ vlans: newVlans });
                          }}
                        />
                        <span className="ml-1">VLAN {vlan}</span>
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Zone Filters */}
            {availableZones.length > 0 && (
              <div className={horizontal ? "column" : "mb-4"}>
                <h6 className="title is-6 mb-2">Zones</h6>
                <div className="field is-grouped is-grouped-multiline">
                  {availableZones.map((zone) => (
                    <div key={zone} className="control">
                      <label className="checkbox">
                        <input
                          type="checkbox"
                          checked={filters.zones?.includes(zone) || false}
                          onChange={(e) => {
                            const currentZones = filters.zones || [];
                            const newZones = e.target.checked
                              ? [...currentZones, zone]
                              : currentZones.filter((z) => z !== zone);
                            onFilterChange({ zones: newZones });
                          }}
                        />
                        <span className="ml-1">{zone}</span>
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Misc Options */}
            <div className={horizontal ? "column" : ""}>
              <h6 className="title is-6 mb-2">Options</h6>
              <div className="field">
                <label className="checkbox">
                  <input
                    type="checkbox"
                    checked={filters.showIdleLinks || false}
                    onChange={(e) =>
                      onFilterChange({ showIdleLinks: e.target.checked })
                    }
                  />
                  <span className="ml-1">Show idle links</span>
                </label>
              </div>
              <div className="field">
                <label className="checkbox">
                  <input
                    type="checkbox"
                    checked={filters.showUnattachedNodes || false}
                    onChange={(e) =>
                      onFilterChange({ showUnattachedNodes: e.target.checked })
                    }
                  />
                  <span className="ml-1">Show unattached nodes</span>
                </label>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

NetworkTopologyControls.propTypes = {
  filters: PropTypes.shape({
    nodeTypes: PropTypes.objectOf(PropTypes.bool).isRequired,
    vlans: PropTypes.arrayOf(PropTypes.number),
    zones: PropTypes.arrayOf(PropTypes.string),
    showIdleLinks: PropTypes.bool,
    showUnattachedNodes: PropTypes.bool,
  }).isRequired,
  onFilterChange: PropTypes.func.isRequired,
  showFilters: PropTypes.bool.isRequired,
  onToggleFilters: PropTypes.func.isRequired,
  networkData: PropTypes.shape({
    vnics: PropTypes.arrayOf(
      PropTypes.shape({
        vid: PropTypes.number,
      })
    ),
    zones: PropTypes.arrayOf(
      PropTypes.shape({
        name: PropTypes.string.isRequired,
      })
    ),
  }),
  horizontal: PropTypes.bool,
  edgeType: PropTypes.string,
  onEdgeTypeChange: PropTypes.func,
};

export default NetworkTopologyControls;
