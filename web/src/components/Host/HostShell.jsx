import React, { useEffect, useRef } from 'react';
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

  // Add ResizeObserver for automatic terminal resizing - much more efficient
  useEffect(() => {
    if (!terminalRef.current || !window.ResizeObserver) return;

    const resizeObserver = new ResizeObserver(entries => {
      // Use requestAnimationFrame to avoid performance issues
      requestAnimationFrame(() => {
        if (resizeTerminal) {
          resizeTerminal();
        }
      });
    });

    resizeObserver.observe(terminalRef.current);
    console.log('🔍 HOSTSHELL: ResizeObserver attached for automatic terminal resizing');

    return () => {
      resizeObserver.disconnect();
      console.log('🔍 HOSTSHELL: ResizeObserver disconnected');
    };
  }, [resizeTerminal]);

  return (
    <div 
      className="is-fullheight is-fullwidth has-box-sizing-border-box"
      style={{
        marginTop: '1.75rem',
        paddingBottom: '1.5rem'
      }}
    >
      <div ref={terminalRef} className="is-fullheight is-fullwidth" />
    </div>
  );
};

export default HostShell;
