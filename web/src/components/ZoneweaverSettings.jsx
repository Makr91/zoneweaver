import React, { useState, useEffect } from "react";
import { Helmet } from "@dr.pogodin/react-helmet";
import { useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../contexts/AuthContext";
import { useServers } from "../contexts/ServerContext";
import { canManageSettings } from "../utils/permissions";
import ServerTable from "./Host/ServerTable";
import ServerForm from "./Host/ServerForm";
import ServerHelpPanel from "./Host/ServerHelpPanel";
import ServerStatusCard from "./Host/ServerStatusCard";

const ZoneweaverSettings = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState('application');
  const [settings, setSettings] = useState({
    appName: "Zoneweaver",
    appVersion: "2.0.0",
    frontendUrl: "",
    maxServersPerUser: 10,
    autoRefreshInterval: 5, // seconds
    enableNotifications: true,
    enableDarkMode: true,
    sessionTimeout: 24, // hours
    enableLogging: true,
    debugMode: false,
    corsWhitelist: [],
    gravatarApiKey: "",
    // Mail settings
    mailSmtpHost: "",
    mailSmtpPort: 587,
    mailSmtpSecure: false,
    mailSmtpUser: "",
    mailSmtpPassword: "",
    mailFromAddress: ""
  });
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [requiresRestart, setRequiresRestart] = useState(false);

  // Server management state
  const [servers, setServers] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [hostname, setHostname] = useState("");
  const [port, setPort] = useState("5001");
  const [protocol, setProtocol] = useState("https");
  const [entityName, setEntityName] = useState("Zoneweaver-Production");
  const [apiKey, setApiKey] = useState("");
  const [useExistingApiKey, setUseExistingApiKey] = useState(false);
  const [testResult, setTestResult] = useState(null);

  const { servers: allServers, getServers, removeServer, addServer, testServer, refreshServers, selectServer } = useServers();

  // Load settings on component mount
  useEffect(() => {
    if (user && canManageSettings(user.role)) {
      loadSettings();
      loadServers();
    }
  }, [user]);

  // Load servers when allServers changes (avoid unnecessary calls)
  useEffect(() => {
    if (user && canManageSettings(user.role)) {
      loadServers();
    }
  }, [allServers, user]);

  // Handle URL parameter for direct tab navigation
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab) {
      setActiveTab(tab);
      if (tab === 'servers') {
        setShowAddForm(true);
      }
      setSearchParams({}); // Clear URL parameter after processing
    }
  }, [searchParams, setSearchParams]);

  const loadServers = () => {
    const serverList = getServers();
    setServers(serverList);
  };

  // Server management functions
  const deleteServer = async (serverId) => {
    if (!window.confirm('Are you sure you want to remove this server? This will remove the server connection.')) {
      return;
    }
    try {
      setLoading(true);
      setMsg("");
      const result = await removeServer(serverId);
      if (result.success) {
        setMsg("Server removed successfully!");
      } else {
        setMsg(result.message || "Failed to remove server");
      }
    } catch (error) {
      setMsg("Error removing server. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const editServer = (hostname) => {
    // Find the server object by hostname
    const server = servers.find(s => s.hostname === hostname);
    if (server) {
      // Select the server in context
      selectServer(server);
      // Navigate to the host management page
      navigate('/ui/host-manage');
    }
  };

  const testConnection = async () => {
    if (!hostname || !port || !protocol) {
      setMsg('Please fill in hostname, port, and protocol first');
      return;
    }
    try {
      setLoading(true);
      setMsg('Testing connection...');
      setTestResult(null);
      const result = await testServer({ hostname, port: parseInt(port), protocol });
      if (result.success) {
        setTestResult('success');
        setMsg('Connection test successful! Server is reachable and ready for bootstrap.');
      } else {
        setTestResult('error');
        setMsg(`Connection test failed: ${result.message}`);
      }
    } catch (error) {
      setTestResult('error');
      setMsg('Connection test failed. Please check your server details.');
    } finally {
      setLoading(false);
    }
  };

  const addServerHandler = async (e) => {
    e.preventDefault();
    if (!hostname || !port || !protocol) {
      setMsg('Hostname, port, and protocol are required');
      return;
    }
    if (useExistingApiKey && !apiKey) {
      setMsg('API key is required when using existing API key option');
      return;
    }
    if (!useExistingApiKey && !entityName) {
      setMsg('Entity name is required when bootstrapping');
      return;
    }
    const isDuplicate = servers.some(server =>
      server.hostname === hostname &&
      server.port === parseInt(port) &&
      server.protocol === protocol
    );
    if (isDuplicate) {
      setTestResult('error');
      setMsg(`Server ${protocol}://${hostname}:${port} is already registered.`);
      return;
    }
    try {
      setLoading(true);
      setMsg('');
      setTestResult(null);
      const serverData = {
        hostname,
        port: parseInt(port),
        protocol,
        entityName: entityName || 'Zoneweaver-Production'
      };
      if (useExistingApiKey) {
        serverData.apiKey = apiKey;
      }
      const result = await addServer(serverData);
      if (result.success) {
        setTestResult('success');
        setMsg('Server added successfully! Refreshing servers...');
        await refreshServers();
        setShowAddForm(false);
        resetForm();
      } else {
        setTestResult('error');
        setMsg(result.message);
      }
    } catch (error) {
      setTestResult('error');
      setMsg('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setHostname('');
    setPort('5001');
    setProtocol('https');
    setEntityName('Zoneweaver-Production');
    setApiKey('');
    setUseExistingApiKey(false);
    setTestResult(null);
    setMsg('');
  };

  const loadSettings = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/settings');
      
      if (response.data.success) {
        setSettings(response.data.settings);
      } else {
        setMsg('Failed to load settings: ' + response.data.message);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      setMsg('Error loading settings: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  // Check permissions - only super-admin can access
  if (!user || !canManageSettings(user.role)) {
    return (
      <div className='zw-page-content-scrollable'>
        <Helmet>
          <meta charSet='utf-8' />
          <title>System Settings - Zoneweaver</title>
          <link rel='canonical' href={window.location.origin} />
        </Helmet>
        <div className='container is-fluid p-0'>
          <div className='box p-0 is-radiusless'>
            <div className='titlebar box active level is-mobile mb-0 p-3'>
              <div className='level-left'>
                <strong>Access Denied</strong>
              </div>
            </div>
            <div className='p-4'>
              <div className='notification is-danger'>
                <h2 className='title is-4'>Super Admin Access Required</h2>
                <p>Only super administrators can modify Zoneweaver system settings.</p>
                <p className='mt-2'>Your current role: <span className='tag is-warning'>{user?.role || 'Unknown'}</span></p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const handleSettingChange = (setting, value) => {
    setSettings(prev => ({
      ...prev,
      [setting]: value
    }));
  };

  const saveSettings = async () => {
    setLoading(true);
    setMsg("");
    setRequiresRestart(false);
    
    try {
      const response = await axios.put('/api/settings', settings);
      
      if (response.data.success) {
        setMsg(response.data.message);
        setRequiresRestart(response.data.requiresRestart);
      } else {
        setMsg('Failed to save settings: ' + response.data.message);
      }
      
    } catch (error) {
      console.error('Error saving settings:', error);
      setMsg("Error saving settings: " + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const resetToDefaults = async () => {
    if (!window.confirm('Are you sure you want to reset all settings to defaults? This cannot be undone.')) {
      return;
    }
    
    try {
      setLoading(true);
      setMsg("");
      
      const response = await axios.post('/api/settings/reset');
      
      if (response.data.success) {
        setMsg(response.data.message);
        // Reload settings from server
        await loadSettings();
      } else {
        setMsg('Failed to reset settings: ' + response.data.message);
      }
      
    } catch (error) {
      console.error('Error resetting settings:', error);
      setMsg("Error resetting settings: " + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const restartServer = async () => {
    if (!window.confirm('Are you sure you want to restart the server? This will briefly interrupt service for all users.')) {
      return;
    }
    
    try {
      setLoading(true);
      setMsg("Initiating server restart...");
      
      const response = await axios.post('/api/settings/restart');
      
      if (response.data.success) {
        setMsg(response.data.message + " The page will reload automatically.");
        
        // Wait a moment then reload the page
        setTimeout(() => {
          window.location.reload();
        }, 3000);
      } else {
        setMsg('Failed to restart server: ' + response.data.message);
      }
      
    } catch (error) {
      console.error('Error restarting server:', error);
      setMsg("Error restarting server: " + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='zw-page-content-scrollable'>
      <Helmet>
        <meta charSet='utf-8' />
        <title>Zoneweaver Settings - Zoneweaver</title>
        <link rel='canonical' href={window.location.origin} />
      </Helmet>
      <div className='container is-fluid p-0'>
        <div className='box p-0 is-radiusless'>
          <div className='titlebar box active level is-mobile mb-0 p-3'>
            <div className='level-left'>
              <strong>Zoneweaver System Settings</strong>
            </div>
            <div className='level-right'>
              <span className='tag is-danger'>Super Admin Only</span>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className='tabs is-boxed'>
            <ul>
              <li className={activeTab === 'application' ? 'is-active' : ''}>
                <a onClick={() => setActiveTab('application')}>
                  <span className='icon is-small'><i className='fas fa-cog'></i></span>
                  <span>Application</span>
                </a>
              </li>
              <li className={activeTab === 'servers' ? 'is-active' : ''}>
                <a onClick={() => setActiveTab('servers')}>
                  <span className='icon is-small'><i className='fas fa-server'></i></span>
                  <span>Server Management</span>
                </a>
              </li>
              <li className={activeTab === 'security' ? 'is-active' : ''}>
                <a onClick={() => setActiveTab('security')}>
                  <span className='icon is-small'><i className='fas fa-shield-alt'></i></span>
                  <span>Security</span>
                </a>
              </li>
              <li className={activeTab === 'mail' ? 'is-active' : ''}>
                <a onClick={() => setActiveTab('mail')}>
                  <span className='icon is-small'><i className='fas fa-envelope'></i></span>
                  <span>Mail</span>
                </a>
              </li>
              <li className={activeTab === 'performance' ? 'is-active' : ''}>
                <a onClick={() => setActiveTab('performance')}>
                  <span className='icon is-small'><i className='fas fa-tachometer-alt'></i></span>
                  <span>Performance</span>
                </a>
              </li>
            </ul>
          </div>

          <div className='p-4'>
            {msg && (
              <div className={`notification ${
                msg.includes('successfully') ? 'is-success' : 
                msg.includes('Error') ? 'is-danger' : 
                'is-warning'
              } mb-4`}>
                <p>{msg}</p>
              </div>
            )}

            {/* Application Tab */}
            {activeTab === 'application' && (
              <>
                {/* Application Settings */}
                <div className='box mb-4'>
                  <h2 className='title is-5'>Application Settings</h2>
                  <div className='columns'>
                    <div className='column'>
                      <div className='field'>
                        <label className='label'>Application Name</label>
                        <div className='control'>
                          <input 
                            className='input'
                            type='text'
                            value={settings.appName}
                            onChange={(e) => handleSettingChange('appName', e.target.value)}
                          />
                        </div>
                        <p className='help has-text-grey'>Display name for the application</p>
                      </div>
                    </div>
                    <div className='column'>
                      <div className='field'>
                        <label className='label'>Application Version</label>
                        <div className='control'>
                          <input 
                            className='input'
                            type='text'
                            value={settings.appVersion}
                            onChange={(e) => handleSettingChange('appVersion', e.target.value)}
                          />
                        </div>
                        <p className='help has-text-grey'>Current version number</p>
                      </div>
                    </div>
                  </div>
                  <div className='field'>
                    <label className='label'>Gravatar API Key</label>
                    <div className='control'>
                      <input
                        className='input'
                        type='text'
                        value={settings.gravatarApiKey}
                        onChange={(e) => handleSettingChange('gravatarApiKey', e.target.value)}
                      />
                    </div>
                    <p className='help has-text-grey'>API key for Gravatar integration</p>
                  </div>
                </div>

                {/* Feature Toggles */}
                <div className='box mb-4'>
                  <h2 className='title is-5'>Feature Settings</h2>
                  <div className='columns'>
                    <div className='column'>
                      <div className='field'>
                        <div className='control'>
                          <label className='checkbox'>
                            <input 
                              type='checkbox'
                              checked={settings.enableNotifications}
                              onChange={(e) => handleSettingChange('enableNotifications', e.target.checked)}
                            />
                            <span className='ml-2'>Enable Notifications</span>
                          </label>
                        </div>
                        <p className='help has-text-grey'>Allow browser notifications for alerts</p>
                      </div>

                      <div className='field'>
                        <div className='control'>
                          <label className='checkbox'>
                            <input 
                              type='checkbox'
                              checked={settings.enableDarkMode}
                              onChange={(e) => handleSettingChange('enableDarkMode', e.target.checked)}
                            />
                            <span className='ml-2'>Enable Dark Mode</span>
                          </label>
                        </div>
                        <p className='help has-text-grey'>Default to dark theme for new users</p>
                      </div>
                    </div>
                    <div className='column'>
                      <div className='field'>
                        <div className='control'>
                          <label className='checkbox'>
                            <input 
                              type='checkbox'
                              checked={settings.enableLogging}
                              onChange={(e) => handleSettingChange('enableLogging', e.target.checked)}
                            />
                            <span className='ml-2'>Enable System Logging</span>
                          </label>
                        </div>
                        <p className='help has-text-grey'>Log system events and errors</p>
                      </div>

                      <div className='field'>
                        <div className='control'>
                          <label className='checkbox'>
                            <input 
                              type='checkbox'
                              checked={settings.debugMode}
                              onChange={(e) => handleSettingChange('debugMode', e.target.checked)}
                            />
                            <span className='ml-2'>Debug Mode</span>
                          </label>
                        </div>
                        <p className='help has-text-grey'>Enable detailed debug logging (impacts performance)</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Database Settings */}
                <div className='box mb-4'>
                  <h2 className='title is-5'>Database Settings</h2>
                  <div className='field'>
                    <label className='label'>Database Path</label>
                    <div className='control'>
                      <input 
                        className='input'
                        type='text'
                        value={settings.databasePath}
                        onChange={(e) => handleSettingChange('databasePath', e.target.value)}
                      />
                    </div>
                    <p className='help has-text-grey'>The path to the SQLite database file.</p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className='field is-grouped is-grouped-centered'>
                  <div className='control'>
                    <button 
                      className={`button is-primary ${loading ? 'is-loading' : ''}`}
                      onClick={saveSettings}
                      disabled={loading}
                    >
                      <span className='icon'>
                        <i className='fas fa-save'></i>
                      </span>
                      <span>Save Settings</span>
                    </button>
                  </div>
                  <div className='control'>
                    <button 
                      className='button is-warning'
                      onClick={resetToDefaults}
                      disabled={loading}
                    >
                      <span className='icon'>
                        <i className='fas fa-undo'></i>
                      </span>
                      <span>Reset to Defaults</span>
                    </button>
                  </div>
                </div>
              </>
            )}

            {/* Server Management Tab */}
            {activeTab === 'servers' && (
              <>
                <div className='level is-mobile mb-4'>
                  <div className='level-left'>
                    <h2 className='title is-5'>Zoneweaver API Servers</h2>
                  </div>
                  <div className='level-right'>
                    <button className='button is-primary' onClick={() => { setShowAddForm(!showAddForm); resetForm(); }}>
                      <span className='icon'>
                        <i className={`fas ${showAddForm ? 'fa-minus' : 'fa-plus'}`}></i>
                      </span>
                      <span>{showAddForm ? 'Cancel' : 'Add Server'}</span>
                    </button>
                  </div>
                </div>

                {showAddForm ? (
                  <form onSubmit={addServerHandler} autoComplete='off'>
                    <div className='columns'>
                      <div className='column is-8'>
                        <ServerForm
                          hostname={hostname} setHostname={setHostname}
                          port={port} setPort={setPort}
                          protocol={protocol} setProtocol={setProtocol}
                          entityName={entityName} setEntityName={setEntityName}
                          apiKey={apiKey} setApiKey={setApiKey}
                          useExistingApiKey={useExistingApiKey} setUseExistingApiKey={setUseExistingApiKey}
                          loading={loading}
                        />
                      </div>
                      <div className='column is-4'>
                        <ServerHelpPanel useExistingApiKey={useExistingApiKey} />
                        <ServerStatusCard testResult={testResult} useExistingApiKey={useExistingApiKey} />
                      </div>
                    </div>
                    <div className='buttons is-centered'>
                      <button type="button" className={`button is-info ${loading ? 'is-loading' : ''}`} onClick={testConnection} disabled={loading}>
                        Test Connection
                      </button>
                      <button type="submit" className={`button is-primary ${loading ? 'is-loading' : ''}`} disabled={loading}>
                        {useExistingApiKey ? 'Add Server' : 'Bootstrap Server'}
                      </button>
                    </div>
                  </form>
                ) : (
                  <ServerTable servers={servers} onEdit={editServer} onDelete={deleteServer} loading={loading} />
                )}
              </>
            )}

            {/* Security Tab */}
            {activeTab === 'security' && (
              <>
                {/* Security Settings */}
                <div className='box mb-4'>
                  <h2 className='title is-5'>Authentication Settings</h2>
                  <div className='field'>
                    <label className='label'>Session Timeout (hours)</label>
                    <div className='control'>
                      <input 
                        className='input'
                        type='number'
                        min='1'
                        max='168'
                        value={settings.sessionTimeout}
                        onChange={(e) => handleSettingChange('sessionTimeout', parseInt(e.target.value))}
                      />
                    </div>
                    <p className='help has-text-grey'>How long users stay logged in (1-168 hours)</p>
                  </div>
                </div>

                {/* CORS Settings */}
                <div className='box mb-4'>
                  <h2 className='title is-5'>CORS Settings</h2>
                  <div className='field'>
                    <label className='label'>Allowed Origins (one per line)</label>
                    <div className='control'>
                      <textarea
                        className='textarea'
                        value={settings.corsWhitelist.join('\n')}
                        onChange={(e) => handleSettingChange('corsWhitelist', e.target.value.split('\n'))}
                      />
                    </div>
                    <p className='help has-text-grey'>List of allowed CORS origins for cross-origin requests</p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className='field is-grouped is-grouped-centered'>
                  <div className='control'>
                    <button 
                      className={`button is-primary ${loading ? 'is-loading' : ''}`}
                      onClick={saveSettings}
                      disabled={loading}
                    >
                      <span className='icon'>
                        <i className='fas fa-save'></i>
                      </span>
                      <span>Save Settings</span>
                    </button>
                  </div>
                  <div className='control'>
                    <button 
                      className='button is-warning'
                      onClick={resetToDefaults}
                      disabled={loading}
                    >
                      <span className='icon'>
                        <i className='fas fa-undo'></i>
                      </span>
                      <span>Reset to Defaults</span>
                    </button>
                  </div>
                </div>
              </>
            )}

            {/* Performance Tab */}
            {activeTab === 'performance' && (
              <>
                {/* Resource Limits */}
                <div className='box mb-4'>
                  <h2 className='title is-5'>Resource Limits</h2>
                  <div className='columns'>
                    <div className='column'>
                      <div className='field'>
                        <label className='label'>Max Servers Per User</label>
                        <div className='control'>
                          <input 
                            className='input'
                            type='number'
                            min='1'
                            max='100'
                            value={settings.maxServersPerUser}
                            onChange={(e) => handleSettingChange('maxServersPerUser', parseInt(e.target.value))}
                          />
                        </div>
                        <p className='help has-text-grey'>Maximum Zoneweaver API Servers per user</p>
                      </div>
                    </div>
                    <div className='column'>
                      <div className='field'>
                        <label className='label'>Auto Refresh Interval (seconds)</label>
                        <div className='control'>
                          <input 
                            className='input'
                            type='number'
                            min='1'
                            max='60'
                            value={settings.autoRefreshInterval}
                            onChange={(e) => handleSettingChange('autoRefreshInterval', parseInt(e.target.value))}
                          />
                        </div>
                        <p className='help has-text-grey'>How often dashboard stats refresh (1-60 seconds)</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Server Configuration */}
                <div className='box mb-4'>
                  <h2 className='title is-5'>Server Configuration</h2>
                  <div className='columns'>
                    <div className='column'>
                      <div className='field'>
                        <label className='label'>Server Hostname</label>
                        <div className='control'>
                          <input 
                            className='input'
                            type='text'
                            value={settings.serverHostname}
                            onChange={(e) => handleSettingChange('serverHostname', e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                    <div className='column'>
                      <div className='field'>
                        <label className='label'>Server Port</label>
                        <div className='control'>
                          <input 
                            className='input'
                            type='number'
                            value={settings.serverPort}
                            onChange={(e) => handleSettingChange('serverPort', parseInt(e.target.value))}
                          />
                        </div>
                      </div>
                    </div>
                    <div className='column'>
                      <div className='field'>
                        <label className='label'>Frontend Port</label>
                        <div className='control'>
                          <input 
                            className='input'
                            type='number'
                            value={settings.frontendPort}
                            onChange={(e) => handleSettingChange('frontendPort', parseInt(e.target.value))}
                          />
                        </div>
                      </div>
                    </div>
                    <div className='column'>
                      <div className='field'>
                        <label className='label'>SSL Enabled</label>
                        <div className='control'>
                          <label className='checkbox'>
                            <input 
                              type='checkbox'
                              checked={settings.sslEnabled}
                              onChange={(e) => handleSettingChange('sslEnabled', e.target.checked)}
                            />
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className='field is-grouped is-grouped-centered'>
                  <div className='control'>
                    <button 
                      className={`button is-primary ${loading ? 'is-loading' : ''}`}
                      onClick={saveSettings}
                      disabled={loading}
                    >
                      <span className='icon'>
                        <i className='fas fa-save'></i>
                      </span>
                      <span>Save Settings</span>
                    </button>
                  </div>
                  <div className='control'>
                    <button 
                      className='button is-warning'
                      onClick={resetToDefaults}
                      disabled={loading}
                    >
                      <span className='icon'>
                        <i className='fas fa-undo'></i>
                      </span>
                      <span>Reset to Defaults</span>
                    </button>
                  </div>
                </div>
              </>
            )}

            {/* Mail Tab */}
            {activeTab === 'mail' && (
              <>
                {/* SMTP Configuration */}
                <div className='box mb-4'>
                  <h2 className='title is-5'>SMTP Configuration</h2>
                  <div className='columns'>
                    <div className='column'>
                      <div className='field'>
                        <label className='label'>SMTP Host</label>
                        <div className='control'>
                          <input 
                            className='input'
                            type='text'
                            placeholder='smtp.gmail.com'
                            value={settings.mailSmtpHost}
                            onChange={(e) => handleSettingChange('mailSmtpHost', e.target.value)}
                          />
                        </div>
                        <p className='help has-text-grey'>SMTP server hostname</p>
                      </div>
                    </div>
                    <div className='column is-narrow'>
                      <div className='field'>
                        <label className='label'>Port</label>
                        <div className='control'>
                          <input 
                            className='input'
                            type='number'
                            min='1'
                            max='65535'
                            value={settings.mailSmtpPort}
                            onChange={(e) => handleSettingChange('mailSmtpPort', parseInt(e.target.value))}
                          />
                        </div>
                        <p className='help has-text-grey'>SMTP port (587 for TLS, 465 for SSL)</p>
                      </div>
                    </div>
                    <div className='column is-narrow'>
                      <div className='field'>
                        <label className='label'>Secure Connection</label>
                        <div className='control'>
                          <label className='checkbox'>
                            <input 
                              type='checkbox'
                              checked={settings.mailSmtpSecure}
                              onChange={(e) => handleSettingChange('mailSmtpSecure', e.target.checked)}
                            />
                            <span className='ml-2'>Use SSL/TLS</span>
                          </label>
                        </div>
                        <p className='help has-text-grey'>Enable for port 465</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* SMTP Authentication */}
                <div className='box mb-4'>
                  <h2 className='title is-5'>SMTP Authentication</h2>
                  <div className='columns'>
                    <div className='column'>
                      <div className='field'>
                        <label className='label'>SMTP Username</label>
                        <div className='control'>
                          <input 
                            className='input'
                            type='email'
                            placeholder='your-email@gmail.com'
                            value={settings.mailSmtpUser}
                            onChange={(e) => handleSettingChange('mailSmtpUser', e.target.value)}
                          />
                        </div>
                        <p className='help has-text-grey'>SMTP authentication username (usually your email)</p>
                      </div>
                    </div>
                    <div className='column'>
                      <div className='field'>
                        <label className='label'>SMTP Password</label>
                        <div className='control'>
                          <input 
                            className='input'
                            type='password'
                            placeholder='your-app-password'
                            value={settings.mailSmtpPassword}
                            onChange={(e) => handleSettingChange('mailSmtpPassword', e.target.value)}
                          />
                        </div>
                        <p className='help has-text-grey'>SMTP authentication password (use app passwords for Gmail)</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Mail Settings */}
                <div className='box mb-4'>
                  <h2 className='title is-5'>Email Settings</h2>
                  <div className='field'>
                    <label className='label'>From Address</label>
                    <div className='control'>
                      <input 
                        className='input'
                        type='email'
                        placeholder='Zoneweaver <noreply@yourdomain.com>'
                        value={settings.mailFromAddress}
                        onChange={(e) => handleSettingChange('mailFromAddress', e.target.value)}
                      />
                    </div>
                    <p className='help has-text-grey'>Email address that appears as sender for invitations and notifications</p>
                  </div>
                </div>

                {/* Mail Test Section */}
                <div className='box mb-4'>
                  <h2 className='title is-5'>Test Configuration</h2>
                  <div className='field'>
                    <label className='label'>Test Email Address</label>
                    <div className='control has-icons-right'>
                      <input 
                        className='input'
                        type='email'
                        placeholder='test@example.com'
                        id='testEmailInput'
                      />
                      <span className='icon is-small is-right'>
                        <i className='fas fa-envelope'></i>
                      </span>
                    </div>
                    <p className='help has-text-grey'>Send a test email to verify SMTP configuration</p>
                  </div>
                  <div className='field'>
                    <div className='control'>
                      <button 
                        className={`button is-info ${loading ? 'is-loading' : ''}`}
                        onClick={async () => {
                          const testEmail = document.getElementById('testEmailInput').value;
                          if (!testEmail) {
                            setMsg('Please enter a test email address');
                            return;
                          }
                          try {
                            setLoading(true);
                            setMsg('Sending test email...');
                            const response = await axios.post('/api/mail/test', { testEmail });
                            if (response.data.success) {
                              setMsg('Test email sent successfully! Check your inbox.');
                            } else {
                              setMsg('Failed to send test email: ' + response.data.message);
                            }
                          } catch (error) {
                            setMsg('Error sending test email: ' + (error.response?.data?.message || error.message));
                          } finally {
                            setLoading(false);
                          }
                        }}
                        disabled={loading}
                      >
                        <span className='icon'>
                          <i className='fas fa-paper-plane'></i>
                        </span>
                        <span>Send Test Email</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Configuration Help */}
                <div className='box mb-4'>
                  <h2 className='title is-6'>Configuration Help</h2>
                  <div className='content is-size-7'>
                    <h3 className='title is-6'>Common SMTP Providers:</h3>
                    <div className='columns'>
                      <div className='column'>
                        <p><strong>Gmail:</strong></p>
                        <ul>
                          <li>Host: smtp.gmail.com</li>
                          <li>Port: 587 (TLS) or 465 (SSL)</li>
                          <li>Secure: false for 587, true for 465</li>
                          <li>Use App Password (not regular password)</li>
                        </ul>
                        <p><strong>Outlook/Hotmail:</strong></p>
                        <ul>
                          <li>Host: smtp-mail.outlook.com</li>
                          <li>Port: 587</li>
                          <li>Secure: false</li>
                        </ul>
                      </div>
                      <div className='column'>
                        <p><strong>Yahoo:</strong></p>
                        <ul>
                          <li>Host: smtp.mail.yahoo.com</li>
                          <li>Port: 587 or 465</li>
                          <li>Secure: false for 587, true for 465</li>
                        </ul>
                        <p><strong>Custom SMTP:</strong></p>
                        <ul>
                          <li>Contact your hosting provider</li>
                          <li>Check documentation for settings</li>
                          <li>Test configuration before saving</li>
                        </ul>
                      </div>
                    </div>
                    <div className='notification is-info mt-3'>
                      <p><strong>Note:</strong> Email configuration is required for user invitations and password reset functionality. Save settings first, then use the test button to verify configuration.</p>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className='field is-grouped is-grouped-centered'>
                  <div className='control'>
                    <button 
                      className={`button is-primary ${loading ? 'is-loading' : ''}`}
                      onClick={saveSettings}
                      disabled={loading}
                    >
                      <span className='icon'>
                        <i className='fas fa-save'></i>
                      </span>
                      <span>Save Mail Settings</span>
                    </button>
                  </div>
                  <div className='control'>
                    <button 
                      className='button is-warning'
                      onClick={resetToDefaults}
                      disabled={loading}
                    >
                      <span className='icon'>
                        <i className='fas fa-undo'></i>
                      </span>
                      <span>Reset to Defaults</span>
                    </button>
                  </div>
                </div>
              </>
            )}

            {/* Restart Warning */}
            {requiresRestart && (
              <div className='notification is-warning mt-4'>
                <h3 className='title is-6'>Server Restart Required</h3>
                <p>Some of your changes require a server restart to take effect.</p>
                <div className='mt-3'>
                  <button 
                    className='button is-danger'
                    onClick={restartServer}
                    disabled={loading}
                  >
                    <span className='icon'>
                      <i className='fas fa-power-off'></i>
                    </span>
                    <span>Restart Server Now</span>
                  </button>
                </div>
              </div>
            )}

            {/* Help Section */}
            <div className='box mt-4'>
              <h2 className='title is-6'>Settings Information</h2>
              <div className='content is-size-7'>
                <p><strong>Important:</strong> These settings affect the entire Zoneweaver application for all users.</p>
                <ul>
                  <li>Changes require super-admin privileges and take effect immediately</li>
                  <li>Some settings may require users to refresh their browsers</li>
                  <li>Performance settings affect resource usage and responsiveness</li>
                  <li>Security settings impact user sessions and authentication</li>
                </ul>
                <p className='mt-3'><strong>Current User:</strong> {user.username} <span className='tag is-danger is-small'>Super Admin</span></p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ZoneweaverSettings;
