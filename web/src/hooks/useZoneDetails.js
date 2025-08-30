import { useState, useEffect, useCallback } from 'react';
import { useServers } from '../contexts/ServerContext';

/**
 * Custom hook to manage fetching and state for the details of a specific zone.
 * @param {object} currentServer - The currently selected server object.
 * @param {string} currentZone - The name of the currently selected zone.
 * @returns {object} An object containing zone details, loading state, error state, and a function to reload details.
 */
export const useZoneDetails = (currentServer, currentZone) => {
  const [zoneDetails, setZoneDetails] = useState({});
  const [monitoringHealth, setMonitoringHealth] = useState({});
  const [networkInterfaces, setNetworkInterfaces] = useState([]);
  const [storagePools, setStoragePools] = useState([]);
  const [storageDatasets, setStorageDatasets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { 
    makeZoneweaverAPIRequest,
    getMonitoringHealth,
    getNetworkInterfaces,
    getStoragePools,
    getStorageDatasets 
  } = useServers();

  const loadMonitoringData = useCallback(async (server) => {
    if (!server) return;
    try {
      const [healthResult, networkResult, poolsResult, datasetsResult] = await Promise.all([
        getMonitoringHealth(server.hostname, server.port, server.protocol),
        getNetworkInterfaces(server.hostname, server.port, server.protocol),
        getStoragePools(server.hostname, server.port, server.protocol),
        getStorageDatasets(server.hostname, server.port, server.protocol)
      ]);

      if (healthResult.success) setMonitoringHealth(healthResult.data);
      if (networkResult.success) setNetworkInterfaces(networkResult.data);
      if (poolsResult.success) setStoragePools(poolsResult.data);
      if (datasetsResult.success) setStorageDatasets(datasetsResult.data);

    } catch (error) {
      console.warn('Error fetching monitoring data:', error);
    }
  }, [getMonitoringHealth, getNetworkInterfaces, getStoragePools, getStorageDatasets]);

  const loadZoneDetails = useCallback(async (server, zoneName) => {
    if (!server || !zoneName) {
      setZoneDetails({});
      return;
    };

    try {
      setLoading(true);
      setError('');
      
      const result = await makeZoneweaverAPIRequest(
        server.hostname,
        server.port,
        server.protocol,
        `zones/${zoneName}`
      );

      if (result.success) {
        setZoneDetails(result.data);
        // Fire off monitoring data load in the background
        loadMonitoringData(server);
      } else {
        setError(`Failed to fetch details for zone ${zoneName}: ${result.message}`);
        setZoneDetails({});
      }
    } catch (err) {
      console.error('Error fetching zone details:', err);
      setError(`Error fetching zone details for ${zoneName}`);
      setZoneDetails({});
    } finally {
      setLoading(false);
    }
  }, [makeZoneweaverAPIRequest, loadMonitoringData]);

  useEffect(() => {
    if (currentServer && currentZone) {
      loadZoneDetails(currentServer, currentZone);
    } else {
      setZoneDetails({});
      setMonitoringHealth({});
      setNetworkInterfaces([]);
      setStoragePools([]);
      setStorageDatasets([]);
    }
  }, [currentServer, currentZone, loadZoneDetails]);

  return {
    zoneDetails,
    setZoneDetails, // Expose setter for optimistic updates
    monitoringHealth,
    networkInterfaces,
    storagePools,
    storageDatasets,
    loading,
    error,
    reloadZoneDetails: () => loadZoneDetails(currentServer, currentZone),
    loadZoneDetails, // Expose for manual calls with session refresh
  };
};
