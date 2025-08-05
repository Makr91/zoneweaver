import React, { useState, useEffect } from 'react';
import { useServers } from '../../contexts/ServerContext';
import VnicTable from './VnicTable';
import VnicDetailsModal from './VnicDetailsModal';
import VnicCreateModal from './VnicCreateModal';

const VnicManagement = ({ server, onError }) => {
  const [vnics, setVnics] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedVnic, setSelectedVnic] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [availableLinks, setAvailableLinks] = useState([]);
  const [availableZones, setAvailableZones] = useState([]);
  const [filters, setFilters] = useState({
    over: '',
    zone: '',
    state: ''
  });

  const { makeWebHyveRequest } = useServers();

  // Load VNICs on component mount and when filters change
  useEffect(() => {
    loadVnics();
    loadFilterOptions();
  }, [server, filters.over, filters.zone, filters.state]);

  const loadFilterOptions = async () => {
    if (!server || !makeWebHyveRequest) return;
    
    try {
      // Load links and zones for filter dropdowns
      const [linksResult, zonesResult] = await Promise.all([
        makeWebHyveRequest(server.hostname, server.port, server.protocol, 'monitoring/network/interfaces', 'GET'),
        makeWebHyveRequest(server.hostname, server.port, server.protocol, 'zones', 'GET')
      ]);
      
      // Process links
      if (linksResult.success && linksResult.data?.interfaces) {
        const links = linksResult.data.interfaces
          .filter(link => link.class === 'phys')
          .map(link => link.link)
          .filter(Boolean);
        const uniqueLinks = [...new Set(links)].sort();
        setAvailableLinks(uniqueLinks);
      }
      
      // Process zones
      if (zonesResult.success && zonesResult.data?.zones) {
        const zones = zonesResult.data.zones
          .map(zone => zone.name)
          .filter(Boolean);
        const uniqueZones = [...new Set(zones)].sort();
        setAvailableZones(uniqueZones);
      }
    } catch (err) {
      console.error('Error loading filter options:', err);
    }
  };

  const loadVnics = async () => {
    if (!server || !makeWebHyveRequest) return;
    
    try {
      setLoading(true);
      onError('');
      
      const params = {};
      if (filters.over) params.over = filters.over;
      if (filters.zone) params.zone = filters.zone;
      if (filters.state) params.state = filters.state;
      
      const result = await makeWebHyveRequest(
        server.hostname,
        server.port,
        server.protocol,
        'network/vnics',
        'GET',
        null,
        params
      );
      
      if (result.success) {
        // Deduplicate VNICs by link name to avoid duplicate entries
        const rawVnics = result.data?.vnics || [];
        const uniqueVnics = rawVnics.filter((vnic, index, self) => 
          index === self.findIndex(v => v.link === vnic.link)
        );
        setVnics(uniqueVnics);
      } else {
        onError(result.message || 'Failed to load VNICs');
        setVnics([]);
      }
    } catch (err) {
      onError('Error loading VNICs: ' + err.message);
      setVnics([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteVnic = async (vnicName) => {
    if (!server || !makeWebHyveRequest) return;
    
    if (!window.confirm(`Are you sure you want to delete VNIC "${vnicName}"?`)) {
      return;
    }
    
    try {
      setLoading(true);
      onError('');
      
      // Use query parameters instead of request body for DELETE request
      const result = await makeWebHyveRequest(
        server.hostname,
        server.port,
        server.protocol,
        `network/vnics/${encodeURIComponent(vnicName)}`,
        'DELETE',
        null,  // No request body to avoid parsing issues
        {      // Query parameters instead
          temporary: false,
          created_by: 'api'
        }
      );
      
      if (result.success) {
        // Refresh VNICs list after deletion
        await loadVnics();
      } else {
        onError(result.message || `Failed to delete VNIC "${vnicName}"`);
      }
    } catch (err) {
      onError(`Error deleting VNIC "${vnicName}": ` + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = async (vnic) => {
    if (!server || !makeWebHyveRequest) return;
    
    try {
      setLoading(true);
      onError('');
      
      const result = await makeWebHyveRequest(
        server.hostname,
        server.port,
        server.protocol,
        `network/vnics/${encodeURIComponent(vnic.link)}`,
        'GET'
      );
      
      if (result.success) {
        setSelectedVnic({ ...vnic, details: result.data });
        setShowDetailsModal(true);
      } else {
        onError(result.message || 'Failed to load VNIC details');
      }
    } catch (err) {
      onError('Error loading VNIC details: ' + err.message);
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
      over: '',
      zone: '',
      state: ''
    });
  };

  return (
    <div>
      <div className='mb-4'>
        <h2 className='title is-5'>VNIC Management</h2>
        <p className='content'>
          Manage Virtual Network Interface Cards (VNICs) on <strong>{server.hostname}</strong>.
        </p>
      </div>

      {/* VNIC Filters */}
      <div className='box mb-4'>
        <div className='columns'>
          <div className='column'>
            <div className='field'>
              <label className='label'>Filter by Physical Link</label>
              <div className='control'>
                <div className='select is-fullwidth'>
                  <select 
                    value={filters.over}
                    onChange={(e) => handleFilterChange('over', e.target.value)}
                  >
                    <option value=''>All Physical Links</option>
                    {availableLinks.map((link, index) => (
                      <option key={index} value={link}>
                        {link}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>
          <div className='column'>
            <div className='field'>
              <label className='label'>Filter by Zone</label>
              <div className='control'>
                <div className='select is-fullwidth'>
                  <select 
                    value={filters.zone}
                    onChange={(e) => handleFilterChange('zone', e.target.value)}
                  >
                    <option value=''>All Zones</option>
                    {availableZones.map((zone, index) => (
                      <option key={index} value={zone}>
                        {zone}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>
          <div className='column'>
            <div className='field'>
              <label className='label'>Filter by State</label>
              <div className='control'>
                <div className='select is-fullwidth'>
                  <select 
                    value={filters.state}
                    onChange={(e) => handleFilterChange('state', e.target.value)}
                  >
                    <option value=''>All States</option>
                    <option value='up'>Up</option>
                    <option value='down'>Down</option>
                    <option value='unknown'>Unknown</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
          <div className='column is-narrow'>
            <div className='field'>
              <label className='label'>&nbsp;</label>
              <div className='control'>
                <button 
                  className='button is-info'
                  onClick={loadVnics}
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

      {/* VNICs Table */}
      <div className='box'>
        <div className='level is-mobile mb-4'>
          <div className='level-left'>
            <h3 className='title is-6'>
              VNICs ({vnics.length})
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
              <span>Create VNIC</span>
            </button>
          </div>
        </div>

        <VnicTable 
          vnics={vnics}
          loading={loading}
          onDelete={handleDeleteVnic}
          onViewDetails={handleViewDetails}
        />
      </div>

      {/* VNIC Details Modal */}
      {showDetailsModal && selectedVnic && (
        <VnicDetailsModal 
          vnic={selectedVnic}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedVnic(null);
          }}
        />
      )}

      {/* VNIC Create Modal */}
      {showCreateModal && (
        <VnicCreateModal 
          server={server}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            loadVnics();
          }}
          onError={onError}
        />
      )}
    </div>
  );
};

export default VnicManagement;
