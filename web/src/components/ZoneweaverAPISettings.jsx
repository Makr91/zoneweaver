import React, { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { useAuth } from "../contexts/AuthContext";
import { useServers } from "../contexts/ServerContext";
import { canManageSettings } from "../utils/permissions";
import ApiKeysTab from "./ApiKeysTab";

const ZoneweaverAPISettings = () => {
  const { user } = useAuth();
  const { currentServer, makeZoneweaverAPIRequest } = useServers();
  const [settings, setSettings] = useState(null);
  const [backups, setBackups] = useState([]);
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState(null);

  // Load settings on component mount
  useEffect(() => {
    if (user && canManageSettings(user.role) && currentServer) {
      loadSettings();
      loadBackups();
    }
  }, [user, currentServer]);

  const loadSettings = async () => {
    if (!currentServer) return;
    try {
      setLoading(true);
      const response = await makeZoneweaverAPIRequest(currentServer.hostname, currentServer.port, currentServer.protocol, 'settings');
      
      if (response.success) {
        setSettings(response.data);
        // Set the first tab as active if none is selected
        const sections = organizeBySection(response.data);
        if (!activeTab && sections.length > 0) {
          setActiveTab(sections[0].name);
        }
      } else {
        setMsg('Failed to load settings: ' + response.message);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      setMsg('Error loading settings: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const loadBackups = async () => {
    if (!currentServer) return;
    try {
      const response = await makeZoneweaverAPIRequest(currentServer.hostname, currentServer.port, currentServer.protocol, 'settings/backups');
      if (response.success) {
        setBackups(response.data);
      }
    } catch (error) {
      console.error('Error loading backups:', error);
    }
  };

  const handleSettingChange = (path, value) => {
    setSettings(prev => {
      const newSettings = { ...prev };
      let current = newSettings;
      for (let i = 0; i < path.length - 1; i++) {
        current = current[path[i]];
      }
      current[path[path.length - 1]] = value;
      return newSettings;
    });
  };

  const saveSettings = async () => {
    if (!currentServer) return;
    setLoading(true);
    setMsg("");
    
    try {
      const response = await makeZoneweaverAPIRequest(currentServer.hostname, currentServer.port, currentServer.protocol, 'settings', 'PUT', settings);
      
      if (response.success) {
        setMsg("Settings saved successfully.");
      } else {
        setMsg('Failed to save settings: ' + response.message);
      }
      
    } catch (error) {
      console.error('Error saving settings:', error);
      setMsg("Error saving settings: " + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const restoreBackup = async (filename) => {
    if (!currentServer) return;
    if (!window.confirm(`Are you sure you want to restore the configuration from ${filename}? This will overwrite current settings.`)) {
      return;
    }
    
    try {
      setLoading(true);
      setMsg("");
      
      const response = await makeZoneweaverAPIRequest(currentServer.hostname, currentServer.port, currentServer.protocol, `settings/restore/${filename}`, 'POST');
      
      if (response.success) {
        setMsg("Backup restored successfully.");
        await loadSettings();
      } else {
        setMsg('Failed to restore backup: ' + response.message);
      }
      
    } catch (error) {
      console.error('Error restoring backup:', error);
      setMsg("Error restoring backup: " + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const restartServer = async () => {
    if (!currentServer) return;
    if (!window.confirm('Are you sure you want to restart the Zoneweaver server?')) {
      return;
    }
    
    try {
      setLoading(true);
      setMsg("Initiating server restart...");
      
      const response = await makeZoneweaverAPIRequest(currentServer.hostname, currentServer.port, currentServer.protocol, 'server/restart', 'POST');
      
      if (response.success) {
        setMsg("Server restart initiated.");
      } else {
        setMsg('Failed to restart server: ' + response.message);
      }
      
    } catch (error) {
      console.error('Error restarting server:', error);
      setMsg("Error restarting server: " + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const deleteBackup = async (filename) => {
    if (!currentServer) return;
    if (!window.confirm(`Are you sure you want to permanently delete the backup ${filename}? This action cannot be undone.`)) {
      return;
    }

    try {
      setLoading(true);
      setMsg("");

      const response = await makeZoneweaverAPIRequest(currentServer.hostname, currentServer.port, currentServer.protocol, `settings/backups/${filename}`, 'DELETE');

      if (response.success) {
        setMsg("Backup deleted successfully.");
        await loadBackups(); // Refresh the list
      } else {
        setMsg('Failed to delete backup: ' + response.message);
      }

    } catch (error) {
      console.error('Error deleting backup:', error);
      setMsg("Error deleting backup: " + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const [showBackupModal, setShowBackupModal] = useState(false);

  const createBackup = async () => {
    try {
      setLoading(true);
      setMsg("Creating backup...");
      
      // Trigger a save which creates a backup automatically
      await saveSettings();
      await loadBackups();
      setMsg("Backup created successfully");
    } catch (error) {
      console.error('Error creating backup:', error);
      setMsg("Error creating backup: " + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  if (!user || !canManageSettings(user.role)) {
    return <div>Access Denied</div>;
  }

  const organizeBySection = (settings) => {
    const sections = [];
    
    const collectSectionContent = (obj, basePath = []) => {
      const content = [];
      
      Object.entries(obj).forEach(([key, value]) => {
        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
          // This is a subsection
          content.push({
            type: 'subsection',
            name: key,
            fields: collectSectionContent(value, [...basePath, key])
          });
        } else {
          // This is a field
          content.push({
            type: 'field',
            key: key,
            value: value,
            path: [...basePath, key]
          });
        }
      });
      
      return content;
    };
    
    Object.entries(settings).forEach(([key, value]) => {
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        sections.push({
          name: key,
          content: collectSectionContent(value, [key])
        });
      }
    });
    
    return sections;
  };

  const renderSectionContent = (content) => {
    return content.map((item, index) => {
      if (item.type === 'subsection') {
        return (
          <div key={index} className="mb-4">
            <h5 className="subtitle is-6 has-text-weight-semibold has-text-grey mb-2">
              {item.name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </h5>
            <div className="ml-4">
              {renderSectionContent(item.fields)}
            </div>
          </div>
        );
      } else {
        return renderField(item, false);
      }
    });
  };
  
  const renderField = (item, isIndented = false) => {
    const { key, value, path } = item;
    return (
      <div key={path.join('.')} className="field is-horizontal mb-1">
        <div className="field-label is-small" style={{ 
          flexBasis: '150px', 
          flexGrow: 0, 
          minWidth: '150px',
          paddingLeft: isIndented ? '20px' : '0'
        }}>
          <label className="label is-size-7 has-text-left">
            {key.replace(/_/g, ' ')}
          </label>
        </div>
        <div className="field-body">
          <div className="field">
            <div className="control">
              {typeof value === 'boolean' ? (
                <label className="switch">
                  <input
                    type="checkbox"
                    checked={value}
                    onChange={(e) => handleSettingChange(path, e.target.checked)}
                  />
                  <span className="slider round"></span>
                </label>
              ) : Array.isArray(value) ? (
                <textarea
                  className="textarea is-small"
                  rows="10"
                  style={{ minWidth: '150px' }}
                  value={value.join('\n')}
                  onChange={(e) => handleSettingChange(path, e.target.value.split('\n'))}
                />
              ) : (
                <input
                  className="input is-small"
                  type={typeof value === 'number' ? 'number' : 'text'}
                  value={value}
                  onChange={(e) => handleSettingChange(path, typeof value === 'number' ? Number(e.target.value) : e.target.value)}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className='hero-body mainbody p-0 is-align-items-stretch'>
      <Helmet>
        <meta charSet='utf-8' />
        <title>Zoneweaver API Settings - Zoneweaver</title>
        <link rel='canonical' href={window.location.origin} />
      </Helmet>
      <style>{`
        /* Toggle Switch Styles */
        .switch {
          position: relative;
          display: inline-block;
          width: 40px;
          height: 22px;
        }
        
        .switch input {
          opacity: 0;
          width: 0;
          height: 0;
        }
        
        .slider {
          position: absolute;
          cursor: pointer;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: #ccc;
          transition: .3s;
        }
        
        .slider:before {
          position: absolute;
          content: "";
          height: 16px;
          width: 16px;
          left: 3px;
          bottom: 3px;
          background-color: white;
          transition: .3s;
        }
        
        input:checked + .slider {
          background-color: #00d1b2;
        }
        
        input:focus + .slider {
          box-shadow: 0 0 1px #00d1b2;
        }
        
        input:checked + .slider:before {
          transform: translateX(18px);
        }
        
        .slider.round {
          border-radius: 22px;
        }
        
        .slider.round:before {
          border-radius: 50%;
        }
      `}</style>
      <div className='container is-fluid m-2'>
        <div className='box p-0'>
          <div className='titlebar box active level is-mobile mb-0 p-3'>
            <div className='level-left'>
              <strong>Zoneweaver API System Settings</strong>
            </div>
            <div className='level-right'>
              <button 
                className="button is-small is-primary mr-2" 
                onClick={saveSettings}
                disabled={loading || !settings}
              >
                <span className="icon is-small">
                  <i className="fas fa-save"></i>
                </span>
                <span>Save</span>
              </button>
              <button 
                className="button is-small is-info mr-2" 
                onClick={createBackup}
                disabled={loading}
              >
                <span className="icon is-small">
                  <i className="fas fa-download"></i>
                </span>
                <span>Backup</span>
              </button>
              <button 
                className="button is-small is-warning mr-2" 
                onClick={() => setShowBackupModal(true)}
                disabled={loading}
              >
                <span className="icon is-small">
                  <i className="fas fa-history"></i>
                </span>
                <span>Restore</span>
              </button>
              <button 
                className="button is-small is-danger" 
                onClick={restartServer}
                disabled={loading}
              >
                <span className="icon is-small">
                  <i className="fas fa-redo"></i>
                </span>
                <span>Restart</span>
              </button>
            </div>
          </div>
          <div className='p-4'>
            {msg && <div className="notification is-infopy-2 mb-3">{msg}</div>}
            {!currentServer && (
              <div className="notification is-warning">
                Please select a host from the navbar to manage its settings.
              </div>
            )}
            {loading && <p className="has-text-grey">Loading...</p>}
            {settings && currentServer && (
              <>
                <div className="tabs is-boxed is-small">
                  <ul>
                    {organizeBySection(settings).map(section => (
                      <li key={section.name} className={activeTab === section.name ? 'is-active' : ''}>
                        <a onClick={() => setActiveTab(section.name)}>
                          <span>{section.name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
                        </a>
                      </li>
                    ))}
                    <li className={activeTab === 'api_management' ? 'is-active' : ''}>
                      <a onClick={() => setActiveTab('api_management')}>
                        <span>API Management</span>
                      </a>
                    </li>
                  </ul>
                </div>

                <div className="tab-content">
                  {organizeBySection(settings).map(section => (
                    <div key={section.name} className="tab-pane" style={{ display: activeTab === section.name ? 'block' : 'none' }}>
                      {section.name === 'host_monitoring' ? (
                        <div className="columns">
                          <div className="column is-8">
                            {renderSectionContent(section.content)}
                          </div>
                        </div>
                      ) : (
                        <div className="columns">
                          <div className="column is-6">
                            {renderSectionContent(section.content.slice(0, Math.ceil(section.content.length / 2)))}
                          </div>
                          <div className="column is-6">
                            {renderSectionContent(section.content.slice(Math.ceil(section.content.length / 2)))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                  <div className="tab-pane" style={{ display: activeTab === 'api_management' ? 'block' : 'none' }}>
                    <ApiKeysTab />
                  </div>
                </div>
              </>
            )}

            {/* Backup Modal */}
            <div className={`modal ${showBackupModal ? 'is-active' : ''}`}>
              <div className="modal-background" onClick={() => setShowBackupModal(false)}></div>
              <div className="modal-card">
                <header className="modal-card-head">
                  <p className="modal-card-title">Configuration Backups</p>
                  <button className="delete" onClick={() => setShowBackupModal(false)}></button>
                </header>
                <section className="modal-card-body">
                  {backups.length === 0 ? (
                    <p className="has-text-grey">No backups available</p>
                  ) : (
                    <table className="table is-fullwidth is-striped">
                      <thead>
                        <tr>
                          <th>Filename</th>
                          <th>Created</th>
                          <th className="has-text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {backups.map(backup => (
                          <tr key={backup.filename}>
                            <td>{backup.filename}</td>
                            <td>{new Date(backup.createdAt).toLocaleString()}</td>
                            <td className="has-text-right">
                              <div className="field is-grouped is-grouped-right">
                                <p className="control is-expanded">
                                  <button 
                                    className="button is-small is-warning is-fullwidth" 
                                    onClick={() => {
                                      restoreBackup(backup.filename);
                                      setShowBackupModal(false);
                                    }}
                                    disabled={loading}
                                  >
                                    Restore
                                  </button>
                                </p>
                                <p className="control is-expanded">
                                  <button 
                                    className="button is-small is-danger is-fullwidth" 
                                    onClick={() => deleteBackup(backup.filename)}
                                    disabled={loading}
                                  >
                                    Delete
                                  </button>
                                </p>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </section>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ZoneweaverAPISettings;
