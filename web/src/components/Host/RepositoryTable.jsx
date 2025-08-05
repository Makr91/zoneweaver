import React, { useState } from 'react';

const RepositoryTable = ({ repositories, repositoryGroups, loading, onToggle, onEdit, onDelete }) => {
  const [actionLoading, setActionLoading] = useState({});

  const handleAction = async (repo, action) => {
    const key = `${repo.name}-${action}`;
    setActionLoading(prev => ({ ...prev, [key]: true }));
    
    try {
      if (action === 'enable') {
        await onToggle(repo.name, true);
      } else if (action === 'disable') {
        await onToggle(repo.name, false);
      } else if (action === 'edit') {
        await onEdit(repo);
      } else if (action === 'delete') {
        await onDelete(repo.name);
      }
    } finally {
      setActionLoading(prev => ({ ...prev, [key]: false }));
    }
  };

  const getStatusIcon = (repo) => {
    const isEnabled = repo.enabled !== false;
    if (repo.status === 'online' && isEnabled) {
      return <span className='icon has-text-success'><i className='fas fa-check-circle'></i></span>;
    }
    if (repo.status === 'online' && !isEnabled) {
      return <span className='icon has-text-warning'><i className='fas fa-pause-circle'></i></span>;
    }
    return <span className='icon has-text-danger'><i className='fas fa-times-circle'></i></span>;
  };

  const getStatusTag = (repo) => {
    const isEnabled = repo.enabled !== false;
    if (repo.status === 'online' && isEnabled) {
      return <span className='tag is-success is-small'>Online</span>;
    }
    if (repo.status === 'online' && !isEnabled) {
      return <span className='tag is-warning is-small'>Disabled</span>;
    }
    return <span className='tag is-danger is-small'>Offline</span>;
  };

  const getTypeTag = (type) => {
    switch (type?.toLowerCase()) {
      case 'origin':
        return <span className='tag is-primary is-small'>Origin</span>;
      case 'mirror':
        return <span className='tag is-info is-small'>Mirror</span>;
      default:
        return <span className='tag is-grey is-small'>{type || 'Unknown'}</span>;
    }
  };

  const getProxyTag = (proxy) => {
    if (proxy === 'T' || proxy === true) {
      return <span className='tag is-warning is-small'>Yes</span>;
    }
    return <span className='tag is-grey is-small'>No</span>;
  };

  const getAvailableActions = (repo) => {
    const actions = [];
    const isEnabled = repo.enabled !== false;

    if (isEnabled) {
      actions.push({ key: 'disable', label: 'Disable', icon: 'fa-pause', class: 'has-background-warning-dark has-text-warning-light' });
    } else {
      actions.push({ key: 'enable', label: 'Enable', icon: 'fa-play', class: 'has-background-success-dark has-text-success-light' });
    }

    return actions;
  };

  const formatLocation = (location) => {
    if (!location) return 'N/A';
    
    // Truncate long URLs
    if (location.length > 50) {
      return location.substring(0, 50) + '...';
    }
    return location;
  };

  if (loading && repositories.length === 0) {
    return (
      <div className='has-text-centered p-4'>
        <span className='icon is-large'>
          <i className='fas fa-spinner fa-spin fa-2x'></i>
        </span>
        <p className='mt-2'>Loading repositories...</p>
      </div>
    );
  }

  if (repositories.length === 0) {
    return (
      <div className='has-text-centered p-4'>
        <span className='icon is-large has-text-grey'>
          <i className='fas fa-database fa-2x'></i>
        </span>
        <p className='mt-2 has-text-grey'>No repositories found</p>
      </div>
    );
  }

  return (
    <div className='table-container'>
      <table className='table is-fullwidth is-hoverable is-striped'>
        <thead>
          <tr>
            <th>Publisher</th>
            <th>Type</th>
            <th>Status</th>
            <th>Location</th>
            <th>Proxy</th>
            <th width='150'>Actions</th>
          </tr>
        </thead>
        <tbody>
          {repositories.map((repo, index) => {
            const availableActions = getAvailableActions(repo);
            
            return (
              <tr key={`${repo.name}-${repo.type}-${index}`}>
                <td>
                  <div className='is-flex is-align-items-center'>
                    {getStatusIcon(repo)}
                    <span className='ml-2'>
                      <strong className='is-family-monospace'>{repo.name}</strong>
                    </span>
                  </div>
                </td>
                <td>
                  {getTypeTag(repo.type)}
                </td>
                <td>
                  {getStatusTag(repo)}
                </td>
                <td>
                  <span 
                    className='is-size-7 is-family-monospace'
                    title={repo.location}
                  >
                    {formatLocation(repo.location)}
                  </span>
                </td>
                <td>
                  {getProxyTag(repo.proxy)}
                </td>
                <td>
                  <div className='buttons are-small'>
                    {/* Enable/Disable Buttons */}
                    {availableActions.map((action) => {
                      const key = `${repo.name}-${action.key}`;
                      const isLoading = actionLoading[key];
                      
                      return (
                        <button
                          key={action.key}
                          className={`button ${action.class} ${isLoading ? 'is-loading' : ''}`}
                          onClick={() => handleAction(repo, action.key)}
                          disabled={loading || isLoading}
                          title={action.label}
                        >
                          <span className='icon is-small'>
                            <i className={`fas ${action.icon}`}></i>
                          </span>
                        </button>
                      );
                    })}
                    
                    {/* Edit Button */}
                    <button
                      className='button'
                      onClick={() => handleAction(repo, 'edit')}
                      disabled={loading}
                      title='Edit Repository'
                    >
                      <span className='icon is-small'>
                        <i className='fas fa-edit'></i>
                      </span>
                    </button>
                    
                    {/* Delete Button */}
                    <button
                      className='button has-background-danger-dark has-text-danger-light'
                      onClick={() => handleAction(repo, 'delete')}
                      disabled={loading}
                      title='Delete Repository'
                    >
                      <span className='icon is-small'>
                        <i className='fas fa-trash'></i>
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

export default RepositoryTable;
