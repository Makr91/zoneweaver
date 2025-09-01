import React, { useState, useEffect } from 'react';
import { useServers } from '../../contexts/ServerContext';

const SystemUpdatesSection = ({ server, onError }) => {
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [installing, setInstalling] = useState(false);
  const [checkingUpdates, setCheckingUpdates] = useState(false);
  const [updateData, setUpdateData] = useState(null);
  const [updateHistory, setUpdateHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [showInstallModal, setShowInstallModal] = useState(false);
  const [showRawOutput, setShowRawOutput] = useState(false);
  const [activeTab, setActiveTab] = useState('updates');

  const { makeZoneweaverAPIRequest } = useServers();

  // Check for updates on component mount
  useEffect(() => {
    if (server) {
      checkForUpdates();
      loadUpdateHistory();
    }
  }, [server]);

  const checkForUpdates = async () => {
    setCheckingUpdates(true);
    try {
      const response = await makeZoneweaverAPIRequest(
        server.hostname,
        server.port,
        server.protocol,
        'system/updates/check',
        'GET',
        null,
        { format: 'structured' }
      );
      if (response.success) {
        setUpdateData(response.data);
      } else {
        onError('Failed to check for updates: ' + response.error);
      }
    } catch (error) {
      onError('Error checking for updates: ' + error.message);
    } finally {
      setCheckingUpdates(false);
    }
  };

  const refreshMetadata = async () => {
    setRefreshing(true);
    try {
      const response = await makeZoneweaverAPIRequest(
        server.hostname,
        server.port,
        server.protocol,
        'system/updates/refresh',
        'POST',
        {
          full: false,
          publishers: ['omnios'],
          created_by: 'api'
        }
      );
      if (response.success) {
        // Wait a moment then check for updates again
        setTimeout(() => {
          checkForUpdates();
        }, 2000);
      } else {
        onError('Failed to refresh metadata: ' + response.error);
      }
    } catch (error) {
      onError('Error refreshing metadata: ' + error.message);
    } finally {
      setRefreshing(false);
    }
  };

  const installUpdates = async () => {
    setInstalling(true);
    try {
      const response = await makeZoneweaverAPIRequest(
        server.hostname,
        server.port,
        server.protocol,
        'system/updates/install',
        'POST',
        {
          packages: [],
          accept_licenses: true,
          backup_be: true,
          reject_packages: [],
          created_by: 'api'
        }
      );
      if (response.success) {
        setShowInstallModal(false);
        // Refresh the update status after installation
        setTimeout(() => {
          checkForUpdates();
          loadUpdateHistory();
        }, 2000);
      } else {
        onError('Failed to install updates: ' + response.error);
      }
    } catch (error) {
      onError('Error installing updates: ' + error.message);
    } finally {
      setInstalling(false);
    }
  };

  const loadUpdateHistory = async () => {
    setHistoryLoading(true);
    try {
      const response = await makeZoneweaverAPIRequest(
        server.hostname,
        server.port,
        server.protocol,
        'system/updates/history',
        'GET',
        null,
        { limit: 20 }
      );
      if (response.success) {
        setUpdateHistory(response.data.history || []);
      } else {
        onError('Failed to load update history: ' + response.error);
      }
    } catch (error) {
      onError('Error loading update history: ' + error.message);
    } finally {
      setHistoryLoading(false);
    }
  };

  const formatLastChecked = (timestamp) => {
    if (!timestamp) return 'Never';
    return new Date(timestamp).toLocaleString();
  };

  const getDiskSpaceWarning = () => {
    if (!updateData?.raw_output) return null;
    
    const output = updateData.raw_output;
    const spaceMatch = output.match(/Insufficient disk space.*Available space: ([\d.]+\s+\w+).*Estimated required: ([\d.]+\s+\w+)/);
    
    if (spaceMatch) {
      return {
        available: spaceMatch[1],
        required: spaceMatch[2]
      };
    }
    return null;
  };

  const diskSpaceWarning = getDiskSpaceWarning();

  return (
    <div>
      {/* Tab Navigation */}
      <div className='tabs is-boxed mb-4'>
        <ul>
          <li className={activeTab === 'updates' ? 'is-active' : ''}>
            <a onClick={() => setActiveTab('updates')}>
              <span className='icon is-small'>
                <i className='fas fa-download'></i>
              </span>
              <span>Available Updates</span>
            </a>
          </li>
          <li className={activeTab === 'history' ? 'is-active' : ''}>
            <a onClick={() => setActiveTab('history')}>
              <span className='icon is-small'>
                <i className='fas fa-history'></i>
              </span>
              <span>Update History</span>
            </a>
          </li>
        </ul>
      </div>

      {/* Available Updates Tab */}
      {activeTab === 'updates' && (
        <div>
          {/* Header with actions */}
          <div className='level mb-4'>
            <div className='level-left'>
              <div className='level-item'>
                <h2 className='title is-5'>System Updates</h2>
              </div>
            </div>
            <div className='level-right'>
              <div className='level-item'>
                <div className='buttons'>
                  <button
                    className={`button is-info ${refreshing ? 'is-loading' : ''}`}
                    onClick={refreshMetadata}
                    disabled={refreshing || checkingUpdates}
                  >
                    <span className='icon'>
                      <i className='fas fa-sync-alt'></i>
                    </span>
                    <span>Refresh Metadata</span>
                  </button>
                  <button
                    className={`button is-primary ${checkingUpdates ? 'is-loading' : ''}`}
                    onClick={checkForUpdates}
                    disabled={checkingUpdates || refreshing}
                  >
                    <span className='icon'>
                      <i className='fas fa-search'></i>
                    </span>
                    <span>Check Updates</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Update Status */}
          {updateData && (
            <div className='box'>
              <div className='columns'>
                <div className='column'>
                  <div className='field'>
                    <label className='label'>Updates Available</label>
                    <div className='control'>
                      <span className={`tag is-large ${updateData.updates_available ? 'is-warning' : 'is-success'}`}>
                        {updateData.updates_available ? 'Yes' : 'No'}
                      </span>
                    </div>
                  </div>
                </div>
                <div className='column'>
                  <div className='field'>
                    <label className='label'>Total Updates</label>
                    <div className='control'>
                      <span className='tag is-large is-info'>
                        {updateData.total_updates || 0}
                      </span>
                    </div>
                  </div>
                </div>
                <div className='column'>
                  <div className='field'>
                    <label className='label'>Last Checked</label>
                    <div className='control'>
                      <span className='has-text-grey'>
                        {formatLastChecked(updateData.last_checked)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Disk Space Warning */}
              {diskSpaceWarning && (
                <div className='notification is-warning'>
                  <h4 className='title is-6'>
                    <span className='icon'>
                      <i className='fas fa-exclamation-triangle'></i>
                    </span>
                    Insufficient Disk Space
                  </h4>
                  <p>
                    <strong>Available:</strong> {diskSpaceWarning.available}<br/>
                    <strong>Required:</strong> {diskSpaceWarning.required}
                  </p>
                  <p className='mt-2'>
                    Free up disk space before installing updates.
                  </p>
                </div>
              )}

              {/* Install Updates Button */}
              {updateData.updates_available && !diskSpaceWarning && (
                <div className='has-text-centered mt-4'>
                  <button
                    className='button is-warning is-large'
                    onClick={() => setShowInstallModal(true)}
                  >
                    <span className='icon'>
                      <i className='fas fa-download'></i>
                    </span>
                    <span>Install {updateData.total_updates} Updates</span>
                  </button>
                </div>
              )}

              {/* Plan Summary */}
              {updateData.plan_summary && (
                <div className='mt-4'>
                  <h4 className='title is-6'>Update Plan Summary</h4>
                  <div className='columns is-multiline'>
                    <div className='column is-3'>
                      <div className='box has-text-centered'>
                        <p className='heading'>Install</p>
                        <p className='title is-4'>{updateData.plan_summary.packages_to_install || 0}</p>
                      </div>
                    </div>
                    <div className='column is-3'>
                      <div className='box has-text-centered'>
                        <p className='heading'>Update</p>
                        <p className='title is-4'>{updateData.plan_summary.packages_to_update || 0}</p>
                      </div>
                    </div>
                    <div className='column is-3'>
                      <div className='box has-text-centered'>
                        <p className='heading'>Remove</p>
                        <p className='title is-4'>{updateData.plan_summary.packages_to_remove || 0}</p>
                      </div>
                    </div>
                    <div className='column is-3'>
                      <div className='box has-text-centered'>
                        <p className='heading'>Download Size</p>
                        <p className='title is-6'>{updateData.plan_summary.total_download_size || 'Unknown'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Raw Output Toggle */}
              {updateData.raw_output && (
                <div className='mt-4'>
                  <button
                    className='button is-small'
                    onClick={() => setShowRawOutput(!showRawOutput)}
                  >
                    <span className='icon'>
                      <i className={`fas fa-chevron-${showRawOutput ? 'up' : 'down'}`}></i>
                    </span>
                    <span>{showRawOutput ? 'Hide' : 'Show'} Raw Output</span>
                  </button>
                  
                  {showRawOutput && (
                    <pre className='box mt-2 has-background-black has-text-light is-size-7'>
                      {updateData.raw_output}
                    </pre>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Update History Tab */}
      {activeTab === 'history' && (
        <div>
          <div className='level mb-4'>
            <div className='level-left'>
              <div className='level-item'>
                <h2 className='title is-5'>Update History</h2>
              </div>
            </div>
            <div className='level-right'>
              <div className='level-item'>
                <button
                  className={`button is-primary ${historyLoading ? 'is-loading' : ''}`}
                  onClick={loadUpdateHistory}
                  disabled={historyLoading}
                >
                  <span className='icon'>
                    <i className='fas fa-sync-alt'></i>
                  </span>
                  <span>Refresh</span>
                </button>
              </div>
            </div>
          </div>

          <div className='box'>
            {historyLoading ? (
              <div className='has-text-centered p-6'>
                <span className='icon is-large'>
                  <i className='fas fa-spinner fa-spin fa-2x'></i>
                </span>
                <p className='mt-2'>Loading update history...</p>
              </div>
            ) : updateHistory.length === 0 ? (
              <div className='has-text-centered p-6'>
                <span className='icon is-large has-text-grey'>
                  <i className='fas fa-history fa-2x'></i>
                </span>
                <p className='mt-2 has-text-grey'>No update history available</p>
              </div>
            ) : (
              <div className='table-container'>
                <table className='table is-fullwidth is-striped'>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Operation</th>
                      <th>User</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {updateHistory.map((entry, index) => (
                      <tr key={index}>
                        <td>{new Date(entry.date).toLocaleString()}</td>
                        <td>{entry.operation}</td>
                        <td>{entry.user}</td>
                        <td>
                          <span className={`tag ${entry.status === 'Succeeded' ? 'is-success' : 'is-danger'}`}>
                            {entry.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Install Confirmation Modal */}
      {showInstallModal && (
        <div className='modal is-active'>
          <div className='modal-background' onClick={() => setShowInstallModal(false)}></div>
          <div className='modal-card'>
            <header className='modal-card-head'>
              <p className='modal-card-title'>
                <span className='icon'>
                  <i className='fas fa-download'></i>
                </span>
                Confirm System Update
              </p>
              <button
                className='delete'
                onClick={() => setShowInstallModal(false)}
                disabled={installing}
              ></button>
            </header>
            <section className='modal-card-body'>
              <div className='content'>
                <p>
                  <strong>You are about to install {updateData?.total_updates || 0} system updates.</strong>
                </p>
                <p>This operation will:</p>
                <ul>
                  <li>Create a new boot environment for safety</li>
                  <li>Install all available updates</li>
                  <li>Potentially require a system reboot</li>
                  <li>Take several minutes to complete</li>
                </ul>
                <div className='notification is-warning'>
                  <p>
                    <strong>Warning:</strong> This is a system-level operation that may affect system stability.
                    Ensure you have adequate disk space and a stable connection.
                  </p>
                </div>
              </div>
            </section>
            <footer className='modal-card-foot'>
              <button
                className={`button is-warning ${installing ? 'is-loading' : ''}`}
                onClick={installUpdates}
                disabled={installing}
              >
                <span className='icon'>
                  <i className='fas fa-download'></i>
                </span>
                <span>Install Updates</span>
              </button>
              <button
                className='button'
                onClick={() => setShowInstallModal(false)}
                disabled={installing}
              >
                Cancel
              </button>
            </footer>
          </div>
        </div>
      )}
    </div>
  );
};

export default SystemUpdatesSection;
