import { Handle, Position } from "@xyflow/react";
import React from "react";

const PhysicalNicNode = ({ data }) => {
  const { label, state, speed, bandwidth, ipAddresses, mtu, flags } = data;

  const isActive = state?.toLowerCase() === "up";

  const formatSpeed = (speed) => {
    const speedNum = parseInt(speed) || 0;
    if (speedNum >= 1000) {
      return `${speedNum / 1000}G`;
    }
    return `${speedNum}M`;
  };

  const formatBandwidth = (bw) => {
    if (!bw) {
      return "0 Mbps";
    }
    if (bw >= 1000) {
      return `${(bw / 1000).toFixed(1)}G`;
    }
    return `${bw.toFixed(1)}M`;
  };

  const tooltipContent = `
${label} (Physical NIC)
Status: ${state || "unknown"}
Speed: ${formatSpeed(speed)}
MTU: ${mtu || "N/A"}
${bandwidth ? `Bandwidth: ${formatBandwidth(bandwidth.totalMbps)} (↓${formatBandwidth(bandwidth.rxMbps)} ↑${formatBandwidth(bandwidth.txMbps)})` : "No bandwidth data"}
${ipAddresses?.length ? `IP: ${ipAddresses.map((ip) => ip.ip_address).join(", ")}` : "No IP addresses"}
${flags && flags !== "--" ? `Flags: ${flags}` : ""}
  `.trim();

  return (
    <div
      className={`react-flow__node-default zw-node-base ${isActive ? "zw-nic-active-bg" : "zw-nic-inactive-bg"}`}
      title={tooltipContent}
    >
      {/* Handles - Top for input (from network), Bottom for output (to VNICs) */}
      <Handle
        type="target"
        position={Position.Top}
        className={`zw-node-handle ${isActive ? "zw-nic-active-bg" : "zw-nic-inactive-bg"}`}
      />

      <Handle
        type="source"
        position={Position.Bottom}
        className={`zw-node-handle ${isActive ? "zw-nic-active-bg" : "zw-nic-inactive-bg"}`}
      />

      {/* Icon */}
      <i className="fas fa-ethernet zw-node-icon" />

      {/* Label below */}
      <div className="zw-node-label">{label}</div>
    </div>
  );
};

export default PhysicalNicNode;
