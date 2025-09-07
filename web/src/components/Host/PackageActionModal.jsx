import React, { useState } from 'react';

const PackageActionModal = ({ package: pkg, action, onClose, onConfirm }) => {
  const [options, setOptions] = useState({
    dryRun: false,
    acceptLicenses: false,
    beName: ''
  });
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    try {
      const result = await onConfirm(pkg.name, action, options);
      if (result.success) {
        onClose();
      }
    } catch (error) {
      console.error(`Error during ${action}:`, error);
    } finally {
      setLoading(false);
    }
  };

  const handleOptionChange = (field, value) => {
    setOptions(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const getActionDetails = () => {
    switch (action) {
      case 'install':
        return {
          title: 'Install Package',
          icon: 'fa-download',
          buttonClass: 'has-background-success-dark has-text-success-light',
          description: `Install package "${pkg.name}" on the system.`,
          warning: 'This will install the package and any required dependencies.'
        };
      case 'uninstall':
        return {
          title: 'Uninstall Package',
          icon: 'fa-trash',
          buttonClass: 'has-background-danger-dark has-text-danger-light',
          description: `Uninstall package "${pkg.name}" from the system.`,
          warning: 'This will remove the package and may affect dependent packages.'
        };
      default:
        return {
          title: 'Package Action',
          icon: 'fa-cube',
          buttonClass: 'is-info',
          description: `Perform ${action} on package "${pkg.name}".`,
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
          {/* Package Information */}
          <div className='box mb-4'>
            <h3 className='title is-6'>Package Information</h3>
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
                    <td className='is-family-monospace'>{pkg.version || 'Latest'}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Action Description */}
          <div className='notification is-info'>
            <p><strong>Action:</strong> {actionDetails.description}</p>
            <p className='mt-2'>{actionDetails.warning}</p>
          </div>

          {/* Options */}
          <div className='box'>
            <h3 className='title is-6'>Options</h3>
            
            {/* Dry Run Option */}
            <div className='field'>
              <div className='control'>
                <label className='checkbox'>
                  <input 
                    type='checkbox'
                    checked={options.dryRun}
                    onChange={(e) => handleOptionChange('dryRun', e.target.checked)}
                  />
                  <span className='ml-2'>
                    <strong>Dry Run</strong> - Show what would be done without actually performing the action
                  </span>
                </label>
              </div>
            </div>

            {/* Accept Licenses Option (for install only) */}
            {action === 'install' && (
              <div className='field'>
                <div className='control'>
                  <label className='checkbox'>
                    <input 
                      type='checkbox'
                      checked={options.acceptLicenses}
                      onChange={(e) => handleOptionChange('acceptLicenses', e.target.checked)}
                    />
                    <span className='ml-2'>
                      <strong>Accept Licenses</strong> - Automatically accept any required package licenses
                    </span>
                  </label>
                </div>
              </div>
            )}

            {/* Boot Environment Name */}
            <div className='field'>
              <label className='label'>Boot Environment Name (Optional)</label>
              <div className='control'>
                <input 
                  className='input'
                  type='text'
                  placeholder='Leave empty to use default'
                  value={options.beName}
                  onChange={(e) => handleOptionChange('beName', e.target.value)}
                />
              </div>
              <p className='help'>
                Specify a boot environment name to create a backup before the operation.
              </p>
            </div>
          </div>
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

export default PackageActionModal;
