import React, { useEffect, useRef } from 'react';
import { useZoneTerminal } from '../contexts/ZoneTerminalContext';
import '@xterm/xterm/css/xterm.css';

const ZoneShell = React.memo(({ zoneName, readOnly = false, context = 'preview', style = {}, className = '' }) => {
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
    <div className={`is-fullheight is-fullwidth has-box-sizing-border-box ${className || ''}`} style={style}>
      <div ref={terminalRef} className="is-fullheight is-fullwidth" />
    </div>
  );
});

ZoneShell.displayName = 'ZoneShell';

export default ZoneShell;
