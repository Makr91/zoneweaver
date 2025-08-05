import React, { useEffect, useRef } from 'react';
import { useFooter } from '../../contexts/FooterContext';
import 'xterm/css/xterm.css';

const HostShell = () => {
  const terminalRef = useRef(null);
  const { attachTerminal } = useFooter();

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

  return (
    <div style={{ height: '100%', width: '100%', marginTop: '1.75rem', paddingBottom: '1.5rem', boxSizing: 'border-box' }}>
      <div ref={terminalRef} style={{ height: '100%', width: '100%' }} />
    </div>
  );
};

export default HostShell;
