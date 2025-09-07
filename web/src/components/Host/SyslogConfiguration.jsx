import React, { useState, useEffect } from 'react';
import { useServers } from '../../contexts/ServerContext';

const SyslogConfiguration = ({ server }) => {
  const [config, setConfig] = useState(null);
  const [facilities, setFacilities] = useState([]);
  const [configContent, setConfigContent] = useState('');
  const [validation, setValidation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [validationLoading, setValidationLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [activeView, setActiveView] = useState('current'); // current, editor, builder
  
  // Rule builder state
  const [ruleBuilder, setRuleBuilder] = useState({
    facility: '*',
    level: 'info',
    action_type: 'file',
    action_target: '/var/log/custom.log'
  });
  
  const { makeZoneweaverAPIRequest } = useServers();

  // Load configuration on component mount
  useEffect(() => {
    if (server) {
      loadSyslogConfig();
      loadFacilities();
    }
  }, [server]);

  // Auto-dismiss notifications after 5 seconds
  useEffect(() => {
    if (message && (messageType === 'is-success' || messageType === 'is-warning')) {
      const timer = setTimeout(() => {
        setMessage('');
        setMessageType('');
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [message, messageType]);

  const loadSyslogConfig = async (clearMessage = true) => {
    if (!server || !makeZoneweaverAPIRequest) return;
    
    try {
      setLoading(true);
      if (clearMessage) {
        setMessage('');
      }
      
      const result = await makeZoneweaverAPIRequest(
        server.hostname,
        server.port,
        server.protocol,
        'system/syslog/config',
        'GET'
      );
      
      if (result.success) {
        setConfig(result.data);
        setConfigContent(result.data?.config_content || '');
      } else {
        setMessage(result.message || 'Failed to load syslog configuration');
        setMessageType('is-danger');
        setConfig(null);
        setConfigContent('');
      }
    } catch (err) {
      setMessage('Error loading syslog configuration: ' + err.message);
      setMessageType('is-danger');
      setConfig(null);
      setConfigContent('');
    } finally {
      setLoading(false);
    }
  };

  const loadFacilities = async () => {
    if (!server || !makeZoneweaverAPIRequest) return;
    
    try {
      const result = await makeZoneweaverAPIRequest(
        server.hostname,
        server.port,
        server.protocol,
        'system/syslog/facilities',
        'GET'
      );
      
      if (result.success) {
        setFacilities(result.data);
      }
    } catch (err) {
      console.error('Error loading facilities:', err);
    }
  };

  const validateConfiguration = async () => {
    if (!server || !configContent.trim()) {
      setMessage('Please enter configuration content to validate.');
      setMessageType('is-warning');
      return;
    }

    try {
      setValidationLoading(true);
      setMessage('Validating syslog configuration...');
      setMessageType('is-info');

      const result = await makeZoneweaverAPIRequest(
        server.hostname,
        server.port,
        server.protocol,
        'system/syslog/validate',
        'POST',
        { config_content: configContent }
      );

      setValidation(result.data);
      
      if (result.data?.valid) {
        setMessage('Configuration validation passed! No syntax errors found.');
        setMessageType('is-success');
      } else {
        setMessage(`Configuration validation found ${result.data?.errors?.length || 0} error(s) and ${result.data?.warnings?.length || 0} warning(s).`);
        setMessageType('is-warning');
      }
    } catch (error) {
      console.error('Error validating syslog configuration:', error);
      setMessage(`Validation failed: ${error.response?.data?.message || error.message}`);
      setMessageType('is-danger');
      setValidation(null);
    } finally {
      setValidationLoading(false);
    }
  };

  const applyConfiguration = async () => {
    if (!server || !configContent.trim()) {
      setMessage('Please enter configuration content to apply.');
      setMessageType('is-warning');
      return;
    }

    try {
      setLoading(true);
      setMessage('Applying syslog configuration...');
      setMessageType('is-info');

      const result = await makeZoneweaverAPIRequest(
        server.hostname,
        server.port,
        server.protocol,
        'system/syslog/config',
        'PUT',
        {
          config_content: configContent,
          backup_existing: true,
          reload_service: true
        }
      );

      if (result.success) {
        setMessage(`Syslog configuration updated successfully! ${result.data?.message || ''}`);
        setMessageType('is-success');
        
        // Reload current configuration without clearing success message
        await loadSyslogConfig(false);
      } else {
        setMessage(`Failed to apply configuration: ${result.message}`);
        setMessageType('is-danger');
      }
    } catch (error) {
      console.error('Error applying syslog configuration:', error);
      setMessage(`Failed to apply configuration: ${error.response?.data?.message || error.message}`);
      setMessageType('is-danger');
    } finally {
      setLoading(false);
    }
  };

  const reloadSyslog = async () => {
    if (!server) return;

    try {
      setLoading(true);
      setMessage('Reloading syslog service...');
      setMessageType('is-info');

      const result = await makeZoneweaverAPIRequest(
        server.hostname,
        server.port,
        server.protocol,
        'system/syslog/reload',
        'POST'
      );

      if (result.success) {
        setMessage(`Syslog service reloaded successfully! ${result.data?.message || ''}`);
        setMessageType('is-success');
        
        // Reload configuration to get updated service status
        await loadSyslogConfig(false);
      } else {
        setMessage(`Failed to reload syslog service: ${result.message}`);
        setMessageType('is-danger');
      }
    } catch (error) {
      console.error('Error reloading syslog service:', error);
      setMessage(`Failed to reload syslog service: ${error.response?.data?.message || error.message}`);
      setMessageType('is-danger');
    } finally {
      setLoading(false);
    }
  };

  const addRule = () => {
    const rule = `${ruleBuilder.facility}.${ruleBuilder.level}\t\t\t${
      ruleBuilder.action_type === 'file' ? ruleBuilder.action_target :
      ruleBuilder.action_type === 'remote_host' ? '@' + ruleBuilder.action_target :
      ruleBuilder.action_type === 'all_users' ? '*' :
      ruleBuilder.action_target
    }`;
    
    setConfigContent(prev => prev + '\n' + rule);
    
    // Reset rule builder
    setRuleBuilder({
      facility: '*',
      level: 'info',
      action_type: 'file',
      action_target: '/var/log/custom.log'
    });
  };

  const handleRuleBuilderChange = (field, value) => {
    setRuleBuilder(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const getValidationColor = (errors, warnings) => {
    if (errors && errors.length > 0) return 'is-danger';
    if (warnings && warnings.length > 0) return 'is-warning';
    return 'is-success';
  };

  const getServiceStatusColor = (status) => {
    switch (status?.state?.toLowerCase()) {
      case 'online':
        return 'is-success';
      case 'offline':
        return 'is-danger';
      case 'maintenance':
        return 'is-warning';
      default:
        return 'is-light';
    }
  };

  if (loading && !config) {
    return (
      <div className='box'>
        <div className='has-text-centered'>
          <div className='loader'></div>
          <p className='mt-3'>Loading syslog configuration...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Status Messages */}
      {message && (
        <div className={`notification ${messageType} mb-4`}>
          <button className='delete' onClick={() => setMessage('')}></button>
          <p>{message}</p>
        </div>
      )}

      {/* Configuration Overview */}
      {config && (
        <div className='box mb-4'>
          <h4 className='title is-6 mb-3'>
            <span className='icon-text'>
              <span className='icon'><i className='fas fa-info-circle'></i></span>
              <span>Configuration Status</span>
            </span>
          </h4>
          
          <div className='columns'>
            <div className='column'>
              <div className='field'>
                <label className='label is-small'>Configuration File</label>
                <p className='control'>
                  <span className='tag is-info'>
                    {config.config_file || '/etc/syslog.conf'}
                  </span>
                </p>
              </div>
            </div>
            <div className='column'>
              <div className='field'>
                <label className='label is-small'>Service Status</label>
                <p className='control'>
                  <span className={`tag ${getServiceStatusColor(config.service_status)}`}>
                    <span className='icon is-small'>
                      <i className={`fas ${config.service_status?.state === 'online' ? 'fa-check-circle' : 'fa-times-circle'}`}></i>
                    </span>
                    <span>{config.service_status?.state || 'Unknown'}</span>
                  </span>
                </p>
              </div>
            </div>
            <div className='column'>
              <div className='field'>
                <label className='label is-small'>Active Rules</label>
                <p className='control'>
                  <span className='tag is-primary'>
                    {config.parsed_rules?.length || 0} rules
                  </span>
                </p>
              </div>
            </div>
            <div className='column'>
              <div className='field'>
                <label className='label is-small'>Last Modified</label>
                <p className='control'>
                  <span className='tag is-light is-small'>
                    {new Date(config.timestamp).toLocaleString()}
                  </span>
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View Toggle */}
      <div className='tabs is-toggle is-small mb-4'>
        <ul>
          <li className={activeView === 'current' ? 'is-active' : ''}>
            <a onClick={() => setActiveView('current')}>
              <span className='icon is-small'><i className='fas fa-list'></i></span>
              <span>Current Rules</span>
            </a>
          </li>
          <li className={activeView === 'editor' ? 'is-active' : ''}>
            <a onClick={() => setActiveView('editor')}>
              <span className='icon is-small'><i className='fas fa-edit'></i></span>
              <span>Config Editor</span>
            </a>
          </li>
          <li className={activeView === 'builder' ? 'is-active' : ''}>
            <a onClick={() => setActiveView('builder')}>
              <span className='icon is-small'><i className='fas fa-plus'></i></span>
              <span>Rule Builder</span>
            </a>
          </li>
        </ul>
      </div>

      {/* Current Rules View */}
      {activeView === 'current' && (
        <div className='box'>
          <h4 className='title is-6 mb-4'>
            <span className='icon-text'>
              <span className='icon'><i className='fas fa-list'></i></span>
              <span>Current Syslog Rules</span>
            </span>
          </h4>

          {config?.parsed_rules && config.parsed_rules.length > 0 ? (
            <div className='table-container'>
              <table className='table is-fullwidth is-hoverable'>
                <thead>
                  <tr>
                    <th>Line</th>
                    <th>Facility.Level</th>
                    <th>Action Type</th>
                    <th>Target</th>
                    <th>Full Rule</th>
                  </tr>
                </thead>
                <tbody>
                  {config.parsed_rules.map((rule, index) => (
                    <tr key={index}>
                      <td>
                        <span className='tag is-light is-small'>
                          {rule.line_number}
                        </span>
                      </td>
                      <td>
                        <span className='is-family-monospace has-text-weight-semibold'>
                          {rule.selector}
                        </span>
                      </td>
                      <td>
                        <span className={`tag is-small ${
                          rule.parsed?.action_type === 'file' ? 'is-info' :
                          rule.parsed?.action_type === 'remote_host' ? 'is-warning' :
                          rule.parsed?.action_type === 'all_users' ? 'is-danger' : 'is-light'
                        }`}>
                          {rule.parsed?.action_type || 'unknown'}
                        </span>
                      </td>
                      <td>
                        <span className='is-family-monospace is-size-7'>
                          {rule.parsed?.action_target || rule.action}
                        </span>
                      </td>
                      <td>
                        <code className='is-size-7'>{rule.full_line}</code>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className='has-text-centered p-4'>
              <span className='icon is-large has-text-grey'>
                <i className='fas fa-list fa-2x'></i>
              </span>
              <p className='mt-2 has-text-grey'>No syslog rules configured</p>
            </div>
          )}
        </div>
      )}

      {/* Configuration Editor View */}
      {activeView === 'editor' && (
        <div className='box'>
          <h4 className='title is-6 mb-4'>
            <span className='icon-text'>
              <span className='icon'><i className='fas fa-edit'></i></span>
              <span>Configuration Editor</span>
            </span>
          </h4>

          <div className='field'>
            <label className='label'>Syslog Configuration Content</label>
            <div className='control'>
              <textarea 
                className='textarea is-family-monospace'
                rows='20'
                value={configContent}
                onChange={(e) => setConfigContent(e.target.value)}
                placeholder='# Enter syslog configuration rules here
# Example:
*.notice			/var/adm/messages
mail.info			/var/log/maillog
kern.err			@loghost
*.emerg				*'
                disabled={loading}
                style={{ fontSize: '0.85rem' }}
              />
            </div>
            <p className='help'>
              Edit the complete syslog.conf file content. Use TAB to separate selectors from actions.
            </p>
          </div>

          {/* Validation Results */}
          {validation && (
            <div className={`notification ${getValidationColor(validation.errors, validation.warnings)} mt-4`}>
              <h5 className='title is-6'>Validation Results</h5>
              
              {validation.errors && validation.errors.length > 0 && (
                <div className='content'>
                  <p className='has-text-weight-semibold has-text-danger'>Errors:</p>
                  <ul>
                    {validation.errors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              {validation.warnings && validation.warnings.length > 0 && (
                <div className='content'>
                  <p className='has-text-weight-semibold has-text-warning'>Warnings:</p>
                  <ul>
                    {validation.warnings.map((warning, index) => (
                      <li key={index}>{warning}</li>
                    ))}
                  </ul>
                </div>
              )}

              {validation.parsed_rules && validation.parsed_rules.length > 0 && (
                <div className='content'>
                  <p className='has-text-weight-semibold'>Parsed Rules:</p>
                  <div className='notification is-light is-small'>
                    <p className='is-size-7'>
                      {validation.parsed_rules.length} rule(s) will be active after applying this configuration.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Editor Action Buttons */}
          <div className='field is-grouped mt-4'>
            <div className='control'>
              <button 
                className={`button is-info ${validationLoading ? 'is-loading' : ''}`}
                onClick={validateConfiguration}
                disabled={loading || validationLoading}
              >
                <span className='icon'>
                  <i className='fas fa-check-circle'></i>
                </span>
                <span>Validate Configuration</span>
              </button>
            </div>
            
            <div className='control'>
              <button 
                className={`button is-primary ${loading ? 'is-loading' : ''}`}
                onClick={applyConfiguration}
                disabled={loading || validationLoading}
              >
                <span className='icon'>
                  <i className='fas fa-save'></i>
                </span>
                <span>Apply Configuration</span>
              </button>
            </div>
            
            <div className='control'>
              <button 
                className={`button is-warning ${loading ? 'is-loading' : ''}`}
                onClick={reloadSyslog}
                disabled={loading || validationLoading}
              >
                <span className='icon'>
                  <i className='fas fa-redo'></i>
                </span>
                <span>Reload Service</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rule Builder View */}
      {activeView === 'builder' && (
        <div className='box'>
          <h4 className='title is-6 mb-4'>
            <span className='icon-text'>
              <span className='icon'><i className='fas fa-plus'></i></span>
              <span>Syslog Rule Builder</span>
            </span>
          </h4>

          <div className='columns'>
            <div className='column is-3'>
              <div className='field'>
                <label className='label'>Facility</label>
                <div className='control'>
                  <div className='select is-fullwidth'>
                    <select 
                      value={ruleBuilder.facility}
                      onChange={(e) => handleRuleBuilderChange('facility', e.target.value)}
                    >
                      {facilities?.facilities?.map((facility) => (
                        <option key={facility.name} value={facility.name}>
                          {facility.name} - {facility.description}
                        </option>
                      )) || [
                        <option key="*" value="*">* - All facilities</option>,
                        <option key="kern" value="kern">kern - Kernel messages</option>,
                        <option key="mail" value="mail">mail - Mail system</option>,
                        <option key="auth" value="auth">auth - Authentication</option>,
                        <option key="daemon" value="daemon">daemon - System daemons</option>
                      ]}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <div className='column is-3'>
              <div className='field'>
                <label className='label'>Level</label>
                <div className='control'>
                  <div className='select is-fullwidth'>
                    <select 
                      value={ruleBuilder.level}
                      onChange={(e) => handleRuleBuilderChange('level', e.target.value)}
                    >
                      {facilities?.levels?.map((level) => (
                        <option key={level.name} value={level.name}>
                          {level.name} - {level.description}
                        </option>
                      )) || [
                        <option value="emerg">emerg - Emergency</option>,
                        <option value="alert">alert - Alert</option>,
                        <option value="crit">crit - Critical</option>,
                        <option value="err">err - Error</option>,
                        <option value="warning">warning - Warning</option>,
                        <option value="notice">notice - Notice</option>,
                        <option value="info">info - Info</option>,
                        <option value="debug">debug - Debug</option>
                      ]}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <div className='column is-3'>
              <div className='field'>
                <label className='label'>Action Type</label>
                <div className='control'>
                  <div className='select is-fullwidth'>
                    <select 
                      value={ruleBuilder.action_type}
                      onChange={(e) => handleRuleBuilderChange('action_type', e.target.value)}
                    >
                      <option value="file">Log to File</option>
                      <option value="remote_host">Remote Host</option>
                      <option value="all_users">All Users (*)</option>
                      <option value="user">Specific User</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <div className='column is-3'>
              <div className='field'>
                <label className='label'>Target</label>
                <div className='control'>
                  <input 
                    className='input'
                    type='text'
                    value={ruleBuilder.action_target}
                    onChange={(e) => handleRuleBuilderChange('action_target', e.target.value)}
                    placeholder={
                      ruleBuilder.action_type === 'file' ? '/var/log/custom.log' :
                      ruleBuilder.action_type === 'remote_host' ? 'loghost' :
                      ruleBuilder.action_type === 'user' ? 'username' :
                      '*'
                    }
                  />
                </div>
              </div>
            </div>
          </div>

          <div className='field'>
            <div className='control'>
              <button 
                className='button is-primary'
                onClick={addRule}
                disabled={!ruleBuilder.facility || !ruleBuilder.level || !ruleBuilder.action_target}
              >
                <span className='icon'>
                  <i className='fas fa-plus'></i>
                </span>
                <span>Add Rule to Configuration</span>
              </button>
            </div>
          </div>

          {/* Preview of generated rule */}
          <div className='notification is-light mt-4'>
            <h5 className='title is-6 mb-2'>Rule Preview</h5>
            <code className='is-size-7'>
              {ruleBuilder.facility}.{ruleBuilder.level}\t\t\t{
                ruleBuilder.action_type === 'file' ? ruleBuilder.action_target :
                ruleBuilder.action_type === 'remote_host' ? '@' + ruleBuilder.action_target :
                ruleBuilder.action_type === 'all_users' ? '*' :
                ruleBuilder.action_target
              }
            </code>
          </div>
        </div>
      )}

      {/* Help Section */}
      <div className='box'>
        <h4 className='title is-6 mb-3'>
          <span className='icon-text'>
            <span className='icon'><i className='fas fa-question-circle'></i></span>
            <span>Syslog Configuration Help</span>
          </span>
        </h4>
        
        <div className='content is-small'>
          <div className='columns'>
            <div className='column'>
              <p><strong>Common Examples:</strong></p>
              <ul>
                <li><code>*.notice /var/adm/messages</code> - All notices to messages</li>
                <li><code>mail.* /var/log/maillog</code> - All mail logs to maillog</li>
                <li><code>kern.err @loghost</code> - Kernel errors to remote host</li>
                <li><code>*.emerg *</code> - Emergency messages to all users</li>
              </ul>
            </div>
            <div className='column'>
              <p><strong>Syntax Rules:</strong></p>
              <ul>
                <li>Use TAB to separate selector from action</li>
                <li>Facility: kern, mail, auth, daemon, *, local0-7</li>
                <li>Level: emerg, alert, crit, err, warning, notice, info, debug</li>
                <li>Actions: /path/file, @hostname, username, *</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SyslogConfiguration;
