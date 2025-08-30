import React from 'react';
import ZloginActionsDropdown from '../ZloginActionsDropdown';
import ZoneShell from '../ZoneShell';

const ZloginModal = ({
  showZloginConsole,
  setShowZloginConsole,
  isZloginFullScreen,
  setIsZloginFullScreen,
  selectedZone,
  handleZloginConsole,
  handleZloginModalPaste,
  user,
  zoneDetails,
  setShowVncConsole,
  handleVncConsole,
  loadingVnc,
  setLoading,
  makeZoneweaverAPIRequest,
  currentServer,
  forceZoneSessionCleanup,
  refreshZloginSessionStatus,
  setError,
  modalReadOnly,
  setModalReadOnly
}) => {
  if (!showZloginConsole) {
    return null;
  }

  return (
    <div className='modal is-active has-z-index-modal'>
      <div className='modal-background' onClick={() => setShowZloginConsole(false)}></div>
      <div 
        style={{
          width: isZloginFullScreen ? '99vw' : '90vw', 
          height: isZloginFullScreen ? '100vh' : '86vh',
          position: isZloginFullScreen ? 'fixed' : 'relative',
          top: isZloginFullScreen ? '0' : 'auto',
          left: isZloginFullScreen ? '0' : 'auto',
          margin: isZloginFullScreen ? '0' : 'auto',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          backgroundColor: 'white',
          borderRadius: '0',
          boxShadow: isZloginFullScreen ? 'none' : '0 8px 16px rgba(10, 10, 10, 0.1)'
        }}
      >
        <header 
          className='modal-card-head' 
          style={{
            padding: isZloginFullScreen ? '0.25rem 0.5rem' : '0.75rem 1rem',
            minHeight: 'auto',
            flexShrink: 0,
            '--bulma-modal-card-head-radius': '0',
            borderRadius: '0'
          }}
        >
          <p 
            className='modal-card-title' 
            style={{
              fontSize: isZloginFullScreen ? '0.9rem' : '1.1rem',
              margin: 0,
              lineHeight: '1.2'
            }}
          >
            <span className='icon-text'>
              <span className='icon is-small'>
                <i className='fas fa-terminal'></i>
              </span>
              <span>zlogin Console - {selectedZone}</span>
            </span>
          </p>
          <div className='buttons has-margin-0'>
            <ZloginActionsDropdown
              variant="button"
              onToggleReadOnly={() => {
                console.log(`🔧 ZLOGIN MODAL READ-ONLY: Toggling from ${modalReadOnly} to ${!modalReadOnly}`);
                setModalReadOnly(!modalReadOnly);
              }}
              onNewSession={() => {
                setShowZloginConsole(false);
                setTimeout(() => {
                  handleZloginConsole(selectedZone).then(result => {
                    if (!result.success) setError(result.message);
                  });
                }, 100);
              }}
              onKillSession={async () => {
                if (!currentServer || !selectedZone) return;
                try {
                  setLoading(true);
                  const sessionsResult = await makeZoneweaverAPIRequest(
                    currentServer.hostname, currentServer.port, currentServer.protocol, 'zlogin/sessions'
                  );
                  if (sessionsResult.success && sessionsResult.data) {
                    const activeSessions = Array.isArray(sessionsResult.data) ? sessionsResult.data : (sessionsResult.data.sessions || []);
                    const activeZoneSession = activeSessions.find(session => session.zone_name === selectedZone && session.status === 'active');
                    if (activeZoneSession) {
                      const killResult = await makeZoneweaverAPIRequest(
                        currentServer.hostname, currentServer.port, currentServer.protocol,
                        `zlogin/sessions/${activeZoneSession.id}/stop`, 'DELETE'
                      );
                      if (killResult.success) {
                        await forceZoneSessionCleanup(currentServer, selectedZone);
                        await refreshZloginSessionStatus(selectedZone);
                      } else {
                        setError(`Failed to kill zlogin session: ${killResult.message}`);
                      }
                    }
                  } else {
                    setError('Failed to get active sessions');
                  }
                } catch (error) {
                  setError('Error killing zlogin session');
                } finally {
                  setLoading(false);
                }
              }}
              onScreenshot={() => {
                const terminalElement = document.querySelector('.xterm-screen');
                if (terminalElement) {
                  const text = terminalElement.textContent || terminalElement.innerText;
                  const blob = new Blob([text], { type: 'text/plain' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `zlogin-output-${selectedZone}-${Date.now()}.txt`;
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                  URL.revokeObjectURL(url);
                }
              }}
              isReadOnly={modalReadOnly}
              isAdmin={user?.role === 'admin' || user?.role === 'super-admin' || user?.role === 'organization-admin'}
              className="has-shadow-medium"
            />
            {!modalReadOnly && (
              <button 
                className='button is-small is-info has-shadow-medium'
                onClick={handleZloginModalPaste}
                title="Paste from Browser Clipboard"
              >
                <span className='icon is-small'>
                  <i className='fas fa-paste'></i>
                </span>
              </button>
            )}
            <button 
              className='button is-small is-warning has-shadow-medium'
              onClick={async () => {
                if (zoneDetails.active_vnc_session) {
                  setShowZloginConsole(false);
                  setShowVncConsole(true);
                } else {
                  setShowZloginConsole(false);
                  const errorMsg = await handleVncConsole(selectedZone);
                  if (errorMsg) setError(errorMsg);
                }
              }}
              disabled={loadingVnc}
              title={zoneDetails.active_vnc_session ? "Switch to VNC Console" : "Start VNC Console"}
            >
              <span className='icon is-small'>
                <i className={`fas ${loadingVnc ? 'fa-spinner fa-pulse' : 'fa-desktop'}`}></i>
              </span>
              <span>{loadingVnc ? 'Starting...' : 'VNC'}</span>
            </button>
            <button 
              className='button is-small is-info'
              onClick={() => setIsZloginFullScreen(!isZloginFullScreen)}
              title={isZloginFullScreen ? "Exit Full Screen" : "Enter Full Screen"}
            >
              <span className='icon'>
                <i className={`fas ${isZloginFullScreen ? 'fa-compress' : 'fa-expand'}`}></i>
              </span>
              <span>{isZloginFullScreen ? 'Exit' : 'Full'}</span>
            </button>
            <button 
              className='button is-small'
              onClick={() => setShowZloginConsole(false)}
              title="Close Console"
            >
              <span className='icon'>
                <i className='fas fa-times'></i>
              </span>
              <span>Exit</span>
            </button>
          </div>
        </header>
        <section 
          className='modal-card-body p-0' 
          style={{
            flex: 1,
            display: 'flex',
            overflow: 'hidden'
          }}
        >
          <ZoneShell 
            key={`zlogin-modal-${selectedZone}-${modalReadOnly ? 'ro' : 'rw'}`} 
            zoneName={selectedZone} 
            readOnly={modalReadOnly} 
            context="modal" 
          />
        </section>
      </div>
    </div>
  );
};

export default ZloginModal;
