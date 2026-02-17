import PropTypes from "prop-types";

const BandwidthLegend = ({ horizontal = false }) => {
  const bandwidthRanges = [
    { label: "< 25%", color: "#48c78e", description: "Light load" },
    { label: "25-50%", color: "#ffdd57", description: "Moderate load" },
    { label: "50-75%", color: "#ff9f43", description: "Heavy load" },
    { label: "75-90%", color: "#f14668", description: "Critical load" },
    { label: "> 90%", color: "#e74c3c", description: "Overloaded" },
  ];

  const nodeTypes = [
    { label: "Physical NIC", color: "#48c78e", icon: "fa-ethernet" },
    { label: "Aggregate", color: "#3273dc", icon: "fa-link" },
    { label: "Etherstub", color: "#ffdd57", icon: "fa-sitemap" },
    { label: "VNIC", color: "#ff9f43", icon: "fa-network-wired" },
    { label: "Zone", color: "#f14668", icon: "fa-server" },
  ];

  const trafficIndicators = [
    { label: "RX Traffic", color: "#48c78e", symbol: "↓" },
    { label: "TX Traffic", color: "#3273dc", symbol: "↑" },
    { label: "VLAN Tagged", style: "dashed", description: "Dashed line" },
    { label: "LACP Bond", style: "thick", description: "Thick line" },
  ];

  if (horizontal) {
    // Horizontal layout for bottom placement
    return (
      <div className="card">
        <div className="card-content p-3">
          <h6 className="title is-6 mb-3 has-text-centered">
            <span className="icon-text">
              <span className="icon is-small">
                <i className="fas fa-info-circle" />
              </span>
              <span>Network Legend</span>
            </span>
          </h6>

          <div className="columns is-multiline is-mobile">
            {/* Bandwidth Saturation */}
            <div className="column is-one-third">
              <p className="has-text-weight-bold is-size-7 mb-2">
                Bandwidth Saturation
              </p>
              <div className="field is-grouped is-grouped-multiline">
                {bandwidthRanges.map((range) => (
                  <div key={range.label} className="control">
                    <span
                      className="tag is-small zw-bandwidth-tag"
                      style={{
                        backgroundColor: range.color,
                      }}
                      title={range.description}
                    >
                      {range.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Node Types */}
            <div className="column is-one-third">
              <p className="has-text-weight-bold is-size-7 mb-2">Node Types</p>
              <div className="field is-grouped is-grouped-multiline">
                {nodeTypes.map((type) => (
                  <div key={type.label} className="control">
                    <span className="tag is-small is-white">
                      <span
                        className="icon is-small mr-1"
                        style={{ color: type.color }}
                      >
                        <i className={`fas ${type.icon}`} />
                      </span>
                      <span className="is-size-7">{type.label}</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Traffic Flow */}
            <div className="column is-one-third">
              <p className="has-text-weight-bold is-size-7 mb-2">Traffic Flow</p>
              <div className="field is-grouped is-grouped-multiline">
                {trafficIndicators.map((indicator) => (
                  <div key={indicator.label} className="control">
                    <span className="tag is-small is-white">
                      {indicator.symbol ? (
                        <span
                          className="has-text-weight-bold mr-1"
                          style={{ color: indicator.color }}
                        >
                          {indicator.symbol}
                        </span>
                      ) : (
                        <div
                          className={`mr-1 zw-traffic-line-16 ${
                            indicator.style === "dashed"
                              ? "zw-traffic-line-dashed"
                              : "zw-traffic-line-solid"
                          } ${
                            indicator.style === "thick"
                              ? "zw-traffic-line-thick-16"
                              : "zw-traffic-line-normal"
                          }`}
                          style={{
                            backgroundColor: indicator.color || "#6b7280",
                            borderColor: indicator.color || "#6b7280",
                          }}
                        />
                      )}
                      <span className="is-size-7">{indicator.label}</span>
                    </span>
                  </div>
                ))}
                <div className="control">
                  <span className="tag is-small is-white">
                    <span className="icon is-small mr-1">
                      <i className="fas fa-circle zw-status-success " />
                    </span>
                    <span className="is-size-7">Live Traffic</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Vertical layout for sidebar placement
  return (
    <div className="card">
      <div className="card-content p-3">
        <h6 className="title is-6 mb-3">
          <span className="icon-text">
            <span className="icon is-small">
              <i className="fas fa-info-circle" />
            </span>
            <span>Network Legend</span>
          </span>
        </h6>

        {/* Bandwidth Saturation */}
        <div className="field">
          <p className="has-text-weight-bold is-size-7 mb-2">
            Bandwidth Saturation
          </p>
          <div className="content">
            {bandwidthRanges.map((range) => (
              <div key={range.label} className="level is-mobile mb-1">
                <div className="level-left">
                  <div className="level-item">
                    <span
                      className="tag is-small zw-bandwidth-tag-vertical"
                      style={{
                        backgroundColor: range.color,
                      }}
                    >
                      {range.label}
                    </span>
                  </div>
                </div>
                <div className="level-right">
                  <div className="level-item">
                    <span className="is-size-7 has-text-grey">
                      {range.description}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Node Types */}
        <div className="field">
          <p className="has-text-weight-bold is-size-7 mb-2">Node Types</p>
          <div className="content">
            {nodeTypes.map((type) => (
              <div key={type.label} className="level is-mobile mb-1">
                <div className="level-left">
                  <div className="level-item">
                    <span
                      className="icon is-small mr-2"
                      style={{ color: type.color }}
                    >
                      <i className={`fas ${type.icon}`} />
                    </span>
                    <span className="is-size-7">{type.label}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Traffic Flow */}
        <div className="field">
          <p className="has-text-weight-bold is-size-7 mb-2">Traffic Flow</p>
          <div className="content">
            {trafficIndicators.map((indicator) => (
              <div key={indicator.label} className="level is-mobile mb-1">
                <div className="level-left">
                  <div className="level-item">
                    {indicator.symbol ? (
                      <span
                        className="has-text-weight-bold mr-2"
                        style={{ color: indicator.color }}
                      >
                        {indicator.symbol}
                      </span>
                    ) : (
                      <div
                        className={`mr-2 zw-traffic-line-20 ${
                          indicator.style === "dashed"
                            ? "zw-traffic-line-dashed"
                            : "zw-traffic-line-solid"
                        } ${
                          indicator.style === "thick"
                            ? "zw-traffic-line-thick"
                            : "zw-traffic-line-normal"
                        }`}
                        style={{
                          backgroundColor: indicator.color || "#6b7280",
                          borderColor: indicator.color || "#6b7280",
                        }}
                      />
                    )}
                    <span className="is-size-7">{indicator.label}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Animation Indicators */}
        <div className="field">
          <div className="notification is-small p-2">
            <div className="level is-mobile mb-1">
              <div className="level-left">
                <div className="level-item">
                  <span className="icon is-small">
                    <i className="fas fa-circle zw-status-success " />
                  </span>
                  <span className="ml-2 is-size-7">
                    Animated particles show live traffic
                  </span>
                </div>
              </div>
            </div>
            <div className="level is-mobile">
              <div className="level-left">
                <div className="level-item">
                  <span className="icon is-small">
                    <i className="fas fa-bolt zw-status-warning " />
                  </span>
                  <span className="ml-2 is-size-7">
                    Faster animation = higher traffic
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

BandwidthLegend.propTypes = {
  horizontal: PropTypes.bool,
};

export default BandwidthLegend;
