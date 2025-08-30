import React, { useState, useRef, useEffect } from 'react';

const VncActionsDropdown = ({ 
  vncRef, 
  onScreenshot, 
  onFullScreen, 
  onNewTab,
  onKillSession,
  onToggleViewOnly, // Kept for backward compatibility: why though? just clutter otherwise right?
  onToggleReadOnly,
  isViewOnly, // Kept for backward compatibility: why? just clutter otherwise right?
  isReadOnly,
  isAdmin = false,
  className = '',
  variant = 'default', // 'default' or 'button'
  quality = 6,
  compression = 2,
  resize = 'scale',
  showDot = true,
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
    if (!dropdownRef.current) return 'zw-dropdown-submenu-right';
    
    const dropdownRect = dropdownRef.current.getBoundingClientRect();
    const containerRect = dropdownRef.current.closest('.column')?.getBoundingClientRect() || 
                         dropdownRef.current.closest('.zw-console-container')?.getBoundingClientRect() ||
                         document.body.getBoundingClientRect();
    
    // Check available space within the actual container, not just viewport
    const rightSpace = Math.min(
      window.innerWidth - dropdownRect.right,
      containerRect.right - dropdownRect.right
    );
    
    const shouldFlipLeft = rightSpace < submenuWidth + 40; // 40px buffer for scrollbars/padding
    
    return shouldFlipLeft ? 'zw-dropdown-submenu-left' : 'zw-dropdown-submenu-right';
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

  const handleKeyboardShortcut = (keyCode, keysym, withModifiers = true) => {
    if (vncRef?.current?.sendKey) {
      const activeModifiers = withModifiers ? Object.keys(modifierKeys).filter(mod => modifierKeys[mod]) : [];
      console.log(`🎹 VNC DROPDOWN: Sending key: ${keyCode} (keysym: 0x${keysym.toString(16)}) with modifiers: [${activeModifiers.join(', ')}]`);
      
      try {
        sendKeyWithModifiers(vncRef.current, keysym, keyCode, activeModifiers);
        setIsActive(false);
      } catch (error) {
        console.error(`❌ VNC DROPDOWN: Error sending keyboard shortcut:`, error);
      }
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

  // Function to send keys with modifiers using the proper react-vnc/noVNC API
  const sendKeyWithModifiers = (vncRef, keysym, keyCode, modifiers) => {
    if (!vncRef.sendKey) {
      console.warn('VNC sendKey method not available');
      return;
    }

    try {
      // Step 1: Send modifier keys DOWN
      for (const modifier of modifiers) {
        const modifierKeysym = keysymMap[modifier];
        if (modifierKeysym) {
          console.log(`🎹 VNC KEYS: Sending ${modifier} DOWN (keysym: 0x${modifierKeysym.toString(16)})`);
          vncRef.sendKey(modifierKeysym, modifier.charAt(0).toUpperCase() + modifier.slice(1) + 'Left', true);
        }
      }

      // Step 2: Send target key (if down not specified, both press and release are sent)
      console.log(`🎹 VNC KEYS: Sending ${keyCode} (keysym: 0x${keysym.toString(16)})`);
      vncRef.sendKey(keysym, keyCode);

      // Step 3: Send modifier keys UP (in reverse order)
      for (let i = modifiers.length - 1; i >= 0; i--) {
        const modifier = modifiers[i];
        const modifierKeysym = keysymMap[modifier];
        if (modifierKeysym) {
          console.log(`🎹 VNC KEYS: Sending ${modifier} UP (keysym: 0x${modifierKeysym.toString(16)})`);
          vncRef.sendKey(modifierKeysym, modifier.charAt(0).toUpperCase() + modifier.slice(1) + 'Left', false);
        }
      }

      console.log(`✅ VNC KEYS: Successfully sent key with modifiers`);
    } catch (error) {
      console.error('❌ VNC KEYS: Error sending key with modifiers:', error);
    }
  };

  // Legacy function for backward compatibility with common shortcuts
  const sendKeyboardShortcut = (vncRef, keyString) => {
    console.log(`🎹 VNC KEYS: Legacy shortcut: ${keyString}`);
    
    // Handle common shortcuts
    if (keyString.toLowerCase() === 'alt+tab') {
      sendKeyWithModifiers(vncRef, keysymMap['tab'], 'Tab', ['alt']);
    } else if (keyString.toLowerCase() === 'alt+f4') {
      sendKeyWithModifiers(vncRef, keysymMap['f4'], 'F4', ['alt']);
    } else {
      console.warn('Unknown legacy shortcut:', keyString);
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
    <div className="dropdown-content zw-dropdown-content">
      
      {/* Keyboard & Input Submenu */}
      <div 
        className="dropdown-item is-relative is-flex is-justify-content-space-between is-align-items-center" 
        onMouseEnter={() => setShowKeyboardInput(true)}
        onMouseLeave={() => setShowKeyboardInput(false)}
      >
        <div className='is-flex is-align-items-center'>
          <span className="icon mr-2">
            <i className="fas fa-keyboard"></i>
          </span>
          <span>Keyboard & Input</span>
        </div>
        <span className="icon">
          <i className="fas fa-chevron-right"></i>
        </span>
        
        {/* Keyboard Input Submenu */}
        {showKeyboardInput && (
          <div 
            className={`dropdown-menu has-z-index-modal-high ${calculateSubmenuPosition(350)}`}
          >
            <div className="dropdown-content">
              {/* Common Shortcuts */}
              <div className="dropdown-item has-text-weight-semibold has-text-grey-dark">
                <span className="icon mr-2">
                  <i className="fas fa-keyboard"></i>
                </span>
                <span>Common Shortcuts</span>
              </div>
              <hr className="dropdown-divider" />
              
              <a className="dropdown-item" onClick={handleCtrlAltDel}>
                <span className="icon mr-2">
                  <i className="fas fa-power-off"></i>
                </span>
                <span>Ctrl+Alt+Del</span>
              </a>
              
              <a className="dropdown-item" onClick={() => handleKeyboardShortcut('Alt+Tab')}>
                <span className="icon mr-2">
                  <i className="fas fa-window-restore"></i>
                </span>
                <span>Alt+Tab</span>
              </a>
              
              <a className="dropdown-item" onClick={() => handleKeyboardShortcut('Alt+F4')}>
                <span className="icon mr-2">
                  <i className="fas fa-times"></i>
                </span>
                <span>Alt+F4</span>
              </a>

              <hr className="dropdown-divider" />
              
              {/* Modifier Key Toggles */}
              <div className="dropdown-item has-text-weight-semibold has-text-grey-dark">
                <span className="icon mr-2">
                  <i className="fas fa-hand-paper"></i>
                </span>
                <span>Modifier Keys</span>
              </div>
              
              <div className="dropdown-item px-3 py-2">
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
                className="dropdown-item is-relative"
                onMouseEnter={() => setShowFunctionKeys(true)}
                onMouseLeave={() => setShowFunctionKeys(false)}
              >
                <span className="icon mr-2">
                  <i className="fas fa-keyboard"></i>
                </span>
                <span>Function Keys</span>
                <span className="icon ml-auto">
                  <i className="fas fa-chevron-right"></i>
                </span>
                
                {/* Function Keys Sub-submenu */}
                {showFunctionKeys && (
                  <div 
                    className="dropdown-menu has-z-index-modal-top zw-dropdown-function-keys"
                  >
                    <div className="dropdown-content">
                      {[...Array(12)].map((_, i) => {
                        const fKeyNum = i + 1;
                        const keyCode = `F${fKeyNum}`;
                        const keysym = keysymMap[`f${fKeyNum}`];
                        return (
                          <a 
                            key={i}
                            className="dropdown-item" 
                            onClick={() => handleKeyboardShortcut(keyCode, keysym, true)}
                            title={`Send ${modifierKeys.ctrl || modifierKeys.alt || modifierKeys.shift ? buildKeyString(`F${fKeyNum}`) : `F${fKeyNum}`} to guest`}
                          >
                            <span className="icon mr-2">
                              <i className="fas fa-keyboard"></i>
                            </span>
                            <span>F{fKeyNum}</span>
                          </a>
                        );
                      })}
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
        className="dropdown-item is-relative is-flex is-justify-content-space-between is-align-items-center" 
        onMouseEnter={() => setShowDisplaySettings(true)}
        onMouseLeave={() => setShowDisplaySettings(false)}
      >
        <div className='is-flex is-align-items-center'>
          <span className="icon mr-2">
            <i className="fas fa-desktop"></i>
          </span>
          <span>Display Settings</span>
        </div>
        <span className="icon">
          <i className="fas fa-chevron-right"></i>
        </span>
        
        {/* Display Settings Submenu */}
        {showDisplaySettings && (
          <div 
            className={`dropdown-menu has-z-index-dropdown-top ${calculateSubmenuPosition(350)}`}
          >
            <div className="dropdown-content">
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
                <div className="field mb-4">
                  <label className="label is-small">Quality Level: {quality}</label>
                  <div className="control mt-5 mb-5">
                    <input 
                      className="zw-range-slider-primary"
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
                        background: `linear-gradient(to right, #007bff 0%, #007bff ${(quality/9)*100}%, #ccc ${(quality/9)*100}%, #ccc 100%)`
                      }}
                    />
                  </div>
                  <div className="help is-size-7 mt-2 mb-2">
                    0 = Lowest quality, 9 = Highest quality
                  </div>
                </div>
              </div>
              
              {/* Compression Slider */}
              <div className="dropdown-item">
                <div className="field mb-4">
                  <label className="label is-small" >Compression Level: {compression}</label>
                  <div className="control mt-5 mb-5">
                    <input 
                      className="zw-range-slider-info"
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
                        background: `linear-gradient(to right, #17a2b8 0%, #17a2b8 ${(compression/9)*100}%, #ccc ${(compression/9)*100}%, #ccc 100%)`
                      }}
                    />
                  </div>
                  <div className="help is-size-7 mt-2 mb-2">
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
        className="dropdown-item is-relative is-flex is-justify-content-space-between is-align-items-center" 
        onMouseEnter={() => setShowActions(true)}
        onMouseLeave={() => setShowActions(false)}
      >
        <div className='is-flex is-align-items-center'>
          <span className="icon mr-2">
            <i className="fas fa-tools"></i>
          </span>
          <span>Actions</span>
        </div>
        <span className="icon">
          <i className="fas fa-chevron-right"></i>
        </span>
        
        {/* Actions Submenu */}
        {showActions && (
          <div 
            className={`dropdown-menu has-z-index-dropdown-top ${calculateSubmenuPosition(300)}`}
          >
            <div className="dropdown-content">
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
                    <span className="icon mr-2">
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
                    <span className="icon mr-2">
                      <i className="fas fa-paste"></i>
                    </span>
                    <span>Paste from Browser Clipboard</span>
                  </a>
                  <hr className="dropdown-divider" />
                </>
              )}

              <a className="dropdown-item" onClick={handleScreenshot}>
                <span className="icon mr-2">
                  <i className="fas fa-camera"></i>
                </span>
                <span>Take Screenshot</span>
              </a>
              
              {onFullScreen && (
                <a className="dropdown-item" onClick={handleFullScreen}>
                  <span className="icon mr-2">
                    <i className="fas fa-expand"></i>
                  </span>
                  <span>Full Screen</span>
                </a>
              )}
              
              {onNewTab && (
                <a className="dropdown-item" onClick={handleNewTab}>
                  <span className="icon mr-2">
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
            <span className="icon mr-2">
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
        <div className="dropdown-menu has-z-index-dropdown" id="vnc-dropdown-menu" role="menu">
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
          className="has-text-link is-clickable is-size-7"
          aria-haspopup="true"
          aria-controls="vnc-dropdown-menu"
          onClick={() => setIsActive(!isActive)}
        >
          VNC Actions
          <span className="icon is-small ml-1">
            <i className="fas fa-angle-down" aria-hidden="true"></i>
          </span>
        </span>
      </div>
      <div className="dropdown-menu has-z-index-dropdown" id="vnc-dropdown-menu" role="menu">
        {dropdownContent}
      </div>
    </div>
  );
};

export default VncActionsDropdown;
