import React from 'react';

const BandwidthLegend = ({ horizontal = false }) => {
  const bandwidthRanges = [
    { label: '< 25%', color: '#48c78e', description: 'Light load' },
    { label: '25-50%', color: '#ffdd57', description: 'Moderate load' },
    { label: '50-75%', color: '#ff9f43', description: 'Heavy load' },
    { label: '75-90%', color: '#f14668', description: 'Critical load' },
    { label: '> 90%', color: '#e74c3c', description: 'Overloaded' }
  ];

  const nodeTypes = [
    { label: 'Physical NIC', color: '#48c78e', icon: 'fa-ethernet' },
    { label: 'Aggregate', color: '#3273dc', icon: 'fa-link' },
    { label: 'Etherstub', color: '#ffdd57', icon: 'fa-sitemap' },
    { label: 'VNIC', color: '#ff9f43', icon: 'fa-network-wired' },
    { label: 'Zone', color: '#f14668', icon: 'fa-server' }
  ];

  const trafficIndicators = [
    { label: 'RX Traffic', color: '#48c78e', symbol: '↓' },
    { label: 'TX Traffic', color: '#3273dc', symbol: '↑' },
    { label: 'VLAN Tagged', style: 'dashed', description: 'Dashed line' },
    { label: 'LACP Bond', style: 'thick', description: 'Thick line' }
  ];

  if (horizontal) {
    // Horizontal layout for bottom placement
    return (
      <div className="card">
        <div className="card-content p-3">
          <h6 className="title is-6 mb-3 has-text-centered">
            <span className="icon-text">
              <span className="icon is-small">
                <i className="fas fa-info-circle"></i>
              </span>
              <span>Network Legend</span>
            </span>
          </h6>

          <div className="columns is-multiline is-mobile">
            {/* Bandwidth Saturation */}
            <div className="column is-one-third">
              <label className="label is-size-7 mb-2">Bandwidth Saturation</label>
              <div className="field is-grouped is-grouped-multiline">
                {bandwidthRanges.map((range, index) => (
                  <div key={index} className="control">
                    <span 
                      className="tag is-small"
                      style={{ 
                        backgroundColor: range.color, 
                        color: 'white'
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
              <label className="label is-size-7 mb-2">Node Types</label>
              <div className="field is-grouped is-grouped-multiline">
                {nodeTypes.map((type, index) => (
                  <div key={index} className="control">
                    <span className="tag is-small is-white">
                      <span className="icon is-small mr-1" style={{ color: type.color }}>
                        <i className={`fas ${type.icon}`}></i>
                      </span>
                      <span className="is-size-7">{type.label}</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Traffic Flow */}
            <div className="column is-one-third">
              <label className="label is-size-7 mb-2">Traffic Flow</label>
              <div className="field is-grouped is-grouped-multiline">
                {trafficIndicators.map((indicator, index) => (
                  <div key={index} className="control">
                    <span className="tag is-small is-white">
                      {indicator.symbol ? (
                        <span 
                          className="has-text-weight-bold mr-1"
                          style={{ color: indicator.color, fontSize: '12px' }}
                        >
                          {indicator.symbol}
                        </span>
                      ) : (
                        <div 
                          className="mr-1"
                          style={{
                            width: '16px',
                            height: '2px',
                            backgroundColor: indicator.color || '#6b7280',
                            borderStyle: indicator.style === 'dashed' ? 'dashed' : 'solid',
                            borderWidth: indicator.style === 'thick' ? '2px' : '1px',
                            borderColor: indicator.color || '#6b7280'
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
                      <i className="fas fa-circle" style={{ color: '#48c78e', fontSize: '6px' }}></i>
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
    <div className="card" style={{ minWidth: '250px', maxWidth: '300px' }}>
      <div className="card-content p-3">
        <h6 className="title is-6 mb-3">
          <span className="icon-text">
            <span className="icon is-small">
              <i className="fas fa-info-circle"></i>
            </span>
            <span>Network Legend</span>
          </span>
        </h6>

        {/* Bandwidth Saturation */}
        <div className="field">
          <label className="label is-size-7 mb-2">Bandwidth Saturation</label>
          <div className="content">
            {bandwidthRanges.map((range, index) => (
              <div key={index} className="level is-mobile mb-1">
                <div className="level-left">
                  <div className="level-item">
                    <span 
                      className="tag is-small"
                      style={{ 
                        backgroundColor: range.color, 
                        color: 'white',
                        minWidth: '60px'
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
          <label className="label is-size-7 mb-2">Node Types</label>
          <div className="content">
            {nodeTypes.map((type, index) => (
              <div key={index} className="level is-mobile mb-1">
                <div className="level-left">
                  <div className="level-item">
                    <span className="icon is-small mr-2" style={{ color: type.color }}>
                      <i className={`fas ${type.icon}`}></i>
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
          <label className="label is-size-7 mb-2">Traffic Flow</label>
          <div className="content">
            {trafficIndicators.map((indicator, index) => (
              <div key={index} className="level is-mobile mb-1">
                <div className="level-left">
                  <div className="level-item">
                    {indicator.symbol ? (
                      <span 
                        className="has-text-weight-bold mr-2"
                        style={{ color: indicator.color, fontSize: '12px' }}
                      >
                        {indicator.symbol}
                      </span>
                    ) : (
                      <div 
                        className="mr-2"
                        style={{
                          width: '20px',
                          height: '3px',
                          backgroundColor: indicator.color || '#6b7280',
                          borderStyle: indicator.style === 'dashed' ? 'dashed' : 'solid',
                          borderWidth: indicator.style === 'thick' ? '3px' : '1px',
                          borderColor: indicator.color || '#6b7280'
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
                    <i className="fas fa-circle" style={{ color: '#48c78e', fontSize: '6px' }}></i>
                  </span>
                  <span className="ml-2 is-size-7">Animated particles show live traffic</span>
                </div>
              </div>
            </div>
            <div className="level is-mobile">
              <div className="level-left">
                <div className="level-item">
                  <span className="icon is-small">
                    <i className="fas fa-bolt" style={{ color: '#ffdd57', fontSize: '8px' }}></i>
                  </span>
                  <span className="ml-2 is-size-7">Faster animation = higher traffic</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BandwidthLegend;
