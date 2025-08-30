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
  startZloginSession,
  startZloginSessionExplicitly,
  waitForVncSessionReady,
  forceZoneSessionCleanup,
  pasteTextToZone,
  handleVncPreviewPaste,
  handleZloginPreviewPaste,
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
    zloginSessionId: hasZlogin?.id,
    vncSessionInfo: hasVnc ? 'present' : 'absent',
    timestamp: Date.now()
  });

  // FIXED: New logic according to user requirements
  if (hasZlogin && !hasVnc) {
    // Only zlogin active → Show zlogin
    console.log(`🔍 CONSOLE DISPLAY: Showing zlogin console (only zlogin active)`);
    return (
      <div 
        style={{
          border: '2px solid var(--zw-border-light)',
          borderRadius: '6px',
          overflow: 'visible',
          backgroundColor: '#000',
          height: 'calc(100vh - 250px - 10vh)',
          minHeight: '450px'
        }}
      >
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
                console.log(`Toggling preview read-only mode from ${previewReadOnly} to ${!previewReadOnly}`);
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
                  console.log(`✅ UI: zlogin session state cleared for ${selectedZone}`);
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
            {/* FIXED: Preview clipboard button that actually works */}
            <button 
              className='button is-small is-info has-box-shadow'
              onClick={async () => {
                try {
                  const text = await navigator.clipboard.readText();
                  if (text && currentServer && selectedZone) {
                    console.log(`📋 ZLOGIN PREVIEW PASTE: Pasting ${text.length} characters`);
                    await pasteTextToZone(currentServer, selectedZone, text);
                  } else {
                    console.warn('📋 ZLOGIN PREVIEW PASTE: No text or session unavailable');
                  }
                } catch (error) {
                  console.error('📋 ZLOGIN PREVIEW PASTE: Clipboard access error:', error);
                }
              }}
              title="Paste from Browser Clipboard"
            >
              <span className='icon is-small'>
                <i className='fas fa-paste'></i>
              </span>
            </button>
            <button 
              className='button is-small is-primary'
              onClick={() => {
                if (zoneDetails.zlogin_session) {
                  // Session exists - just open modal (don't create new session!)
                  setShowZloginConsole(true);
                } else {
                  // No session - start new one then open modal
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
            {/* Start/Switch to VNC button */}
            <button 
              className='button is-small is-warning has-shadow-medium'
              onClick={async () => {
                // Start VNC session for preview (not modal)
                console.log(`🚀 START VNC: Starting VNC session for preview from zlogin header`);
                try {
                  setLoadingVnc(true);
                  const result = await startVncSession(
                    currentServer.hostname,
                    currentServer.port,
                    currentServer.protocol,
                    selectedZone
                  );
                  
                  if (result.success) {
                    console.log(`✅ START VNC: VNC start API succeeded, waiting for readiness...`);
                    
                    const readinessResult = await waitForVncSessionReady(selectedZone);
                    
                    if (!readinessResult.ready) {
                      console.error(`❌ START VNC: Session not ready: ${readinessResult.reason}`);
                      setError(`VNC session started but not ready: ${readinessResult.reason}`);
                      return;
                    }
                    
                    console.log(`✅ START VNC: VNC session ready, switching to VNC preview`);
                    setZoneDetails(prev => ({
                      ...prev,
                      active_vnc_session: true,
                      vnc_session_info: {
                        ...result.data,
                        ...readinessResult.sessionInfo
                      }
                    }));
                    setActiveConsoleType('vnc');
                  } else {
                    console.error(`❌ START VNC: Failed to start VNC session:`, result.message);
                    setError(`Failed to start VNC console: ${result.message}`);
                  }
                } catch (error) {
                  console.error('💥 START VNC: Error starting VNC session:', error);
                  setError(`Error starting VNC console`);
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
        <div 
          style={{
            position: 'relative',
            width: '100%',
            height: 'calc(100% - 60px)',
            backgroundColor: '#000',
            overflow: 'visible'
          }}
        >
          <ZoneShell 
            key={`preview-zlogin-${selectedZone}-${previewReconnectKey}-${previewReadOnly ? 'ro' : 'rw'}`}
            zoneName={selectedZone} 
            readOnly={previewReadOnly}
            context="preview"
            style={{
              height: '100%',
              width: '100%',
              fontSize: '10px'
            }}
          />
          
          {/* Session Status Indicator */}
          <div 
            style={{
              position: 'absolute',
              top: '8px',
              left: '8px',
              backgroundColor: 'rgba(0, 0, 0, 0.7)',
              color: 'white',
              padding: '4px 8px',
              borderRadius: '3px',
              fontSize: '0.7rem',
              fontWeight: 'bold'
            }}
          >
            <span className='icon is-small has-margin-right-3px'>
              <i className='fas fa-circle' style={{
                color: zoneDetails.zlogin_session ? 'var(--zw-nic-active)' : 'var(--zw-zone-inactive)',
                fontSize: '0.4rem'
              }}></i>
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
      <div 
        style={{
          border: '2px solid var(--zw-border-light)',
          borderRadius: '6px',
          overflow: 'visible',
          backgroundColor: '#000',
          height: 'calc(100vh - 250px - 10vh)',
          minHeight: '450px'
        }}
      >
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
                console.log(`Toggling preview VNC read-only mode from ${previewVncViewOnly} to ${!previewVncViewOnly}`);
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
            {/* FIXED: Preview clipboard button that actually works */}
            <button 
              className='button is-small is-info has-shadow-medium'
              onClick={async () => {
                try {
                  const text = await navigator.clipboard.readText();
                  if (text && previewVncRef.current?.clipboardPaste) {
                    console.log(`📋 VNC PREVIEW PASTE: Pasting ${text.length} characters`);
                    previewVncRef.current.clipboardPaste(text);
                  } else {
                    console.warn('📋 VNC PREVIEW PASTE: No text or VNC ref unavailable');
                  }
                } catch (error) {
                  console.error('📋 VNC PREVIEW PASTE: Clipboard access error:', error);
                }
              }}
              title="Paste from Browser Clipboard"
            >
              <span className='icon is-small'>
                <i className='fas fa-paste'></i>
              </span>
            </button>
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
            {/* Start/Switch to zlogin button */}
            <button 
              className='button is-small is-warning has-shadow-medium'
              onClick={async () => {
                // Start zlogin session for preview (not modal)
                console.log(`🚀 START ZLOGIN: Starting zlogin session for preview from VNC header`);
                try {
                  setLoading(true);
                  const result = await startZloginSessionExplicitly(currentServer, selectedZone);
                  
                  if (result) {
                    console.log(`✅ START ZLOGIN: zlogin session started, switching to zlogin preview`);
                    setZoneDetails(prev => ({
                      ...prev,
                      zlogin_session: result,
                      active_zlogin_session: true
                    }));
                    setActiveConsoleType('zlogin');
                  } else {
                    console.error(`❌ START ZLOGIN: Failed to start zlogin session`);
                    setError(`Failed to start zlogin console`);
                  }
                } catch (error) {
                  console.error('💥 START ZLOGIN: Error starting zlogin session:', error);
                  setError(`Error starting zlogin console`);
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
        <div 
          style={{
            position: 'relative',
            width: '100%',
            height: 'calc(100% - 60px)',
            backgroundColor: '#000',
            overflow: 'visible'
          }}
        >
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
              style={{ width: '100%', height: '100%' }}
            />
          ) : (
            <div 
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#2c3e50',
                color: '#ecf0f1'
              }}
            >
              <div className="has-text-centered">
                <div className="has-margin-bottom-12px">
                  <img 
                    src="/images/startcloud.svg" 
                    alt="Start Console" 
                    style={{ 
                      width: '64px', 
                      height: '64px',
                      opacity: 0.8,
                      filter: 'brightness(0.9)'
                    }} 
                  />
                </div>
                <div className="is-size-6 has-text-weight-medium">
                  VNC Session Starting...
                </div>
                <div className="is-size-7 has-margin-top-6px-opacity-07">
                  Please wait while the session initializes
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  } else if (hasVnc && hasZlogin) {
    // Both active → Show VNC by default, allow switching via activeConsoleType
    console.log(`🔍 CONSOLE DISPLAY: Both sessions active, showing ${activeConsoleType === 'zlogin' ? 'zlogin' : 'VNC'}`);
    
    if (activeConsoleType === 'zlogin') {
      // Show zlogin (user switched to it)
      return (
        <div 
          style={{
            border: '2px solid var(--zw-border-light)',
            borderRadius: '6px',
            overflow: 'visible',
            backgroundColor: '#000',
            height: 'calc(100vh - 250px - 10vh)',
            minHeight: '450px'
          }}
        >
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
                  console.log(`Toggling preview read-only mode from ${previewReadOnly} to ${!previewReadOnly}`);
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
                    console.log(`✅ UI: zlogin session state cleared for ${selectedZone}`);
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
              {/* FIXED: Preview clipboard button that actually works */}
              <button 
                className='button is-small is-info has-box-shadow'
                onClick={async () => {
                  try {
                    const text = await navigator.clipboard.readText();
                    if (text && currentServer && selectedZone) {
                      console.log(`📋 ZLOGIN PREVIEW PASTE: Pasting ${text.length} characters`);
                      await pasteTextToZone(currentServer, selectedZone, text);
                    } else {
                      console.warn('📋 ZLOGIN PREVIEW PASTE: No text or session unavailable');
                    }
                  } catch (error) {
                    console.error('📋 ZLOGIN PREVIEW PASTE: Clipboard access error:', error);
                  }
                }}
                title="Paste from Browser Clipboard"
              >
                <span className='icon is-small'>
                  <i className='fas fa-paste'></i>
                </span>
              </button>
              <button 
                className='button is-small is-primary'
                onClick={() => {
                  if (zoneDetails.zlogin_session) {
                    // Session exists - just open modal (don't create new session!)
                    setShowZloginConsole(true);
                  } else {
                    // No session - start new one then open modal
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
              {/* Switch to VNC button */}
              <button 
                className='button is-small is-warning has-shadow-medium'
                onClick={() => {
                  // VNC already active - just switch to it in preview
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
          <div 
            style={{
              position: 'relative',
              width: '100%',
              height: 'calc(100% - 60px)',
              backgroundColor: '#000',
              overflow: 'visible'
            }}
          >
            <ZoneShell 
              key={`preview-zlogin-${selectedZone}-${previewReconnectKey}-${previewReadOnly ? 'ro' : 'rw'}`}
              zoneName={selectedZone} 
              readOnly={previewReadOnly}
              context="preview"
              style={{
                height: '100%',
                width: '100%',
                fontSize: '10px'
              }}
            />
            
            {/* Session Status Indicator */}
            <div 
              style={{
                position: 'absolute',
                top: '8px',
                left: '8px',
                backgroundColor: 'rgba(0, 0, 0, 0.7)',
                color: 'white',
                padding: '4px 8px',
                borderRadius: '3px',
                fontSize: '0.7rem',
                fontWeight: 'bold'
              }}
            >
              <span className='icon is-small has-margin-right-3px'>
                <i className='fas fa-circle' style={{
                  color: zoneDetails.zlogin_session ? 'var(--zw-nic-active)' : 'var(--zw-zone-inactive)',
                  fontSize: '0.4rem'
                }}></i>
              </span>
              {zoneDetails.zlogin_session ? 'Live' : 'Offline'}
            </div>
          </div>
        </div>
      );
    } else {
      // Show VNC (default when both active)
      return (
        <div 
          style={{
            border: '2px solid var(--zw-border-light)',
            borderRadius: '6px',
            overflow: 'visible',
            backgroundColor: '#000',
            height: 'calc(100vh - 250px - 10vh)',
            minHeight: '450px'
          }}
        >
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
                  console.log(`Toggling preview VNC read-only mode from ${previewVncViewOnly} to ${!previewVncViewOnly}`);
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
              {/* FIXED: Preview clipboard button that actually works */}
              <button 
                className='button is-small is-info has-shadow-medium'
                onClick={async () => {
                  try {
                    const text = await navigator.clipboard.readText();
                    if (text && previewVncRef.current?.clipboardPaste) {
                      console.log(`📋 VNC PREVIEW PASTE: Pasting ${text.length} characters`);
                      previewVncRef.current.clipboardPaste(text);
                    } else {
                      console.warn('📋 VNC PREVIEW PASTE: No text or VNC ref unavailable');
                    }
                  } catch (error) {
                    console.error('📋 VNC PREVIEW PASTE: Clipboard access error:', error);
                  }
                }}
                title="Paste from Browser Clipboard"
              >
                <span className='icon is-small'>
                  <i className='fas fa-paste'></i>
                </span>
              </button>
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
              {/* Switch to zlogin button */}
              <button 
                className='button is-small is-warning has-shadow-medium'
                onClick={() => {
                  // zlogin already active - just switch to it in preview
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
          <div 
            style={{
              position: 'relative',
              width: '100%',
              height: 'calc(100% - 60px)',
              backgroundColor: '#000',
              overflow: 'visible'
            }}
          >
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
              style={{ width: '100%', height: '100%' }}
            />
          </div>
        </div>
      );
    }
  } else {
    // Neither active → Show start buttons (no expand button)
    console.log(`🔍 CONSOLE DISPLAY: Showing inactive console (no sessions)`);
    return (
      <div 
        style={{
          border: '2px solid var(--zw-border-light)',
          borderRadius: '6px',
          overflow: 'hidden',
          backgroundColor: '#000',
          height: 'calc(100vh - 250px - 10vh)',
          minHeight: '450px'
        }}
      >
        {/* Inactive Console Header */}
        <div className="has-background-dark has-text-white p-3 is-flex is-justify-content-space-between is-align-items-center">
          <div>
            <h6 className='title is-7 has-text-white mb-1'>Console Management</h6>
            <p className='is-size-7 has-text-white-ter mb-0'>
              No active sessions • Click to start
            </p>
          </div>
          <div className='buttons has-margin-0'>
            {/* FIXED: Start buttons that work in preview, not modal */}
            <button 
              className='button is-small is-info'
              onClick={async () => {
                console.log(`🚀 START VNC: Starting VNC session for preview in ${selectedZone}`);
                try {
                  setLoadingVnc(true);
                  const result = await startVncSession(
                    currentServer.hostname,
                    currentServer.port,
                    currentServer.protocol,
                    selectedZone
                  );
                  
                  if (result.success) {
                    console.log(`✅ START VNC: VNC start API succeeded, waiting for readiness...`);
                    
                    const readinessResult = await waitForVncSessionReady(selectedZone);
                    
                    if (!readinessResult.ready) {
                      console.error(`❌ START VNC: Session not ready: ${readinessResult.reason}`);
                      setError(`VNC session started but not ready: ${readinessResult.reason}`);
                      return;
                    }
                    
                    console.log(`✅ START VNC: VNC session ready, switching to VNC preview for ${selectedZone}`);
                    setZoneDetails(prev => ({
                      ...prev,
                      active_vnc_session: true,
                      vnc_session_info: {
                        ...result.data,
                        ...readinessResult.sessionInfo
                      }
                    }));
                    setActiveConsoleType('vnc');
                  } else {
                    console.error(`❌ START VNC: Failed to start VNC session:`, result.message);
                    setError(`Failed to start VNC console: ${result.message}`);
                  }
                } catch (error) {
                  console.error('💥 START VNC: Error starting VNC session:', error);
                  setError(`Error starting VNC console`);
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
                console.log(`🚀 START ZLOGIN: Starting zlogin session for preview in ${selectedZone}`);
                try {
                  setLoading(true);
                  const result = await startZloginSessionExplicitly(currentServer, selectedZone);
                  
                  if (result) {
                    console.log(`✅ START ZLOGIN: Session started, updating UI for ${selectedZone}`);
                    setZoneDetails(prev => ({
                      ...prev,
                      zlogin_session: result,
                      active_zlogin_session: true
                    }));
                    setActiveConsoleType('zlogin');
                  } else {
                    console.error(`❌ START ZLOGIN: Failed to start zlogin session`);
                    setError(`Failed to start zlogin console`);
                  }
                } catch (error) {
                  console.error('💥 START ZLOGIN: Error starting zlogin session:', error);
                  setError(`Error starting zlogin console`);
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
        <div 
          style={{
            position: 'relative',
            width: '100%',
            height: 'calc(100% - 60px)',
            backgroundColor: '#2c3e50',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden'
          }}
        >
          <div className="zw-text-placeholder has-text-centered">
            <div className="has-margin-bottom-12px">
              <img 
                src="/images/startcloud.svg" 
                alt="Start Console" 
                style={{ 
                  width: '64px', 
                  height: '64px',
                  opacity: 0.8,
                  filter: 'brightness(0.9)'
                }} 
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
