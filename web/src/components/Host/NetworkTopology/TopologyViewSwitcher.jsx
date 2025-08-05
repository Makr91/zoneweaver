import React from 'react';

const TopologyViewSwitcher = ({ 
  currentView, 
  onViewChange, 
  layoutType, 
  onLayoutChange 
}) => {
  const views = [
    { 
      id: 'physical', 
      name: 'Physical', 
      icon: 'fa-ethernet',
      description: 'Hardware NICs, aggregates, and physical connections',
      color: 'is-success'
    },
    { 
      id: 'logical', 
      name: 'Virtual', 
      icon: 'fa-network-wired',
      description: 'VNICs, etherstubs, and logical connections',
      color: 'is-primary'
    },
    { 
      id: 'zone-centric', 
      name: 'Zones', 
      icon: 'fa-server',
      description: 'Zone-centered network topology',
      color: 'is-warning'
    },
    { 
      id: 'bandwidth', 
      name: 'Traffic', 
      icon: 'fa-chart-line',
      description: 'Live bandwidth and traffic flow analysis',
      color: 'is-info'
    },
    { 
      id: 'vlan', 
      name: 'VLANs', 
      icon: 'fa-tags',
      description: 'Network segmentation and VLAN topology',
      color: 'is-link'
    },
    { 
      id: 'troubleshoot', 
      name: 'Debug', 
      icon: 'fa-bug',
      description: 'Troubleshooting and diagnostics view',
      color: 'is-danger'
    }
  ];

  const layouts = [
    { id: 'hierarchical', name: 'Hierarchical', icon: 'fa-sitemap' },
    { id: 'force', name: 'Force', icon: 'fa-asterisk' },
    { id: 'circular', name: 'Circular', icon: 'fa-circle-notch' },
    { id: 'grid', name: 'Grid', icon: 'fa-th' }
  ];

  return (
    <div className="mb-3">
      {/* View Tabs */}
      <div className="level is-mobile mb-3">
        <div className="level-left">
          <div className="level-item">
            <div className="tabs is-toggle">
              <ul>
                {views.map(view => (
                  <li 
                    key={view.id} 
                    className={currentView === view.id ? 'is-active' : ''}
                  >
                    <a 
                      onClick={() => onViewChange(view.id)}
                      title={view.description}
                    >
                      <span className="icon is-small">
                        <i className={`fas ${view.icon}`}></i>
                      </span>
                      <span>{view.name}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Layout Selector */}
      <div className="level is-mobile">
        <div className="level-left">
          <div className="level-item">
            <span className="is-size-7 has-text-weight-semibold mr-3">Layout:</span>
          </div>
          <div className="level-item">
            <div className="field has-addons">
              {layouts.map(layout => (
                <div key={layout.id} className="control">
                  <button
                    className={`button is-small ${layoutType === layout.id ? 'is-primary' : ''}`}
                    onClick={() => onLayoutChange(layout.id)}
                    title={layout.name}
                  >
                    <span className="icon is-small">
                      <i className={`fas ${layout.icon}`}></i>
                    </span>
                    <span>{layout.name}</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="level-right">
          <div className="level-item">
            <p className="is-size-7 has-text-grey">
              {views.find(v => v.id === currentView)?.description}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TopologyViewSwitcher;
