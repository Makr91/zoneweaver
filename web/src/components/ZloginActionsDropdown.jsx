import React, { useState } from 'react';

/**
 * zlogin Console Actions Dropdown
 * Provides actions for zlogin console sessions similar to VNC dropdown
 */
const ZloginActionsDropdown = ({ 
  variant = "dropdown", 
  onToggleReadOnly,
  onNewSession,
  onKillSession,
  onScreenshot,
  isReadOnly = true,
  isAdmin = false,
  style = {},
  disabled = false 
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  const handleAction = (action) => {
    setIsOpen(false);
    action();
  };

  if (variant === "button") {
    return (
      <div className={`dropdown ${isOpen ? 'is-active' : ''}`} style={style}>
        <div className="dropdown-trigger">
          <button 
            className="button is-small"
            onClick={toggleDropdown}
            disabled={disabled}
            title="zlogin Console Actions"
            style={{boxShadow: '0 2px 8px rgba(0,0,0,0.3)'}}
          >
            <span className="icon is-small">
              <i className="fas fa-ellipsis-v"></i>
            </span>
          </button>
        </div>
        <div className="dropdown-menu" role="menu" style={{minWidth: '200px'}}>
          <div className="dropdown-content">
            {isAdmin && onToggleReadOnly && (
              <>
                <a 
                  className="dropdown-item" 
                  onClick={() => handleAction(onToggleReadOnly)}
                  title={isReadOnly ? "Enable interactive mode" : "Enable read-only mode"}
                >
                  <span className="icon mr-2">
                    <i className={`fas ${isReadOnly ? 'fa-edit' : 'fa-eye'}`}></i>
                  </span>
                  {isReadOnly ? 'Enable Interactive' : 'Set Read-Only'}
                </a>
                <hr className="dropdown-divider" />
              </>
            )}
            
            {onNewSession && (
              <a 
                className="dropdown-item" 
                onClick={() => handleAction(onNewSession)}
                title="Start new zlogin session"
              >
                <span className="icon mr-2">
                  <i className="fas fa-plus"></i>
                </span>
                New Session
              </a>
            )}

            {onScreenshot && (
              <a 
                className="dropdown-item" 
                onClick={() => handleAction(onScreenshot)}
                title="Capture terminal output"
              >
                <span className="icon mr-2">
                  <i className="fas fa-camera"></i>
                </span>
                Capture Output
              </a>
            )}

            {onKillSession && (
              <>
                <hr className="dropdown-divider" />
                <a 
                  className="dropdown-item has-text-danger" 
                  onClick={() => handleAction(onKillSession)}
                  title="Terminate zlogin session"
                >
                  <span className="icon mr-2">
                    <i className="fas fa-times-circle"></i>
                  </span>
                  Kill Session
                </a>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Default dropdown variant
  return (
    <div className={`dropdown ${isOpen ? 'is-active' : ''}`} style={style}>
      <div className="dropdown-trigger">
        <button 
          className="button is-small"
          onClick={toggleDropdown}
          disabled={disabled}
          title="zlogin Console Actions"
        >
          <span>Actions</span>
          <span className="icon is-small">
            <i className="fas fa-angle-down"></i>
          </span>
        </button>
      </div>
      <div className="dropdown-menu" role="menu" style={{minWidth: '200px'}}>
        <div className="dropdown-content">
          {isAdmin && onToggleReadOnly && (
            <>
              <a 
                className="dropdown-item" 
                onClick={() => handleAction(onToggleReadOnly)}
                title={isReadOnly ? "Enable interactive mode" : "Enable read-only mode"}
              >
                <span className="icon mr-2">
                  <i className={`fas ${isReadOnly ? 'fa-edit' : 'fa-eye'}`}></i>
                </span>
                {isReadOnly ? 'Enable Interactive' : 'Set Read-Only'}
              </a>
              <hr className="dropdown-divider" />
            </>
          )}
          
          {onNewSession && (
            <a 
              className="dropdown-item" 
              onClick={() => handleAction(onNewSession)}
              title="Start new zlogin session"
            >
              <span className="icon mr-2">
                <i className="fas fa-plus"></i>
              </span>
              New Session
            </a>
          )}

          {onScreenshot && (
            <a 
              className="dropdown-item" 
              onClick={() => handleAction(onScreenshot)}
              title="Capture terminal output"
            >
              <span className="icon mr-2">
                <i className="fas fa-camera"></i>
              </span>
              Capture Output
            </a>
          )}

          {onKillSession && (
            <>
              <hr className="dropdown-divider" />
              <a 
                className="dropdown-item has-text-danger" 
                onClick={() => handleAction(onKillSession)}
                title="Terminate zlogin session"
              >
                <span className="icon mr-2">
                  <i className="fas fa-times-circle"></i>
                </span>
                Kill Session
              </a>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ZloginActionsDropdown;
