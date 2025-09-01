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
    <div class="hero-foot">
      <nav className="level button is-fullwidth">
        {userContext.sidebarMinimized ? (
          <div className="level-item">
            <div
              className={`dropdown is-up is-relative ${isDropdownActive ? "is-active" : ""}`}
              ref={dropdownRef}
            >
              <div className="dropdown-trigger">
                <button
                  className="button is-ghost p-0 is-flex is-align-items-center"
                  aria-haspopup="true"
                  onClick={() => setIsDropdownActive(!isDropdownActive)}
                >
                  <GravatarImage />
                </button>
              </div>
              <div
                className="dropdown-menu has-z-index-sidebar-top"
                id="profile-management"
                role="menu"
              >
                <div className="dropdown-content">
                  <a
                    className="dropdown-item"
                    href="https://zoneweaver.startcloud.com"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <span className="icon mr-2">
                      <i className="fas fa-info-circle"></i>
                    </span>
                    <span>Help and Docs</span>
                  </a>
                  <a onClick={toggleTheme} className="dropdown-item">
                    <span className="icon mr-2">
                      <i className="fas fa-palette"></i>
                    </span>
                    <span>
                      Theme: {getThemeDisplay().replace(/\s*\([^)]*\)/g, "")}
                    </span>
                  </a>
                  <a className="dropdown-item" href="/ui/notifications">
                    <span className="icon mr-2">
                      <i className="fas fa-bell"></i>
                    </span>
                    <span>Notifications</span>
                  </a>
                  <a className="dropdown-item" href="/ui/profile">
                    <span className="icon mr-2">
                      <i className="fas fa-user"></i>
                    </span>
                    <span>Profile</span>
                  </a>
                  <hr className="dropdown-divider" />
                  <a onClick={handleLogout} className="dropdown-item">
                    <span className="icon has-text-danger mr-2">
                      <i className="fas fa-sign-out-alt"></i>
                    </span>
                    <span>Log Out</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div
            className={`dropdown is-up dropdown-trigger ${isDropdownActive ? "is-active" : ""}`}
            ref={dropdownRef}
            onClick={() => setIsDropdownActive(!isDropdownActive)}
          >
              <div className="level-item">
                <figure className="image is-32x32">
                  <GravatarImage />
                </figure>
              </div>
              <div className="level-item">
                <span>{user?.username || "User"}</span>
              </div>
            <div
              className="dropdown-menu has-z-index-sidebar-top"
              id="profile-management"
              role="menu"
            >
              <div className="dropdown-content">
                <a
                  className="dropdown-item"
                  href="https://zoneweaver.startcloud.com"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <span className="icon mr-2">
                    <i className="fas fa-info-circle"></i>
                  </span>
                  <span>Help and Docs</span>
                </a>
                <a onClick={toggleTheme} className="dropdown-item">
                  <span className="icon mr-2">
                    <i className="fas fa-palette"></i>
                  </span>
                  <span>
                    Theme: {getThemeDisplay().replace(/\s*\([^)]*\)/g, "")}
                  </span>
                </a>
                <a className="dropdown-item" href="/ui/notifications">
                  <span className="icon mr-2">
                    <i className="fas fa-bell"></i>
                  </span>
                  <span>Notifications</span>
                </a>
                <a className="dropdown-item" href="/ui/profile">
                  <span className="icon mr-2">
                    <i className="fas fa-user"></i>
                  </span>
                  <span>Profile</span>
                </a>
                <hr className="dropdown-divider" />
                <a onClick={handleLogout} className="dropdown-item">
                  <span className="icon has-text-danger mr-2">
                    <i className="fas fa-sign-out-alt"></i>
                  </span>
                  <span>Log Out</span>
                </a>
              </div>
            </div>
          </div>
        )}
      </nav>
    </div>
  );
};

export default SidebarFooter;
