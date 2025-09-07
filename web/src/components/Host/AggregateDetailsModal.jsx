import { ContentModal } from '../common';

const AggregateDetailsModal = ({ aggregate, aggregateDetails, onClose }) => {
  const formatValue = (value) => {
    if (value === null || value === undefined) return 'N/A';
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if (typeof value === 'object') return JSON.stringify(value, null, 2);
    return String(value);
  };

  const getStateTag = (state) => {
    switch (state?.toLowerCase()) {
      case 'up':
        return <span className='tag is-success is-small'>{state}</span>;
      case 'down':
        return <span className='tag is-danger is-small'>{state}</span>;
      default:
        return <span className='tag is-grey is-small'>{state || 'Unknown'}</span>;
    }
  };

  const getPolicyTag = (policy) => {
    const policyColors = {
      'L2': 'is-info',
      'L3': 'is-primary',
      'L4': 'is-link',
      'L2L3': 'is-success',
      'L2L4': 'is-warning',
      'L3L4': 'is-danger',
      'L2L3L4': 'is-dark'
    };
    
    const colorClass = policyColors[policy] || '';
    return <span className={`tag ${colorClass} is-small`}>{policy || 'Unknown'}</span>;
  };

  const getLacpModeTag = (mode) => {
    switch (mode?.toLowerCase()) {
      case 'active':
        return <span className='tag is-success is-small'>{mode}</span>;
      case 'passive':
        return <span className='tag is-info is-small'>{mode}</span>;
      case 'off':
        return <span className='tag is-grey is-small'>{mode}</span>;
      default:
        return <span className='tag is-grey is-small'>{mode || 'N/A'}</span>;
    }
  };

  const formatLinks = (linksData) => {
    let links;
    if (Array.isArray(linksData)) {
      links = linksData;
    } else if (typeof linksData === 'string' && linksData) {
      links = linksData.split(',').map(link => link.trim());
    } else {
      return [];
    }
    return links;
  };

  const aggregateName = aggregate.name || aggregate.link;
  const memberLinks = formatLinks(aggregate.links || aggregate.over);

  return (
    <ContentModal
      isOpen={true}
      onClose={onClose}
      title="Aggregate Details"
      icon="fas fa-network-wired"
    >
            <h5 className='title is-6'>Basic Information</h5>
            <div className='table-container'>
              <table className='table is-fullwidth is-striped'>
                <tbody>
                  <tr>
                    <td><strong>Name</strong></td>
                    <td>
                      <span className='is-family-monospace'>{aggregateName}</span>
                    </td>
                  </tr>
                  <tr>
                    <td><strong>Class</strong></td>
                    <td>
                      <span className='tag is-info is-small'>
                        {aggregate.class || 'aggr'}
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td><strong>State</strong></td>
                    <td>{getStateTag(aggregate.state)}</td>
                  </tr>
                  <tr>
                    <td><strong>Policy</strong></td>
                    <td>{getPolicyTag(aggregate.policy)}</td>
                  </tr>
                  <tr>
                    <td><strong>LACP Mode</strong></td>
                    <td>{getLacpModeTag(aggregate.lacp_mode)}</td>
                  </tr>
                  <tr>
                    <td><strong>LACP Timer</strong></td>
                    <td>{formatValue(aggregate.lacp_timer)}</td>
                  </tr>
                  <tr>
                    <td><strong>MTU</strong></td>
                    <td>{formatValue(aggregate.mtu)}</td>
                  </tr>
                  <tr>
                    <td><strong>Speed</strong></td>
                    <td>{formatValue(aggregate.speed)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {memberLinks.length > 0 && (
              <>
                <h5 className='title is-6 mt-5'>Member Links</h5>
                <div className='table-container'>
                  <table className='table is-fullwidth is-striped'>
                    <thead>
                      <tr>
                        <th>Link Name</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {memberLinks.map((link, index) => (
                        <tr key={index}>
                          <td>
                            <span className='is-family-monospace'>{link}</span>
                          </td>
                          <td>
                            <span className='tag is-success is-small'>Active</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {aggregateDetails && aggregateDetails.lacp && (
              <>
                <h5 className='title is-6 mt-5'>LACP Details</h5>
                <div className='table-container'>
                  <table className='table is-fullwidth is-striped'>
                    <tbody>
                      <tr>
                        <td><strong>LACP Activity</strong></td>
                        <td>{formatValue(aggregateDetails.lacp.activity)}</td>
                      </tr>
                      <tr>
                        <td><strong>LACP Timeout</strong></td>
                        <td>{formatValue(aggregateDetails.lacp.timeout)}</td>
                      </tr>
                      <tr>
                        <td><strong>LACP Aggregation</strong></td>
                        <td>{formatValue(aggregateDetails.lacp.aggregation)}</td>
                      </tr>
                      <tr>
                        <td><strong>LACP Synchronization</strong></td>
                        <td>{formatValue(aggregateDetails.lacp.synchronization)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </>
            )}

            <h5 className='title is-6 mt-5'>Technical Details</h5>
            <div className='table-container'>
              <table className='table is-fullwidth is-striped'>
                <tbody>
                  <tr>
                    <td><strong>MAC Address</strong></td>
                    <td>
                      <span className='is-family-monospace'>
                        {formatValue(aggregate.macaddress)}
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td><strong>MAC Address Type</strong></td>
                    <td>{formatValue(aggregate.macaddrtype)}</td>
                  </tr>
                  <tr>
                    <td><strong>VLAN ID</strong></td>
                    <td>{formatValue(aggregate.vid)}</td>
                  </tr>
                  <tr>
                    <td><strong>Zone</strong></td>
                    <td>{formatValue(aggregate.zone)}</td>
                  </tr>
                  <tr>
                    <td><strong>Media</strong></td>
                    <td>{formatValue(aggregate.media)}</td>
                  </tr>
                  <tr>
                    <td><strong>Duplex</strong></td>
                    <td>{formatValue(aggregate.duplex)}</td>
                  </tr>
                  <tr>
                    <td><strong>Device</strong></td>
                    <td>{formatValue(aggregate.device)}</td>
                  </tr>
                  <tr>
                    <td><strong>Bridge</strong></td>
                    <td>{formatValue(aggregate.bridge)}</td>
                  </tr>
                  <tr>
                    <td><strong>Pause</strong></td>
                    <td>{formatValue(aggregate.pause)}</td>
                  </tr>
                  <tr>
                    <td><strong>Auto</strong></td>
                    <td>{formatValue(aggregate.auto)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h5 className='title is-6 mt-5'>Timestamps</h5>
            <div className='table-container'>
              <table className='table is-fullwidth is-striped'>
                <tbody>
                  <tr>
                    <td><strong>Last Scan</strong></td>
                    <td>
                      <span className='is-family-monospace'>
                        {aggregate.scan_timestamp ? new Date(aggregate.scan_timestamp).toLocaleString() : 'N/A'}
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td><strong>Created</strong></td>
                    <td>
                      <span className='is-family-monospace'>
                        {aggregate.createdAt ? new Date(aggregate.createdAt).toLocaleString() : 'N/A'}
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td><strong>Updated</strong></td>
                    <td>
                      <span className='is-family-monospace'>
                        {aggregate.updatedAt ? new Date(aggregate.updatedAt).toLocaleString() : 'N/A'}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
    </ContentModal>
  );
};

export default AggregateDetailsModal;
