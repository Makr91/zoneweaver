import React, { useEffect, useRef } from 'react';
import { useZoneTerminal } from '../contexts/ZoneTerminalContext';
import '@xterm/xterm/css/xterm.css';

const ZoneShell = React.memo(({ zoneName, readOnly = false, context = 'preview', style = {} }) => {
  const terminalRef = useRef(null);
  const { attachTerminal } = useZoneTerminal();

  useEffect(() => {
    if (terminalRef.current) {
      const cleanup = attachTerminal(terminalRef, zoneName, readOnly, context);
      return () => {
        cleanup();
      };
    }
  }, [attachTerminal, zoneName, readOnly, context]);

  return (
    <div style={{ height: '100%', width: '100%', boxSizing: 'border-box', ...style }}>
      <div ref={terminalRef} style={{ height: '100%', width: '100%' }} />
    </div>
  );
});

ZoneShell.displayName = 'ZoneShell';

export default ZoneShell;
