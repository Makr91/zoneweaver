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
      className="react-flow__node-default" 
      style={{ 
        width: '46px',
        height: '46px',
        borderRadius: '23px',
        backgroundColor: '#ffdd57',
        border: '2px solid white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
      }}
      title={tooltipContent}
    >
      {/* Handles */}
      <Handle
        type="target"
        position={Position.Left}
        style={{ 
          background: '#ffdd57',
          border: '2px solid white',
          width: '8px',
          height: '8px'
        }}
      />
      
      <Handle
        type="source"
        position={Position.Right}
        style={{ 
          background: '#ffdd57',
          border: '2px solid white',
          width: '8px',
          height: '8px'
        }}
      />

      {/* Icon */}
      <i 
        className="fas fa-sitemap" 
        style={{ 
          color: 'white',
          fontSize: '18px'
        }}
      />
      
      {/* Label below */}
      <div style={{
        position: 'absolute',
        top: '48px',
        fontSize: '10px',
        fontWeight: 'bold',
        color: '#374151',
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

export default EtherstubNode;
