import React from 'react';

const PackageDetailsModal = ({ package: pkg, onClose }) => {
  const formatDetails = (details) => {
    if (!details) return [];
    
    // Handle the package info string format from the API
    if (typeof details === 'string') {
      const lines = details.split('\n').filter(line => line.trim());
      return lines.map(line => {
        const colonIndex = line.indexOf(':');
        if (colonIndex > 0) {
          const key = line.substring(0, colonIndex).trim();
          const value = line.substring(colonIndex + 1).trim();
          return {
            label: key,
            value: value
          };
        }
        return {
          label: 'Info',
          value: line.trim()
        };
      });
    }
    
    // Convert details object to array of key-value pairs for display
    return Object.entries(details).map(([key, value]) => ({
      label: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      value: typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)
    }));
  };

  const detailsArray = formatDetails(pkg.details);

  const getStatusInfo = () => {
    const status = [];
    
    if (pkg.installed) {
      status.push({ label: 'Installation Status', value: 'Installed' });
    } else {
      status.push({ label: 'Installation Status', value: 'Not Installed' });
    }
    
    if (pkg.frozen) {
      status.push({ label: 'Frozen', value: 'Yes' });
    }
    
    if (pkg.manually_installed) {
      status.push({ label: 'Manually Installed', value: 'Yes' });
    }
    
    if (pkg.obsolete) {
      status.push({ label: 'Obsolete', value: 'Yes' });
    }
    
    if (pkg.renamed) {
      status.push({ label: 'Renamed', value: 'Yes' });
    }
    
    return status;
  };

  const statusInfo = getStatusInfo();

  return (
    <div className='modal is-active'>
      <div className='modal-background' onClick={onClose}></div>
      <div className='modal-card modal-card-xl'>
        <header className='modal-card-head'>
          <p className='modal-card-title'>
            <span className='icon mr-2'>
              <i className='fas fa-cube'></i>
            </span>
            Package Details
          </p>
          <button className='delete' onClick={onClose}></button>
        </header>
        
        <section className='modal-card-body'>
          {/* Package Basic Info */}
          <div className='box mb-4'>
            <h3 className='title is-6'>Basic Information</h3>
            <div className='table-container'>
              <table className='table is-fullwidth'>
                <tbody>
                  <tr>
                    <td><strong>Package Name</strong></td>
                    <td className='is-family-monospace'>{pkg.name}</td>
                  </tr>
                  <tr>
                    <td><strong>Publisher</strong></td>
                    <td>
                      <span className='tag is-info is-small'>{pkg.publisher || 'Unknown'}</span>
                    </td>
                  </tr>
                  <tr>
                    <td><strong>Version</strong></td>
                    <td className='is-family-monospace'>{pkg.version || 'N/A'}</td>
                  </tr>
                  <tr>
                    <td><strong>Flags</strong></td>
                    <td className='is-family-monospace'>{pkg.flags || 'N/A'}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Package Status */}
          {statusInfo.length > 0 && (
            <div className='box mb-4'>
              <h3 className='title is-6'>Package Status</h3>
              <div className='table-container'>
                <table className='table is-fullwidth'>
                  <tbody>
                    {statusInfo.map((info, index) => (
                      <tr key={index}>
                        <td >
                          <strong>{info.label}</strong>
                        </td>
                        <td>{info.value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Detailed Information */}
          {detailsArray.length > 0 && (
            <div className='box'>
              <h3 className='title is-6'>Detailed Information</h3>
              <div className='table-container'>
                <table className='table is-fullwidth'>
                  <tbody>
                    {detailsArray.map((detail, index) => (
                      <tr key={index}>
                        <td>
                          <strong>{detail.label}</strong>
                        </td>
                        <td>
                          {detail.value.includes('\n') ? (
                            <pre className='is-size-7 has-background-grey-lightest p-2'>
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

          {/* Show message if no details available */}
          {detailsArray.length === 0 && (
            <div className='notification is-info'>
              <p>No detailed information available for this package.</p>
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

export default PackageDetailsModal;
