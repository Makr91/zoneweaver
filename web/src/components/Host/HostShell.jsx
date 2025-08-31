import React, { useEffect, useState, useCallback, memo, useRef } from 'react';
import { XTerm } from 'react-xtermjs';
import { FitAddon } from '@xterm/addon-fit';
import { AttachAddon } from '@xterm/addon-attach';
import { WebLinksAddon } from '@xterm/addon-web-links';
import { useFooter } from '../../contexts/FooterContext';
import '@xterm/xterm/css/xterm.css';

// Memoized XTerm component to prevent unnecessary re-renders
const MemoizedXTerm = memo(XTerm);

const HostShell = () => {
  const { session } = useFooter();
  
  // Persistent addon instances to prevent history loss
  const fitAddonRef = useRef(null);
  const webLinksAddonRef = useRef(null);
  
  // Current addons state for react-xtermjs
  const [addons, setAddons] = useState([]);
  const [isReady, setIsReady] = useState(false);

  console.log('🖥️ HOSTSHELL: Render with session:', {
    sessionId: session?.id,
    wsState: session?.websocket?.readyState,
    addonsCount: addons.length,
    isReady,
    timestamp: new Date().toISOString()
  });

  // Initialize persistent addons only once
  useEffect(() => {
    if (!fitAddonRef.current) {
      console.log('🖥️ HOSTSHELL: Initializing persistent addons');
      fitAddonRef.current = new FitAddon();
      webLinksAddonRef.current = new WebLinksAddon();
    }
  }, []);

  // Manage addons based on WebSocket state
  useEffect(() => {
    if (!session?.websocket || !fitAddonRef.current) {
      setAddons([]);
      setIsReady(false);
      return;
    }

    const handleWebSocketReady = () => {
      console.log('🖥️ HOSTSHELL: WebSocket ready, creating AttachAddon for session:', session.id);
      
      // Create new AttachAddon for this WebSocket
      const attachAddon = new AttachAddon(session.websocket);
      
      // Set addons with persistent fit/weblinks and new attach addon
      setAddons([fitAddonRef.current, attachAddon, webLinksAddonRef.current]);
      setIsReady(true);
    };

    const handleWebSocketError = () => {
      console.log('🖥️ HOSTSHELL: WebSocket error, clearing addons');
      setAddons([]);
      setIsReady(false);
    };

    if (session.websocket.readyState === WebSocket.OPEN) {
      handleWebSocketReady();
    } else if (session.websocket.readyState === WebSocket.CONNECTING) {
      session.websocket.addEventListener('open', handleWebSocketReady);
      session.websocket.addEventListener('error', handleWebSocketError);
      session.websocket.addEventListener('close', handleWebSocketError);
      
      return () => {
        session.websocket.removeEventListener('open', handleWebSocketReady);
        session.websocket.removeEventListener('error', handleWebSocketError);
        session.websocket.removeEventListener('close', handleWebSocketError);
      };
    }
  }, [session?.websocket, session?.id]);

  // Handle terminal resize
  const onResize = useCallback((cols, rows) => {
    console.log('🖥️ HOSTSHELL: Terminal resized to', cols, 'columns and', rows, 'rows');
  }, []);

  // Handle when terminal instance is ready
  const onTerminalReady = useCallback((terminal) => {
    console.log('🖥️ HOSTSHELL: Terminal instance ready');
    
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

  return (
    <MemoizedXTerm
      className="is-fullheight is-fullwidth"
      style={{ height: '100%', width: '100%' }}
      addons={addons}
      options={{
        cursorBlink: true,
        theme: {
          background: '#000000',
          foreground: '#ffffff',
        },
        scrollback: 10000, // Increased scrollback buffer for more history
        fontSize: 14,
        fontFamily: '"Cascadia Code", Consolas, "Liberation Mono", Menlo, Courier, monospace',
        allowTransparency: false,
        convertEol: false, // Let the server handle EOL conversion
      }}
      listeners={{
        onResize,
        onTerminalReady,
        onData,
      }}
    />
  );
};

export default HostShell;
