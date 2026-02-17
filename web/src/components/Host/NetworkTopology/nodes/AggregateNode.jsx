import { Handle, Position } from "@xyflow/react";

const AggregateNode = ({ data }) => {
  const {
    label,
    members,
    policy,
    lacpActivity,
    lacpTimeout,
    flags,
    bandwidth,
    ipAddresses,
  } = data;

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
${label} (Link Aggregate)
Members: ${members?.join(", ") || "None"}
Policy: ${policy || "Unknown"}
LACP Activity: ${lacpActivity || "N/A"}
LACP Timeout: ${lacpTimeout || "N/A"}
${bandwidth ? `Bandwidth: ${formatBandwidth(bandwidth.totalMbps)} (↓${formatBandwidth(bandwidth.rxMbps)} ↑${formatBandwidth(bandwidth.txMbps)})` : "No bandwidth data"}
${ipAddresses?.length ? `IP: ${ipAddresses.map((ip) => ip.ip_address).join(", ")}` : "No IP addresses"}
${flags && flags !== "--" ? `Flags: ${flags}` : ""}
  `.trim();

  return (
    <div
      className="react-flow__node-default zw-node-base zw-aggregate-bg"
      title={tooltipContent}
    >
      {/* Handles */}
      <Handle
        type="target"
        position={Position.Left}
        className="zw-node-handle zw-aggregate-bg"
      />

      <Handle
        type="source"
        position={Position.Right}
        className="zw-node-handle zw-aggregate-bg"
      />

      {/* Icon */}
      <i className="fas fa-link zw-node-icon" />

      {/* Label below */}
      <div className="zw-node-label">{label}</div>
    </div>
  );
};

export default AggregateNode;
