import React, { useContext } from "react";
import { NavLink } from "react-router-dom";
import { UserSettings } from "../contexts/UserSettingsContext";

const DashEntry = ({ link, title, icon, isSubmenu }) => {
  const userContext = useContext(UserSettings);

  if (!userContext.sidebarMinimized) {
    return (
      <NavLink 
        className={`button is-fullwidth is-justify-content-start ${isSubmenu ? 'pl-6' : ''}`}
        to={link}
      >
        <span className='icon'>
          <i className={icon}></i>
        </span>
        <span>{title}</span>
      </NavLink>
    );
  }
  return (
    <NavLink className={`button is-fullwidth ${isSubmenu ? 'is-submenu-collapsed' : ''}`} to={link}>
      <span className='icon'>
        <i className={icon}></i>
      </span>
    </NavLink>
  );
};

export default DashEntry;
