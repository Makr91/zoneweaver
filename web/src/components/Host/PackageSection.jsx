import React, { useState, useEffect } from 'react';
import { useServers } from '../../contexts/ServerContext';
import PackageTable from './PackageTable';
import PackageDetailsModal from './PackageDetailsModal';
import PackageActionModal from './PackageActionModal';

const PackageSection = ({ server, onError }) => {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showActionModal, setShowActionModal] = useState(false);
  const [actionType, setActionType] = useState('install');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearchMode, setIsSearchMode] = useState(false);
  const [filters, setFilters] = useState({
    pattern: '',
    publisher: '',
    status: '',
    showAll: false,
    searchQuery: ''
  });

  const { makeZoneweaverAPIRequest } = useServers();

  // Load packages on component mount and when filters change
  useEffect(() => {
    if (filters.searchQuery) {
      searchPackages();
    } else {
      loadPackages();
    }
  }, [server, filters.pattern, filters.publisher, filters.status, filters.showAll]);

  const loadPackages = async () => {
    if (!server || !makeZoneweaverAPIRequest) return;
    
    try {
      setLoading(true);
      onError('');
      setIsSearchMode(false);
      
      const params = {};
      if (filters.pattern) params.filter = filters.pattern;
      if (filters.showAll) params.all = true;
      
      const result = await makeZoneweaverAPIRequest(
        server.hostname,
        server.port,
        server.protocol,
        'system/packages',
        'GET',
        null,
        params
      );
      
      if (result.success) {
        const packageList = result.data?.packages || [];
        // Filter by publisher and status on client side
        const filteredPackages = packageList.filter(pkg => {
          if (filters.publisher && pkg.publisher !== filters.publisher) return false;
          if (filters.status) {
            if (filters.status === 'installed' && !pkg.installed) return false;
            if (filters.status === 'frozen' && !pkg.frozen) return false;
            if (filters.status === 'manual' && !pkg.manually_installed) return false;
          }
          return true;
        });
        setPackages(filteredPackages);
      } else {
        onError(result.message || 'Failed to load packages');
        setPackages([]);
      }
    } catch (err) {
      onError('Error loading packages: ' + err.message);
      setPackages([]);
    } finally {
      setLoading(false);
    }
  };

  const searchPackages = async () => {
    if (!server || !makeZoneweaverAPIRequest || !filters.searchQuery.trim()) return;
    
    try {
      setLoading(true);
      onError('');
      setIsSearchMode(true);
      
      const result = await makeZoneweaverAPIRequest(
        server.hostname,
        server.port,
        server.protocol,
        'system/packages/search',
        'GET',
        null,
        { 
          query: filters.searchQuery.trim(),
          local: false,
          remote: true
        }
      );
      
      if (result.success) {
        // Transform search results to package-like format
        const searchData = result.data?.results || [];
        const packageNames = [...new Set(searchData
          .filter(item => item.index === 'pkg.fmri')
          .map(item => item.package.split('@')[0].replace('pkg:/', ''))
        )];
        
        const transformedResults = packageNames.map(name => ({
          name: name,
          publisher: 'Available',
          version: 'Latest',
          installed: false,
          frozen: false,
          manually_installed: false,
          flags: 'a--'
        }));
        
        setSearchResults(transformedResults);
      } else {
        onError(result.message || 'Failed to search packages');
        setSearchResults([]);
      }
    } catch (err) {
      onError('Error searching packages: ' + err.message);
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handlePackageAction = async (packageName, action, options = {}) => {
    if (!server || !makeZoneweaverAPIRequest) return;
    
    try {
      setLoading(true);
      onError('');
      
      const endpoint = action === 'install' ? 'system/packages/install' : 'system/packages/uninstall';
      const requestData = {
        packages: [packageName],
        dry_run: options.dryRun || false,
        accept_licenses: options.acceptLicenses || false,
        be_name: options.beName || '',
        created_by: 'api'
      };
      
      const result = await makeZoneweaverAPIRequest(
        server.hostname,
        server.port,
        server.protocol,
        endpoint,
        'POST',
        requestData
      );
      
      if (result.success) {
        // Refresh package list after action
        await loadPackages();
        return { success: true, data: result.data };
      } else {
        onError(result.message || `Failed to ${action} package`);
        return { success: false, message: result.message };
      }
    } catch (err) {
      const errorMsg = `Error during package ${action}: ` + err.message;
      onError(errorMsg);
      return { success: false, message: errorMsg };
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = async (pkg) => {
    if (!server || !makeZoneweaverAPIRequest) return;
    
    try {
      setLoading(true);
      onError('');
      
      const result = await makeZoneweaverAPIRequest(
        server.hostname,
        server.port,
        server.protocol,
        'system/packages/info',
        'GET',
        null,
        { 
          package: pkg.name,
          remote: !pkg.installed
        }
      );
      
      if (result.success) {
        setSelectedPackage({ ...pkg, details: result.data });
        setShowDetailsModal(true);
      } else {
        onError(result.message || 'Failed to load package details');
      }
    } catch (err) {
      onError('Error loading package details: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleShowActionModal = (pkg, action) => {
    setSelectedPackage(pkg);
    setActionType(action);
    setShowActionModal(true);
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSearch = () => {
    if (filters.searchQuery.trim()) {
      searchPackages();
    } else {
      setIsSearchMode(false);
      loadPackages();
    }
  };

  const clearFilters = () => {
    setFilters({
      pattern: '',
      publisher: '',
      status: '',
      showAll: false,
      searchQuery: ''
    });
    setIsSearchMode(false);
  };

  const displayPackages = isSearchMode ? searchResults : packages;

  return (
    <div>
      <div className='mb-4'>
        <h2 className='title is-5'>Package Management</h2>
        <p className='content'>
          Manage packages on <strong>{server.hostname}</strong>. Search for available packages, install, uninstall, and view package information.
        </p>
      </div>

      {/* Package Filters */}
      <div className='box mb-4'>
        <div className='columns'>
          <div className='column'>
            <div className='field'>
              <label className='label'>Filter by Package Name</label>
              <div className='control'>
                <input 
                  className='input'
                  type='text'
                  placeholder='Enter package name pattern...'
                  value={filters.pattern}
                  onChange={(e) => handleFilterChange('pattern', e.target.value)}
                  disabled={isSearchMode}
                />
              </div>
            </div>
          </div>
          <div className='column'>
            <div className='field'>
              <label className='label'>Filter by Publisher</label>
              <div className='control'>
                <div className='select is-fullwidth'>
                  <select 
                    value={filters.publisher}
                    onChange={(e) => handleFilterChange('publisher', e.target.value)}
                    disabled={isSearchMode}
                  >
                    <option value=''>All Publishers</option>
                    <option value='omnios'>omnios</option>
                    <option value='extra.omnios'>extra.omnios</option>
                    <option value='ooce'>ooce</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
          <div className='column'>
            <div className='field'>
              <label className='label'>Filter by Status</label>
              <div className='control'>
                <div className='select is-fullwidth'>
                  <select 
                    value={filters.status}
                    onChange={(e) => handleFilterChange('status', e.target.value)}
                    disabled={isSearchMode}
                  >
                    <option value=''>All Status</option>
                    <option value='installed'>Installed</option>
                    <option value='frozen'>Frozen</option>
                    <option value='manual'>Manual</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
          <div className='column is-narrow'>
            <div className='field'>
              <label className='label'>Show All</label>
              <div className='control'>
                <label className='switch is-medium'>
                  <input 
                    type='checkbox'
                    checked={filters.showAll}
                    onChange={(e) => handleFilterChange('showAll', e.target.checked)}
                    disabled={isSearchMode}
                  />
                  <span className='check'></span>
                  <span className='control-label'>All Packages</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Search Row */}
        <div className='columns'>
          <div className='column'>
            <div className='field'>
              <label className='label'>Search Available Packages</label>
              <div className='control has-icons-right'>
                <input 
                  className='input'
                  type='text'
                  placeholder='Search for packages...'
                  value={filters.searchQuery}
                  onChange={(e) => handleFilterChange('searchQuery', e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                />
                <span className='icon is-small is-right'>
                  <i className='fas fa-search'></i>
                </span>
              </div>
            </div>
          </div>
          <div className='column is-narrow'>
            <div className='field'>
              <label className='label'>&nbsp;</label>
              <div className='control'>
                <button 
                  className='button is-info'
                  onClick={handleSearch}
                  disabled={loading}
                >
                  <span className='icon'>
                    <i className='fas fa-search'></i>
                  </span>
                  <span>Search</span>
                </button>
              </div>
            </div>
          </div>
          <div className='column is-narrow'>
            <div className='field'>
              <label className='label'>&nbsp;</label>
              <div className='control'>
                <button 
                  className='button is-info'
                  onClick={loadPackages}
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

      {/* Packages Table */}
      <div className='box'>
        <div className='level is-mobile mb-4'>
          <div className='level-left'>
            <h3 className='title is-6'>
              {isSearchMode ? `Search Results (${displayPackages.length})` : `Packages (${displayPackages.length})`}
              {loading && <span className='ml-2'><i className='fas fa-spinner fa-spin'></i></span>}
            </h3>
          </div>
        </div>

        <PackageTable 
          packages={displayPackages}
          loading={loading}
          onInstall={(pkg) => handleShowActionModal(pkg, 'install')}
          onUninstall={(pkg) => handleShowActionModal(pkg, 'uninstall')}
          onViewDetails={handleViewDetails}
          isSearchMode={isSearchMode}
        />
      </div>

      {/* Package Details Modal */}
      {showDetailsModal && selectedPackage && (
        <PackageDetailsModal 
          package={selectedPackage}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedPackage(null);
          }}
        />
      )}

      {/* Package Action Modal */}
      {showActionModal && selectedPackage && (
        <PackageActionModal 
          package={selectedPackage}
          action={actionType}
          onClose={() => {
            setShowActionModal(false);
            setSelectedPackage(null);
          }}
          onConfirm={handlePackageAction}
        />
      )}
    </div>
  );
};

export default PackageSection;
