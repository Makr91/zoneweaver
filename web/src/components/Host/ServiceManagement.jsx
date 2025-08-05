import React, { useState, useEffect } from 'react';
import { useServers } from '../../contexts/ServerContext';
import ServiceTable from './ServiceTable';
import ServiceDetailsModal from './ServiceDetailsModal';
import ServicePropertiesModal from './ServicePropertiesModal';

const ServiceManagement = ({ server }) => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [availableZones, setAvailableZones] = useState([]);
  const [filters, setFilters] = useState({
    pattern: '',
    zone: '',
    state: '',
    showDisabled: false
  });
  
  // Modal states
  const [selectedService, setSelectedService] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showPropertiesModal, setShowPropertiesModal] = useState(false);
  
  const { makeWebHyveRequest } = useServers();

  // Load services on component mount and when filters change
  useEffect(() => {
    loadServices();
    loadZones();
  }, [server, filters.pattern, filters.zone, filters.showDisabled]); // Only reload for backend filters

  const loadZones = async () => {
    if (!server || !makeWebHyveRequest) return;
    
    try {
      const result = await makeWebHyveRequest(
        server.hostname,
        server.port,
        server.protocol,
        'zones',
        'GET'
      );
      
      if (result.success && result.data?.zones) {
        // Extract unique zone names from zones data
        const zones = result.data.zones.map(zone => zone.name).filter(Boolean);
        const uniqueZones = [...new Set(zones)].sort();
        setAvailableZones(uniqueZones);
      }
    } catch (err) {
      console.error('Error loading zones:', err);
    }
  };

  const loadServices = async () => {
    if (!server || !makeWebHyveRequest) return;
    
    try {
      setLoading(true);
      setError('');
      
      const params = {};
      if (filters.pattern) params.pattern = filters.pattern;
      if (filters.zone) params.zone = filters.zone;
      if (filters.showDisabled) params.all = true;
      
      const result = await makeWebHyveRequest(
        server.hostname,
        server.port,
        server.protocol,
        'services',
        'GET',
        null,
        params
      );
      
      if (result.success) {
        setServices(result.data || []);
      } else {
        setError(result.message || 'Failed to load services');
        setServices([]);
      }
    } catch (err) {
      setError('Error loading services: ' + err.message);
      setServices([]);
    } finally {
      setLoading(false);
    }
  };

  const handleServiceAction = async (fmri, action) => {
    if (!server || !makeWebHyveRequest) return;
    
    try {
      setLoading(true);
      setError('');
      
      const result = await makeWebHyveRequest(
        server.hostname,
        server.port,
        server.protocol,
        'services/action',
        'POST',
        {
          fmri: encodeURIComponent(fmri),
          action: action,
          options: {}
        }
      );
      
      if (result.success) {
        // Refresh services list after action
        await loadServices();
      } else {
        setError(result.message || `Failed to ${action} service`);
      }
    } catch (err) {
      setError(`Error performing ${action}: ` + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = async (service) => {
    if (!server || !makeWebHyveRequest) return;
    
    try {
      setLoading(true);
      setError('');
      
      const result = await makeWebHyveRequest(
        server.hostname,
        server.port,
        server.protocol,
        `services/${encodeURIComponent(service.fmri)}`,
        'GET'
      );
      
      if (result.success) {
        setSelectedService({ ...service, details: result.data });
        setShowDetailsModal(true);
      } else {
        setError(result.message || 'Failed to load service details');
      }
    } catch (err) {
      setError('Error loading service details: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleViewProperties = async (service) => {
    if (!server || !makeWebHyveRequest) return;
    
    try {
      setLoading(true);
      setError('');
      
      const result = await makeWebHyveRequest(
        server.hostname,
        server.port,
        server.protocol,
        `services/${encodeURIComponent(service.fmri)}/properties`,
        'GET'
      );
      
      if (result.success) {
        setSelectedService({ ...service, properties: result.data });
        setShowPropertiesModal(true);
      } else {
        setError(result.message || 'Failed to load service properties');
      }
    } catch (err) {
      setError('Error loading service properties: ' + err.message);
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
      pattern: '',
      zone: '',
      state: '',
      showDisabled: false
    });
  };

  // Apply client-side filtering for state since backend doesn't support it
  const filteredServices = services.filter(service => {
    if (filters.state && service.state.toLowerCase() !== filters.state.toLowerCase()) {
      return false;
    }
    return true;
  });

  return (
    <div>
      {/* Service Filters */}
      <div className='box mb-4'>
        <div className='columns'>
          <div className='column'>
            <div className='field'>
              <label className='label'>Filter by Service Name</label>
              <div className='control'>
                <input 
                  className='input'
                  type='text'
                  placeholder='Enter service name pattern...'
                  value={filters.pattern}
                  onChange={(e) => handleFilterChange('pattern', e.target.value)}
                />
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
                    <option value='online'>Online</option>
                    <option value='disabled'>Disabled</option>
                    <option value='offline'>Offline</option>
                    <option value='legacy_run'>Legacy Run</option>
                    <option value='maintenance'>Maintenance</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
          <div className='column is-narrow'>
            <div className='field'>
              <label className='label'>Show Disabled</label>
              <div className='control'>
                <label className='switch'>
                  <input 
                    type='checkbox'
                    checked={filters.showDisabled}
                    onChange={(e) => handleFilterChange('showDisabled', e.target.checked)}
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
                  onClick={loadServices}
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

      {/* Error Display */}
      {error && (
        <div className='notification is-danger mb-4'>
          <button className='delete' onClick={() => setError('')}></button>
          <p>{error}</p>
        </div>
      )}

      {/* Services Table */}
      <div className='box'>
        <div className='level is-mobile mb-4'>
          <div className='level-left'>
            <h3 className='title is-6'>
              Services ({filteredServices.length})
              {loading && <span className='ml-2'><i className='fas fa-spinner fa-spin'></i></span>}
            </h3>
          </div>
        </div>

        <ServiceTable 
          services={filteredServices}
          loading={loading}
          onAction={handleServiceAction}
          onViewDetails={handleViewDetails}
          onViewProperties={handleViewProperties}
        />
      </div>

      {/* Service Details Modal */}
      {showDetailsModal && selectedService && (
        <ServiceDetailsModal 
          service={selectedService}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedService(null);
          }}
        />
      )}

      {/* Service Properties Modal */}
      {showPropertiesModal && selectedService && (
        <ServicePropertiesModal 
          service={selectedService}
          onClose={() => {
            setShowPropertiesModal(false);
            setSelectedService(null);
          }}
        />
      )}
    </div>
  );
};

export default ServiceManagement;
