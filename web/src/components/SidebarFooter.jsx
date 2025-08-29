import React, { useState, useEffect, useContext, useRef } from "react";
import { useNavigate, NavLink } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";
import { UserSettings } from "../contexts/UserSettingsContext";
import GravatarImage from "./GravatarImage.jsx";

const SidebarFooter = () => {
  const navigate = useNavigate();
  const userContext = useContext(UserSettings);
  const { user, logout } = useAuth();
  const { toggleTheme, getThemeDisplay } = useTheme();
  const [isDropdownActive, setIsDropdownActive] = useState(false);
  const dropdownRef = useRef(null);

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (error) {
      console.error('Logout error:', error);
      // Even if logout fails, redirect to login
      navigate("/login");
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownActive(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownRef]);

  return (
    <nav className='level'>
      <div className='level-left' style={{ width: '100%' }}>
        <div className={`dropdown is-up is-relative ${isDropdownActive ? 'is-active' : ''}`} style={{ width: '100%', overflow: 'visible' }} ref={dropdownRef}>
          <div className='dropdown-trigger' style={{ width: '100%' }}>
            <button className='button is-ghost is-fullwidth p-0 is-flex is-align-items-center' aria-haspopup='true' onClick={() => setIsDropdownActive(!isDropdownActive)}>
              <GravatarImage />
              {!userContext.sidebarMinimized && (
                <span className="pl-2" style={{ flexGrow: 1, textAlign: 'center' }}>{user?.username || 'User'}</span>
              )}
            </button>
          </div>
          <div className='dropdown-menu' id='profile-management' role='menu' style={{
            position: 'fixed',
            zIndex: 10001,
            bottom: '60px',
            left: '50%',
            transform: 'translateX(-50%)'
          }}>
            <div className='dropdown-content has-background-scheme-main-bis has-text-scheme-invert is-flex is-flex-direction-column has-background-grey' style={{
              width: 'fit-content',
              minWidth: 'auto'
            }}>
              <a 
                className='dropdown-item has-background-grey' 
                href='https://zoneweaver.startcloud.com' 
                target='_blank' 
                rel='noopener noreferrer'
              >
                <span className='icon mr-2'><i className='fas fa-info-circle'></i></span>
                <span>Help and Docs</span>
              </a>
              <a onClick={toggleTheme} className='dropdown-item has-background-grey'>
                <span className='icon mr-2'><i className='fas fa-palette'></i></span>
                <span>Theme: {getThemeDisplay().replace(/\s*\([^)]*\)/g, '')}</span>
              </a>
              <a className='dropdown-item has-background-grey' href='/ui/notifications'>
                <span className='icon mr-2'><i className='fas fa-bell'></i></span>
                <span>Notifications</span>
              </a>
              <a className='dropdown-item has-background-grey' href='/ui/profile'>
                <span className='icon mr-2'><i className='fas fa-user'></i></span>
                <span>Profile</span>
              </a>
              <hr className='dropdown-divider' />
              <a onClick={handleLogout} className='dropdown-item has-background-grey'>
                <span className='icon has-text-danger mr-2'><i className='fas fa-sign-out-alt'></i></span>
                <span>Log Out</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default SidebarFooter;
