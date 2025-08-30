import React, { useState, useContext, useEffect, useRef } from "react";
import { ResizableBox } from "react-resizable";
import { UserSettings } from "../contexts/UserSettingsContext";
import { useFooter } from "../contexts/FooterContext";
import HostShell from "./Host/HostShell";
import Tasks from "./Tasks";

const Footer = () => {
  const userSettings = useContext(UserSettings);
  const { footerIsActive, setFooterIsActive, footerActiveView, setFooterActiveView } = userSettings;
  const { resizeTerminal, restartShell } = useFooter();
  const [showShellDropdown, setShowShellDropdown] = useState(false);
  const resizeTimeoutRef = useRef(null);

  // Handle footer expand/collapse
  const handleToggle = () => {
    const wasActive = footerIsActive;
    setFooterIsActive(!footerIsActive);
    
    // If expanding footer and shell view is active, resize terminal after DOM update
    if (!wasActive && footerActiveView === 'shell') {
      setTimeout(() => {
        resizeTerminal();
      }, 100);
    }
  };

  // Handle view change
  const handleViewChange = (view) => {
    setFooterActiveView(view);
    
    // If switching to shell view and footer is active, resize terminal after DOM update
    if (view === 'shell' && footerIsActive) {
      setTimeout(() => {
        resizeTerminal();
      }, 100);
    }
  };

  // Handle shell button click - show dropdown if already selected
  const handleShellButtonClick = () => {
    if (footerActiveView === 'shell') {
      // Already in shell view, toggle dropdown
      setShowShellDropdown(!showShellDropdown);
    } else {
      // Switch to shell view
      handleViewChange('shell');
      setShowShellDropdown(false);
    }
  };

  // Handle restart shell
  const handleRestartShell = async () => {
    setShowShellDropdown(false);
    await restartShell();
    // Force resize after restart
    setTimeout(() => {
      resizeTerminal();
    }, 500);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showShellDropdown && !event.target.closest('.field.has-addons')) {
        setShowShellDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showShellDropdown]);

  // Resize terminal when footer becomes active and shell view is selected
  useEffect(() => {
    if (footerIsActive && footerActiveView === 'shell') {
      setTimeout(() => {
        resizeTerminal();
      }, 100);
    }
  }, [footerIsActive, footerActiveView, resizeTerminal]);

  // Handle resize - only save when expanded and add debounced terminal fit
  const handleResize = (e, { size }) => {
    if (footerIsActive) {
      userSettings.setFooterHeight(size.height);
      
      // Clear existing timeout
      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current);
      }
      
      // Set new timeout to resize terminal after 5 seconds of no changes
      resizeTimeoutRef.current = setTimeout(() => {
        if (footerActiveView === 'shell' && footerIsActive) {
          console.log('🔄 FOOTER: Auto-fitting terminal after resize completion');
          resizeTerminal();
        }
      }, 5000);
    }
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current);
      }
    };
  }, []);

  // Use collapsed height (0) when not active, persistent height when active
  const effectiveHeight = footerIsActive ? userSettings.footerHeight : 0;

  const ResizeHandle = () => {
    return (
      <nav className='level react-resizable-handle react-resizable-handle-n mb-0'>
        <div className='level-item is-justify-content-flex-start'>
          <div className='pl-1'>
            <a href='https://STARTcloud.com'>
              Zoneweaver v{__APP_VERSION__ || '1.0.0'} &#169; STARTcloud.com&#8482; {new Date().getFullYear()}
            </a>
          </div>
        </div>
        <div className='level-item is-justify-content-space-between'>
          <div className='icon'>
            <i className={footerIsActive ? "fas fa-solid fa-grip-lines react-resizable-handle-n-icon" : ""}></i>
          </div>
        </div>
        <div className='level-item is-justify-content-flex-end'>
          <div className="field has-addons is-grouped mr-2 mb-0 is-relative">
            <p className="control">
              <button className={`button is-small ${footerActiveView === 'shell' ? 'is-info' : ''}`} onClick={handleShellButtonClick}>
                <span className="icon">
                  <i className="fas fa-terminal"></i>
                </span>
              </button>
            </p>
            <p className="control">
              <button className={`button is-small ${footerActiveView === 'tasks' ? 'is-info' : ''}`} onClick={() => handleViewChange('tasks')}>
                <span className="icon">
                  <i className="fas fa-tasks"></i>
                </span>
              </button>
            </p>
            {showShellDropdown && (
              <div className="dropdown is-active has-z-index-sidebar" style={{ 
                position: 'absolute', 
                bottom: '100%', 
                right: '0', 
                minWidth: '150px'
              }}>
                <div className="dropdown-menu">
                  <div className="dropdown-content">
                    <a className="dropdown-item is-clickable" onClick={handleRestartShell}>
                      <span className="icon mr-2">
                        <i className="fas fa-refresh"></i>
                      </span>
                      <span>Restart Shell</span>
                    </a>
                  </div>
                </div>
              </div>
            )}
          </div>
          <div className='icon ' onClick={handleToggle}>
            <i className={footerIsActive ? "is-small fa fa-angle-down" : "is-small fa fa-angle-up"}></i>
          </div>
        </div>
      </nav>
    );
  };

  return (
    <div className='z-index-set-behind'>
      <ResizableBox
        onResize={handleResize}
        className={footerIsActive ? "" : "is-minimized"}
        height={effectiveHeight}
        width={Infinity}
        resizeHandles={["n"]}
        axis='y'
        maxConstraints={[Infinity, 850]}
        minConstraints={[Infinity, 0]}
        handle={ResizeHandle()}
      >
        <div className='log-console has-background-black has-text-white' style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          <div style={{ flex: 1, overflow: 'hidden', width: '100%' }}>
            {footerActiveView === 'shell' ? <HostShell /> : <Tasks />}
          </div>
        </div>
      </ResizableBox>
    </div>
  );
};
export default Footer;
