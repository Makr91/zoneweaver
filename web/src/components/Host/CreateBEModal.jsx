import React, { useState } from 'react';
import { useServers } from '../../contexts/ServerContext';

const CreateBEModal = ({ server, onClose, onSuccess, onError }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    sourceBE: '',
    snapshot: '',
    activate: false,
    zpool: '',
    properties: {},
    createdBy: 'api'
  });

  const { makeZoneweaverAPIRequest } = useServers();

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handlePropertyChange = (key, value) => {
    setFormData(prev => ({
      ...prev,
      properties: {
        ...prev.properties,
        [key]: value
      }
    }));
  };

  const removeProperty = (key) => {
    setFormData(prev => {
      const newProperties = { ...prev.properties };
      delete newProperties[key];
      return {
        ...prev,
        properties: newProperties
      };
    });
  };

  const addProperty = () => {
    const key = `property_${Object.keys(formData.properties).length + 1}`;
    handlePropertyChange(key, '');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      onError('Boot environment name is required');
      return;
    }

    // Validate BE name format
    const beNameRegex = /^[a-zA-Z0-9][a-zA-Z0-9._-]*$/;
    if (!beNameRegex.test(formData.name.trim())) {
      onError('Boot environment name must start with alphanumeric character and contain only letters, numbers, dots, underscores, and hyphens');
      return;
    }

    try {
      setLoading(true);
      onError('');

      const requestData = {
        name: formData.name.trim(),
        created_by: formData.createdBy
      };

      // Add optional fields only if they have values
      if (formData.description.trim()) {
        requestData.description = formData.description.trim();
      }
      if (formData.sourceBE.trim()) {
        requestData.source_be = formData.sourceBE.trim();
      }
      if (formData.snapshot.trim()) {
        requestData.snapshot = formData.snapshot.trim();
      }
      if (formData.activate) {
        requestData.activate = true;
      }
      if (formData.zpool.trim()) {
        requestData.zpool = formData.zpool.trim();
      }

      // Add properties if any are defined
      const validProperties = Object.entries(formData.properties).reduce((acc, [key, value]) => {
        if (key.trim() && value.trim()) {
          acc[key.trim()] = value.trim();
        }
        return acc;
      }, {});

      if (Object.keys(validProperties).length > 0) {
        requestData.properties = validProperties;
      }

      const result = await makeZoneweaverAPIRequest(
        server.hostname,
        server.port,
        server.protocol,
        'system/boot-environments',
        'POST',
        requestData
      );

      if (result.success) {
        onSuccess();
      } else {
        onError(result.message || 'Failed to create boot environment');
      }
    } catch (err) {
      onError('Error creating boot environment: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='modal is-active'>
      <div className='modal-background' onClick={onClose}></div>
      <div className='modal-card modal-card-large'>
        <header className='modal-card-head'>
          <p className='modal-card-title'>
            <span className='icon mr-2'>
              <i className='fas fa-plus'></i>
            </span>
            Create Boot Environment
          </p>
          <button className='delete' onClick={onClose}></button>
        </header>
        
        <form onSubmit={handleSubmit}>
          <section className='modal-card-body'>
            {/* Basic Information */}
            <div className='box mb-4'>
              <h3 className='title is-6'>Basic Information</h3>
              
              <div className='field'>
                <label className='label'>Boot Environment Name *</label>
                <div className='control'>
                  <input 
                    className='input'
                    type='text'
                    placeholder='e.g., backup-before-update'
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    required
                  />
                </div>
                <p className='help'>Must start with alphanumeric character. Can contain letters, numbers, dots, underscores, and hyphens.</p>
              </div>

              <div className='field'>
                <label className='label'>Description (Optional)</label>
                <div className='control'>
                  <textarea 
                    className='textarea'
                    placeholder='Brief description of this boot environment'
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    rows='2'
                  />
                </div>
              </div>
            </div>

            {/* Source Configuration */}
            <div className='box mb-4'>
              <h3 className='title is-6'>Source Configuration</h3>
              
              <div className='columns'>
                <div className='column'>
                  <div className='field'>
                    <label className='label'>Source Boot Environment</label>
                    <div className='control'>
                      <input 
                        className='input'
                        type='text'
                        placeholder='Leave empty to use current BE'
                        value={formData.sourceBE}
                        onChange={(e) => handleInputChange('sourceBE', e.target.value)}
                      />
                    </div>
                    <p className='help'>Source BE to clone from (default: current active BE)</p>
                  </div>
                </div>
                
                <div className='column'>
                  <div className='field'>
                    <label className='label'>Source Snapshot</label>
                    <div className='control'>
                      <input 
                        className='input'
                        type='text'
                        placeholder='Snapshot name or path'
                        value={formData.snapshot}
                        onChange={(e) => handleInputChange('snapshot', e.target.value)}
                      />
                    </div>
                    <p className='help'>Create BE from specific snapshot</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Advanced Options */}
            <div className='box mb-4'>
              <h3 className='title is-6'>Advanced Options</h3>
              
              <div className='columns'>
                <div className='column'>
                  <div className='field'>
                    <div className='control'>
                      <label className='checkbox'>
                        <input 
                          type='checkbox'
                          checked={formData.activate}
                          onChange={(e) => handleInputChange('activate', e.target.checked)}
                        />
                        <span className='ml-2'>
                          <strong>Activate on Creation</strong> - Set as active boot environment for next reboot
                        </span>
                      </label>
                    </div>
                  </div>

                  <div className='field'>
                    <label className='label'>ZFS Pool (Optional)</label>
                    <div className='control'>
                      <input 
                        className='input'
                        type='text'
                        placeholder='e.g., rpool'
                        value={formData.zpool}
                        onChange={(e) => handleInputChange('zpool', e.target.value)}
                      />
                    </div>
                    <p className='help'>Specify ZFS pool (default: system pool)</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Custom Properties */}
            <div className='box'>
              <h3 className='title is-6'>Custom Properties</h3>
              
              {Object.entries(formData.properties).map(([key, value], index) => (
                <div key={index} className='field has-addons mb-3'>
                  <div className='control'>
                    <input 
                      className='input'
                      type='text'
                      placeholder='Property name'
                      value={key}
                      onChange={(e) => {
                        const newProperties = { ...formData.properties };
                        delete newProperties[key];
                        newProperties[e.target.value] = value;
                        setFormData(prev => ({ ...prev, properties: newProperties }));
                      }}
                    />
                  </div>
                  <div className='control is-expanded'>
                    <input 
                      className='input'
                      type='text'
                      placeholder='Property value'
                      value={value}
                      onChange={(e) => handlePropertyChange(key, e.target.value)}
                    />
                  </div>
                  <div className='control'>
                    <button 
                      type='button'
                      className='button has-background-danger-dark has-text-danger-light'
                      onClick={() => removeProperty(key)}
                    >
                      <span className='icon'>
                        <i className='fas fa-trash'></i>
                      </span>
                    </button>
                  </div>
                </div>
              ))}
              
              <button 
                type='button'
                className='button is-info'
                onClick={addProperty}
              >
                <span className='icon'>
                  <i className='fas fa-plus'></i>
                </span>
                <span>Add Property</span>
              </button>
              
              <p className='help mt-2'>
                Add custom ZFS properties to the boot environment (e.g., compression, mountpoint)
              </p>
            </div>
          </section>
          
          <footer className='modal-card-foot'>
            <button 
              type='submit'
              className={`button is-success ${loading ? 'is-loading' : ''}`}
              disabled={loading}
            >
              <span className='icon'>
                <i className='fas fa-plus'></i>
              </span>
              <span>Create Boot Environment</span>
            </button>
            <button 
              type='button'
              className='button' 
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
};

export default CreateBEModal;
