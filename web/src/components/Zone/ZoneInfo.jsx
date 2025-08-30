import React from 'react';

const ZoneInfo = ({ zoneDetails, monitoringHealth, getZoneStatus, selectedZone }) => {
  if (!zoneDetails || !zoneDetails.zone_info) {
    return null;
  }

  const { zone_info, configuration } = zoneDetails;

  return (
    <div className='box mb-0 pt-0 pd-0'>
      <h4 className='title is-6 mb-3'>
        <span className='icon-text'>
          <span className='icon'><i className='fas fa-info-circle'></i></span>
          <span>Zone Information</span>
        </span>
      </h4>
      <div className='table-container'>
        <table className='table is-fullwidth is-striped is-size-7'>
          <tbody>
            <tr>
              <td className="px-3 py-2"><strong>System Status</strong></td>
              <td className="px-3 py-2">
                <span className={`has-text-weight-semibold ${getZoneStatus(selectedZone) === 'running' ? 'has-text-success' : 'has-text-danger'}`}>
                  {getZoneStatus(selectedZone) === 'running' ? 'Running' : 'Stopped'}
                </span>
              </td>
            </tr>
            {Object.keys(monitoringHealth).length > 0 && (
              <tr>
                <td className="px-3 py-2"><strong>Host Health</strong></td>
                <td className="px-3 py-2">
                  <span className={`has-text-weight-semibold ${
                    monitoringHealth.status === 'healthy' ? 'has-text-success' : 
                    monitoringHealth.status === 'warning' ? 'has-text-warning' : 'has-text-danger'
                  }`}>
                    {monitoringHealth.status ? monitoringHealth.status.charAt(0).toUpperCase() + monitoringHealth.status.slice(1) : 'Unknown'}
                  </span>
                  {(monitoringHealth.networkErrors > 0 || monitoringHealth.storageErrors > 0) && (
                    <div className='tags mt-1'>
                      {monitoringHealth.networkErrors > 0 && (
                        <span className='tag is-warning is-small'>Net Errors: {monitoringHealth.networkErrors}</span>
                      )}
                      {monitoringHealth.storageErrors > 0 && (
                        <span className='tag is-warning is-small'>Storage Errors: {monitoringHealth.storageErrors}</span>
                      )}
                    </div>
                  )}
                </td>
              </tr>
            )}
            <tr>
              <td className="px-3 py-2"><strong>Last Seen</strong></td>
              <td className="px-3 py-2"><span className='has-text-grey'>{zone_info.last_seen ? new Date(zone_info.last_seen).toLocaleString() : 'N/A'}</span></td>
            </tr>
            {(zone_info.is_orphaned || zone_info.auto_discovered) && (
              <tr>
                <td className="px-3 py-2"><strong>Flags</strong></td>
                <td className="px-3 py-2">
                  <div className='tags'>
                    {zone_info.is_orphaned && (
                      <span className='tag is-warning'>Orphaned</span>
                    )}
                    {zone_info.auto_discovered && (
                      <span className='tag is-info'>Auto-discovered</span>
                    )}
                  </div>
                </td>
              </tr>
            )}
            {configuration && (
              <>
                <tr>
                  <td className="px-3 py-2"><strong>Zone Name</strong></td>
                  <td className="px-3 py-2"><code className='is-size-7'>{configuration.zonename}</code></td>
                </tr>
                <tr>
                  <td className="px-3 py-2"><strong>Zone Path</strong></td>
                  <td className="px-3 py-2"><code className='is-size-7'>{configuration.zonepath}</code></td>
                </tr>
                {configuration.bootargs && (
                  <tr>
                    <td className="px-3 py-2"><strong>Boot Args</strong></td>
                    <td className="px-3 py-2"><code className='is-size-7'>{configuration.bootargs || 'None'}</code></td>
                  </tr>
                )}
                {configuration.hostid && (
                  <tr>
                    <td className="px-3 py-2"><strong>Host ID</strong></td>
                    <td className="px-3 py-2"><span className='tag'>{configuration.hostid || 'None'}</span></td>
                  </tr>
                )}
                {configuration.pool && (
                  <tr>
                    <td className="px-3 py-2"><strong>Pool</strong></td>
                    <td className="px-3 py-2"><span className='tag'>{configuration.pool || 'None'}</span></td>
                  </tr>
                )}
                {configuration['scheduling-class'] && (
                  <tr>
                    <td className="px-3 py-2"><strong>Scheduling Class</strong></td>
                    <td className="px-3 py-2"><span className='tag'>{configuration['scheduling-class'] || 'None'}</span></td>
                  </tr>
                )}
                {configuration.limitpriv && (
                  <tr>
                    <td className="px-3 py-2"><strong>Limit Privileges</strong></td>
                    <td className="px-3 py-2"><span className='tag'>{configuration.limitpriv || 'None'}</span></td>
                  </tr>
                )}
                {configuration['fs-allowed'] && (
                  <tr>
                    <td className="px-3 py-2"><strong>FS Allowed</strong></td>
                    <td className="px-3 py-2"><span className='tag'>{configuration['fs-allowed'] || 'None'}</span></td>
                  </tr>
                )}
                <tr>
                  <td className="px-3 py-2"><strong>VNC Console</strong></td>
                  <td className="px-3 py-2">
                    <span className={`has-text-weight-semibold ${zoneDetails.active_vnc_session ? 'has-text-success' : 'has-text-danger'}`}>
                      {zoneDetails.active_vnc_session ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-3 py-2"><strong>VNC Port</strong></td>
                  <td className="px-3 py-2">
                    {zoneDetails.active_vnc_session && zoneDetails.vnc_session_info?.web_port ? (
                      <span className='has-text-grey is-family-monospace'>
                        {zoneDetails.vnc_session_info.web_port}
                      </span>
                    ) : (configuration?.vnc?.port || zoneDetails.zone_info?.vnc_port) ? (
                      <span className='has-text-grey is-family-monospace'>
                        {configuration.vnc?.port || zoneDetails.zone_info?.vnc_port}
                      </span>
                    ) : (
                      <span className='has-text-weight-semibold has-text-success'>
                        Auto
                      </span>
                    )}
                  </td>
                </tr>
                <tr>
                  <td className="px-3 py-2"><strong>zlogin</strong></td>
                  <td className="px-3 py-2">
                    <span className={`has-text-weight-semibold ${zoneDetails.zlogin_session ? 'has-text-success' : 'has-text-danger'}`}>
                      {zoneDetails.zlogin_session ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                </tr>
              </>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ZoneInfo;
