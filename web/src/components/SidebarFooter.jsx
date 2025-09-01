import { useState, useEffect, useContext, useRef } from "react";
import { useNavigate } from "react-router-dom";
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

  return (
    <div class="hero-foot has-z-index-sidebar">
        {userContext.sidebarMinimized ? (
          <nav
            className={`level button dropdown is-up dropdown-trigger ${isDropdownActive ? "is-active" : ""}`}
            ref={dropdownRef}
            onClick={() => setIsDropdownActive(!isDropdownActive)}
            >
                <div className="level-item icon is-flex-grow-0">
                  <figure className="image is-32x32">
                    <GravatarImage />
                  </figure>
              </div>
              <div id="profile-management"
                className="dropdown-menu"
                role="menu"
              >
                <div className="dropdown-content">
                  <a
                    className="dropdown-item is-flex is-justify-content-flex-start"
                    href="https://zoneweaver.startcloud.com"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <span className="icon mr-2">
                      <i className="fas fa-info-circle"></i>
                    </span>
                    <span>Help and Docs</span>
                  </a>
                  <a onClick={toggleTheme} className="dropdown-item is-flex is-justify-content-flex-start">
                    <span className="icon mr-2">
                      <i className="fas fa-palette"></i>
                    </span>
                    <span>
                      Theme: {getThemeDisplay().replace(/\s*\([^)]*\)/g, "")}
                    </span>
                  </a>
                  <a className="dropdown-item is-flex is-justify-content-flex-start" href="/ui/notifications">
                    <span className="icon mr-2">
                      <i className="fas fa-bell"></i>
                    </span>
                    <span>Notifications</span>
                  </a>
                  <a className="dropdown-item is-flex is-justify-content-flex-start" href="/ui/profile">
                    <span className="icon mr-2">
                      <i className="fas fa-user"></i>
                    </span>
                    <span>Profile</span>
                  </a>
                  <hr className="dropdown-divider" />
                  <a onClick={handleLogout} className="dropdown-item is-flex is-justify-content-flex-start">
                    <span className="icon has-text-danger mr-2">
                      <i className="fas fa-sign-out-alt"></i>
                    </span>
                    <span>Log Out</span>
                  </a>
                </div>
              </div>
          </nav>
        ) : (
          <nav
            className={`level button dropdown is-center is-up dropdown-trigger ${isDropdownActive ? "is-active" : ""}`}
            ref={dropdownRef}
            onClick={() => setIsDropdownActive(!isDropdownActive)}
            >
              <div className="level-item icon is-flex-grow-0">
                  <figure className="image is-32x32">
                    <GravatarImage />
                  </figure>
              </div>
              <div className="level-item">
                  <span>{user?.username || "User"}</span>
              </div>
              <div id="profile-management"
                className="dropdown-menu"
                role="menu"
              >
                <div className="dropdown-content">
                  <a
                    className="dropdown-item is-flex is-justify-content-flex-start"
                    href="https://zoneweaver.startcloud.com"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <span className="icon mr-2">
                      <i className="fas fa-info-circle"></i>
                    </span>
                    <span>Help and Docs</span>
                  </a>
                  <a onClick={toggleTheme} className="dropdown-item is-flex is-justify-content-flex-start">
                    <span className="icon mr-2">
                      <i className="fas fa-palette"></i>
                    </span>
                    <span>
                      Theme: {getThemeDisplay().replace(/\s*\([^)]*\)/g, "")}
                    </span>
                  </a>
                  <a className="dropdown-item is-flex is-justify-content-flex-start" href="/ui/notifications">
                    <span className="icon mr-2">
                      <i className="fas fa-bell"></i>
                    </span>
                    <span>Notifications</span>
                  </a>
                  <a className="dropdown-item is-flex is-justify-content-flex-start" href="/ui/profile">
                    <span className="icon mr-2">
                      <i className="fas fa-user"></i>
                    </span>
                    <span>Profile</span>
                  </a>
                  <hr className="dropdown-divider" />
                  <a onClick={handleLogout} className="dropdown-item is-flex is-justify-content-flex-start">
                    <span className="icon has-text-danger mr-2">
                      <i className="fas fa-sign-out-alt"></i>
                    </span>
                    <span>Log Out</span>
                  </a>
                </div>
              </div>
          </nav>
        )}
    </div>
  );
};

export default SidebarFooter;
