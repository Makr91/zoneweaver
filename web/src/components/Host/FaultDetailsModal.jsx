import { ContentModal } from '../common';

const FaultDetailsModal = ({ fault, onClose }) => {
  const formatDetails = (details) => {
    if (!details) return [];
    
    // Exclude basic information that's already shown in Basic Information section
    const excludeFields = ['time', 'uuid', 'msgId', 'msgid', 'severity', 'format'];
    
    // Convert details object to array of key-value pairs for display
    return Object.entries(details)
      .filter(([key]) => !excludeFields.includes(key.toLowerCase()))
      .map(([key, value]) => ({
        label: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        value: typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)
      }));
  };

  const getSeverityColor = (severity) => {
    switch (severity?.toLowerCase()) {
      case 'critical':
        return 'is-danger';
      case 'major':
        return 'is-warning';
      case 'minor':
        return 'is-info';
      default:
        return 'is-light';
    }
  };

  const detailsArray = formatDetails(fault.details);

  return (
    <ContentModal
      isOpen={true}
      onClose={onClose}
      title="Fault Details"
      icon="fas fa-exclamation-triangle"
    >
      {/* Complete Fault Information */}
      <div className='box mb-4'>
        <h3 className='title is-6'>Fault Information</h3>
        <div className='table-container'>
          <table className='table is-fullwidth'>
            <tbody>
              <tr>
                <td><strong>UUID</strong></td>
                <td className='is-family-monospace'>{fault.uuid}</td>
              </tr>
              <tr>
                <td><strong>Message ID</strong></td>
                <td>
                  <span className='is-family-monospace has-text-weight-semibold'>
                    {fault.msgId}
                  </span>
                </td>
              </tr>
              <tr>
                <td><strong>Severity</strong></td>
                <td>
                  <span className={`tag ${getSeverityColor(fault.severity)}`}>
                    {fault.severity}
                  </span>
                </td>
              </tr>
              <tr>
                <td><strong>Time</strong></td>
                <td>{fault.time || 'N/A'}</td>
              </tr>
              {fault.details?.host && (
                <tr>
                  <td><strong>Host</strong></td>
                  <td className='is-family-monospace'>{fault.details.host}</td>
                </tr>
              )}
              {fault.details?.platform && (
                <tr>
                  <td><strong>Platform</strong></td>
                  <td className='is-family-monospace'>{fault.details.platform}</td>
                </tr>
              )}
              {fault.details?.faultClass && (
                <tr>
                  <td><strong>Fault Class</strong></td>
                  <td className='is-family-monospace'>{fault.details.faultClass}</td>
                </tr>
              )}
              {fault.details?.affects && (
                <tr>
                  <td><strong>Affects</strong></td>
                  <td className='is-family-monospace'>{fault.details.affects}</td>
                </tr>
              )}
              {fault.details?.problemIn && (
                <tr>
                  <td><strong>Problem In</strong></td>
                  <td className='is-family-monospace'>{fault.details.problemIn}</td>
                </tr>
              )}
              {fault.details?.description && (
                <tr>
                  <td><strong>Description</strong></td>
                  <td>{fault.details.description}</td>
                </tr>
              )}
              {fault.details?.response && (
                <tr>
                  <td><strong>Response</strong></td>
                  <td className='is-size-7 has-text-grey'>{fault.details.response}</td>
                </tr>
              )}
              {fault.details?.impact && (
                <tr>
                  <td><strong>Impact</strong></td>
                  <td>
                    <span className='has-text-weight-semibold has-text-danger'>
                      {fault.details.impact}
                    </span>
                  </td>
                </tr>
              )}
              {fault.details?.action && (
                <tr>
                  <td><strong>Recommended Action</strong></td>
                  <td>
                    <div className='content'>
                      <div className='notification is-info is-small'>
                        {fault.details.action}
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Raw Output Display */}
      {fault.raw_output && (
        <div className='box mb-4'>
          <h3 className='title is-6'>Detailed Output</h3>
          <div className='content'>
            <pre className='box has-background-black has-text-light p-4 is-size-7' style={{ maxHeight: '400px', overflow: 'auto' }}>
              {fault.raw_output}
            </pre>
          </div>
        </div>
      )}

      {/* Show message if no details available */}
      {!fault.details && (
        <div className='notification is-info'>
          <p>No detailed information available for this fault.</p>
        </div>
      )}
    </ContentModal>
  );
};

export default FaultDetailsModal;
