import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';

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
    throw new Error('useServers must be used within a ServerProvider');
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
      const saved = localStorage.getItem('zoneweaver_currentServer');
      return saved ? JSON.parse(saved) : null;
    } catch (error) {
      console.warn('Failed to restore currentServer from localStorage:', error);
      return null;
    }
  });
  
  const [currentZone, setCurrentZone] = useState(() => {
    // Restore currentZone from localStorage on initialization
    try {
      const saved = localStorage.getItem('zoneweaver_currentZone');
      return saved ? JSON.parse(saved) : null;
    } catch (error) {
      console.warn('Failed to restore currentZone from localStorage:', error);
      return null;
    }
  });
  
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);


  // Persist currentServer to localStorage whenever it changes
  useEffect(() => {
    console.log('📡 SERVER: currentServer changed', {
      from: 'previous value',
      to: currentServer?.hostname || 'null',
      currentServerId: currentServer?.id || 'null',
      timestamp: new Date().toISOString()
    });
    
    try {
      if (currentServer) {
        localStorage.setItem('zoneweaver_currentServer', JSON.stringify(currentServer));
      } else {
        localStorage.removeItem('zoneweaver_currentServer');
      }
    } catch (error) {
      console.warn('Failed to save currentServer to localStorage:', error);
    }
  }, [currentServer]);

  // Persist currentZone to localStorage whenever it changes
  useEffect(() => {
    try {
      if (currentZone) {
        localStorage.setItem('zoneweaver_currentZone', JSON.stringify(currentZone));
      } else {
        localStorage.removeItem('zoneweaver_currentZone');
      }
    } catch (error) {
      console.warn('Failed to save currentZone to localStorage:', error);
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
    } else if (!isAuthenticated && !authLoading) {
      // Only clear server state when authentication explicitly fails, not during loading
      setServers([]);
      setCurrentServer(null);
      setHasLoadedOnce(false);
    }
  }, [isAuthenticated, authLoading]);

  /**
   * Re-establish currentServer connection after servers load
   * This handles page refresh scenarios where currentServer is restored from localStorage
   * but needs to be matched with the actual server objects from the API
   */
  useEffect(() => {
    console.log('🔄 SERVER RE-ESTABLISHMENT: Checking...', {
      serversLoaded: servers.length,
      currentServer: currentServer,
      hasCurrentServer: !!currentServer
    });
    
    if (servers.length > 0 && currentServer && currentServer.hostname) {
      // Find the matching server in the loaded servers array
      const matchingServer = servers.find(server => 
        server.hostname === currentServer.hostname && 
        server.port === currentServer.port &&
        server.protocol === currentServer.protocol
      );
      
      console.log('🔍 SERVER RE-ESTABLISHMENT: Looking for match...', {
        lookingFor: {
          hostname: currentServer.hostname,
          port: currentServer.port,
          protocol: currentServer.protocol,
          id: currentServer.id
        },
        found: matchingServer,
        needsUpdate: matchingServer && matchingServer.id !== currentServer.id
      });
      
      if (matchingServer) {
        // Always update to use the fresh API-loaded server object
        console.log('✅ SERVER RE-ESTABLISHMENT: Re-establishing server connection:', matchingServer.hostname);
        setCurrentServer(matchingServer);
      } else {
        // Server no longer exists, clear selection
        console.log('❌ SERVER RE-ESTABLISHMENT: Previously selected server no longer exists, clearing selection');
        setCurrentServer(null);
        setCurrentZone(null);
      }
    } else if (servers.length > 0 && !currentServer) {
      console.log('📝 SERVER RE-ESTABLISHMENT: No currentServer to restore');
    }
  }, [servers.length]); // Only depend on servers.length to avoid infinite loops

  /**
   * Load all servers from the application
   */
  const loadServers = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/servers');

      if (response.data.success) {
        setServers(response.data.servers);
        console.log('Servers loaded:', response.data.servers);
      } else {
        console.error('Failed to load servers:', response.data.message);
      }
    } catch (error) {
      console.error('Error loading servers:', error);
    } finally {
      setLoading(false);
    }
  }, []);

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
      const response = await axios.post('/api/servers', serverData);

      if (response.data.success) {
        // Reload servers to get the new one
        await loadServers();
        return { success: true, message: response.data.message };
      } else {
        return { success: false, message: response.data.message };
      }
    } catch (error) {
      console.error('Add server error:', error);
      return { 
        success: false, 
        message: error.response?.data?.message || 'Failed to add server' 
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
      const response = await axios.post('/api/servers/test', serverData);

      return { 
        success: response.data.success, 
        message: response.data.message,
        serverInfo: response.data.serverInfo 
      };
    } catch (error) {
      console.error('Test server error:', error);
      return { 
        success: false, 
        message: error.response?.data?.message || 'Connection test failed' 
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
      } else {
        return { success: false, message: response.data.message };
      }
    } catch (error) {
      console.error('Remove server error:', error);
      return { 
        success: false, 
        message: error.response?.data?.message || 'Failed to remove server' 
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
    console.log('getServers - servers:', servers);
    return servers.sort((a, b) => new Date(b.lastUsed || b.createdAt) - new Date(a.lastUsed || a.createdAt));
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

  /**
   * Make a request to a Zoneweaver API through the proxy
   * @param {string} hostname - Server hostname
   * @param {number} port - Server port
   * @param {string} protocol - Server protocol
   * @param {string} path - API path
   * @param {string} method - HTTP method (GET, POST, DELETE, etc.)
   * @param {Object} data - Request body data
   * @param {Object} params - URL parameters
   * @param {boolean} bypassCache - Force bypass cache for this request
   * @returns {Promise<Object>} Request result
   */
  const makeZoneweaverAPIRequest = async (hostname, port, protocol, path, method = 'GET', data = null, params = null, bypassCache = false) => {
    try {
      const proxyUrl = `/api/zapi/${protocol}/${hostname}/${port}/${path}`;
      
      // Debug logging for API calls
      console.log('🚀 FRONTEND API CALL:', {
        hostname,
        port, 
        protocol,
        path,
        method,
        proxyUrl,
        timestamp: new Date().toISOString()
      });
      
      const config = {
        url: proxyUrl,
        method: method,
        headers: {
          'Content-Type': 'application/json',
          // Add no-cache headers for VNC endpoints or when explicitly requested
          ...(path.includes('/vnc/') || bypassCache) && {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache'
          }
        },
        // Handle 304 responses appropriately - success for non-VNC, error for VNC (should not happen with no-cache)
        validateStatus: (status) => {
          return (status >= 200 && status < 300) || 
                 (status === 304 && !path.includes('/vnc/') && !bypassCache);
        }
      };

      if (data) {
        config.data = data;
      }
      
      if (params) {
        // Use URLSearchParams to ensure correct formatting, especially for keys with special characters
        const searchParams = new URLSearchParams();
        for (const key in params) {
          if (Object.prototype.hasOwnProperty.call(params, key)) {
            searchParams.append(key, params[key]);
          }
        }
        config.params = searchParams;
      }

      const response = await axios(config);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Zoneweaver API request error:', error);
      
      // Handle 304 responses for VNC endpoints - should not happen with backend no-cache headers
      if (error.response?.status === 304 && (path.includes('/vnc/') || bypassCache)) {
        console.warn('VNC endpoint returned 304 despite no-cache headers, forcing cache bypass...');
        
        // Add cache-busting parameter and retry once
        if (!bypassCache) {
          const bustingPath = path.includes('?') ? `${path}&_cb=${Date.now()}` : `${path}?_cb=${Date.now()}`;
          return await makeZoneweaverAPIRequest(hostname, port, protocol, bustingPath, method, data, params, true);
        }
      }
      
      const message = error.response?.data?.msg || error.response?.data?.message || 'Request failed';
      return { 
        success: false, 
        message: message,
        status: error.response?.status
      };
    }
  };

  /**
   * Start a zone
   * @param {string} hostname - Server hostname
   * @param {number} port - Server port  
   * @param {string} protocol - Server protocol
   * @param {string} zoneName - Zone name to start
   * @returns {Promise<Object>} Start result
   */
  const startZone = async (hostname, port, protocol, zoneName) => {
    return await makeZoneweaverAPIRequest(hostname, port, protocol, `zones/${zoneName}/start`, 'POST');
  };

  /**
   * Stop a zone
   * @param {string} hostname - Server hostname
   * @param {number} port - Server port
   * @param {string} protocol - Server protocol
   * @param {string} zoneName - Zone name to stop
   * @param {boolean} force - Force stop the zone
   * @returns {Promise<Object>} Stop result
   */
  const stopZone = async (hostname, port, protocol, zoneName, force = false) => {
    const params = force ? { force: true } : null;
    return await makeZoneweaverAPIRequest(hostname, port, protocol, `zones/${zoneName}/stop`, 'POST', null, params);
  };

  /**
   * Restart a zone
   * @param {string} hostname - Server hostname
   * @param {number} port - Server port
   * @param {string} protocol - Server protocol
   * @param {string} zoneName - Zone name to restart
   * @returns {Promise<Object>} Restart result
   */
  const restartZone = async (hostname, port, protocol, zoneName) => {
    return await makeZoneweaverAPIRequest(hostname, port, protocol, `zones/${zoneName}/restart`, 'POST');
  };

  /**
   * Delete a zone
   * @param {string} hostname - Server hostname
   * @param {number} port - Server port
   * @param {string} protocol - Server protocol
   * @param {string} zoneName - Zone name to delete
   * @param {boolean} force - Force delete the zone
   * @returns {Promise<Object>} Delete result
   */
  const deleteZone = async (hostname, port, protocol, zoneName, force = false) => {
    const params = force ? { force: true } : null;
    return await makeZoneweaverAPIRequest(hostname, port, protocol, `zones/${zoneName}`, 'DELETE', null, params);
  };

  /**
   * Get detailed zone information
   * @param {string} hostname - Server hostname
   * @param {number} port - Server port
   * @param {string} protocol - Server protocol
   * @param {string} zoneName - Zone name
   * @returns {Promise<Object>} Zone details
   */
  const getZoneDetails = async (hostname, port, protocol, zoneName) => {
    return await makeZoneweaverAPIRequest(hostname, port, protocol, `zones/${zoneName}`);
  };

  /**
   * Get all zones with optional filtering
   * @param {string} hostname - Server hostname
   * @param {number} port - Server port
   * @param {string} protocol - Server protocol
   * @param {Object} filters - Filter options
   * @returns {Promise<Object>} Zones list
   */
  const getAllZones = async (hostname, port, protocol, filters = {}) => {
    return await makeZoneweaverAPIRequest(hostname, port, protocol, 'zones', 'GET', null, filters);
  };

  /**
   * Get task queue statistics
   * @param {string} hostname - Server hostname
   * @param {number} port - Server port
   * @param {string} protocol - Server protocol
   * @returns {Promise<Object>} Task stats
   */
  const getTaskStats = async (hostname, port, protocol) => {
    return await makeZoneweaverAPIRequest(hostname, port, protocol, 'tasks/stats');
  };

  /**
   * Get list of tasks with optional filtering
   * @param {string} hostname - Server hostname
   * @param {number} port - Server port
   * @param {string} protocol - Server protocol
   * @param {Object} filters - Filter options
   * @returns {Promise<Object>} Tasks list
   */
  const getTasks = async (hostname, port, protocol, filters = {}) => {
    return await makeZoneweaverAPIRequest(hostname, port, protocol, 'tasks', 'GET', null, filters);
  };

  /**
   * Start VNC console session for a zone
   * @param {string} hostname - Server hostname
   * @param {number} port - Server port
   * @param {string} protocol - Server protocol
   * @param {string} zoneName - Zone name
   * @returns {Promise<Object>} VNC start result
   */
  const startVncSession = async (hostname, port, protocol, zoneName) => {
    return await makeZoneweaverAPIRequest(hostname, port, protocol, `zones/${zoneName}/vnc/start`, 'POST');
  };

  /**
   * Get VNC session information for a zone
   * @param {string} hostname - Server hostname
   * @param {number} port - Server port
   * @param {string} protocol - Server protocol
   * @param {string} zoneName - Zone name
   * @returns {Promise<Object>} VNC session info
   */
  const getVncSessionInfo = async (hostname, port, protocol, zoneName) => {
    return await makeZoneweaverAPIRequest(hostname, port, protocol, `zones/${zoneName}/vnc/info`);
  };

  /**
   * Stop VNC console session for a zone
   * @param {string} hostname - Server hostname
   * @param {number} port - Server port
   * @param {string} protocol - Server protocol
   * @param {string} zoneName - Zone name
   * @returns {Promise<Object>} VNC stop result
   */
  const stopVncSession = async (hostname, port, protocol, zoneName) => {
    return await makeZoneweaverAPIRequest(hostname, port, protocol, `zones/${zoneName}/vnc/stop`, 'DELETE');
  };

  /**
   * Get all VNC sessions
   * @param {string} hostname - Server hostname
   * @param {number} port - Server port
   * @param {string} protocol - Server protocol
   * @param {Object} filters - Filter options (status, zone_name)
   * @returns {Promise<Object>} VNC sessions list
   */
  const getAllVncSessions = async (hostname, port, protocol, filters = {}) => {
    return await makeZoneweaverAPIRequest(hostname, port, protocol, 'vnc/sessions', 'GET', null, filters);
  };

  /**
   * Start zlogin console session for a zone
   * @param {string} hostname - Server hostname
   * @param {number} port - Server port
   * @param {string} protocol - Server protocol
   * @param {string} zoneName - Zone name
   * @returns {Promise<Object>} Zlogin start result
   */
  const startZloginSession = async (hostname, port, protocol, zoneName) => {
    return await makeZoneweaverAPIRequest(hostname, port, protocol, `zones/${zoneName}/zlogin/start`, 'POST');
  };

  /**
   * Get zlogin session information for a zone
   * @param {string} hostname - Server hostname
   * @param {number} port - Server port
   * @param {string} protocol - Server protocol
   * @param {string} sessionId - Zlogin session ID
   * @returns {Promise<Object>} Zlogin session info
   */
  const getZloginSessionInfo = async (hostname, port, protocol, sessionId) => {
    return await makeZoneweaverAPIRequest(hostname, port, protocol, `zlogin/sessions/${sessionId}`);
  };

  /**
   * Stop zlogin console session for a zone
   * @param {string} hostname - Server hostname
   * @param {number} port - Server port
   * @param {string} protocol - Server protocol
   * @param {string} sessionId - Zlogin session ID
   * @returns {Promise<Object>} Zlogin stop result
   */
  const stopZloginSession = async (hostname, port, protocol, sessionId) => {
    return await makeZoneweaverAPIRequest(hostname, port, protocol, `zlogin/sessions/${sessionId}/stop`, 'DELETE');
  };

  /**
   * Get all zlogin sessions
   * @param {string} hostname - Server hostname
   * @param {number} port - Server port
   * @param {string} protocol - Server protocol
   * @param {Object} filters - Filter options (status, zone_name)
   * @returns {Promise<Object>} Zlogin sessions list
   */
  const getAllZloginSessions = async (hostname, port, protocol, filters = {}) => {
    return await makeZoneweaverAPIRequest(hostname, port, protocol, 'zlogin/sessions', 'GET', null, filters);
  };

  /**
   * Get zone configuration
   * @param {string} hostname - Server hostname
   * @param {number} port - Server port
   * @param {string} protocol - Server protocol
   * @param {string} zoneName - Zone name
   * @returns {Promise<Object>} Zone configuration
   */
  const getZoneConfig = async (hostname, port, protocol, zoneName) => {
    return await makeZoneweaverAPIRequest(hostname, port, protocol, `zones/${zoneName}/config`);
  };

  // ========================================
  // HOST MONITORING FUNCTIONS
  // ========================================

  /**
   * Get monitoring service status
   * @param {string} hostname - Server hostname
   * @param {number} port - Server port
   * @param {string} protocol - Server protocol
   * @returns {Promise<Object>} Monitoring service status
   */
  const getMonitoringStatus = async (hostname, port, protocol) => {
    return await makeZoneweaverAPIRequest(hostname, port, protocol, 'monitoring/status');
  };

  /**
   * Get monitoring service health check
   * @param {string} hostname - Server hostname
   * @param {number} port - Server port
   * @param {string} protocol - Server protocol
   * @returns {Promise<Object>} Monitoring health information
   */
  const getMonitoringHealth = async (hostname, port, protocol) => {
    return await makeZoneweaverAPIRequest(hostname, port, protocol, 'monitoring/health');
  };

  /**
   * Trigger immediate data collection
   * @param {string} hostname - Server hostname
   * @param {number} port - Server port
   * @param {string} protocol - Server protocol
   * @param {string} type - Collection type (all, network, storage)
   * @returns {Promise<Object>} Collection result
   */
  const triggerMonitoringCollection = async (hostname, port, protocol, type = 'all') => {
    return await makeZoneweaverAPIRequest(hostname, port, protocol, 'monitoring/collect', 'POST', { type });
  };

  /**
   * Get host information
   * @param {string} hostname - Server hostname
   * @param {number} port - Server port
   * @param {string} protocol - Server protocol
   * @param {string} host - Specific host to query (optional)
   * @returns {Promise<Object>} Host information
   */
  const getMonitoringHost = async (hostname, port, protocol, host = null) => {
    const params = host ? { host } : null;
    return await makeZoneweaverAPIRequest(hostname, port, protocol, 'monitoring/host', 'GET', null, params);
  };

  /**
   * Get monitoring summary
   * @param {string} hostname - Server hostname
   * @param {number} port - Server port
   * @param {string} protocol - Server protocol
   * @returns {Promise<Object>} Monitoring summary
   */
  const getMonitoringSummary = async (hostname, port, protocol) => {
    return await makeZoneweaverAPIRequest(hostname, port, protocol, 'monitoring/summary');
  };

  // ========================================
  // NETWORK MONITORING FUNCTIONS
  // ========================================

  /**
   * Get network interface information
   * @param {string} hostname - Server hostname
   * @param {number} port - Server port
   * @param {string} protocol - Server protocol
   * @param {Object} filters - Filter options (limit, offset, host, state)
   * @returns {Promise<Object>} Network interface data
   */
  const getNetworkInterfaces = async (hostname, port, protocol, filters = {}) => {
    return await makeZoneweaverAPIRequest(hostname, port, protocol, 'monitoring/network/interfaces', 'GET', null, filters);
  };

  /**
   * Get network traffic statistics
   * @param {string} hostname - Server hostname
   * @param {number} port - Server port
   * @param {string} protocol - Server protocol
   * @param {Object} filters - Filter options (limit, since, link)
   * @returns {Promise<Object>} Network statistics data
   */
  const getNetworkStats = async (hostname, port, protocol, filters = {}) => {
    return await makeZoneweaverAPIRequest(hostname, port, protocol, 'monitoring/network/stats', 'GET', null, filters);
  };

  /**
   * Get network usage accounting data
   * @param {string} hostname - Server hostname
   * @param {number} port - Server port
   * @param {string} protocol - Server protocol
   * @param {Object} filters - Filter options (limit, since, link)
   * @returns {Promise<Object>} Network usage data
   */
  const getNetworkUsage = async (hostname, port, protocol, filters = {}) => {
    return await makeZoneweaverAPIRequest(hostname, port, protocol, 'monitoring/network/usage', 'GET', null, filters);
  };

  /**
   * Get IP address assignments
   * @param {string} hostname - Server hostname
   * @param {number} port - Server port
   * @param {string} protocol - Server protocol
   * @param {Object} filters - Filter options (limit, offset, interface, ip_version, state)
   * @returns {Promise<Object>} IP address data
   */
  const getNetworkIPAddresses = async (hostname, port, protocol, filters = {}) => {
    return await makeZoneweaverAPIRequest(hostname, port, protocol, 'monitoring/network/ipaddresses', 'GET', null, filters);
  };

  /**
   * Get routing table information
   * @param {string} hostname - Server hostname
   * @param {number} port - Server port
   * @param {string} protocol - Server protocol
   * @param {Object} filters - Filter options (limit, offset, interface, ip_version, is_default, destination)
   * @returns {Promise<Object>} Routing table data
   */
  const getNetworkRoutes = async (hostname, port, protocol, filters = {}) => {
    return await makeZoneweaverAPIRequest(hostname, port, protocol, 'monitoring/network/routes', 'GET', null, filters);
  };

  // ========================================
  // DEVICE MANAGEMENT FUNCTIONS
  // ========================================

  /**
   * Get host PCI devices
   * @param {string} hostname - Server hostname
   * @param {number} port - Server port
   * @param {string} protocol - Server protocol
   * @param {Object} filters - Filter options (category, ppt_enabled, driver_attached, available, limit)
   * @returns {Promise<Object>} Host devices data
   */
  const getHostDevices = async (hostname, port, protocol, filters = {}) => {
    console.log(`🔍 DEVICES: Getting host devices from ${hostname}:${port}`);
    return await makeZoneweaverAPIRequest(hostname, port, protocol, 'host/devices', 'GET', null, filters);
  };

  /**
   * Get available devices for passthrough
   * @param {string} hostname - Server hostname
   * @param {number} port - Server port
   * @param {string} protocol - Server protocol
   * @param {Object} filters - Filter options (category, ppt_only)
   * @returns {Promise<Object>} Available devices data
   */
  const getAvailableDevices = async (hostname, port, protocol, filters = {}) => {
    console.log(`🔍 DEVICES: Getting available devices from ${hostname}:${port}`);
    return await makeZoneweaverAPIRequest(hostname, port, protocol, 'host/devices/available', 'GET', null, filters);
  };

  /**
   * Get device categories summary
   * @param {string} hostname - Server hostname
   * @param {number} port - Server port
   * @param {string} protocol - Server protocol
   * @returns {Promise<Object>} Device categories data
   */
  const getDeviceCategories = async (hostname, port, protocol) => {
    console.log(`🔍 DEVICES: Getting device categories from ${hostname}:${port}`);
    return await makeZoneweaverAPIRequest(hostname, port, protocol, 'host/devices/categories');
  };

  /**
   * Get PPT status overview
   * @param {string} hostname - Server hostname
   * @param {number} port - Server port
   * @param {string} protocol - Server protocol
   * @returns {Promise<Object>} PPT status data
   */
  const getPPTStatus = async (hostname, port, protocol) => {
    console.log(`🔍 DEVICES: Getting PPT status from ${hostname}:${port}`);
    return await makeZoneweaverAPIRequest(hostname, port, protocol, 'host/ppt-status');
  };

  /**
   * Trigger manual device discovery
   * @param {string} hostname - Server hostname
   * @param {number} port - Server port
   * @param {string} protocol - Server protocol
   * @returns {Promise<Object>} Device discovery result
   */
  const refreshDeviceDiscovery = async (hostname, port, protocol) => {
    console.log(`🔄 DEVICES: Refreshing device discovery on ${hostname}:${port}`);
    return await makeZoneweaverAPIRequest(hostname, port, protocol, 'host/devices/refresh', 'POST');
  };

  /**
   * Get specific device details
   * @param {string} hostname - Server hostname
   * @param {number} port - Server port
   * @param {string} protocol - Server protocol
   * @param {string} deviceId - Device ID or PCI address
   * @returns {Promise<Object>} Device details
   */
  const getDeviceDetails = async (hostname, port, protocol, deviceId) => {
    console.log(`🔍 DEVICES: Getting device details for ${deviceId} from ${hostname}:${port}`);
    return await makeZoneweaverAPIRequest(hostname, port, protocol, `host/devices/${deviceId}`);
  };

  // ========================================
  // STORAGE MONITORING FUNCTIONS
  // ========================================

  /**
   * Get ZFS pool information
   * @param {string} hostname - Server hostname
   * @param {number} port - Server port
   * @param {string} protocol - Server protocol
   * @param {Object} filters - Filter options (limit, pool, health)
   * @returns {Promise<Object>} ZFS pool data
   */
  const getStoragePools = async (hostname, port, protocol, filters = {}) => {
    console.log(`🔍 STORAGE: Getting storage pools from ${hostname}:${port}`);
    return await makeZoneweaverAPIRequest(hostname, port, protocol, 'monitoring/storage/pools', 'GET', null, filters);
  };

  /**
   * Get ZFS dataset information
   * @param {string} hostname - Server hostname
   * @param {number} port - Server port
   * @param {string} protocol - Server protocol
   * @param {Object} filters - Filter options (limit, offset, pool, type, name)
   * @returns {Promise<Object>} ZFS dataset data
   */
  const getStorageDatasets = async (hostname, port, protocol, filters = {}) => {
    console.log(`🔍 STORAGE: Getting storage datasets from ${hostname}:${port}`);
    return await makeZoneweaverAPIRequest(hostname, port, protocol, 'monitoring/storage/datasets', 'GET', null, filters);
  };

  /**
   * Get physical disk information
   * @param {string} hostname - Server hostname
   * @param {number} port - Server port
   * @param {string} protocol - Server protocol
   * @param {Object} filters - Filter options (limit, offset, pool, available, type)
   * @returns {Promise<Object>} Physical disk data
   */
  const getStorageDisks = async (hostname, port, protocol, filters = {}) => {
    console.log(`🔍 STORAGE: Getting storage disks from ${hostname}:${port}`);
    return await makeZoneweaverAPIRequest(hostname, port, protocol, 'monitoring/storage/disks', 'GET', null, filters);
  };

  /**
   * Get ZFS pool I/O performance statistics
   * @param {string} hostname - Server hostname
   * @param {number} port - Server port
   * @param {string} protocol - Server protocol
   * @param {Object} filters - Filter options (limit, since, pool, pool_type)
   * @returns {Promise<Object>} Pool I/O performance data
   */
  const getStoragePoolIO = async (hostname, port, protocol, filters = {}) => {
    console.log(`🔍 STORAGE: Getting storage pool I/O from ${hostname}:${port}`);
    return await makeZoneweaverAPIRequest(hostname, port, protocol, 'monitoring/storage/pool-io', 'GET', null, filters);
  };

  /**
   * Get disk I/O performance statistics
   * @param {string} hostname - Server hostname
   * @param {number} port - Server port
   * @param {string} protocol - Server protocol
   * @param {Object} filters - Filter options (limit, since, device_name)
   * @returns {Promise<Object>} Disk I/O performance data
   */
  const getStorageDiskIO = async (hostname, port, protocol, filters = {}) => {
    console.log(`🔍 STORAGE: Getting storage disk I/O from ${hostname}:${port}`);
    return await makeZoneweaverAPIRequest(hostname, port, protocol, 'monitoring/storage/disk-io', 'GET', null, filters);
  };

  /**
   * Get ZFS ARC statistics
   * @param {string} hostname - Server hostname
   * @param {number} port - Server port
   * @param {string} protocol - Server protocol
   * @param {Object} filters - Filter options (limit, since)
   * @returns {Promise<Object>} ZFS ARC statistics data
   */
  const getStorageARC = async (hostname, port, protocol, filters = {}) => {
    console.log(`🔍 STORAGE: Getting storage ARC statistics from ${hostname}:${port}`);
    return await makeZoneweaverAPIRequest(hostname, port, protocol, 'monitoring/storage/arc', 'GET', null, filters);
  };

  // ========================================
  // SYSTEM MONITORING FUNCTIONS
  // ========================================

  /**
   * Get system CPU statistics
   * @param {string} hostname - Server hostname
   * @param {number} port - Server port
   * @param {string} protocol - Server protocol
   * @param {Object} filters - Filter options (limit, since, include_cores)
   * @returns {Promise<Object>} System CPU data
   */
  const getSystemCPU = async (hostname, port, protocol, filters = {}) => {
    console.log(`🔍 SYSTEM: Getting CPU statistics from ${hostname}:${port}`);
    return await makeZoneweaverAPIRequest(hostname, port, protocol, 'monitoring/system/cpu', 'GET', null, filters);
  };

  /**
   * Get per-core CPU statistics
   * @param {string} hostname - Server hostname
   * @param {number} port - Server port
   * @param {string} protocol - Server protocol
   * @param {Object} filters - Filter options (limit, since)
   * @returns {Promise<Object>} Per-core CPU data
   */
  const getSystemCPUCores = async (hostname, port, protocol, filters = {}) => {
    console.log(`🔍 SYSTEM: Getting per-core CPU statistics from ${hostname}:${port}`);
    return await makeZoneweaverAPIRequest(hostname, port, protocol, 'monitoring/system/cpu/cores', 'GET', null, filters);
  };

  /**
   * Get system memory statistics
   * @param {string} hostname - Server hostname
   * @param {number} port - Server port
   * @param {string} protocol - Server protocol
   * @param {Object} filters - Filter options (limit, since)
   * @returns {Promise<Object>} System memory data
   */
  const getSystemMemory = async (hostname, port, protocol, filters = {}) => {
    console.log(`🔍 SYSTEM: Getting memory statistics from ${hostname}:${port}`);
    return await makeZoneweaverAPIRequest(hostname, port, protocol, 'monitoring/system/memory', 'GET', null, filters);
  };

  // ========================================
  // API KEY MANAGEMENT FUNCTIONS
  // ========================================

  const getApiKeys = async () => {
    if (!currentServer) return { success: false, message: "No server selected" };
    return await makeZoneweaverAPIRequest(currentServer.hostname, currentServer.port, currentServer.protocol, 'api-keys?include_key=true', 'GET');
  };

  const generateApiKey = async (name, description) => {
    if (!currentServer) return { success: false, message: "No server selected" };
    return await makeZoneweaverAPIRequest(currentServer.hostname, currentServer.port, currentServer.protocol, 'api-keys/generate', 'POST', { name, description });
  };

  const bootstrapApiKey = async () => {
    if (!currentServer) return { success: false, message: "No server selected" };
    return await makeZoneweaverAPIRequest(currentServer.hostname, currentServer.port, currentServer.protocol, 'api-keys/bootstrap', 'POST', { name: 'Initial-Setup', description: 'Initial bootstrap API key' });
  };

  const deleteApiKey = async (id) => {
    if (!currentServer) return { success: false, message: "No server selected" };
    return await makeZoneweaverAPIRequest(currentServer.hostname, currentServer.port, currentServer.protocol, `api-keys/${id}`, 'DELETE');
  };

  const value = {
    servers,
    loading,
    currentServer,
    currentZone,
    loadServers,
    refreshServers: loadServers, // Alias for consistency
    addServer,
    testServer,
    removeServer,
    getServers,
    selectServer,
    selectZone,
    clearZone,
    makeZoneweaverAPIRequest,
    // Zone Management Functions
    startZone,
    stopZone,
    restartZone,
    deleteZone,
    getZoneDetails,
    getAllZones,
    getTaskStats,
    getTasks,
    // VNC Console Functions
    startVncSession,
    getVncSessionInfo,
    stopVncSession,
    getAllVncSessions,
    // Zlogin Console Functions
    startZloginSession,
    getZloginSessionInfo,
    stopZloginSession,
    getAllZloginSessions,
    // Zone Configuration Functions
    getZoneConfig,
    // Host Monitoring Functions
    getMonitoringStatus,
    getMonitoringHealth,
    triggerMonitoringCollection,
    getMonitoringHost,
    getMonitoringSummary,
    // Network Monitoring Functions
    getNetworkInterfaces,
    getNetworkStats,
    getNetworkUsage,
    getNetworkIPAddresses,
    getNetworkRoutes,
    // Storage Monitoring Functions
    getStoragePools,
    getStorageDatasets,
    getStorageDisks,
    getStoragePoolIO,
    getStorageDiskIO,
    getStorageARC,
    // System Monitoring Functions
    getSystemCPU,
    getSystemCPUCores,
    getSystemMemory,
    // Device Management Functions
    getHostDevices,
    getAvailableDevices,
    getDeviceCategories,
    getPPTStatus,
    refreshDeviceDiscovery,
    getDeviceDetails,
    // API Key Management Functions
    getApiKeys,
    generateApiKey,
    bootstrapApiKey,
    deleteApiKey
  };

  return (
    <ServerContext.Provider value={value}>
      {children}
    </ServerContext.Provider>
  );
};

export default ServerContext;
