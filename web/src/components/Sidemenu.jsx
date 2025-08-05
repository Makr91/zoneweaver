import React, { useContext } from "react";
import Sidebar from "./Sidebar";
import SidebarHeader from "./SidebarHeader";
import SidebarFooter from "./SidebarFooter";
import { UserSettings } from "../contexts/UserSettingsContext";

const SideMenu = () => {
  const { sidebarMinimized } = useContext(UserSettings);
  
  return (
    <section className={`hero column is-narrow ${sidebarMinimized ? 'is-minimized px-1' : ''}`}>
      <div className='hero-head'>
        <SidebarHeader />
      </div>
      <div className='hero-body sidebarbody p-0 is-align-items-flex-start'>
        <Sidebar />
      </div>
      <SidebarFooter />
    </section>
  );
};

export default SideMenu;
