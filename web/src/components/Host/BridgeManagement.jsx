import React, { useState, useEffect } from 'react';
import { useServers } from '../../contexts/ServerContext';
import BridgeTable from './BridgeTable';
import BridgeCreateModal from './BridgeCreateModal';

const BridgeManagement = ({ server, onError }) => {
  const [bridges, setBridges] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filters, setFilters] = useState({
    name: ''
  });

  const { makeZoneweaverAPIRequest } = useServers();

  // Load bridges on component mount and when filters change
  useEffect(() => {
    loadBridges();
  }, [server, filters.name]);

  const loadBridges = async () => {
    if (!server || !makeZoneweaverAPIRequest) return;
    
    try {
      setLoading(true);
      onError('');
      
      const params = {};
      if (filters.name) params.name = filters.name;
      params.extended = true; // Include detailed bridge information
      
      const result = await makeZoneweaverAPIRequest(
        server.hostname,
        server.port,
        server.protocol,
        'network/bridges',
        'GET',
        null,
        params
      );
      
      if (result.success) {
        setBridges(result.data?.bridges || []);
      } else {
        onError(result.message || 'Failed to load bridges');
        setBridges([]);
      }
    } catch (err) {
      onError('Error loading bridges: ' + err.message);
      setBridges([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBridge = async (bridgeName) => {
    if (!server || !makeZoneweaverAPIRequest) return;
    
    if (!window.confirm(`Are you sure you want to delete bridge "${bridgeName}"?`)) {
      return;
    }
    
    try {
      setLoading(true);
      onError('');
      
      // Use query parameters instead of request body for DELETE request
      const result = await makeZoneweaverAPIRequest(
        server.hostname,
        server.port,
        server.protocol,
        `network/bridges/${encodeURIComponent(bridgeName)}`,
        'DELETE',
        null,  // No request body to avoid parsing issues
        {      // Query parameters instead
          force: false,
          created_by: 'api'
        }
      );
      
      if (result.success) {
        // Refresh bridges list after deletion
        await loadBridges();
      } else {
        onError(result.message || `Failed to delete bridge "${bridgeName}"`);
      }
    } catch (err) {
      onError(`Error deleting bridge "${bridgeName}": ` + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = async (bridge) => {
    if (!server || !makeZoneweaverAPIRequest) return;
    
    try {
      setLoading(true);
      onError('');
      
      const result = await makeZoneweaverAPIRequest(
        server.hostname,
        server.port,
        server.protocol,
        `network/bridges/${encodeURIComponent(bridge.name)}?show_links=true&show_forwarding=true`,
        'GET'
      );
      
      if (result.success) {
        // For now, just show an alert with the details
        // In a full implementation, you'd create a BridgeDetailsModal
        alert(`Bridge Details:\n${JSON.stringify(result.data, null, 2)}`);
      } else {
        onError(result.message || 'Failed to load bridge details');
      }
    } catch (err) {
      onError('Error loading bridge details: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      name: ''
    });
  };

  return (
    <div>
      <div className='mb-4'>
        <h2 className='title is-5'>Bridge Management</h2>
        <p className='content'>
          Manage 802.1D bridges on <strong>{server.hostname}</strong>.
        </p>
      </div>

      {/* Bridge Filters */}
      <div className='box mb-4'>
        <div className='columns'>
          <div className='column'>
            <div className='field'>
              <label className='label'>Filter by Name</label>
              <div className='control'>
                <input 
                  className='input'
                  type='text'
                  placeholder='Bridge name'
                  value={filters.name}
                  onChange={(e) => handleFilterChange('name', e.target.value)}
                />
              </div>
            </div>
          </div>
          <div className='column is-narrow'>
            <div className='field'>
              <label className='label'>&nbsp;</label>
              <div className='control'>
                <button 
                  className='button is-info'
                  onClick={loadBridges}
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

      {/* Bridges Table */}
      <div className='box'>
        <div className='level is-mobile mb-4'>
          <div className='level-left'>
            <h3 className='title is-6'>
              Bridges ({bridges.length})
              {loading && <span className='ml-2'><i className='fas fa-spinner fa-spin'></i></span>}
            </h3>
          </div>
          <div className='level-right'>
            <button 
              className='button is-primary'
              onClick={() => setShowCreateModal(true)}
              disabled={loading}
            >
              <span className='icon'>
                <i className='fas fa-plus'></i>
              </span>
              <span>Create Bridge</span>
            </button>
          </div>
        </div>

        <BridgeTable 
          bridges={bridges}
          loading={loading}
          onDelete={handleDeleteBridge}
          onViewDetails={handleViewDetails}
        />
      </div>

      {/* Bridge Create Modal */}
      {showCreateModal && (
        <BridgeCreateModal 
          server={server}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            loadBridges();
          }}
          onError={onError}
        />
      )}
    </div>
  );
};

export default BridgeManagement;
