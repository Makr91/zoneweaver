import React from 'react';
import { Handle, Position } from '@xyflow/react';

const VnicNode = ({ data }) => {
  const { 
    label, 
    over, 
    vlanId, 
    zone, 
    macaddress, 
    macaddrtype, 
    state, 
    speed, 
    mtu, 
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

  const formatSpeed = (speed) => {
    const speedNum = parseInt(speed) || 0;
    if (speedNum >= 1000) {
      return `${speedNum / 1000}G`;
    }
    return `${speedNum}M`;
  };

  const tooltipContent = `
${label} (Virtual NIC)
State: ${state || 'unknown'}
Over: ${over || 'N/A'}
${vlanId ? `VLAN: ${vlanId}` : 'No VLAN'}
Zone: ${zone || 'global'}
MAC: ${macaddress || 'N/A'}
MAC Type: ${macaddrtype || 'N/A'}
Speed: ${formatSpeed(speed)}
MTU: ${mtu || 'N/A'}
${bandwidth ? `Bandwidth: ${formatBandwidth(bandwidth.totalMbps)} (↓${formatBandwidth(bandwidth.rxMbps)} ↑${formatBandwidth(bandwidth.txMbps)})` : 'No bandwidth data'}
${ipAddresses?.length ? `IP: ${ipAddresses.map(ip => ip.ip_address).join(', ')}` : 'No IP addresses'}
  `.trim();

  // Color based on VLAN or status
  const getColor = () => {
    if (vlanId) {
      // Different colors for VLANs
      const colors = ['#ff9f43', '#e67e22', '#f39c12', '#d35400'];
      return colors[parseInt(vlanId) % colors.length];
    }
    return state?.toLowerCase() === 'up' ? '#ff9f43' : '#6b7280';
  };

  return (
    <div 
      className="react-flow__node-default" 
      style={{ 
        width: '46px',
        height: '46px',
        borderRadius: '23px',
        backgroundColor: getColor(),
        border: '2px solid white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
      }}
      title={tooltipContent}
    >
      {/* Handles - Top for input (from physical/aggregates), Bottom for output (to zones) */}
      <Handle
        type="target"
        position={Position.Top}
        style={{ 
          background: 'var(--zw-vnic-color)',
          border: '2px solid white',
          width: '8px',
          height: '8px'
        }}
      />
      
      <Handle
        type="source"
        position={Position.Bottom}
        style={{ 
          background: 'var(--zw-vnic-color)',
          border: '2px solid white',
          width: '8px',
          height: '8px'
        }}
      />

      {/* Icon */}
      <i 
        className="fas fa-network-wired" 
        style={{ 
          color: 'white',
          fontSize: '18px'
        }}
      />
      
      {/* VLAN badge if present */}
      {vlanId && (
        <div style={{
          position: 'absolute',
          top: '-8px',
          right: '-8px',
          backgroundColor: '#e74c3c',
          color: 'white',
          borderRadius: '8px',
          fontSize: '8px',
          padding: '2px 4px',
          fontWeight: 'bold',
          minWidth: '16px',
          textAlign: 'center'
        }}>
          {vlanId}
        </div>
      )}
      
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

export default VnicNode;
