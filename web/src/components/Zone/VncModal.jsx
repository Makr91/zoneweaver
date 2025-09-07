import React from 'react';
import VncViewerReact from '../VncViewerReact';
import VncActionsDropdown from '../VncActionsDropdown';

const VncModal = ({
  showVncConsole,
  closeVncConsole,
  isVncFullScreen,
  openVncFullScreen,
  vncLoadError,
  openDirectVncFallback,
  setVncLoadError,
  currentServer,
  selectedZone,
  vncReconnectKey,
  modalVncRef,
  modalVncViewOnly,
  setModalVncViewOnly,
  handleVncModalPaste,
  handleVncConsole,
  handleKillVncSession,
  user,
  zoneDetails,
  setShowZloginConsole,
  handleZloginConsole,
  loading,
  loadingVnc,
  vncSettings,
  handleVncQualityChange,
  handleVncCompressionChange,
  handleVncResizeChange,
  handleVncShowDotChange,
  handleVncClipboardPaste
}) => {
  if (!showVncConsole) {
    return null;
  }

  return (
    <div className='modal is-active has-z-index-modal'>
      <div className='modal-background' onClick={closeVncConsole}></div>
      <div 
        className={isVncFullScreen ? 'zw-modal-container-fullscreen' : 'zw-modal-container-normal'}
      >
        <header 
          className={`modal-card-head ${isVncFullScreen ? 'zw-modal-header-fullscreen' : 'zw-modal-header-normal'}`}
        >
          <p 
            className={`modal-card-title ${isVncFullScreen ? 'zw-modal-title-fullscreen' : 'zw-modal-title-normal'}`}
          >
            <span className='icon-text'>
              <span className='icon is-small'>
                <i className='fas fa-terminal'></i>
              </span>
              <span>Console - {selectedZone}</span>
            </span>
          </p>
          <div className='buttons m-0'>
            <VncActionsDropdown
              vncRef={modalVncRef}
              variant="button"
              onToggleReadOnly={() => {
                // FIXED: Actually toggle modal VNC view-only mode
                console.log(`🔧 VNC MODAL READ-ONLY: Toggling from ${modalVncViewOnly} to ${!modalVncViewOnly}`);
                setModalVncViewOnly(!modalVncViewOnly);
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
              isReadOnly={modalVncViewOnly}
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
            {!modalVncViewOnly && (
              <button 
                className='button is-small is-info'
                onClick={handleVncModalPaste}
                title="Paste from Browser Clipboard"
              >
                <span className='icon is-small'>
                  <i className='fas fa-paste'></i>
                </span>
              </button>
            )}
            <button 
              className='button is-small is-warning'
              onClick={async () => {
                if (zoneDetails.zlogin_session) {
                  closeVncConsole();
                  setTimeout(() => setShowZloginConsole(true), 100);
                } else {
                  closeVncConsole();
                  const result = await handleZloginConsole(selectedZone);
                  if (!result.success) {
                    // Handle error appropriately
                  }
                }
              }}
              disabled={loading}
              title={zoneDetails.zlogin_session ? "Switch to zlogin Console" : "Start zlogin Console"}
            >
              <span className='icon is-small'>
                <i className={`fas ${loading ? 'fa-spinner fa-pulse' : 'fa-terminal'}`}></i>
              </span>
              <span>{loading ? 'Starting...' : 'zlogin'}</span>
            </button>
            <button 
              className='button is-small is-info'
              onClick={openVncFullScreen}
              title={isVncFullScreen ? "Exit Full Screen" : "Enter Full Screen"}
            >
              <span className='icon'>
                <i className={`fas ${isVncFullScreen ? 'fa-compress' : 'fa-expand'}`}></i>
              </span>
              <span>{isVncFullScreen ? 'Exit' : 'Full'}</span>
            </button>
            <button 
              className='button is-small'
              onClick={closeVncConsole}
              title="Close Console"
            >
              <span className='icon'>
                <i className='fas fa-times'></i>
              </span>
              <span>Close</span>
            </button>
          </div>
        </header>
        <section 
          className='modal-card-body p-0 zw-modal-body'
        >
          {vncLoadError ? (
            <div className='has-text-centered p-6 zw-error-container'>
              <div className='icon is-large mb-3'>
                <i className='fas fa-exclamation-triangle fa-3x has-text-warning'></i>
              </div>
              <h4 className='title is-4'>VNC Console Loading Error</h4>
              <p className='mb-4'>The VNC console failed to load in embedded mode. This could be due to proxy issues or browser compatibility.</p>
              <div className='buttons is-centered'>
                <button className='button is-warning' onClick={openDirectVncFallback}>
                  <span className='icon'>
                    <i className='fas fa-external-link-alt'></i>
                  </span>
                  <span>Open Direct VNC Console</span>
                </button>
                <button className='button' onClick={() => setVncLoadError(false)}>
                  <span className='icon'>
                    <i className='fas fa-redo'></i>
                  </span>
                  <span>Retry Embedded</span>
                </button>
              </div>
            </div>
          ) : currentServer && selectedZone ? (
            <VncViewerReact
              ref={modalVncRef}
              key={`vnc-modal-${selectedZone}-${modalVncViewOnly}-${vncReconnectKey}`}
              serverHostname={currentServer.hostname}
              serverPort={currentServer.port}
              serverProtocol={currentServer.protocol}
              zoneName={selectedZone}
              viewOnly={modalVncViewOnly}
              autoConnect={true}
              showControls={false}
              quality={vncSettings.quality}
              compression={vncSettings.compression}
              resize={vncSettings.resize}
              showDot={vncSettings.showDot}
              resizeSession={vncSettings.resize === 'remote'}
              onConnect={() => console.log('✅ VNC MODAL: Connected to VNC server')}
              onDisconnect={(reason) => console.log('❌ VNC MODAL: Disconnected:', reason)}
              onClipboard={(event) => {
                console.log('📋 VNC MODAL: Clipboard received from server:', event);
              }}
              className="zw-vnc-container"
            />
          ) : loadingVnc ? (
            <div className='has-text-centered p-6 zw-loading-container'>
              <div className='icon is-large'>
                <i className='fas fa-spinner fa-pulse fa-3x zw-loading-spinner'></i>
              </div>
              <p className='mt-3'>Starting VNC console...</p>
            </div>
          ) : null}
        </section>
      </div>
    </div>
  );
};

export default VncModal;
