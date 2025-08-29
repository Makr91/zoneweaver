import React, { useState, useEffect } from 'react';
import { useServers } from '../../contexts/ServerContext';
import NTPConfirmActionModal from './NTPConfirmActionModal';

const TimeSyncStatus = ({ server, onError }) => {
  const [statusInfo, setStatusInfo] = useState(null);
  const [availableSystems, setAvailableSystems] = useState(null);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [showActionModal, setShowActionModal] = useState(false);
  const [actionType, setActionType] = useState('');
  const [targetSystem, setTargetSystem] = useState('');

  const { makeZoneweaverAPIRequest } = useServers();

  // Load time sync status and available systems on component mount
  useEffect(() => {
    loadTimeSyncStatus();
    loadAvailableSystems();
  }, [server]);

  const loadTimeSyncStatus = async () => {
    if (!server || !makeZoneweaverAPIRequest) return;
    
    try {
      setLoading(true);
      onError('');
      
      const result = await makeZoneweaverAPIRequest(
        server.hostname,
        server.port,
        server.protocol,
        'system/time-sync/status',
        'GET'
      );
      
      if (result.success) {
        setStatusInfo(result.data);
      } else {
        onError(result.message || 'Failed to load time synchronization status');
      }
    } catch (err) {
      onError('Error loading time synchronization status: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableSystems = async () => {
    if (!server || !makeZoneweaverAPIRequest) return;
    
    try {
      const result = await makeZoneweaverAPIRequest(
        server.hostname,
        server.port,
        server.protocol,
        'system/time-sync/available-systems',
        'GET'
      );
      
      if (result.success) {
        setAvailableSystems(result.data);
      } else {
        // Don't show error for available systems - it's not critical
        console.warn('Failed to load available systems:', result.message);
      }
    } catch (err) {
      console.warn('Error loading available systems:', err.message);
    }
  };

  const handleForceSync = async () => {
    if (!server || !makeZoneweaverAPIRequest) return;
    
    try {
      setSyncing(true);
      onError('');
      
      const result = await makeZoneweaverAPIRequest(
        server.hostname,
        server.port,
        server.protocol,
        'system/time-sync/sync',
        'POST',
        {
          created_by: 'api'
        }
      );
      
      if (result.success) {
        // Show success message and refresh status
        console.log('Time synchronization initiated');
        setTimeout(() => loadTimeSyncStatus(), 2000); // Refresh after 2 seconds
        return { success: true };
      } else {
        onError(result.message || 'Failed to initiate time synchronization');
        return { success: false };
      }
    } catch (err) {
      onError('Error initiating time synchronization: ' + err.message);
      return { success: false };
    } finally {
      setSyncing(false);
    }
  };

  const handleServiceAction = (action) => {
    setActionType(action);
    setShowActionModal(true);
  };

  const handleServiceSwitch = async (targetService) => {
    if (!server || !makeZoneweaverAPIRequest) return;
    
    try {
      setSyncing(true); // Reuse syncing state for service operations
      onError('');
      
      const result = await makeZoneweaverAPIRequest(
        server.hostname,
        server.port,
        server.protocol,
        'system/time-sync/switch',
        'POST',
        {
          target_system: targetService, // 'ntp', 'chrony', or 'ntpsec'
          preserve_servers: true,
          install_if_needed: true,
          created_by: 'api'
        }
      );
      
      if (result.success) {
        console.log(`Successfully initiated switch to ${targetService} service`);
        // Refresh both status and available systems after switch
        setTimeout(() => {
          loadTimeSyncStatus();
          loadAvailableSystems();
        }, 2000);
        return { success: true };
      } else {
        onError(result.message || `Failed to switch to ${targetService} service`);
        return { success: false };
      }
    } catch (err) {
      onError(`Error switching to ${targetService} service: ` + err.message);
      return { success: false };
    } finally {
      setSyncing(false);
    }
  };

  const getConfirmHandler = () => {
    switch (actionType) {
      case 'sync':
        return handleForceSync;
      case 'switch-ntp':
        return () => handleServiceSwitch('ntp');
      case 'switch-chrony':
        return () => handleServiceSwitch('chrony');
      case 'switch-ntpsec':
        return () => handleServiceSwitch('ntpsec');
      default:
        return () => Promise.resolve({ success: true });
    }
  };

  const handleSystemSwitch = (systemKey) => {
    setTargetSystem(systemKey);
    setActionType(`switch-${systemKey}`);
    setShowActionModal(true);
  };

  const getSystemInfo = (systemKey) => {
    const systemData = {
      ntp: {
        name: 'Traditional NTP',
        icon: 'fa-clock',
        description: 'Network Time Protocol - Traditional UNIX time synchronization service.',
        features: [
          'Mature and widely supported',
          'Standard on most UNIX systems',
          'Uses /etc/inet/ntp.conf'
        ]
      },
      chrony: {
        name: 'Chrony',
        icon: 'fa-stopwatch',
        description: 'Modern time synchronization daemon with enhanced features.',
        features: [
          'Better for intermittent connections',
          'Faster synchronization',
          'Uses /etc/chrony.conf'
        ]
      },
      ntpsec: {
        name: 'NTPsec',
        icon: 'fa-shield-alt',
        description: 'Security-focused NTP implementation with enhanced security features.',
        features: [
          'Enhanced security and code quality',
          'Backward compatible with NTP',
          'Active security maintenance'
        ]
      }
    };
    return systemData[systemKey] || systemData.ntp;
  };

  const getSystemStatus = (systemKey) => {
    if (!availableSystems?.available) return null;
    return availableSystems.available[systemKey];
  };

  const getServiceStatusBadge = (service, status, available) => {
    if (service === 'none' || !available) {
      return <span className='tag is-grey'>Not Available</span>;
    }
    
    const serviceLabel = service === 'ntp' ? 'NTP' : service === 'chrony' ? 'Chrony' : service.toUpperCase();
    
    switch (status) {
      case 'available':
        return <span className='tag is-success'>{serviceLabel} - Online</span>;
      case 'disabled':
        return <span className='tag is-warning'>{serviceLabel} - Disabled</span>;
      case 'unavailable':
        return <span className='tag is-danger'>{serviceLabel} - Unavailable</span>;
      default:
        return <span className='tag is-grey'>{serviceLabel} - Unknown</span>;
    }
  };

  const getPeerStatusIndicator = (indicator, status) => {
    switch (indicator) {
      case '*':
        return { icon: '⭐', description: 'Primary server (selected for synchronization)', color: 'has-text-success' };
      case '+':
        return { icon: '✅', description: 'Backup server (good candidate)', color: 'has-text-info' };
      case '-':
        return { icon: '❌', description: 'Rejected server (unreliable)', color: 'has-text-danger' };
      case 'x':
        return { icon: '⚠️', description: 'False ticker (bad time)', color: 'has-text-warning' };
      case '.':
        return { icon: '⚪', description: 'Excess peer (not used)', color: 'has-text-grey' };
      case ' ':
        return { icon: '⚠️', description: 'Candidate server (being evaluated)', color: 'has-text-warning' };
      default:
        return { icon: '❓', description: 'Unknown status', color: 'has-text-grey' };
    }
  };

  const formatOffset = (offset) => {
    if (typeof offset !== 'number') return 'N/A';
    return `${offset >= 0 ? '+' : ''}${offset.toFixed(1)}ms`;
  };

  const formatDelay = (delay) => {
    if (typeof delay !== 'number') return 'N/A';
    return `${delay.toFixed(1)}ms`;
  };

  const formatJitter = (jitter) => {
    if (typeof jitter !== 'number') return 'N/A';
    return `${jitter.toFixed(1)}ms`;
  };

  const getHealthColor = (value, thresholds) => {
    if (typeof value !== 'number') return '';
    if (value <= thresholds.good) return 'has-text-success';
    if (value <= thresholds.warning) return 'has-text-warning';
    return 'has-text-danger';
  };

  if (loading && !statusInfo) {
    return (
      <div className='has-text-centered p-4'>
        <span className='icon is-large'>
          <i className='fas fa-spinner fa-spin fa-2x'></i>
        </span>
        <p className='mt-2'>Loading time synchronization status...</p>
      </div>
    );
  }

  return (
    <div>
      <div className='mb-4'>
        <h2 className='title is-5'>Time Synchronization Status</h2>
        <p className='content'>
          Monitor time synchronization service and peer status on <strong>{server.hostname}</strong>.
        </p>
      </div>

      {/* Service Status Information */}
      {statusInfo && (
        <div className='box mb-4'>
          <h3 className='title is-6'>Service Information</h3>
          <div className='table-container'>
            <table className='table is-fullwidth'>
              <tbody>
                <tr>
                  <td><strong>Service Type</strong></td>
                  <td>{getServiceStatusBadge(statusInfo.service, statusInfo.status, statusInfo.available)}</td>
                </tr>
                <tr>
                  <td><strong>Current Timezone</strong></td>
                  <td className='is-family-monospace'>{statusInfo.timezone || 'Unknown'}</td>
                </tr>
                <tr>
                  <td><strong>Last Status Check</strong></td>
                  <td>{statusInfo.last_checked ? new Date(statusInfo.last_checked).toLocaleString() : 'Unknown'}</td>
                </tr>
                {statusInfo.service_details && (
                  <>
                    <tr>
                      <td><strong>Service State</strong></td>
                      <td className='is-family-monospace'>{statusInfo.service_details.state || 'Unknown'}</td>
                    </tr>
                    <tr>
                      <td><strong>Service FMRI</strong></td>
                      <td className='is-family-monospace'>{statusInfo.service_details.fmri || 'Unknown'}</td>
                    </tr>
                  </>
                )}
              </tbody>
            </table>
          </div>
          
          {!statusInfo.available && (
            <div className='notification is-warning'>
              <p>
                <strong>No Time Synchronization Service Available</strong><br/>
                Neither NTP nor Chrony services are available on this system. 
                You may need to install and configure a time synchronization service.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Peer Status Table */}
      {statusInfo && statusInfo.peers && statusInfo.peers.length > 0 && (
        <div className='box mb-4'>
          <h3 className='title is-6'>
            Time Server Peers ({statusInfo.peers.length})
            {loading && <span className='ml-2'><i className='fas fa-spinner fa-spin'></i></span>}
          </h3>
          
          <div className='table-container'>
            <table className='table is-fullwidth is-striped'>
              <thead>
                <tr>
                  <th>Status</th>
                  <th>Server</th>
                  <th>Stratum</th>
                  <th>Delay</th>
                  <th>Offset</th>
                  <th>Jitter</th>
                  <th>Reach %</th>
                </tr>
              </thead>
              <tbody>
                {statusInfo.peers.map((peer, index) => {
                  const statusDetails = getPeerStatusIndicator(peer.indicator, peer.status);
                  return (
                    <tr key={index}>
                      <td>
                        <span 
                          className={`icon ${statusDetails.color}`} 
                          title={statusDetails.description}
                        >
                          {statusDetails.icon}
                        </span>
                        <span className='is-size-7 ml-1'>{peer.status || 'Unknown'}</span>
                      </td>
                      <td className='is-family-monospace'>{peer.remote}</td>
                      <td>{peer.stratum || 'N/A'}</td>
                      <td className={getHealthColor(peer.delay, { good: 50, warning: 200 })}>
                        {formatDelay(peer.delay)}
                      </td>
                      <td className={getHealthColor(Math.abs(peer.offset), { good: 10, warning: 100 })}>
                        {formatOffset(peer.offset)}
                      </td>
                      <td className={getHealthColor(peer.jitter, { good: 10, warning: 50 })}>
                        {formatJitter(peer.jitter)}
                      </td>
                      <td className={getHealthColor(100 - (peer.reachability_percent || 0), { good: 10, warning: 50 })}>
                        {peer.reachability_percent !== undefined ? `${peer.reachability_percent}%` : 'N/A'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          
          <div className='content is-small mt-3'>
            <p><strong>Status Indicators:</strong></p>
            <p>⭐ Primary server (active) • ✅ Backup server • ❌ Rejected server • ⚠️ Candidate/Problem • ⚪ Excess peer</p>
            <p><strong>Health Colors:</strong> <span className='has-text-success'>Green (good)</span> • <span className='has-text-warning'>Yellow (warning)</span> • <span className='has-text-danger'>Red (problem)</span></p>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className='box'>
        <h3 className='title is-6'>Quick Actions</h3>
        
        <div className='field is-grouped'>
          <div className='control'>
            <button
              className={`button is-primary ${syncing ? 'is-loading' : ''}`}
              onClick={() => handleServiceAction('sync')}
              disabled={!statusInfo?.available || syncing || loading}
            >
              <span className='icon'>
                <i className='fas fa-sync-alt'></i>
              </span>
              <span>Force Sync Now</span>
            </button>
          </div>
          <div className='control'>
            <button
              className={`button is-info ${loading ? 'is-loading' : ''}`}
              onClick={loadTimeSyncStatus}
              disabled={loading || syncing}
            >
              <span className='icon'>
                <i className='fas fa-refresh'></i>
              </span>
              <span>Refresh Status</span>
            </button>
          </div>
          <div className='control'>
            <button
              className='button'
              onClick={() => handleServiceAction('restart')}
              disabled={!statusInfo?.available || syncing || loading}
            >
              <span className='icon'>
                <i className='fas fa-redo'></i>
              </span>
              <span>Restart Service</span>
            </button>
          </div>
        </div>
      </div>

      {/* Service Management */}
      <div className='box'>
        <h3 className='title is-6'>Time Synchronization Service Management</h3>
        
        {/* Current Service Status */}
        {availableSystems?.current && (
          <div className='notification is-info is-light mb-4'>
            <p>
              <strong>Current Service:</strong> {getSystemInfo(availableSystems.current.service).name}
              <br/>
              <strong>Status:</strong> {availableSystems.current.status}
              {availableSystems.current.available && (
                <span className='tag is-success is-small ml-2'>Active</span>
              )}
            </p>
          </div>
        )}

        {/* Recommendations */}
        {availableSystems?.recommendations && (
          <div className='notification is-info is-light mb-4'>
            <p>
              <strong>Recommendations:</strong><br/>
              <strong>Modern:</strong> {getSystemInfo(availableSystems.recommendations.modern).name} • 
              <strong>Traditional:</strong> {getSystemInfo(availableSystems.recommendations.traditional).name} • 
              <strong>Secure:</strong> {getSystemInfo(availableSystems.recommendations.secure).name}
            </p>
            <p className='is-size-7 mt-2'>{availableSystems.recommendations.description}</p>
          </div>
        )}
        
        {/* Available Systems */}
        {availableSystems?.available && (
          <div className='columns is-multiline'>
            {Object.keys(availableSystems.available).map((systemKey) => {
              const systemData = getSystemStatus(systemKey);
              const systemInfo = getSystemInfo(systemKey);
              const isCurrent = availableSystems.current?.service === systemKey;
              
              return (
                <div key={systemKey} className='column is-one-third'>
                  <div className={`card ${isCurrent ? 'has-background-success-light' : ''}`}>
                    <div className='card-header'>
                      <p className='card-header-title'>
                        <span className='icon mr-2'>
                          <i className={`fas ${systemInfo.icon}`}></i>
                        </span>
                        {systemInfo.name}
                        {isCurrent && (
                          <span className='tag is-success is-small ml-2'>Current</span>
                        )}
                      </p>
                    </div>
                    <div className='card-content'>
                      <div className='content'>
                        <p>{systemInfo.description}</p>
                        <ul className='is-size-7'>
                          {systemInfo.features.map((feature, index) => (
                            <li key={index}>{feature}</li>
                          ))}
                        </ul>
                        
                        {systemData && (
                          <div className='mt-3'>
                            <div className='tags'>
                              <span className={`tag is-small ${systemData.installed ? 'is-success' : 'is-warning'}`}>
                                {systemData.installed ? 'Installed' : 'Not Installed'}
                              </span>
                              {systemData.installed && (
                                <span className={`tag is-small ${systemData.enabled ? 'is-info' : 'is-grey'}`}>
                                  {systemData.enabled ? 'Enabled' : 'Disabled'}
                                </span>
                              )}
                            </div>
                            {systemData.package_name && (
                              <p className='is-size-7 has-text-grey'>Package: {systemData.package_name}</p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className='card-footer'>
                      <div className='card-footer-item'>
                        <button
                          className={`button is-small ${isCurrent ? 'is-success' : 'is-info'} ${syncing ? 'is-loading' : ''}`}
                          onClick={() => handleSystemSwitch(systemKey)}
                          disabled={isCurrent || !systemData?.can_switch_to || loading || syncing}
                        >
                          <span className='icon'>
                            <i className={`fas ${isCurrent ? 'fa-check' : 'fa-exchange-alt'}`}></i>
                          </span>
                          <span>
                            {isCurrent ? 'Current Service' : 
                             !systemData?.can_switch_to ? 'Cannot Switch' :
                             !systemData?.installed ? 'Install & Switch' : 'Switch to ' + systemInfo.name}
                          </span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* No systems available fallback */}
        {!availableSystems?.available && !loading && (
          <div className='notification is-warning'>
            <p>
              <strong>No Time Synchronization Systems Available</strong><br/>
              Unable to detect available time synchronization systems. The system may need package installation or configuration.
            </p>
          </div>
        )}

        {/* Switch operation notes */}
        <div className='notification is-info is-light mt-4'>
          <p>
            <strong>Service Switching:</strong> Switching between time synchronization services will:
          </p>
          <ul>
            <li>Automatically disable the current service</li>
            <li>Install packages if needed (when "Install if needed" is enabled)</li>
            <li>Preserve existing server configurations when possible</li>
            <li>Enable and configure the new service</li>
            <li>Verify synchronization is working</li>
          </ul>
        </div>
      </div>

      {/* Action Confirmation Modal */}
      {showActionModal && (
        <NTPConfirmActionModal 
          service={statusInfo}
          action={actionType}
          onClose={() => {
            setShowActionModal(false);
            setActionType('');
          }}
          onConfirm={getConfirmHandler()}
        />
      )}
    </div>
  );
};

export default TimeSyncStatus;
