import PropTypes from "prop-types";
import { useState, useRef, useEffect } from "react";

/**
 * zlogin Console Actions Dropdown
 * Provides actions for zlogin console sessions with consistent styling to VNC dropdown
 */
const ZloginActionsDropdown = ({
  variant = "dropdown",
  onToggleReadOnly,
  onKillSession,
  onScreenshot,
  isReadOnly = true,
  isAdmin = false,
  style = {},
  disabled = false,
  className = "",
}) => {
  const [isActive, setIsActive] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsActive(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleAction = (action) => {
    setIsActive(false);
    action();
  };

  const itemProps = {
    className: "dropdown-item",
    type: "button",
    style: {
      border: "none",
      background: "transparent",
      width: "100%",
      textAlign: "left",
      cursor: "pointer",
      fontSize: "inherit",
      color: "inherit",
    },
  };

  const dropdownContent = (
    <div className="dropdown-content">
      {isAdmin && onToggleReadOnly && (
        <>
          <button
            {...itemProps}
            onClick={() => handleAction(onToggleReadOnly)}
            title={
              isReadOnly ? "Enable interactive mode" : "Enable read-only mode"
            }
          >
            <span className="icon mr-2">
              <i className={`fas ${isReadOnly ? "fa-edit" : "fa-eye"}`} />
            </span>
            <span>{isReadOnly ? "Enable Interactive" : "Set Read-Only"}</span>
          </button>
          <hr className="dropdown-divider" />
        </>
      )}

      <div className="dropdown-item has-text-weight-semibold has-text-grey-dark">
        <span className="icon mr-2">
          <i className="fas fa-tools" />
        </span>
        <span>Actions</span>
      </div>
      <hr className="dropdown-divider" />

      {onScreenshot && (
        <button
          {...itemProps}
          onClick={() => handleAction(onScreenshot)}
          title="Capture terminal output as text"
        >
          <span className="icon mr-2">
            <i className="fas fa-camera" />
          </span>
          <span>Capture Output</span>
        </button>
      )}

      {onKillSession && (
        <>
          <hr className="dropdown-divider" />
          <button
            {...itemProps}
            className="dropdown-item has-text-danger"
            onClick={() => handleAction(onKillSession)}
            title="Terminate zlogin session"
          >
            <span className="icon mr-2">
              <i className="fas fa-skull" />
            </span>
            <span>Kill zlogin Session</span>
          </button>
        </>
      )}
    </div>
  );

  if (variant === "button") {
    return (
      <div
        className={`dropdown is-right ${isActive ? "is-active" : ""} ${className}`}
        style={style}
        ref={dropdownRef}
      >
        <div className="dropdown-trigger">
          <button
            className="button is-small"
            aria-haspopup="true"
            aria-controls="zlogin-dropdown-menu"
            onClick={() => setIsActive(!isActive)}
            disabled={disabled}
            title="zlogin Console Actions"
          >
            <span className="icon">
              <i className="fas fa-ellipsis-v" />
            </span>
          </button>
        </div>
        <div className="dropdown-menu " id="zlogin-dropdown-menu" role="menu">
          {dropdownContent}
        </div>
      </div>
    );
  }

  // Default dropdown variant (text with arrow)
  return (
    <div
      className={`dropdown is-right ${isActive ? "is-active" : ""} ${className}`}
      style={style}
      ref={dropdownRef}
    >
      <div className="dropdown-trigger">
        <span
          className="has-text-link is-clickable is-size-7"
          aria-haspopup="true"
          aria-controls="zlogin-dropdown-menu"
          onClick={() => !disabled && setIsActive(!isActive)}
          onKeyDown={(e) => {
            if (!disabled && (e.key === "Enter" || e.key === " ")) {
              e.preventDefault();
              setIsActive(!isActive);
            }
          }}
          role="button"
          tabIndex={disabled ? -1 : 0}
        >
          zlogin Actions
          <span className="icon ml-1">
            <i className="fas fa-angle-down" aria-hidden="true" />
          </span>
        </span>
      </div>
      <div className="dropdown-menu " id="zlogin-dropdown-menu" role="menu">
        {dropdownContent}
      </div>
    </div>
  );
};

ZloginActionsDropdown.propTypes = {
  variant: PropTypes.string,
  onToggleReadOnly: PropTypes.func,
  onKillSession: PropTypes.func,
  onScreenshot: PropTypes.func,
  isReadOnly: PropTypes.bool,
  isAdmin: PropTypes.bool,
  style: PropTypes.object,
  disabled: PropTypes.bool,
  className: PropTypes.string,
};

export default ZloginActionsDropdown;
