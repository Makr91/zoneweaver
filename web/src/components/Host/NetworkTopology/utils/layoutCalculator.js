// Temporarily disable dagre import to debug the crash
// import dagre from 'dagre';

/**
 * Calculate layout for network topology based on the selected algorithm and view
 */
export const calculateLayout = (topology, layoutType, viewType) => {
  const { nodes, edges } = topology;

  switch (layoutType) {
    case "hierarchical":
      return calculateHierarchicalLayout(nodes, edges, viewType);

    case "force":
      return calculateForceLayout(nodes, edges, viewType);

    case "circular":
      return calculateCircularLayout(nodes, edges, viewType);

    case "grid":
      return calculateGridLayout(nodes, edges, viewType);

    default:
      return calculateHierarchicalLayout(nodes, edges, viewType);
  }
};

/**
 * Vertical hierarchical layout - Physical NICs at top in a row, then layers below
 */
const calculateHierarchicalLayout = (nodes, edges, viewType) => {
  console.log(
    "🔍 LAYOUT: Calculating vertical hierarchical layout for",
    nodes.length,
    "nodes"
  );

  // Group nodes by type for layered layout
  const nodesByType = {
    physicalNic: nodes.filter((n) => n.type === "physicalNic"),
    aggregate: nodes.filter((n) => n.type === "aggregate"),
    etherstub: nodes.filter((n) => n.type === "etherstub"),
    vnic: nodes.filter((n) => n.type === "vnic"),
    zone: nodes.filter((n) => n.type === "zone"),
  };

  console.log(
    "🔍 LAYOUT: Nodes by type:",
    Object.fromEntries(
      Object.entries(nodesByType).map(([type, nodes]) => [type, nodes.length])
    )
  );

  const layoutedNodes = [];
  const horizontalSpacing = 120; // Horizontal spacing between nodes in a row
  const layerHeight = 300; // Vertical spacing between layers (doubled for better visibility)
  const viewportWidth = 1000; // Assume a reasonable viewport width
  const viewportHeight = 500; // Assume a reasonable viewport height
  const minStartX = 100; // Minimum left margin
  const vnicSpacing = 80; // Closer spacing for VNICs

  // Calculate width for each active row
  const rowWidths = [];
  if (nodesByType.physicalNic.length > 0) {
    rowWidths.push((nodesByType.physicalNic.length - 1) * horizontalSpacing);
  }
  if (nodesByType.aggregate.length > 0) {
    rowWidths.push((nodesByType.aggregate.length - 1) * horizontalSpacing);
  }
  if (nodesByType.etherstub.length > 0) {
    rowWidths.push((nodesByType.etherstub.length - 1) * horizontalSpacing);
  }
  if (nodesByType.vnic.length > 0) {
    rowWidths.push((nodesByType.vnic.length - 1) * vnicSpacing);
  }
  if (nodesByType.zone.length > 0) {
    rowWidths.push((nodesByType.zone.length - 1) * horizontalSpacing);
  }

  // Find the maximum width (longest row) and calculate master center point
  const maxRowWidth = Math.max(...rowWidths, 0);
  const masterCenterX = viewportWidth / 2; // Center of viewport

  console.log("🔍 LAYOUT: Row widths:", rowWidths);
  console.log(
    "🔍 LAYOUT: Max row width:",
    maxRowWidth,
    "Master center X:",
    masterCenterX
  );

  // Helper function to calculate justified layout for shorter rows
  const getJustifiedLayout = (
    nodeCount,
    defaultSpacing,
    rowType = "default"
  ) => {
    if (nodeCount <= 1) {
      return { startX: masterCenterX, spacing: defaultSpacing };
    }

    const normalRowWidth = (nodeCount - 1) * defaultSpacing;

    // If this row is significantly shorter than the max, justify it by increasing spacing
    if (maxRowWidth > normalRowWidth * 1.5) {
      // Calculate available width for justification (use 70% of max width for aesthetics)
      const availableWidth = maxRowWidth * 0.7;
      const justifiedSpacing = Math.min(
        availableWidth / (nodeCount - 1),
        defaultSpacing * 2 // Don't spread more than 2x normal spacing
      );

      const justifiedRowWidth = (nodeCount - 1) * justifiedSpacing;
      const startX = Math.max(minStartX, masterCenterX - justifiedRowWidth / 2);

      console.log(
        `🔍 LAYOUT: Justifying ${rowType} row - nodes: ${nodeCount}, normal width: ${normalRowWidth}, justified width: ${justifiedRowWidth}, spacing: ${justifiedSpacing}`
      );

      return { startX, spacing: justifiedSpacing };
    }

    // For longer rows or when justification isn't needed, use normal centering
    const startX = Math.max(minStartX, masterCenterX - normalRowWidth / 2);
    return { startX, spacing: defaultSpacing };
  };

  // Calculate total layers needed and center vertically
  const activeLayers = [
    nodesByType.physicalNic.length > 0,
    nodesByType.aggregate.length > 0,
    nodesByType.etherstub.length > 0,
    nodesByType.vnic.length > 0,
    nodesByType.zone.length > 0,
  ].filter(Boolean).length;

  const totalHeight = Math.max(0, (activeLayers - 1) * layerHeight); // Height from first to last layer
  const centeredStartY = Math.max(50, (viewportHeight - totalHeight) / 2); // Center vertically with minimum margin

  // Layout in vertical layers with horizontal rows
  let currentY = centeredStartY;

  // Layer 1: Physical NICs at the top in a horizontal row
  if (nodesByType.physicalNic.length > 0) {
    const layout = getJustifiedLayout(
      nodesByType.physicalNic.length,
      horizontalSpacing,
      "physicalNic"
    );

    nodesByType.physicalNic.forEach((node, index) => {
      const position = {
        x: layout.startX + index * layout.spacing,
        y: currentY,
      };

      console.log(
        `🔍 LAYOUT: Placing physicalNic node ${node.id} at position`,
        position
      );

      layoutedNodes.push({
        ...node,
        position,
      });
    });

    currentY += layerHeight;
  }

  // Layer 2: Aggregates (if any)
  if (nodesByType.aggregate.length > 0) {
    const layout = getJustifiedLayout(
      nodesByType.aggregate.length,
      horizontalSpacing,
      "aggregate"
    );

    nodesByType.aggregate.forEach((node, index) => {
      const position = {
        x: layout.startX + index * layout.spacing,
        y: currentY,
      };

      console.log(
        `🔍 LAYOUT: Placing aggregate node ${node.id} at position`,
        position
      );

      layoutedNodes.push({
        ...node,
        position,
      });
    });

    currentY += layerHeight;
  }

  // Layer 3: Etherstubs (if any)
  if (nodesByType.etherstub.length > 0) {
    const layout = getJustifiedLayout(
      nodesByType.etherstub.length,
      horizontalSpacing,
      "etherstub"
    );

    nodesByType.etherstub.forEach((node, index) => {
      const position = {
        x: layout.startX + index * layout.spacing,
        y: currentY,
      };

      console.log(
        `🔍 LAYOUT: Placing etherstub node ${node.id} at position`,
        position
      );

      layoutedNodes.push({
        ...node,
        position,
      });
    });

    currentY += layerHeight;
  }

  // Layer 4: VNICs - arrange all on a single row, close together
  if (nodesByType.vnic.length > 0) {
    const layout = getJustifiedLayout(
      nodesByType.vnic.length,
      vnicSpacing,
      "vnic"
    );

    nodesByType.vnic.forEach((node, index) => {
      const position = {
        x: layout.startX + index * layout.spacing,
        y: currentY,
      };

      console.log(
        `🔍 LAYOUT: Placing vnic node ${node.id} at position`,
        position
      );

      layoutedNodes.push({
        ...node,
        position,
      });
    });

    currentY += layerHeight;
  }

  // Layer 5: Zones at the bottom
  if (nodesByType.zone.length > 0) {
    const layout = getJustifiedLayout(
      nodesByType.zone.length,
      horizontalSpacing,
      "zone"
    );

    nodesByType.zone.forEach((node, index) => {
      const position = {
        x: layout.startX + index * layout.spacing,
        y: currentY,
      };

      console.log(
        `🔍 LAYOUT: Placing zone node ${node.id} at position`,
        position
      );

      layoutedNodes.push({
        ...node,
        position,
      });
    });
  }

  console.log(
    "🔍 LAYOUT: Final vertical layout created with",
    layoutedNodes.length,
    "positioned nodes"
  );
  return { nodes: layoutedNodes, edges };
};

