/**
 * Apply view-specific transformations to modify topology data
 * IMPORTANT: Views should ONLY change visual emphasis, NEVER hide nodes
 */
export const applyViewTransformation = (topology, viewType, filters) => {
  const { nodes, edges } = topology;
  
  console.log('🔍 VIEW: Applying view transformation', viewType, 'to', nodes.length, 'nodes');
  
  // ONLY apply node type filters if user explicitly unchecked them
  // Default behavior: show ALL nodes
  let filteredNodes = nodes.filter(node => {
    return filters.nodeTypes[node.type] !== false;
  });
  
  // Filter out unattached nodes if showUnattachedNodes is false (default)
  if (!filters.showUnattachedNodes) {
    // Find nodes that have at least one edge connection
    const connectedNodeIds = new Set();
    edges.forEach(edge => {
      connectedNodeIds.add(edge.source);
      connectedNodeIds.add(edge.target);
    });
    
    const beforeCount = filteredNodes.length;
    filteredNodes = filteredNodes.filter(node => connectedNodeIds.has(node.id));
    const afterCount = filteredNodes.length;
    
    console.log('🔍 VIEW: Filtered out', beforeCount - afterCount, 'unattached nodes');
  }
  
  console.log('🔍 VIEW: After filtering, have', filteredNodes.length, 'nodes');

  // Apply view-specific transformations (VISUAL EMPHASIS ONLY)
  switch (viewType) {
    case 'physical':
      return getPhysicalView(filteredNodes, edges, filters);
    
    case 'logical':
      return getLogicalView(filteredNodes, edges, filters);
    
    case 'zone-centric':
      return getZoneCentricView(filteredNodes, edges, filters);
    
    case 'bandwidth':
      return getBandwidthView(filteredNodes, edges, filters);
    
    case 'vlan':
      return getVlanView(filteredNodes, edges, filters);
    
    case 'troubleshoot':
      return getTroubleshootView(filteredNodes, edges, filters);
    
    default:
      return { nodes: filteredNodes, edges };
  }
};

/**
 * Physical Infrastructure View - Focus on hardware components
 */
const getPhysicalView = (nodes, edges, filters) => {
  console.log('🔍 VIEW: Physical view transformation for', nodes.length, 'nodes');
  
  // Show physical NICs and aggregates prominently, keep ALL others clearly visible
  const transformedNodes = nodes.map(node => {
    if (node.type === 'physicalNic' || node.type === 'aggregate') {
      return {
        ...node,
        style: {
          ...node.style,
          zIndex: 10,
          border: '3px solid #48c78e',
          boxShadow: '0 0 15px rgba(72, 199, 142, 0.5)',
          opacity: 1
        }
      };
    } else {
      // Ensure ALL other nodes are fully visible
      return {
        ...node,
        style: {
          ...node.style,
          opacity: 1, // FULL visibility for all nodes
          zIndex: 8
        }
      };
    }
  });

  console.log('🔍 VIEW: Physical view applied to', transformedNodes.length, 'nodes');

  // Keep all edges clearly visible - same style as VLANs
  const transformedEdges = edges.map(edge => ({
    ...edge,
    style: {
      ...edge.style,
      opacity: 1 // Full visibility for all edges
    }
  }));

  return { nodes: transformedNodes, edges: transformedEdges };
};

/**
 * Logical Network View - Focus on virtual networking
 */
const getLogicalView = (nodes, edges, filters) => {
  // Keep all nodes visible but emphasize virtual components - NO TRANSFORM PROPERTY!
  const transformedNodes = nodes.map(node => {
    if (node.type === 'etherstub' || node.type === 'vnic') {
      return {
        ...node,
        style: {
          ...node.style,
          zIndex: 10,
          border: '3px solid #ffdd57',
          boxShadow: '0 0 15px rgba(255, 221, 87, 0.5)',
          opacity: 1
        }
      };
    } else if (node.type === 'zone') {
      return {
        ...node,
        style: {
          ...node.style,
          zIndex: 8,
          border: '2px solid #f14668',
          opacity: 1
        }
      };
    } else {
      return {
        ...node,
        style: {
          ...node.style,
          opacity: 1, // FULL visibility for all nodes
          zIndex: 5
        }
      };
    }
  });

  // Keep all edges clearly visible - same style as VLANs
  const transformedEdges = edges.map(edge => ({
    ...edge,
    style: {
      ...edge.style,
      opacity: 1 // Full visibility for all edges
    }
  }));

  return { nodes: transformedNodes, edges: transformedEdges };
};

/**
 * Zone-Centric View - Organize around zones and their network paths
 */
const getZoneCentricView = (nodes, edges, filters) => {
  // Transform all nodes with zone emphasis - NO TRANSFORM PROPERTY!
  const transformedNodes = nodes.map(node => {
    if (node.type === 'zone') {
      return {
        ...node,
        style: {
          ...node.style,
          zIndex: 15,
          border: '3px solid #f14668',
          boxShadow: '0 0 15px rgba(241, 70, 104, 0.5)',
          opacity: 1
        }
      };
    } else if (node.type === 'vnic') {
      return {
        ...node,
        style: {
          ...node.style,
          zIndex: 10,
          border: '2px solid #ff9f43',
          opacity: 1
        }
      };
    } else {
      return {
        ...node,
        style: {
          ...node.style,
          zIndex: 5,
          opacity: 1
        }
      };
    }
  });

  // Keep all edges clearly visible - same style as VLANs
  const transformedEdges = edges.map(edge => ({
    ...edge,
    style: {
      ...edge.style,
      opacity: 1 // Full visibility for all edges
    }
  }));

  return { nodes: transformedNodes, edges: transformedEdges };
};

