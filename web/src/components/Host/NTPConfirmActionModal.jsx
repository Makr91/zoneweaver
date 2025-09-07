import React, { useState } from 'react';

const NTPConfirmActionModal = ({ service, action, onClose, onConfirm }) => {
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    try {
      const result = await onConfirm();
      if (result && result.success) {
        onClose();
      }
    } catch (error) {
      console.error(`Error during ${action}:`, error);
    } finally {
      setLoading(false);
    }
  };

  const getActionDetails = () => {
    switch (action) {
      case 'sync':
        return {
          title: 'Force Time Synchronization',
          icon: 'fa-sync-alt',
          buttonClass: 'has-background-primary-dark has-text-primary-light',
          description: 'Force immediate time synchronization with configured NTP servers.',
          warning: 'This will attempt to synchronize the system clock immediately. The operation may take a few moments to complete.'
        };
      case 'restart':
        return {
          title: 'Restart Time Synchronization Service',
          icon: 'fa-redo',
          buttonClass: 'has-background-warning-dark has-text-warning-light',
          description: 'Restart the time synchronization service to apply configuration changes.',
          warning: 'The service will be briefly unavailable during restart. Time synchronization will resume automatically.'
        };
      case 'save':
        return {
          title: 'Save NTP Configuration',
          icon: 'fa-save',
          buttonClass: 'has-background-success-dark has-text-success-light',
          description: 'Save the current configuration to the NTP configuration file.',
          warning: 'This will overwrite the existing configuration. A restart of the time synchronization service may be required to apply changes.'
        };
      case 'timezone':
        return {
          title: 'Change System Timezone',
          icon: 'fa-clock',
          buttonClass: 'has-background-info-dark has-text-info-light',
          description: `Change the system timezone to "${service?.timezone}".`,
          warning: 'Timezone changes may require a system reboot for full effect. Some services may continue using the old timezone until restarted.'
        };
      case 'switch-ntp':
        return {
          title: 'Switch to Traditional NTP',
          icon: 'fa-clock',
          buttonClass: 'has-background-info-dark has-text-info-light',
          description: 'Switch to traditional Network Time Protocol (NTP) for time synchronization.',
          warning: 'This operation will disable the current service, install NTP if needed, preserve server configurations where possible, and enable NTP service.'
        };
      case 'switch-chrony':
        return {
          title: 'Switch to Chrony',
          icon: 'fa-stopwatch',
          buttonClass: 'has-background-info-dark has-text-info-light',
          description: 'Switch to modern Chrony daemon for enhanced time synchronization.',
          warning: 'This operation will disable the current service, install Chrony if needed, preserve server configurations where possible, and enable Chrony service.'
        };
      case 'switch-ntpsec':
        return {
          title: 'Switch to NTPsec',
          icon: 'fa-shield-alt',
          buttonClass: 'has-background-info-dark has-text-info-light',
          description: 'Switch to security-focused NTPsec implementation for enhanced security.',
          warning: 'This operation will disable the current service, install NTPsec if needed, preserve server configurations where possible, and enable NTPsec service.'
        };
      default:
        return {
          title: 'Confirm Action',
          icon: 'fa-question-circle',
          buttonClass: 'is-info',
          description: `Perform ${action} action.`,
          warning: 'Please confirm this action.'
        };
    }
  };

  const actionDetails = getActionDetails();

  return (
    <div className='modal is-active'>
      <div className='modal-background' onClick={onClose}></div>
      <div className='modal-card'>
        <header className='modal-card-head'>
          <p className='modal-card-title'>
            <span className='icon mr-2'>
              <i className={`fas ${actionDetails.icon}`}></i>
            </span>
            {actionDetails.title}
          </p>
          <button className='delete' aria-label='close' onClick={onClose}></button>
        </header>
        
        <section className='modal-card-body'>
          {/* Service Information */}
          {service && (
            <div className='box mb-4'>
              <h3 className='title is-6'>
                {action === 'timezone' ? 'Timezone Information' : 'Service Information'}
              </h3>
              <div className='table-container'>
                <table className='table is-fullwidth'>
                  <tbody>
                    {action === 'timezone' ? (
                      <>
                        <tr>
                          <td><strong>Current Timezone</strong></td>
                          <td className='is-family-monospace'>{service.current || 'Unknown'}</td>
                        </tr>
                        <tr>
                          <td><strong>New Timezone</strong></td>
                          <td className='is-family-monospace'>{service.timezone || 'Unknown'}</td>
                        </tr>
                      </>
                    ) : (
                      <>
                        {service.service && (
                          <tr>
                            <td><strong>Service Type</strong></td>
                            <td className='is-family-monospace'>
                              {service.service === 'ntp' ? 'NTP' : 
                               service.service === 'chrony' ? 'Chrony' : 
                               service.service.toUpperCase()}
                            </td>
                          </tr>
                        )}
                        {service.status && (
                          <tr>
                            <td><strong>Service Status</strong></td>
                            <td>
                              <span className={`tag ${
                                service.status === 'available' ? 'is-success' : 
                                service.status === 'disabled' ? 'is-warning' : 'is-danger'
                              }`}>
                                {service.status.charAt(0).toUpperCase() + service.status.slice(1)}
                              </span>
                            </td>
                          </tr>
                        )}
                        {service.config_file && (
                          <tr>
                            <td><strong>Configuration File</strong></td>
                            <td className='is-family-monospace'>{service.config_file}</td>
                          </tr>
                        )}
                        {service.timezone && action !== 'timezone' && (
                          <tr>
                            <td><strong>Current Timezone</strong></td>
                            <td className='is-family-monospace'>{service.timezone}</td>
                          </tr>
                        )}
                      </>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Action Description */}
          <div className={`notification ${action === 'timezone' || action === 'restart' ? 'is-warning' : 'is-info'}`}>
            <p><strong>Action:</strong> {actionDetails.description}</p>
            <p className='mt-2'>{actionDetails.warning}</p>
          </div>

          {/* Action-specific Information */}
          {action === 'sync' && service?.peers && service.peers.length > 0 && (
            <div className='box'>
              <h3 className='title is-6'>Available Time Servers</h3>
              <div className='content is-small'>
                <ul>
                  {service.peers.slice(0, 5).map((peer, index) => (
                    <li key={index} className='is-family-monospace'>
                      {peer.remote} 
                      {peer.indicator === '*' && <span className='tag is-success is-small ml-1'>Primary</span>}
                      {peer.indicator === '+' && <span className='tag is-info is-small ml-1'>Backup</span>}
                    </li>
                  ))}
                  {service.peers.length > 5 && (
                    <li className='has-text-grey'>...and {service.peers.length - 5} more servers</li>
                  )}
                </ul>
              </div>
            </div>
          )}

          {action === 'save' && service?.config_exists === false && (
            <div className='box'>
              <h3 className='title is-6'>Configuration File Creation</h3>
              <div className='notification is-info is-light'>
                <p>
                  <strong>New Configuration File:</strong> The configuration file does not exist and will be created.
                </p>
              </div>
            </div>
          )}

          {action === 'timezone' && (
            <div className='box'>
              <h3 className='title is-6'>Reboot Recommendation</h3>
              <div className='notification is-warning is-light'>
                <p>
                  <strong>System Reboot Recommended:</strong> For the timezone change to take full effect across all system services,
                  a system reboot is recommended after this change.
                </p>
              </div>
            </div>
          )}

          {action === 'restart' && (
            <div className='box'>
              <h3 className='title is-6'>Service Restart Information</h3>
              <div className='notification is-info is-light'>
                <p>
                  The time synchronization service will be stopped and restarted. 
                  This is required to apply configuration changes and may take a few seconds to complete.
                </p>
              </div>
            </div>
          )}
        </section>
        
        <footer className='modal-card-foot'>
          <button 
            className={`button ${actionDetails.buttonClass} ${loading ? 'is-loading' : ''}`}
            onClick={handleConfirm}
            disabled={loading}
          >
            <span className='icon'>
              <i className={`fas ${actionDetails.icon}`}></i>
            </span>
            <span>{loading ? 'Processing...' : actionDetails.title}</span>
          </button>
        </footer>
      </div>
    </div>
  );
};

export default NTPConfirmActionModal;
