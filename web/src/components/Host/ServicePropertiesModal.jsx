import React from 'react';

const ServicePropertiesModal = ({ service, onClose }) => {
  const formatProperties = (properties) => {
    if (!properties) return [];
    
    // Convert properties object to array of key-value pairs for display
    return Object.entries(properties).map(([key, value]) => ({
      property: key,
      value: typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)
    }));
  };

  const propertiesArray = formatProperties(service.properties);

  const renderPropertyValue = (value) => {
    // Handle different types of property values
    if (value.includes('\n') || value.length > 100) {
      return (
        <pre className='is-size-7 has-background-dark has-text-light p-2' style={{ maxHeight: '150px', overflow: 'auto' }}>
          {value}
        </pre>
      );
    } else if (value.startsWith('http://') || value.startsWith('https://')) {
      return (
        <a href={value} target='_blank' rel='noopener noreferrer' className='is-size-7'>
          {value}
        </a>
      );
    } else {
      return <span className='is-family-monospace is-size-7'>{value}</span>;
    }
  };

  return (
    <div className='modal is-active'>
      <div className='modal-background' onClick={onClose}></div>
      <div className='modal-card modal-card-xl'>
        <header className='modal-card-head'>
          <p className='modal-card-title'>
            <span className='icon mr-2'>
              <i className='fas fa-list'></i>
            </span>
            Service Properties
          </p>
          <button className='delete' onClick={onClose}></button>
        </header>
        
        <section className='modal-card-body'>
          {/* Service Basic Info */}
          <div className='box mb-4'>
            <h3 className='title is-6'>Service Information</h3>
            <div className='table-container'>
              <table className='table is-fullwidth'>
                <tbody>
                  <tr>
                    <td><strong>FMRI</strong></td>
                    <td className='is-family-monospace'>{service.fmri}</td>
                  </tr>
                  <tr>
                    <td><strong>Current State</strong></td>
                    <td>
                      <span className={`tag ${
                        service.state === 'online' ? 'is-success' :
                        service.state === 'disabled' ? 'is-grey' :
                        service.state === 'offline' ? 'is-danger' :
                        service.state === 'legacy_run' ? 'is-info' :
                        'is-light'
                      }`}>
                        {service.state}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Properties */}
          {propertiesArray.length > 0 && (
            <div className='box'>
              <h3 className='title is-6'>Configuration Properties</h3>
              <div className='field mb-3'>
                <p className='help'>
                  These are the service configuration properties as returned by <code>svccfg listprop</code>.
                </p>
              </div>
              <div className='table-container'>
                <table className='table is-fullwidth is-striped'>
                  <thead>
                    <tr>
                      <th style={{ width: '30%' }}>Property</th>
                      <th>Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {propertiesArray.map((prop, index) => (
                      <tr key={index}>
                        <td>
                          <code className='is-size-7'>{prop.property}</code>
                        </td>
                        <td>
                          {renderPropertyValue(prop.value)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Show message if no properties available */}
          {propertiesArray.length === 0 && (
            <div className='notification is-info'>
              <p>No configuration properties available for this service.</p>
            </div>
          )}
        </section>
        
        <footer className='modal-card-foot'>
          <button className='button' onClick={onClose}>Close</button>
        </footer>
      </div>
    </div>
  );
};

export default ServicePropertiesModal;
