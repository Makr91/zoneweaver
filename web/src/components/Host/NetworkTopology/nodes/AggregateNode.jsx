import React from 'react';
import { Handle, Position } from '@xyflow/react';

const AggregateNode = ({ data }) => {
  const { 
    label, 
    members, 
    policy, 
    lacpActivity, 
    lacpTimeout, 
    flags, 
    bandwidth, 
    ipAddresses 
  } = data;

  const formatBandwidth = (bw) => {
    if (!bw) return '0 Mbps';
    if (bw >= 1000) {
      return `${(bw / 1000).toFixed(1)}G`;
    }
    return `${bw.toFixed(1)}M`;
  };

  const tooltipContent = `
${label} (Link Aggregate)
Members: ${members?.join(', ') || 'None'}
Policy: ${policy || 'Unknown'}
LACP Activity: ${lacpActivity || 'N/A'}
LACP Timeout: ${lacpTimeout || 'N/A'}
${bandwidth ? `Bandwidth: ${formatBandwidth(bandwidth.totalMbps)} (↓${formatBandwidth(bandwidth.rxMbps)} ↑${formatBandwidth(bandwidth.txMbps)})` : 'No bandwidth data'}
${ipAddresses?.length ? `IP: ${ipAddresses.map(ip => ip.ip_address).join(', ')}` : 'No IP addresses'}
${flags && flags !== '--' ? `Flags: ${flags}` : ''}
  `.trim();

  return (
    <div 
      className="react-flow__node-default" 
      style={{ 
        width: '46px',
        height: '46px',
        borderRadius: '23px',
        backgroundColor: 'var(--zw-aggregate-color)',
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
          background: 'var(--zw-aggregate-color)',
          border: '2px solid white',
          width: '8px',
          height: '8px'
        }}
      />
      
      <Handle
        type="source"
        position={Position.Right}
        style={{ 
          background: 'var(--zw-aggregate-color)',
          border: '2px solid white',
          width: '8px',
          height: '8px'
        }}
      />

      {/* Icon */}
      <i 
        className="fas fa-link" 
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

export default AggregateNode;
