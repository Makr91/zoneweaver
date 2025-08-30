import React, { useEffect, useRef, useCallback } from 'react';
import { useFooter } from '../../contexts/FooterContext';
import '@xterm/xterm/css/xterm.css';

const HostShell = () => {
  const terminalRef = useRef(null);
  const { attachTerminal, resizeTerminal } = useFooter();

  useEffect(() => {
    console.log('🖥️ HOSTSHELL: Component mounted/updated', {
      hasRef: !!terminalRef.current,
      attachTerminal: typeof attachTerminal,
      timestamp: new Date().toISOString()
    });
    
    if (terminalRef.current) {
      const cleanup = attachTerminal(terminalRef);
      return () => {
        console.log('🖥️ HOSTSHELL: Component cleanup');
        cleanup();
      };
    }
  }, [attachTerminal]);

  // ResizeObserver disabled to prevent footer terminal resize conflicts
  // The Footer component now handles all terminal resizing via its ResizableBox onResize callback
  /*
  // Add ResizeObserver for automatic terminal resizing - with aggressive throttling
  useEffect(() => {
    if (!terminalRef.current || !window.ResizeObserver) return;

    let resizeTimeout;
    const resizeObserver = new ResizeObserver(entries => {
      // Clear existing timeout to prevent excessive calls
      if (resizeTimeout) {
        clearTimeout(resizeTimeout);
      }
      
      // Aggressive throttling - only resize after 500ms of no changes
      resizeTimeout = setTimeout(() => {
        requestAnimationFrame(() => {
          if (resizeTerminal) {
            console.log('🔍 HOSTSHELL: ResizeObserver triggering terminal resize (throttled)');
            resizeTerminal();
          }
        });
      }, 500);
    });

    resizeObserver.observe(terminalRef.current);
    console.log('🔍 HOSTSHELL: ResizeObserver attached with aggressive throttling');

    return () => {
      if (resizeTimeout) {
        clearTimeout(resizeTimeout);
      }
      resizeObserver.disconnect();
      console.log('🔍 HOSTSHELL: ResizeObserver disconnected');
    };
  }, [resizeTerminal]);
  */

  return (
    <div ref={terminalRef} className="is-fullheight is-fullwidth" />
  );
};

export default HostShell;
