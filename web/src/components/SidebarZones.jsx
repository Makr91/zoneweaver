import React from "react";
import DashEntry from "./DashEntry";

const SidebarZones = () => {
  return (
    <div>
      <DashEntry title={"Manage"} link={"/ui/zone-manage"} icon={"fas fa-solid fa-gear"} isSubmenu={true} />
      <DashEntry title={"Register"} link={"/ui/zone-register"} icon={"fas fa-solid fa-plus"} isSubmenu={true} />
      <DashEntry title={"Status"} link={"/ui/zone-status"} icon={"fas fa-solid fa-heart-pulse"} isSubmenu={true} />
    </div>
  );
};

export default SidebarZones;
