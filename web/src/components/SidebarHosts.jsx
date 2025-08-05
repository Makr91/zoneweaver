import React from "react";
import DashEntry from "./DashEntry";

const SidebarHosts = () => {
  return (
    <div>
      <DashEntry title={"Manage"} link={"/ui/host-manage"} icon={"fas fa-solid fa-gear"} isSubmenu={true} />
      <DashEntry title={"Networking"} link={"/ui/host-networking"} icon={"fas fa-solid fa-sitemap"} isSubmenu={true} />
      <DashEntry title={"Devices"} link={"/ui/host-devices"} icon={"fab fa-brands fa-usb"} isSubmenu={true} />
      <DashEntry title={"Storage"} link={"/ui/host-storage"} icon={"fas fa-solid fa-hard-drive"} isSubmenu={true} />
      <DashEntry title={"Network Storage"} link={"/ui/host-network-storage"} icon={"fas fa-solid fa-network-wired"} isSubmenu={true} />
    </div>
  );
};

export default SidebarHosts;
