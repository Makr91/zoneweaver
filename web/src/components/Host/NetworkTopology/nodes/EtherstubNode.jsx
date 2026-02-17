import { Handle, Position } from "@xyflow/react";
import PropTypes from "prop-types";

const EtherstubNode = ({ data }) => {
  const { label, connectedVnics, class: deviceClass, flags } = data;

  const tooltipContent = `
${label} (Etherstub - Virtual Switch)
Type: Virtual Layer 2 Switch
Connected VNICs: ${connectedVnics?.length || 0}
${connectedVnics?.length ? `VNICs: ${connectedVnics.join(", ")}` : "No connected VNICs"}
Class: ${deviceClass || "etherstub"}
${flags && flags !== "--" ? `Flags: ${flags}` : ""}
  `.trim();

  return (
    <div
      className="react-flow__node-default zw-node-base zw-etherstub-bg"
      title={tooltipContent}
    >
      {/* Handles */}
      <Handle
        type="target"
        position={Position.Left}
        className="zw-node-handle zw-etherstub-bg"
      />

      <Handle
        type="source"
        position={Position.Right}
        className="zw-node-handle zw-etherstub-bg"
      />

      {/* Icon */}
      <i className="fas fa-sitemap zw-node-icon" />

      {/* Label below */}
      <div className="zw-node-label">{label}</div>
    </div>
  );
};

EtherstubNode.propTypes = {
  data: PropTypes.shape({
    label: PropTypes.string,
    connectedVnics: PropTypes.arrayOf(PropTypes.string),
    class: PropTypes.string,
    flags: PropTypes.string,
  }).isRequired,
};

export default EtherstubNode;
