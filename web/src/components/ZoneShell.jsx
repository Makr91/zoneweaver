import React, { useCallback, memo } from 'react';
import { XTerm } from 'react-xtermjs';
import { useZoneTerminal } from '../contexts/ZoneTerminalContext';

const ZoneShell = memo(({ zoneName, readOnly = false, context = 'preview', style = {}, className = '' }) => {
  const { getZoneAddons, getZoneOptions } = useZoneTerminal();

  // Get addons and options for this specific zone
  const addons = getZoneAddons(zoneName, readOnly);
  const options = getZoneOptions(readOnly);

  // Handle terminal resize
  const onResize = useCallback((cols, rows) => {
    console.log(`🔧 ZONESHELL: Terminal resized for ${zoneName}:`, cols, 'x', rows);
  }, [zoneName]);

  // Handle terminal ready
  const onTerminalReady = useCallback((terminal) => {
    console.log(`🔧 ZONESHELL: Terminal ready for ${zoneName}`);
  }, [zoneName]);

  // Handle terminal data
  const onData = useCallback((data) => {
    console.log(`🔧 ZONESHELL: Data for ${zoneName}:`, data.length, 'bytes');
  }, [zoneName]);

  if (!addons || addons.length === 0) {
    return (
      <div 
        className={`has-box-sizing-border-box zw-zone-shell-container ${className || ''}`} 
        style={style}
      >
        <div className="is-fullheight is-fullwidth is-flex is-align-items-center is-justify-content-center has-text-white-ter">
          <div className="has-text-centered">
            <div className="icon is-large mb-2">
              <i className="fas fa-terminal fa-2x fa-pulse"></i>
            </div>
            <p>Connecting to {zoneName}...</p>
            <p className="is-size-7 has-text-grey">
              {readOnly ? 'Read-only mode' : 'Interactive mode'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`has-box-sizing-border-box zw-zone-shell-container ${className || ''}`} 
      style={style}
    >
      <XTerm
        className="zw-zone-shell-terminal is-fullheight is-fullwidth"
        style={{ height: '100%', width: '100%' }}
        addons={addons}
        options={options}
        listeners={{
          onResize,
          onTerminalReady,
          onData,
        }}
      />
    </div>
  );
});

ZoneShell.displayName = 'ZoneShell';

export default ZoneShell;
