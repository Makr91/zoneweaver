import { useContext } from "react";
import PropTypes from "prop-types";
import { NavLink } from "react-router-dom";
import { UserSettings } from "../contexts/UserSettingsContext";

const DashEntry = ({ link, title, icon, isSubmenu }) => {
  const userContext = useContext(UserSettings);

  if (!userContext.sidebarMinimized) {
    return (
      <NavLink
        className={`button is-fullwidth is-justify-content-start ${isSubmenu ? "pl-5" : ""}`}
        to={link}
      >
        <span className="icon">
          <i className={icon}></i>
        </span>
        <span>{title}</span>
      </NavLink>
    );
  }
  return (
    <NavLink
      className={`button is-fullwidth ${isSubmenu ? "is-submenu-collapsed" : ""}`}
      to={link}
    >
      <span className="icon">
        <i className={icon}></i>
      </span>
    </NavLink>
  );
};

DashEntry.propTypes = {
  link: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
  icon: PropTypes.string.isRequired,
  isSubmenu: PropTypes.bool,
};

export default DashEntry;
