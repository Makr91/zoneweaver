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
  
  // Use useXTerm hook like JetKVM
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
  
  // Track addon refs for cleanup and history
  const fitAddonRef = useRef(null);
  const serializeAddonRef = useRef(null);
  const terminalHistoryRef = useRef('');

  console.log('🖥️ HOSTSHELL: Render with session:', {
    sessionId: session?.id,
    wsState: session?.websocket?.readyState,
    hasInstance: !!instance,
    timestamp: new Date().toISOString()
  });

  // Preserve terminal history utility
  const preserveTerminalHistory = useCallback(() => {
    if (serializeAddonRef.current && instance) {
      try {
        const serializedContent = serializeAddonRef.current.serialize();
        terminalHistoryRef.current = serializedContent;
        console.log('🖥️ HOSTSHELL: Terminal history preserved', serializedContent.length, 'characters');
      } catch (error) {
        console.warn('🖥️ HOSTSHELL: Failed to preserve terminal history:', error);
      }
    }
  }, [instance]);

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

  // Load static addons once when instance is ready (JetKVM pattern)
  useEffect(() => {
    if (!instance) return;

    console.log('🖥️ HOSTSHELL: Loading static addons');
    
    // Load the fit addon
    const fitAddon = new FitAddon();
    fitAddonRef.current = fitAddon;
    instance.loadAddon(fitAddon);

    // Load other static addons
    instance.loadAddon(new ClipboardAddon());
    instance.loadAddon(new WebLinksAddon());
    
    // Serialize addon for history preservation
    const serializeAddon = new SerializeAddon();
    serializeAddonRef.current = serializeAddon;
    instance.loadAddon(serializeAddon);
    
    instance.loadAddon(new SearchAddon());

    // Try WebGL addon if supported
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

    const handleResize = () => {
      if (fitAddon) {
        setTimeout(() => fitAddon.fit(), 0);
        console.log('🖥️ HOSTSHELL: Terminal refitted on window resize');
      }
    };

    // Handle resize event
    window.addEventListener("resize", handleResize);
    
    // Initial fit
    setTimeout(() => fitAddon.fit(), 100);
    
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [instance]);

  // Handle WebSocket communication (exactly like JetKVM but for WebSocket instead of RTCDataChannel)
  const websocketReadyState = session?.websocket?.readyState;
  useEffect(() => {
    if (!instance) return;
    if (!session?.websocket) return;
    if (websocketReadyState !== WebSocket.OPEN) return;

    console.log('🖥️ HOSTSHELL: WebSocket ready, setting up communication');
    
    const websocket = session.websocket;
    const abortController = new AbortController();

    // Preserve history before setting up new connection
    preserveTerminalHistory();

    // Set up WebSocket message handling (like JetKVM dataChannel.addEventListener)
    websocket.addEventListener(
      "message",
      (e) => {
        try {
          // Handle text data from WebSocket (most common case)
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

    // Set up terminal data sending to WebSocket (like JetKVM onData)
    const onDataHandler = instance.onData(data => {
      if (websocket.readyState === WebSocket.OPEN) {
        websocket.send(data);
      }
    });

    // Handle terminal resize communication (like JetKVM)
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

    // Send initial terminal size (like JetKVM does)
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
      if (fitAddonRef.current && instance) {
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
  }, [instance]);

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

  // Simple div with ref like JetKVM
  return (
    <div 
      ref={ref} 
      style={{ height: '100%', width: '100%' }} 
      className="is-fullheight is-fullwidth"
    />
  );
};

export default HostShell;
