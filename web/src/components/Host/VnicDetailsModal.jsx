import React from 'react';

const VnicDetailsModal = ({ vnic, onClose }) => {
  const formatDetails = (details) => {
    if (!details) return [];
    
    // Convert details object to array of key-value pairs for display
    return Object.entries(details).map(([key, value]) => ({
      label: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      value: typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)
    }));
  };

  const formatMac = (mac) => {
    if (!mac) return 'N/A';
    // Format MAC address with colons if not already formatted
    if (mac.includes(':')) return mac;
    return mac.match(/.{2}/g)?.join(':') || mac;
  };

  const formatSpeed = (speed) => {
    if (!speed) return 'N/A';
    if (speed >= 1000) {
      return `${speed / 1000} Gbps`;
    }
    return `${speed} Mbps`;
  };

  const detailsArray = formatDetails(vnic.details);

  return (
    <div className='modal is-active'>
      <div className='modal-background' onClick={onClose}></div>
      <div className='modal-card modal-card-xl'>
        <header className='modal-card-head'>
          <p className='modal-card-title'>
            <span className='icon mr-2'>
              <i className='fas fa-network-wired'></i>
            </span>
            VNIC Details
          </p>
          <button className='delete' aria-label='close' onClick={onClose}></button>
        </header>
        
        <section className='modal-card-body'>
          {/* VNIC Basic Info */}
          <div className='box mb-4'>
            <h3 className='title is-6'>Basic Information</h3>
            <div className='table-container'>
              <table className='table is-fullwidth'>
                <tbody>
                  <tr>
                    <td><strong>VNIC Name</strong></td>
                    <td className='is-family-monospace'>{vnic.link}</td>
                  </tr>
                  <tr>
                    <td><strong>Physical Link</strong></td>
                    <td className='is-family-monospace'>{vnic.over || 'N/A'}</td>
                  </tr>
                  <tr>
                    <td><strong>State</strong></td>
                    <td>
                      <span className={`tag ${
                        vnic.state === 'up' ? 'is-success' :
                        vnic.state === 'down' ? 'is-danger' :
                        'is-grey'
                      }`}>
                        {vnic.state || 'Unknown'}
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td><strong>MAC Address</strong></td>
                    <td className='is-family-monospace'>{formatMac(vnic.macaddress)}</td>
                  </tr>
                  <tr>
                    <td><strong>MAC Address Type</strong></td>
                    <td>{vnic.macaddrtype || 'N/A'}</td>
                  </tr>
                  <tr>
                    <td><strong>VLAN ID</strong></td>
                    <td>
                      <span className='tag'>
                        {vnic.vid !== undefined ? vnic.vid : 'N/A'}
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td><strong>Zone Assignment</strong></td>
                    <td className='is-family-monospace'>{vnic.zone && vnic.zone !== '--' ? vnic.zone : 'Global Zone'}</td>
                  </tr>
                  <tr>
                    <td><strong>Speed</strong></td>
                    <td>{formatSpeed(vnic.speed)}</td>
                  </tr>
                  <tr>
                    <td><strong>MTU</strong></td>
                    <td>{vnic.mtu || 'N/A'}</td>
                  </tr>
                  <tr>
                    <td><strong>Media Type</strong></td>
                    <td>{vnic.media || 'N/A'}</td>
                  </tr>
                  <tr>
                    <td><strong>Duplex</strong></td>
                    <td>{vnic.duplex || 'N/A'}</td>
                  </tr>
                  {vnic.device && (
                    <tr>
                      <td><strong>Device</strong></td>
                      <td className='is-family-monospace'>{vnic.device}</td>
                    </tr>
                  )}
                  {vnic.bridge && vnic.bridge !== '--' && (
                    <tr>
                      <td><strong>Bridge</strong></td>
                      <td className='is-family-monospace'>{vnic.bridge}</td>
                    </tr>
                  )}
                  {vnic.pause && (
                    <tr>
                      <td><strong>Pause</strong></td>
                      <td>{vnic.pause}</td>
                    </tr>
                  )}
                  {vnic.auto && (
                    <tr>
                      <td><strong>Auto Negotiation</strong></td>
                      <td>{vnic.auto}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Detailed Information */}
          {detailsArray.length > 0 && (
            <div className='box'>
              <h3 className='title is-6'>Additional Details</h3>
              <div className='table-container'>
                <table className='table is-fullwidth is-striped'>
                  <thead>
                    <tr>
                      <th>Property</th>
                      <th>Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detailsArray.map((detail, index) => (
                      <tr key={index}>
                        <td>
                          <strong>{detail.label}</strong>
                        </td>
                        <td>
                          {detail.value.includes('\n') ? (
                            <pre className='is-size-7 has-background-dark has-text-light p-2'>
                              {detail.value}
                            </pre>
                          ) : (
                            <span className='is-family-monospace is-size-7'>{detail.value}</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Show message if no additional details available */}
          {detailsArray.length === 0 && (
            <div className='notification is-info'>
              <p>No additional detailed information available for this VNIC.</p>
            </div>
          )}

          {/* Timestamps */}
          {(vnic.created_at || vnic.updated_at) && (
            <div className='box'>
              <h3 className='title is-6'>Timestamps</h3>
              <div className='table-container'>
                <table className='table is-fullwidth'>
                  <tbody>
                    {vnic.created_at && (
                      <tr>
                        <td><strong>Created</strong></td>
                        <td>{new Date(vnic.created_at).toLocaleString()}</td>
                      </tr>
                    )}
                    {vnic.updated_at && (
                      <tr>
                        <td><strong>Last Updated</strong></td>
                        <td>{new Date(vnic.updated_at).toLocaleString()}</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>
        
      </div>
    </div>
  );
};

export default VnicDetailsModal;
