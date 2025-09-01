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
          <i className="icon-zoneweaver-logo"></i>
        </span>
      );
    } else {
      return (
        <>
          <span className="level-item is-justify-content-flex-start icon pl-1">
            <i className="icon-zoneweaver-logo"></i>
          </span>
          <span className="level-item">Zoneweaver</span>
          <span className="level-item is-justify-content-flex-end icon">
            <i className="fa fa-angle-left"></i>
          </span>
        </>
      );
    }
  };

  const isIconOnly =
    userContext.sidebarMinimized || userContext.sidebarWidth <= 38;

  return (
    <nav className="level">
      <div
        onClick={handleClick}
        className={`${isIconOnly ? "button is-fullwidth" : "button is-fullwidth"}`}
      >
        {getHeaderContent()}
      </div>
    </nav>
  );
};
export default SidebarHeader;
