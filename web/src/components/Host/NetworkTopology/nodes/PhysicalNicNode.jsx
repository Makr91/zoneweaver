import React from 'react';
import { Handle, Position } from '@xyflow/react';

const PhysicalNicNode = ({ data }) => {
  const { 
    label, 
    state, 
    speed, 
    bandwidth, 
    ipAddresses, 
    mtu,
    flags 
  } = data;

  const isActive = state?.toLowerCase() === 'up';
  
  const formatSpeed = (speed) => {
    const speedNum = parseInt(speed) || 0;
    if (speedNum >= 1000) {
      return `${speedNum / 1000}G`;
    }
    return `${speedNum}M`;
  };

  const formatBandwidth = (bw) => {
    if (!bw) return '0 Mbps';
    if (bw >= 1000) {
      return `${(bw / 1000).toFixed(1)}G`;
    }
    return `${bw.toFixed(1)}M`;
  };

  const tooltipContent = `
${label} (Physical NIC)
Status: ${state || 'unknown'}
Speed: ${formatSpeed(speed)}
MTU: ${mtu || 'N/A'}
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
        backgroundColor: isActive ? '#48c78e' : '#6b7280',
        border: '2px solid white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
      }}
      title={tooltipContent}
    >
      {/* Handles - Top for input (from network), Bottom for output (to VNICs) */}
      <Handle
        type="target"
        position={Position.Top}
        style={{ 
          background: isActive ? '#48c78e' : '#6b7280',
          border: '2px solid white',
          width: '8px',
          height: '8px'
        }}
      />
      
      <Handle
        type="source"
        position={Position.Bottom}
        style={{ 
          background: isActive ? '#48c78e' : '#6b7280',
          border: '2px solid white',
          width: '8px',
          height: '8px'
        }}
      />

      {/* Icon */}
      <i 
        className="fas fa-ethernet" 
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

export default PhysicalNicNode;
