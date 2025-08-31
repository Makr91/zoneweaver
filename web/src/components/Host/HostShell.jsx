import React, { useEffect, useState, useCallback, memo } from 'react';
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
  const { session } = useFooter();
  const fitAddon = addons[0];

  // Initialize addons when WebSocket opens (following Qovery's onOpenHandler pattern)
  useEffect(() => {
    if (session?.websocket) {
      const handleWebSocketOpen = () => {
        console.log('🖥️ HOSTSHELL: WebSocket opened, creating addons');
        const newFitAddon = new FitAddon();
        const attachAddon = new AttachAddon(session.websocket);
        const webLinksAddon = new WebLinksAddon();
        
        setAddons([newFitAddon, attachAddon, webLinksAddon]);
      };

      if (session.websocket.readyState === WebSocket.OPEN) {
        handleWebSocketOpen();
      } else if (session.websocket.readyState === WebSocket.CONNECTING) {
        session.websocket.addEventListener('open', handleWebSocketOpen);
        return () => {
          session.websocket.removeEventListener('open', handleWebSocketOpen);
        };
      }
    } else {
      setAddons([]);
    }
  }, [session?.websocket, session?.id]);

  // Handle terminal resize
  const onResize = useCallback((cols, rows) => {
    console.log('🖥️ HOSTSHELL: Terminal resized to', cols, 'columns and', rows, 'rows');
  }, []);

  // Fit terminal when container changes (following Qovery's pattern)
  useEffect(() => {
    if (fitAddon) {
      setTimeout(() => fitAddon.fit(), 0);
    }
  }, [fitAddon]);

  if (!session || addons.length === 0) {
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
      }}
      listeners={{
        onResize,
      }}
    />
  );
};

export default HostShell;
