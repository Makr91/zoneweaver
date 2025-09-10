import React, { createContext, useState, useEffect } from "react";

const UserSettings = createContext();

const UserSettingsProvider = ({ children }) => {
  // Load settings from localStorage with defaults
  const [sidebarMinimized, setSidebarMinimized] = useState(() => {
    const saved = localStorage.getItem("zoneweaver_sidebar_minimized");
    return saved ? JSON.parse(saved) : false;
  });

  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const saved = localStorage.getItem("zoneweaver_sidebar_width");
    return saved ? parseInt(saved) : 240;
  });

  const [footerHeight, setFooterHeight] = useState(() => {
    const saved = localStorage.getItem("zoneweaver_footer_height");
    return saved ? parseInt(saved) : 200;
  });

  const [footerIsActive, setFooterIsActive] = useState(() => {
    const saved = localStorage.getItem("zoneweaver_footer_is_active");
    return saved ? JSON.parse(saved) : false;
  });

  const [footerActiveView, setFooterActiveView] = useState(() => {
    const saved = localStorage.getItem("zoneweaver_footer_active_view");
    return saved ? saved : "tasks";
  });

  const [tasksScrollPosition, setTasksScrollPosition] = useState(0);

  const [hostsExpanded, setHostsExpanded] = useState(() => {
    const saved = localStorage.getItem("zoneweaver_hosts_expanded");
    return saved ? JSON.parse(saved) : false;
  });

  const [zonesExpanded, setZonesExpanded] = useState(() => {
    const saved = localStorage.getItem("zoneweaver_zones_expanded");
    return saved ? JSON.parse(saved) : false;
  });

  const [settingsExpanded, setSettingsExpanded] = useState(() => {
    const saved = localStorage.getItem("zoneweaver_settings_expanded");
    return saved ? JSON.parse(saved) : false;
  });

  // Save settings to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem(
      "zoneweaver_sidebar_minimized",
      JSON.stringify(sidebarMinimized)
    );
  }, [sidebarMinimized]);

  useEffect(() => {
    if (sidebarWidth < 180) {
      setSidebarMinimized(true);
    }
    localStorage.setItem("zoneweaver_sidebar_width", sidebarWidth.toString());
  }, [sidebarWidth]);

  useEffect(() => {
    localStorage.setItem("zoneweaver_footer_height", footerHeight.toString());
  }, [footerHeight]);

  useEffect(() => {
    localStorage.setItem(
      "zoneweaver_footer_is_active",
      JSON.stringify(footerIsActive)
    );
  }, [footerIsActive]);

  useEffect(() => {
    localStorage.setItem("zoneweaver_footer_active_view", footerActiveView);
  }, [footerActiveView]);

  useEffect(() => {
    localStorage.setItem(
      "zoneweaver_hosts_expanded",
      JSON.stringify(hostsExpanded)
    );
  }, [hostsExpanded]);

  useEffect(() => {
    localStorage.setItem(
      "zoneweaver_zones_expanded",
      JSON.stringify(zonesExpanded)
    );
  }, [zonesExpanded]);

  useEffect(() => {
    localStorage.setItem(
      "zoneweaver_settings_expanded",
      JSON.stringify(settingsExpanded)
    );
  }, [settingsExpanded]);

  return (
    <UserSettings.Provider
      value={{
        sidebarMinimized,
        setSidebarMinimized,
        sidebarWidth,
        setSidebarWidth,
        footerHeight,
        setFooterHeight,
        footerIsActive,
        setFooterIsActive,
        footerActiveView,
        setFooterActiveView,
        tasksScrollPosition,
        setTasksScrollPosition,
        hostsExpanded,
        setHostsExpanded,
        zonesExpanded,
        setZonesExpanded,
        settingsExpanded,
        setSettingsExpanded,
      }}
    >
      {children}
    </UserSettings.Provider>
  );
};

export { UserSettings, UserSettingsProvider };
