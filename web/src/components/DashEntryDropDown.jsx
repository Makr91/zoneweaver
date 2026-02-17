import PropTypes from "prop-types";
import { useContext } from "react";
import { useNavigate } from "react-router-dom";

import { UserSettings } from "../contexts/UserSettingsContext";

const DashEntryDropDown = ({ title, icon }) => {
  const navigate = useNavigate();
  const userContext = useContext(UserSettings);
  const {
    hostsExpanded,
    setHostsExpanded,
    zonesExpanded,
    setZonesExpanded,
    settingsExpanded,
    setSettingsExpanded,
  } = userContext;

  const handleToggle = (e) => {
    e.stopPropagation();
    if (title === "Hosts") {
      setHostsExpanded(!hostsExpanded);
      if (!hostsExpanded) {
        setZonesExpanded(false);
        setSettingsExpanded(false);
      }
    } else if (title === "Zones") {
      setZonesExpanded(!zonesExpanded);
      if (!zonesExpanded) {
        setHostsExpanded(false);
        setSettingsExpanded(false);
      }
    } else if (title === "Settings") {
      setSettingsExpanded(!settingsExpanded);
      if (!settingsExpanded) {
        setHostsExpanded(false);
        setZonesExpanded(false);
      }
    }
  };

  const handleNavigate = () => {
    if (title === "Hosts") {
      navigate("/ui/hosts");
    } else if (title === "Zones") {
      navigate("/ui/zones");
    } else if (title === "Settings") {
      navigate("/ui/settings/zoneweaver");
    }
  };

  const isExpanded =
    title === "Hosts"
      ? hostsExpanded
      : title === "Zones"
        ? zonesExpanded
        : settingsExpanded;

  if (!userContext.sidebarMinimized) {
    return (
      <div className="field has-addons mb-0">
        <p className="control is-expanded">
          <button
            type="button"
            className="button is-fullwidth is-justify-content-start is-ghost"
            onClick={handleNavigate}
          >
            <span>
              <span className="icon">
                <i className={icon} />
              </span>
              <span>{title}</span>
            </span>
          </button>
        </p>
        <p className="control pr-2">
          <button
            type="button"
            className="button is-ghost"
            onClick={handleToggle}
          >
            <span className="icon">
              <i
                className={`fas fa-angle-${isExpanded ? "up" : "down"}`}
                aria-hidden="true"
              />
            </span>
          </button>
        </p>
      </div>
    );
  }
  return (
    <button className="button" onClick={handleToggle}>
      <span className="icon">
        <i className={icon} />
      </span>
    </button>
  );
};

DashEntryDropDown.propTypes = {
  title: PropTypes.string.isRequired,
  icon: PropTypes.string.isRequired,
};

export default DashEntryDropDown;
