import React from 'react';

const ZoneManager = ({ serverStats, currentServer, handleZoneAction }) => {
  return (
    <div className='box mb-5'>
      <div className='level is-mobile mb-4'>
        <div className='level-left'>
          <div className='level-item'>
            <h3 className='title is-5 mb-0'>
              <span className='icon-text'>
                <span className='icon'><i className='fas fa-server'></i></span>
                <span>Zone Management</span>
              </span>
            </h3>
          </div>
        </div>
        <div className='level-right'>
          <div className='level-item'>
            <div className='field is-grouped'>
              <div className='control'>
                <div className='tags has-addons'>
                  <span className='tag'>Total</span>
                  <span className='tag is-info'>{serverStats.allzones?.length || 0}</span>
                </div>
              </div>
              <div className='control'>
                <div className='tags has-addons'>
                  <span className='tag'>Running</span>
                  <span className='tag is-success'>{serverStats.runningzones?.length || 0}</span>
                </div>
              </div>
              <div className='control'>
                <div className='tags has-addons'>
                  <span className='tag'>Stopped</span>
                  <span className='tag is-warning'>{(serverStats.allzones?.length || 0) - (serverStats.runningzones?.length || 0)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className='columns'>
        <div className='column is-half'>
          <h4 className='subtitle is-6 mb-3'>Zones on {currentServer.hostname}</h4>
          <div className='content'>
            {serverStats.allzones && serverStats.allzones.length > 0 ? (
              <>
                <div className='tags'>
                  {serverStats.allzones.slice(0, 12).map((zone, index) => (
                    <span key={index} className={`tag ${serverStats.runningzones?.includes(zone) ? 'is-success' : 'is-light'}`}>
                      <span className='icon is-small'>
                        <i className={`fas ${serverStats.runningzones?.includes(zone) ? 'fa-circle' : 'fa-circle'}`}></i>
                      </span>
                      <span>{zone}</span>
                    </span>
                  ))}
                </div>
                {serverStats.allzones.length > 12 && (
                  <p className='has-text-grey is-size-7 mt-2'>
                    Showing 12 of {serverStats.allzones.length} zones. 
                    <a href='/ui/zones' className='has-text-link ml-1'>View all →</a>
                  </p>
                )}
              </>
            ) : (
              <p className='has-text-grey'>No zones configured on this host</p>
            )}
          </div>
        </div>
        <div className='column is-half'>
          <h4 className='subtitle is-6 mb-3'>Quick Actions</h4>
          <div className='content'>
            <div className='field is-grouped is-grouped-multiline'>
              <div className='control'>
                <a href='/ui/zones' className='button is-primary'>
                  <span className='icon is-small'>
                    <i className='fas fa-eye'></i>
                  </span>
                  <span>View All Zones</span>
                </a>
              </div>
              <div className='control'>
                <a href='/ui/zone-register' className='button is-success'>
                  <span className='icon is-small'>
                    <i className='fas fa-plus'></i>
                  </span>
                  <span>Create Zone</span>
                </a>
              </div>
              {((serverStats.allzones?.length || 0) - (serverStats.runningzones?.length || 0)) > 0 && (
                <div className='control'>
                  <button 
                    className='button is-success'
                    onClick={() => handleZoneAction('startAll')}
                  >
                    <span className='icon is-small'>
                      <i className='fas fa-play'></i>
                    </span>
                    <span>Start All</span>
                  </button>
                </div>
              )}
              {(serverStats.runningzones?.length || 0) > 0 && (
                <div className='control'>
                  <button 
                    className='button is-warning'
                    onClick={() => handleZoneAction('stopAll')}
                  >
                    <span className='icon is-small'>
                      <i className='fas fa-pause'></i>
                    </span>
                    <span>Stop All</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ZoneManager;
