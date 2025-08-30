import React, { useEffect, useRef } from 'react';
import { useFooter } from '../../contexts/FooterContext';
import '@xterm/xterm/css/xterm.css';

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
    <div className="is-fullheight is-fullwidth has-margin-top-175rem has-padding-bottom-15rem has-box-sizing-border-box">
      <div ref={terminalRef} className="is-fullheight is-fullwidth" />
    </div>
  );
};

export default HostShell;
