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
      className="react-flow__node-default zw-node-base" 
      style={{ backgroundColor: isRunning ? 'var(--zw-zone-active)' : 'var(--zw-zone-inactive)' }}
      title={tooltipContent}
    >
      {/* Handles - Both target and source for bidirectional traffic */}
      <Handle
        type="target"
        position={Position.Top}
        className="zw-node-handle"
        style={{ background: 'var(--zw-zone-active)' }}
      />
      <Handle
        type="source"
        position={Position.Top}
        className="zw-node-handle"
        style={{ 
          background: 'var(--zw-zone-active)',
          left: '75%'
        }}
      />

      {/* Icon */}
      <i className="fas fa-server zw-node-icon" />
      
      {/* Status indicator */}
      <div 
        className="zw-zone-status-indicator"
        style={{ backgroundColor: isRunning ? 'var(--zw-nic-active)' : 'var(--zw-zone-active)' }}
      />
      
      {/* Label below */}
      <div className="zw-node-label">
        {label}
      </div>
    </div>
  );
};

export default ZoneNode;