/**
 * Force-directed layout - Simulates physical forces
 */
const calculateForceLayout = (nodes, edges, viewType) => {
  const width = 1200;
  const height = 800;

  // Simple force-directed positioning
  const layoutedNodes = nodes.map((node, index) => {
    // Start with a rough grid
    const cols = Math.ceil(Math.sqrt(nodes.length));
    const x = (index % cols) * (width / cols) + 100;
    const y =
      Math.floor(index / cols) * (height / Math.ceil(nodes.length / cols)) +
      100;

    // Add some randomness for natural clustering
    const randomX = (Math.random() - 0.5) * 100;
    const randomY = (Math.random() - 0.5) * 100;

    return {
      ...node,
      position: {
        x: x + randomX,
        y: y + randomY,
      },
    };
  });

  return { nodes: layoutedNodes, edges };
};

/**
 * Circular layout - Arrange nodes in concentric circles
 */
const calculateCircularLayout = (nodes, edges, viewType) => {
  const centerX = 600;
  const centerY = 400;

  // Group nodes by type for circular arrangement
  const nodeGroups = {
    physicalNic: nodes.filter((n) => n.type === "physicalNic"),
    aggregate: nodes.filter((n) => n.type === "aggregate"),
    etherstub: nodes.filter((n) => n.type === "etherstub"),
    vnic: nodes.filter((n) => n.type === "vnic"),
    zone: nodes.filter((n) => n.type === "zone"),
  };

  const layoutedNodes = [];
  let currentRadius = 150;

  // Place each group in concentric circles
  Object.entries(nodeGroups).forEach(([type, typeNodes]) => {
    if (typeNodes.length === 0) {
      return;
    }

    const angleStep = (2 * Math.PI) / typeNodes.length;

    typeNodes.forEach((node, index) => {
      const angle = index * angleStep;
      const x = centerX + currentRadius * Math.cos(angle);
      const y = centerY + currentRadius * Math.sin(angle);

      layoutedNodes.push({
        ...node,
        position: { x, y },
      });
    });

    currentRadius += 150; // Move to next circle
  });

  return { nodes: layoutedNodes, edges };
};

