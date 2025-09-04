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
      
      if (size.height <= 100) {
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

  const effectiveHeight = footerIsActive ? userSettings.footerHeight : 0;

  const FooterHeader = () => {
    return (
      <nav className='level mb-0'>
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
            <span className="has-text-primary"> © </span>
            <a href='https://startcloud.com/' className='has-text-primary'>
              STARTcloud.com&#8482; {new Date().getFullYear()}
            </a>
          </div>
        </div>
        <div className='level-item is-justify-content-space-between'>
          <div className='icon zw-footer-grip-visual'>
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
      </nav>
    );
  };

  // Footer handle that positions itself to overlay the header
  const FooterHandle = () => {
    return (
      <div className="button is-small is-dark react-resizable-handle react-resizable-handle-n" 
           style={{
             position: 'absolute',
             top: '-30px',
             left: '50%',
             transform: 'translateX(-50%)',
             width: '60px',
             zIndex: 10
           }}>
        <span className="icon">
          <i className="fas fa-solid fa-grip-lines"></i>
        </span>
      </div>
    );
  };


  return (
    <div className="hero-foot is-relative">
      <FooterHeader />
      
      <ResizableBox
        onResize={handleResize}
        className={!footerIsActive ? "is-footer-minimized" : ""}
        height={effectiveHeight}
        width={Infinity}
        resizeHandles={footerIsActive ? ["n"] : []}
        axis='y'
        maxConstraints={[Infinity, Math.floor(window.innerHeight * 0.9)]}
        minConstraints={[Infinity, 0]}
        handle={FooterHandle()}
      >
        <div className='log-console has-text-white is-fullheight'>
          {footerActiveView === 'shell' ? <HostShell /> : <Tasks />}
        </div>
      </ResizableBox>
    </div>
  );
};
export default Footer;
