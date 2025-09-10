import { useContext } from "react";

import { UserSettings } from "../contexts/UserSettingsContext";

import Sidebar from "./Sidebar";
import SidebarFooter from "./SidebarFooter";
import SidebarHeader from "./SidebarHeader";

const SideMenu = () => {
  const { sidebarMinimized } = useContext(UserSettings);

  return (
    <section
      className={`hero is-fullheight ${sidebarMinimized ? "is-minimized" : ""}`}
    >
      <div className="hero-head has-z-index-sidebar">
        <SidebarHeader />
      </div>
      <div className="hero-body p-0 is-align-items-flex-start">
        <Sidebar />
      </div>
      <SidebarFooter />
    </section>
  );
};

export default SideMenu;
