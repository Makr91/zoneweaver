import React, { useState } from 'react';

const ServiceTable = ({ services, loading, onAction, onViewDetails, onViewProperties }) => {
  const [actionLoading, setActionLoading] = useState({});

  const handleAction = async (service, action) => {
    const key = `${service.fmri}-${action}`;
    setActionLoading(prev => ({ ...prev, [key]: true }));
    
    try {
      await onAction(service.fmri, action);
    } finally {
      setActionLoading(prev => ({ ...prev, [key]: false }));
    }
  };

  const getStateIcon = (state) => {
    switch (state.toLowerCase()) {
      case 'online':
        return <span className='icon has-text-success'><i className='fas fa-check-circle'></i></span>;
      case 'disabled':
        return <span className='icon has-text-grey'><i className='fas fa-circle'></i></span>;
      case 'offline':
        return <span className='icon has-text-danger'><i className='fas fa-times-circle'></i></span>;
      case 'legacy_run':
        return <span className='icon has-text-info'><i className='fas fa-legacy'></i></span>;
      case 'maintenance':
        return <span className='icon has-text-warning'><i className='fas fa-exclamation-triangle'></i></span>;
      default:
        return <span className='icon has-text-grey'><i className='fas fa-question-circle'></i></span>;
    }
  };

  const getStateTag = (state) => {
    switch (state.toLowerCase()) {
      case 'online':
        return <span className='tag is-success is-small'>{state}</span>;
      case 'disabled':
        return <span className='tag is-grey is-small'>{state}</span>;
      case 'offline':
        return <span className='tag is-danger is-small'>{state}</span>;
      case 'legacy_run':
        return <span className='tag is-info is-small'>{state}</span>;
      case 'maintenance':
        return <span className='tag is-warning is-small'>{state}</span>;
      default:
        return <span className='tagis-small'>{state}</span>;
    }
  };

  const getAvailableActions = (state) => {
    const lowerState = state.toLowerCase();
    const actions = [];

    if (lowerState === 'disabled') {
      actions.push({ key: 'enable', label: 'Enable', icon: 'fa-play', class: 'is-success' });
    } else if (lowerState === 'online') {
      actions.push({ key: 'disable', label: 'Disable', icon: 'fa-stop', class: 'is-warning' });
      actions.push({ key: 'restart', label: 'Restart', icon: 'fa-redo', class: 'is-info' });
    }
    
    // Refresh is available for most states
    if (!['legacy_run'].includes(lowerState)) {
      actions.push({ key: 'refresh', label: 'Refresh', icon: 'fa-sync', class: 'is-light' });
    }

    return actions;
  };

  const getServiceName = (fmri) => {
    // Extract service name from FMRI
    if (fmri.startsWith('svc:/')) {
      const parts = fmri.split('/');
      return parts[parts.length - 1] || fmri;
    } else if (fmri.startsWith('lrc:/')) {
      const parts = fmri.split('/');
      return parts[parts.length - 1] || fmri;
    }
    return fmri;
  };

  if (loading && services.length === 0) {
    return (
      <div className='has-text-centered p-4'>
        <span className='icon is-large'>
          <i className='fas fa-spinner fa-spin fa-2x'></i>
        </span>
        <p className='mt-2'>Loading services...</p>
      </div>
    );
  }

  if (services.length === 0) {
    return (
      <div className='has-text-centered p-4'>
        <span className='icon is-large has-text-grey'>
          <i className='fas fa-cogs fa-2x'></i>
        </span>
        <p className='mt-2 has-text-grey'>No services found</p>
      </div>
    );
  }

  return (
    <div className='table-container'>
      <table className='table is-fullwidth is-hoverable'>
        <thead>
          <tr>
            <th>Service</th>
            <th>FMRI</th>
            <th>State</th>
            <th>Start Time</th>
            <th width='280'>Actions</th>
          </tr>
        </thead>
        <tbody>
          {services.map((service, index) => {
            const availableActions = getAvailableActions(service.state);
            
            return (
              <tr key={service.fmri || index}>
                <td>
                  <div className='is-flex is-align-items-center'>
                    {getStateIcon(service.state)}
                    <span className='ml-2'>
                      <strong>{getServiceName(service.fmri)}</strong>
                    </span>
                  </div>
                </td>
                <td>
                  <span className='is-family-monospace is-size-7' title={service.fmri}>
                    {service.fmri}
                  </span>
                </td>
                <td>
                  {getStateTag(service.state)}
                </td>
                <td>
                  <span className='is-size-7'>{service.stime || 'N/A'}</span>
                </td>
                <td>
                  <div className='buttons are-small'>
                    {/* Action Buttons */}
                    {availableActions.map((action) => {
                      const key = `${service.fmri}-${action.key}`;
                      const isLoading = actionLoading[key];
                      
                      return (
                        <button
                          key={action.key}
                          className={`button ${action.class} ${isLoading ? 'is-loading' : ''}`}
                          onClick={() => handleAction(service, action.key)}
                          disabled={loading || isLoading}
                          title={action.label}
                        >
                          <span className='icon is-small'>
                            <i className={`fas ${action.icon}`}></i>
                          </span>
                        </button>
                      );
                    })}
                    
                    {/* View Details Button */}
                    <button
                      className='button'
                      onClick={() => onViewDetails(service)}
                      disabled={loading}
                      title='View Details'
                    >
                      <span className='icon is-small'>
                        <i className='fas fa-info-circle'></i>
                      </span>
                    </button>
                    
                    {/* View Properties Button - only for non-legacy services */}
                    {!service.fmri.startsWith('lrc:') && (
                      <button
                        className='button'
                        onClick={() => onViewProperties(service)}
                        disabled={loading}
                        title='View Properties'
                      >
                        <span className='icon is-small'>
                          <i className='fas fa-list'></i>
                        </span>
                      </button>
                    )}
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

export default ServiceTable;
