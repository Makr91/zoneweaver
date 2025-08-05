import React, { useState, useRef } from 'react';

/**
 * VNC Viewer Component - Uses iframe for complete isolation
 * All noVNC functionality runs in isolated iframe context
 */
const VncViewer = ({ 
  serverHostname, 
  serverPort, 
  serverProtocol = 'https',
  zoneName, 
  viewOnly = false,
  autoConnect = true,
  quality = 6,
  compression = 2,
  resize = 'scale',
  showDot = false,
  onConnect = null,
  onDisconnect = null,
  style = {},
  className = ''
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const iframeRef = useRef(null);

  // Validate required parameters
  if (!serverHostname || !zoneName) {
    return (
      <div className={`vnc-viewer-error ${className}`} style={style}>
        <div className="notification is-danger">
          <h4 className="title is-5">VNC Console Error</h4>
          <p>Missing required parameters: serverHostname and zoneName</p>
        </div>
      </div>
    );
  }

  // Build noVNC parameters - same as before but cleaner
  const vncParams = new URLSearchParams({
    resize,
    quality: quality.toString(),
    compression: compression.toString(),
    show_dot: showDot ? 'true' : 'false',
    autoconnect: autoConnect ? '1' : '0',
    view_only: viewOnly ? '1' : '0',
    host: window.location.hostname,
    port: window.location.port || (window.location.protocol === 'https:' ? '443' : '80'),
    path: `api/servers/${encodeURIComponent(serverHostname)}:${serverPort}/zones/${encodeURIComponent(zoneName)}/vnc/websockify`,
    encrypt: window.location.protocol === 'https:' ? '1' : '0'
  });

  // Build VNC console URL
  const vncUrl = `/api/servers/${encodeURIComponent(serverHostname)}:${serverPort}/zones/${encodeURIComponent(zoneName)}/vnc/console?${vncParams.toString()}`;

  console.log(`🖥️ VNC IFRAME: Loading VNC console: ${vncUrl}`);

  const handleIframeLoad = () => {
    console.log('✅ VNC IFRAME: VNC console loaded successfully');
    setLoading(false);
    setError('');
    
    if (onConnect) {
      onConnect();
    }
  };

  const handleIframeError = () => {
    console.error('❌ VNC IFRAME: Failed to load VNC console');
    setError('Failed to load VNC console');
    setLoading(false);
    
    if (onDisconnect) {
      onDisconnect({ clean: false, code: 1006, reason: 'Failed to load' });
    }
  };

  const refresh = () => {
    setLoading(true);
    setError('');
    if (iframeRef.current) {
      iframeRef.current.src = iframeRef.current.src; // Force reload
    }
  };

  if (error) {
    return (
      <div className={`vnc-viewer-error ${className}`} style={style}>
        <div className="notification is-danger">
          <h4 className="title is-5">VNC Console Error</h4>
          <p>{error}</p>
          <div className="buttons mt-3">
            <button className="button is-primary" onClick={refresh}>
              <span className="icon">
                <i className="fas fa-redo"></i>
              </span>
              <span>Retry</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`vnc-viewer ${className}`} style={style}>
      {loading && (
        <div className="vnc-viewer-loading" style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#2c3e50',
          zIndex: 10
        }}>
          <div className="has-text-centered" style={{ color: '#ecf0f1' }}>
            <div className="icon is-large">
              <i className="fas fa-spinner fa-pulse fa-2x" style={{ color: '#95a5a6' }}></i>
            </div>
            <p className="mt-2">Loading VNC Console...</p>
          </div>
        </div>
      )}
      
      <iframe
        ref={iframeRef}
        src={vncUrl}
        title={`VNC Console - ${zoneName}`}
        style={{
          width: '100%',
          height: '100%',
          border: 'none',
          display: 'block'
        }}
        sandbox="allow-scripts allow-same-origin allow-forms"
        onLoad={handleIframeLoad}
        onError={handleIframeError}
        allow="fullscreen"
      />
    </div>
  );
};

export default VncViewer;
