import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ArcConfiguration = ({ server }) => {
  // State management
  const [currentConfig, setCurrentConfig] = useState(null);
  const [formData, setFormData] = useState({
    arc_max_gb: '',
    arc_min_gb: '',
    apply_method: 'persistent'
  });
  const [validation, setValidation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [validationLoading, setValidationLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');

  // Load current ARC configuration
  useEffect(() => {
    if (server) {
      loadArcConfig();
    }
  }, [server]);

  const loadArcConfig = async () => {
    if (!server) return;

    try {
      setLoading(true);
      setMessage('');

      const response = await axios.get(
        `/api/zapi/${server.protocol}/${server.hostname}/${server.port}/system/zfs/arc/config`
      );

      if (response.data) {
        setCurrentConfig(response.data);
        
        // Pre-populate form with current values if they exist
        if (response.data.available_tunables) {
          const maxBytes = response.data.available_tunables.zfs_arc_max?.effective_value;
          const minBytes = response.data.available_tunables.zfs_arc_min?.effective_value;
          
          setFormData({
            arc_max_gb: maxBytes ? bytesToGb(maxBytes) : '',
            arc_min_gb: minBytes ? bytesToGb(minBytes) : '',
            apply_method: 'persistent'
          });
        }
      }
    } catch (error) {
      console.error('Error loading ARC configuration:', error);
      setMessage(`Failed to load ARC configuration: ${error.response?.data?.message || error.message}`);
      setMessageType('is-danger');
    } finally {
      setLoading(false);
    }
  };

  // Helper functions
  const bytesToGb = (bytes) => {
    return (bytes / Math.pow(1024, 3)).toFixed(2);
  };

  const gbToBytes = (gb) => {
    return Math.round(parseFloat(gb) * Math.pow(1024, 3));
  };

  const formatBytes = (bytes) => {
    if (!bytes) return '0 B';
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return (bytes / Math.pow(1024, i)).toFixed(2) + ' ' + sizes[i];
  };

  const getValidationColor = (errors, warnings) => {
    if (errors && errors.length > 0) return 'is-danger';
    if (warnings && warnings.length > 0) return 'is-warning';
    return 'is-success';
  };

  // Form handling
  const handleFormChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Clear validation when form changes
    setValidation(null);
  };

  // Validate configuration
  const validateConfiguration = async () => {
    if (!server || !formData.arc_max_gb && !formData.arc_min_gb) {
      setMessage('Please enter ARC max or min values to validate.');
      setMessageType('is-warning');
      return;
    }

    try {
      setValidationLoading(true);
      setMessage('Validating configuration...');
      setMessageType('is-info');

      const payload = {};
      if (formData.arc_max_gb) payload.arc_max_gb = parseFloat(formData.arc_max_gb);
      if (formData.arc_min_gb) payload.arc_min_gb = parseFloat(formData.arc_min_gb);

      const response = await axios.post(
        `/api/zapi/${server.protocol}/${server.hostname}/${server.port}/system/zfs/arc/validate`,
        payload
      );

      setValidation(response.data);
      
      if (response.data.valid) {
        setMessage('Configuration validation passed! Settings are within safe limits.');
        setMessageType('is-success');
      } else {
        setMessage('Configuration validation found issues. Please review the warnings below.');
        setMessageType('is-warning');
      }
    } catch (error) {
      console.error('Error validating ARC configuration:', error);
      setMessage(`Validation failed: ${error.response?.data?.message || error.message}`);
      setMessageType('is-danger');
      setValidation(null);
    } finally {
      setValidationLoading(false);
    }
  };

  // Apply configuration
  const applyConfiguration = async () => {
    if (!server || !formData.arc_max_gb && !formData.arc_min_gb) {
      setMessage('Please enter ARC max or min values to apply.');
      setMessageType('is-warning');
      return;
    }

    try {
      setLoading(true);
      setMessage('Applying ARC configuration...');
      setMessageType('is-info');

      const payload = {
        apply_method: formData.apply_method
      };

      if (formData.arc_max_gb) payload.arc_max_gb = parseFloat(formData.arc_max_gb);
      if (formData.arc_min_gb) payload.arc_min_gb = parseFloat(formData.arc_min_gb);

      const response = await axios.put(
        `/api/zapi/${server.protocol}/${server.hostname}/${server.port}/system/zfs/arc/config`,
        payload
      );

      if (response.data.success) {
        setMessage(`ARC configuration updated successfully! ${response.data.message}`);
        setMessageType('is-success');
        
        // Show reboot warning if needed
        if (response.data.results?.reboot_required) {
          setMessage(prev => `${prev} Note: System reboot required for persistent changes to take effect.`);
          setMessageType('is-warning');
        }

        // Reload current configuration
        await loadArcConfig();
      } else {
        setMessage(`Failed to apply configuration: ${response.data.message}`);
        setMessageType('is-danger');
      }
    } catch (error) {
      console.error('Error applying ARC configuration:', error);
      setMessage(`Failed to apply configuration: ${error.response?.data?.message || error.message}`);
      setMessageType('is-danger');
    } finally {
      setLoading(false);
    }
  };

  // Reset to defaults
  const resetToDefaults = async () => {
    if (!server) return;

    if (!window.confirm('Are you sure you want to reset ARC configuration to defaults? This will remove all custom settings.')) {
      return;
    }

    try {
      setLoading(true);
      setMessage('Resetting ARC configuration to defaults...');
      setMessageType('is-info');

      const response = await axios.post(
        `/api/zapi/${server.protocol}/${server.hostname}/${server.port}/system/zfs/arc/reset`,
        { apply_method: formData.apply_method }
      );

      if (response.data.success) {
        setMessage(`ARC configuration reset to defaults successfully! ${response.data.message}`);
        setMessageType('is-success');
        
        // Clear form and reload
        setFormData({
          arc_max_gb: '',
          arc_min_gb: '',
          apply_method: 'persistent'
        });
        setValidation(null);
        await loadArcConfig();
      } else {
        setMessage(`Failed to reset configuration: ${response.data.message}`);
        setMessageType('is-danger');
      }
    } catch (error) {
      console.error('Error resetting ARC configuration:', error);
      setMessage(`Failed to reset configuration: ${error.response?.data?.message || error.message}`);
      setMessageType('is-danger');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !currentConfig) {
    return (
      <div className='box'>
        <div className='has-text-centered'>
          <div className='loader'></div>
          <p className='mt-3'>Loading ARC configuration...</p>
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

      {/* Current Status */}
      {currentConfig && (
        <div className='box mb-4'>
          <h4 className='title is-6 mb-3'>
            <span className='icon-text'>
              <span className='icon'><i className='fas fa-info-circle'></i></span>
              <span>Current ARC Status</span>
            </span>
          </h4>
          
          <div className='columns'>
            <div className='column'>
              <div className='field'>
                <label className='label is-small'>Current ARC Size</label>
                <p className='control'>
                  <span className='tag is-info'>
                    {formatBytes(currentConfig.current_config?.arc_size_bytes)}
                  </span>
                </p>
              </div>
            </div>
            <div className='column'>
              <div className='field'>
                <label className='label is-small'>Max ARC Size</label>
                <p className='control'>
                  <span className='tag is-primary'>
                    {formatBytes(currentConfig.current_config?.arc_max_bytes)}
                  </span>
                </p>
              </div>
            </div>
            <div className='column'>
              <div className='field'>
                <label className='label is-small'>Min ARC Size</label>
                <p className='control'>
                  <span className='tag is-dark'>
                    {formatBytes(currentConfig.current_config?.arc_min_bytes)}
                  </span>
                </p>
              </div>
            </div>
            <div className='column'>
              <div className='field'>
                <label className='label is-small'>Physical Memory</label>
                <p className='control'>
                  <span className='tag is-light'>
                    {formatBytes(currentConfig.system_constraints?.physical_memory_bytes)}
                  </span>
                </p>
              </div>
            </div>
          </div>

          {/* System Constraints */}
          {currentConfig.system_constraints && (
            <div className='notification is-light mt-3'>
              <h5 className='title is-6 mb-2'>System Constraints</h5>
              <div className='content is-small'>
                <p><strong>Max Safe ARC:</strong> {formatBytes(currentConfig.system_constraints.max_safe_arc_bytes)} 
                   (85% of physical memory)</p>
                <p><strong>Min Recommended:</strong> {formatBytes(currentConfig.system_constraints.min_recommended_arc_bytes)} 
                   (1% of physical memory)</p>
                <p><strong>Configuration Source:</strong> {currentConfig.config_source || 'auto-calculated'}</p>
              </div>
            </div>
          )}
        </div>
      )}

        {/* Oracle Solaris Runtime Warning */}
        <div className='notification is-warning mb-4'>
          <h5 className='title is-6 mb-2'>
            <span className='icon-text'>
              <span className='icon'><i className='fas fa-exclamation-triangle'></i></span>
              <span>Oracle Solaris Limitation</span>
            </span>
          </h5>
          <p className='content is-small mb-0'>
            <strong>Runtime ARC changes are not supported on Oracle Solaris.</strong> 
            ARC configuration changes can only be applied persistently and require a system reboot to take effect. 
            The "Runtime Only" and "Both" options are provided for compatibility but will not modify live ARC settings.
          </p>
        </div>

        {/* Configuration Form */}
        <div className='box'>
          <h4 className='title is-6 mb-3'>
            <span className='icon-text'>
              <span className='icon'><i className='fas fa-cog'></i></span>
              <span>ARC Configuration</span>
            </span>
          </h4>

        <div className='columns'>
          <div className='column is-6'>
            <div className='field mb-4'>
              <label className='label'>
                Maximum ARC Size: {formData.arc_max_gb ? `${parseFloat(formData.arc_max_gb).toFixed(2)} GB` : 'Auto'}
              </label>
              <div className='control mt-4 mb-4'>
                <input 
                  className='zw-range-slider-primary'
                  type='range'
                  min={currentConfig?.system_constraints ? 
                    Math.max(
                      parseFloat(formData.arc_min_gb) || 0,
                      bytesToGb(currentConfig.system_constraints.min_recommended_arc_bytes)
                    ).toFixed(2) : '1'}
                  max={currentConfig?.system_constraints ? 
                    bytesToGb(currentConfig.system_constraints.max_safe_arc_bytes).toFixed(2) : '100'}
                  step='0.25'
                  value={formData.arc_max_gb || (currentConfig?.system_constraints ? 
                    bytesToGb(currentConfig.system_constraints.max_safe_arc_bytes).toFixed(2) : '50')}
                  onChange={(e) => handleFormChange('arc_max_gb', e.target.value)}
                  disabled={loading}
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    background: formData.arc_max_gb ? 
                      `linear-gradient(to right, #007bff 0%, #007bff ${
                        ((parseFloat(formData.arc_max_gb) - (currentConfig?.system_constraints ? 
                          Math.max(
                            parseFloat(formData.arc_min_gb) || 0,
                            bytesToGb(currentConfig.system_constraints.min_recommended_arc_bytes)
                          ) : 1)) / 
                          ((currentConfig?.system_constraints ? 
                            bytesToGb(currentConfig.system_constraints.max_safe_arc_bytes) : 100) - 
                            (currentConfig?.system_constraints ? 
                              Math.max(
                                parseFloat(formData.arc_min_gb) || 0,
                                bytesToGb(currentConfig.system_constraints.min_recommended_arc_bytes)
                              ) : 1))) * 100
                      }%, #ccc ${
                        ((parseFloat(formData.arc_max_gb) - (currentConfig?.system_constraints ? 
                          Math.max(
                            parseFloat(formData.arc_min_gb) || 0,
                            bytesToGb(currentConfig.system_constraints.min_recommended_arc_bytes)
                          ) : 1)) / 
                          ((currentConfig?.system_constraints ? 
                            bytesToGb(currentConfig.system_constraints.max_safe_arc_bytes) : 100) - 
                            (currentConfig?.system_constraints ? 
                              Math.max(
                                parseFloat(formData.arc_min_gb) || 0,
                                bytesToGb(currentConfig.system_constraints.min_recommended_arc_bytes)
                              ) : 1))) * 100
                      }%, #ccc 100%)`
                      : 'linear-gradient(to right, #ccc 0%, #ccc 100%)'
                  }}
                />
              </div>
              <div className='help is-size-7'>
                Range: {currentConfig?.system_constraints ? 
                  Math.max(
                    parseFloat(formData.arc_min_gb) || 0,
                    bytesToGb(currentConfig.system_constraints.min_recommended_arc_bytes)
                  ).toFixed(2) : '1'} GB to {currentConfig?.system_constraints ? 
                  bytesToGb(currentConfig.system_constraints.max_safe_arc_bytes).toFixed(2) : '100'} GB
                <br />Leave unset for auto-calculation based on system memory.
              </div>
              <div className='field mt-3'>
                <div className='control'>
                  <button 
                    className='button is-small is-light'
                    onClick={() => handleFormChange('arc_max_gb', '')}
                    disabled={loading}
                    title='Reset to auto-calculation'
                  >
                    <span className='icon is-small'>
                      <i className='fas fa-undo'></i>
                    </span>
                    <span>Auto</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className='column is-6'>
            <div className='field mb-4'>
              <label className='label'>
                Minimum ARC Size: {formData.arc_min_gb ? `${parseFloat(formData.arc_min_gb).toFixed(2)} GB` : 'Auto'}
              </label>
              <div className='control mt-4 mb-4'>
                <input 
                  className='zw-range-slider-info'
                  type='range'
                  min={currentConfig?.system_constraints ? 
                    bytesToGb(currentConfig.system_constraints.min_recommended_arc_bytes).toFixed(2) : '0.5'}
                  max={formData.arc_max_gb ? 
                    Math.min(
                      parseFloat(formData.arc_max_gb),
                      currentConfig?.system_constraints ? 
                        bytesToGb(currentConfig.system_constraints.max_safe_arc_bytes) : 100
                    ).toFixed(2) : 
                    (currentConfig?.system_constraints ? 
                      bytesToGb(currentConfig.system_constraints.max_safe_arc_bytes).toFixed(2) : '100')}
                  step='0.25'
                  value={formData.arc_min_gb || (currentConfig?.system_constraints ? 
                    bytesToGb(currentConfig.system_constraints.min_recommended_arc_bytes).toFixed(2) : '1')}
                  onChange={(e) => handleFormChange('arc_min_gb', e.target.value)}
                  disabled={loading}
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    background: formData.arc_min_gb ? 
                      `linear-gradient(to right, #17a2b8 0%, #17a2b8 ${
                        ((parseFloat(formData.arc_min_gb) - (currentConfig?.system_constraints ? 
                          bytesToGb(currentConfig.system_constraints.min_recommended_arc_bytes) : 0.5)) / 
                          ((formData.arc_max_gb ? 
                            Math.min(
                              parseFloat(formData.arc_max_gb),
                              currentConfig?.system_constraints ? 
                                bytesToGb(currentConfig.system_constraints.max_safe_arc_bytes) : 100
                            ) : 
                            (currentConfig?.system_constraints ? 
                              bytesToGb(currentConfig.system_constraints.max_safe_arc_bytes) : 100)) - 
                            (currentConfig?.system_constraints ? 
                              bytesToGb(currentConfig.system_constraints.min_recommended_arc_bytes) : 0.5))) * 100
                      }%, #ccc ${
                        ((parseFloat(formData.arc_min_gb) - (currentConfig?.system_constraints ? 
                          bytesToGb(currentConfig.system_constraints.min_recommended_arc_bytes) : 0.5)) / 
                          ((formData.arc_max_gb ? 
                            Math.min(
                              parseFloat(formData.arc_max_gb),
                              currentConfig?.system_constraints ? 
                                bytesToGb(currentConfig.system_constraints.max_safe_arc_bytes) : 100
                            ) : 
                            (currentConfig?.system_constraints ? 
                              bytesToGb(currentConfig.system_constraints.max_safe_arc_bytes) : 100)) - 
                            (currentConfig?.system_constraints ? 
                              bytesToGb(currentConfig.system_constraints.min_recommended_arc_bytes) : 0.5))) * 100
                      }%, #ccc 100%)`
                      : 'linear-gradient(to right, #ccc 0%, #ccc 100%)'
                  }}
                />
              </div>
              <div className='help is-size-7'>
                Range: {currentConfig?.system_constraints ? 
                  bytesToGb(currentConfig.system_constraints.min_recommended_arc_bytes).toFixed(2) : '0.5'} GB to {formData.arc_max_gb ? 
                  Math.min(
                    parseFloat(formData.arc_max_gb),
                    currentConfig?.system_constraints ? 
                      bytesToGb(currentConfig.system_constraints.max_safe_arc_bytes) : 100
                  ).toFixed(2) : 
                  (currentConfig?.system_constraints ? 
                    bytesToGb(currentConfig.system_constraints.max_safe_arc_bytes).toFixed(2) : '100')} GB
                <br />Leave unset for auto-calculation based on system memory.
              </div>
              <div className='field mt-3'>
                <div className='control'>
                  <button 
                    className='button is-small is-light'
                    onClick={() => handleFormChange('arc_min_gb', '')}
                    disabled={loading}
                    title='Reset to auto-calculation'
                  >
                    <span className='icon is-small'>
                      <i className='fas fa-undo'></i>
                    </span>
                    <span>Auto</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className='columns'>
          <div className='column is-6'>
            <div className='field'>
              <label className='label'>Apply Method</label>
              <div className='control'>
                <div className='select is-fullwidth'>
                  <select 
                    value={formData.apply_method}
                    onChange={(e) => handleFormChange('apply_method', e.target.value)}
                    disabled={loading}
                  >
                    <option value='runtime'>Runtime Only (Temporary)</option>
                    <option value='persistent'>Persistent Only (Reboot Required)</option>
                    <option value='both'>Both Runtime + Persistent</option>
                  </select>
                </div>
              </div>
              <p className='help'>Choose how to apply the changes.</p>
            </div>
          </div>
          <div className='column is-6'>
            {/* Constraint Summary */}
            {currentConfig?.system_constraints && (
              <div className='notification is-light is-small'>
                <h6 className='title is-6 mb-2'>Quick Reference</h6>
                <div className='content is-small'>
                  <p><strong>Physical Memory:</strong> {formatBytes(currentConfig.system_constraints.physical_memory_bytes)}</p>
                  <p><strong>Safe Max ARC:</strong> {formatBytes(currentConfig.system_constraints.max_safe_arc_bytes)} (85%)</p>
                  <p><strong>Min Recommended:</strong> {formatBytes(currentConfig.system_constraints.min_recommended_arc_bytes)} (1%)</p>
                </div>
              </div>
            )}
          </div>
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

            {validation.proposed_settings && (
              <div className='content'>
                <p className='has-text-weight-semibold'>Proposed Settings:</p>
                <div className='tags'>
                  {validation.proposed_settings.arc_max_gb && (
                    <span className='tag is-info'>
                      Max: {validation.proposed_settings.arc_max_gb} GB
                    </span>
                  )}
                  {validation.proposed_settings.arc_min_gb && (
                    <span className='tag is-info'>
                      Min: {validation.proposed_settings.arc_min_gb} GB
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
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
              onClick={resetToDefaults}
              disabled={loading || validationLoading}
            >
              <span className='icon'>
                <i className='fas fa-undo'></i>
              </span>
              <span>Reset to Defaults</span>
            </button>
          </div>
        </div>
      </div>

      {/* Help Section */}
      <div className='box'>
        <h4 className='title is-6 mb-3'>
          <span className='icon-text'>
            <span className='icon'><i className='fas fa-question-circle'></i></span>
            <span>Configuration Help</span>
          </span>
        </h4>
        
        <div className='content is-small'>
          <div className='columns'>
            <div className='column'>
              <p><strong>Apply Methods (Oracle Solaris):</strong></p>
              <ul>
                <li><strong>Runtime Only:</strong> <em>Not supported</em> - Provided for compatibility only</li>
                <li><strong>Persistent Only:</strong> Saves changes to config file, requires reboot (recommended)</li>
                <li><strong>Both:</strong> <em>Functions as Persistent Only</em> - Runtime changes ignored</li>
              </ul>
              <p className='has-text-weight-semibold has-text-warning-dark'>
                ⚠️ All ARC changes require system reboot on Oracle Solaris
              </p>
            </div>
            <div className='column'>
              <p><strong>Best Practices:</strong></p>
              <ul>
                <li>Leave fields empty for automatic calculation based on system memory</li>
                <li>Maximum ARC should not exceed 85% of total system memory</li>
                <li>Minimum ARC should be at least 1% of total system memory</li>
                <li>Always validate configuration before applying changes</li>
                <li>Plan maintenance window for reboot after ARC changes</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ArcConfiguration;
