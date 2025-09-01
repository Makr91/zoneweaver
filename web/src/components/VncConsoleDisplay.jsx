import React from 'react';
import VncViewerReact from './VncViewerReact';
import VncActionsDropdown from './VncActionsDropdown';

const VncConsoleDisplay = ({
  zoneDetails,
  selectedZone,
  currentServer,
  user,
  loading,
  loadingVnc,
  previewVncViewOnly,
  vncReconnectKey,
  vncSettings,
  vncRef,
  hasZlogin,
  setLoading,
  setError,
  setPreviewVncViewOnly,
  setZoneDetails,
  setActiveConsoleType,
  startZloginSessionExplicitly,
  handleVncConsole,
  handleKillVncSession,
  handleVncQualityChange,
  handleVncCompressionChange,
  handleVncResizeChange,
  handleVncShowDotChange,
  handleVncClipboardPaste
}) => {
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
        <div className='buttons m-0'>
          <VncActionsDropdown
            vncRef={vncRef}
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
          />
          {!previewVncViewOnly && (
            <button 
              className='button is-small is-info'
              onClick={async () => {
                try {
                  const text = await navigator.clipboard.readText();
                  if (text && vncRef.current?.clipboardPaste) {
                    console.log(`📋 VNC PREVIEW PASTE: Pasting ${text.length} characters`);
                    vncRef.current.clipboardPaste(text);
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
          {hasZlogin ? (
            <button 
              className='button is-small is-warning'
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
          ) : (
            <button 
              className='button is-small is-warning'
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
          )}
        </div>
      </div>

      {/* VNC Console Content */}
      <div className="zw-console-content">
        {zoneDetails.vnc_session_info ? (
          <VncViewerReact
            ref={vncRef}
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
              <div className="is-size-7 mt-6 opacity-07">
                Click Console to start session
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default React.memo(VncConsoleDisplay);
