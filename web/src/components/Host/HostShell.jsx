import React, { useEffect, useState, useCallback } from 'react';
import { XTerm } from 'react-xtermjs';
import { FitAddon } from '@xterm/addon-fit';
import { AttachAddon } from '@xterm/addon-attach';
import { WebLinksAddon } from '@xterm/addon-web-links';
import { useFooter } from '../../contexts/FooterContext';
import '@xterm/xterm/css/xterm.css';

const HostShell = () => {
  const [addons, setAddons] = useState([]);
  const { session, restartShell } = useFooter();
  const fitAddon = addons[0];

  // Initialize addons when session WebSocket is available
  useEffect(() => {
    if (session?.websocket && session.websocket.readyState === WebSocket.OPEN) {
      console.log('🖥️ HOSTSHELL: Setting up addons for session:', session.id);
      
      const newFitAddon = new FitAddon();
      const attachAddon = new AttachAddon(session.websocket);
      const webLinksAddon = new WebLinksAddon();
      
      setAddons([newFitAddon, attachAddon, webLinksAddon]);
    } else if (session?.websocket && session.websocket.readyState === WebSocket.CONNECTING) {
      // Wait for WebSocket to open
      const handleOpen = () => {
        console.log('🖥️ HOSTSHELL: WebSocket opened, setting up addons');
        const newFitAddon = new FitAddon();
        const attachAddon = new AttachAddon(session.websocket);
        const webLinksAddon = new WebLinksAddon();
        
        setAddons([newFitAddon, attachAddon, webLinksAddon]);
        session.websocket.removeEventListener('open', handleOpen);
      };
      
      session.websocket.addEventListener('open', handleOpen);
      
      return () => {
        if (session.websocket) {
          session.websocket.removeEventListener('open', handleOpen);
        }
      };
    } else {
      setAddons([]);
    }
  }, [session?.websocket?.readyState, session?.id]);

  // Handle terminal resize
  const onResize = useCallback((cols, rows) => {
    console.log('🖥️ HOSTSHELL: Terminal resized to', cols, 'columns and', rows, 'rows');
  }, []);

  // Fit terminal when container size changes
  useEffect(() => {
    if (fitAddon) {
      const timer = setTimeout(() => {
        try {
          fitAddon.fit();
          console.log('🖥️ HOSTSHELL: Terminal fitted to container');
        } catch (error) {
          console.warn('🖥️ HOSTSHELL: Error fitting terminal:', error);
        }
      }, 50);
      
      return () => clearTimeout(timer);
    }
  }, [fitAddon]);

  if (!session) {
    return (
      <div className="is-fullheight is-fullwidth is-flex is-align-items-center is-justify-content-center has-text-white-ter">
        <div className="has-text-centered">
          <div className="icon is-large mb-2">
            <i className="fas fa-terminal fa-2x"></i>
          </div>
          <p>No terminal session available</p>
          <p className="is-size-7 has-text-grey">
            Wait for connection or restart the shell
          </p>
        </div>
      </div>
    );
  }

  return (
    <XTerm
      className="is-fullheight is-fullwidth"
      style={{ height: '100%', width: '100%' }}
      addons={addons}
      options={{
        cursorBlink: true,
        theme: {
          background: '#000000',
        },
      }}
      listeners={{
        onResize,
      }}
    />
  );
};

export default HostShell;
