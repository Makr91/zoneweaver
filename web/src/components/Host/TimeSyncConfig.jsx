import React, { useState, useEffect } from 'react';
import { useServers } from '../../contexts/ServerContext';
import NTPConfirmActionModal from './NTPConfirmActionModal';

const TimeSyncConfig = ({ server, onError }) => {
  const [configInfo, setConfigInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [configContent, setConfigContent] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [backupConfig, setBackupConfig] = useState(false);
  const [serverList, setServerList] = useState([]);
  const [newServer, setNewServer] = useState('');
  const [showActionModal, setShowActionModal] = useState(false);
  const [actionType, setActionType] = useState('');

  const { makeZoneweaverAPIRequest } = useServers();

  // Load configuration on component mount
  useEffect(() => {
    loadTimeSyncConfig();
  }, [server]);

  const loadTimeSyncConfig = async () => {
    if (!server || !makeZoneweaverAPIRequest) return;
    
    try {
      setLoading(true);
      onError('');
      
      const result = await makeZoneweaverAPIRequest(
        server.hostname,
        server.port,
        server.protocol,
        'system/time-sync/config',
        'GET'
      );
      
      if (result.success) {
        setConfigInfo(result.data);
        setConfigContent(result.data.current_config || '');
        
        // Extract server list from current config
        if (result.data.current_config) {
          extractServersFromConfig(result.data.current_config);
        }
      } else {
        onError(result.message || 'Failed to load time synchronization configuration');
      }
    } catch (err) {
      onError('Error loading time synchronization configuration: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const extractServersFromConfig = (config) => {
    const serverLines = config.split('\n').filter(line => 
      line.trim().startsWith('server ') || line.trim().startsWith('pool ')
    );
    
    const servers = serverLines.map(line => {
      const parts = line.trim().split(/\s+/);
      return parts[1] || '';
    }).filter(server => server);
    
    setServerList(servers);
  };

  const handleSaveConfig = async () => {
    if (!server || !makeZoneweaverAPIRequest) return;
    
    try {
      setSaving(true);
      onError('');
      
      const result = await makeZoneweaverAPIRequest(
        server.hostname,
        server.port,
        server.protocol,
        'system/time-sync/config',
        'PUT',
        {
          config_content: configContent,
          backup_existing: backupConfig,
          created_by: 'api'
        }
      );
      
      if (result.success) {
        // Show success message and refresh config
        console.log('Configuration updated successfully');
        setTimeout(() => loadTimeSyncConfig(), 1000);
        return { success: true };
      } else {
        onError(result.message || 'Failed to save configuration');
        return { success: false };
      }
    } catch (err) {
      onError('Error saving configuration: ' + err.message);
      return { success: false };
    } finally {
      setSaving(false);
    }
  };

  const handleLoadTemplate = () => {
    if (!configInfo?.suggested_defaults?.config_template) {
      onError('No template available');
      return;
    }
    
    setConfigContent(configInfo.suggested_defaults.config_template);
    extractServersFromConfig(configInfo.suggested_defaults.config_template);
  };

  const handleAddServer = () => {
    if (!newServer.trim()) {
      onError('Please enter a server address');
      return;
    }

    const serverEntry = `server ${newServer.trim()}`;
    const updatedConfig = configContent + '\n' + serverEntry;
    setConfigContent(updatedConfig);
    setServerList([...serverList, newServer.trim()]);
    setNewServer('');
  };

  const handleRemoveServer = (serverToRemove) => {
    // Remove from visual list
    const updatedList = serverList.filter(server => server !== serverToRemove);
    setServerList(updatedList);
    
    // Remove from config content
    const lines = configContent.split('\n');
    const filteredLines = lines.filter(line => {
      const trimmedLine = line.trim();
      return !(trimmedLine.startsWith('server ') && trimmedLine.includes(serverToRemove)) &&
             !(trimmedLine.startsWith('pool ') && trimmedLine.includes(serverToRemove));
    });
    setConfigContent(filteredLines.join('\n'));
  };

  const handleServiceAction = (action) => {
    setActionType(action);
    setShowActionModal(true);
  };

  const isConfigValid = (config) => {
    if (!config.trim()) return false;
    
    // Basic validation - should have at least one server or pool line
    const lines = config.split('\n');
    return lines.some(line => {
      const trimmed = line.trim();
      return trimmed.startsWith('server ') || trimmed.startsWith('pool ');
    });
  };

  const hasChanges = configContent !== (configInfo?.current_config || '');

  if (loading && !configInfo) {
    return (
      <div className='has-text-centered p-4'>
        <span className='icon is-large'>
          <i className='fas fa-spinner fa-spin fa-2x'></i>
        </span>
        <p className='mt-2'>Loading time synchronization configuration...</p>
      </div>
    );
  }

  return (
    <div>
      <div className='mb-4'>
        <h2 className='title is-5'>NTP Configuration Management</h2>
        <p className='content'>
          Configure time synchronization settings on <strong>{server.hostname}</strong>.
          {configInfo?.service === 'ntp' ? ' Using traditional NTP service.' : 
           configInfo?.service === 'chrony' ? ' Using Chrony time synchronization.' : 
           ' Service type will be detected automatically.'}
        </p>
      </div>

      {/* Configuration File Information */}
      {configInfo && (
        <div className='box mb-4'>
          <h3 className='title is-6'>Configuration File Information</h3>
          <div className='table-container'>
            <table className='table is-fullwidth'>
              <tbody>
                <tr>
                  <td><strong>Service Type</strong></td>
                  <td className='is-family-monospace'>
                    {configInfo.service === 'ntp' ? 'NTP' : 
                     configInfo.service === 'chrony' ? 'Chrony' : 'Auto-detect'}
                  </td>
                </tr>
                <tr>
                  <td><strong>Configuration File</strong></td>
                  <td className='is-family-monospace'>{configInfo.config_file}</td>
                </tr>
                <tr>
                  <td><strong>File Exists</strong></td>
                  <td>
                    <span className={`tag ${configInfo.config_exists ? 'is-success' : 'is-warning'}`}>
                      {configInfo.config_exists ? 'Yes' : 'No'}
                    </span>
                  </td>
                </tr>
                <tr>
                  <td><strong>Default Servers Available</strong></td>
                  <td>
                    <span className={`tag ${configInfo.suggested_defaults?.servers?.length > 0 ? 'is-success' : 'is-grey'}`}>
                      {configInfo.suggested_defaults?.servers?.length || 0} servers
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          
          {!configInfo.config_exists && (
            <div className='notification is-info'>
              <p>
                <strong>Configuration file does not exist.</strong><br/>
                You can create a new configuration using the template below or by manually entering configuration directives.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Template and Quick Actions */}
      <div className='box mb-4'>
        <h3 className='title is-6'>Configuration Templates</h3>
        
        <div className='field is-grouped'>
          <div className='control is-expanded'>
            <div className='select is-fullwidth'>
              <select 
                value={selectedTemplate}
                onChange={(e) => setSelectedTemplate(e.target.value)}
              >
                <option value=''>Select a template...</option>
                {configInfo?.suggested_defaults?.config_template && (
                  <option value='default'>Default Pool Configuration</option>
                )}
              </select>
            </div>
          </div>
          <div className='control'>
            <button
              className='button is-info'
              onClick={handleLoadTemplate}
              disabled={!selectedTemplate || loading}
            >
              <span className='icon'>
                <i className='fas fa-download'></i>
              </span>
              <span>Load Template</span>
            </button>
          </div>
          <div className='control'>
            <button
              className={`button is-info ${loading ? 'is-loading' : ''}`}
              onClick={loadTimeSyncConfig}
              disabled={loading || saving}
            >
              <span className='icon'>
                <i className='fas fa-refresh'></i>
              </span>
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {configInfo?.suggested_defaults?.servers && configInfo.suggested_defaults.servers.length > 0 && (
          <div className='content is-small mt-3'>
            <p><strong>Suggested default servers:</strong> {configInfo.suggested_defaults.servers.join(', ')}</p>
          </div>
        )}
      </div>

      {/* Server Management */}
      <div className='box mb-4'>
        <h3 className='title is-6'>Server Management</h3>
        
        {/* Add Server */}
        <div className='field has-addons mb-4'>
          <div className='control is-expanded'>
            <input
              className='input'
              type='text'
              placeholder='Add NTP server (e.g., 0.pool.ntp.org)'
              value={newServer}
              onChange={(e) => setNewServer(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddServer()}
            />
          </div>
          <div className='control'>
            <button
              className='button is-primary'
              onClick={handleAddServer}
              disabled={!newServer.trim() || saving}
            >
              <span className='icon'>
                <i className='fas fa-plus'></i>
              </span>
              <span>Add Server</span>
            </button>
          </div>
        </div>

        {/* Current Servers */}
        {serverList.length > 0 && (
          <div>
            <p className='subtitle is-6'>Current Servers ({serverList.length})</p>
            <div className='tags'>
              {serverList.map((server, index) => (
                <span key={index} className='tag is-medium'>
                  <span className='icon is-small mr-1'>
                    <i className='fas fa-server'></i>
                  </span>
                  <span className='is-family-monospace'>{server}</span>
                  <button
                    className='delete is-small ml-1'
                    onClick={() => handleRemoveServer(server)}
                    disabled={saving}
                  ></button>
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Configuration Editor */}
      <div className='box mb-4'>
        <h3 className='title is-6'>Configuration Editor</h3>
        
        <div className='field'>
          <div className='control'>
            <textarea
              className={`textarea is-family-monospace ${!isConfigValid(configContent) && configContent ? 'is-danger' : ''}`}
              rows='15'
              placeholder='Enter NTP configuration...'
              value={configContent}
              onChange={(e) => setConfigContent(e.target.value)}
              disabled={saving}
            />
          </div>
          {configContent && !isConfigValid(configContent) && (
            <p className='help is-danger'>
              Configuration appears to be invalid. Make sure to include at least one server or pool directive.
            </p>
          )}
        </div>

        <div className='field'>
          <div className='control'>
            <label className='checkbox'>
              <input
                type='checkbox'
                checked={backupConfig}
                onChange={(e) => setBackupConfig(e.target.checked)}
                disabled={saving}
              />
              <span className='ml-2'>Create backup of existing configuration</span>
            </label>
          </div>
          <p className='help'>
            Recommended: Create a backup copy before making changes to allow easy recovery.
          </p>
        </div>
      </div>

      {/* Save Actions */}
      <div className='box'>
        <h3 className='title is-6'>Configuration Actions</h3>
        
        <div className='field is-grouped'>
          <div className='control'>
            <button
              className={`button is-primary ${saving ? 'is-loading' : ''}`}
              onClick={() => handleServiceAction('save')}
              disabled={!hasChanges || !isConfigValid(configContent) || saving || loading}
            >
              <span className='icon'>
                <i className='fas fa-save'></i>
              </span>
              <span>Save Configuration</span>
            </button>
          </div>
          <div className='control'>
            <button
              className='button'
              onClick={() => setConfigContent(configInfo?.current_config || '')}
              disabled={!hasChanges || saving}
            >
              <span className='icon'>
                <i className='fas fa-undo'></i>
              </span>
              <span>Reset Changes</span>
            </button>
          </div>
          <div className='control'>
            <button
              className='button is-warning'
              onClick={() => handleServiceAction('restart')}
              disabled={saving || loading}
            >
              <span className='icon'>
                <i className='fas fa-redo'></i>
              </span>
              <span>Restart Service</span>
            </button>
          </div>
        </div>
        
        {hasChanges && (
          <div className='notification is-info is-light mt-3'>
            <p>You have unsaved changes. Remember to restart the time synchronization service after saving to apply the new configuration.</p>
          </div>
        )}
      </div>

      {/* Action Confirmation Modal */}
      {showActionModal && (
        <NTPConfirmActionModal 
          service={configInfo}
          action={actionType}
          onClose={() => {
            setShowActionModal(false);
            setActionType('');
          }}
          onConfirm={actionType === 'save' ? handleSaveConfig : () => {}}
        />
      )}
    </div>
  );
};

export default TimeSyncConfig;
