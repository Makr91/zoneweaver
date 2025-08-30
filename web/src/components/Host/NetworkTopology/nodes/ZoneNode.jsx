import React from 'react';
import { Handle, Position } from '@xyflow/react';

const ZoneNode = ({ data }) => {
  const { 
    label, 
    status, 
    zonename, 
    zonepath, 
    autoboot, 
    brand, 
    ipType, 
    vnics 
  } = data;

  const isRunning = status?.toLowerCase() === 'running';

  const tooltipContent = `
${label} (Zone)
Status: ${status || 'unknown'}
Zone Name: ${zonename || label}
Zone Path: ${zonepath || 'N/A'}
Brand: ${brand || 'N/A'}
IP Type: ${ipType || 'N/A'}
Autoboot: ${autoboot || 'N/A'}
VNICs: ${vnics?.length || 0}
${vnics?.length ? `Connected: ${vnics.join(', ')}` : 'No VNICs connected'}
  `.trim();

  return (
    <div 
      className={`react-flow__node-default zw-node-base ${isRunning ? 'zw-zone-running' : 'zw-zone-stopped'}`}
      title={tooltipContent}
    >
      {/* Handles - Both target and source for bidirectional traffic */}
      <Handle
        type="target"
        position={Position.Top}
        className="zw-node-handle zw-zone-active-bg"
      />
      <Handle
        type="source"
        position={Position.Top}
        className="zw-node-handle zw-zone-active-bg has-left-75-percent"
      />

      {/* Icon */}
      <i className="fas fa-server zw-node-icon" />
      
      {/* Status indicator */}
      <div 
        className={`zw-zone-status-indicator ${isRunning ? 'zw-nic-active-bg' : 'zw-zone-active-bg'}`}
      />
      
      {/* Label below */}
      <div className="zw-node-label">
        {label}
      </div>
    </div>
  );
};

export default ZoneNode;
