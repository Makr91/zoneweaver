import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useServers } from "../contexts/ServerContext";
import { 
  canControlZones, 
  canAccessZoneConsole, 
  canStartStopZones, 
  canRestartZones, 
  canDestroyZones,
  canControlHosts,
  canPowerOffHosts
} from "../utils/permissions";

const Navbar = () => {
  const [isModal, setModalState] = useState(true);

  const handleModalClick = () => {
    setModalState(!isModal);
  };

  const [zones, setZones] = useState(null);
  const [currentMode, setCurrentMode] = useState("");
  const [currentAction, setCurrentAction] = useState("");
  const [loading, setLoading] = useState(false);
  const [vncLoading, setVncLoading] = useState(false);

  // Enhanced zone status mapping for all possible states
  const getZoneStatus = (zoneName) => {
    if (!zones || !zones.data) return 'unknown';
    
    // Check if we have detailed zone information
    if (zones.data.zoneDetails && zones.data.zoneDetails[zoneName]) {
      return zones.data.zoneDetails[zoneName].state || zones.data.zoneDetails[zoneName].status;
    }
    
    // Fallback to basic running/stopped logic
    const runningZones = zones.data.runningzones || [];
    const allZones = zones.data.allzones || [];
    
    if (runningZones.includes(zoneName)) {
      return 'running';
    } else if (allZones.includes(zoneName)) {
      return 'installed'; // Assume installed if in allzones but not running
    }
    
    return 'unknown';
  };

  // Enhanced status dot color mapping for all zone states
  const getStatusDotColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'running':
        return 'has-text-success';     // Green - zone is running
      case 'ready':
        return 'has-text-info';        // Blue - ready to run
      case 'installed':
        return 'has-text-link';        // Light blue - installed but not ready  
      case 'configured':
        return 'has-text-warning';     // Yellow - configured but not installed
      case 'shutting_down':
      case 'shutting-down':
        return 'has-text-warning';     // Orange - in transition
      case 'incomplete':
        return 'has-text-danger';      // Red - problematic state
      case 'down':
      case 'stopped':
        return 'has-text-grey-dark';   // Dark gray - shut down
      default:
        return 'has-text-grey';        // Gray for unknown
    }
  };

  // Get human-readable status text
  const getStatusText = (status) => {
    switch (status?.toLowerCase()) {
      case 'running':
        return 'Running';
      case 'ready':
        return 'Ready';
      case 'installed':
        return 'Installed';
      case 'configured':
        return 'Configured';
      case 'shutting_down':
      case 'shutting-down':
        return 'Shutting Down';
      case 'incomplete':
        return 'Incomplete';
      case 'down':
        return 'Down';
      case 'stopped':
        return 'Stopped';
      default:
        return 'Unknown';
    }
  };
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { 
    servers: allServers,
    getServers,
    currentServer,
    selectServer,
    currentZone,
    selectZone,
    clearZone,
    makeWebHyveRequest,
    startZone,
    stopZone,
    restartZone,
    deleteZone,
    startVncSession,
    stopVncSession,
    getVncSessionInfo
  } = useServers();

  // Zone action handlers
  const handleZoneAction = async (action) => {
    if (!currentServer || !currentZone) return;
    
    try {
      setLoading(true);
      let result;
      
      switch (action) {
        case 'start':
          result = await startZone(currentServer.hostname, currentServer.port, currentServer.protocol, currentZone);
          break;
        case 'shutdown':
          result = await stopZone(currentServer.hostname, currentServer.port, currentServer.protocol, currentZone);
          break;
        case 'restart':
          result = await restartZone(currentServer.hostname, currentServer.port, currentServer.protocol, currentZone);
          break;
        case 'kill':
          result = await stopZone(currentServer.hostname, currentServer.port, currentServer.protocol, currentZone, true);
          break;
        case 'destroy':
          result = await deleteZone(currentServer.hostname, currentServer.port, currentServer.protocol, currentZone);
          break;
        default:
          console.warn('Unknown action:', action);
          return;
      }

      if (result.success) {
        console.log(`Zone ${action} initiated successfully`);
        // Refresh zones list after a delay
        setTimeout(() => {
          if (currentServer) {
            makeWebHyveRequest(currentServer.hostname, currentServer.port, currentServer.protocol, 'stats')
              .then((res) => {
                if (res.success) {
                  setZones({ data: res.data });
                }
              })
              .catch((error) => console.error('Error refreshing zones:', error));
          }
        }, 2000);
      } else {
        console.error(`Failed to ${action} zone:`, result.message);
      }
    } catch (error) {
      console.error(`Error during zone ${action}:`, error);
    } finally {
      setLoading(false);
      handleModalClick(); // Close modal
    }
  };

  // VNC Console handlers
  const handleVncConsole = async (openInNewTab = false) => {
    if (!currentServer || !currentZone) return;
    
    try {
      setVncLoading(true);
      console.log(`Starting VNC console for zone: ${currentZone}`);
      
      const result = await startVncSession(
        currentServer.hostname,
        currentServer.port,
        currentServer.protocol,
        currentZone
      );

      if (result.success) {
        const proxyUrl = `/api/servers/${encodeURIComponent(currentServer.hostname)}:${currentServer.port}/zones/${encodeURIComponent(currentZone)}/vnc/console?autoconnect=true&scale=true`;
        
        if (openInNewTab) {
          window.open(proxyUrl, '_blank', 'width=1024,height=768,scrollbars=yes,resizable=yes');
        } else {
          // Navigate to zones page with VNC parameter to auto-open console
          navigate(`/ui/zones?vnc=${currentZone}`);
        }
      } else {
        console.error(`Failed to start VNC console for ${currentZone}:`, result.message);
      }
    } catch (error) {
      console.error('Error starting VNC console:', error);
    } finally {
      setVncLoading(false);
    }
  };

  const handleKillVncSession = async () => {
    if (!currentServer || !currentZone) return;
    
    try {
      setVncLoading(true);
      console.log(`Killing VNC session for zone: ${currentZone}`);
      
      const result = await stopVncSession(
        currentServer.hostname,
        currentServer.port,
        currentServer.protocol,
        currentZone
      );

      if (result.success) {
        console.log(`VNC session killed for ${currentZone}`);
      } else {
        console.error(`Failed to kill VNC session for ${currentZone}:`, result.message);
      }
    } catch (error) {
      console.error('Error killing VNC session:', error);
    } finally {
      setVncLoading(false);
    }
  };

  const handleKillZloginSession = async () => {
    if (!currentServer || !currentZone) return;
    
    try {
      setVncLoading(true); // Reuse same loading state
      console.log(`Killing zlogin session for zone: ${currentZone}`);
      
      // First get all active zlogin sessions to find the one for this zone
      const sessionsResult = await makeWebHyveRequest(
        currentServer.hostname,
        currentServer.port,
        currentServer.protocol,
        'zlogin/sessions'
      );

      if (sessionsResult.success && sessionsResult.data) {
        const activeSessions = Array.isArray(sessionsResult.data) 
          ? sessionsResult.data 
          : (sessionsResult.data.sessions || []);
        
        const activeZoneSession = activeSessions.find(session => 
          session.zone_name === currentZone && session.status === 'active'
        );

        if (activeZoneSession) {
          // Kill the specific session by ID
          const killResult = await makeWebHyveRequest(
            currentServer.hostname,
            currentServer.port,
            currentServer.protocol,
            `zlogin/sessions/${activeZoneSession.id}/stop`,
            'DELETE'
          );

          if (killResult.success) {
            console.log(`zlogin session killed for ${currentZone}`);
          } else {
            console.error(`Failed to kill zlogin session for ${currentZone}:`, killResult.message);
          }
        } else {
          console.log(`No active zlogin session found for ${currentZone}`);
        }
      } else {
        console.error('Failed to get zlogin sessions:', sessionsResult.message);
      }
    } catch (error) {
      console.error('Error killing zlogin session:', error);
    } finally {
      setVncLoading(false);
    }
  };

  // Check if current page supports sharing (has host/zone parameters)
  const isShareableRoute = () => {
    const path = location.pathname;
    return path.startsWith('/ui/host') || path.startsWith('/ui/zone') || path === '/ui/zones';
  };

  // Share URL generator and clipboard copy
  const handleShareCurrentPage = async () => {
    if (!isShareableRoute()) {
      console.warn('Share not available on this page');
      return;
    }
    try {
      // Build URL with current selections
      const baseUrl = `${window.location.origin}${location.pathname}`;
      const params = new URLSearchParams();
      
      if (currentServer) {
        params.set('host', currentServer.hostname);
      }
      
      if (currentZone) {
        params.set('zone', currentZone);
      }
      
      const shareUrl = params.toString() ? `${baseUrl}?${params.toString()}` : baseUrl;
      
      // Copy to clipboard
      await navigator.clipboard.writeText(shareUrl);
      
      // Show success feedback (could be enhanced with a toast notification)
      console.log('📋 Share URL copied to clipboard:', shareUrl);
      
      // Optional: You could add a temporary success message here
      
    } catch (error) {
      console.error('Failed to copy URL to clipboard:', error);
      // Fallback for older browsers
      try {
        const textArea = document.createElement('textarea');
        const baseUrl = `${window.location.origin}${location.pathname}`;
        const params = new URLSearchParams();
        
        if (currentServer) {
          params.set('host', currentServer.hostname);
        }
        
        if (currentZone) {
          params.set('zone', currentZone);
        }
        
        const shareUrl = params.toString() ? `${baseUrl}?${params.toString()}` : baseUrl;
        textArea.value = shareUrl;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        console.log('📋 Share URL copied to clipboard (fallback):', shareUrl);
      } catch (fallbackError) {
        console.error('Failed to copy URL using fallback method:', fallbackError);
      }
    }
  };

  const Modal = () => {
    return (
      <div className={isModal ? "modal" : "modal is-active"}>
        <div onClick={handleModalClick} className='modal-background' />
        <div className='modal-card '>
          <header className='modal-card-head'>
            <p className='modal-card-title'>
              Confirm {currentMode} {currentAction}:
            </p>
            <button onClick={handleModalClick} className='delete' aria-label='close' />
          </header>
          <section className={currentZone ? "modal-card-body" : "is-hidden "}>
            <p className={currentZone ? "modal-card-subtitle" : "is-hidden"}>{currentZone}</p>
          </section>

          <footer className='modal-card-foot'>
            <button 
              className='button is-success'
              onClick={() => handleZoneAction(currentAction)}
              disabled={loading}
            >
              {loading ? 'Processing...' : currentAction}
            </button>
            <button onClick={handleModalClick} className='button is-danger'>
              Cancel
            </button>
          </footer>
        </div>
      </div>
    );
  };

  const ZoneControlDropdown = () => {
    const userRole = user?.role;
    
    return (
      <div className='dropdown is-right is-hoverable'>
        <button className='dropdown-trigger button' aria-haspopup='true' aria-controls='dropdown-menu'>
          <span>Zone Controls</span>
          <span className='icon is-small'>
            <i className='fa fa-angle-down' aria-hidden='true'></i>
          </span>
        </button>
        <div className='dropdown-menu' id='zone-control-menu' role='menu'>
          <div className='dropdown-content'>
            {/* Share link option - available when on shareable routes */}
            {isShareableRoute() && currentServer && (
              <>
                <button
                  onClick={handleShareCurrentPage}
                  className='button is-fullwidth is-info'
                  title="Copy shareable link to clipboard"
                >
                  <span className='icon'><i className='fas fa-share-alt'></i></span>
                  <span>Share Link</span>
                </button>
                <hr className='dropdown-divider' />
              </>
            )}
            
            {/* Basic zone controls - available to all users */}
            {canStartStopZones(userRole) && (
              <>
                <button
                  onClick={() => {
                    handleModalClick();
                    setCurrentAction("shutdown");
                    setCurrentMode("zone");
                  }}
                  className='button is-fullwidth has-background-warning-dark has-text-warning-light'
                >
                  <span className='icon'><i className='fas fa-stop'></i></span>
                  <span>Shutdown</span>
                </button>
                <button 
                  onClick={() => {
                    handleModalClick();
                    setCurrentAction("start");
                    setCurrentMode("zone");
                  }}
                  className='button is-fullwidth has-background-success-dark has-text-success-light'
                >
                  <span className='icon'><i className='fas fa-play'></i></span>
                  <span>Power On</span>
                </button>
              </>
            )}
            
            {canRestartZones(userRole) && (
              <button
                onClick={() => {
                  handleModalClick();
                  setCurrentAction("restart");
                  setCurrentMode("zone");
                }}
                className='button is-fullwidth has-background-warning'
              >
                <span className='icon'><i className='fas fa-redo'></i></span>
                <span>Restart</span>
              </button>
            )}

            {canAccessZoneConsole(userRole) && (
              <>
                <hr className='dropdown-divider' />
                <button 
                  className='button is-fullwidth is-dark'
                  onClick={() => handleVncConsole(false)}
                  disabled={vncLoading || getZoneStatus(currentZone) !== 'running'}
                >
                  <span className='icon'><i className='fas fa-terminal'></i></span>
                  <span>{vncLoading ? 'Starting...' : 'Console'}</span>
                </button>
                <button 
                  className='button is-fullwidth is-dark'
                  onClick={() => handleVncConsole(true)}
                  disabled={vncLoading || getZoneStatus(currentZone) !== 'running'}
                  title="Open Console in New Tab"
                >
                  <span className='icon'><i className='fas fa-external-link-alt'></i></span>
                  <span>Console (New Tab)</span>
                </button>
                <button
                  className='button is-fullwidth is-dark'
                  onClick={() => navigate(`/ui/zones?zlogin=${currentZone}`)}
                  disabled={getZoneStatus(currentZone) !== 'running'}
                  title="Open zlogin Console"
                >
                  <span className='icon'><i className='fas fa-terminal'></i></span>
                  <span>zlogin Console</span>
                </button>
                <button 
                  className='button is-fullwidth is-danger'
                  onClick={handleKillVncSession}
                  disabled={vncLoading}
                  title="Kill VNC Session"
                >
                  <span className='icon'><i className='fas fa-times'></i></span>
                  <span>Kill VNC Session</span>
                </button>
                <button 
                  className='button is-fullwidth is-danger'
                  onClick={handleKillZloginSession}
                  disabled={vncLoading}
                  title="Kill zlogin Session"
                >
                  <span className='icon'><i className='fas fa-skull-crossbones'></i></span>
                  <span>Kill zlogin Session</span>
                </button>
              </>
            )}

            {/* Advanced controls - admin only */}
            {canDestroyZones(userRole) && (
              <>
                <hr className='dropdown-divider' />
                <button
                  onClick={() => {
                    handleModalClick();
                    setCurrentAction("kill");
                    setCurrentMode("zone");
                  }}
                  className='button is-fullwidth has-background-warning-dark has-text-warning-light'
                >
                  <span className='icon'><i className='fas fa-skull'></i></span>
                  <span>Force Kill</span>
                </button>
                <button className='button is-fullwidth'>
                  <span className='icon'><i className='fas fa-camera'></i></span>
                  <span>Snapshot</span>
                </button>
                <button
                  onClick={() => {
                    handleModalClick();
                    setCurrentAction("provision");
                    setCurrentMode("zone");
                  }}
                  className='button is-fullwidth'
                >
                  <span className='icon'><i className='fas fa-cogs'></i></span>
                  <span>Provision</span>
                </button>
                <button
                  onClick={() => {
                    handleModalClick();
                    setCurrentAction("destroy");
                    setCurrentMode("zone");
                  }}
                  className='button is-fullwidth has-background-danger-dark has-text-danger-light'
                >
                  <span className='icon'><i className='fas fa-trash'></i></span>
                  <span>Destroy</span>
                </button>
              </>
            )}
            
            {/* Show limited access message for users */}
            {!canDestroyZones(userRole) && (
              <>
                <hr className='dropdown-divider' />
                <div className='has-text-grey-light has-text-centered p-2 is-size-7'>
                  Advanced controls require admin privileges
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    );
  };

  const HostControlDropdown = () => {
    const userRole = user?.role;
    
    return (
      <div className='dropdown is-right is-hoverable'>
        <button className='dropdown-trigger button' aria-haspopup='true' aria-controls='dropdown-menu'>
          <span>Host Actions</span>
          <span className='icon is-small'>
            <i className='fa fa-angle-down' aria-hidden='true'></i>
          </span>
        </button>
        <div className='dropdown-menu' id='host-control-menu' role='menu'>
          <div className='dropdown-content'>
            {/* Share link option - available when on shareable routes */}
            {isShareableRoute() && currentServer && (
              <>
                <button
                  onClick={handleShareCurrentPage}
                  className='button is-fullwidth is-info'
                  title="Copy shareable link to clipboard"
                >
                  <span className='icon'><i className='fas fa-share-alt'></i></span>
                  <span>Share Link</span>
                </button>
                <hr className='dropdown-divider' />
              </>
            )}
            
            {/* Read-only actions available to all users */}
            <a href='/ui/hosts' className='button is-fullwidth is-info'>
              <span className='icon'><i className='fas fa-eye'></i></span>
              <span>View Host Details</span>
            </a>
            <a href='/ui/zones' className='button is-fullwidth is-info'>
              <span className='icon'><i className='fas fa-server'></i></span>
              <span>Manage Zones</span>
            </a>
            
            {/* Host control actions - admin only */}
            {canControlHosts(userRole) && (
              <>
                <hr className='dropdown-divider' />
                <button className='button is-fullwidth'>
                  <span className='icon'><i className='fas fa-terminal'></i></span>
                  <span>Shell</span>
                </button>
                <button className='button is-fullwidth'>
                  <span className='icon'><i className='fas fa-desktop'></i></span>
                  <span>Console</span>
                </button>
              </>
            )}
            
            {canPowerOffHosts(userRole) && (
              <>
                <hr className='dropdown-divider' />
                <button
                  onClick={() => {
                    handleModalClick();
                    setCurrentAction("restart");
                    setCurrentMode("host");
                  }}
                  className='button is-fullwidth has-background-warning'
                >
                  <span className='icon'><i className='fas fa-redo'></i></span>
                  <span>Restart Host</span>
                </button>
                <button
                  onClick={() => {
                    handleModalClick();
                    setCurrentAction("shutdown");
                    setCurrentMode("host");
                  }}
                  className='button is-fullwidth has-background-danger-dark has-text-warning-light'
                >
                  <span className='icon'><i className='fas fa-power-off'></i></span>
                  <span>Power Off Host</span>
                </button>
              </>
            )}
            
            {/* Show read-only message for users */}
            {!canControlHosts(userRole) && (
              <>
                <hr className='dropdown-divider' />
                <div className='has-text-grey-light has-text-centered p-2 is-size-7'>
                  Host controls require admin privileges<br/>
                  Users have read-only access to host information
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    );
  };

  const ZoneList = (props) => {
    return (
      <div className='dropdown-menu dropdown-content' id='zone-select' role='menu'>
        {currentZone && (
          <button
            onClick={() => {
              clearZone();
            }}
            className='button is-warning mb-1 is-fullwidth'
          >
            <span className='icon'>
              <i className='fas fa-times'></i>
            </span>
            <span>Deselect Zone</span>
          </button>
        )}
        {props.zones.data.allzones.filter(zone => zone !== currentZone).map((zone) => {
          const status = getZoneStatus(zone);
          const statusColor = getStatusDotColor(status);
          
          return (
            <button
              key={zone}
              onClick={() => {
                selectZone(zone);
              }}
              className='button mb-1 is-fullwidth'
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <span>{zone}</span>
              <span 
                className={`icon is-small ${statusColor}`}
                title={`Status: ${status}`}
              >
                <i className='fas fa-circle' style={{ fontSize: '0.6rem' }}></i>
              </span>
            </button>
          );
        })}
      </div>
    );
  };

  useEffect(() => {
    // Set initial current server if we don't have one and there are servers available
    if (!currentServer && allServers && allServers.length > 0) {
      selectServer(allServers[0]);
    }
  }, [allServers, currentServer, selectServer]);

  useEffect(() => {
    // Fetch zones from current server
    if (currentServer && user) {
      const serverUrl = `${currentServer.protocol}://${currentServer.hostname}:${currentServer.port}`;
      axios
        .get(`/api/webhyve/${currentServer.protocol}/${currentServer.hostname}/${currentServer.port}/stats`)
        .then((res) => {
          setZones(res);
        })
        .catch((error) => {
          console.error('Error fetching zones:', error);
        });
    }
  }, [currentServer, user]);

  return (
    <div className='hero-head z-index-set-behind'>
      <nav className='level hero-head' role='navigation' aria-label='main navigation'>
        <Modal />
        <div className='level-left'>
          {currentServer ? (
            <div className='dropdown is-hoverable'>
              <button className='dropdown-trigger button px-2' aria-haspopup='true' aria-controls='dropdown-menu'>
                <span>Host</span>
                <span className='icon'>
                  <i className='fa fa-angle-down' aria-hidden='true'></i>
                </span>
              </button>

              <div className='dropdown-menu dropdown-content' id='host-select' role='menu'>
                {allServers &&
                  allServers.map((server, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        selectServer(server);
                        console.log("Host selected:", server.hostname);
                      }}
                      className='button mb-1 is-fullwidth'
                    >
                      {server.hostname}
                    </button>
                  ))}
              </div>
              <div className='px-1 button'>{currentServer.hostname}</div>
            </div>
          ) : (
            <a href='/ui/settings/zoneweaver?tab=servers' className='px-1 button'>
              <span>Add Server</span>
              <span className='icon has-text-success'>
                <i className='fas fa-plus'></i>
              </span>
            </a>
          )}
          <div className='divider is-primary mx-4 is-vertical'>|</div>
          <div className='dropdown is-hoverable'>
            <button className='dropdown-trigger button px-2' aria-haspopup='true' aria-controls='dropdown-menu'>
              <span>Zone</span>
              <span className='icon'>
                <i className='fa fa-angle-down' aria-hidden='true'></i>
              </span>
            </button>

            {zones && <ZoneList zones={zones} />}
            <div className='px-1 button' style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <span>{currentZone}</span>
              {currentZone && (
                <span 
                  className={`icon is-small ${getStatusDotColor(getZoneStatus(currentZone))}`}
                  title={`Status: ${getZoneStatus(currentZone)}`}
                  style={{marginLeft: '8px'}}
                >
                  <i className='fas fa-circle' style={{ fontSize: '0.6rem' }}></i>
                </span>
              )}
            </div>
          </div>
        </div>
        <div className='level-right'>{currentZone ? <ZoneControlDropdown /> : <HostControlDropdown />}</div>
      </nav>
    </div>
  );
};

export default Navbar;
