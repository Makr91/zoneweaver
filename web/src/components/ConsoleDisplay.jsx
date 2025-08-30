import React, { useRef } from 'react';
import VncViewerReact from './VncViewerReact';
import VncActionsDropdown from './VncActionsDropdown';
import ZloginActionsDropdown from './ZloginActionsDropdown';
import ZoneShell from './ZoneShell';

const ConsoleDisplay = ({
  zoneDetails,
  activeConsoleType,
  selectedZone,
  currentServer,
  user,
  loading,
  loadingVnc,
  previewReadOnly,
  previewVncViewOnly,
  previewReconnectKey,
  vncReconnectKey,
  vncSettings,
  setActiveConsoleType,
  setLoading,
  setLoadingVnc,
  setError,
  setPreviewReadOnly,
  setPreviewVncViewOnly,
  setZoneDetails,
  startVncSession,
  startZloginSessionExplicitly,
  waitForVncSessionReady,
  forceZoneSessionCleanup,
  pasteTextToZone,
  handleVncConsole,
  handleZloginConsole,
  handleKillVncSession,
  handleVncQualityChange,
  handleVncCompressionChange,
  handleVncResizeChange,
  handleVncShowDotChange,
  handleVncClipboardPaste,
  setShowZloginConsole
}) => {
  const previewVncRef = useRef(null);

  const hasVnc = zoneDetails.active_vnc_session;
  const hasZlogin = zoneDetails.zlogin_session && zoneDetails.zlogin_session.id;
  
  console.log(`🔍 CONSOLE DISPLAY: Determining which console to show:`, {
    hasVnc,
    hasZlogin,
    activeConsoleType,
    zloginSessionId: zoneDetails.zlogin_session?.id,
    vncSessionInfo: hasVnc ? 'present' : 'absent',
    vncSessionInfoExists: !!zoneDetails.vnc_session_info,
    timestamp: Date.now()
  });

  if (hasZlogin && !hasVnc) {
    // Only zlogin active → Show zlogin
    console.log(`🔍 CONSOLE DISPLAY: Showing zlogin console (only zlogin active)`);
    return (
      <div className="zw-console-container">
        {/* zlogin Console Header */}
        <div className="has-background-dark has-text-white p-3 is-flex is-justify-content-space-between is-align-items-center">
          <div>
            <h6 className='title is-7 has-text-white mb-1'>Active zlogin Session</h6>
            {zoneDetails.zlogin_session && (
              <p className='is-size-7 has-text-white-ter mb-0'>
                Session ID: {zoneDetails.zlogin_session.id?.substring(0, 8) || 'Unknown'} | 
                Started: {zoneDetails.zlogin_session.created_at ? 
                  new Date(zoneDetails.zlogin_session.created_at).toLocaleString() : 
                  'Unknown'
                }
              </p>
            )}
          </div>
          <div className='buttons has-margin-0'>
            <ZloginActionsDropdown
              variant="button"
              onToggleReadOnly={() => {
                console.log(`🔧 ZLOGIN READ-ONLY: Toggling from ${previewReadOnly} to ${!previewReadOnly}`);
                setPreviewReadOnly(!previewReadOnly);
              }}
              onNewSession={() => handleZloginConsole(selectedZone)}
              onKillSession={async () => {
                if (!currentServer || !selectedZone) return;
                try {
                  setLoading(true);
                  await forceZoneSessionCleanup(currentServer, selectedZone);
                  setZoneDetails(prev => ({
                    ...prev,
                    zlogin_session: null,
                    active_zlogin_session: false
                  }));
                } catch (error) {
                  console.error('Error killing zlogin session:', error);
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
              isReadOnly={previewReadOnly}
              isAdmin={user?.role === 'admin' || user?.role === 'super-admin' || user?.role === 'organization-admin'}
              className="has-shadow-medium"
            />
            {!previewReadOnly && (
              <button 
                className='button is-small is-info has-box-shadow'
                onClick={async () => {
                  try {
                    const text = await navigator.clipboard.readText();
                    if (text && currentServer && selectedZone) {
                      console.log(`📋 ZLOGIN PREVIEW PASTE: Pasting ${text.length} characters`);
                      await pasteTextToZone(currentServer, selectedZone, text);
                    }
                  } catch (error) {
                    console.error('📋 ZLOGIN PREVIEW PASTE: Error:', error);
                  }
                }}
                title="Paste from Browser Clipboard"
              >
                <span className='icon is-small'>
                  <i className='fas fa-paste'></i>
                </span>
              </button>
            )}
            <button 
              className='button is-small is-primary'
              onClick={() => {
                if (zoneDetails.zlogin_session) {
                  setShowZloginConsole(true);
                } else {
                  handleZloginConsole(selectedZone);
                }
              }}
              disabled={loading}
              title="Expand zlogin Console"
            >
              <span className='icon is-small'>
                <i className='fas fa-expand'></i>
              </span>
            </button>
            <button 
              className='button is-small is-warning has-shadow-medium'
              onClick={async () => {
                console.log(`🚀 START VNC: Starting VNC for preview from zlogin`);
                try {
                  setLoadingVnc(true);
                  const result = await startVncSession(
                    currentServer.hostname,
                    currentServer.port,
                    currentServer.protocol,
                    selectedZone
                  );
                  
                  if (result.success) {
                    const readinessResult = await waitForVncSessionReady(selectedZone);
                    if (readinessResult.ready) {
                      setZoneDetails(prev => ({
                        ...prev,
                        active_vnc_session: true,
                        vnc_session_info: {
                          ...result.data,
                          ...readinessResult.sessionInfo
                        }
                      }));
                      setActiveConsoleType('vnc');
                    }
                  }
                } catch (error) {
                  console.error('Error starting VNC:', error);
                  setError('Error starting VNC console');
                } finally {
                  setLoadingVnc(false);
                }
              }}
              disabled={loadingVnc}
              title="Start VNC Console"
            >
              <span className='icon is-small'>
                <i className={`fas ${loadingVnc ? 'fa-spinner fa-pulse' : 'fa-desktop'}`}></i>
              </span>
            </button>
          </div>
        </div>

        {/* zlogin Console Content */}
        <div className="zw-console-content">
          <ZoneShell 
            key={`preview-zlogin-${selectedZone}-${previewReconnectKey}-${previewReadOnly ? 'ro' : 'rw'}`}
            zoneName={selectedZone} 
            readOnly={previewReadOnly}
            context="preview"
            className="zw-console-zone-shell"
          />
          
          <div className="zw-console-status-overlay">
            <span className='icon is-small has-margin-right-3px'>
              <i 
                className={`fas fa-circle zw-console-status-icon ${
                  zoneDetails.zlogin_session ? 'zw-status-icon-active' : 'zw-status-icon-inactive'
                }`}
              ></i>
            </span>
            {zoneDetails.zlogin_session ? 'Live' : 'Offline'}
          </div>
        </div>
      </div>
    );
  } else if (hasVnc && !hasZlogin) {
    // Only VNC active → Show VNC
    console.log(`🔍 CONSOLE DISPLAY: Showing VNC console (only VNC active)`);
    return (
      <div className="zw-console-container">
        {/* VNC Console Header */}
        <div className="has-background-dark has-text-white p-3 is-flex is-justify-content-space-between is-align-items-center">
          <div>
            <h6 className='title is-7 has-text-white mb-1'>Active VNC Session</h6>
            {zoneDetails.vnc_session_info && zoneDetails.vnc_session_info.web_port && (
              <p className='is-size-7 has-text-white-ter mb-0'>
                Port: {zoneDetails.vnc_session_info.web_port} | 
                Started: {zoneDetails.vnc_session_info.created_at ? 
                  new Date(zoneDetails.vnc_session_info.created_at).toLocaleString() : 
                  'Unknown'
                }
              </p>
            )}
          </div>
          <div className='buttons has-margin-0'>
            <VncActionsDropdown
              vncRef={previewVncRef}
              variant="button"
              onToggleReadOnly={() => {
                console.log(`🔧 VNC READ-ONLY: Toggling from ${previewVncViewOnly} to ${!previewVncViewOnly}`);
                setPreviewVncViewOnly(!previewVncViewOnly);
              }}
              onScreenshot={() => {
                const vncContainer = document.querySelector('.vnc-viewer-react canvas');
                if (vncContainer) {
                  vncContainer.toBlob((blob) => {
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `vnc-screenshot-${selectedZone}-${Date.now()}.png`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                  });
                }
              }}
              onNewTab={() => handleVncConsole(selectedZone, true)}
              onKillSession={() => handleKillVncSession(selectedZone)}
              isReadOnly={previewVncViewOnly}
              isAdmin={user?.role === 'admin' || user?.role === 'super-admin' || user?.role === 'organization-admin'}
              quality={vncSettings.quality}
              compression={vncSettings.compression}
              resize={vncSettings.resize}
              showDot={vncSettings.showDot}
              onQualityChange={handleVncQualityChange}
              onCompressionChange={handleVncCompressionChange}
              onResizeChange={handleVncResizeChange}
              onShowDotChange={handleVncShowDotChange}
              onClipboardPaste={handleVncClipboardPaste}
              className="has-shadow-medium"
            />
            {!previewVncViewOnly && (
              <button 
                className='button is-small is-info has-shadow-medium'
                onClick={async () => {
                  try {
                    const text = await navigator.clipboard.readText();
                    if (text && previewVncRef.current?.clipboardPaste) {
                      console.log(`📋 VNC PREVIEW PASTE: Pasting ${text.length} characters`);
                      previewVncRef.current.clipboardPaste(text);
                    }
                  } catch (error) {
                    console.error('📋 VNC PREVIEW PASTE: Error:', error);
                  }
                }}
                title="Paste from Browser Clipboard"
              >
                <span className='icon is-small'>
                  <i className='fas fa-paste'></i>
                </span>
              </button>
            )}
            <button 
              className='button is-small is-primary'
              onClick={() => handleVncConsole(selectedZone)}
              disabled={loading || loadingVnc}
              title="Expand VNC Console"
            >
              <span className='icon is-small'>
                <i className='fas fa-expand'></i>
              </span>
            </button>
            <button 
              className='button is-small is-warning has-shadow-medium'
              onClick={async () => {
                console.log(`🚀 START ZLOGIN: Starting zlogin for preview from VNC`);
                try {
                  setLoading(true);
                  const result = await startZloginSessionExplicitly(currentServer, selectedZone);
                  if (result) {
                    setZoneDetails(prev => ({
                      ...prev,
                      zlogin_session: result,
                      active_zlogin_session: true
                    }));
                    setActiveConsoleType('zlogin');
                  }
                } catch (error) {
                  console.error('Error starting zlogin:', error);
                  setError('Error starting zlogin console');
                } finally {
                  setLoading(false);
                }
              }}
              disabled={loading}
              title="Start zlogin Console"
            >
              <span className='icon is-small'>
                <i className={`fas ${loading ? 'fa-spinner fa-pulse' : 'fa-terminal'}`}></i>
              </span>
            </button>
          </div>
        </div>

        {/* VNC Console Content */}
        <div className="zw-console-content">
          {zoneDetails.vnc_session_info ? (
            <VncViewerReact
              ref={previewVncRef}
              key={`vnc-preview-${selectedZone}-${previewVncViewOnly}-${vncReconnectKey}`}
              serverHostname={currentServer.hostname}
              serverPort={currentServer.port}
              serverProtocol={currentServer.protocol}
              zoneName={selectedZone}
              viewOnly={previewVncViewOnly}
              autoConnect={true}
              showControls={false}
              quality={vncSettings.quality}
              compression={vncSettings.compression}
              resize={vncSettings.resize}
              showDot={vncSettings.showDot}
              resizeSession={vncSettings.resize === 'remote'}
              onClipboard={(event) => {
                console.log('📋 VNC PREVIEW: Clipboard received from server:', event);
              }}
              className="zw-vnc-container"
            />
          ) : zoneDetails.configuration?.zonepath ? (
            <img
              src={`/api/servers/${encodeURIComponent(currentServer.hostname)}:${currentServer.port}/zones/${encodeURIComponent(selectedZone)}/screenshot`}
              alt={`Screenshot of ${selectedZone}`}
              className="zw-console-screenshot"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextElementSibling.style.display = 'flex';
              }}
              onLoad={(e) => {
                if (e.target.nextElementSibling) {
                  e.target.nextElementSibling.style.display = 'none';
                }
              }}
            />
          ) : null}
          
          {!(zoneDetails.vnc_session_info?.proxy_url || zoneDetails.vnc_session_info?.console_url) && (
            <div 
              className={zoneDetails.configuration?.zonepath ? 'zw-console-placeholder-none' : 'zw-console-placeholder-hidden'}
            >
              <div className="has-text-centered">
                <div className="has-margin-bottom-12px">
                  <img 
                    src="/images/startcloud.svg" 
                    alt="Start Console" 
                    className="zw-startup-icon"
                  />
                </div>
                <div className="is-size-6 has-text-weight-medium">
                  No Console Session
                </div>
                <div className="is-size-7 has-margin-top-6px-opacity-07">
                  Click Console to start session
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  } else if (hasVnc && hasZlogin) {
    // Both active → Show based on activeConsoleType
    console.log(`🔍 CONSOLE DISPLAY: Both sessions active, showing ${activeConsoleType === 'zlogin' ? 'zlogin' : 'VNC'}`);
    
    if (activeConsoleType === 'zlogin') {
      // Show zlogin (user switched to it)
      return (
        <div className="zw-console-container">
          {/* zlogin Console Header */}
          <div className="has-background-dark has-text-white p-3 is-flex is-justify-content-space-between is-align-items-center">
            <div>
              <h6 className='title is-7 has-text-white mb-1'>Active zlogin Session</h6>
              {zoneDetails.zlogin_session && (
                <p className='is-size-7 has-text-white-ter mb-0'>
                  Session ID: {zoneDetails.zlogin_session.id?.substring(0, 8) || 'Unknown'} | 
                  Started: {zoneDetails.zlogin_session.created_at ? 
                    new Date(zoneDetails.zlogin_session.created_at).toLocaleString() : 
                    'Unknown'
                  }
                </p>
              )}
            </div>
            <div className='buttons has-margin-0'>
              <ZloginActionsDropdown
                variant="button"
                onToggleReadOnly={() => {
                  console.log(`🔧 ZLOGIN READ-ONLY: Toggling from ${previewReadOnly} to ${!previewReadOnly}`);
                  setPreviewReadOnly(!previewReadOnly);
                }}
                onNewSession={() => handleZloginConsole(selectedZone)}
                onKillSession={async () => {
                  if (!currentServer || !selectedZone) return;
                  try {
                    setLoading(true);
                    await forceZoneSessionCleanup(currentServer, selectedZone);
                    setZoneDetails(prev => ({
                      ...prev,
                      zlogin_session: null,
                      active_zlogin_session: false
                    }));
                  } catch (error) {
                    console.error('Error killing zlogin session:', error);
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
                isReadOnly={previewReadOnly}
                isAdmin={user?.role === 'admin' || user?.role === 'super-admin' || user?.role === 'organization-admin'}
                className="has-shadow-medium"
              />
              {!previewReadOnly && (
                <button 
                  className='button is-small is-info has-box-shadow'
                  onClick={async () => {
                    try {
                      const text = await navigator.clipboard.readText();
                      if (text && currentServer && selectedZone) {
                        await pasteTextToZone(currentServer, selectedZone, text);
                      }
                    } catch (error) {
                      console.error('📋 ZLOGIN PREVIEW PASTE: Error:', error);
                    }
                  }}
                  title="Paste from Browser Clipboard"
                >
                  <span className='icon is-small'>
                    <i className='fas fa-paste'></i>
                  </span>
                </button>
              )}
              <button 
                className='button is-small is-primary'
                onClick={() => {
                  if (zoneDetails.zlogin_session) {
                    setShowZloginConsole(true);
                  } else {
                    handleZloginConsole(selectedZone);
                  }
                }}
                disabled={loading}
                title="Expand zlogin Console"
              >
                <span className='icon is-small'>
                  <i className='fas fa-expand'></i>
                </span>
              </button>
              <button 
                className='button is-small is-warning has-shadow-medium'
                onClick={() => {
                  console.log(`🔄 PREVIEW SWITCH: Switching to VNC preview from zlogin`);
                  setActiveConsoleType('vnc');
                }}
                title="Switch to VNC Console"
              >
                <span className='icon is-small'>
                  <i className='fas fa-desktop'></i>
                </span>
              </button>
            </div>
          </div>

          {/* zlogin Console Content */}
          <div className="zw-console-content">
            <ZoneShell 
              key={`preview-zlogin-${selectedZone}-${previewReconnectKey}-${previewReadOnly ? 'ro' : 'rw'}`}
              zoneName={selectedZone} 
              readOnly={previewReadOnly}
              context="preview"
              className="zw-console-zone-shell"
            />
            
            <div className="zw-console-status-overlay">
              <span className='icon is-small has-margin-right-3px'>
                <i 
                  className={`fas fa-circle zw-console-status-icon ${
                    zoneDetails.zlogin_session ? 'zw-status-icon-active' : 'zw-status-icon-inactive'
                  }`}
                ></i>
              </span>
              {zoneDetails.zlogin_session ? 'Live' : 'Offline'}
            </div>
          </div>
        </div>
      );
    } else {
      // Show VNC (default when both active)
      return (
        <div className="zw-console-container">
          {/* VNC Console Header */}
          <div className="has-background-dark has-text-white p-3 is-flex is-justify-content-space-between is-align-items-center">
            <div>
              <h6 className='title is-7 has-text-white mb-1'>Active VNC Session</h6>
              {zoneDetails.vnc_session_info && zoneDetails.vnc_session_info.web_port && (
                <p className='is-size-7 has-text-white-ter mb-0'>
                  Port: {zoneDetails.vnc_session_info.web_port} | 
                  Started: {zoneDetails.vnc_session_info.created_at ? 
                    new Date(zoneDetails.vnc_session_info.created_at).toLocaleString() : 
                    'Unknown'
                  }
                </p>
              )}
            </div>
            <div className='buttons has-margin-0'>
              <VncActionsDropdown
                vncRef={previewVncRef}
                variant="button"
                onToggleReadOnly={() => {
                  console.log(`🔧 VNC READ-ONLY: Toggling from ${previewVncViewOnly} to ${!previewVncViewOnly}`);
                  setPreviewVncViewOnly(!previewVncViewOnly);
                }}
                onScreenshot={() => {
                  const vncContainer = document.querySelector('.vnc-viewer-react canvas');
                  if (vncContainer) {
                    vncContainer.toBlob((blob) => {
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `vnc-screenshot-${selectedZone}-${Date.now()}.png`;
                      document.body.appendChild(a);
                      a.click();
                      document.body.removeChild(a);
                      URL.revokeObjectURL(url);
                    });
                  }
                }}
                onNewTab={() => handleVncConsole(selectedZone, true)}
                onKillSession={() => handleKillVncSession(selectedZone)}
                isReadOnly={previewVncViewOnly}
                isAdmin={user?.role === 'admin' || user?.role === 'super-admin' || user?.role === 'organization-admin'}
                quality={vncSettings.quality}
                compression={vncSettings.compression}
                resize={vncSettings.resize}
                showDot={vncSettings.showDot}
                onQualityChange={handleVncQualityChange}
                onCompressionChange={handleVncCompressionChange}
                onResizeChange={handleVncResizeChange}
                onShowDotChange={handleVncShowDotChange}
                onClipboardPaste={handleVncClipboardPaste}
                className="has-shadow-medium"
              />
              {!previewVncViewOnly && (
                <button 
                  className='button is-small is-info has-shadow-medium'
                  onClick={async () => {
                    try {
                      const text = await navigator.clipboard.readText();
                      if (text && previewVncRef.current?.clipboardPaste) {
                        previewVncRef.current.clipboardPaste(text);
                      }
                    } catch (error) {
                      console.error('📋 VNC PREVIEW PASTE: Error:', error);
                    }
                  }}
                  title="Paste from Browser Clipboard"
                >
                  <span className='icon is-small'>
                    <i className='fas fa-paste'></i>
                  </span>
                </button>
              )}
              <button 
                className='button is-small is-primary'
                onClick={() => handleVncConsole(selectedZone)}
                disabled={loading || loadingVnc}
                title="Expand VNC Console"
              >
                <span className='icon is-small'>
                  <i className='fas fa-expand'></i>
                </span>
              </button>
              <button 
                className='button is-small is-warning has-shadow-medium'
                onClick={() => {
                  console.log(`🔄 PREVIEW SWITCH: Switching to zlogin preview from VNC`);
                  setActiveConsoleType('zlogin');
                }}
                title="Switch to zlogin Console"
              >
                <span className='icon is-small'>
                  <i className='fas fa-terminal'></i>
                </span>
              </button>
            </div>
          </div>

          {/* VNC Console Content */}
          <div className="zw-console-content">
            {zoneDetails.vnc_session_info ? (
              <VncViewerReact
                ref={previewVncRef}
                key={`vnc-preview-${selectedZone}-${previewVncViewOnly}-${vncReconnectKey}`}
                serverHostname={currentServer.hostname}
                serverPort={currentServer.port}
                serverProtocol={currentServer.protocol}
                zoneName={selectedZone}
                viewOnly={previewVncViewOnly}
                autoConnect={true}
                showControls={false}
                quality={vncSettings.quality}
                compression={vncSettings.compression}
                resize={vncSettings.resize}
                showDot={vncSettings.showDot}
                resizeSession={vncSettings.resize === 'remote'}
                onClipboard={(event) => {
                  console.log('📋 VNC PREVIEW: Clipboard received from server:', event);
                }}
                className="zw-vnc-container"
              />
            ) : zoneDetails.configuration?.zonepath ? (
              <img
                src={`/api/servers/${encodeURIComponent(currentServer.hostname)}:${currentServer.port}/zones/${encodeURIComponent(selectedZone)}/screenshot`}
                alt={`Screenshot of ${selectedZone}`}
                className="zw-console-screenshot"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextElementSibling.style.display = 'flex';
                }}
                onLoad={(e) => {
                  if (e.target.nextElementSibling) {
                    e.target.nextElementSibling.style.display = 'none';
                  }
                }}
              />
            ) : null}
            
            {!(zoneDetails.vnc_session_info?.proxy_url || zoneDetails.vnc_session_info?.console_url) && (
              <div 
                className={zoneDetails.configuration?.zonepath ? 'zw-console-placeholder-none' : 'zw-console-placeholder-hidden'}
              >
                <div className="has-text-centered">
                  <div className="has-margin-bottom-12px">
                    <img 
                      src="/images/startcloud.svg" 
                      alt="Start Console" 
                      className="zw-startup-icon"
                    />
                  </div>
                  <div className="is-size-6 has-text-weight-medium">
                    No Console Session
                  </div>
                  <div className="is-size-7 has-margin-top-6px-opacity-07">
                    Click Console to start session
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      );
    }
  } else {
    // Neither active → Show start buttons (no expand button)
    console.log(`🔍 CONSOLE DISPLAY: Showing inactive console (no sessions)`);
    return (
      <div className="zw-console-container-hidden">
        {/* Inactive Console Header */}
        <div className="has-background-dark has-text-white p-3 is-flex is-justify-content-space-between is-align-items-center">
          <div>
            <h6 className='title is-7 has-text-white mb-1'>Console Management</h6>
            <p className='is-size-7 has-text-white-ter mb-0'>
              No active sessions • Click to start
            </p>
          </div>
          <div className='buttons has-margin-0'>
            <button 
              className='button is-small is-info'
              onClick={async () => {
                console.log(`🚀 START VNC: Starting VNC for preview in ${selectedZone}`);
                try {
                  setLoadingVnc(true);
                  const result = await startVncSession(
                    currentServer.hostname,
                    currentServer.port,
                    currentServer.protocol,
                    selectedZone
                  );
                  
                  if (result.success) {
                    const readinessResult = await waitForVncSessionReady(selectedZone);
                    if (readinessResult.ready) {
                      setZoneDetails(prev => ({
                        ...prev,
                        active_vnc_session: true,
                        vnc_session_info: {
                          ...result.data,
                          ...readinessResult.sessionInfo
                        }
                      }));
                      setActiveConsoleType('vnc');
                    }
                  }
                } catch (error) {
                  console.error('Error starting VNC:', error);
                  setError('Error starting VNC console');
                } finally {
                  setLoadingVnc(false);
                }
              }}
              disabled={loading || loadingVnc}
              title="Start VNC Console"
            >
              <span className='icon is-small'>
                <i className='fas fa-desktop'></i>
              </span>
              <span>{loadingVnc ? 'Starting...' : 'Start VNC'}</span>
            </button>
            <button 
              className='button is-small is-success'
              onClick={async () => {
                if (!currentServer || !selectedZone) return;
                console.log(`🚀 START ZLOGIN: Starting zlogin for preview in ${selectedZone}`);
                try {
                  setLoading(true);
                  const result = await startZloginSessionExplicitly(currentServer, selectedZone);
                  if (result) {
                    setZoneDetails(prev => ({
                      ...prev,
                      zlogin_session: result,
                      active_zlogin_session: true
                    }));
                    setActiveConsoleType('zlogin');
                  }
                } catch (error) {
                  console.error('Error starting zlogin:', error);
                  setError('Error starting zlogin console');
                } finally {
                  setLoading(false);
                }
              }}
              disabled={loading}
              title="Start zlogin Console"
            >
              <span className='icon is-small'>
                <i className='fas fa-terminal'></i>
              </span>
              <span>{loading ? 'Starting...' : 'Start zlogin'}</span>
            </button>
          </div>
        </div>

        {/* Console Content - Inactive State */}
        <div className="zw-inactive-console-content">
          <div className="zw-text-placeholder has-text-centered">
            <div className="has-margin-bottom-12px">
              <img 
                src="/images/startcloud.svg" 
                alt="Start Console" 
                className="zw-startup-icon"
              />
            </div>
            <div className="is-size-6 has-text-weight-medium mb-2">
              <strong>No Active Console Session</strong>
            </div>
            <div className="is-size-7 has-opacity-08">
              Click the buttons above to start VNC or zlogin console
            </div>
          </div>
        </div>
      </div>
    );
  }
};

export default React.memo(ConsoleDisplay);
