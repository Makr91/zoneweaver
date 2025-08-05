import React, { useEffect, useRef } from 'react';
import { useZoneTerminal } from '../contexts/ZoneTerminalContext';
import 'xterm/css/xterm.css';

const ZoneShell = ({ zoneName, readOnly = false, style = {} }) => {
  const terminalRef = useRef(null);
  const { attachTerminal } = useZoneTerminal();

  useEffect(() => {
    if (terminalRef.current) {
      const cleanup = attachTerminal(terminalRef, zoneName, readOnly);
      return () => {
        cleanup();
      };
    }
  }, [attachTerminal, zoneName, readOnly]);

  return (
    <div style={{ height: '100%', width: '100%', boxSizing: 'border-box', ...style }}>
      <div ref={terminalRef} style={{ height: '100%', width: '100%' }} />
    </div>
  );
};

export default ZoneShell;
