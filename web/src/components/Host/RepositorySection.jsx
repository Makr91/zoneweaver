import React, { useState, useEffect } from 'react';
import { useServers } from '../../contexts/ServerContext';
import RepositoryTable from './RepositoryTable';
import AddRepositoryModal from './AddRepositoryModal';
import EditRepositoryModal from './EditRepositoryModal';

const RepositorySection = ({ server, onError }) => {
  const [repositories, setRepositories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedRepository, setSelectedRepository] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [filters, setFilters] = useState({
    publisher: '',
    enabledOnly: false,
    type: ''
  });

  const { makeZoneweaverAPIRequest } = useServers();

  // Load repositories on component mount and when filters change
  useEffect(() => {
    loadRepositories();
  }, [server, filters.enabledOnly, filters.publisher]);

  const loadRepositories = async () => {
    if (!server || !makeZoneweaverAPIRequest) return;
    
    try {
      setLoading(true);
      onError('');
      
      const params = {};
      if (filters.enabledOnly) params.enabled_only = true;
      if (filters.publisher) params.publisher = filters.publisher;
      
      const result = await makeZoneweaverAPIRequest(
        server.hostname,
        server.port,
        server.protocol,
        'system/repositories',
        'GET',
        null,
        params
      );
      
      if (result.success) {
        const repoList = result.data?.publishers || [];
        // Filter by type on client side
        const filteredRepos = repoList.filter(repo => {
          if (filters.type && repo.type !== filters.type) return false;
          return true;
        });
        setRepositories(filteredRepos);
      } else {
        onError(result.message || 'Failed to load repositories');
        setRepositories([]);
      }
    } catch (err) {
      onError('Error loading repositories: ' + err.message);
      setRepositories([]);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleRepository = async (publisherName, enable) => {
    if (!server || !makeZoneweaverAPIRequest) return;
    
    try {
      setLoading(true);
      onError('');
      
      const action = enable ? 'enable' : 'disable';
      const result = await makeZoneweaverAPIRequest(
        server.hostname,
        server.port,
        server.protocol,
        `system/repositories/${encodeURIComponent(publisherName)}/${action}`,
        'POST',
        { created_by: 'api' }
      );
      
      if (result.success) {
        // Refresh repositories list after action
        await loadRepositories();
      } else {
        onError(result.message || `Failed to ${action} repository`);
      }
    } catch (err) {
      onError(`Error ${enable ? 'enabling' : 'disabling'} repository: ` + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRepository = async (publisherName) => {
    if (!server || !makeZoneweaverAPIRequest) return;
    
    if (!window.confirm(`Are you sure you want to remove repository "${publisherName}"?`)) {
      return;
    }
    
    try {
      setLoading(true);
      onError('');
      
      const result = await makeZoneweaverAPIRequest(
        server.hostname,
        server.port,
        server.protocol,
        `system/repositories/${encodeURIComponent(publisherName)}`,
        'DELETE'
      );
      
      if (result.success) {
        // Refresh repositories list after deletion
        await loadRepositories();
      } else {
        onError(result.message || `Failed to delete repository "${publisherName}"`);
      }
    } catch (err) {
      onError(`Error deleting repository "${publisherName}": ` + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEditRepository = (repo) => {
    setSelectedRepository(repo);
    setShowEditModal(true);
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      publisher: '',
      enabledOnly: false,
      type: ''
    });
  };

  // Group repositories by publisher name for display
  const groupedRepositories = repositories.reduce((acc, repo) => {
    if (!acc[repo.name]) {
      acc[repo.name] = [];
    }
    acc[repo.name].push(repo);
    return acc;
  }, {});

  const repositoryGroups = Object.entries(groupedRepositories).map(([name, repos]) => ({
    name,
    repositories: repos,
    enabled: repos.some(r => r.enabled !== false),
    origins: repos.filter(r => r.type === 'origin'),
    mirrors: repos.filter(r => r.type === 'mirror')
  }));

  return (
    <div>
      <div className='mb-4'>
        <h2 className='title is-5'>Repository Management</h2>
        <p className='content'>
          Manage package repositories (publishers) on <strong>{server.hostname}</strong>. 
          Add, remove, enable, and disable package repositories.
        </p>
      </div>

      {/* Repository Filters */}
      <div className='box mb-4'>
        <div className='columns'>
          <div className='column'>
            <div className='field'>
              <label className='label'>Filter by Publisher</label>
              <div className='control'>
                <input 
                  className='input'
                  type='text'
                  placeholder='Enter publisher name...'
                  value={filters.publisher}
                  onChange={(e) => handleFilterChange('publisher', e.target.value)}
                />
              </div>
            </div>
          </div>
          <div className='column'>
            <div className='field'>
              <label className='label'>Filter by Type</label>
              <div className='control'>
                <div className='select is-fullwidth'>
                  <select 
                    value={filters.type}
                    onChange={(e) => handleFilterChange('type', e.target.value)}
                  >
                    <option value=''>All Types</option>
                    <option value='origin'>Origin</option>
                    <option value='mirror'>Mirror</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
          <div className='column is-narrow'>
            <div className='field'>
              <label className='label'>Enabled Only</label>
              <div className='control'>
                <label className='switch'>
                  <input 
                    type='checkbox'
                    checked={filters.enabledOnly}
                    onChange={(e) => handleFilterChange('enabledOnly', e.target.checked)}
                  />
                  <span className='slider round'></span>
                </label>
              </div>
            </div>
          </div>
          <div className='column is-narrow'>
            <div className='field'>
              <label className='label'>&nbsp;</label>
              <div className='control'>
                <button 
                  className='button is-info'
                  onClick={loadRepositories}
                  disabled={loading}
                >
                  <span className='icon'>
                    <i className='fas fa-sync-alt'></i>
                  </span>
                  <span>Refresh</span>
                </button>
              </div>
            </div>
          </div>
          <div className='column is-narrow'>
            <div className='field'>
              <label className='label'>&nbsp;</label>
              <div className='control'>
                <button 
                  className='button'
                  onClick={clearFilters}
                  disabled={loading}
                >
                  <span className='icon'>
                    <i className='fas fa-times'></i>
                  </span>
                  <span>Clear</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Repositories Table */}
      <div className='box'>
        <div className='level is-mobile mb-4'>
          <div className='level-left'>
            <h3 className='title is-6'>
              Repositories ({repositories.length})
              {loading && <span className='ml-2'><i className='fas fa-spinner fa-spin'></i></span>}
            </h3>
          </div>
          <div className='level-right'>
            <button 
              className='button is-primary'
              onClick={() => setShowAddModal(true)}
              disabled={loading}
            >
              <span className='icon'>
                <i className='fas fa-plus'></i>
              </span>
              <span>Add Repository</span>
            </button>
          </div>
        </div>

        <RepositoryTable 
          repositories={repositories}
          repositoryGroups={repositoryGroups}
          loading={loading}
          onToggle={handleToggleRepository}
          onEdit={handleEditRepository}
          onDelete={handleDeleteRepository}
        />
      </div>

      {/* Add Repository Modal */}
      {showAddModal && (
        <AddRepositoryModal 
          server={server}
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false);
            loadRepositories();
          }}
          onError={onError}
        />
      )}

      {/* Edit Repository Modal */}
      {showEditModal && selectedRepository && (
        <EditRepositoryModal 
          server={server}
          repository={selectedRepository}
          onClose={() => {
            setShowEditModal(false);
            setSelectedRepository(null);
          }}
          onSuccess={() => {
            setShowEditModal(false);
            setSelectedRepository(null);
            loadRepositories();
          }}
          onError={onError}
        />
      )}
    </div>
  );
};

export default RepositorySection;
