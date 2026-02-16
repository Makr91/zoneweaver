import { useState, useContext, useEffect, useRef, useCallback } from "react";
import { ResizableBox } from "react-resizable";

import { useFooter } from "../contexts/FooterContext";
import { UserSettings } from "../contexts/UserSettingsContext";

import HostShell from "./Host/HostShell";
import Tasks, { TASK_COLUMNS } from "./Tasks";

const PRIORITY_OPTIONS = [
  { label: "All", value: 20 },
  { label: "Low+", value: 40 },
  { label: "Medium+", value: 60 },
  { label: "High+", value: 80 },
  { label: "Critical", value: 100 },
];

const Footer = () => {
  const userSettings = useContext(UserSettings);
  const {
    footerIsActive,
    setFooterIsActive,
    footerActiveView,
    setFooterActiveView,
    taskMinPriority,
    setTaskMinPriority,
    taskVisibleColumns,
    setTaskVisibleColumns,
  } = userSettings;
  const { restartShell } = useFooter();
  const [showShellDropdown, setShowShellDropdown] = useState(false);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [showColumnsDropdown, setShowColumnsDropdown] = useState(false);
  const [versionClickCount, setVersionClickCount] = useState(0);
  const resizeTimeoutRef = useRef(null);

  const handleToggle = () => {
    if (!footerIsActive) {
      userSettings.setFooterHeight(130);
    }
    setFooterIsActive(!footerIsActive);
  };

  const triggerDestroyThis = () => {
    window.KICKASSVERSION = "2.0";
    const script = document.createElement("script");
    script.type = "text/javascript";
    script.src = "//hi.kickassapp.com/kickass.js";
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
    if (!footerIsActive) {
      userSettings.setFooterHeight(130);
      setFooterIsActive(true);
      handleViewChange("shell");
      setShowShellDropdown(false);
    } else if (footerActiveView === "shell") {
      setShowShellDropdown(!showShellDropdown);
    } else {
      handleViewChange("shell");
      setShowShellDropdown(false);
    }
  };

  const handleRestartShell = async () => {
    setShowShellDropdown(false);
    await restartShell();
  };

  const handleColumnToggle = (columnKey) => {
    setTaskVisibleColumns((prev) => {
      if (prev.includes(columnKey)) {
        if (prev.length <= 1) {
          return prev;
        }
        return prev.filter((k) => k !== columnKey);
      }
      return [...prev, columnKey];
    });
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest(".field.has-addons")) {
        setShowShellDropdown(false);
        setShowFilterDropdown(false);
        setShowColumnsDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleResize = useCallback(
    (e, { size }) => {
      if (footerIsActive) {
        userSettings.setFooterHeight(size.height);

        if (size.height <= 100) {
          setFooterIsActive(false);
        }

        setTimeout(() => {
          window.dispatchEvent(
            new CustomEvent("footer-resized", {
              detail: { height: size.height },
            })
          );
        }, 100);
      }
    },
    [footerIsActive, setFooterIsActive, userSettings]
  );

  useEffect(
    () => () => {
      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current);
      }
    },
    []
  );

  const effectiveHeight = footerIsActive ? userSettings.footerHeight : 0;
  const isTasksView = footerActiveView === "tasks" && footerIsActive;
  const currentPriorityLabel =
    PRIORITY_OPTIONS.find((o) => o.value === taskMinPriority)?.label || "Low+";

  const FooterHeader = () => (
    <nav className="level mb-0">
      <div className="level-item is-justify-content-flex-start">
        <div className="pl-1">
          <a
            href="https://zoneweaver.startcloud.com/"
            className="has-text-primary"
          >
            Zoneweaver
          </a>{" "}
          <span
            onClick={handleVersionClick}
            className="has-text-primary"
            style={{
              cursor: "pointer",
              transition: "transform 0.1s ease",
              display: "inline-block",
            }}
            onMouseEnter={(e) => (e.target.style.transform = "scale(1.05)")}
            onMouseLeave={(e) => (e.target.style.transform = "scale(1)")}
            title="Click me 3 times for a surprise!"
          >
            v{__APP_VERSION__ || "1.0.0"}
          </span>
          <span className="has-text-primary"> © </span>
          <a href="https://startcloud.com/" className="has-text-primary">
            STARTcloud.com&#8482; {new Date().getFullYear()}
          </a>
        </div>
      </div>
      <div className="level-item is-justify-content-space-between">
        <div className="icon zw-footer-grip-visual" />
      </div>
      <div className="level-item is-justify-content-flex-end">
        <div className="field has-addons mb-0 is-relative">
          <p className="control">
            <button
              className={`button is-small ${footerActiveView === "shell" ? "is-info" : "is-dark"}`}
              onClick={handleShellButtonClick}
            >
              <span className="icon">
                <i className="fas fa-terminal" />
              </span>
            </button>
          </p>
          <p className="control">
            <button
              className={`button is-small ${footerActiveView === "tasks" ? "is-info" : "is-dark"}`}
              onClick={() => {
                if (!footerIsActive) {
                  userSettings.setFooterHeight(130);
                  setFooterIsActive(true);
                }
                handleViewChange("tasks");
              }}
            >
              <span className="icon">
                <i className="fas fa-tasks" />
              </span>
            </button>
          </p>
          {isTasksView && (
            <>
              <p className="control">
                <button
                  className={`button is-small ${showFilterDropdown ? "is-info" : "is-dark"}`}
                  onClick={() => {
                    setShowFilterDropdown(!showFilterDropdown);
                    setShowColumnsDropdown(false);
                  }}
                  title={`Priority filter: ${currentPriorityLabel}`}
                >
                  <span className="icon">
                    <i className="fas fa-filter" />
                  </span>
                </button>
              </p>
              <p className="control">
                <button
                  className={`button is-small ${showColumnsDropdown ? "is-info" : "is-dark"}`}
                  onClick={() => {
                    setShowColumnsDropdown(!showColumnsDropdown);
                    setShowFilterDropdown(false);
                  }}
                  title="Toggle columns"
                >
                  <span className="icon">
                    <i className="fas fa-table-columns" />
                  </span>
                </button>
              </p>
            </>
          )}
          <p className="control">
            <button className="button is-small is-dark" onClick={handleToggle}>
              <span className="icon">
                <i
                  className={
                    footerIsActive
                      ? "is-small fa fa-angle-down"
                      : "is-small fa fa-angle-up"
                  }
                />
              </span>
            </button>
          </p>

          {/* Shell restart dropdown */}
          <div
            className={`dropdown ${showShellDropdown && footerIsActive ? "is-active" : ""} is-right`}
          >
            <div className="dropdown-menu">
              <div className="dropdown-content">
                <a
                  className="dropdown-item is-clickable"
                  onClick={handleRestartShell}
                >
                  <span className="icon mr-2">
                    <i className="fas fa-refresh" />
                  </span>
                  <span>Restart Shell</span>
                </a>
              </div>
            </div>
          </div>

          {/* Priority filter dropdown */}
          <div
            className={`dropdown ${showFilterDropdown ? "is-active" : ""} is-right`}
            style={{ position: "absolute", right: 0, top: "100%" }}
          >
            <div className="dropdown-menu" style={{ minWidth: "120px" }}>
              <div className="dropdown-content">
                {PRIORITY_OPTIONS.map((option) => (
                  <a
                    key={option.value}
                    className={`dropdown-item is-clickable ${taskMinPriority === option.value ? "is-active" : ""}`}
                    onClick={() => {
                      setTaskMinPriority(option.value);
                      setShowFilterDropdown(false);
                    }}
                  >
                    {option.label}
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* Column toggle dropdown */}
          <div
            className={`dropdown ${showColumnsDropdown ? "is-active" : ""} is-right`}
            style={{ position: "absolute", right: 0, top: "100%" }}
          >
            <div className="dropdown-menu" style={{ minWidth: "160px" }}>
              <div className="dropdown-content">
                {TASK_COLUMNS.map((col) => (
                  <label
                    key={col.key}
                    className="dropdown-item is-clickable"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={taskVisibleColumns.includes(col.key)}
                      onChange={() => handleColumnToggle(col.key)}
                    />
                    {col.label}
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );

  // Footer handle that positions itself to overlay the header
  const FooterHandle = () => (
    <div
      className="is-small is-dark react-resizable-handle react-resizable-handle-n"
      style={{
        position: "absolute",
        top: "-30px",
        left: "50%",
        transform: "translateX(-50%)",
        width: "60px",
        zIndex: 10,
      }}
    >
      <span className="icon">
        <i className="fas fa-solid fa-grip-lines" />
      </span>
    </div>
  );

  return (
    <div className="hero-foot is-relative">
      <FooterHeader />

      <ResizableBox
        onResize={handleResize}
        className={!footerIsActive ? "is-footer-minimized" : ""}
        height={effectiveHeight}
        width={Infinity}
        resizeHandles={footerIsActive ? ["n"] : []}
        axis="y"
        maxConstraints={[Infinity, Math.floor(window.innerHeight * 0.9)]}
        minConstraints={[Infinity, 0]}
        handle={FooterHandle()}
      >
        <div className="log-console has-text-white is-fullheight">
          {footerActiveView === "shell" ? <HostShell /> : <Tasks />}
        </div>
      </ResizableBox>
    </div>
  );
};
export default Footer;
