import React, { useState, useEffect } from 'react';
import { useServers } from '../../contexts/ServerContext';
import NTPConfirmActionModal from './NTPConfirmActionModal';

const TimeSyncStatus = ({ server, onError }) => {
  const [statusInfo, setStatusInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [showActionModal, setShowActionModal] = useState(false);
  const [actionType, setActionType] = useState('');

  const { makeZoneweaverAPIRequest } = useServers();

  // Load time sync status on component mount
  useEffect(() => {
    loadTimeSyncStatus();
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

      {/* Action Confirmation Modal */}
      {showActionModal && (
        <NTPConfirmActionModal 
          service={statusInfo}
          action={actionType}
          onClose={() => {
            setShowActionModal(false);
            setActionType('');
          }}
          onConfirm={actionType === 'sync' ? handleForceSync : () => {}}
        />
      )}
    </div>
  );
};

export default TimeSyncStatus;
