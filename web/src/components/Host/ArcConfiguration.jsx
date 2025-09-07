import { useState, useEffect } from 'react';
import axios from 'axios';

const ArcConfiguration = ({ server }) => {
  const [currentConfig, setCurrentConfig] = useState(null);
  const [formData, setFormData] = useState({
    arc_max_gb: '',
    arc_min_gb: '',
    arc_max_percent: '',
    user_reserve_hint_pct: '',
    arc_meta_limit_gb: '',
    arc_meta_min_gb: '',
    vdev_max_pending: '',
    prefetch_disable: false,
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
          const tunables = response.data.available_tunables;
          
          setFormData({
            // Memory Parameters
            arc_max_gb: tunables.zfs_arc_max?.effective_value ? bytesToGb(tunables.zfs_arc_max.effective_value) : '',
            arc_min_gb: tunables.zfs_arc_min?.effective_value ? bytesToGb(tunables.zfs_arc_min.effective_value) : '',
            arc_max_percent: tunables.zfs_arc_max_percent?.effective_value || '',
            user_reserve_hint_pct: tunables.user_reserve_hint_pct?.effective_value || '',
            arc_meta_limit_gb: tunables.zfs_arc_meta_limit?.effective_value ? bytesToGb(tunables.zfs_arc_meta_limit.effective_value) : '',
            arc_meta_min_gb: tunables.zfs_arc_meta_min?.effective_value ? bytesToGb(tunables.zfs_arc_meta_min.effective_value) : '',
            // Performance Parameters
            vdev_max_pending: tunables.zfs_vdev_max_pending?.effective_value || '',
            prefetch_disable: tunables.zfs_prefetch_disable?.effective_value === 1,
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
    const hasAnySettings = formData.arc_max_gb || formData.arc_min_gb || formData.arc_max_percent || 
                          formData.user_reserve_hint_pct || formData.vdev_max_pending || formData.prefetch_disable;
    
    if (!server || !hasAnySettings) {
      setMessage('Please configure at least one ZFS parameter to apply changes.');
      setMessageType('is-warning');
      return;
    }

    try {
      setLoading(true);
      setMessage('Applying ZFS configuration...');
      setMessageType('is-info');

      const payload = {
        apply_method: formData.apply_method
      };

      // Memory Parameters
      if (formData.arc_max_gb) payload.arc_max_gb = parseFloat(formData.arc_max_gb);
      if (formData.arc_min_gb) payload.arc_min_gb = parseFloat(formData.arc_min_gb);
      if (formData.arc_max_percent) payload.arc_max_percent = parseInt(formData.arc_max_percent);
      if (formData.user_reserve_hint_pct) payload.user_reserve_hint_pct = parseInt(formData.user_reserve_hint_pct);
      if (formData.arc_meta_limit_gb) payload.arc_meta_limit_gb = parseFloat(formData.arc_meta_limit_gb);
      if (formData.arc_meta_min_gb) payload.arc_meta_min_gb = parseFloat(formData.arc_meta_min_gb);
      
      // Performance Parameters
      if (formData.vdev_max_pending) payload.vdev_max_pending = parseInt(formData.vdev_max_pending);
      payload.prefetch_disable = formData.prefetch_disable;

      const response = await axios.put(
        `/api/zapi/${server.protocol}/${server.hostname}/${server.port}/system/zfs/arc/config`,
        payload
      );

      if (response.data.success) {
        setMessage(`ZFS configuration updated successfully! ${response.data.message}`);
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
      console.error('Error applying ZFS configuration:', error);
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
          arc_max_percent: '',
          user_reserve_hint_pct: '',
          arc_meta_limit_gb: '',
          arc_meta_min_gb: '',
          vdev_max_pending: '',
          prefetch_disable: false,
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
          <h4 className='title is-6 mb-4'>
            <span className='icon-text'>
              <span className='icon'><i className='fas fa-cog'></i></span>
              <span>ZFS Configuration</span>
            </span>
          </h4>

          {/* Memory Parameters Section */}
          <h5 className='title is-6 mb-3 has-text-primary'>
            <span className='icon-text'>
              <span className='icon'><i className='fas fa-memory'></i></span>
              <span>Memory Parameters</span>
            </span>
          </h5>

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

        {/* ARC Max Percent and User Reserve Hint */}
        <div className='columns'>
          <div className='column is-6'>
            <div className='field mb-4'>
              <label className='label'>
                ARC Max Percent: {formData.arc_max_percent ? `${formData.arc_max_percent}%` : 'Auto'} 
                <span className='tag is-success is-small ml-2'>Dynamic</span>
              </label>
              <div className='control mt-4 mb-4'>
                <input 
                  className='zw-range-slider-primary'
                  type='range'
                  min='1'
                  max='100'
                  step='1'
                  value={formData.arc_max_percent || '90'}
                  onChange={(e) => handleFormChange('arc_max_percent', e.target.value)}
                  disabled={loading}
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    background: formData.arc_max_percent ? 
                      `linear-gradient(to right, #007bff 0%, #007bff ${formData.arc_max_percent}%, #ccc ${formData.arc_max_percent}%, #ccc 100%)`
                      : 'linear-gradient(to right, #ccc 0%, #ccc 100%)'
                  }}
                />
              </div>
              <div className='help is-size-7'>
                Alternative to ARC max GB - sets ARC as percentage of physical memory (1-100%).
                <br />Takes effect immediately without reboot.
              </div>
              <div className='field mt-3'>
                <div className='control'>
                  <button 
                    className='button is-small is-light'
                    onClick={() => handleFormChange('arc_max_percent', '')}
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
                User Reserve Hint: {formData.user_reserve_hint_pct ? `${formData.user_reserve_hint_pct}%` : 'None'} 
                <span className='tag is-success is-small ml-2'>Dynamic</span>
              </label>
              <div className='control mt-4 mb-4'>
                <input 
                  className='zw-range-slider-info'
                  type='range'
                  min='0'
                  max='99'
                  step='1'
                  value={formData.user_reserve_hint_pct || '0'}
                  onChange={(e) => handleFormChange('user_reserve_hint_pct', e.target.value)}
                  disabled={loading}
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    background: formData.user_reserve_hint_pct ? 
                      `linear-gradient(to right, #17a2b8 0%, #17a2b8 ${formData.user_reserve_hint_pct}%, #ccc ${formData.user_reserve_hint_pct}%, #ccc 100%)`
                      : 'linear-gradient(to right, #ccc 0%, #ccc 100%)'
                  }}
                />
              </div>
              <div className='help is-size-7'>
                Memory reserved for applications (0-99%). Alternative to setting ARC max.
                <br />Recommended for database servers. Takes effect immediately.
              </div>
              <div className='field mt-3'>
                <div className='control'>
                  <button 
                    className='button is-small is-light'
                    onClick={() => handleFormChange('user_reserve_hint_pct', '')}
                    disabled={loading}
                    title='Reset to no reservation'
                  >
                    <span className='icon is-small'>
                      <i className='fas fa-undo'></i>
                    </span>
                    <span>None</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Performance Parameters Section */}
        <hr />
        <h5 className='title is-6 mb-3 has-text-info'>
          <span className='icon-text'>
            <span className='icon'><i className='fas fa-tachometer-alt'></i></span>
            <span>Performance Parameters</span>
          </span>
        </h5>

        <div className='columns'>
          <div className='column is-6'>
            <div className='field mb-4'>
              <label className='label'>
                VDev Max Pending: {formData.vdev_max_pending ? formData.vdev_max_pending : 'Auto'} 
                <span className='tag is-success is-small ml-2'>Dynamic</span>
              </label>
              <div className='control mt-4 mb-4'>
                <input 
                  className='zw-range-slider-primary'
                  type='range'
                  min='1'
                  max='100'
                  step='1'
                  value={formData.vdev_max_pending || '10'}
                  onChange={(e) => handleFormChange('vdev_max_pending', e.target.value)}
                  disabled={loading}
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    background: formData.vdev_max_pending ? 
                      `linear-gradient(to right, #007bff 0%, #007bff ${formData.vdev_max_pending}%, #ccc ${formData.vdev_max_pending}%, #ccc 100%)`
                      : 'linear-gradient(to right, #ccc 0%, #ccc 100%)'
                  }}
                />
              </div>
              <div className='help is-size-7'>
                Max concurrent I/Os per device (1-100). Higher values for storage arrays.
                <br />Typical: 10 (default), 35-50 (high-performance storage).
              </div>
              <div className='field mt-3'>
                <div className='control'>
                  <button 
                    className='button is-small is-light'
                    onClick={() => handleFormChange('vdev_max_pending', '')}
                    disabled={loading}
                    title='Reset to default (10)'
                  >
                    <span className='icon is-small'>
                      <i className='fas fa-undo'></i>
                    </span>
                    <span>Default</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className='column is-6'>
            <div className='field'>
              <label className='label'>
                ZFS Prefetching 
                <span className='tag is-success is-small ml-2'>Dynamic</span>
              </label>
              <div className='control'>
                <label className='checkbox'>
                  <input 
                    type='checkbox'
                    checked={!formData.prefetch_disable}
                    onChange={(e) => handleFormChange('prefetch_disable', !e.target.checked)}
                    disabled={loading}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <span className='ml-2'>Enable ZFS file-level prefetching</span>
                </label>
              </div>
              <div className='help is-size-7 mt-2'>
                Prefetching improves sequential read performance by predicting future reads.
                <br />Keep enabled for most workloads. Disable only for specific use cases.
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
