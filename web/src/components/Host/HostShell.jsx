import { useEffect, useRef } from 'react';
import { useXTerm } from 'react-xtermjs';
import { FitAddon } from '@xterm/addon-fit';
import { AttachAddon } from '@xterm/addon-attach';
import { WebLinksAddon } from '@xterm/addon-web-links';
import { SerializeAddon } from '@xterm/addon-serialize';
import { ClipboardAddon } from '@xterm/addon-clipboard';
import { SearchAddon } from '@xterm/addon-search';
import { WebglAddon } from '@xterm/addon-webgl';
import { useFooter } from '../../contexts/FooterContext';

const isWebGl2Supported = !!document.createElement("canvas").getContext("webgl2");

const HostShell = () => {
  const { session } = useFooter();
  
  // Use useXTerm hook like JetKVM implementation
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

  const fitAddonRef = useRef(null);

  // Load static addons ONCE when instance is ready (following JetKVM pattern)
  useEffect(() => {
    if (!instance) return;

    console.log('🖥️ HOSTSHELL: Loading static addons');
    
    const fitAddon = new FitAddon();
    fitAddonRef.current = fitAddon;
    
    // Load static addons once (not WebSocket dependent)
    instance.loadAddon(fitAddon);
    instance.loadAddon(new ClipboardAddon());
    instance.loadAddon(new WebLinksAddon());
    instance.loadAddon(new SerializeAddon());
    instance.loadAddon(new SearchAddon());

    // Try WebGL addon if supported
    if (isWebGl2Supported) {
      try {
        const webglAddon = new WebglAddon();
        webglAddon.onContextLoss(() => webglAddon.dispose());
        instance.loadAddon(webglAddon);
        console.log('🖥️ HOSTSHELL: WebGL renderer loaded');
      } catch (error) {
        console.log('🖥️ HOSTSHELL: WebGL failed to load:', error);
      }
    }

    // Window resize listener
    const handleResize = () => {
      if (fitAddon) {
        setTimeout(() => fitAddon.fit(), 0);
        console.log('🖥️ HOSTSHELL: Terminal refitted on window resize');
      }
    };

    window.addEventListener('resize', handleResize);

    // Initial fit after brief delay
    setTimeout(() => fitAddon.fit(), 100);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [instance]);

  // Handle WebSocket connection and data communication (simplified JetKVM pattern)
  useEffect(() => {
    if (!instance || !session?.websocket) return;
    if (session.websocket.readyState !== 'open') return;
    
    console.log('🖥️ HOSTSHELL: WebSocket ready, setting up AttachAddon');
    
    const websocket = session.websocket;
    
    // Create and load AttachAddon for this WebSocket connection
    const attachAddon = new AttachAddon(websocket);
    instance.loadAddon(attachAddon);
    
    // Handle terminal resize - communicate to backend
    const onResizeDisposable = instance.onResize(({ cols, rows }) => {
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

    // Send initial sizing information
    if (websocket.readyState === WebSocket.OPEN) {
      websocket.send(JSON.stringify({ 
        type: 'resize',
        rows: instance.rows, 
        cols: instance.cols 
      }));
      console.log('🖥️ HOSTSHELL: Initial terminal size sent to backend');
    }

    return () => {
      console.log('🖥️ HOSTSHELL: Cleaning up WebSocket connection');
      onResizeDisposable.dispose();
      attachAddon.dispose();
    };
  }, [instance, session?.websocket?.readyState]);

  // Listen for footer resize events
  useEffect(() => {
    const handleFooterResize = () => {
      if (fitAddonRef.current) {
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

  return <div ref={ref} style={{ height: '100%', width: '100%' }} />;
};

export default HostShell;
