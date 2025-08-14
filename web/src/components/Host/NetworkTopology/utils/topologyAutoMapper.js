import { calculateNetworkBandwidth } from '../../utils';

/**
 * Auto-map network topology from existing Zoneweaver data sources
 * Transforms the complex OmniOS networking data into React Flow format
 */
export const autoMapTopology = ({
  interfaces = [],
  aggregates = [],
  etherstubs = [],
  vnics = [],
  zones = [],
  bandwidthData = [],
  ipAddresses = []
}) => {
  const nodes = [];
  const edges = [];
  
  // Create a map for quick bandwidth lookups - use pre-calculated values from API
  const bandwidthMap = new Map();
  console.log('🔍 TOPOLOGY: Processing bandwidth data:', bandwidthData.length, 'entries');
  console.log('🔍 TOPOLOGY: Raw bandwidth data sample:', bandwidthData.slice(0, 5));
  
  bandwidthData.forEach((usage, index) => {
    console.log(`🔍 TOPOLOGY: Processing usage entry ${index}:`, {
      link: usage.link,
      rx_mbps: usage.rx_mbps,
      tx_mbps: usage.tx_mbps,
      rx_bps: usage.rx_bps,
      tx_bps: usage.tx_bps,
      hasPreCalculated: !!(usage.rx_mbps !== undefined || usage.tx_mbps !== undefined),
      fullEntry: usage
    });
    
    if (usage.link && usage.ipackets !== 'IPACKETS') {
      // Use pre-calculated bandwidth from API instead of recalculating
      const bandwidth = {
        rxMbps: parseFloat(usage.rx_mbps) || 0,
        txMbps: parseFloat(usage.tx_mbps) || 0,
        totalMbps: (parseFloat(usage.rx_mbps) || 0) + (parseFloat(usage.tx_mbps) || 0),
        rxBytesPerSecond: parseInt(usage.rx_bps) || 0,
        txBytesPerSecond: parseInt(usage.tx_bps) || 0
      };
      
      console.log('🔍 TOPOLOGY: Using pre-calculated bandwidth for', usage.link, ':', bandwidth);
      bandwidthMap.set(usage.link, bandwidth);
    } else {
      console.log('🔍 TOPOLOGY: Skipping entry - link:', usage.link, 'ipackets:', usage.ipackets);
    }
  });
  
  console.log('🔍 TOPOLOGY: Bandwidth map created with', bandwidthMap.size, 'entries');
  console.log('🔍 TOPOLOGY: Bandwidth map contents:', Array.from(bandwidthMap.entries()));

  // Create a map for IP address assignments
  const ipMap = new Map();
  ipAddresses.forEach(addr => {
    if (addr.interface && addr.ip_address) {
      if (!ipMap.has(addr.interface)) {
        ipMap.set(addr.interface, []);
      }
      ipMap.get(addr.interface).push(addr);
    }
  });

  // Extract physical NICs and VNICs from the mixed interfaces array
  const physicalNics = interfaces.filter(iface => 
    iface.class === 'phys' && 
    iface.link && 
    iface.link !== 'LINK'
  );
  
  // If vnics array is empty, extract VNICs from interfaces array
  const allVnics = vnics.length > 0 ? vnics : interfaces.filter(iface => 
    iface.class === 'vnic' && 
    iface.link && 
    iface.link !== 'LINK'
  );
  
  console.log('🔍 TOPOLOGY: Found', physicalNics.length, 'physical NICs and', allVnics.length, 'VNICs');
  console.log('🔍 TOPOLOGY: Physical NICs:', physicalNics.map(n => n.link));
  console.log('🔍 TOPOLOGY: VNICs:', allVnics.map(n => n.link));

  // 1. Physical NICs - At the edge of the system
  physicalNics.forEach((nic, index) => {
    const bandwidth = bandwidthMap.get(nic.link) || { rxMbps: 0, txMbps: 0, totalMbps: 0 };
    const ips = ipMap.get(nic.link) || [];
    
    nodes.push({
      id: nic.link,
      type: 'physicalNic',
      position: { x: 100, y: 100 + (index * 120) }, // Will be recalculated by layout
      data: {
        label: nic.link,
        class: nic.class,
        mtu: nic.mtu,
        state: nic.state,
        over: nic.over,
        speed: nic.speed,
        bandwidth: bandwidth,
        ipAddresses: ips,
        flags: nic.flags
      }
    });
  });

  // 2. Link Aggregates - Combine multiple physical NICs
  aggregates.forEach((aggr, index) => {
    const bandwidth = bandwidthMap.get(aggr.link) || { rxMbps: 0, txMbps: 0, totalMbps: 0 };
    const ips = ipMap.get(aggr.link) || [];
    const memberNics = aggr.over ? aggr.over.split(',').map(n => n.trim()) : [];
    
    nodes.push({
      id: aggr.link,
      type: 'aggregate',
      position: { x: 350, y: 100 + (index * 120) },
      data: {
        label: aggr.link,
        members: memberNics,
        policy: aggr.policy,
        lacpActivity: aggr.lacp_activity,
        lacpTimeout: aggr.lacp_timeout,
        flags: aggr.flags,
        bandwidth: bandwidth,
        ipAddresses: ips
      }
    });

    // Connect member NICs to aggregate - create TWO separate edges
    memberNics.forEach(memberNic => {
      const memberNicData = physicalNics.find(nic => nic.link === memberNic);
      if (memberNicData) {
        const memberBandwidth = bandwidthMap.get(memberNic) || { rxMbps: 0, txMbps: 0, totalMbps: 0 };
        const linkSpeed = parseInt(memberNicData.speed) || 1000;
        
        // Downlink edge (RX - traffic going TO the aggregate)
        edges.push({
          id: `${memberNic}-${aggr.link}-rx`,
          source: memberNic,
          target: aggr.link,
          type: 'floating',
          animated: memberBandwidth.rxMbps > 0,
          data: {
            type: 'aggregation',
            bandwidth: { 
              ...memberBandwidth, 
              totalMbps: memberBandwidth.rxMbps,
              direction: 'downlink'
            },
            linkSpeed: linkSpeed,
            sourceInterface: memberNic,
            targetInterface: aggr.link,
            flowDirection: 'rx'
          }
        });
        
        // Uplink edge (TX - traffic coming FROM the aggregate)
        edges.push({
          id: `${memberNic}-${aggr.link}-tx`,
          source: aggr.link,
          target: memberNic,
          type: 'floating',
          animated: memberBandwidth.txMbps > 0,
          data: {
            type: 'aggregation',
            bandwidth: { 
              ...memberBandwidth, 
              totalMbps: memberBandwidth.txMbps,
              direction: 'uplink'
            },
            linkSpeed: linkSpeed,
            sourceInterface: aggr.link,
            targetInterface: memberNic,
            flowDirection: 'tx'
          }
        });
      }
    });
  });

  // 3. Etherstubs - Virtual switches
  etherstubs.forEach((stub, index) => {
    const connectedVnics = allVnics.filter(vnic => vnic.over === stub.link);
    
    nodes.push({
      id: stub.link,
      type: 'etherstub',
      position: { x: 600, y: 100 + (index * 120) },
      data: {
        label: stub.link,
        connectedVnics: connectedVnics.map(v => v.link),
        class: stub.class,
        flags: stub.flags
      }
    });
  });

  // 4. VNICs - Virtual network interfaces
  allVnics.forEach((vnic, index) => {
    const bandwidth = bandwidthMap.get(vnic.link) || { rxMbps: 0, txMbps: 0, totalMbps: 0 };
    const ips = ipMap.get(vnic.link) || [];
    
    nodes.push({
      id: vnic.link,
      type: 'vnic',
      position: { x: 850, y: 100 + (index * 80) },
      data: {
        label: vnic.link,
        over: vnic.over,
        vlanId: vnic.vid,
        zone: vnic.zone,
        macaddress: vnic.macaddress,
        macaddrtype: vnic.macaddrtype,
        state: vnic.state,
        speed: vnic.speed,
        mtu: vnic.mtu,
        bandwidth: bandwidth,
        ipAddresses: ips
      }
    });

    // Connect VNIC to its underlying layer (physical NIC, aggregate, or etherstub)
    if (vnic.over) {
      // Find the source interface to get its speed
      const sourceInterface = physicalNics.find(nic => nic.link === vnic.over) || 
                             aggregates.find(agg => agg.link === vnic.over) ||
                             etherstubs.find(stub => stub.link === vnic.over);
      
      const linkSpeed = sourceInterface ? parseInt(sourceInterface.speed) || 1000 : 1000;
      
      // Create TWO separate edges - one for uplink (TX), one for downlink (RX)
      
      // Downlink edge (RX - traffic going TO the VNIC)
      edges.push({
        id: `${vnic.over}-${vnic.link}-rx`,
        source: vnic.over,
        target: vnic.link,
        type: 'floating',
        animated: bandwidth.rxMbps > 0,
        data: {
          type: vnic.vid ? 'vlan' : 'direct',
          vlanId: vnic.vid,
          bandwidth: { 
            ...bandwidth, 
            totalMbps: bandwidth.rxMbps,
            direction: 'downlink'
          },
          sourceInterface: vnic.over,
          targetInterface: vnic.link,
          linkSpeed: linkSpeed,
          flowDirection: 'rx'
        }
      });
      
      // Uplink edge (TX - traffic coming FROM the VNIC)
      edges.push({
        id: `${vnic.over}-${vnic.link}-tx`, 
        source: vnic.link,
        target: vnic.over,
        type: 'floating',
        animated: bandwidth.txMbps > 0,
        data: {
          type: vnic.vid ? 'vlan' : 'direct',
          vlanId: vnic.vid,
          bandwidth: { 
            ...bandwidth, 
            totalMbps: bandwidth.txMbps,
            direction: 'uplink'
          },
          sourceInterface: vnic.link,
          targetInterface: vnic.over,
          linkSpeed: linkSpeed,
          flowDirection: 'tx'
        }
      });
    }
  });

  // 5. Zones - Virtual machines/containers
  zones.forEach((zone, index) => {
    const zoneVnics = allVnics.filter(vnic => vnic.zone === zone.name);
    
    nodes.push({
      id: zone.name,
      type: 'zone',
      position: { x: 1100, y: 100 + (index * 100) },
      data: {
        label: zone.name,
        status: zone.status,
        zonename: zone.zonename,
        zonepath: zone.zonepath,
        autoboot: zone.autoboot,
        brand: zone.brand,
        ipType: zone.ipType,
        vnics: zoneVnics.map(v => v.link)
      }
    });

    // Connect zone to its VNICs - create TWO separate edges
    zoneVnics.forEach(vnic => {
      const vnicBandwidth = bandwidthMap.get(vnic.link) || { rxMbps: 0, txMbps: 0, totalMbps: 0 };
      const vnicData = allVnics.find(v => v.link === vnic.link);
      const linkSpeed = vnicData ? parseInt(vnicData.speed) || 1000 : 1000;
      
      console.log(`🔍 ZONE-EDGE: Creating zone edges for ${vnic.link} -> ${zone.name}`, {
        rxMbps: vnicBandwidth.rxMbps,
        txMbps: vnicBandwidth.txMbps,
        totalMbps: vnicBandwidth.totalMbps
      });
      
      // Downlink edge (RX - traffic going TO the zone)
      edges.push({
        id: `${vnic.link}-to-${zone.name}-rx`,
        source: vnic.link,
        target: zone.name,
        type: 'floating',
        animated: vnicBandwidth.rxMbps > 0,
        data: {
          type: 'assignment',
          bandwidth: { 
            ...vnicBandwidth, 
            totalMbps: vnicBandwidth.rxMbps,
            direction: 'downlink'
          },
          sourceInterface: vnic.link,
          targetInterface: zone.name,
          linkSpeed: linkSpeed,
          flowDirection: 'rx'
        }
      });
      
      // Uplink edge (TX - traffic coming FROM the zone)
      edges.push({
        id: `${zone.name}-to-${vnic.link}-tx`,
        source: zone.name,
        target: vnic.link,
        type: 'floating',
        animated: vnicBandwidth.txMbps > 0,
        data: {
          type: 'assignment',
          bandwidth: { 
            ...vnicBandwidth, 
            totalMbps: vnicBandwidth.txMbps,
            direction: 'uplink'
          },
          sourceInterface: zone.name,
          targetInterface: vnic.link,
          linkSpeed: linkSpeed,
          flowDirection: 'tx'
        }
      });
      
      console.log(`🔍 ZONE-EDGE: Created edges:`, [
        `${vnic.link}-${zone.name}-rx (${vnicBandwidth.rxMbps}M)`,
        `${vnic.link}-${zone.name}-tx (${vnicBandwidth.txMbps}M)`
      ]);
    });
  });

  // 6. Handle special cases and detect patterns
  detectTopologyPatterns({ nodes, edges, interfaces, aggregates, etherstubs, vnics, zones });

  return { nodes, edges };
};

