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
  variant = 'default', // 'default' or 'button'
  // New VNC feature props
  quality = 6,
  compression = 2,
  resize = 'scale',
  showDot = false,
  onQualityChange = null,
  onCompressionChange = null,
  onResizeChange = null,
  onShowDotChange = null,
  onClipboardPaste = null
}) => {
  const [isActive, setIsActive] = useState(false);
  const [showFunctionKeys, setShowFunctionKeys] = useState(false);
  const [showKeyboardInput, setShowKeyboardInput] = useState(false);
  const [showDisplaySettings, setShowDisplaySettings] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const [modifierKeys, setModifierKeys] = useState({
    ctrl: false,
    alt: false,
    shift: false
  });
  const dropdownRef = useRef(null);

  // Dynamic submenu positioning to prevent viewport overflow
  const calculateSubmenuPosition = (submenuWidth = 300) => {
    if (!dropdownRef.current) return { left: '100%' };
    
    const dropdownRect = dropdownRef.current.getBoundingClientRect();
    const rightSpace = window.innerWidth - dropdownRect.right;
    const shouldFlipLeft = rightSpace < submenuWidth + 20; // 20px buffer
    
    return shouldFlipLeft ? {
      right: '100%',
      left: 'auto'
    } : {
      left: '100%',
      right: 'auto'
    };
  };

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
    if (vncRef?.current?.sendKey) {
      const finalKeyString = typeof keys === 'string' && keys.includes('-') ? keys : buildKeyString(keys);
      console.log(`🎹 VNC DROPDOWN: Sending keyboard shortcut: ${finalKeyString}`);
      sendKeyboardShortcut(vncRef.current, finalKeyString);
      setIsActive(false);
    }
  };

  // X11 Keysym mappings for common keys
  const keysymMap = {
    // Function keys
    'f1': 0xFFBE, 'f2': 0xFFBF, 'f3': 0xFFC0, 'f4': 0xFFC1,
    'f5': 0xFFC2, 'f6': 0xFFC3, 'f7': 0xFFC4, 'f8': 0xFFC5,
    'f9': 0xFFC6, 'f10': 0xFFC7, 'f11': 0xFFC8, 'f12': 0xFFC9,
    
    // Modifier keys
    'ctrl': 0xFFE3,
    'alt': 0xFFE9,
    'shift': 0xFFE1,
    
    // Common keys
    'tab': 0xFF09,
    'return': 0xFF0D,
    'escape': 0xFF1B,
    'delete': 0xFFFF,
    
    // Letters (lowercase)
    'a': 0x061, 'b': 0x062, 'c': 0x063, 'd': 0x064, 'e': 0x065,
    'f': 0x066, 'g': 0x067, 'h': 0x068, 'i': 0x069, 'j': 0x06A,
    'k': 0x06B, 'l': 0x06C, 'm': 0x06D, 'n': 0x06E, 'o': 0x06F,
    'p': 0x070, 'q': 0x071, 'r': 0x072, 's': 0x073, 't': 0x074,
    'u': 0x075, 'v': 0x076, 'w': 0x077, 'x': 0x078, 'y': 0x079,
    'z': 0x07A,
    
    // Numbers
    '0': 0x030, '1': 0x031, '2': 0x032, '3': 0x033, '4': 0x034,
    '5': 0x035, '6': 0x036, '7': 0x037, '8': 0x038, '9': 0x039
  };

  // Function to send complex keyboard shortcuts using react-vnc's sendKey method
  const sendKeyboardShortcut = (vncRef, keyString) => {
    if (!vncRef.sendKey) {
      console.warn('VNC sendKey method not available');
      return;
    }

    console.log(`🎹 VNC KEYS: Sending keyboard shortcut: ${keyString}`);

    // Parse the key combination
    const parts = keyString.toLowerCase().split('-');
    const modifiers = [];
    let targetKey = null;

    // Separate modifiers from the target key
    for (const part of parts) {
      if (['ctrl', 'alt', 'shift'].includes(part)) {
        modifiers.push(part);
      } else {
        targetKey = part;
      }
    }

    if (!targetKey) {
      console.warn('No target key found in keyboard shortcut:', keyString);
      return;
    }

    const targetKeysym = keysymMap[targetKey];
    if (!targetKeysym) {
      console.warn('Unknown key:', targetKey);
      return;
    }

    try {
      // Step 1: Send modifier keys DOWN
      for (const modifier of modifiers) {
        const modifierKeysym = keysymMap[modifier];
        if (modifierKeysym) {
          console.log(`🎹 VNC KEYS: Sending ${modifier} DOWN (${modifierKeysym.toString(16)})`);
          vncRef.sendKey(modifierKeysym, modifier, true); // true = key down
        }
      }

      // Step 2: Send target key DOWN then UP
      console.log(`🎹 VNC KEYS: Sending ${targetKey} DOWN-UP (${targetKeysym.toString(16)})`);
      vncRef.sendKey(targetKeysym, targetKey, true);  // key down
      vncRef.sendKey(targetKeysym, targetKey, false); // key up

      // Step 3: Send modifier keys UP (in reverse order)
      for (let i = modifiers.length - 1; i >= 0; i--) {
        const modifier = modifiers[i];
        const modifierKeysym = keysymMap[modifier];
        if (modifierKeysym) {
          console.log(`🎹 VNC KEYS: Sending ${modifier} UP (${modifierKeysym.toString(16)})`);
          vncRef.sendKey(modifierKeysym, modifier, false); // false = key up
        }
      }

      console.log(`✅ VNC KEYS: Successfully sent keyboard shortcut: ${keyString}`);
    } catch (error) {
      console.error('❌ VNC KEYS: Error sending keyboard shortcut:', error);
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
    <div 
      className="dropdown-content"
      style={{
        backgroundColor: 'var(--bulma-scheme-main-bis)',
        border: '1px solid var(--bulma-border)'
      }}
    >
      
      {/* Keyboard & Input Submenu */}
      <div 
        className="dropdown-item" 
        style={{
          position: 'relative', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center'
        }}
        onMouseEnter={() => setShowKeyboardInput(true)}
        onMouseLeave={() => setShowKeyboardInput(false)}
      >
        <div style={{display: 'flex', alignItems: 'center'}}>
          <span className="icon is-small mr-2">
            <i className="fas fa-keyboard"></i>
          </span>
          <span>Keyboard & Input</span>
        </div>
        <span className="icon is-small">
          <i className="fas fa-chevron-right"></i>
        </span>
        
        {/* Keyboard Input Submenu */}
        {showKeyboardInput && (
          <div 
            className="dropdown-menu" 
            style={{
              position: 'absolute',
              ...calculateSubmenuPosition(350),
              top: '0',
              minWidth: '280px',
              maxWidth: '350px',
              zIndex: 1000
            }}
          >
            <div 
              className="dropdown-content"
              style={{
                backgroundColor: 'var(--bulma-scheme-main-bis)',
                border: '1px solid var(--bulma-border)'
              }}
            >
              {/* Common Shortcuts */}
              <div className="dropdown-item has-text-weight-semibold has-text-grey-dark">
                <span className="icon is-small mr-2">
                  <i className="fas fa-keyboard"></i>
                </span>
                <span>Common Shortcuts</span>
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

              <hr className="dropdown-divider" />

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
                
                {/* Function Keys Sub-submenu */}
                {showFunctionKeys && (
                  <div 
                    className="dropdown-menu" 
                    style={{
                      position: 'absolute',
                      left: '100%',
                      top: '0',
                      minWidth: '140px',
                      zIndex: 1001
                    }}
                  >
                    <div 
                      className="dropdown-content"
                      style={{
                        backgroundColor: 'var(--bulma-scheme-main-bis)',
                        border: '1px solid var(--bulma-border)'
                      }}
                    >
                      {[...Array(12)].map((_, i) => (
                        <a 
                          key={i}
                          className="dropdown-item" 
                          onClick={() => handleKeyboardShortcut(`F${i + 1}`)}
                          title={`Send ${modifierKeys.ctrl || modifierKeys.alt || modifierKeys.shift ? buildKeyString(`F${i + 1}`) : `F${i + 1}`} to guest`}
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
            </div>
          </div>
        )}
      </div>

      {/* Display Settings Submenu */}
      <div 
        className="dropdown-item" 
        style={{
          position: 'relative', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center'
        }}
        onMouseEnter={() => setShowDisplaySettings(true)}
        onMouseLeave={() => setShowDisplaySettings(false)}
      >
        <div style={{display: 'flex', alignItems: 'center'}}>
          <span className="icon is-small mr-2">
            <i className="fas fa-desktop"></i>
          </span>
          <span>Display Settings</span>
        </div>
        <span className="icon is-small">
          <i className="fas fa-chevron-right"></i>
        </span>
        
        {/* Display Settings Submenu */}
        {showDisplaySettings && (
          <div 
            className="dropdown-menu" 
            style={{
              position: 'absolute',
              ...calculateSubmenuPosition(350),
              top: '0',
              minWidth: '300px',
              maxWidth: '350px',
              zIndex: 1000
            }}
          >
            <div 
              className="dropdown-content"
              style={{
                backgroundColor: 'var(--bulma-scheme-main-bis)',
                border: '1px solid var(--bulma-border)'
              }}
            >
              {/* Scaling Options */}
              <div className="dropdown-item">
                <div className="field">
                  <label className="label is-small">Scaling Mode</label>
                  <div className="control">
                    <div className="select is-small is-fullwidth">
                      <select 
                        value={resize === 'scale' ? 'local' : resize === 'remote' ? 'remote' : 'none'} 
                        onChange={(e) => {
                          if (onResizeChange) {
                            const newValue = e.target.value === 'local' ? 'scale' : 
                                           e.target.value === 'remote' ? 'remote' : 'none';
                            onResizeChange(newValue);
                          }
                        }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <option value="none">None (1:1)</option>
                        <option value="local">Local Scaling</option>
                        <option value="remote">Remote Resizing</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Quality Slider */}
              <div className="dropdown-item">
                <div className="field" style={{marginBottom: '2rem'}}>
                  <label className="label is-small" style={{marginBottom: '1rem'}}>Quality Level: {quality}</label>
                  <div className="control" style={{marginTop: '1.25rem', marginBottom: '1.75rem'}}>
                    <input 
                      className="slider is-small is-fullwidth is-primary"
                      type="range"
                      min="0"
                      max="9"
                      value={quality}
                      onChange={(e) => {
                        if (onQualityChange) {
                          onQualityChange(parseInt(e.target.value));
                        }
                      }}
                      onClick={(e) => e.stopPropagation()}
                      style={{
                        width: '100%',
                        accentColor: '#007bff',
                        background: `linear-gradient(to right, #007bff 0%, #007bff ${(quality/9)*100}%, #ccc ${(quality/9)*100}%, #ccc 100%)`,
                        height: '8px',
                        borderRadius: '4px',
                        outline: 'none',
                        WebkitAppearance: 'none',
                        appearance: 'none'
                      }}
                    />
                  </div>
                  <div className="help is-size-7" style={{marginTop: '1rem'}}>
                    0 = Lowest quality, 9 = Highest quality
                  </div>
                </div>
              </div>
              
              {/* Compression Slider */}
              <div className="dropdown-item">
                <div className="field" style={{marginBottom: '2rem'}}>
                  <label className="label is-small" style={{marginBottom: '1rem'}}>Compression Level: {compression}</label>
                  <div className="control" style={{marginTop: '1.25rem', marginBottom: '1.75rem'}}>
                    <input 
                      className="slider is-small is-fullwidth is-info"
                      type="range"
                      min="0"
                      max="9"
                      value={compression}
                      onChange={(e) => {
                        if (onCompressionChange) {
                          onCompressionChange(parseInt(e.target.value));
                        }
                      }}
                      onClick={(e) => e.stopPropagation()}
                      style={{
                        width: '100%',
                        accentColor: '#17a2b8',
                        background: `linear-gradient(to right, #17a2b8 0%, #17a2b8 ${(compression/9)*100}%, #ccc ${(compression/9)*100}%, #ccc 100%)`,
                        height: '8px',
                        borderRadius: '4px',
                        outline: 'none',
                        WebkitAppearance: 'none',
                        appearance: 'none'
                      }}
                    />
                  </div>
                  <div className="help is-size-7" style={{marginTop: '1rem'}}>
                    0 = No compression, 9 = Max compression
                  </div>
                </div>
              </div>
              
              {/* Show Cursor Dot Toggle */}
              <div className="dropdown-item">
                <div className="field">
                  <div className="control">
                    <label className="checkbox">
                      <input 
                        type="checkbox"
                        checked={showDot}
                        onChange={(e) => {
                          if (onShowDotChange) {
                            onShowDotChange(e.target.checked);
                          }
                        }}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <span className="ml-2">Show cursor dot when no cursor</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Actions Submenu */}
      <div 
        className="dropdown-item" 
        style={{
          position: 'relative', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center'
        }}
        onMouseEnter={() => setShowActions(true)}
        onMouseLeave={() => setShowActions(false)}
      >
        <div style={{display: 'flex', alignItems: 'center'}}>
          <span className="icon is-small mr-2">
            <i className="fas fa-tools"></i>
          </span>
          <span>Actions</span>
        </div>
        <span className="icon is-small">
          <i className="fas fa-chevron-right"></i>
        </span>
        
        {/* Actions Submenu */}
        {showActions && (
          <div 
            className="dropdown-menu" 
            style={{
              position: 'absolute',
              ...calculateSubmenuPosition(300),
              top: '0',
              minWidth: '260px',
              maxWidth: '300px',
              zIndex: 1000
            }}
          >
            <div 
              className="dropdown-content"
              style={{
                backgroundColor: 'var(--bulma-scheme-main-bis)',
                border: '1px solid var(--bulma-border)'
              }}
            >
              {/* Enable Interactive/Read Only */}
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
                    <span className="icon is-small mr-2">
                      <i className={`fas ${actualIsReadOnly ? 'fa-edit' : 'fa-eye'}`}></i>
                    </span>
                    <span>{actualIsReadOnly ? 'Enable Interactive' : 'Set Read-Only'}</span>
                  </a>
                  <hr className="dropdown-divider" />
                </>
              )}

              {/* Paste from Clipboard */}
              {(onClipboardPaste || vncRef?.current?.clipboardPaste) && (
                <>
                  <a 
                    className="dropdown-item" 
                    onClick={async () => {
                      try {
                        if (navigator.clipboard && navigator.clipboard.readText) {
                          const text = await navigator.clipboard.readText();
                          if (text) {
                            // Try the forwarded method first, fallback to callback
                            if (vncRef?.current?.clipboardPaste) {
                              vncRef.current.clipboardPaste(text);
                              console.log('📋 VNC DROPDOWN: Pasted text via forwarded method');
                            } else if (onClipboardPaste) {
                              onClipboardPaste(text);
                              console.log('📋 VNC DROPDOWN: Pasted text via callback');
                            }
                          }
                        } else {
                          console.warn('📋 VNC DROPDOWN: Browser clipboard API not available');
                        }
                      } catch (error) {
                        console.error('📋 VNC DROPDOWN: Error reading clipboard:', error);
                      }
                      setIsActive(false);
                    }}
                  >
                    <span className="icon is-small mr-2">
                      <i className="fas fa-paste"></i>
                    </span>
                    <span>Paste from Browser Clipboard</span>
                  </a>
                  <hr className="dropdown-divider" />
                </>
              )}

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
            </div>
          </div>
        )}
      </div>
      
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
