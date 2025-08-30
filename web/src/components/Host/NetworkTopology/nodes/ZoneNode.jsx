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
      className="react-flow__node-default" 
      style={{ 
        width: '46px',
        height: '46px',
        borderRadius: '23px',
        backgroundColor: isRunning ? 'var(--zw-zone-active)' : 'var(--zw-zone-inactive)',
        border: '2px solid white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
      }}
      title={tooltipContent}
    >
      {/* Handles - Both target and source for bidirectional traffic */}
      <Handle
        type="target"
        position={Position.Top}
        style={{ 
          background: 'var(--zw-zone-active)',
          border: '2px solid white',
          width: '8px',
          height: '8px'
        }}
      />
      <Handle
        type="source"
        position={Position.Top}
        style={{ 
          background: 'var(--zw-zone-active)',
          border: '2px solid white',
          width: '8px',
          height: '8px',
          left: '75%'
        }}
      />

      {/* Icon */}
      <i 
        className="fas fa-server" 
        style={{ 
          color: 'white',
          fontSize: '18px'
        }}
      />
      
      {/* Status indicator */}
      <div style={{
        position: 'absolute',
        top: '-4px',
        right: '-4px',
        width: '14px',
        height: '14px',
        borderRadius: '50%',
        backgroundColor: isRunning ? 'var(--zw-nic-active)' : 'var(--zw-zone-active)',
        border: '2px solid white'
      }} />
      
      {/* Label below */}
      <div style={{
        position: 'absolute',
        top: '48px',
        fontSize: '10px',
        fontWeight: 'bold',
        color: 'var(--zw-node-text)',
        textAlign: 'center',
        width: '60px',
        left: '50%',
        transform: 'translateX(-50%)'
      }}>
        {label}
      </div>
    </div>
  );
};

export default ZoneNode;