/**
 * Grid layout - Simple grid arrangement
 */
const calculateGridLayout = (nodes, edges, viewType) => {
  const cols = Math.ceil(Math.sqrt(nodes.length));
  const cellWidth = 250;
  const cellHeight = 200;

  const layoutedNodes = nodes.map((node, index) => {
    const col = index % cols;
    const row = Math.floor(index / cols);

    return {
      ...node,
      position: {
        x: col * cellWidth + 100,
        y: row * cellHeight + 100,
      },
    };
  });

  return { nodes: layoutedNodes, edges };
};

/**
 * Get node width based on type and content
 */
const getNodeWidth = (node) => {
  switch (node.type) {
    case "physicalNic":
      return 180;
    case "aggregate":
      return 220;
    case "etherstub":
      return 180;
    case "vnic":
      return 200;
    case "zone":
      return 200;
    default:
      return 150;
  }
};

/**
 * Get node height based on type and content
 */
const getNodeHeight = (node) => {
  switch (node.type) {
    case "physicalNic":
      return 180;
    case "aggregate":
      return 220;
    case "etherstub":
      return 160;
    case "vnic":
      return 200;
    case "zone":
      return 180;
    default:
      return 120;
  }
};

/**
 * Custom layout for specific view types
 */
export const getViewSpecificLayout = (nodes, edges, viewType) => {
  switch (viewType) {
    case "zone-centric":
      return calculateZoneCentricLayout(nodes, edges);

    case "bandwidth":
      return calculateBandwidthLayout(nodes, edges);

    default:
      return null; // Use standard layout
  }
};

