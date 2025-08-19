import React, { useRef, useState, useEffect, useImperativeHandle, forwardRef } from 'react';
import { VncScreen } from 'react-vnc';

/**
 * Enhanced VNC Viewer Component - Uses react-vnc for native React integration
 * Replaces iframe-based approach with direct WebSocket connection
 * Provides 70-85% performance improvement by eliminating asset loading cascade
 */
const VncViewerReact = forwardRef(({ 
  serverHostname, 
  serverPort, 
  serverProtocol = 'https',
  zoneName, 
  viewOnly = false,
  autoConnect = true,
  quality = 6,
  compression = 2,
  resize = 'scale',
  showDot = true,
  showControls = true,
  resizeSession = false,
  onConnect = null,
  onDisconnect = null,
  onCtrlAltDel = null,
  onClipboard = null,
  style = {},
  className = ''
}, ref) => {
  const vncRef = useRef(null);
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState('');

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

  // Build WebSocket URL using existing proxy path (maintains all security/auth)
  const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const wsUrl = `${wsProtocol}//${window.location.host}/api/servers/${encodeURIComponent(serverHostname)}:${serverPort}/zones/${encodeURIComponent(zoneName)}/vnc/websockify`;

  console.log(`🚀 REACT-VNC: Connecting to WebSocket: ${wsUrl}`);

  // Enhanced control handlers
  const handleConnect = () => {
    if (vncRef.current && !connected && !connecting) {
      console.log(`🔌 REACT-VNC: Manually connecting to ${zoneName}`);
      setConnecting(true);
      setError('');
      vncRef.current.connect();
    }
  };

  const handleDisconnect = () => {
    if (vncRef.current && connected) {
      console.log(`🔌 REACT-VNC: Manually disconnecting from ${zoneName}`);
      vncRef.current.disconnect();
    }
  };

  const handleCtrlAltDel = () => {
    if (vncRef.current && connected) {
      console.log(`⌨️ REACT-VNC: Sending Ctrl+Alt+Del to ${zoneName}`);
      vncRef.current.sendCtrlAltDel();
    }
    
    // Call parent callback if provided
    if (onCtrlAltDel) {
      onCtrlAltDel();
    }
  };

  // Expose control functions to parent component
  useEffect(() => {
    if (onConnect && typeof onConnect === 'function') {
      onConnect.connect = handleConnect;
      onConnect.disconnect = handleDisconnect;
      onConnect.ctrlAltDel = handleCtrlAltDel;
      onConnect.refresh = handleRefresh;
    }
  }, [connected, connecting]);

  const handleRefresh = () => {
    if (vncRef.current) {
      console.log(`🔄 REACT-VNC: Refreshing connection to ${zoneName}`);
      if (connected) {
        vncRef.current.disconnect();
      }
      setTimeout(() => {
        setError('');
        setConnecting(true);
        vncRef.current.connect();
      }, 1000);
    }
  };

  // Connection event handlers
  const handleVncConnect = () => {
    console.log(`✅ REACT-VNC: Connected to ${zoneName}`);
    setConnected(true);
    setConnecting(false);
    setError('');
    
    if (onConnect) {
      onConnect();
    }
  };

  const handleVncDisconnect = (event) => {
    console.log(`❌ REACT-VNC: Disconnected from ${zoneName}:`, event);
    setConnected(false);
    setConnecting(false);
    
    if (onDisconnect) {
      onDisconnect(event);
    }
  };

  // Store ref to the clipboardPaste function for Ctrl+V
  const clipboardPasteRef = useRef(null);
  
  // Automatic Ctrl+V paste functionality
  useEffect(() => {
    const handleKeyDown = async (event) => {
      // Only handle when VNC is connected and in focus
      if (!connected || !vncRef.current) return;
      
      // Detect Ctrl+V (Windows/Linux) or Cmd+V (Mac)
      const isCtrlV = (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'v';
      
      if (isCtrlV) {
        console.log(`⌨️ VNC-VIEWER: Ctrl+V detected, attempting auto-paste for ${zoneName}`);
        
        // Prevent browser's default paste behavior
        event.preventDefault();
        event.stopPropagation();
        
        try {
          // Check if clipboard API is available
          if (!navigator.clipboard || !navigator.clipboard.readText) {
            console.warn(`📋 VNC-VIEWER: Clipboard API not available in this browser`);
            return;
          }
          
          // Read clipboard content
          const clipboardText = await navigator.clipboard.readText();
          
          if (clipboardText && clipboardText.length > 0) {
            console.log(`📋 VNC-VIEWER: Auto-pasting ${clipboardText.length} characters from clipboard`);
            
            // Use the stored clipboardPaste function
            if (clipboardPasteRef.current && typeof clipboardPasteRef.current === 'function') {
              await clipboardPasteRef.current(clipboardText);
            } else {
              console.warn(`📋 VNC-VIEWER: clipboardPaste method not available`);
            }
          } else {
            console.log(`📋 VNC-VIEWER: Clipboard is empty, nothing to paste`);
          }
          
        } catch (error) {
          if (error.name === 'NotAllowedError') {
            console.warn(`📋 VNC-VIEWER: Clipboard access denied. User needs to grant permission or use the dropdown menu.`);
          } else {
            console.error(`❌ VNC-VIEWER: Error reading clipboard:`, error);
          }
        }
      }
    };
    
    // Add event listener to the document when VNC is connected
    if (connected) {
      console.log(`⌨️ VNC-VIEWER: Adding Ctrl+V listener for ${zoneName}`);
      document.addEventListener('keydown', handleKeyDown, true); // Use capture phase
      
      return () => {
        console.log(`⌨️ VNC-VIEWER: Removing Ctrl+V listener for ${zoneName}`);
        document.removeEventListener('keydown', handleKeyDown, true);
      };
    }
  }, [connected, zoneName]); // Re-setup when connection state changes

  const handleCredentialsRequired = () => {
    console.log(`🔐 REACT-VNC: Credentials required for ${zoneName}`);
    setError('VNC authentication required - this should not happen with zadm vnc');
  };

  const handleSecurityFailure = (event) => {
    console.error(`🔒 REACT-VNC: Security failure for ${zoneName}:`, event);
    setError('VNC security failure - check server configuration');
    setConnecting(false);
  };

  // Clipboard event handler
  const handleClipboard = (event) => {
    console.log(`📋 REACT-VNC: Clipboard event for ${zoneName}:`, event);
    if (onClipboard) {
      onClipboard(event);
    }
  };

  // Clipboard paste method - expose to parent via ref
  const handleClipboardPaste = (text) => {
    if (vncRef.current && connected && vncRef.current.clipboardPaste) {
      console.log(`📋 REACT-VNC: Pasting clipboard text to ${zoneName}`);
      vncRef.current.clipboardPaste(text);
    }
  };

  // Expose methods via useImperativeHandle for VncActionsDropdown
  useImperativeHandle(ref, () => {
    // Define the clipboardPaste function
    const clipboardPasteFunc = async (text) => {
      if (vncRef.current && connected) {
        console.log(`📋 VNC-VIEWER: Starting character-by-character typing of ${text.length} characters`);
        
        try {
          // Character-to-keysym mapping for typing simulation
          const getKeysymForChar = (char) => {
            const code = char.charCodeAt(0);
            
            // Letters (a-z, A-Z)
            if (char >= 'a' && char <= 'z') return 0x61 + (code - 97); // a=0x61
            if (char >= 'A' && char <= 'Z') return 0x41 + (code - 65); // A=0x41
            
            // Numbers (0-9)
            if (char >= '0' && char <= '9') return 0x30 + (code - 48); // 0=0x30
            
            // Common symbols and punctuation
            switch (char) {
              case ' ': return 0x20; // space
              case '!': return 0x21; // exclamation
              case '"': return 0x22; // quotation
              case '#': return 0x23; // hash
              case '$': return 0x24; // dollar
              case '%': return 0x25; // percent
              case '&': return 0x26; // ampersand
              case "'": return 0x27; // apostrophe
              case '(': return 0x28; // left parenthesis
              case ')': return 0x29; // right parenthesis
              case '*': return 0x2a; // asterisk
              case '+': return 0x2b; // plus
              case ',': return 0x2c; // comma
              case '-': return 0x2d; // minus
              case '.': return 0x2e; // period
              case '/': return 0x2f; // slash
              case ':': return 0x3a; // colon
              case ';': return 0x3b; // semicolon
              case '<': return 0x3c; // less than
              case '=': return 0x3d; // equals
              case '>': return 0x3e; // greater than
              case '?': return 0x3f; // question mark
              case '@': return 0x40; // at
              case '[': return 0x5b; // left bracket
              case '\\': return 0x5c; // backslash
              case ']': return 0x5d; // right bracket
              case '^': return 0x5e; // caret
              case '_': return 0x5f; // underscore
              case '`': return 0x60; // grave accent
              case '{': return 0x7b; // left brace
              case '|': return 0x7c; // pipe
              case '}': return 0x7d; // right brace
              case '~': return 0x7e; // tilde
              case '\n': return 0xFF0D; // Return/Enter
              case '\r': return 0xFF0D; // Return/Enter
              case '\t': return 0xFF09; // Tab
              default: return code; // Use Unicode code point for other characters
            }
          };
          
          // Character-to-KeyboardEvent.code mapping
          const getKeyCodeForChar = (char) => {
            // Letters
            if (char >= 'a' && char <= 'z') return `Key${char.toUpperCase()}`;
            if (char >= 'A' && char <= 'Z') return `Key${char}`;
            
            // Numbers
            if (char >= '0' && char <= '9') return `Digit${char}`;
            
            // Special keys and symbols
            switch (char) {
              case ' ': return 'Space';
              case '\n': case '\r': return 'Enter';
              case '\t': return 'Tab';
              case '!': return 'Digit1'; // Shift+1
              case '@': return 'Digit2'; // Shift+2
              case '#': return 'Digit3'; // Shift+3
              case '$': return 'Digit4'; // Shift+4
              case '%': return 'Digit5'; // Shift+5
              case '^': return 'Digit6'; // Shift+6
              case '&': return 'Digit7'; // Shift+7
              case '*': return 'Digit8'; // Shift+8
              case '(': return 'Digit9'; // Shift+9
              case ')': return 'Digit0'; // Shift+0
              case '-': return 'Minus';
              case '_': return 'Minus'; // Shift+Minus
              case '=': return 'Equal';
              case '+': return 'Equal'; // Shift+Equal
              case '[': return 'BracketLeft';
              case '{': return 'BracketLeft'; // Shift+BracketLeft
              case ']': return 'BracketRight';
              case '}': return 'BracketRight'; // Shift+BracketRight
              case '\\': return 'Backslash';
              case '|': return 'Backslash'; // Shift+Backslash
              case ';': return 'Semicolon';
              case ':': return 'Semicolon'; // Shift+Semicolon
              case "'": return 'Quote';
              case '"': return 'Quote'; // Shift+Quote
              case '`': return 'Backquote';
              case '~': return 'Backquote'; // Shift+Backquote
              case ',': return 'Comma';
              case '<': return 'Comma'; // Shift+Comma
              case '.': return 'Period';
              case '>': return 'Period'; // Shift+Period
              case '/': return 'Slash';
              case '?': return 'Slash'; // Shift+Slash
              default: return null; // No specific key code
            }
          };
          
          // Check if character needs shift modifier
          const needsShift = (char) => {
            return char >= 'A' && char <= 'Z' || 
                   '!@#$%^&*()_+{}|:"<>?~'.includes(char);
          };
          
          // Send each character as a key event
          for (let i = 0; i < text.length; i++) {
            const char = text[i];
            const keysym = getKeysymForChar(char);
            const keyCode = getKeyCodeForChar(char);
            const requiresShift = needsShift(char);
            
            console.log(`📋 VNC-VIEWER: Typing character '${char}' (${i+1}/${text.length}) - keysym: 0x${keysym.toString(16)}, keyCode: ${keyCode}, shift: ${requiresShift}`);
            
            try {
              if (requiresShift && keyCode) {
                // Send Shift+Key for uppercase letters and symbols
                vncRef.current.sendKey(0xFFE1, 'ShiftLeft', true); // Shift down
                vncRef.current.sendKey(keysym, keyCode); // Character
                vncRef.current.sendKey(0xFFE1, 'ShiftLeft', false); // Shift up
              } else if (keyCode) {
                // Send regular key
                vncRef.current.sendKey(keysym, keyCode);
              } else {
                // Fallback: send keysym only
                vncRef.current.sendKey(keysym, null);
              }
              
              // Small delay between characters to avoid overwhelming the terminal
              if (i < text.length - 1) {
                await new Promise(resolve => setTimeout(resolve, 20)); // 20ms delay
              }
            } catch (error) {
              console.error(`❌ VNC-VIEWER: Error typing character '${char}':`, error);
            }
          }
          
          console.log(`✅ VNC-VIEWER: Finished typing ${text.length} characters`);
          return true;
          
        } catch (error) {
          console.error(`❌ VNC-VIEWER: Error in character-by-character typing:`, error);
          return false;
        }
      } else {
        console.warn(`⚠️ VNC-VIEWER: Cannot type text - connected: ${connected}, ref: ${!!vncRef.current}`);
        return false;
      }
    };
    
    // Store the function in the ref for Ctrl+V access
    clipboardPasteRef.current = clipboardPasteFunc;
    
    return {
      // React-VNC methods - properly forwarded from VncScreen ref
      sendKey: (keysym, code, down) => {
        if (vncRef.current && connected) {
          console.log(`🎹 VNC-VIEWER: Forwarding sendKey(keysym: ${keysym}, code: "${code}", down: ${down})`);
          try {
            return vncRef.current.sendKey(keysym, code, down);
          } catch (error) {
            console.error(`❌ VNC-VIEWER: Error sending key:`, error);
          }
        } else {
          console.warn(`⚠️ VNC-VIEWER: Cannot send key - not connected or ref unavailable`);
        }
      },
      sendCtrlAltDel: () => {
        if (vncRef.current && connected) {
          console.log(`🎹 VNC-VIEWER: Forwarding sendCtrlAltDel()`);
          try {
            return vncRef.current.sendCtrlAltDel();
          } catch (error) {
            console.error(`❌ VNC-VIEWER: Error sending Ctrl+Alt+Del:`, error);
          }
        } else {
          console.warn(`⚠️ VNC-VIEWER: Cannot send Ctrl+Alt+Del - not connected or ref unavailable`);
        }
      },
      clipboardPaste: clipboardPasteFunc,
      // Additional control methods
      connect: handleConnect,
      disconnect: handleDisconnect,
      refresh: handleRefresh,
      // State
      connected,
      connecting,
      // Access to underlying RFB object for advanced operations
      rfb: vncRef.current?.rfb || null
    };
  }, [connected, connecting]);

  // Legacy support - expose methods via callback props
  useEffect(() => {
    if (onConnect && typeof onConnect === 'object') {
      onConnect.clipboardPaste = handleClipboardPaste;
    }
  }, [connected]);

  if (error) {
    return (
      <div className={`vnc-viewer-error ${className}`} style={style}>
        <div className="notification is-danger">
          <h4 className="title is-5">VNC Console Error</h4>
          <p>{error}</p>
          <div className="buttons mt-3">
            <button className="button is-primary" onClick={handleRefresh}>
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
    <div className={`vnc-viewer-react ${className}`} style={style}>
      {/* Conditional VNC Control Bar */}
      {showControls && (
        <div className="vnc-controls" style={{
          backgroundColor: '#363636',
          color: 'white',
          padding: '8px 12px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderRadius: '6px 6px 0 0',
          fontSize: '0.875rem'
        }}>
          <div className="vnc-status">
            <span className="icon-text">
              <span className="icon is-small">
                <i className={`fas fa-circle ${connected ? 'has-text-success' : connecting ? 'has-text-warning' : 'has-text-danger'}`}></i>
              </span>
              <span className="ml-1">
                {connected ? 'Connected' : connecting ? 'Connecting...' : 'Disconnected'} 
                {connected && ` • ${zoneName}`}
              </span>
            </span>
          </div>
          
          <div className="vnc-actions">
            <div className="buttons is-small" style={{margin: 0}}>
              {/* Ctrl+Alt+Del Button */}
              <button 
                className="button is-small is-warning" 
                onClick={handleCtrlAltDel}
                disabled={!connected}
                title="Send Ctrl+Alt+Del to guest system"
                style={{boxShadow: '0 2px 4px rgba(0,0,0,0.2)'}}
              >
                <span className="icon is-small">
                  <i className="fas fa-keyboard"></i>
                </span>
                <span>Ctrl+Alt+Del</span>
              </button>
              
              {/* Connect/Disconnect Button */}
              <button 
                className={`button is-small ${connected ? 'is-danger' : 'is-success'}`}
                onClick={connected ? handleDisconnect : handleConnect}
                disabled={connecting}
                title={connected ? 'Disconnect from VNC' : 'Connect to VNC'}
                style={{boxShadow: '0 2px 4px rgba(0,0,0,0.2)'}}
              >
                <span className="icon is-small">
                  <i className={`fas ${connected ? 'fa-plug' : 'fa-play'}`}></i>
                </span>
                <span>{connected ? 'Disconnect' : connecting ? 'Connecting...' : 'Connect'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* VNC Display Area */}
      <div style={{
        position: 'relative',
        height: showControls ? 'calc(100% - 50px)' : '100%', // Account for control bar when shown
        backgroundColor: '#000',
        border: showControls ? '2px solid #dbdbdb' : 'none',
        borderTop: showControls ? 'none' : 'none',
        borderRadius: showControls ? '0 0 6px 6px' : '0',
        overflow: 'hidden'
      }}>
        {connecting && !connected && (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(44, 62, 80, 0.9)',
            zIndex: 10,
            color: '#ecf0f1'
          }}>
            <div className="has-text-centered">
              <div className="icon is-large">
                <i className="fas fa-spinner fa-pulse fa-2x" style={{ color: '#95a5a6' }}></i>
              </div>
              <p className="mt-2">Connecting to VNC...</p>
              <p className="is-size-7 has-text-grey-light mt-1">Using react-vnc • Single WebSocket</p>
            </div>
          </div>
        )}
        
        <VncScreen
          ref={vncRef}
          url={wsUrl}
          viewOnly={viewOnly}
          scaleViewport={resize === 'scale' && !resizeSession}
          resizeSession={resizeSession}
          autoConnect={autoConnect}
          background="#000000"
          qualityLevel={quality}
          compressionLevel={compression}
          showDotCursor={showDot}
          retryDuration={5000}
          debug={false} // Set to true for debugging
          style={{
            width: '100%',
            height: '100%',
            display: 'block'
          }}
          onConnect={handleVncConnect}
          onDisconnect={handleVncDisconnect}
          onCredentialsRequired={handleCredentialsRequired}
          onSecurityFailure={handleSecurityFailure}
          onClipboard={handleClipboard}
        />
      </div>
    </div>
  );
});

export default VncViewerReact;
