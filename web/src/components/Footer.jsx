import { useState, useContext, useEffect, useRef, useCallback } from "react";
import { ResizableBox } from "react-resizable";
import { UserSettings } from "../contexts/UserSettingsContext";
import { useFooter } from "../contexts/FooterContext";
import HostShell from "./Host/HostShell";
import Tasks from "./Tasks";

const Footer = () => {
  const userSettings = useContext(UserSettings);
  const { footerIsActive, setFooterIsActive, footerActiveView, setFooterActiveView } = userSettings;
  const { restartShell } = useFooter();
  const [showShellDropdown, setShowShellDropdown] = useState(false);
  const [versionClickCount, setVersionClickCount] = useState(0);
  const resizeTimeoutRef = useRef(null);

  const handleToggle = () => {
    if (!footerIsActive) {
      // When expanding from collapsed, restore to 130px to prevent minimize loop
      userSettings.setFooterHeight(130);
    }
    setFooterIsActive(!footerIsActive);
  };

  const triggerDestroyThis = () => {
    window.KICKASSVERSION = '2.0';
    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = '//hi.kickassapp.com/kickass.js';
    document.body.appendChild(script);
  };

  const handleVersionClick = () => {
    const newCount = versionClickCount + 1;
    setVersionClickCount(newCount);
    
    if (newCount === 3) {
      triggerDestroyThis();
      setVersionClickCount(0);
    }
  };

  const handleViewChange = (view) => {
    setFooterActiveView(view);
  };

  const handleShellButtonClick = () => {
    if (footerActiveView === 'shell') {
      setShowShellDropdown(!showShellDropdown);
    } else {
      handleViewChange('shell');
      setShowShellDropdown(false);
    }
  };

  const handleRestartShell = async () => {
    setShowShellDropdown(false);
    await restartShell();
  };

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

  const handleResize = useCallback((e, { size }) => {
    if (footerIsActive) {
      userSettings.setFooterHeight(size.height);
      
      // Only handle minimizing - no auto-restore via dragging
      if (size.height <= 120) {
        setFooterIsActive(false);
      }
      
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('footer-resized', { 
          detail: { height: size.height } 
        }));
      }, 100);
    }
  }, [footerIsActive, setFooterIsActive, userSettings]);

  useEffect(() => {
    return () => {
      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current);
      }
    };
  }, []);

  const effectiveHeight = footerIsActive ? userSettings.footerHeight : 30;

  // Header component that's always visible (separate from resize handle)
  const FooterHeader = () => {
    return (
      <nav className='level mb-0' style={{ position: 'relative' }}>
        <div className='level-item is-justify-content-flex-start'>
          <div className='pl-1'>
            <a href='https://zoneweaver.startcloud.com/' className='has-text-primary'>
              Zoneweaver
            </a>
            {' '}
            <span 
              onClick={handleVersionClick}
              className='has-text-primary'
              style={{ 
                cursor: 'pointer',
                transition: 'transform 0.1s ease',
                display: 'inline-block'
              }}
              onMouseEnter={(e) => e.target.style.transform = 'scale(1.05)'}
              onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
              title="Click me 3 times for a surprise!"
            >
              v{__APP_VERSION__ || '1.0.0'}
            </span>
            {' &#169; '}
            <a href='https://startcloud.com/' className='has-text-primary'>
              STARTcloud.com&#8482; {new Date().getFullYear()}
            </a>
          </div>
        </div>
        <div className='level-item is-justify-content-space-between'>
          <div className='icon zw-footer-grip-visual'>
            <i className={`fas fa-solid fa-grip-lines ${footerIsActive ? 'has-text-grey' : 'has-text-grey-light'}`}></i>
          </div>
        </div>
        <div className='level-item is-justify-content-flex-end'>
          <div className="field has-addons mb-0 is-relative">
            <p className="control">
              <button className={`button is-small ${footerActiveView === 'shell' ? 'is-info' : 'is-dark'}`} onClick={handleShellButtonClick}>
                <span className="icon">
                  <i className="fas fa-terminal"></i>
                </span>
              </button>
            </p>
            <p className="control">
              <button className={`button is-small ${footerActiveView === 'tasks' ? 'is-info' : 'is-dark'}`} onClick={() => handleViewChange('tasks')}>
                <span className="icon">
                  <i className="fas fa-tasks"></i>
                </span>
              </button>
            </p>
            <p className="control">
              <button className='button is-small is-dark' onClick={handleToggle}>
                <span className="icon">
                  <i className={footerIsActive ? "is-small fa fa-angle-down" : "is-small fa fa-angle-up"}></i>
                </span>
              </button>
            </p>
            {showShellDropdown && (
              <div className="dropdown is-right">
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
        </div>
        
        {/* Floating resize handle overlay - only shows when footer is active */}
        {footerIsActive && (
          <div 
            className="zw-footer-resize-overlay react-resizable-handle react-resizable-handle-n"
            style={{
              position: 'absolute',
              top: 0,
              left: '50%',
              transform: 'translateX(-50%)',
              width: '60px',
              height: '30px',
              zIndex: 10,
              cursor: 'ns-resize',
              pointerEvents: 'auto'
            }}
          />
        )}
      </nav>
    );
  };

  return (
    <div className="hero-foot" style={{ position: 'relative' }}>
      {/* Header always visible, positioned above ResizableBox */}
      <FooterHeader />
      
      <ResizableBox
        onResize={handleResize}
        className={!footerIsActive ? "is-footer-minimized" : ""}
        height={effectiveHeight}
        width={Infinity}
        resizeHandles={footerIsActive ? ["n"] : []}
        axis='y'
        maxConstraints={[Infinity, Math.floor(window.innerHeight * 0.7)]}
        minConstraints={[Infinity, 30]}
        handle={footerIsActive ? <div className="react-resizable-handle react-resizable-handle-n" style={{ position: 'absolute', top: 0, width: '100%', height: '30px', background: 'transparent' }} /> : undefined}
      >
        <div className='log-console has-text-white is-fullheight is-flex is-flex-direction-column'>
          {footerActiveView === 'shell' ? <HostShell /> : <Tasks />}
        </div>
      </ResizableBox>
    </div>
  );
};
export default Footer;
