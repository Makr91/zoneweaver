import { useState } from 'react';

/**
 * Hook for managing zone monitoring data
 * Handles host health, network interfaces, storage pools, and datasets
 */
const useZoneMonitoring = (getMonitoringHealth, getNetworkInterfaces, getStoragePools, getStorageDatasets) => {
  const [monitoringHealth, setMonitoringHealth] = useState({});
  const [networkInterfaces, setNetworkInterfaces] = useState([]);
  const [storagePools, setStoragePools] = useState([]);
  const [storageDatasets, setStorageDatasets] = useState([]);

  const loadMonitoringData = async (server) => {
    if (!server) return;
    
    try {
      // Load monitoring health for host status
      const healthResult = await getMonitoringHealth(
        server.hostname,
        server.port,
        server.protocol
      );

      if (healthResult.success) {
        setMonitoringHealth(healthResult.data);
      }

      // Load network interfaces for network configuration context
      const networkResult = await getNetworkInterfaces(
        server.hostname,
        server.port,
        server.protocol
      );

      if (networkResult.success) {
        setNetworkInterfaces(networkResult.data);
      }

      // Load storage pools for storage configuration context
      const poolsResult = await getStoragePools(
        server.hostname,
        server.port,
        server.protocol
      );

      if (poolsResult.success) {
        setStoragePools(poolsResult.data);
      }

      // Load storage datasets
      const datasetsResult = await getStorageDatasets(
        server.hostname,
        server.port,
        server.protocol
      );

      if (datasetsResult.success) {
        setStorageDatasets(datasetsResult.data);
      }
    } catch (error) {
      console.warn('Error fetching monitoring data:', error);
      // Don't fail the whole component if monitoring data fails
    }
  };

  return {
    monitoringHealth,
    networkInterfaces,
    storagePools,
    storageDatasets,
    loadMonitoringData,
    setMonitoringHealth,
    setNetworkInterfaces,
    setStoragePools,
    setStorageDatasets
  };
};

export default useZoneMonitoring;
