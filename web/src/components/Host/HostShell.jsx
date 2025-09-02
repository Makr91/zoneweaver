import React, { useEffect, useCallback, useRef } from 'react';
import { useXTerm } from 'react-xtermjs';
import { FitAddon } from '@xterm/addon-fit';
import { WebLinksAddon } from '@xterm/addon-web-links';
import { SerializeAddon } from '@xterm/addon-serialize';
import { ClipboardAddon } from '@xterm/addon-clipboard';
import { SearchAddon } from '@xterm/addon-search';
import { WebglAddon } from '@xterm/addon-webgl';
import { useFooter } from '../../contexts/FooterContext';

const isWebGl2Supported = !!document.createElement("canvas").getContext("webgl2");

const HostShell = () => {
  const { session } = useFooter();
  
  // Use useXTerm hook exactly like JetKVM
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
  
  // Create addons once like JetKVM
  const fitAddon = useRef(new FitAddon()).current;
  const serializeAddon = useRef(new SerializeAddon()).current;
  const terminalHistoryRef = useRef('');

  console.log('🖥️ HOSTSHELL: Render with session:', {
    sessionId: session?.id,
    wsState: session?.websocket?.readyState,
    hasInstance: !!instance,
    timestamp: new Date().toISOString()
  });

  // Preserve terminal history utility
  const preserveTerminalHistory = useCallback(() => {
    if (serializeAddon && instance) {
      try {
        const serializedContent = serializeAddon.serialize();
        terminalHistoryRef.current = serializedContent;
        console.log('🖥️ HOSTSHELL: Terminal history preserved', serializedContent.length, 'characters');
      } catch (error) {
        console.warn('🖥️ HOSTSHELL: Failed to preserve terminal history:', error);
      }
    }
  }, [instance, serializeAddon]);

  // Restore terminal history utility
  const restoreTerminalHistory = useCallback(() => {
    if (terminalHistoryRef.current && instance) {
      try {
        instance.clear();
        instance.write(terminalHistoryRef.current);
        console.log('🖥️ HOSTSHELL: Terminal history restored');
      } catch (error) {
        console.warn('🖥️ HOSTSHELL: Failed to restore terminal history:', error);
      }
    }
  }, [instance]);

  // Load static addons when instance is ready (exactly like JetKVM)
  useEffect(() => {
    if (!instance) return;

    console.log('🖥️ HOSTSHELL: Loading static addons');
    
    // Load the fit addon
    instance.loadAddon(fitAddon);
    
    // Load other static addons
    instance.loadAddon(new ClipboardAddon());
    instance.loadAddon(new WebLinksAddon());
    instance.loadAddon(serializeAddon);
    instance.loadAddon(new SearchAddon());

    // Try WebGL addon if supported (like JetKVM)
    if (isWebGl2Supported) {
      try {
        const webGl2Addon = new WebglAddon();
        webGl2Addon.onContextLoss(() => webGl2Addon.dispose());
        instance.loadAddon(webGl2Addon);
        console.log('🖥️ HOSTSHELL: WebGL renderer loaded');
      } catch (error) {
        console.log('🖥️ HOSTSHELL: WebGL failed to load:', error);
      }
    }

    const handleResize = () => fitAddon.fit();

    // Handle resize event (exactly like JetKVM)
    window.addEventListener('resize', handleResize);
    
    // Initial fit
    setTimeout(() => fitAddon.fit(), 100);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [instance]);

  // Manual WebSocket handling (exactly like JetKVM RTCDataChannel pattern)
  const websocketReadyState = session?.websocket?.readyState;
  useEffect(() => {
    if (!instance) return;
    if (!session?.websocket) return;
    if (websocketReadyState !== WebSocket.OPEN) return;

    console.log('🖥️ HOSTSHELL: WebSocket ready, setting up manual communication');
    
    const websocket = session.websocket;
    const abortController = new AbortController();

    // Preserve history before setting up new connection
    preserveTerminalHistory();

    // Manual WebSocket message handling (like JetKVM does with RTCDataChannel)
    websocket.addEventListener(
      "message",
      (e) => {
        try {
          // Handle text data from WebSocket
          if (typeof e.data === 'string') {
            instance.write(e.data);
          } else {
            // Handle binary data if server sends it  
            instance.write(new Uint8Array(e.data));
          }
        } catch (error) {
          console.warn('🖥️ HOSTSHELL: Error writing to terminal:', error);
        }
      },
      { signal: abortController.signal },
    );

    // Manual terminal data sending (like JetKVM)
    const onDataHandler = instance.onData(data => {
      if (websocket.readyState === WebSocket.OPEN) {
        websocket.send(data);
      }
    });

    // Manual resize handling (like JetKVM)
    const onResizeHandler = instance.onResize(({ cols, rows }) => {
      console.log('🖥️ HOSTSHELL: Terminal resized to', cols, 'columns and', rows, 'rows');
      
      if (websocket.readyState === WebSocket.OPEN) {
        try {
          websocket.send(JSON.stringify({ 
            type: 'resize',
            rows: rows, 
            cols: cols 
          }));
          console.log('🖥️ HOSTSHELL: Size communicated to backend');
        } catch (error) {
          console.warn('🖥️ HOSTSHELL: Failed to communicate size to backend:', error);
        }
      }
    });

    // Send initial terminal size (like JetKVM)
    if (websocket.readyState === WebSocket.OPEN) {
      try {
        websocket.send(JSON.stringify({ 
          rows: instance.rows, 
          cols: instance.cols 
        }));
        console.log('🖥️ HOSTSHELL: Initial terminal size sent');
      } catch (error) {
        console.warn('🖥️ HOSTSHELL: Failed to send initial size:', error);
      }
    }

    // Restore history after brief delay
    setTimeout(() => {
      restoreTerminalHistory();
    }, 200);

    return () => {
      abortController.abort();
      onDataHandler.dispose();
      onResizeHandler.dispose();
    };
  }, [instance, websocketReadyState, session?.websocket, session?.id, preserveTerminalHistory, restoreTerminalHistory]);

  // Listen for footer resize events
  useEffect(() => {
    const handleFooterResize = () => {
      if (fitAddon) {
        setTimeout(() => fitAddon.fit(), 50);
      }
    };

    window.addEventListener('footer-resized', handleFooterResize);
    return () => {
      window.removeEventListener('footer-resized', handleFooterResize);
    };
  }, [fitAddon]);

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

  if (!instance) {
    return (
      <div className="is-fullheight is-fullwidth is-flex is-align-items-center is-justify-content-center has-text-white-ter">
        <div className="has-text-centered">
          <div className="icon is-large mb-2">
            <i className="fas fa-terminal fa-2x fa-pulse"></i>
          </div>
          <p>Connecting to terminal...</p>
          <p className="is-size-7 has-text-grey">
            Loading terminal interface...
          </p>
        </div>
      </div>
    );
  }

  // Simple div with ref (JetKVM pattern)
  return (
    <div 
      ref={ref} 
      style={{ height: '100%', width: '100%' }} 
      className="is-fullheight is-fullwidth"
    />
  );
};

export default HostShell;
