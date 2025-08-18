import React, { useState, useRef, useEffect } from 'react';

const VncActionsDropdown = ({ 
  vncRef, 
  onScreenshot, 
  onFullScreen, 
  onNewTab,
  onKillSession,
  onToggleViewOnly,
  isViewOnly = true,
  isAdmin = false,
  className = '',
  variant = 'default' // 'default' or 'button'
}) => {
  const [isActive, setIsActive] = useState(false);
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

  const handleKeyboardShortcut = (keys) => {
    if (vncRef?.current) {
      // Send keyboard shortcuts - these would need to be implemented in the VNC component
      console.log(`Sending keyboard shortcut: ${keys}`);
      // vncRef.current.sendKeyboardShortcut(keys);
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

  const dropdownContent = (
    <div className="dropdown-content">
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

      <div className="dropdown-item">
        <div className="buttons are-small">
          {[...Array(12)].map((_, i) => (
            <button 
              key={i} 
              className="button is-outlined is-small"
              onClick={() => handleKeyboardShortcut(`F${i + 1}`)}
              title={`Send F${i + 1} key to guest`}
            >
              F{i + 1}
            </button>
          ))}
        </div>
      </div>

      <hr className="dropdown-divider" />
      
      <div className="dropdown-item has-text-weight-semibold has-text-grey-dark">
        <span className="icon is-small mr-2">
          <i className="fas fa-tools"></i>
        </span>
        <span>Actions</span>
      </div>
      <hr className="dropdown-divider" />
      
      {onToggleViewOnly && (
        <a className="dropdown-item" onClick={() => {
          onToggleViewOnly();
          setIsActive(false);
        }}>
          <span className="icon is-small mr-2">
            <i className={`fas ${isViewOnly ? 'fa-unlock' : 'fa-lock'}`}></i>
          </span>
          <span>{isViewOnly ? 'Enable Interaction' : 'Set View-Only Mode'}</span>
        </a>
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
        <div className="dropdown-menu" id="vnc-dropdown-menu" role="menu">
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
      <div className="dropdown-menu" id="vnc-dropdown-menu" role="menu">
        {dropdownContent}
      </div>
    </div>
  );
};

export default VncActionsDropdown;
