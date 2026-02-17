import { useContext } from "react";

import { UserSettings } from "../contexts/UserSettingsContext";

const SidebarHeader = () => {
  const userContext = useContext(UserSettings);

  const handleClick = () => {
    if (userContext.sidebarMinimized) {
      userContext.setSidebarMinimized(false);
      userContext.setSidebarWidth(240);
    } else {
      userContext.setSidebarMinimized(true);
    }
  };

  const getHeaderContent = () => {
    const width = userContext.sidebarWidth;

    if (userContext.sidebarMinimized || width <= 38) {
      return (
        <span
          className="icon has-tooltip-arrow has-tooltip-right"
          data-tooltip="Expand Sidebar"
        >
          <i className="icon-zoneweaver-logo" />
        </span>
      );
    }
    return (
      <>
        <span className="level-item icon is-flex-grow-0">
          <i className="icon-zoneweaver-logo" />
        </span>
        <span className="level-item">Zoneweaver</span>
        <span className="level-item is-justify-content-flex-end is-flex-grow-0 icon pr-2">
          <i className="fa fa-angle-left" />
        </span>
      </>
    );
  };

  const isIconOnly =
    userContext.sidebarMinimized || userContext.sidebarWidth <= 38;

  const handleKeyDown = (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleClick();
    }
  };

  return (
    <div
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className={`${isIconOnly ? "level button" : "level button"}`}
      role="button"
      tabIndex={0}
    >
      {getHeaderContent()}
    </div>
  );
};
export default SidebarHeader;
