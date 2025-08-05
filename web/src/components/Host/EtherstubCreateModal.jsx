import React, { useState, useEffect } from 'react';
import { useServers } from '../../contexts/ServerContext';

const EtherstubCreateModal = ({ server, existingEtherstubs, onClose, onSuccess, onError }) => {
  const [formData, setFormData] = useState({
    name: '',
    temporary: false
  });
  const [creating, setCreating] = useState(false);

  const { makeWebHyveRequest } = useServers();

  // Generate next available etherstub name
  const generateNextEtherstubName = () => {
    if (!existingEtherstubs) return 'stub0';
    
    // Extract numeric suffixes from existing etherstub names
    // Handle both .name and .link fields from JSON response
    const existingNumbers = existingEtherstubs
      .map(eth => eth.name || eth.link)
      .filter(name => name && name.startsWith('stub'))
      .map(name => {
        const match = name.match(/^stub(\d+)$/);
        return match ? parseInt(match[1], 10) : -1;
      })
      .filter(num => num >= 0)
      .sort((a, b) => a - b);

    // Find the next available number
    let nextNumber = 0;
    for (const num of existingNumbers) {
      if (num === nextNumber) {
        nextNumber++;
      } else {
        break;
      }
    }
    
    return `stub${nextNumber}`;
  };

  // Set default etherstub name when modal opens
  useEffect(() => {
    const defaultName = generateNextEtherstubName();
    setFormData(prev => ({
      ...prev,
      name: defaultName
    }));
  }, [existingEtherstubs]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      onError('Etherstub name is required');
      return false;
    }

    // Validate etherstub name format
    const nameRegex = /^[a-zA-Z][a-zA-Z0-9_]*$/;
    if (!nameRegex.test(formData.name)) {
      onError('Etherstub name must start with a letter and contain only letters, numbers, and underscores');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      setCreating(true);
      onError('');
      
      const requestData = {
        name: formData.name.trim(),
        temporary: formData.temporary,
        created_by: 'api'
      };
      
      const result = await makeWebHyveRequest(
        server.hostname,
        server.port,
        server.protocol,
        'network/etherstubs',
        'POST',
        requestData
      );
      
      if (result.success) {
        onSuccess();
      } else {
        onError(result.message || 'Failed to create etherstub');
      }
    } catch (err) {
      onError('Error creating etherstub: ' + err.message);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className='modal is-active'>
      <div className='modal-background' onClick={onClose}></div>
      <div className='modal-card' style={{ width: '40%', maxWidth: '500px' }}>
        <header className='modal-card-head'>
          <p className='modal-card-title'>
            <span className='icon mr-2'>
              <i className='fas fa-plus'></i>
            </span>
            Create Etherstub
          </p>
          <button className='delete' onClick={onClose}></button>
        </header>
        
        <section className='modal-card-body'>
          <form onSubmit={handleSubmit}>
            <div className='field'>
              <label className='label'>Etherstub Name *</label>
              <div className='control'>
                <input
                  className='input'
                  type='text'
                  placeholder='e.g., stub0'
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  disabled={creating}
                  required
                />
              </div>
              <p className='help'>Must start with a letter and contain only letters, numbers, and underscores</p>
            </div>

            <div className='field'>
              <div className='control'>
                <label className='checkbox'>
                  <input
                    type='checkbox'
                    checked={formData.temporary}
                    onChange={(e) => handleInputChange('temporary', e.target.checked)}
                    disabled={creating}
                  />
                  <span className='ml-2'>Temporary (not persistent across reboots)</span>
                </label>
              </div>
              <p className='help'>If checked, the etherstub will be removed when the system reboots</p>
            </div>

            <div className='notification is-info mt-4'>
              <p><strong>About Etherstubs:</strong></p>
              <p>Etherstubs provide a virtual Layer 2 switch that allows VNICs to communicate with each other without requiring a physical network interface. They are useful for creating isolated virtual networks within a system.</p>
            </div>
          </form>
        </section>
        
        <footer className='modal-card-foot'>
          <button
            type='submit'
            className={`button is-primary ${creating ? 'is-loading' : ''}`}
            onClick={handleSubmit}
            disabled={creating}
          >
            Create Etherstub
          </button>
          <button
            type='button'
            className='button'
            onClick={onClose}
            disabled={creating}
          >
            Cancel
          </button>
        </footer>
      </div>
    </div>
  );
};

export default EtherstubCreateModal;
