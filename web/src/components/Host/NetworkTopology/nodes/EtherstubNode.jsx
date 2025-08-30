import React from 'react';
import { Handle, Position } from '@xyflow/react';

const EtherstubNode = ({ data }) => {
  const { 
    label, 
    connectedVnics, 
    class: deviceClass, 
    flags 
  } = data;

  const tooltipContent = `
${label} (Etherstub - Virtual Switch)
Type: Virtual Layer 2 Switch
Connected VNICs: ${connectedVnics?.length || 0}
${connectedVnics?.length ? `VNICs: ${connectedVnics.join(', ')}` : 'No connected VNICs'}
Class: ${deviceClass || 'etherstub'}
${flags && flags !== '--' ? `Flags: ${flags}` : ''}
  `.trim();

  return (
    <div 
      className="react-flow__node-default zw-node-base" 
      style={{ backgroundColor: 'var(--zw-etherstub-color)' }}
      title={tooltipContent}
    >
      {/* Handles */}
      <Handle
        type="target"
        position={Position.Left}
        className="zw-node-handle"
        style={{ background: 'var(--zw-etherstub-color)' }}
      />
      
      <Handle
        type="source"
        position={Position.Right}
        className="zw-node-handle"
        style={{ background: 'var(--zw-etherstub-color)' }}
      />

      {/* Icon */}
      <i className="fas fa-sitemap zw-node-icon" />
      
      {/* Label below */}
      <div className="zw-node-label">
        {label}
      </div>
    </div>
  );
};

export default EtherstubNode;