/**
 * Zone-centric layout - Zones at center with their network paths radiating out
 */
const calculateZoneCentricLayout = (nodes, edges) => {
  const zoneNodes = nodes.filter((n) => n.type === "zone");
  const centerX = 600;
  const centerY = 400;
  const zoneRadius = 200;

  // Place zones in a circle at the center
  const layoutedNodes = [];

  zoneNodes.forEach((zone, index) => {
    const angle = (index * 2 * Math.PI) / zoneNodes.length;
    const x = centerX + zoneRadius * Math.cos(angle);
    const y = centerY + zoneRadius * Math.sin(angle);

    layoutedNodes.push({
      ...zone,
      position: { x, y },
    });

    // Find connected VNICs and place them around the zone
    const connectedVnics = edges
      .filter((edge) => edge.target === zone.id)
      .map((edge) => nodes.find((n) => n.id === edge.source))
      .filter(Boolean);

    connectedVnics.forEach((vnic, vnicIndex) => {
      const vnicAngle = angle + (vnicIndex - connectedVnics.length / 2) * 0.3;
      const vnicRadius = 100;
      const vnicX = x + vnicRadius * Math.cos(vnicAngle);
      const vnicY = y + vnicRadius * Math.sin(vnicAngle);

      layoutedNodes.push({
        ...vnic,
        position: { x: vnicX, y: vnicY },
      });
    });
  });

  // Add remaining nodes in outer rings
  const remainingNodes = nodes.filter(
    (n) => !layoutedNodes.some((ln) => ln.id === n.id)
  );

  remainingNodes.forEach((node, index) => {
    const angle = (index * 2 * Math.PI) / remainingNodes.length;
    const radius = 400;
    const x = centerX + radius * Math.cos(angle);
    const y = centerY + radius * Math.sin(angle);

    layoutedNodes.push({
      ...node,
      position: { x, y },
    });
  });

  return { nodes: layoutedNodes, edges };
};

/**
 * Bandwidth-focused layout - High bandwidth nodes get prominent positions
 */
const calculateBandwidthLayout = (nodes, edges) => {
  // Calculate bandwidth for each node
  const nodeBandwidth = new Map();

  edges.forEach((edge) => {
    const bandwidth = edge.data?.bandwidth?.totalMbps || 0;

    if (!nodeBandwidth.has(edge.source)) {
      nodeBandwidth.set(edge.source, 0);
    }
    if (!nodeBandwidth.has(edge.target)) {
      nodeBandwidth.set(edge.target, 0);
    }

    nodeBandwidth.set(edge.source, nodeBandwidth.get(edge.source) + bandwidth);
    nodeBandwidth.set(edge.target, nodeBandwidth.get(edge.target) + bandwidth);
  });

  // Sort nodes by bandwidth
  const sortedNodes = [...nodes].sort((a, b) => {
    const aBw = nodeBandwidth.get(a.id) || 0;
    const bBw = nodeBandwidth.get(b.id) || 0;
    return bBw - aBw;
  });

  // Place high-bandwidth nodes prominently
  const layoutedNodes = sortedNodes.map((node, index) => {
    const tier = Math.floor(index / 5); // 5 nodes per tier
    const posInTier = index % 5;

    const x = 200 + posInTier * 200;
    const y = 150 + tier * 150;

    return {
      ...node,
      position: { x, y },
    };
  });

  return { nodes: layoutedNodes, edges };
};
