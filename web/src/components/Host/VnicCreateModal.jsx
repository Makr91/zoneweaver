import React, { useState, useEffect } from 'react';
import { useServers } from '../../contexts/ServerContext';

const VnicCreateModal = ({ server, onClose, onSuccess, onError }) => {
  const [formData, setFormData] = useState({
    name: '',
    link: '',
    vlan_id: '',
    mac_address: '',
    temporary: false,
    properties: {}
  });
  const [creating, setCreating] = useState(false);
  const [availableLinks, setAvailableLinks] = useState([]);
  const [loadingLinks, setLoadingLinks] = useState(false);
  const [propertyKey, setPropertyKey] = useState('');
  const [propertyValue, setPropertyValue] = useState('');

  const { makeWebHyveRequest } = useServers();

  // Common VNIC properties dropdown options
  const commonProperties = [
    'maxbw',      // Maximum bandwidth (e.g., 100M, 1G)
    'priority',   // Priority (low, medium, high)
    'cpus',       // CPU binding (e.g., 0,1,2)
    'protection', // Protection modes
    'allowed-ips', // Allowed IP addresses
    'allowed-dhcp-cids', // Allowed DHCP client IDs
    'rxrings',    // Number of receive rings
    'txrings',    // Number of transmit rings
    'mtu',        // Maximum transmission unit
    'cos',        // Class of service
    'pvid',       // Port VLAN ID
    'ethertype'   // Ethernet type filter
  ];

  // Property value options for properties that have limited choices
  const propertyValueOptions = {
    'priority': ['low', 'medium', 'high'],
    'protection': ['mac-nospoof', 'restricted', 'ip-nospoof', 'dhcp-nospoof'],
    'cos': ['0', '1', '2', '3', '4', '5', '6', '7'],
    'ethertype': [
      '0x0800',  // IPv4
      '0x86dd',  // IPv6
      '0x0806',  // ARP
      '0x8100',  // VLAN
      '0x8137',  // IPX
      '0x809b',  // AppleTalk
      '0x8863',  // PPPoE Discovery
      '0x8864'   // PPPoE Session
    ],
    'maxbw': [
      '10M',     // 10 Megabits
      '100M',    // 100 Megabits  
      '1G',      // 1 Gigabit
      '10G',     // 10 Gigabits
      '25G',     // 25 Gigabits
      '40G',     // 40 Gigabits
      '100G'     // 100 Gigabits
    ],
    'rxrings': ['1', '2', '4', '8', '16'],
    'txrings': ['1', '2', '4', '8', '16'],
    'mtu': [
      '1500',    // Standard Ethernet
      '9000',    // Jumbo frames
      '9216',    // Jumbo frames (Cisco)
      '1514',    // Standard + VLAN tag
      '1518'     // Standard + VLAN + FCS
    ]
  };

  // Get the appropriate input for property value based on the selected property
  const getPropertyValueInput = () => {
    if (propertyValueOptions[propertyKey]) {
      // Use dropdown for properties with predefined options
      return (
        <div className='select is-fullwidth'>
          <select
            value={propertyValue}
            onChange={(e) => setPropertyValue(e.target.value)}
            disabled={creating}
          >
            <option value=''>Select {propertyKey} value</option>
            {propertyValueOptions[propertyKey].map((option, index) => (
              <option key={index} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
      );
    } else {
      // Use text input for other properties
      return (
        <input
          className='input'
          type='text'
          placeholder='Property value'
          value={propertyValue}
          onChange={(e) => setPropertyValue(e.target.value)}
          disabled={creating}
        />
      );
    }
  };

  // Load available links when modal opens
  useEffect(() => {
    loadAvailableLinks();
  }, [server]);

  // Auto-generate VNIC name when link or VLAN changes
  useEffect(() => {
    if (formData.link) {
      generateVnicName();
    }
  }, [formData.link, formData.vlan_id]);

  const generateVnicName = async () => {
    if (!formData.link) return;
    
    try {
      // Get existing VNICs to check for conflicts
      const vnicsResult = await makeWebHyveRequest(
        server.hostname,
        server.port,
        server.protocol,
        'network/vnics',
        'GET'
      );
      
      const existingVnics = vnicsResult.success ? vnicsResult.data?.vnics || [] : [];
      const existingNames = new Set(existingVnics.map(vnic => vnic.link).filter(Boolean));
      
      // Generate unique name following your convention: vnic_<random_4digit>_<sequence>
      let attempts = 0;
      let suggestedName = '';
      
      do {
        // Generate random 4-digit number (1000-9999)
        const random4Digit = Math.floor(Math.random() * 9000) + 1000;
        
        // Build base pattern with random 4-digit number
        const basePattern = `vnic_${random4Digit}_`;
        
        // Find next available sequence number for this 4-digit number
        let sequence = 0;
        const existingWithPattern = existingVnics.filter(vnic => 
          vnic.link && vnic.link.startsWith(basePattern)
        );
        
        if (existingWithPattern.length > 0) {
          const sequences = existingWithPattern.map(vnic => {
            const parts = vnic.link.split('_');
            const lastPart = parts[parts.length - 1];
            return parseInt(lastPart) || 0;
          });
          sequence = Math.max(...sequences) + 1;
        }
        
        suggestedName = `${basePattern}${sequence}`;
        attempts++;
        
        // Safety valve to prevent infinite loop
      } while (existingNames.has(suggestedName) && attempts < 100);
      
      setFormData(prev => ({
        ...prev,
        name: suggestedName
      }));
      
    } catch (err) {
      console.error('Error generating VNIC name:', err);
      // Fallback to simple naming with random 4-digit
      const random4Digit = Math.floor(Math.random() * 9000) + 1000;
      const fallbackName = `vnic_${random4Digit}_0`;
      setFormData(prev => ({
        ...prev,
        name: fallbackName
      }));
    }
  };

  const loadAvailableLinks = async () => {
    if (!server || !makeWebHyveRequest) return;
    
    try {
      setLoadingLinks(true);
      
      // Load different types of links that VNICs can attach to
      const [linksResult, etherstubsResult, aggregatesResult, bridgesResult] = await Promise.all([
        makeWebHyveRequest(server.hostname, server.port, server.protocol, 'monitoring/network/interfaces', 'GET'),
        makeWebHyveRequest(server.hostname, server.port, server.protocol, 'network/etherstubs', 'GET'),
        makeWebHyveRequest(server.hostname, server.port, server.protocol, 'network/aggregates', 'GET'),
        makeWebHyveRequest(server.hostname, server.port, server.protocol, 'network/bridges', 'GET')
      ]);
      
      console.log('VNIC Link Loading Debug:', {
        linksResult: linksResult.success ? linksResult.data : linksResult,
        etherstubsResult: etherstubsResult.success ? etherstubsResult.data : etherstubsResult,
        aggregatesResult: aggregatesResult.success ? aggregatesResult.data : aggregatesResult,
        bridgesResult: bridgesResult.success ? bridgesResult.data : bridgesResult
      });
      
      const availableOptions = [];
      
      // Add ALL physical links from monitoring/network/interfaces
      if (linksResult.success && linksResult.data?.interfaces) {
        linksResult.data.interfaces.forEach(link => {
          // Include all physical interfaces
          if (link.class === 'phys' || link.link) {
            availableOptions.push({
              name: link.link,
              type: 'Physical',
              state: link.state || 'unknown',
              speed: link.speed || 'unknown'
            });
          }
        });
      }
      
      // Add etherstubs
      if (etherstubsResult.success && etherstubsResult.data?.etherstubs) {
        etherstubsResult.data.etherstubs.forEach(etherstub => {
          availableOptions.push({
            name: etherstub.name,
            type: 'Etherstub',
            state: 'up'
          });
        });
      }
      
      // Add aggregates
      if (aggregatesResult.success && aggregatesResult.data?.aggregates) {
        aggregatesResult.data.aggregates.forEach(aggregate => {
          availableOptions.push({
            name: aggregate.name,
            type: 'Aggregate',
            state: aggregate.state || 'unknown',
            policy: aggregate.policy
          });
        });
      }
      
      // Add bridges
      if (bridgesResult.success && bridgesResult.data?.bridges) {
        bridgesResult.data.bridges.forEach(bridge => {
          availableOptions.push({
            name: bridge.name,
            type: 'Bridge',
            state: bridge.state || 'unknown',
            protection: bridge.protection
          });
        });
      }
      
      // Deduplicate by name and filter out empty names
      const uniqueOptions = availableOptions
        .filter(option => option.name && option.name.trim())
        .filter((option, index, self) => 
          index === self.findIndex(o => o.name === option.name)
        );
      
      console.log('VNIC Available Links:', uniqueOptions);
      setAvailableLinks(uniqueOptions);
    } catch (err) {
      console.error('Error loading available links:', err);
    } finally {
      setLoadingLinks(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const addProperty = () => {
    if (propertyKey.trim() && propertyValue.trim()) {
      setFormData(prev => ({
        ...prev,
        properties: {
          ...prev.properties,
          [propertyKey.trim()]: propertyValue.trim()
        }
      }));
      setPropertyKey('');
      setPropertyValue('');
    }
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

  const validateForm = () => {
    if (!formData.name.trim()) {
      onError('VNIC name is required');
      return false;
    }
    
    if (!formData.link.trim()) {
      onError('Physical link is required');
      return false;
    }

    // Validate VNIC name format
    const nameRegex = /^[a-zA-Z][a-zA-Z0-9_]*$/;
    if (!nameRegex.test(formData.name)) {
      onError('VNIC name must start with a letter and contain only letters, numbers, and underscores');
      return false;
    }

    // Validate VLAN ID if provided
    if (formData.vlan_id) {
      const vlanId = parseInt(formData.vlan_id);
      if (isNaN(vlanId) || vlanId < 1 || vlanId > 4094) {
        onError('VLAN ID must be between 1 and 4094');
        return false;
      }
    }

    // Validate MAC address if provided
    if (formData.mac_address) {
      const macRegex = /^([0-9A-Fa-f]{2}:){5}[0-9A-Fa-f]{2}$/;
      if (!macRegex.test(formData.mac_address)) {
        onError('Invalid MAC address format (must be XX:XX:XX:XX:XX:XX)');
        return false;
      }
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
        link: formData.link.trim(),
        temporary: formData.temporary,
        created_by: 'api'
      };

      // Add optional fields
      if (formData.vlan_id) {
        requestData.vlan_id = parseInt(formData.vlan_id);
      }
      
      if (formData.mac_address) {
        requestData.mac_address = formData.mac_address.trim();
      }

      // Add properties
      if (Object.keys(formData.properties).length > 0) {
        requestData.properties = formData.properties;
      }
      
      const result = await makeWebHyveRequest(
        server.hostname,
        server.port,
        server.protocol,
        'network/vnics',
        'POST',
        requestData
      );
      
      if (result.success) {
        onSuccess();
      } else {
        onError(result.message || 'Failed to create VNIC');
      }
    } catch (err) {
      onError('Error creating VNIC: ' + err.message);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className='modal is-active'>
      <div className='modal-background' onClick={onClose}></div>
      <div className='modal-card' style={{ width: '60%', maxWidth: '800px' }}>
        <header className='modal-card-head'>
          <p className='modal-card-title'>
            <span className='icon mr-2'>
              <i className='fas fa-plus'></i>
            </span>
            Create VNIC
          </p>
          <button className='delete' onClick={onClose}></button>
        </header>
        
        <section className='modal-card-body'>
          <form onSubmit={handleSubmit}>
            <div className='columns'>
              <div className='column'>
                <div className='field'>
                  <label className='label'>VNIC Name *</label>
                  <div className='control'>
                    <input
                      className='input'
                      type='text'
                      placeholder='Auto-generated based on link'
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      disabled={creating}
                      required
                    />
                  </div>
                  <p className='help'>Auto-generated when you select a link. Must start with a letter.</p>
                </div>
              </div>
              <div className='column'>
                <div className='field'>
                  <label className='label'>Physical Link *</label>
                  <div className='control'>
                    <div className='select is-fullwidth'>
                      <select
                        value={formData.link}
                        onChange={(e) => handleInputChange('link', e.target.value)}
                        disabled={creating || loadingLinks}
                        required
                      >
                        <option value=''>
                          {loadingLinks ? 'Loading available links...' : 'Select a link to attach VNIC to'}
                        </option>
                        {availableLinks.map((link, index) => (
                          <option key={index} value={link.name}>
                            {link.name} ({link.type}, {link.state}, {link.speed})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className='columns'>
              <div className='column'>
                <div className='field'>
                  <label className='label'>VLAN ID (Optional)</label>
                  <div className='control'>
                    <input
                      className='input'
                      type='number'
                      min='1'
                      max='4094'
                      placeholder='e.g., 100'
                      value={formData.vlan_id}
                      onChange={(e) => handleInputChange('vlan_id', e.target.value)}
                      disabled={creating}
                    />
                  </div>
                  <p className='help'>1-4094 (leave empty for untagged)</p>
                </div>
              </div>
              <div className='column'>
                <div className='field'>
                  <label className='label'>MAC Address (Optional)</label>
                  <div className='control'>
                    <input
                      className='input'
                      type='text'
                      placeholder='XX:XX:XX:XX:XX:XX'
                      value={formData.mac_address}
                      onChange={(e) => handleInputChange('mac_address', e.target.value)}
                      disabled={creating}
                    />
                  </div>
                  <p className='help'>Leave empty to auto-generate</p>
                </div>
              </div>
            </div>

            <div className='field'>
              <label className='label'>Additional Properties</label>
              <div className='field has-addons'>
                <div className='control'>
                  <div className='select'>
                    <select
                      value={propertyKey}
                      onChange={(e) => setPropertyKey(e.target.value)}
                      disabled={creating}
                    >
                      <option value=''>Select property</option>
                      {commonProperties.filter(prop => !formData.properties[prop]).map((prop, index) => (
                        <option key={index} value={prop}>
                          {prop}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className='control is-expanded'>
                  {getPropertyValueInput()}
                </div>
                <div className='control'>
                  <button
                    type='button'
                    className='button is-info'
                    onClick={addProperty}
                    disabled={!propertyKey.trim() || !propertyValue.trim() || creating}
                  >
                    Add
                  </button>
                </div>
              </div>
              
              {Object.keys(formData.properties).length > 0 && (
                <div className='content mt-3'>
                  <p><strong>Current Properties:</strong></p>
                  <div className='tags'>
                    {Object.entries(formData.properties).map(([key, value], index) => (
                      <span key={index} className='tag is-info'>
                        {key}={value}
                        <button
                          type='button'
                          className='delete is-small'
                          onClick={() => removeProperty(key)}
                          disabled={creating}
                        ></button>
                      </span>
                    ))}
                  </div>
                </div>
              )}
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
            Create VNIC
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

export default VnicCreateModal;
