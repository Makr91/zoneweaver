import axios from "axios";
import PropTypes from "prop-types";
import {
  createContext,
  useState,
  useContext,
  useEffect,
  useCallback,
  useRef,
} from "react";

import * as consoleAPI from "../api/consoleAPI";
import * as deviceAPI from "../api/deviceAPI";
import * as hostManagementAPI from "../api/hostManagementAPI";
import * as monitoringAPI from "../api/monitoringAPI";
import { makeZoneweaverAPIRequest } from "../api/serverUtils";
import * as vlanAPI from "../api/vlanAPI";
import * as zoneAPI from "../api/zoneAPI";

import { useAuth } from "./AuthContext";

/**
 * Server context for managing Zoneweaver API connections
 *
 * - Zoneweaver application manages shared server connections
 * - All users see the same servers (application-level, not per-user)
 * - Only admins can add/remove servers
 * - All authenticated users can use existing servers
 */
const ServerContext = createContext();

/**
 * Custom hook to use server context
 * @returns {Object} Server context value
 */
export const useServers = () => {
  const context = useContext(ServerContext);
  if (!context) {
    throw new Error("useServers must be used within a ServerProvider");
  }
  return context;
};

/**
 * Server provider component
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components
 */
export const ServerProvider = ({ children }) => {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [servers, setServers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentServer, setCurrentServer] = useState(() => {
    // Restore currentServer from localStorage on initialization
    try {
      const saved = localStorage.getItem("zoneweaver_currentServer");
      return saved ? JSON.parse(saved) : null;
    } catch (error) {
      console.warn("Failed to restore currentServer from localStorage:", error);
      return null;
    }
  });

  const [currentZone, setCurrentZone] = useState(() => {
    // Restore currentZone from localStorage on initialization
    try {
      const saved = localStorage.getItem("zoneweaver_currentZone");
      return saved ? JSON.parse(saved) : null;
    } catch (error) {
      console.warn("Failed to restore currentZone from localStorage:", error);
      return null;
    }
  });

  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const loadingRef = useRef(false);

  /**
   * Load all servers from the application
   */
  const loadServers = useCallback(async () => {
    // Prevent concurrent calls
    if (loadingRef.current) {
      console.log(
        "📡 SERVER: loadServers already in progress, skipping duplicate"
      );
      return;
    }

    try {
      loadingRef.current = true;
      setLoading(true);
      const response = await axios.get("/api/servers");

      if (response.data.success) {
        setServers(response.data.servers);
        console.log("Servers loaded:", response.data.servers);
      } else {
        console.error("Failed to load servers:", response.data.message);
      }
    } catch (error) {
      console.error("Error loading servers:", error);
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  }, []);

  // Persist currentServer to localStorage whenever it changes
  useEffect(() => {
    console.log("📡 SERVER: currentServer changed", {
      from: "previous value",
      to: currentServer?.hostname || "null",
      currentServerId: currentServer?.id || "null",
      timestamp: new Date().toISOString(),
    });

    try {
      if (currentServer) {
        localStorage.setItem(
          "zoneweaver_currentServer",
          JSON.stringify(currentServer)
        );
      } else {
        localStorage.removeItem("zoneweaver_currentServer");
      }
    } catch (error) {
      console.warn("Failed to save currentServer to localStorage:", error);
    }
  }, [currentServer]);

  // Persist currentZone to localStorage whenever it changes
  useEffect(() => {
    try {
      if (currentZone) {
        localStorage.setItem(
          "zoneweaver_currentZone",
          JSON.stringify(currentZone)
        );
      } else {
        localStorage.removeItem("zoneweaver_currentZone");
      }
    } catch (error) {
      console.warn("Failed to save currentZone to localStorage:", error);
    }
  }, [currentZone]);

  /**
   * Load servers when user is authenticated
   */
  useEffect(() => {
    if (isAuthenticated && !hasLoadedOnce) {
      const timer = setTimeout(() => {
        loadServers();
        setHasLoadedOnce(true);
      }, 500);
      return () => clearTimeout(timer);
    }
    if (!isAuthenticated && !authLoading) {
      // Only clear server state when authentication explicitly fails, not during loading
      setServers([]);
      setCurrentServer(null);
      setHasLoadedOnce(false);
    }
    return undefined;
  }, [isAuthenticated, authLoading, hasLoadedOnce, loadServers]);

  /**
   * Re-establish currentServer connection after servers load
   * This handles page refresh scenarios where currentServer is restored from localStorage
   * but needs to be matched with the actual server objects from the API
   */
  useEffect(() => {
    console.log("🔄 SERVER RE-ESTABLISHMENT: Checking...", {
      serversLoaded: servers.length,
      currentServer,
      hasCurrentServer: !!currentServer,
    });

    if (servers.length > 0 && currentServer && currentServer.hostname) {
      // Find the matching server in the loaded servers array
      const matchingServer = servers.find(
        (server) =>
          server.hostname === currentServer.hostname &&
          server.port === currentServer.port &&
          server.protocol === currentServer.protocol
      );

      console.log("🔍 SERVER RE-ESTABLISHMENT: Looking for match...", {
        lookingFor: {
          hostname: currentServer.hostname,
          port: currentServer.port,
          protocol: currentServer.protocol,
          id: currentServer.id,
        },
        found: matchingServer,
        needsUpdate: matchingServer && matchingServer.id !== currentServer.id,
      });

      if (matchingServer) {
        // Compare meaningful fields instead of potentially different IDs
        const hasActualChanges =
          matchingServer.hostname !== currentServer.hostname ||
          matchingServer.port !== currentServer.port ||
          matchingServer.protocol !== currentServer.protocol ||
          matchingServer.lastUsed !== currentServer.lastUsed;

        if (hasActualChanges) {
          console.log(
            "✅ SERVER RE-ESTABLISHMENT: Re-establishing server connection:",
            matchingServer.hostname
          );
          setCurrentServer(matchingServer);
        } else {
          console.log(
            "✅ SERVER RE-ESTABLISHMENT: Server already current, no actual changes"
          );
        }
      } else {
        // Server no longer exists, clear selection
        console.log(
          "❌ SERVER RE-ESTABLISHMENT: Previously selected server no longer exists, clearing selection"
        );
        setCurrentServer(null);
        setCurrentZone(null);
      }
    } else if (servers.length > 0 && !currentServer) {
      console.log("📝 SERVER RE-ESTABLISHMENT: No currentServer to restore");
    }
  }, [servers, currentServer]);

  /**
   * Add a new Zoneweaver API Server (Admin only)
   * @param {Object} serverData - Server configuration
   * @param {string} serverData.hostname - Server hostname
   * @param {number} serverData.port - Server port
   * @param {string} serverData.protocol - Server protocol (http/https)
   * @param {string} serverData.entityName - Entity name for the API key
   * @param {string} [serverData.description] - Description
   * @returns {Promise<Object>} Add result
   */
  const addServer = async (serverData) => {
    try {
      setLoading(true);
      const response = await axios.post("/api/servers", serverData);

      if (response.data.success) {
        // Reload servers to get the new one
        await loadServers();
        return { success: true, message: response.data.message };
      }
      return { success: false, message: response.data.message };
    } catch (error) {
      console.error("Add server error:", error);
      return {
        success: false,
        message: error.response?.data?.message || "Failed to add server",
      };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Test server connectivity
   * @param {Object} serverData - Server configuration
   * @param {string} serverData.hostname - Server hostname
   * @param {number} serverData.port - Server port
   * @param {string} serverData.protocol - Server protocol (http/https)
   * @returns {Promise<Object>} Test result
   */
  const testServer = async (serverData) => {
    try {
      const response = await axios.post("/api/servers/test", serverData);

      return {
        success: response.data.success,
        message: response.data.message,
        serverInfo: response.data.serverInfo,
      };
    } catch (error) {
      console.error("Test server error:", error);
      return {
        success: false,
        message: error.response?.data?.message || "Connection test failed",
      };
    }
  };

  /**
   * Remove a server (Admin only)
   * @param {number} serverId - Server ID
   * @returns {Promise<Object>} Remove result
   */
  const removeServer = async (serverId) => {
    try {
      setLoading(true);
      const response = await axios.delete(`/api/servers/${serverId}`);

      if (response.data.success) {
        // Reload servers to reflect the change
        await loadServers();

        // Clear current server if it was the one removed
        if (currentServer && currentServer.id === serverId) {
          setCurrentServer(null);
        }

        return { success: true, message: response.data.message };
      }
      return { success: false, message: response.data.message };
    } catch (error) {
      console.error("Remove server error:", error);
      return {
        success: false,
        message: error.response?.data?.message || "Failed to remove server",
      };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Get all available servers
   * @returns {Array} Array of server objects
   */
  const getServers = useCallback(() => {
    console.log("getServers - servers:", servers);
    return servers.sort(
      (a, b) =>
        new Date(b.lastUsed || b.createdAt) -
        new Date(a.lastUsed || a.createdAt)
    );
  }, [servers]);

  /**
   * Set the current server for operations
   * @param {Object} server - Server object
   */
  const selectServer = (server) => {
    setCurrentServer(server);
    // Clear current zone when server changes
    setCurrentZone(null);
  };

  /**
   * Set the current zone for operations
   * @param {string} zoneName - Zone name
   */
  const selectZone = (zoneName) => {
    setCurrentZone(zoneName);
  };

  /**
   * Clear the current zone selection
   */
  const clearZone = () => {
    setCurrentZone(null);
  };

  // ========================================
  // API KEY MANAGEMENT FUNCTIONS
  // Kept in context because they depend on currentServer state
  // ========================================

  const getApiKeys = async () => {
    if (!currentServer) {
      return { success: false, message: "No server selected" };
    }
    return await makeZoneweaverAPIRequest(
      currentServer.hostname,
      currentServer.port,
      currentServer.protocol,
      "api-keys?include_key=true",
      "GET"
    );
  };

  const generateApiKey = async (name, description) => {
    if (!currentServer) {
      return { success: false, message: "No server selected" };
    }
    return await makeZoneweaverAPIRequest(
      currentServer.hostname,
      currentServer.port,
      currentServer.protocol,
      "api-keys/generate",
      "POST",
      { name, description }
    );
  };

  const bootstrapApiKey = async () => {
    if (!currentServer) {
      return { success: false, message: "No server selected" };
    }
    return await makeZoneweaverAPIRequest(
      currentServer.hostname,
      currentServer.port,
      currentServer.protocol,
      "api-keys/bootstrap",
      "POST",
      { name: "Initial-Setup", description: "Initial bootstrap API key" }
    );
  };

  const deleteApiKey = async (id) => {
    if (!currentServer) {
      return { success: false, message: "No server selected" };
    }
    return await makeZoneweaverAPIRequest(
      currentServer.hostname,
      currentServer.port,
      currentServer.protocol,
      `api-keys/${id}`,
      "DELETE"
    );
  };

  const value = {
    servers,
    loading,
    currentServer,
    currentZone,
    loadServers,
    refreshServers: loadServers,
    addServer,
    testServer,
    removeServer,
    getServers,
    selectServer,
    selectZone,
    clearZone,
    makeZoneweaverAPIRequest,
    // Zone Management Functions
    ...zoneAPI,
    // VNC Console Functions
    startVncSession: consoleAPI.startVncSession,
    getVncSessionInfo: consoleAPI.getVncSessionInfo,
    stopVncSession: consoleAPI.stopVncSession,
    getAllVncSessions: consoleAPI.getAllVncSessions,
    // Zlogin Console Functions
    startZloginSession: consoleAPI.startZloginSession,
    getZloginSessionInfo: consoleAPI.getZloginSessionInfo,
    stopZloginSession: consoleAPI.stopZloginSession,
    getAllZloginSessions: consoleAPI.getAllZloginSessions,
    // Host Monitoring Functions
    getMonitoringStatus: monitoringAPI.getMonitoringStatus,
    getMonitoringHealth: monitoringAPI.getMonitoringHealth,
    triggerMonitoringCollection: monitoringAPI.triggerMonitoringCollection,
    getMonitoringHost: monitoringAPI.getMonitoringHost,
    getMonitoringSummary: monitoringAPI.getMonitoringSummary,
    // Network Monitoring Functions
    getNetworkInterfaces: monitoringAPI.getNetworkInterfaces,
    getNetworkUsage: monitoringAPI.getNetworkUsage,
    getNetworkIPAddresses: monitoringAPI.getNetworkIPAddresses,
    getNetworkRoutes: monitoringAPI.getNetworkRoutes,
    // Storage Monitoring Functions
    getStoragePools: monitoringAPI.getStoragePools,
    getStorageDatasets: monitoringAPI.getStorageDatasets,
    getStorageDisks: monitoringAPI.getStorageDisks,
    getStoragePoolIO: monitoringAPI.getStoragePoolIO,
    getStorageDiskIO: monitoringAPI.getStorageDiskIO,
    getStorageARC: monitoringAPI.getStorageARC,
    // System Monitoring Functions
    getSystemCPU: monitoringAPI.getSystemCPU,
    getSystemCPUCores: monitoringAPI.getSystemCPUCores,
    getSystemMemory: monitoringAPI.getSystemMemory,
    // Device Management Functions
    ...deviceAPI,
    // VLAN Management Functions
    ...vlanAPI,
    // Host Management Functions
    ...hostManagementAPI,
    // API Key Management Functions
    getApiKeys,
    generateApiKey,
    bootstrapApiKey,
    deleteApiKey,
  };

  return (
    <ServerContext.Provider value={value}>{children}</ServerContext.Provider>
  );
};

ServerProvider.propTypes = {
  children: PropTypes.node,
};

export default ServerContext;