/**
 * Detect common topology patterns and add metadata
 */
const detectTopologyPatterns = ({ nodes, edges, interfaces, aggregates, etherstubs, vnics, zones }) => {
  const patterns = [];
  
  // Detect high availability setups
  if (aggregates.length > 0) {
    patterns.push({
      type: 'high-availability',
      description: 'Link aggregation detected for network redundancy',
      count: aggregates.length
    });
  }
  
  // Detect virtualized switching
  if (etherstubs.length > 0) {
    patterns.push({
      type: 'virtualized-switching',
      description: 'Virtual switching infrastructure using etherstubs',
      count: etherstubs.length
    });
  }
  
  // Detect VLAN segmentation
  const vlanCount = new Set(vnics.filter(v => v.vid).map(v => v.vid)).size;
  if (vlanCount > 1) {
    patterns.push({
      type: 'network-segmentation',
      description: `Network segmentation using ${vlanCount} VLANs`,
      count: vlanCount
    });
  }
  
  // Detect zone networking complexity
  const zonesWithMultipleVnics = zones.filter(zone => 
    vnics.filter(vnic => vnic.zone === zone.name).length > 1
  ).length;
  
  if (zonesWithMultipleVnics > 0) {
    patterns.push({
      type: 'multi-homed-zones',
      description: 'Zones with multiple network interfaces detected',
      count: zonesWithMultipleVnics
    });
  }

  return patterns;
};

/**
 * Helper function to get VLAN color for consistency
 */
export const getVlanColor = (vlanId) => {
  if (!vlanId || vlanId === 0) return '#48c78e'; // Default/untagged - green
  
  const colors = [
    '#3273dc', // Blue
    '#48c78e', // Green  
    '#ffdd57', // Yellow
    '#f14668', // Red
    '#00d1b2', // Teal
    '#ff9f43', // Orange
    '#6f42c1', // Purple
    '#e83e8c'  // Pink
  ];
  
  return colors[vlanId % colors.length];
};

/**
 * Helper function to get bandwidth saturation color
 */
export const getBandwidthColor = (current, maximum) => {
  if (!maximum || maximum === 0) return '#dbdbdb'; // Gray for unknown
  
  const saturation = (current / maximum) * 100;
  
  if (saturation < 25) return '#48c78e';      // Green - Light load
  if (saturation < 50) return '#ffdd57';      // Yellow - Moderate load  
  if (saturation < 75) return '#ff9f43';      // Orange - Heavy load
  if (saturation < 90) return '#f14668';      // Red - Critical load
  return '#e74c3c';                           // Dark Red - Overloaded
};
