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

  // FitAddon and AttachAddon in separate useEffect like JetKVM/Qovery
  useEffect(() => {
    if (!instance || !session?.websocket) return;
    
    const websocket = session.websocket;
    if (websocket.readyState !== WebSocket.OPEN) return;

    const fitAddon = new FitAddon();
    const attachAddon = new AttachAddon(websocket);
    fitAddonRef.current = fitAddon;
    
    // Load all addons in proper sequence (order matters!)
    instance.loadAddon(fitAddon);
    instance.loadAddon(attachAddon);  // This handles WebSocket communication
    instance.loadAddon(new ClipboardAddon());
    instance.loadAddon(new WebLinksAddon());
    instance.loadAddon(new SerializeAddon());
    instance.loadAddon(new SearchAddon());

    // Try WebGL addon
    try {
      const webglAddon = new WebglAddon();
      instance.loadAddon(webglAddon);
      console.log('🖥️ HOSTSHELL: WebGL renderer loaded');
    } catch (error) {
      console.log('🖥️ HOSTSHELL: WebGL not supported, using canvas renderer');
    }

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

    // Window resize listener like JetKVM
    const handleResize = () => {
      if (fitAddon) {
        setTimeout(() => fitAddon.fit(), 0);
        console.log('🖥️ HOSTSHELL: Terminal refitted on window resize');
      }
    };

    window.addEventListener('resize', handleResize);

    // Initial fit
    setTimeout(() => fitAddon.fit(), 100);

    return () => {
      window.removeEventListener('resize', handleResize);
      onResizeDisposable.dispose();
    };
  }, [instance, session?.websocket]);

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
