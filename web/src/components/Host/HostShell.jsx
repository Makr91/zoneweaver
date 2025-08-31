import React, { useEffect, useState, useCallback, memo, useRef } from 'react';
import { XTerm } from 'react-xtermjs';
import { FitAddon } from '@xterm/addon-fit';
import { AttachAddon } from '@xterm/addon-attach';
import { WebLinksAddon } from '@xterm/addon-web-links';
import { useFooter } from '../../contexts/FooterContext';
import '@xterm/xterm/css/xterm.css';

// Memoized XTerm component to prevent unnecessary re-renders (like Qovery's approach)
const MemoizedXTerm = memo(XTerm);

const HostShell = () => {
  const [addons, setAddons] = useState([]);
  const [terminalReady, setTerminalReady] = useState(false);
  const { session } = useFooter();
  const fitAddon = addons[0];
  
  // Keep persistent references to prevent history loss
  const fitAddonRef = useRef(null);
  const attachAddonRef = useRef(null);
  const webLinksAddonRef = useRef(null);
  const terminalInstanceRef = useRef(null);

  console.log('🖥️ HOSTSHELL: Render with session:', {
    sessionId: session?.id,
    wsReady: session?.websocket?.readyState === WebSocket.OPEN,
    addonsLength: addons.length,
    terminalReady,
    timestamp: new Date().toISOString()
  });

  // Initialize addons only once and reuse them (prevent history loss)
  useEffect(() => {
    if (session?.websocket && !fitAddonRef.current) {
      console.log('🖥️ HOSTSHELL: Creating persistent addons for session:', session.id);
      
      const newFitAddon = new FitAddon();
      const webLinksAddon = new WebLinksAddon();
      
      fitAddonRef.current = newFitAddon;
      webLinksAddonRef.current = webLinksAddon;
      
      setAddons([newFitAddon, null, webLinksAddon]); // AttachAddon will be added when WebSocket is ready
    }
  }, [session?.id]); // Only recreate when session ID changes, not WebSocket

  // Handle WebSocket attachment separately to preserve terminal history
  useEffect(() => {
    if (session?.websocket && fitAddonRef.current && !attachAddonRef.current) {
      const handleWebSocketReady = () => {
        console.log('🖥️ HOSTSHELL: WebSocket ready, creating AttachAddon for session:', session.id);
        
        const attachAddon = new AttachAddon(session.websocket);
        attachAddonRef.current = attachAddon;
        
        // Update addons array with the AttachAddon
        setAddons([fitAddonRef.current, attachAddon, webLinksAddonRef.current]);
        setTerminalReady(true);
      };

      if (session.websocket.readyState === WebSocket.OPEN) {
        handleWebSocketReady();
      } else if (session.websocket.readyState === WebSocket.CONNECTING) {
        session.websocket.addEventListener('open', handleWebSocketReady);
        return () => {
          session.websocket.removeEventListener('open', handleWebSocketReady);
        };
      }
    }
  }, [session?.websocket, session?.id]);

  // Clean up addons when session changes
  useEffect(() => {
    return () => {
      if (session?.id !== (session?.id)) { // When session ID changes
        console.log('🧹 HOSTSHELL: Cleaning up addons for session change');
        fitAddonRef.current = null;
        attachAddonRef.current = null;
        webLinksAddonRef.current = null;
        setTerminalReady(false);
      }
    };
  }, [session?.id]);

  // Handle terminal resize with debugging
  const onResize = useCallback((cols, rows) => {
    console.log('🖥️ HOSTSHELL: Terminal resized to', cols, 'columns and', rows, 'rows');
    console.log('🖥️ HOSTSHELL: Container dimensions during resize');
  }, []);

  // Store terminal instance reference
  const onTerminalReady = useCallback((terminal) => {
    console.log('🖥️ HOSTSHELL: Terminal instance ready');
    terminalInstanceRef.current = terminal;
  }, []);

  // Fit terminal when container changes with better timing
  useEffect(() => {
    if (fitAddon && terminalReady) {
      // Use multiple timing strategies to ensure proper fitting
      const fitSequence = () => {
        if (fitAddon && terminalInstanceRef.current) {
          fitAddon.fit();
          console.log('🖥️ HOSTSHELL: Terminal fitted');
        }
      };
      
      // Immediate fit
      fitSequence();
      
      // Delayed fit for container size changes
      const timeout1 = setTimeout(fitSequence, 0);
      const timeout2 = setTimeout(fitSequence, 50);
      const timeout3 = setTimeout(fitSequence, 200);
      
      return () => {
        clearTimeout(timeout1);
        clearTimeout(timeout2);
        clearTimeout(timeout3);
      };
    }
  }, [fitAddon, terminalReady]);

  if (!session) {
    return (
      <div className="is-fullheight is-fullwidth is-flex is-align-items-center is-justify-content-center has-text-white-ter">
        <div className="has-text-centered">
          <div className="icon is-large mb-2">
            <i className="fas fa-terminal fa-2x"></i>
          </div>
          <p>No session available</p>
          <p className="is-size-7 has-text-grey">
            Select a server to start
          </p>
        </div>
      </div>
    );
  }

  if (addons.length === 0 || !terminalReady) {
    return (
      <div className="is-fullheight is-fullwidth is-flex is-align-items-center is-justify-content-center has-text-white-ter">
        <div className="has-text-centered">
          <div className="icon is-large mb-2">
            <i className="fas fa-terminal fa-2x"></i>
          </div>
          <p>Loading terminal...</p>
          <p className="is-size-7 has-text-grey">
            Establishing connection
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
        },
        // Remove any potential height constraints
        scrollback: 1000,
      }}
      listeners={{
        onResize,
        onTerminalReady,
      }}
    />
  );
};

export default HostShell;
