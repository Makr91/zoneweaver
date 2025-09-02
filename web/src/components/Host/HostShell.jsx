import React, { useEffect, useState, useCallback, memo, useRef } from 'react';
import { useXTerm } from 'react-xtermjs';
import { FitAddon } from '@xterm/addon-fit';
import { AttachAddon } from '@xterm/addon-attach';
import { WebLinksAddon } from '@xterm/addon-web-links';
import { SerializeAddon } from '@xterm/addon-serialize';
import { ClipboardAddon } from '@xterm/addon-clipboard';
import { SearchAddon } from '@xterm/addon-search';
import { WebglAddon } from '@xterm/addon-webgl';
import { useFooter } from '../../contexts/FooterContext';

const HostShell = () => {
  const { session } = useFooter();
  
  // Use useXTerm hook as requested
  const { instance, ref } = useXTerm({
    options: {
      cursorBlink: true,
      theme: {
        background: '#000000',
        foreground: '#ffffff',
      },
      scrollback: 10000,
      fontSize: 14,
      fontFamily: '"Cascadia Code", Consolas, "Liberation Mono", Menlo, Courier, monospace',
      allowTransparency: false,
      convertEol: false,
    }
  });
  
  // Persistent addon instances to prevent history loss (like working version)
  const fitAddonRef = useRef(null);
  const webLinksAddonRef = useRef(null);
  const serializeAddonRef = useRef(null);
  const clipboardAddonRef = useRef(null);
  const searchAddonRef = useRef(null);
  const webglAddonRef = useRef(null);
  const terminalInstanceRef = useRef(null);
  
  // Terminal history preservation
  const terminalHistoryRef = useRef('');
  
  // Manage addon state like working version
  const [addons, setAddons] = useState([]);
  const [isReady, setIsReady] = useState(false);
  const addonsInitializedRef = useRef(false);

  console.log('🖥️ HOSTSHELL: Render with session:', {
    sessionId: session?.id,
    wsState: session?.websocket?.readyState,
    addonsCount: addons.length,
    isReady,
    hasHistory: terminalHistoryRef.current.length > 0,
    hasInstance: !!instance,
    timestamp: new Date().toISOString()
  });

  // Initialize persistent addons only once (like working version)
  useEffect(() => {
    if (!fitAddonRef.current && !addonsInitializedRef.current) {
      console.log('🖥️ HOSTSHELL: Initializing enhanced addons');
      
      // Core addons
      fitAddonRef.current = new FitAddon();
      webLinksAddonRef.current = new WebLinksAddon();
      
      // Enhanced addons for better UX
      serializeAddonRef.current = new SerializeAddon();
      clipboardAddonRef.current = new ClipboardAddon();
      searchAddonRef.current = new SearchAddon();
      
      // Performance addon (try WebGL, fallback gracefully if not supported)
      try {
        webglAddonRef.current = new WebglAddon();
        console.log('🖥️ HOSTSHELL: WebGL renderer available');
      } catch (error) {
        console.log('🖥️ HOSTSHELL: WebGL not supported, using canvas renderer');
        webglAddonRef.current = null;
      }
      
      addonsInitializedRef.current = true;
    }
  }, []);

  // Store instance reference when ready
  useEffect(() => {
    if (instance) {
      terminalInstanceRef.current = instance;
      console.log('🖥️ HOSTSHELL: Terminal instance ready');
    }
  }, [instance]);

  // Preserve terminal content before WebSocket changes
  const preserveTerminalHistory = useCallback(() => {
    if (serializeAddonRef.current && terminalInstanceRef.current) {
      try {
        const serializedContent = serializeAddonRef.current.serialize();
        terminalHistoryRef.current = serializedContent;
        console.log('🖥️ HOSTSHELL: Terminal history preserved', serializedContent.length, 'characters');
      } catch (error) {
        console.warn('🖥️ HOSTSHELL: Failed to preserve terminal history:', error);
      }
    }
  }, []);

  // Restore terminal content after WebSocket reconnection
  const restoreTerminalHistory = useCallback(() => {
    if (terminalHistoryRef.current && terminalInstanceRef.current) {
      try {
        // Clear current content and restore from history
        terminalInstanceRef.current.clear();
        terminalInstanceRef.current.write(terminalHistoryRef.current);
        console.log('🖥️ HOSTSHELL: Terminal history restored');
      } catch (error) {
        console.warn('🖥️ HOSTSHELL: Failed to restore terminal history:', error);
      }
    }
  }, []);

  // Manage addons based on WebSocket state (like working version)
  useEffect(() => {
    if (!session?.websocket || !fitAddonRef.current || !addonsInitializedRef.current) {
      setAddons([]);
      setIsReady(false);
      return;
    }

    const handleWebSocketReady = () => {
      console.log('🖥️ HOSTSHELL: WebSocket ready, creating AttachAddon for session:', session.id);
      
      // Create new AttachAddon for this WebSocket
      const attachAddon = new AttachAddon(session.websocket);
      
      // Create addon array (order matters!)
      const addonArray = [
        fitAddonRef.current,
        attachAddon,
        webLinksAddonRef.current,
        serializeAddonRef.current,
        clipboardAddonRef.current,
        searchAddonRef.current,
      ];
      
      // Add WebGL addon if available
      if (webglAddonRef.current) {
        addonArray.push(webglAddonRef.current);
      }
      
      setAddons(addonArray);
      setIsReady(true);
      
      // Restore history after connection is established
      setTimeout(() => {
        restoreTerminalHistory();
      }, 200);
    };

    const handleWebSocketError = () => {
      console.log('🖥️ HOSTSHELL: WebSocket error, preserving history and clearing addons');
      preserveTerminalHistory();
      setAddons([]);
      setIsReady(false);
    };

    const handleWebSocketClose = () => {
      console.log('🖥️ HOSTSHELL: WebSocket closed, preserving history');
      preserveTerminalHistory();
    };

    if (session.websocket.readyState === WebSocket.OPEN) {
      handleWebSocketReady();
    } else if (session.websocket.readyState === WebSocket.CONNECTING) {
      session.websocket.addEventListener('open', handleWebSocketReady);
      session.websocket.addEventListener('error', handleWebSocketError);
      session.websocket.addEventListener('close', handleWebSocketClose);
      
      return () => {
        session.websocket.removeEventListener('open', handleWebSocketReady);
        session.websocket.removeEventListener('error', handleWebSocketError);
        session.websocket.removeEventListener('close', handleWebSocketClose);
      };
    }
  }, [session?.websocket, session?.id, preserveTerminalHistory, restoreTerminalHistory]);

  // Handle terminal resize
  const onResize = useCallback((cols, rows) => {
    console.log('🖥️ HOSTSHELL: Terminal resized to', cols, 'columns and', rows, 'rows');
    
    // Communicate resize to backend if WebSocket is open
    if (session?.websocket?.readyState === WebSocket.OPEN) {
      try {
        session.websocket.send(JSON.stringify({ 
          type: 'resize',
          rows: rows, 
          cols: cols 
        }));
        console.log('🖥️ HOSTSHELL: Size communicated to backend');
      } catch (error) {
        console.warn('🖥️ HOSTSHELL: Failed to communicate size to backend:', error);
      }
    }
  }, [session?.websocket]);

  // Handle when terminal instance is ready
  const onTerminalReady = useCallback((terminal) => {
    console.log('🖥️ HOSTSHELL: Terminal instance ready for useXTerm hook');
    
    // Store terminal instance reference for history preservation
    terminalInstanceRef.current = terminal;
    
    // Fit terminal after a brief delay to ensure container is sized
    if (fitAddonRef.current) {
      setTimeout(() => {
        if (fitAddonRef.current) {
          fitAddonRef.current.fit();
          console.log('🖥️ HOSTSHELL: Terminal fitted');
        }
      }, 100);
    }
  }, []);

  // Listen for footer resize events to trigger terminal resize
  useEffect(() => {
    const handleFooterResize = () => {
      if (fitAddonRef.current && terminalInstanceRef.current) {
        setTimeout(() => {
          fitAddonRef.current.fit();
          console.log('🖥️ HOSTSHELL: Terminal refitted after footer resize');
        }, 50);
      }
    };

    window.addEventListener('footer-resized', handleFooterResize);
    return () => {
      window.removeEventListener('footer-resized', handleFooterResize);
    };
  }, []);

  // Handle terminal data for debugging
  const onData = useCallback((data) => {
    // Data is handled by AttachAddon, but we can log for debugging
    console.log('🖥️ HOSTSHELL: Terminal data:', data.length, 'bytes');
  }, []);

  if (!session) {
    return (
      <div className="is-fullheight is-fullwidth is-flex is-align-items-center is-justify-content-center has-text-white-ter">
        <div className="has-text-centered">
          <div className="icon is-large mb-2">
            <i className="fas fa-terminal fa-2x"></i>
          </div>
          <p>No session available</p>
          <p className="is-size-7 has-text-grey">
            Select a server to start terminal
          </p>
        </div>
      </div>
    );
  }

  if (!isReady || addons.length === 0) {
    return (
      <div className="is-fullheight is-fullwidth is-flex is-align-items-center is-justify-content-center has-text-white-ter">
        <div className="has-text-centered">
          <div className="icon is-large mb-2">
            <i className="fas fa-terminal fa-2x fa-pulse"></i>
          </div>
          <p>Connecting to terminal...</p>
          <p className="is-size-7 has-text-grey">
            {session.websocket?.readyState === WebSocket.CONNECTING ? 'Establishing connection' : 'Preparing session'}
          </p>
        </div>
      </div>
    );
  }

  // Use useXTerm with the properly managed addons
  return (
    <div 
      ref={ref} 
      style={{ height: '100%', width: '100%' }} 
      className="is-fullheight is-fullwidth"
    />
  );
};

export default HostShell;
