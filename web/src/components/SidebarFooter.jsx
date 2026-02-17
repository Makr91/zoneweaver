import { useState, useEffect, useContext, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";

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
      console.error("Logout error:", error);
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

  const buttonStyle = {
    border: "none",
    background: "transparent",
    width: "100%",
    textAlign: "left",
    cursor: "pointer",
    fontSize: "inherit",
    color: "inherit",
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setIsDropdownActive(!isDropdownActive);
    }
  };

  return (
    <div className="hero-foot has-z-index-sidebar">
      {userContext.sidebarMinimized ? (
        <div
          className={`level button dropdown is-up dropdown-trigger ${isDropdownActive ? "is-active" : ""}`}
          ref={dropdownRef}
          onClick={() => setIsDropdownActive(!isDropdownActive)}
          onKeyDown={handleKeyDown}
          role="button"
          tabIndex={0}
          aria-haspopup="true"
        >
          <div className="level-item icon is-flex-grow-0">
            <figure className="image is-32x32">
              <GravatarImage />
            </figure>
          </div>
          <div id="profile-management" className="dropdown-menu" role="menu">
            <div className="dropdown-content">
              <a
                className="dropdown-item is-flex is-justify-content-flex-start"
                href="https://zoneweaver.startcloud.com"
                target="_blank"
                rel="noopener noreferrer"
              >
                <span className="icon mr-2">
                  <i className="fas fa-info-circle" />
                </span>
                <span>Help and Docs</span>
              </a>
              <button
                onClick={toggleTheme}
                className="dropdown-item is-flex is-justify-content-flex-start"
                style={buttonStyle}
              >
                <span className="icon mr-2">
                  <i className="fas fa-palette" />
                </span>
                <span>
                  Theme: {getThemeDisplay().replace(/\s*\([^)]*\)/g, "")}
                </span>
              </button>
              <Link
                className="dropdown-item is-flex is-justify-content-flex-start"
                to="/ui/notifications"
              >
                <span className="icon mr-2">
                  <i className="fas fa-bell" />
                </span>
                <span>Notifications</span>
              </Link>
              <Link
                className="dropdown-item is-flex is-justify-content-flex-start"
                to="/ui/profile"
              >
                <span className="icon mr-2">
                  <i className="fas fa-user" />
                </span>
                <span>Profile</span>
              </Link>
              <hr className="dropdown-divider" />
              <button
                onClick={handleLogout}
                className="dropdown-item is-flex is-justify-content-flex-start"
                style={buttonStyle}
              >
                <span className="icon has-text-danger mr-2">
                  <i className="fas fa-sign-out-alt" />
                </span>
                <span>Log Out</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div
          className={`level button dropdown is-center is-up dropdown-trigger ${isDropdownActive ? "is-active" : ""}`}
          ref={dropdownRef}
          onClick={() => setIsDropdownActive(!isDropdownActive)}
          onKeyDown={handleKeyDown}
          role="button"
          tabIndex={0}
          aria-haspopup="true"
        >
          <div className="level-item icon is-flex-grow-0">
            <figure className="image is-32x32">
              <GravatarImage />
            </figure>
          </div>
          <div className="level-item">
            <span>{user?.username || "User"}</span>
          </div>
          <div id="profile-management" className="dropdown-menu" role="menu">
            <div className="dropdown-content">
              <a
                className="dropdown-item is-flex is-justify-content-flex-start"
                href="https://zoneweaver.startcloud.com"
                target="_blank"
                rel="noopener noreferrer"
              >
                <span className="icon mr-2">
                  <i className="fas fa-info-circle" />
                </span>
                <span>Help and Docs</span>
              </a>
              <button
                onClick={toggleTheme}
                className="dropdown-item is-flex is-justify-content-flex-start"
                style={buttonStyle}
              >
                <span className="icon mr-2">
                  <i className="fas fa-palette" />
                </span>
                <span>
                  Theme: {getThemeDisplay().replace(/\s*\([^)]*\)/g, "")}
                </span>
              </button>
              <Link
                className="dropdown-item is-flex is-justify-content-flex-start"
                to="/ui/notifications"
              >
                <span className="icon mr-2">
                  <i className="fas fa-bell" />
                </span>
                <span>Notifications</span>
              </Link>
              <Link
                className="dropdown-item is-flex is-justify-content-flex-start"
                to="/ui/profile"
              >
                <span className="icon mr-2">
                  <i className="fas fa-user" />
                </span>
                <span>Profile</span>
              </Link>
              <hr className="dropdown-divider" />
              <button
                onClick={handleLogout}
                className="dropdown-item is-flex is-justify-content-flex-start"
                style={buttonStyle}
              >
                <span className="icon has-text-danger mr-2">
                  <i className="fas fa-sign-out-alt" />
                </span>
                <span>Log Out</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SidebarFooter;