/**
 * Bandwidth Flow View - Emphasize traffic patterns
 */
const getBandwidthView = (nodes, edges, filters) => {
  // Calculate bandwidth intensity for each node
  const nodeBandwidth = new Map();
  
  edges.forEach(edge => {
    const bandwidth = edge.data?.bandwidth?.totalMbps || 0;
    
    // Add bandwidth to source node
    if (!nodeBandwidth.has(edge.source)) {
      nodeBandwidth.set(edge.source, 0);
    }
    nodeBandwidth.set(edge.source, nodeBandwidth.get(edge.source) + bandwidth);
    
    // Add bandwidth to target node
    if (!nodeBandwidth.has(edge.target)) {
      nodeBandwidth.set(edge.target, 0);
    }
    nodeBandwidth.set(edge.target, nodeBandwidth.get(edge.target) + bandwidth);
  });

  // Transform nodes based on bandwidth intensity - NO TRANSFORM PROPERTY!
  const transformedNodes = nodes.map(node => {
    const bandwidth = nodeBandwidth.get(node.id) || 0;
    
    if (bandwidth > 100) {
      return {
        ...node,
        style: {
          ...node.style,
          opacity: 1,
          zIndex: 15,
          border: '3px solid #48c78e',
          boxShadow: '0 0 15px rgba(72, 199, 142, 0.8)'
        }
      };
    } else if (bandwidth > 50) {
      return {
        ...node,
        style: {
          ...node.style,
          opacity: 1,
          zIndex: 10,
          border: '2px solid #ffdd57',
          boxShadow: '0 0 10px rgba(255, 221, 87, 0.6)'
        }
      };
    } else {
      return {
        ...node,
        style: {
          ...node.style,
          opacity: 1,
          zIndex: 5
        }
      };
    }
  });

  // Keep all edges clearly visible - same style as VLANs
  const transformedEdges = edges.map(edge => ({
    ...edge,
    style: {
      ...edge.style,
      opacity: 1 // Full visibility for all edges
    }
  }));

  return { nodes: transformedNodes, edges: transformedEdges };
};

/**
 * VLAN Isolation View - Group by VLAN membership
 */
const getVlanView = (nodes, edges, filters) => {
  // Transform ALL nodes to highlight VLAN groupings - NEVER FILTER OUT NODES
  const transformedNodes = nodes.map(node => {
    if (node.type === 'vnic' && node.data.vlanId) {
      return {
        ...node,
        style: {
          ...node.style,
          border: `3px solid ${getVlanColor(node.data.vlanId)}`,
          boxShadow: `0 0 10px ${getVlanColor(node.data.vlanId)}40`,
          opacity: 1
        }
      };
    }
    // Ensure all other nodes are visible
    return {
      ...node,
      style: {
        ...node.style,
        opacity: node.type === 'vnic' ? 0.8 : 0.7 // De-emphasize non-VLAN nodes but keep visible
      }
    };
  });

  return { nodes: transformedNodes, edges };
};

/**
 * Troubleshooting View - Highlight potential issues
 */
const getTroubleshootView = (nodes, edges, filters) => {
  // Identify potential issues
  const issues = [];
  
  // Check for high bandwidth utilization
  const highBandwidthNodes = nodes.filter(node => {
    return edges.some(edge => {
      const bandwidth = edge.data?.bandwidth?.totalMbps || 0;
      return (edge.source === node.id || edge.target === node.id) && bandwidth > 800;
    });
  });

  // Check for down interfaces
  const downNodes = nodes.filter(node => {
    return node.data.state?.toLowerCase() === 'down' || 
           node.data.status?.toLowerCase() === 'configured';
  });

  // Check for zones without network connectivity
  const disconnectedZones = nodes.filter(node => {
    if (node.type !== 'zone') return false;
    const hasConnections = edges.some(edge => edge.target === node.id);
    return !hasConnections;
  });

  // Transform nodes to highlight issues
  const transformedNodes = nodes.map(node => {
    let alertLevel = 'normal';
    let alertMessage = '';

    if (highBandwidthNodes.includes(node)) {
      alertLevel = 'warning';
      alertMessage = 'High bandwidth utilization';
    }
    
    if (downNodes.includes(node)) {
      alertLevel = 'error';
      alertMessage = 'Interface down';
    }
    
    if (disconnectedZones.includes(node)) {
      alertLevel = 'error';
      alertMessage = 'No network connectivity';
    }

    if (alertLevel !== 'normal') {
      return {
        ...node,
        data: {
          ...node.data,
          alertLevel,
          alertMessage
        },
        style: {
          ...node.style,
          border: `3px solid ${alertLevel === 'error' ? '#f14668' : '#ffdd57'}`,
          animation: 'pulse 2s infinite',
          boxShadow: `0 0 15px ${alertLevel === 'error' ? '#f14668' : '#ffdd57'}60`
        }
      };
    }

    return node;
  });

  return { nodes: transformedNodes, edges };
};

// Helper function to get VLAN color (imported from main utility)
const getVlanColor = (vlanId) => {
  if (!vlanId || vlanId === 0) return '#48c78e';
  
  const colors = [
    '#3273dc', '#48c78e', '#ffdd57', '#f14668', 
    '#00d1b2', '#ff9f43', '#6f42c1', '#e83e8c'
  ];
  
  return colors[vlanId % colors.length];
};
