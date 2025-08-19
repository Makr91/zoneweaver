import React, { useState, useRef, useEffect } from 'react';

const VncActionsDropdown = ({ 
  vncRef, 
  onScreenshot, 
  onFullScreen, 
  onNewTab,
  onKillSession,
  onToggleViewOnly, // Kept for backward compatibility
  onToggleReadOnly,
  isViewOnly, // Kept for backward compatibility
  isReadOnly,
  isAdmin = false,
  className = '',
  variant = 'default' // 'default' or 'button'
}) => {
  const [isActive, setIsActive] = useState(false);
  const [showFunctionKeys, setShowFunctionKeys] = useState(false);
  const [modifierKeys, setModifierKeys] = useState({
    ctrl: false,
    alt: false,
    shift: false
  });
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsActive(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCtrlAltDel = () => {
    if (vncRef?.current?.sendCtrlAltDel) {
      vncRef.current.sendCtrlAltDel();
      setIsActive(false);
    }
  };

  const toggleModifier = (key) => {
    setModifierKeys(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const buildKeyString = (baseKey) => {
    const modifiers = [];
    if (modifierKeys.ctrl) modifiers.push('ctrl');
    if (modifierKeys.alt) modifiers.push('alt');
    if (modifierKeys.shift) modifiers.push('shift');
    
    if (modifiers.length > 0) {
      return `${modifiers.join('-')}-${baseKey.toLowerCase()}`;
    }
    return baseKey.toLowerCase();
  };

  const handleKeyboardShortcut = (keys) => {
    if (vncRef?.current) {
      const finalKeyString = typeof keys === 'string' && keys.includes('-') ? keys : buildKeyString(keys);
      console.log(`Sending keyboard shortcut: ${finalKeyString}`);
      // vncRef.current.sendKeyboardShortcut(finalKeyString);
      setIsActive(false);
    }
  };

  const handleScreenshot = () => {
    if (onScreenshot) {
      onScreenshot();
    } else if (vncRef?.current) {
      // Capture canvas as screenshot
      const canvas = vncRef.current.getCanvas?.();
      if (canvas) {
        canvas.toBlob((blob) => {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `vnc-screenshot-${Date.now()}.png`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        });
      }
    }
    setIsActive(false);
  };

  const handleFullScreen = () => {
    if (onFullScreen) {
      onFullScreen();
    }
    setIsActive(false);
  };

  const handleNewTab = () => {
    if (onNewTab) {
      onNewTab();
    }
    setIsActive(false);
  };

  const handleKillSession = () => {
    if (onKillSession) {
      onKillSession();
    }
    setIsActive(false);
  };

  // Use new props if available, fall back to old ones for backward compatibility
  const actualIsReadOnly = isReadOnly !== undefined ? isReadOnly : isViewOnly;
  const actualToggleHandler = onToggleReadOnly || onToggleViewOnly;

  const dropdownContent = (
    <div className="dropdown-content">
      {isAdmin && actualToggleHandler && (
        <>
          <a 
            className="dropdown-item" 
            onClick={() => {
              actualToggleHandler();
              setIsActive(false);
            }}
            title={actualIsReadOnly ? "Enable interactive mode" : "Enable read-only mode"}
          >
            <span className="icon mr-2">
              <i className={`fas ${actualIsReadOnly ? 'fa-edit' : 'fa-eye'}`}></i>
            </span>
            {actualIsReadOnly ? 'Enable Interactive' : 'Set Read-Only'}
          </a>
          <hr className="dropdown-divider" />
        </>
      )}
      
      <div className="dropdown-item has-text-weight-semibold has-text-grey-dark">
        <span className="icon is-small mr-2">
          <i className="fas fa-keyboard"></i>
        </span>
        <span>Keyboard Shortcuts</span>
      </div>
      <hr className="dropdown-divider" />
      
      <a className="dropdown-item" onClick={handleCtrlAltDel}>
        <span className="icon is-small mr-2">
          <i className="fas fa-power-off"></i>
        </span>
        <span>Ctrl+Alt+Del</span>
      </a>
      
      <a className="dropdown-item" onClick={() => handleKeyboardShortcut('Alt+Tab')}>
        <span className="icon is-small mr-2">
          <i className="fas fa-window-restore"></i>
        </span>
        <span>Alt+Tab</span>
      </a>
      
      <a className="dropdown-item" onClick={() => handleKeyboardShortcut('Alt+F4')}>
        <span className="icon is-small mr-2">
          <i className="fas fa-times"></i>
        </span>
        <span>Alt+F4</span>
      </a>

      <hr className="dropdown-divider" />
      
      {/* Modifier Key Toggles */}
      <div className="dropdown-item has-text-weight-semibold has-text-grey-dark">
        <span className="icon is-small mr-2">
          <i className="fas fa-hand-paper"></i>
        </span>
        <span>Modifier Keys</span>
      </div>
      
      <div className="dropdown-item" style={{padding: '0.375rem 0.75rem'}}>
        <div className="field is-grouped">
          <div className="control">
            <button 
              className={`button is-small ${modifierKeys.ctrl ? 'is-primary' : 'is-light'}`}
              onClick={(e) => {
                e.stopPropagation();
                toggleModifier('ctrl');
              }}
              title={`CTRL ${modifierKeys.ctrl ? 'ON' : 'OFF'} - Click to toggle`}
            >
              <span className="icon is-small">
                <i className={`fas ${modifierKeys.ctrl ? 'fa-toggle-on' : 'fa-toggle-off'}`}></i>
              </span>
              <span>CTRL</span>
            </button>
          </div>
          <div className="control">
            <button 
              className={`button is-small ${modifierKeys.alt ? 'is-warning' : 'is-light'}`}
              onClick={(e) => {
                e.stopPropagation();
                toggleModifier('alt');
              }}
              title={`ALT ${modifierKeys.alt ? 'ON' : 'OFF'} - Click to toggle`}
            >
              <span className="icon is-small">
                <i className={`fas ${modifierKeys.alt ? 'fa-toggle-on' : 'fa-toggle-off'}`}></i>
              </span>
              <span>ALT</span>
            </button>
          </div>
          <div className="control">
            <button 
              className={`button is-small ${modifierKeys.shift ? 'is-info' : 'is-light'}`}
              onClick={(e) => {
                e.stopPropagation();
                toggleModifier('shift');
              }}
              title={`SHIFT ${modifierKeys.shift ? 'ON' : 'OFF'} - Click to toggle`}
            >
              <span className="icon is-small">
                <i className={`fas ${modifierKeys.shift ? 'fa-toggle-on' : 'fa-toggle-off'}`}></i>
              </span>
              <span>SHIFT</span>
            </button>
          </div>
        </div>
        {(modifierKeys.ctrl || modifierKeys.alt || modifierKeys.shift) && (
          <div className="help is-size-7 has-text-grey mt-1">
            Active modifiers will be combined with function keys
          </div>
        )}
      </div>

      {/* Function Keys Submenu */}
      <div 
        className="dropdown-item" 
        style={{position: 'relative'}}
        onMouseEnter={() => setShowFunctionKeys(true)}
        onMouseLeave={() => setShowFunctionKeys(false)}
      >
        <span className="icon is-small mr-2">
          <i className="fas fa-keyboard"></i>
        </span>
        <span>Function Keys</span>
        <span className="icon is-small ml-auto">
          <i className="fas fa-chevron-right"></i>
        </span>
        
        {/* Submenu */}
        {showFunctionKeys && (
          <div 
            className="dropdown-menu" 
            style={{
              position: 'absolute',
              left: '100%',
              top: '0',
              minWidth: '120px',
              zIndex: 1000
            }}
          >
            <div className="dropdown-content">
              {[...Array(12)].map((_, i) => (
                <a 
                  key={i}
                  className="dropdown-item" 
                  onClick={() => handleKeyboardShortcut(`F${i + 1}`)}
                  title={`Send F${i + 1} key to guest`}
                >
                  <span className="icon is-small mr-2">
                    <i className="fas fa-keyboard"></i>
                  </span>
                  <span>F{i + 1}</span>
                </a>
              ))}
            </div>
          </div>
        )}
      </div>

      <hr className="dropdown-divider" />
      
      <div className="dropdown-item has-text-weight-semibold has-text-grey-dark">
        <span className="icon is-small mr-2">
          <i className="fas fa-tools"></i>
        </span>
        <span>Actions</span>
      </div>
      <hr className="dropdown-divider" />
      
      <a className="dropdown-item" onClick={handleScreenshot}>
        <span className="icon is-small mr-2">
          <i className="fas fa-camera"></i>
        </span>
        <span>Take Screenshot</span>
      </a>
      
      {onFullScreen && (
        <a className="dropdown-item" onClick={handleFullScreen}>
          <span className="icon is-small mr-2">
            <i className="fas fa-expand"></i>
          </span>
          <span>Full Screen</span>
        </a>
      )}
      
      {onNewTab && (
        <a className="dropdown-item" onClick={handleNewTab}>
          <span className="icon is-small mr-2">
            <i className="fas fa-external-link-alt"></i>
          </span>
          <span>Open in New Tab</span>
        </a>
      )}
      
      {onKillSession && (
        <>
          <hr className="dropdown-divider" />
          <a className="dropdown-item has-text-danger" onClick={handleKillSession}>
            <span className="icon is-small mr-2">
              <i className="fas fa-skull"></i>
            </span>
            <span>Kill VNC Session</span>
          </a>
        </>
      )}
    </div>
  );

  if (variant === 'button') {
    return (
      <div className={`dropdown is-right ${isActive ? 'is-active' : ''} ${className}`} ref={dropdownRef}>
        <div className="dropdown-trigger">
          <button 
            className="button is-small"
            aria-haspopup="true"
            aria-controls="vnc-dropdown-menu"
            onClick={() => setIsActive(!isActive)}
          >
            <span className="icon is-small">
              <i className="fas fa-ellipsis-v"></i>
            </span>
          </button>
        </div>
        <div className="dropdown-menu" id="vnc-dropdown-menu" role="menu" style={{zIndex: 9999}}>
          {dropdownContent}
        </div>
      </div>
    );
  }

  // Default variant (text with arrow)
  return (
    <div className={`dropdown is-right ${isActive ? 'is-active' : ''} ${className}`} ref={dropdownRef}>
      <div className="dropdown-trigger">
        <span 
          className="has-text-link is-clickable"
          aria-haspopup="true"
          aria-controls="vnc-dropdown-menu"
          onClick={() => setIsActive(!isActive)}
          style={{ fontSize: '0.875rem' }}
        >
          VNC Actions
          <span className="icon is-small ml-1">
            <i className="fas fa-angle-down" aria-hidden="true"></i>
          </span>
        </span>
      </div>
      <div className="dropdown-menu" id="vnc-dropdown-menu" role="menu" style={{zIndex: 9999}}>
        {dropdownContent}
      </div>
    </div>
  );
};

export default VncActionsDropdown;
