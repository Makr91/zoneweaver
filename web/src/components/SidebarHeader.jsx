import React, { useContext } from "react";
import { UserSettings } from "../contexts/UserSettingsContext";

const SidebarHeader = () => {
  const userContext = useContext(UserSettings);

  const handleClick = () => {
    if (userContext.sidebarMinimized) {
      // When expanding from collapsed, reset to default width (240px)
      userContext.setSidebarMinimized(false);
      userContext.setSidebarWidth(240);
    } else {
      // When collapsing, just set minimized state
      userContext.setSidebarMinimized(true);
    }
  };

  // Progressive simplification based on width
  const getHeaderContent = () => {
    const width = userContext.sidebarWidth;
    
    if (userContext.sidebarMinimized || width <= 60) {
      // Icon only when collapsed or very narrow
      return (
        <span className='icon has-tooltip-arrow has-tooltip-right' data-tooltip='Expand Sidebar'>
          <i className='icon-zoneweaver-logo'></i>
        </span>
      );
    } else {
      // Logo + text when not collapsed (no version)
      return (
        <>
          <span className='icon'>
            <i className='icon-zoneweaver-logo'></i>
          </span>
          <span>Zoneweaver</span>
          <span className='icon'>
            <i className='fa fa-angle-left'></i>
          </span>
        </>
      );
    }
  };

  const isIconOnly = userContext.sidebarMinimized || userContext.sidebarWidth <= 60;

  return (
    <nav className='level'>
      <div 
        onClick={handleClick} 
        className={`button is-fullwidth ${isIconOnly ? '' : 'is-justify-content-space-between'}`}
      >
        {getHeaderContent()}
      </div>
    </nav>
  );
};
export default SidebarHeader;
