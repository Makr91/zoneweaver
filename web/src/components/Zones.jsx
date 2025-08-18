import React, { useState, useEffect, useRef } from "react";
import { Helmet } from "@dr.pogodin/react-helmet";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useServers } from "../contexts/ServerContext";
import { useZoneTerminal } from "../contexts/ZoneTerminalContext";
import VncViewerReact from "./VncViewerReact";
import VncActionsDropdown from "./VncActionsDropdown";
import ZloginActionsDropdown from "./ZloginActionsDropdown";
import ZoneShell from "./ZoneShell";

/**
 * Zones Management Component
 * 
 * NOTE: The current host (server) and current zone are stored in GLOBAL CONTEXT 
 * and are selected via the TOP NAVBAR dropdowns. The ServerContext manages:
 * - currentServer: Selected via "Host" dropdown in navbar
 * - currentZone: Selected via "Zone" dropdown in navbar
 * 
 * This component automatically responds to these global selections and displays
 * details for the currently selected zone on the currently selected server.
 */
const Zones = () => {
  const [zones, setZones] = useState([]);
  const [runningZones, setRunningZones] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedZone, setSelectedZone] = useState(null);
  
  const [searchParams, setSearchParams] = useSearchParams();
  const [zoneDetails, setZoneDetails] = useState({});
  const [vncSession, setVncSession] = useState(null);
  const [loadingVnc, setLoadingVnc] = useState(false);
  const [showVncConsole, setShowVncConsole] = useState(false);
  const [vncConsoleUrl, setVncConsoleUrl] = useState("");
  const [vncLoadError, setVncLoadError] = useState(false);
  const [isVncFullScreen, setIsVncFullScreen] = useState(false);
  const [showFullScreenControls, setShowFullScreenControls] = useState(false);
  const [showZloginConsole, setShowZloginConsole] = useState(false);
  const [isZloginFullScreen, setIsZloginFullScreen] = useState(false);
  const [hoverTimeout, setHoverTimeout] = useState(null);
  const [killInProgress, setKillInProgress] = useState(false);
  const [monitoringHealth, setMonitoringHealth] = useState({});
  const [networkInterfaces, setNetworkInterfaces] = useState([]);
  const [storagePools, setStoragePools] = useState([]);
  const [storageDatasets, setStorageDatasets] = useState([]);
  const [activeConsoleType, setActiveConsoleType] = useState('vnc'); // 'vnc' or 'zlogin'
  const [previewReadOnly, setPreviewReadOnly] = useState(true); // Track preview terminal read-only state
  const [previewReconnectKey, setPreviewReconnectKey] = useState(0); // Force preview reconnection
  const [previewVncViewOnly, setPreviewVncViewOnly] = useState(true); // Track preview VNC view-only state
  
  const { user } = useAuth();
  const { 
    getServers, 
    makeZoneweaverAPIRequest, 
    servers: allServers, 
    currentServer, 
    currentZone, 
    selectZone, 
    clearZone,
    startZone,
    stopZone,
    restartZone,
    deleteZone,
    getZoneDetails,
    getAllZones,
    startVncSession,
    getVncSessionInfo,
    stopVncSession,
    startZloginSession,
    stopZloginSession,
    getZoneConfig,
    // Monitoring functions
    getMonitoringHealth,
    getNetworkInterfaces,
    getStoragePools,
    getStorageDatasets
  } = useServers();

  const { attachTerminal } = useZoneTerminal();

  useEffect(() => {
    if (currentServer) {
      loadZones(currentServer);
    }
  }, [currentServer]);

  // Handle URL query parameter for zone selection
  useEffect(() => {
    const zloginParam = searchParams.get('zlogin');
    if (zloginParam) {
      handleZoneSelect(zloginParam);
      handleZloginConsole(zloginParam);
      setSearchParams({});
    }

    const vncParam = searchParams.get('vnc');
    if (vncParam) {
      handleZoneSelect(vncParam);
      handleVncConsole(vncParam);
      setSearchParams({});
    }

    const zoneParam = searchParams.get('zone');
    if (zoneParam && zones.length > 0) {
      // Check if the zone exists in the current zones list
      const zoneExists = zones.includes(zoneParam);
      if (zoneExists) {
        console.log(`🔗 URL PARAM: Auto-selecting zone from URL parameter: ${zoneParam}`);
        handleZoneSelect(zoneParam);
        // Clear the URL parameter after selection to clean up the URL
        setSearchParams({});
      } else {
        console.warn(`⚠️ URL PARAM: Zone '${zoneParam}' not found in current zones list`);
        setError(`Zone '${zoneParam}' not found on the current server.`);
      }
    }
  }, [searchParams, zones, setSearchParams]);

  const loadZones = async (server) => {
    if (loading) return;
    try {
      setLoading(true);
      setError("");
      
      const result = await makeZoneweaverAPIRequest(
        server.hostname,
        server.port,
        server.protocol,
        'stats'
      );

      if (result.success) {
        const data = result.data;
        setZones(data.allzones || []);
        setRunningZones(data.runningzones || []);
      } else {
        setError(`Failed to fetch zones for ${server.hostname}: ${result.message}`);
      }
    } catch (error) {
      console.error('Error fetching zones:', error);
      setError(`Error connecting to ${server.hostname}`);
    } finally {
      setLoading(false);
    }
  };

  const loadZoneDetails = async (zoneName) => {
    if (!currentServer || loading) return;
    
    try {
      setLoading(true);
      
      // 🚀 PERFORMANCE FIX: Load zone details immediately (non-blocking)
      console.log(`⚡ PERF: Starting fast zone details load for ${zoneName}`);
      
      const result = await makeZoneweaverAPIRequest(
        currentServer.hostname,
        currentServer.port,
        currentServer.protocol,
        `zones/${zoneName}`
      );

      if (result.success) {
        console.log(`🔍 ZONE LOAD: Raw zone data for ${zoneName}:`, {
          configuration: result.data.configuration,
          diskArray: result.data.configuration?.disk,
          netArray: result.data.configuration?.net,
          diskIsArray: Array.isArray(result.data.configuration?.disk),
          netIsArray: Array.isArray(result.data.configuration?.net),
          diskValue: result.data.configuration?.disk,
          netValue: result.data.configuration?.net
        });
        
        setZoneDetails(prev => {
          console.log(`🔍 ZONE STATE: Initial load - BEFORE:`, {
            prevDisk: prev.configuration?.disk,
            prevNet: prev.configuration?.net,
            timestamp: Date.now()
          });
          
          const newState = result.data;
          
          console.log(`🔍 ZONE STATE: Initial load - AFTER:`, {
            newDisk: newState.configuration?.disk,
            newNet: newState.configuration?.net,
            timestamp: Date.now()
          });
          
          return newState;
        });
        
        // 🚀 PERFORMANCE FIX: Set loading to false immediately to show UI
        setLoading(false);
        console.log(`⚡ PERF: Zone details loaded and UI shown (${performance.now()}ms)`);
        
        // 🚀 RACE CONDITION FIX: Serialize session checks to prevent state corruption
        console.log(`⚡ RACE FIX: Starting serialized session status checks for ${zoneName}`);
        
        // CRITICAL: Run session checks SEQUENTIALLY to prevent race conditions
        // This prevents refreshVncSessionStatus from overwriting zlogin_session with stale state
        (async () => {
          try {
            console.log(`🔍 RACE FIX: Step 1 - VNC status check for ${zoneName}`);
            await refreshVncSessionStatus(zoneName).catch(err => 
              console.warn('Background VNC status check failed:', err)
            );
            
            console.log(`🔍 RACE FIX: Step 2 - zlogin status check for ${zoneName}`);
            await refreshZloginSessionStatus(zoneName).catch(err => 
              console.warn('Background zlogin status check failed:', err)  
            );
            
            console.log(`🔍 RACE FIX: Step 3 - monitoring data load for ${zoneName}`);
            await loadMonitoringData(currentServer).catch(err => 
              console.warn('Background monitoring data load failed:', err)
            );
            
            console.log(`✅ RACE FIX: All serialized session checks completed for ${zoneName}`);
          } catch (error) {
            console.error(`💥 RACE FIX: Error in serialized session checks for ${zoneName}:`, error);
          }
        })();
        
      } else {
        setError(`Failed to fetch details for zone ${zoneName}: ${result.message}`);
        setLoading(false);
      }
    } catch (error) {
      console.error('Error fetching zone details:', error);
      setError(`Error fetching zone details for ${zoneName}`);
      setLoading(false);
    }
  };

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

  /**
   * Enhanced VNC session validation
   * Validates that a VNC session is actually working after backend reports success
   */
  const validateVncSession = async (zoneName, maxAttempts = 3) => {
    if (!currentServer) {
      return { valid: false, reason: 'No current server selected' };
    }

    console.log(`🔍 VNC VALIDATION: Starting validation for zone: ${zoneName}`);
    
    // Wait a moment for the VNC session to stabilize
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        console.log(`🔍 VNC VALIDATION: Attempt ${attempt}/${maxAttempts} for zone: ${zoneName}`);
        
        // Check VNC session status with cache bypass
        const vncResult = await makeZoneweaverAPIRequest(
          currentServer.hostname,
          currentServer.port,
          currentServer.protocol,
          `zones/${zoneName}/vnc/info?_validation=true&_t=${Date.now()}`,
          'GET',
          null,
          null,
          true // Force bypass cache
        );

        console.log(`🔍 VNC VALIDATION: Response for attempt ${attempt}:`, {
          success: vncResult.success,
          status: vncResult.status,
          data: vncResult.data
        });

        if (vncResult.success && vncResult.data) {
          // Check multiple indicators of active session
          const hasActiveProperty = typeof vncResult.data.active !== 'undefined';
          const hasStatusProperty = vncResult.data.status;
          const hasConsoleUrl = vncResult.data.console_url;
          const hasWebPort = vncResult.data.web_port;
          
          const isActive = hasActiveProperty ? vncResult.data.active : 
                           (hasStatusProperty ? vncResult.data.status === 'active' : false);
          
          if (isActive && hasConsoleUrl && hasWebPort) {
            console.log(`✅ VNC VALIDATION: Session validated successfully for ${zoneName}`);
            return { 
              valid: true, 
              sessionInfo: vncResult.data,
              reason: 'Session active and accessible'
            };
          } else {
            console.log(`⚠️ VNC VALIDATION: Session reported but missing required fields:`, {
              isActive,
              hasConsoleUrl,
              hasWebPort,
              data: vncResult.data
            });
          }
        } else {
          console.log(`❌ VNC VALIDATION: No active session found on attempt ${attempt}`);
        }
        
        // Wait before retry (except on last attempt)
        if (attempt < maxAttempts) {
          console.log(`⏳ VNC VALIDATION: Waiting 2s before retry...`);
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
        
      } catch (error) {
        console.error(`💥 VNC VALIDATION: Error on attempt ${attempt}:`, error);
        
        // Wait before retry (except on last attempt)  
        if (attempt < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
    }

    console.log(`❌ VNC VALIDATION: Failed after ${maxAttempts} attempts for zone: ${zoneName}`);
    return { 
      valid: false, 
      reason: `Session validation failed after ${maxAttempts} attempts. The VNC process may have exited or port is still occupied by a previous session.`
    };
  };

  /**
   * SIMPLIFIED: VNC session status check with PID file approach
   * Now only handles: 200 (active) or 404 (not found) - no more complex states
   */
  const refreshVncSessionStatus = async (zoneName) => {
    if (!currentServer) return;
    
    try {
      console.log(`🔍 VNC STATUS: Checking session status for zone: ${zoneName}`);
      console.log(`🔍 VNC DEBUG: Current zoneDetails before VNC request:`, {
        configExists: !!zoneDetails.configuration,
        diskArray: zoneDetails.configuration?.disk,
        netArray: zoneDetails.configuration?.net,
        diskIsArray: Array.isArray(zoneDetails.configuration?.disk),
        netIsArray: Array.isArray(zoneDetails.configuration?.net)
      });
      
      const apiPath = `zones/${zoneName}/vnc/info?_t=${Date.now()}`;
      console.log(`🔍 VNC STATUS: Making request to path: ${apiPath}`);
      
      // Simple API call - backend returns active session or 404
      const vncResult = await makeZoneweaverAPIRequest(
        currentServer.hostname,
        currentServer.port,
        currentServer.protocol,
        apiPath,
        'GET',
        null,
        null,
        true // Force bypass cache
      );

      console.log(`🔍 VNC STATUS: API response:`, {
        success: vncResult.success,
        status: vncResult.status,
        data: vncResult.data
      });

      if (vncResult.success && vncResult.data && vncResult.data.active_vnc_session) {
        // Session is active - backend verified PID file and process
        console.log(`✅ VNC STATUS: Active session found for ${zoneName}`);
        setZoneDetails(prev => {
          console.log(`🔍 ZONE STATE: VNC update - BEFORE:`, {
            hasZloginSession: !!prev.zlogin_session,
            hasActiveZloginSession: prev.active_zlogin_session,
            disk: prev.configuration?.disk,
            net: prev.configuration?.net,
            timestamp: Date.now()
          });
          
          // 🛡️ DEFENSIVE STATE MERGE: Only update VNC fields, explicitly preserve zlogin state
          const newState = {
            ...prev,
            active_vnc_session: true,
            vnc_session_info: vncResult.data.vnc_session_info,
            // CRITICAL: Explicitly preserve zlogin session state to prevent overwrites
            zlogin_session: prev.zlogin_session || null,
            active_zlogin_session: prev.active_zlogin_session || false
          };
          
          console.log(`🔍 ZONE STATE: VNC update - AFTER:`, {
            hasZloginSession: !!newState.zlogin_session,
            hasActiveZloginSession: newState.active_zlogin_session,
            disk: newState.configuration?.disk,
            net: newState.configuration?.net,
            timestamp: Date.now()
          });
          
          return newState;
        });
      } else {
        // No session found - backend returned active_vnc_session: false
        console.log(`❌ VNC STATUS: No active session for ${zoneName}`);
        setZoneDetails(prev => {
          console.log(`🔍 ZONE STATE: VNC clear - BEFORE:`, {
            hasZloginSession: !!prev.zlogin_session,
            hasActiveZloginSession: prev.active_zlogin_session,
            disk: prev.configuration?.disk,
            net: prev.configuration?.net,
            timestamp: Date.now()
          });
          
          // 🛡️ DEFENSIVE STATE MERGE: Only clear VNC fields, explicitly preserve zlogin state
          const newState = {
            ...prev,
            active_vnc_session: false,
            vnc_session_info: null,
            // CRITICAL: Explicitly preserve zlogin session state to prevent overwrites
            zlogin_session: prev.zlogin_session || null,
            active_zlogin_session: prev.active_zlogin_session || false
          };
          
          console.log(`🔍 ZONE STATE: VNC clear - AFTER:`, {
            hasZloginSession: !!newState.zlogin_session,
            hasActiveZloginSession: newState.active_zlogin_session,
            disk: newState.configuration?.disk,
            net: newState.configuration?.net,
            timestamp: Date.now()
          });
          
          return newState;
        });
      }
    } catch (error) {
      console.error('💥 VNC STATUS: Error checking session status:', error);
      setZoneDetails(prev => {
        console.log(`🔍 ZONE STATE: VNC error - BEFORE:`, {
          disk: prev.configuration?.disk,
          net: prev.configuration?.net,
          timestamp: Date.now()
        });
        
        const newState = {
          ...prev,
          active_vnc_session: false,
          vnc_session_info: null
        };
        
        console.log(`🔍 ZONE STATE: VNC error - AFTER:`, {
          disk: newState.configuration?.disk,
          net: newState.configuration?.net,
          timestamp: Date.now()
        });
        
        return newState;
      });
    }
  };

  /**
   * Check for existing active zlogin sessions for the current zone
   * Updates zoneDetails with session status and info
   */
  const refreshZloginSessionStatus = async (zoneName) => {
    if (!currentServer) return;
    
    try {
      console.log(`🔍 ZLOGIN STATUS: Checking session status for zone: ${zoneName}`);
      
      // Get all zlogin sessions and find active ones for this zone
      const sessionsResult = await makeZoneweaverAPIRequest(
        currentServer.hostname,
        currentServer.port,
        currentServer.protocol,
        `zlogin/sessions?_t=${Date.now()}`,
        'GET',
        null,
        null,
        true // Force bypass cache
      );

      console.log(`🔍 ZLOGIN STATUS: Sessions API response:`, {
        success: sessionsResult.success,
        status: sessionsResult.status,
        data: sessionsResult.data
      });

      if (sessionsResult.success && sessionsResult.data) {
        // Find active session for this zone
        const activeSessions = Array.isArray(sessionsResult.data) 
          ? sessionsResult.data 
          : (sessionsResult.data.sessions || []);
        
        const activeZoneSession = activeSessions.find(session => 
          session.zone_name === zoneName && session.status === 'active'
        );

        if (activeZoneSession) {
          console.log(`✅ ZLOGIN STATUS: Active session found for ${zoneName}:`, activeZoneSession.id);
          setZoneDetails(prev => {
            console.log(`🔍 ZONE STATE: ZLOGIN update - BEFORE:`, {
              hasVncSession: !!prev.active_vnc_session,
              hasVncSessionInfo: !!prev.vnc_session_info,
              timestamp: Date.now()
            });

            // 🛡️ DEFENSIVE STATE MERGE: Only update zlogin fields, explicitly preserve VNC state
            const newState = {
              ...prev,
              zlogin_session: activeZoneSession,
              active_zlogin_session: true,
              // CRITICAL: Explicitly preserve VNC session state to prevent overwrites
              active_vnc_session: prev.active_vnc_session || false,
              vnc_session_info: prev.vnc_session_info || null
            };

            // 🔵 ZLOGIN STATE CHANGE TRACKING
            console.log(`🔵 ZLOGIN STATE CHANGE:`, {
              zoneName: zoneName,
              trigger: 'refreshZloginSessionStatus-found-active',
              from: {
                zlogin_session: prev.zlogin_session?.id || null,
                active_zlogin_session: prev.active_zlogin_session
              },
              to: {
                zlogin_session: activeZoneSession.id,
                active_zlogin_session: true
              },
              sessionData: activeZoneSession,
              timestamp: new Date().toISOString()
            });

            console.log(`🔍 ZONE STATE: ZLOGIN update - AFTER:`, {
              hasVncSession: !!newState.active_vnc_session,
              hasVncSessionInfo: !!newState.vnc_session_info,
              timestamp: Date.now()
            });

            return newState;
          });
        } else {
          console.log(`❌ ZLOGIN STATUS: No active session for ${zoneName}`);
          setZoneDetails(prev => {
            console.log(`🔍 ZONE STATE: ZLOGIN clear - BEFORE:`, {
              hasVncSession: !!prev.active_vnc_session,
              hasVncSessionInfo: !!prev.vnc_session_info,
              timestamp: Date.now()
            });

            // 🛡️ DEFENSIVE STATE MERGE: Only clear zlogin fields, explicitly preserve VNC state
            const newState = {
              ...prev,
              zlogin_session: null,
              active_zlogin_session: false,
              // CRITICAL: Explicitly preserve VNC session state to prevent overwrites
              active_vnc_session: prev.active_vnc_session || false,
              vnc_session_info: prev.vnc_session_info || null
            };

            // 🔵 ZLOGIN STATE CHANGE TRACKING
            console.log(`🔵 ZLOGIN STATE CHANGE:`, {
              zoneName: zoneName,
              trigger: 'refreshZloginSessionStatus-no-active-found',
              from: {
                zlogin_session: prev.zlogin_session?.id || null,
                active_zlogin_session: prev.active_zlogin_session
              },
              to: {
                zlogin_session: null,
                active_zlogin_session: false
              },
              reason: 'No active session found in API response',
              timestamp: new Date().toISOString()
            });

            console.log(`🔍 ZONE STATE: ZLOGIN clear - AFTER:`, {
              hasVncSession: !!newState.active_vnc_session,
              hasVncSessionInfo: !!newState.vnc_session_info,
              timestamp: Date.now()
            });

            return newState;
          });
        }
      } else {
        // No sessions or API error
        console.log(`❌ ZLOGIN STATUS: No sessions found or API error for ${zoneName}`);
        setZoneDetails(prev => {
          // 🔵 ZLOGIN STATE CHANGE TRACKING
          console.log(`🔵 ZLOGIN STATE CHANGE:`, {
            zoneName: zoneName,
            trigger: 'refreshZloginSessionStatus-api-error-no-sessions',
            from: {
              zlogin_session: prev.zlogin_session?.id || null,
              active_zlogin_session: prev.active_zlogin_session
            },
            to: {
              zlogin_session: null,
              active_zlogin_session: false
            },
            reason: 'API error or no sessions in response',
            apiResponse: sessionsResult,
            timestamp: new Date().toISOString()
          });

          // 🛡️ DEFENSIVE STATE MERGE: Only clear zlogin fields, explicitly preserve VNC state
          const newState = {
            ...prev,
            zlogin_session: null,
            active_zlogin_session: false,
            // CRITICAL: Explicitly preserve VNC session state to prevent overwrites
            active_vnc_session: prev.active_vnc_session || false,
            vnc_session_info: prev.vnc_session_info || null
          };
          return newState;
        });
      }
    } catch (error) {
      console.error('💥 ZLOGIN STATUS: Error checking session status:', error);
      setZoneDetails(prev => {
        // 🔵 ZLOGIN STATE CHANGE TRACKING
        console.log(`🔵 ZLOGIN STATE CHANGE:`, {
          zoneName: zoneName,
          trigger: 'refreshZloginSessionStatus-catch-error',
          from: {
            zlogin_session: prev.zlogin_session?.id || null,
            active_zlogin_session: prev.active_zlogin_session
          },
          to: {
            zlogin_session: null,
            active_zlogin_session: false
          },
          error: error.message,
          errorStack: error.stack,
          timestamp: new Date().toISOString()
        });

        // 🛡️ DEFENSIVE STATE MERGE: Only clear zlogin fields, explicitly preserve VNC state
        const newState = {
          ...prev,
          zlogin_session: null,
          active_zlogin_session: false,
          // CRITICAL: Explicitly preserve VNC session state to prevent overwrites
          active_vnc_session: prev.active_vnc_session || false,
          vnc_session_info: prev.vnc_session_info || null
        };
        return newState;
      });
    }
  };

  const handleZoneSelect = (zoneName) => {
    selectZone(zoneName);
    loadZoneDetails(zoneName);
  };

  // Sync local selectedZone with global currentZone and ensure details load when both server and zone are ready
  useEffect(() => {
    setSelectedZone(currentZone);
    if (currentZone && currentServer) {
      // Only load zone details if we have both server and zone ready
      console.log(`🔄 PERSISTENCE: Loading zone details for ${currentZone} on server ${currentServer.hostname}`);
      loadZoneDetails(currentZone);
    } else {
      setZoneDetails({});
    }
  }, [currentZone, currentServer]);

  // Auto-select console type based on what's available - STABILIZED to prevent infinite loops
  useEffect(() => {
    const hasVnc = zoneDetails.active_vnc_session;
    const hasZlogin = zoneDetails.zlogin_session;
    
    // LOOP PREVENTION: Only change console type if there's a meaningful difference
    // This prevents VNC disconnect -> console switch -> remount -> VNC disconnect loops
    
    if (hasVnc && hasZlogin) {
      // Both active - keep current selection or default to VNC
      if (!activeConsoleType || (activeConsoleType !== 'vnc' && activeConsoleType !== 'zlogin')) {
        console.log('🔧 CONSOLE SWITCH: Both sessions available, defaulting to VNC');
        setActiveConsoleType('vnc');
      }
    } else if (hasZlogin && activeConsoleType !== 'zlogin') {
      // Only zlogin available and not already selected
      console.log('🔧 CONSOLE SWITCH: Only zlogin available, switching to zlogin');
      setActiveConsoleType('zlogin');
    } else if (hasVnc && activeConsoleType !== 'vnc') {
      // Only VNC available and not already selected  
      console.log('🔧 CONSOLE SWITCH: Only VNC available, switching to VNC');
      setActiveConsoleType('vnc');
    } else if (!hasVnc && !hasZlogin && activeConsoleType !== 'vnc') {
      // Nothing available - default to VNC (but don't cause unnecessary switches)
      console.log('🔧 CONSOLE SWITCH: No sessions available, defaulting to VNC');
      setActiveConsoleType('vnc');
    }
    // IMPORTANT: Removed activeConsoleType from dependency array to prevent circular updates
  }, [zoneDetails.active_vnc_session, zoneDetails.zlogin_session]);

  // Previous state tracking to fix infinite loop
  const prevShowZloginConsole = useRef(showZloginConsole);
  
  // Handle modal close reconnection - Fix for preview terminal going black after modal closes
  useEffect(() => {
    // Only trigger when modal JUST closed (state transition from true to false)
    if (prevShowZloginConsole.current && !showZloginConsole && activeConsoleType === 'zlogin' && zoneDetails.zlogin_session && selectedZone) {
      console.log('🔄 MODAL CLOSE: zlogin modal just closed, reconnecting preview terminal');
      
      // Force preview terminal reconnection by incrementing the reconnect key
      // This will trigger a fresh ZoneShell component mount
      setTimeout(() => {
        setPreviewReconnectKey(prev => prev + 1);
        console.log('🔄 MODAL CLOSE: Preview terminal reconnection triggered');
      }, 100); // Small delay to ensure modal cleanup is complete
    }
    
    // Update previous state for next comparison
    prevShowZloginConsole.current = showZloginConsole;
  }, [showZloginConsole, activeConsoleType, zoneDetails.zlogin_session, selectedZone]);

  const getZoneStatus = (zoneName) => {
    return runningZones.includes(zoneName) ? 'running' : 'stopped';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'running':
        return 'is-success';
      case 'stopped':
        return 'is-danger';
      default:
        return 'is-warning';
    }
  };

  // Zone action handlers
  const handleStartZone = async (zoneName) => {
    if (!currentServer) return;
    
    try {
      setLoading(true);
      const result = await startZone(
        currentServer.hostname,
        currentServer.port,
        currentServer.protocol,
        zoneName
      );

      if (result.success) {
        // Refresh zones list after action
        setTimeout(() => loadZones(currentServer), 2000);
      } else {
        setError(`Failed to start zone ${zoneName}: ${result.message}`);
      }
    } catch (error) {
      console.error('Error starting zone:', error);
      setError(`Error starting zone ${zoneName}`);
    } finally {
      setLoading(false);
    }
  };

  const handleStopZone = async (zoneName, force = false) => {
    if (!currentServer) return;
    
    try {
      setLoading(true);
      const result = await stopZone(
        currentServer.hostname,
        currentServer.port,
        currentServer.protocol,
        zoneName,
        force
      );

      if (result.success) {
        // Refresh zones list after action
        setTimeout(() => loadZones(currentServer), 2000);
      } else {
        setError(`Failed to stop zone ${zoneName}: ${result.message}`);
      }
    } catch (error) {
      console.error('Error stopping zone:', error);
      setError(`Error stopping zone ${zoneName}`);
    } finally {
      setLoading(false);
    }
  };

  const handleRestartZone = async (zoneName) => {
    if (!currentServer) return;
    
    try {
      setLoading(true);
      const result = await restartZone(
        currentServer.hostname,
        currentServer.port,
        currentServer.protocol,
        zoneName
      );

      if (result.success) {
        // Refresh zones list after action
        setTimeout(() => loadZones(currentServer), 3000);
      } else {
        setError(`Failed to restart zone ${zoneName}: ${result.message}`);
      }
    } catch (error) {
      console.error('Error restarting zone:', error);
      setError(`Error restarting zone ${zoneName}`);
    } finally {
      setLoading(false);
    }
  };

  /**
   * VNC console start - ALL connections go through Zoneweaver proxy
   */
  const handleVncConsole = async (zoneName, openInNewTab = false) => {
    if (!currentServer) return;
    
    try {
      setLoadingVnc(true);
      setError("");
      
      console.log(`🔄 VNC START: Starting VNC console for zone: ${zoneName}`);
      
      const result = await startVncSession(
        currentServer.hostname,
        currentServer.port,
        currentServer.protocol,
        zoneName
      );

      if (result.success) {
        console.log(`✅ VNC START: VNC session ready for ${zoneName}`);
        const vncData = result.data;
        
        if (!vncData || typeof vncData !== 'object') {
          console.warn(`⚠️ VNC START: Invalid vncData received:`, vncData);
          setError(`VNC session created but response format invalid. Try refreshing the page.`);
          return;
        }
        
        setVncSession(vncData);
        
        // ONLY use Zoneweaver proxy routes - NO direct connections
        const proxyUrl = `/api/servers/${encodeURIComponent(currentServer.hostname)}:${currentServer.port}/zones/${encodeURIComponent(zoneName)}/vnc/console`;
        
        if (openInNewTab) {
          // Open console in new tab via Zoneweaver proxy
          console.log(`🔄 VNC START: Opening VNC console in new tab via Zoneweaver proxy: ${proxyUrl}`);
          window.open(proxyUrl, '_blank', 'width=1024,height=768,scrollbars=yes,resizable=yes');
        } else {
          // Show embedded console via VncViewer component
          console.log(`🔄 VNC START: Opening embedded VNC console via Zoneweaver proxy`);
          setShowVncConsole(true);
        }
        
        // Update status immediately - session is ready
        setZoneDetails(prev => ({
          ...prev,
          active_vnc_session: true,
          vnc_session_info: vncData
        }));
        
      } else {
        console.error(`❌ VNC START: Backend failed to start session:`, result.message);
        setError(`Failed to start VNC console for ${zoneName}: ${result.message}`);
      }
    } catch (error) {
      console.error('💥 VNC START: Error starting VNC console:', error);
      setError(`Error starting VNC console for ${zoneName}`);
    } finally {
      setLoadingVnc(false);
    }
  };

  const handleZloginConsole = async (zoneName) => {
    if (!currentServer) return;

    try {
      const result = await startZloginSession(
        currentServer.hostname,
        currentServer.port,
        currentServer.protocol,
        zoneName
      );

      if (result.success) {
        setZoneDetails(prev => ({
          ...prev,
          zlogin_session: result.session
        }));
        setShowZloginConsole(true);
      } else {
        setError(`Failed to start zlogin console for ${zoneName}: ${result.message}`);
      }
    } catch (error) {
      console.error('Error starting zlogin console:', error);
      setError(`Error starting zlogin console for ${zoneName}`);
    }
  };

  const openVncFullScreen = () => {
    setIsVncFullScreen(!isVncFullScreen);
  };

  const openZloginFullScreen = () => {
    setIsZloginFullScreen(!isZloginFullScreen);
  };

  const closeVncConsole = () => {
    setShowVncConsole(false);
    setVncConsoleUrl("");
    setVncLoadError(false);
    setIsVncFullScreen(false);
    setShowFullScreenControls(false);
    if (hoverTimeout) {
      clearTimeout(hoverTimeout);
      setHoverTimeout(null);
    }
  };

  const handleCornerHover = () => {
    if (!isVncFullScreen) return;
    
    if (hoverTimeout) {
      clearTimeout(hoverTimeout);
    }
    
    const timeout = setTimeout(() => {
      setShowFullScreenControls(true);
    }, 4000); // 4 second delay
    
    setHoverTimeout(timeout);
  };

  const handleCornerLeave = () => {
    if (hoverTimeout) {
      clearTimeout(hoverTimeout);
      setHoverTimeout(null);
    }
    setShowFullScreenControls(false);
  };

  const handleVncIframeError = () => {
    console.warn('VNC iframe failed to load, offering direct access fallback');
    setVncLoadError(true);
  };

  const openDirectVncFallback = () => {
    if (vncSession && vncSession.directUrl) {
      window.open(vncSession.directUrl, '_blank', 'width=1024,height=768,scrollbars=yes,resizable=yes');
    } else if (vncSession && vncSession.console_url) {
      window.open(vncSession.console_url, '_blank', 'width=1024,height=768,scrollbars=yes,resizable=yes');
    }
    closeVncConsole(); // Close modal after opening direct access
  };

  /**
   * SIMPLIFIED: VNC kill process aligned with zlogin pattern
   * Just call backend kill then refresh status from API - simpler and more reliable
   */
  const handleKillVncSession = async (zoneName) => {
    if (!currentServer || killInProgress) return;
    
    try {
      setKillInProgress(true);
      setLoading(true);
      setError("");
      
      console.log(`🔄 VNC KILL: Starting kill process for zone: ${zoneName}`);
      
      const result = await stopVncSession(
        currentServer.hostname,
        currentServer.port,
        currentServer.protocol,
        zoneName
      );

      if (result.success) {
        console.log(`✅ VNC KILL: Backend reported successful kill for ${zoneName}`);
        
        // SIMPLIFIED: Just refresh status from API (like zlogin does)
        await refreshVncSessionStatus(zoneName);
        
        // Close VNC console modal if it's open
        if (showVncConsole) {
          closeVncConsole();
        }
        
        console.log(`✅ VNC KILL: Kill process completed for ${zoneName}`);
        
      } else {
        console.error(`❌ VNC KILL: Backend failed to kill session:`, result.message);
        setError(`Failed to kill VNC session for ${zoneName}: ${result.message}`);
      }
    } catch (error) {
      console.error('💥 VNC KILL: Error during kill process:', error);
      setError(`Error killing VNC session for ${zoneName}`);
    } finally {
      setKillInProgress(false);
      setLoading(false);
    }
  };

  /**
   * FIXED: Separate kill verification function
   * Uses different cache-busting parameter to avoid conflicts with start validation
   */
  const verifyKillCompletion = async (zoneName, maxAttempts = 3) => {
    console.log(`🔍 VNC KILL VERIFY: Starting verification for zone: ${zoneName}`);
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        console.log(`🔍 VNC KILL VERIFY: Attempt ${attempt}/${maxAttempts}`);
        
        // Wait between attempts
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Use DIFFERENT cache-busting parameter to avoid conflicts
        const statusResult = await makeZoneweaverAPIRequest(
          currentServer.hostname,
          currentServer.port,
          currentServer.protocol,
          `zones/${zoneName}/vnc/info?_kill_check=${Date.now()}`,
          'GET',
          null,
          null,
          true // Force bypass cache
        );
        
        if (!statusResult.success || statusResult.status === 404) {
          console.log(`✅ VNC KILL VERIFY: Session successfully terminated for ${zoneName}`);
          
          // Update state immediately
          setZoneDetails(prev => ({
            ...prev,
            active_vnc_session: false,
            vnc_session_info: null
          }));
          
          // Close VNC console modal if it's open
          if (showVncConsole) {
            closeVncConsole();
          }
          
          return; // Success!
        } else {
          console.log(`⚠️ VNC KILL VERIFY: Session still active on attempt ${attempt}:`, statusResult.data);
        }
        
      } catch (error) {
        console.error(`💥 VNC KILL VERIFY: Error on attempt ${attempt}:`, error);
      }
    }
    
    // If we get here, verification failed
    console.warn(`⚠️ VNC KILL VERIFY: Verification failed after ${maxAttempts} attempts`);
    setError(`VNC session was stopped but verification failed. Wait a moment before starting new session.`);
  };

  if (allServers.length === 0) {
    return (
      <div className='hero-body mainbody p-0 is-align-items-stretch'>
        <Helmet>
          <meta charSet='utf-8' />
          <title>Zones - Zoneweaver</title>
          <link rel='canonical' href={window.location.origin} />
        </Helmet>
        <div className='container is-fluid m-2'>
          <div className='box p-0'>
            <div className='titlebar box active level is-mobile mb-0 p-3'>
              <div className='level-left'>
                <strong>Zone Management</strong>
              </div>
            </div>
            <div className='p-4'>
              <div className='notification is-info'>
                <h2 className='title is-4'>No Zoneweaver API Servers</h2>
                <p>You haven't added any Zoneweaver API Servers yet. Add a server to start managing zones.</p>
                <div className='mt-4'>
                  <a href='/ui/settings/zoneweaver?tab=servers' className='button is-primary'>
                    <span className='icon'>
                      <i className='fas fa-plus'></i>
                    </span>
                    <span>Add Zoneweaver API Server</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='hero-body mainbody p-0 is-align-items-stretch'>
      <Helmet>
        <meta charSet='utf-8' />
        <title>Zones - Zoneweaver</title>
        <link rel='canonical' href={window.location.origin} />
      </Helmet>
      <div className='container is-fluid m-2'>
        <div className='box p-0'>
          <div className='titlebar box active level is-mobile mb-0 p-3'>
            <div className='level-left'>
              <strong>Zone Management</strong>
            </div>
            <div className='level-right'>
              <div className='field is-grouped'>
                <div className='control'>
                  <div className='tags has-addons'>
                    <span className='tag'>Total</span>
                    <span className='tag is-info'>{zones.length}</span>
                  </div>
                </div>
                <div className='control'>
                  <div className='tags has-addons'>
                    <span className='tag'>Running</span>
                    <span className='tag is-success'>{runningZones.length}</span>
                  </div>
                </div>
                <div className='control'>
                  <div className='tags has-addons'>
                    <span className='tag'>Stopped</span>
                    <span className='tag is-danger'>{zones.length - runningZones.length}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className='p-4'>
            {error && (
              <div className='notification is-dangermb-4'>
                <p>{error}</p>
              </div>
            )}

            {/* Zone Details - Full Width */}
            <div>
                {selectedZone ? (
                  <div className='box'>
                    {Object.keys(zoneDetails).length > 0 ? (
                      <div className='content'>
                        {/* Main Layout with VNC Console spanning both sections */}
                        <div className='columns'>
                          {/* Left Column - Zone Information and Hardware & System */}
                          <div className='column is-6'>
                            {/* Zone Information */}
                            {zoneDetails.zone_info && (
                              <div className='box mb-0 pt-0 pd-0'>
                                <h4 className='title is-6 mb-3'>
                                  <span className='icon-text'>
                                    <span className='icon'><i className='fas fa-info-circle'></i></span>
                                    <span>Zone Information</span>
                                  </span>
                                </h4>
                                <div className='table-container'>
                                  <table className='table is-fullwidth is-striped' style={{fontSize: '0.875rem'}}>
                                    <tbody>
                                      <tr>
                                        <td style={{padding: '0.5rem 0.75rem'}}><strong>System Status</strong></td>
                                        <td style={{padding: '0.5rem 0.75rem'}}>
                                          <span className={`has-text-weight-semibold ${getZoneStatus(selectedZone) === 'running' ? 'has-text-success' : 'has-text-danger'}`}>
                                            {getZoneStatus(selectedZone) === 'running' ? 'Running' : 'Stopped'}
                                          </span>
                                        </td>
                                      </tr>
                                      {/* Host Health Status */}
                                      {Object.keys(monitoringHealth).length > 0 && (
                                        <tr>
                                          <td style={{padding: '0.5rem 0.75rem'}}><strong>Host Health</strong></td>
                                          <td style={{padding: '0.5rem 0.75rem'}}>
                                            <span className={`has-text-weight-semibold ${
                                              monitoringHealth.status === 'healthy' ? 'has-text-success' : 
                                              monitoringHealth.status === 'warning' ? 'has-text-warning' : 'has-text-danger'
                                            }`}>
                                              {monitoringHealth.status ? monitoringHealth.status.charAt(0).toUpperCase() + monitoringHealth.status.slice(1) : 'Unknown'}
                                            </span>
                                            {(monitoringHealth.networkErrors > 0 || monitoringHealth.storageErrors > 0) && (
                                              <div className='tags mt-1'>
                                                {monitoringHealth.networkErrors > 0 && (
                                                  <span className='tag is-warning is-small'>Net Errors: {monitoringHealth.networkErrors}</span>
                                                )}
                                                {monitoringHealth.storageErrors > 0 && (
                                                  <span className='tag is-warning is-small'>Storage Errors: {monitoringHealth.storageErrors}</span>
                                                )}
                                              </div>
                                            )}
                                          </td>
                                        </tr>
                                      )}
                                      <tr>
                                        <td style={{padding: '0.5rem 0.75rem'}}><strong>Last Seen</strong></td>
                                        <td style={{padding: '0.5rem 0.75rem'}}><span className='has-text-grey'>{zoneDetails.zone_info.last_seen ? new Date(zoneDetails.zone_info.last_seen).toLocaleString() : 'N/A'}</span></td>
                                      </tr>
                                      {(zoneDetails.zone_info.is_orphaned || zoneDetails.zone_info.auto_discovered) && (
                                        <tr>
                                          <td style={{padding: '0.5rem 0.75rem'}}><strong>Flags</strong></td>
                                          <td style={{padding: '0.5rem 0.75rem'}}>
                                            <div className='tags'>
                                              {zoneDetails.zone_info.is_orphaned && (
                                                <span className='tag is-warning'>Orphaned</span>
                                              )}
                                              {zoneDetails.zone_info.auto_discovered && (
                                                <span className='tag is-info'>Auto-discovered</span>
                                              )}
                                            </div>
                                          </td>
                                        </tr>
                                      )}
                                      {/* Zone System Settings */}
                                      {zoneDetails.configuration && (
                                        <>
                                          <tr>
                                            <td style={{padding: '0.5rem 0.75rem'}}><strong>Zone Name</strong></td>
                                            <td style={{padding: '0.5rem 0.75rem'}}><code style={{fontSize: '0.85rem'}}>{zoneDetails.configuration.zonename}</code></td>
                                          </tr>
                                          <tr>
                                            <td style={{padding: '0.5rem 0.75rem'}}><strong>Zone Path</strong></td>
                                            <td style={{padding: '0.5rem 0.75rem'}}><code style={{fontSize: '0.85rem'}}>{zoneDetails.configuration.zonepath}</code></td>
                                          </tr>
                                          {zoneDetails.configuration.bootargs && (
                                            <tr>
                                              <td style={{padding: '0.5rem 0.75rem'}}><strong>Boot Args</strong></td>
                                              <td style={{padding: '0.5rem 0.75rem'}}><code style={{fontSize: '0.85rem'}}>{zoneDetails.configuration.bootargs || 'None'}</code></td>
                                            </tr>
                                          )}
                                          {zoneDetails.configuration.hostid && (
                                            <tr>
                                              <td style={{padding: '0.5rem 0.75rem'}}><strong>Host ID</strong></td>
                                              <td style={{padding: '0.5rem 0.75rem'}}><span className='tag'>{zoneDetails.configuration.hostid || 'None'}</span></td>
                                            </tr>
                                          )}
                                          {zoneDetails.configuration.pool && (
                                            <tr>
                                              <td style={{padding: '0.5rem 0.75rem'}}><strong>Pool</strong></td>
                                              <td style={{padding: '0.5rem 0.75rem'}}><span className='tag'>{zoneDetails.configuration.pool || 'None'}</span></td>
                                            </tr>
                                          )}
                                          {zoneDetails.configuration['scheduling-class'] && (
                                            <tr>
                                              <td style={{padding: '0.5rem 0.75rem'}}><strong>Scheduling Class</strong></td>
                                              <td style={{padding: '0.5rem 0.75rem'}}><span className='tag'>{zoneDetails.configuration['scheduling-class'] || 'None'}</span></td>
                                            </tr>
                                          )}
                                          {zoneDetails.configuration.limitpriv && (
                                            <tr>
                                              <td style={{padding: '0.5rem 0.75rem'}}><strong>Limit Privileges</strong></td>
                                              <td style={{padding: '0.5rem 0.75rem'}}><span className='tag'>{zoneDetails.configuration.limitpriv || 'None'}</span></td>
                                            </tr>
                                          )}
                                          {zoneDetails.configuration['fs-allowed'] && (
                                            <tr>
                                              <td style={{padding: '0.5rem 0.75rem'}}><strong>FS Allowed</strong></td>
                                              <td style={{padding: '0.5rem 0.75rem'}}><span className='tag'>{zoneDetails.configuration['fs-allowed'] || 'None'}</span></td>
                                            </tr>
                                          )}
                                        </>
                                      )}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            )}

                            {/* Hardware & System - Same level alignment */}
                            {zoneDetails.configuration && Object.keys(zoneDetails.configuration).length > 0 && (
                              <div className='box mb-0 pt-0 pd-0'>
                                <h4 className='title is-6 mb-3'>
                                  <span className='icon-text'>
                                    <span className='icon'><i className='fas fa-microchip'></i></span>
                                    <span>Hardware & System</span>
                                  </span>
                                </h4>
                                <div className='table-container'>
                                  <table className='table is-fullwidth is-striped' style={{fontSize: '0.875rem'}}>
                                    <tbody>
                                      <tr>
                                        <td style={{padding: '0.5rem 0.75rem'}}><strong>RAM</strong></td>
                                        <td style={{padding: '0.5rem 0.75rem'}}>{zoneDetails.configuration.ram}</td>
                                        <td style={{padding: '0.5rem 0.75rem'}}><strong>ACPI</strong></td>
                                        <td style={{padding: '0.5rem 0.75rem'}}>
                                          <span className={`has-text-weight-semibold ${zoneDetails.configuration.acpi === 'true' ? 'has-text-success' : 'has-text-danger'}`}>
                                            {zoneDetails.configuration.acpi === 'true' ? 'Enabled' : 'Disabled'}
                                          </span>
                                        </td>
                                      </tr>
                                      <tr>
                                        <td style={{padding: '0.5rem 0.75rem'}}><strong>vCPUs</strong></td>
                                        <td style={{padding: '0.5rem 0.75rem'}}>{zoneDetails.configuration.vcpus}</td>
                                        <td style={{padding: '0.5rem 0.75rem'}}><strong>Auto Boot</strong></td>
                                        <td style={{padding: '0.5rem 0.75rem'}}>
                                          <span className={`has-text-weight-semibold ${zoneDetails.configuration.autoboot === 'true' ? 'has-text-success' : 'has-text-danger'}`}>
                                            {zoneDetails.configuration.autoboot === 'true' ? 'Enabled' : 'Disabled'}
                                          </span>
                                        </td>
                                      </tr>
                                      <tr>
                                        <td style={{padding: '0.5rem 0.75rem'}}><strong>Boot ROM</strong></td>
                                        <td style={{padding: '0.5rem 0.75rem'}}><span className='has-text-grey' style={{fontFamily: 'monospace'}}>{zoneDetails.configuration.bootrom}</span></td>
                                        <td style={{padding: '0.5rem 0.75rem'}}><strong>UEFI Vars</strong></td>
                                        <td style={{padding: '0.5rem 0.75rem'}}>
                                          <span className={`has-text-weight-semibold ${zoneDetails.configuration.uefivars === 'on' ? 'has-text-success' : 'has-text-danger'}`}>
                                            {zoneDetails.configuration.uefivars === 'on' ? 'On' : 'Off'}
                                          </span>
                                        </td>
                                      </tr>
                                      <tr>
                                        <td style={{padding: '0.5rem 0.75rem'}}><strong>Host Bridge</strong></td>
                                        <td style={{padding: '0.5rem 0.75rem'}}><span className='has-text-grey' style={{fontFamily: 'monospace'}}>{zoneDetails.configuration.hostbridge}</span></td>
                                        <td style={{padding: '0.5rem 0.75rem'}}><strong>xHCI</strong></td>
                                        <td style={{padding: '0.5rem 0.75rem'}}>
                                          <span className={`has-text-weight-semibold ${zoneDetails.configuration.xhci === 'on' ? 'has-text-success' : 'has-text-danger'}`}>
                                            {zoneDetails.configuration.xhci === 'on' ? 'On' : 'Off'}
                                          </span>
                                        </td>
                                      </tr>
                                      <tr>
                                        <td style={{padding: '0.5rem 0.75rem'}}><strong>Brand</strong></td>
                                        <td style={{padding: '0.5rem 0.75rem'}}><span className='has-text-grey' style={{fontFamily: 'monospace'}}>{zoneDetails.configuration.brand}</span></td>
                                        <td style={{padding: '0.5rem 0.75rem'}}><strong>RNG</strong></td>
                                        <td style={{padding: '0.5rem 0.75rem'}}>
                                          <span className={`has-text-weight-semibold ${zoneDetails.configuration.rng === 'on' ? 'has-text-success' : 'has-text-danger'}`}>
                                            {zoneDetails.configuration.rng === 'on' ? 'On' : 'Off'}
                                          </span>
                                        </td>
                                      </tr>
                                      <tr>
                                        <td style={{padding: '0.5rem 0.75rem'}}><strong>Type</strong></td>
                                        <td style={{padding: '0.5rem 0.75rem'}}><span className='has-text-grey' style={{fontFamily: 'monospace'}}>{zoneDetails.configuration.type || 'N/A'}</span></td>
                                        <td style={{padding: '0.5rem 0.75rem'}}><strong>Cloud Init</strong></td>
                                        <td style={{padding: '0.5rem 0.75rem'}}>
                                          <span className={`has-text-weight-semibold ${zoneDetails.configuration['cloud-init'] === 'on' ? 'has-text-success' : 'has-text-danger'}`}>
                                            {zoneDetails.configuration['cloud-init'] === 'on' ? 'On' : 'Off'}
                                          </span>
                                        </td>
                                      </tr>
                                      <tr>
                                        <td style={{padding: '0.5rem 0.75rem'}}><strong>VNC Console</strong></td>
                                        <td style={{padding: '0.5rem 0.75rem'}}>
                                          <span className={`has-text-weight-semibold ${zoneDetails.active_vnc_session ? 'has-text-success' : 'has-text-danger'}`}>
                                            {zoneDetails.active_vnc_session ? 'Active' : 'Inactive'}
                                          </span>
                                        </td>
                                        <td style={{padding: '0.5rem 0.75rem'}}><strong>VNC Port</strong></td>
                                        <td style={{padding: '0.5rem 0.75rem'}}>
                                          {zoneDetails.active_vnc_session && zoneDetails.vnc_session_info?.web_port ? (
                                            <span className='has-text-grey' style={{fontFamily: 'monospace'}}>
                                              {zoneDetails.vnc_session_info.web_port}
                                            </span>
                                          ) : (zoneDetails.configuration?.vnc?.port || zoneDetails.zone_info?.vnc_port) ? (
                                            <span className='has-text-grey' style={{fontFamily: 'monospace'}}>
                                              {zoneDetails.configuration.vnc?.port || zoneDetails.zone_info?.vnc_port}
                                            </span>
                                          ) : (
                                            <span className='has-text-weight-semibold has-text-success'>
                                              Auto
                                            </span>
                                          )}
                                        </td>
                                      </tr>
                                      <tr>
                                        <td style={{padding: '0.5rem 0.75rem'}}><strong>zlogin</strong></td>
                                        <td style={{padding: '0.5rem 0.75rem'}}>
                                          <span className={`has-text-weight-semibold ${zoneDetails.zlogin_session ? 'has-text-success' : 'has-text-danger'}`}>
                                            {zoneDetails.zlogin_session ? 'Active' : 'Inactive'}
                                          </span>
                                        </td>
                                      </tr>
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            )}
                          </div>
                              
                          {/* Right Column - Console Display with Toggle */}
                          <div className='column is-6'>
                            {/* Console Display Logic */}
                            {(() => {
                              const hasVnc = zoneDetails.active_vnc_session;
                              const hasZlogin = zoneDetails.zlogin_session;
                              
                              // Show the selected console type
                              if ((activeConsoleType === 'zlogin' && hasZlogin) || (hasZlogin && !hasVnc)) {
                                return (
                                  <div 
                                    style={{
                                      border: '2px solid #dbdbdb',
                                      borderRadius: '6px',
                                      overflow: 'hidden',
                                      backgroundColor: '#000',
                                      height: 'calc(100vh - 250px - 10vh)', // Reduced by ~10% total
                                      minHeight: '450px'
                                    }}
                                  >
                                    {/* zlogin Console Header */}
                                    <div 
                                      style={{
                                        backgroundColor: '#363636',
                                        color: 'white',
                                        padding: '8px 12px',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center'
                                      }}
                                    >
                                      <div>
                                        <h6 className='title is-7 has-text-white mb-1'>Active zlogin Session</h6>
                                        {zoneDetails.zlogin_session && (
                                          <p className='is-size-7 has-text-white-ter mb-0'>
                                            Session ID: {zoneDetails.zlogin_session.id?.substring(0, 8) || 'Unknown'} | 
                                            Started: {zoneDetails.zlogin_session.created_at ? 
                                              new Date(zoneDetails.zlogin_session.created_at).toLocaleString() : 
                                              'Unknown'
                                            }
                                          </p>
                                        )}
                                      </div>
                                      <div className='buttons' style={{margin: 0}}>
                                        <ZloginActionsDropdown
                                          variant="button"
                                          onToggleReadOnly={() => {
                                            // Toggle read-only mode for preview ZoneShell (not modal)
                                            console.log(`Toggling preview read-only mode from ${previewReadOnly} to ${!previewReadOnly}`);
                                            setPreviewReadOnly(!previewReadOnly);
                                          }}
                                          onNewSession={() => handleZloginConsole(selectedZone)}
                                          onKillSession={async () => {
                                            if (!currentServer || !selectedZone) return;
                                            
                                            try {
                                              setLoading(true);
                                              console.log(`Killing zlogin session for zone: ${selectedZone}`);
                                              
                                              // Get all active zlogin sessions to find the one for this zone
                                              const sessionsResult = await makeZoneweaverAPIRequest(
                                                currentServer.hostname,
                                                currentServer.port,
                                                currentServer.protocol,
                                                'zlogin/sessions'
                                              );

                                              if (sessionsResult.success && sessionsResult.data) {
                                                const activeSessions = Array.isArray(sessionsResult.data) 
                                                  ? sessionsResult.data 
                                                  : (sessionsResult.data.sessions || []);
                                                
                                                const activeZoneSession = activeSessions.find(session => 
                                                  session.zone_name === selectedZone && session.status === 'active'
                                                );

                                                if (activeZoneSession) {
                                                  // Kill the specific session by ID
                                                  const killResult = await makeZoneweaverAPIRequest(
                                                    currentServer.hostname,
                                                    currentServer.port,
                                                    currentServer.protocol,
                                                    `zlogin/sessions/${activeZoneSession.id}/stop`,
                                                    'DELETE'
                                                  );

                                                  if (killResult.success) {
                                                    console.log(`zlogin session killed for ${selectedZone}`);
                                                    // Refresh status
                                                    await refreshZloginSessionStatus(selectedZone);
                                                  } else {
                                                    console.error(`Failed to kill zlogin session for ${selectedZone}:`, killResult.message);
                                                    setError(`Failed to kill zlogin session: ${killResult.message}`);
                                                  }
                                                } else {
                                                  console.log(`No active zlogin session found for ${selectedZone}`);
                                                }
                                              } else {
                                                console.error('Failed to get zlogin sessions:', sessionsResult.message);
                                                setError('Failed to get active sessions');
                                              }
                                            } catch (error) {
                                              console.error('Error killing zlogin session:', error);
                                              setError('Error killing zlogin session');
                                            } finally {
                                              setLoading(false);
                                            }
                                          }}
                                          onScreenshot={() => {
                                            // Capture terminal output as text
                                            const terminalElement = document.querySelector('.xterm-screen');
                                            if (terminalElement) {
                                              const text = terminalElement.textContent || terminalElement.innerText;
                                              const blob = new Blob([text], { type: 'text/plain' });
                                              const url = URL.createObjectURL(blob);
                                              const a = document.createElement('a');
                                              a.href = url;
                                              a.download = `zlogin-output-${selectedZone}-${Date.now()}.txt`;
                                              document.body.appendChild(a);
                                              a.click();
                                              document.body.removeChild(a);
                                              URL.revokeObjectURL(url);
                                            }
                                          }}
                                          isReadOnly={true}
                                          isAdmin={user?.role === 'admin' || user?.role === 'super-admin' || user?.role === 'organization-admin'}
                                          style={{boxShadow: '0 2px 8px rgba(0,0,0,0.3)'}}
                                        />
                                        <button 
                                          className='button is-small is-primary'
                                          onClick={() => {
                                            console.log(`🔍 EXPAND BUTTON: Checking session state for ${selectedZone}:`, {
                                              hasZloginSession: !!zoneDetails.zlogin_session,
                                              sessionId: zoneDetails.zlogin_session?.id,
                                              sessionStatus: zoneDetails.zlogin_session?.status
                                            });
                                            
                                            if (zoneDetails.zlogin_session) {
                                              // ✅ Session exists - just open modal (don't create new session!)
                                              console.log(`🔍 EXPAND BUTTON: Session exists, opening modal for ${selectedZone}`);
                                              setShowZloginConsole(true);
                                            } else {
                                              // ❌ No session - start new one then open modal
                                              console.log(`🔍 EXPAND BUTTON: No session exists, starting new session for ${selectedZone}`);
                                              handleZloginConsole(selectedZone);
                                            }
                                          }}
                                          disabled={loading}
                                          title="Expand zlogin Console"
                                          style={{boxShadow: '0 2px 8px rgba(0,0,0,0.3)'}}
                                        >
                                          <span className='icon is-small'>
                                            <i className='fas fa-expand'></i>
                                          </span>
                                        </button>
                                        {/* Always show VNC button - switches to VNC or starts VNC for preview */}
                                        <button 
                                          className='button is-small is-warning'
                                          onClick={async () => {
                                            if (hasVnc) {
                                              // VNC already active - just switch to it in preview
                                              setActiveConsoleType('vnc');
                                            } else {
                                              // Start VNC session for preview (not modal)
                                              console.log(`🚀 START VNC: Starting VNC session for preview from zlogin header`);
                                              try {
                                                setLoadingVnc(true);
                                                const result = await startVncSession(
                                                  currentServer.hostname,
                                                  currentServer.port,
                                                  currentServer.protocol,
                                                  selectedZone
                                                );
                                                
                                                if (result.success) {
                                                  console.log(`✅ START VNC: VNC session started, switching to VNC preview`);
                                                  setZoneDetails(prev => ({
                                                    ...prev,
                                                    active_vnc_session: true,
                                                    vnc_session_info: result.data
                                                  }));
                                                  // Console will auto-switch to VNC via useEffect
                                                } else {
                                                  console.error(`❌ START VNC: Failed to start VNC session:`, result.message);
                                                  setError(`Failed to start VNC console: ${result.message}`);
                                                }
                                              } catch (error) {
                                                console.error('💥 START VNC: Error starting VNC session:', error);
                                                setError(`Error starting VNC console`);
                                              } finally {
                                                setLoadingVnc(false);
                                              }
                                            }
                                          }}
                                          disabled={loadingVnc}
                                          title={hasVnc ? "Switch to VNC Console" : "Start VNC Console"}
                                          style={{boxShadow: '0 2px 8px rgba(0,0,0,0.3)'}}
                                        >
                                          <span className='icon is-small'>
                                            <i className={`fas ${loadingVnc ? 'fa-spinner fa-pulse' : 'fa-desktop'}`}></i>
                                          </span>
                                        </button>
                                      </div>
                                    </div>

                                    {/* zlogin Console Content */}
                                    <div 
                                      style={{
                                        position: 'relative',
                                        width: '100%',
                                        height: 'calc(100% - 60px)', // Fill remaining height after header
                                        backgroundColor: '#000',
                                        overflow: 'hidden'
                                      }}
                                    >
                                      <ZoneShell 
                                        key={`preview-zlogin-${selectedZone}-${previewReconnectKey}`}
                                        zoneName={selectedZone} 
                                        readOnly={previewReadOnly}
                                        context="preview"
                                        style={{
                                          height: '100%',
                                          width: '100%',
                                          fontSize: '10px'
                                        }}
                                      />
                                      
                                      {/* Session Status Indicator */}
                                      <div 
                                        style={{
                                          position: 'absolute',
                                          top: '8px',
                                          left: '8px',
                                          backgroundColor: 'rgba(0, 0, 0, 0.7)',
                                          color: 'white',
                                          padding: '4px 8px',
                                          borderRadius: '3px',
                                          fontSize: '0.7rem',
                                          fontWeight: 'bold'
                                        }}
                                      >
                                        <span className='icon is-small' style={{marginRight: '3px'}}>
                                          <i className='fas fa-circle' style={{
                                            color: zoneDetails.zlogin_session ? '#48c78e' : '#6c757d', 
                                            fontSize: '0.4rem'
                                          }}></i>
                                        </span>
                                        {zoneDetails.zlogin_session ? 'Live' : 'Offline'}
                                      </div>
                                    </div>
                                  </div>
                                );
                              } else if ((activeConsoleType === 'vnc' && hasVnc) || (hasVnc && !hasZlogin)) {
                                return (
                                  <div 
                                    style={{
                                      border: '2px solid #dbdbdb',
                                      borderRadius: '6px',
                                      overflow: 'hidden',
                                      backgroundColor: '#000',
                                      height: 'calc(100vh - 250px - 10vh)', // Reduced by ~10% total
                                      minHeight: '450px'
                                    }}
                                  >
                                    {/* Console Header */}
                                    <div 
                                      style={{
                                        backgroundColor: '#363636',
                                        color: 'white',
                                        padding: '8px 12px',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center'
                                      }}
                                    >
                                      <div>
                                        <h6 className='title is-7 has-text-white mb-1'>Active VNC Session</h6>
                                        {zoneDetails.vnc_session_info && zoneDetails.vnc_session_info.web_port && (
                                          <p className='is-size-7 has-text-white-ter mb-0'>
                                            Port: {zoneDetails.vnc_session_info.web_port} | 
                                            Started: {zoneDetails.vnc_session_info.created_at ? 
                                              new Date(zoneDetails.vnc_session_info.created_at).toLocaleString() : 
                                              'Unknown'
                                            }
                                          </p>
                                        )}
                                      </div>
                                      <div className='buttons' style={{margin: 0}}>
                                        <VncActionsDropdown
                                          variant="button"
                                          onToggleViewOnly={() => {
                                            // Toggle view-only mode for preview VNC (not modal)
                                            console.log(`Toggling preview VNC view-only mode from ${previewVncViewOnly} to ${!previewVncViewOnly}`);
                                            setPreviewVncViewOnly(!previewVncViewOnly);
                                          }}
                                          onScreenshot={() => {
                                            // Proper screenshot implementation
                                            const vncContainer = document.querySelector('.vnc-viewer-react canvas');
                                            if (vncContainer) {
                                              vncContainer.toBlob((blob) => {
                                                const url = URL.createObjectURL(blob);
                                                const a = document.createElement('a');
                                                a.href = url;
                                                a.download = `vnc-screenshot-${selectedZone}-${Date.now()}.png`;
                                                document.body.appendChild(a);
                                                a.click();
                                                document.body.removeChild(a);
                                                URL.revokeObjectURL(url);
                                              });
                                            }
                                          }}
                                          onNewTab={() => handleVncConsole(selectedZone, true)}
                                          onKillSession={() => handleKillVncSession(selectedZone)}
                                          isViewOnly={previewVncViewOnly}
                                          isAdmin={user?.role === 'admin' || user?.role === 'super-admin' || user?.role === 'organization-admin'}
                                          style={{boxShadow: '0 2px 8px rgba(0,0,0,0.3)'}}
                                        />
                                        <button 
                                          className='button is-small is-primary'
                                          onClick={() => handleVncConsole(selectedZone)}
                                          disabled={loading || loadingVnc}
                                          title="Expand VNC Console"
                                          style={{boxShadow: '0 2px 8px rgba(0,0,0,0.3)'}}
                                        >
                                          <span className='icon is-small'>
                                            <i className='fas fa-expand'></i>
                                          </span>
                                        </button>
                                        {/* Always show zlogin button - switches to zlogin or starts zlogin for preview */}
                                        <button 
                                          className='button is-small is-warning'
                                          onClick={async () => {
                                            if (hasZlogin) {
                                              // zlogin already active - just switch to it in preview
                                              setActiveConsoleType('zlogin');
                                            } else {
                                              // Start zlogin session for preview (not modal)
                                              console.log(`🚀 START ZLOGIN: Starting zlogin session for preview from VNC header`);
                                              try {
                                                setLoading(true);
                                                const result = await startZloginSession(
                                                  currentServer.hostname,
                                                  currentServer.port,
                                                  currentServer.protocol,
                                                  selectedZone
                                                );
                                                
                                                if (result.success) {
                                                  console.log(`✅ START ZLOGIN: zlogin session started, switching to zlogin preview`);
                                                  setZoneDetails(prev => ({
                                                    ...prev,
                                                    zlogin_session: result.session,
                                                    active_zlogin_session: true
                                                  }));
                                                  // Console will auto-switch to zlogin via useEffect
                                                } else {
                                                  console.error(`❌ START ZLOGIN: Failed to start zlogin session:`, result.message);
                                                  setError(`Failed to start zlogin console: ${result.message}`);
                                                }
                                              } catch (error) {
                                                console.error('💥 START ZLOGIN: Error starting zlogin session:', error);
                                                setError(`Error starting zlogin console`);
                                              } finally {
                                                setLoading(false);
                                              }
                                            }
                                          }}
                                          disabled={loading}
                                          title={hasZlogin ? "Switch to zlogin Console" : "Start zlogin Console"}
                                          style={{boxShadow: '0 2px 8px rgba(0,0,0,0.3)'}}
                                        >
                                          <span className='icon is-small'>
                                            <i className={`fas ${loading ? 'fa-spinner fa-pulse' : 'fa-terminal'}`}></i>
                                          </span>
                                        </button>
                                      </div>
                                    </div>

                                    {/* Console Preview - Live when active, static screenshot when inactive */}
                                    <div 
                                      style={{
                                        position: 'relative',
                                        width: '100%',
                                        height: 'calc(100% - 60px)', // Fill remaining height after header
                                        backgroundColor: '#000',
                                        overflow: 'hidden'
                                      }}
                                    >
                                      {zoneDetails.vnc_session_info ? (
                                        // Active session - show live preview with toggleable view-only mode
                                        <VncViewerReact
                                          key={`vnc-preview-${selectedZone}-${previewVncViewOnly}`}
                                          serverHostname={currentServer.hostname}
                                          serverPort={currentServer.port}
                                          serverProtocol={currentServer.protocol}
                                          zoneName={selectedZone}
                                          viewOnly={previewVncViewOnly}
                                          autoConnect={true}
                                          showControls={false}
                                          style={{ width: '100%', height: '100%' }}
                                        />
                                      ) : zoneDetails.configuration?.zonepath ? (
                                        // No active session - show static screenshot
                                        <img
                                          src={`/api/servers/${encodeURIComponent(currentServer.hostname)}:${currentServer.port}/zones/${encodeURIComponent(selectedZone)}/screenshot`}
                                          alt={`Screenshot of ${selectedZone}`}
                                          style={{
                                            width: '100%',
                                            height: '100%',
                                            objectFit: 'contain',
                                            backgroundColor: '#2c3e50'
                                          }}
                                          onError={(e) => {
                                            // Fallback to generic placeholder on error
                                            e.target.style.display = 'none';
                                            e.target.nextElementSibling.style.display = 'flex';
                                          }}
                                          onLoad={(e) => {
                                            // Hide placeholder when image loads successfully
                                            if (e.target.nextElementSibling) {
                                              e.target.nextElementSibling.style.display = 'none';
                                            }
                                          }}
                                        />
                                      ) : null}
                                      
                                      {/* Fallback placeholder */}
                                      {!(zoneDetails.vnc_session_info?.proxy_url || zoneDetails.vnc_session_info?.console_url) && (
                                        <div 
                                          style={{
                                            position: 'absolute',
                                            top: 0,
                                            left: 0,
                                            width: '100%',
                                            height: '100%',
                                            display: zoneDetails.configuration?.zonepath ? 'none' : 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            backgroundColor: '#2c3e50',
                                            color: '#ecf0f1'
                                          }}
                                        >
                                          <div style={{ textAlign: 'center' }}>
                                            <div style={{ marginBottom: '12px' }}>
                                              <img 
                                                src="/images/startcloud.svg" 
                                                alt="Start Console" 
                                                style={{ 
                                                  width: '64px', 
                                                  height: '64px',
                                                  opacity: 0.8,
                                                  filter: 'brightness(0.9)'
                                                }} 
                                              />
                                            </div>
                                            <div style={{ fontSize: '0.9rem', fontWeight: '500' }}>
                                              No Console Session
                                            </div>
                                            <div style={{ fontSize: '0.75rem', marginTop: '6px', opacity: 0.7 }}>
                                              Click Console to start session
                                            </div>
                                          </div>
                                        </div>
                                      )}

                                    </div>
                                  </div>
                                );
                              } else {
                                return (
                                  <div 
                                    style={{
                                      border: '2px solid #dbdbdb',
                                      borderRadius: '6px',
                                      overflow: 'hidden',
                                      backgroundColor: '#000',
                                      height: 'calc(100vh - 250px - 10vh)', // Reduced by ~10% total
                                      minHeight: '450px'
                                    }}
                                  >
                                    {/* Inactive Console Header - Same style as active headers */}
                                    <div 
                                      style={{
                                        backgroundColor: '#363636',
                                        color: 'white',
                                        padding: '8px 12px',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center'
                                      }}
                                    >
                                      <div>
                                        <h6 className='title is-7 has-text-white mb-1'>Console Management</h6>
                                        <p className='is-size-7 has-text-white-ter mb-0'>
                                          No active sessions • Click to start
                                        </p>
                                      </div>
                                      <div className='buttons' style={{margin: 0}}>
                                        {/* Start VNC Button - Preview only */}
                                        <button 
                                          className='button is-small is-warning'
                                          onClick={async () => {
                                            console.log(`🚀 START VNC: Starting VNC session for preview in ${selectedZone}`);
                                            try {
                                              setLoadingVnc(true);
                                              const result = await startVncSession(
                                                currentServer.hostname,
                                                currentServer.port,
                                                currentServer.protocol,
                                                selectedZone
                                              );
                                              
                                              if (result.success) {
                                                console.log(`✅ START VNC: VNC session started, switching to VNC preview for ${selectedZone}`);
                                                // Update state to show VNC session active
                                                setZoneDetails(prev => ({
                                                  ...prev,
                                                  active_vnc_session: true,
                                                  vnc_session_info: result.data
                                                }));
                                                // Force console type switch to VNC
                                                setActiveConsoleType('vnc');
                                              } else {
                                                console.error(`❌ START VNC: Failed to start VNC session:`, result.message);
                                                setError(`Failed to start VNC console: ${result.message}`);
                                              }
                                            } catch (error) {
                                              console.error('💥 START VNC: Error starting VNC session:', error);
                                              setError(`Error starting VNC console`);
                                            } finally {
                                              setLoadingVnc(false);
                                            }
                                          }}
                                          disabled={loading || loadingVnc}
                                          title="Start VNC Console"
                                          style={{boxShadow: '0 2px 8px rgba(0,0,0,0.3)'}}
                                        >
                                          <span className='icon is-small'>
                                            <i className='fas fa-desktop'></i>
                                          </span>
                                          <span>{loadingVnc ? 'Starting...' : 'Start VNC'}</span>
                                        </button>
                                        {/* Start zlogin Button - Preview only */}
                                        <button 
                                          className='button is-small is-warning'
                                          onClick={async () => {
                                            console.log(`🚀 START ZLOGIN: Starting zlogin session for preview in ${selectedZone}`);
                                            try {
                                              setLoading(true);
                                              const result = await startZloginSession(
                                                currentServer.hostname,
                                                currentServer.port,
                                                currentServer.protocol,
                                                selectedZone
                                              );
                                              
                                              if (result.success) {
                                                console.log(`✅ START ZLOGIN: zlogin session started, switching to zlogin preview for ${selectedZone}`, result);
                                                // Update state to show zlogin session active
                                                setZoneDetails(prev => ({
                                                  ...prev,
                                                  zlogin_session: result.session,
                                                  active_zlogin_session: true
                                                }));
                                                // Force console type switch to zlogin
                                                setActiveConsoleType('zlogin');
                                              } else {
                                                console.error(`❌ START ZLOGIN: Failed to start zlogin session:`, result.message);
                                                setError(`Failed to start zlogin console: ${result.message}`);
                                              }
                                            } catch (error) {
                                              console.error('💥 START ZLOGIN: Error starting zlogin session:', error);
                                              setError(`Error starting zlogin console`);
                                            } finally {
                                              setLoading(false);
                                            }
                                          }}
                                          disabled={loading}
                                          title="Start zlogin Console"
                                          style={{boxShadow: '0 2px 8px rgba(0,0,0,0.3)'}}
                                        >
                                          <span className='icon is-small'>
                                            <i className='fas fa-terminal'></i>
                                          </span>
                                          <span>{loading ? 'Starting...' : 'Start zlogin'}</span>
                                        </button>
                                      </div>
                                    </div>

                                    {/* Console Content - Inactive State */}
                                    <div 
                                      style={{
                                        position: 'relative',
                                        width: '100%',
                                        height: 'calc(100% - 60px)', // Fill remaining height after header
                                        backgroundColor: '#2c3e50',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        overflow: 'hidden'
                                      }}
                                    >
                                      <div style={{ textAlign: 'center', color: '#ecf0f1' }}>
                                        <div style={{ marginBottom: '12px' }}>
                                          <img 
                                            src="/images/startcloud.svg" 
                                            alt="Start Console" 
                                            style={{ 
                                              width: '64px', 
                                              height: '64px',
                                              opacity: 0.8,
                                              filter: 'brightness(0.9)'
                                            }} 
                                          />
                                        </div>
                                        <div style={{ fontSize: '0.9rem', fontWeight: '500', marginBottom: '8px' }}>
                                          <strong>No Active Console Session</strong>
                                        </div>
                                        <div style={{ fontSize: '0.75rem', opacity: 0.8 }}>
                                          Click the buttons above to start VNC or zlogin console
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                );
                              }
                            })()}
                          </div>
                        </div>



                        {/* Configuration Display */}
                        {zoneDetails.configuration && Object.keys(zoneDetails.configuration).length > 0 ? (
                          <div>


                            {/* Storage */}
                            <div className='box mb-0 pt-0 pd-0'>
                              <h4 className='title is-6 mb-3'>
                                <span className='icon-text'>
                                  <span className='icon'><i className='fas fa-hdd'></i></span>
                                  <span>Storage Configuration</span>
                                </span>
                              </h4>
                              
                              {/* Disk Interface Only */}
                              <div className='mb-3'>
                                <div className='table-container'>
                                  <table className='table is-fullwidth is-striped' style={{fontSize: '0.875rem'}}>
                                    <tbody>
                                      <tr>
                                        <td style={{padding: '0.5rem 0.75rem'}}><strong>Disk Interface Driver</strong></td>
                                        <td style={{padding: '0.5rem 0.75rem'}}><span className='has-text-grey' style={{fontFamily: 'monospace'}}>{zoneDetails.configuration.diskif || 'N/A'}</span></td>
                                      </tr>
                                    </tbody>
                                  </table>
                                </div>
                              </div>

                              {/* Boot Disk */}
                              {zoneDetails.configuration.bootdisk && (
                                <div className='mb-3'>
                                  <h5 className='subtitle is-6 mb-2'>Boot Disk</h5>
                                  <div className='table-container'>
                                    <table className='table is-fullwidth is-striped' style={{fontSize: '0.875rem'}}>
                                      <thead>
                                        <tr>
                                          <th style={{padding: '0.5rem 0.75rem'}}>NAME</th>
                                          <th style={{padding: '0.5rem 0.75rem'}}>BLOCKSIZE</th>
                                          <th style={{padding: '0.5rem 0.75rem'}}>SPARSE</th>
                                          <th style={{padding: '0.5rem 0.75rem'}}>SIZE</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        <tr>
                                          <td style={{padding: '0.5rem 0.75rem'}}><span className='has-text-grey' style={{fontFamily: 'monospace', fontSize: '0.85rem'}}>{zoneDetails.configuration.bootdisk.path}</span></td>
                                          <td style={{padding: '0.5rem 0.75rem'}}><span className='has-text-grey' style={{fontFamily: 'monospace'}}>{zoneDetails.configuration.bootdisk.blocksize}</span></td>
                                          <td style={{padding: '0.5rem 0.75rem'}}><span className='has-text-grey' style={{fontFamily: 'monospace'}}>{zoneDetails.configuration.bootdisk.sparse}</span></td>
                                          <td style={{padding: '0.5rem 0.75rem'}}><span className='has-text-grey' style={{fontFamily: 'monospace'}}>{zoneDetails.configuration.bootdisk.size}</span></td>
                                        </tr>
                                      </tbody>
                                    </table>
                                  </div>
                                </div>
                              )}

                              {/* Data Disks */}
                              {zoneDetails.configuration.disk && zoneDetails.configuration.disk.length > 0 && (
                                <div>
                                  <h5 className='subtitle is-6 mb-2'>Data Disks</h5>
                                  <div className='table-container'>
                                    <table className='table is-fullwidth is-striped' style={{fontSize: '0.875rem'}}>
                                      <thead>
                                        <tr>
                                          <th style={{padding: '0.5rem 0.75rem'}}>NAME</th>
                                          <th style={{padding: '0.5rem 0.75rem'}}>BLOCKSIZE</th>
                                          <th style={{padding: '0.5rem 0.75rem'}}>SPARSE</th>
                                          <th style={{padding: '0.5rem 0.75rem'}}>SIZE</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {(zoneDetails.configuration.disk || []).filter(disk => disk !== null && disk !== undefined).map((disk, index) => (
                                          <tr key={index}>
                                            <td style={{padding: '0.5rem 0.75rem'}}><span className='has-text-grey' style={{fontFamily: 'monospace', fontSize: '0.85rem'}}>{disk?.path || 'N/A'}</span></td>
                                            <td style={{padding: '0.5rem 0.75rem'}}><span className='has-text-grey' style={{fontFamily: 'monospace'}}>{disk?.blocksize || 'N/A'}</span></td>
                                            <td style={{padding: '0.5rem 0.75rem'}}><span className='has-text-grey' style={{fontFamily: 'monospace'}}>{disk?.sparse || 'N/A'}</span></td>
                                            <td style={{padding: '0.5rem 0.75rem'}}><span className='has-text-grey' style={{fontFamily: 'monospace'}}>{disk?.size || 'N/A'}</span></td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Network Configuration */}
                            {zoneDetails.configuration.net && zoneDetails.configuration.net.length > 0 && (
                              <div className='box mb-0 pt-0 pd-0'>
                                <h4 className='title is-6 mb-3'>
                                  <span className='icon-text'>
                                    <span className='icon'><i className='fas fa-network-wired'></i></span>
                                    <span>Network Configuration</span>
                                  </span>
                                </h4>
                                
                                {/* Network Interface and IP Type */}
                                <div className='mb-3'>
                                  <div className='table-container'>
                                    <table className='table is-fullwidth is-striped' style={{fontSize: '0.875rem'}}>
                                      <tbody>
                                        <tr>
                                          <td style={{padding: '0.5rem 0.75rem'}}><strong>Network Interface Driver</strong></td>
                                          <td style={{padding: '0.5rem 0.75rem'}}><span className='has-text-grey' style={{fontFamily: 'monospace'}}>{zoneDetails.configuration.netif || 'N/A'}</span></td>
                                        </tr>
                                        <tr>
                                          <td style={{padding: '0.5rem 0.75rem'}}><strong>IP Type</strong></td>
                                          <td style={{padding: '0.5rem 0.75rem'}}><span className='has-text-grey' style={{fontFamily: 'monospace'}}>{zoneDetails.configuration['ip-type'] || 'N/A'}</span></td>
                                        </tr>
                                      </tbody>
                                    </table>
                                  </div>
                                </div>
                                
                                {/* Virtual NICs (dladm show-vnic format) */}
                                <div className='mb-3'>
                                  <h5 className='subtitle is-6 mb-2'>Virtual NICs</h5>
                                  <div className='table-container'>
                                    <table className='table is-fullwidth is-striped' style={{fontSize: '0.875rem'}}>
                                      <thead>
                                        <tr>
                                          <th style={{padding: '0.5rem 0.75rem'}}>LINK</th>
                                          <th style={{padding: '0.5rem 0.75rem'}}>OVER</th>
                                          <th style={{padding: '0.5rem 0.75rem'}}>MACADDRESS</th>
                                          <th style={{padding: '0.5rem 0.75rem'}}>VID</th>
                                          <th style={{padding: '0.5rem 0.75rem'}}>MACADDRTYPE</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {(zoneDetails.configuration.net || []).filter(netInterface => netInterface !== null && netInterface !== undefined).map((netInterface, index) => (
                                          <tr key={index}>
                                            <td style={{padding: '0.5rem 0.75rem'}}><span className='has-text-grey' style={{fontFamily: 'monospace'}}>{netInterface?.['global-nic'] || 'N/A'}</span></td>
                                            <td style={{padding: '0.5rem 0.75rem'}}><span className='has-text-grey' style={{fontFamily: 'monospace'}}>{netInterface?.physical || 'N/A'}</span></td>
                                            <td style={{padding: '0.5rem 0.75rem'}}><span className='has-text-grey' style={{fontFamily: 'monospace'}}>{netInterface?.['mac-addr'] || 'N/A'}</span></td>
                                            <td style={{padding: '0.5rem 0.75rem'}}><span className='has-text-grey' style={{fontFamily: 'monospace'}}>{netInterface?.['vlan-id'] || '0'}</span></td>
                                            <td style={{padding: '0.5rem 0.75rem'}}><span className='has-text-grey' style={{fontFamily: 'monospace'}}>{netInterface?.['mac-addr-type'] || 'fixed'}</span></td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                </div>
                              </div>
                            )}


                          </div>
                        ) : (
                          <div className='box mb-4'>
                            <h4 className='title is-6'>Configuration</h4>
                            <div className='notification is-info'>
                              <p><strong>No Configuration Data Available</strong></p>
                              <p>Zone configuration details are not available for this zone. This could be because:</p>
                              <ul>
                                <li>The zone configuration hasn't been loaded yet</li>
                                <li>The Zoneweaver API doesn't have configuration data for this zone</li>
                                <li>The zone might be in a transitional state</li>
                              </ul>
                            </div>
                          </div>
                        )}

                        {/* Raw Data (for debugging) */}
                        <details>
                          <summary className='title is-6' style={{cursor: 'pointer'}}>Raw Data (Debug)</summary>
                          <div className='box'>
                            <pre style={{fontSize: '0.8rem', overflow: 'auto'}}>{JSON.stringify(zoneDetails, null, 2)}</pre>
                          </div>
                        </details>
                      </div>
                    ) : (
                      <div className='notification is-info'>
                        <p>Zone details will appear here when available.</p>
                        <p className='is-size-7 has-text-grey'>
                          Note: Zone detail fetching depends on Zoneweaver API Server API support.
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className='box'>
                    <div className='has-text-centered has-text-grey p-6'>
                      <div className='icon is-large mb-3'>
                        <i className='fas fa-server fa-3x'></i>
                      </div>
                      <h3 className='title is-4 has-text-grey'>Select a Zone</h3>
                      <p>Choose a zone from the list to view details and manage it.</p>
                    </div>
                  </div>
                )}
            </div>
          </div>
        </div>
      </div>

      {/* zlogin Console Modal */}
      {showZloginConsole && (
        <div className='modal is-active' style={{zIndex: 9999}}>
          <div className='modal-background' onClick={() => setShowZloginConsole(false)}></div>
          <div 
            style={{
              width: isZloginFullScreen ? '99vw' : '90vw', 
              height: isZloginFullScreen ? '100vh' : '86vh',
              position: isZloginFullScreen ? 'fixed' : 'relative',
              top: isZloginFullScreen ? '0' : 'auto',
              left: isZloginFullScreen ? '0' : 'auto',
              margin: isZloginFullScreen ? '0' : 'auto',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              backgroundColor: 'white',
              borderRadius: '0',
              boxShadow: isZloginFullScreen ? 'none' : '0 8px 16px rgba(10, 10, 10, 0.1)'
            }}
          >
            <header 
              className='modal-card-head' 
              style={{
                padding: isZloginFullScreen ? '0.25rem 0.5rem' : '0.75rem 1rem',
                minHeight: 'auto',
                flexShrink: 0,
                '--bulma-modal-card-head-radius': '0',
                borderRadius: '0'
              }}
            >
              <p 
                className='modal-card-title' 
                style={{
                  fontSize: isZloginFullScreen ? '0.9rem' : '1.1rem',
                  margin: 0,
                  lineHeight: '1.2'
                }}
              >
                <span className='icon-text'>
                  <span className='icon is-small'>
                    <i className='fas fa-terminal'></i>
                  </span>
                  <span>zlogin Console - {selectedZone}</span>
                </span>
              </p>
              <div className='buttons' style={{margin: 0}}>
                {/* zlogin Actions Dropdown - Modal (leftmost for consistency) */}
                <ZloginActionsDropdown
                  variant="button"
                  onToggleReadOnly={() => {
                    // Toggle read-only mode for ZoneShell in modal
                    console.log('Toggle zlogin read-only mode in modal');
                  }}
                  onNewSession={() => {
                    setShowZloginConsole(false);
                    setTimeout(() => handleZloginConsole(selectedZone), 100);
                  }}
                  onKillSession={async () => {
                    if (!currentServer || !selectedZone) return;
                    
                    try {
                      setLoading(true);
                      console.log(`Killing zlogin session for zone: ${selectedZone}`);
                      
                      // Get all active zlogin sessions to find the one for this zone
                      const sessionsResult = await makeZoneweaverAPIRequest(
                        currentServer.hostname,
                        currentServer.port,
                        currentServer.protocol,
                        'zlogin/sessions'
                      );

                      if (sessionsResult.success && sessionsResult.data) {
                        const activeSessions = Array.isArray(sessionsResult.data) 
                          ? sessionsResult.data 
                          : (sessionsResult.data.sessions || []);
                        
                        const activeZoneSession = activeSessions.find(session => 
                          session.zone_name === selectedZone && session.status === 'active'
                        );

                        if (activeZoneSession) {
                          // Kill the specific session by ID
                          const killResult = await makeZoneweaverAPIRequest(
                            currentServer.hostname,
                            currentServer.port,
                            currentServer.protocol,
                            `zlogin/sessions/${activeZoneSession.id}/stop`,
                            'DELETE'
                          );

                          if (killResult.success) {
                            console.log(`zlogin session killed for ${selectedZone}`);
                            // Refresh status
                            await refreshZloginSessionStatus(selectedZone);
                          } else {
                            console.error(`Failed to kill zlogin session for ${selectedZone}:`, killResult.message);
                            setError(`Failed to kill zlogin session: ${killResult.message}`);
                          }
                        } else {
                          console.log(`No active zlogin session found for ${selectedZone}`);
                        }
                      } else {
                        console.error('Failed to get zlogin sessions:', sessionsResult.message);
                        setError('Failed to get active sessions');
                      }
                    } catch (error) {
                      console.error('Error killing zlogin session:', error);
                      setError('Error killing zlogin session');
                    } finally {
                      setLoading(false);
                    }
                  }}
                  onScreenshot={() => {
                    // Capture terminal output as text in modal
                    const terminalElement = document.querySelector('.xterm-screen');
                    if (terminalElement) {
                      const text = terminalElement.textContent || terminalElement.innerText;
                      const blob = new Blob([text], { type: 'text/plain' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `zlogin-output-${selectedZone}-${Date.now()}.txt`;
                      document.body.appendChild(a);
                      a.click();
                      document.body.removeChild(a);
                      URL.revokeObjectURL(url);
                    }
                  }}
                  isReadOnly={false}
                  isAdmin={user?.role === 'admin' || user?.role === 'super-admin' || user?.role === 'organization-admin'}
                  style={{boxShadow: '0 2px 8px rgba(0,0,0,0.3)'}}
                />
                {/* Switch to VNC Console Button - Modal (second position for consistency) */}
                {zoneDetails.active_vnc_session && (
                  <button 
                    className='button is-small is-warning'
                    onClick={() => {
                      setShowZloginConsole(false);
                      setTimeout(() => handleVncConsole(selectedZone), 100);
                    }}
                    title="Switch to VNC Console"
                    style={{boxShadow: '0 2px 8px rgba(0,0,0,0.3)'}}
                  >
                    <span className='icon is-small'>
                      <i className='fas fa-desktop'></i>
                    </span>
                    <span>VNC</span>
                  </button>
                )}
                <button 
                  className='button is-small is-info'
                  onClick={openZloginFullScreen}
                  title={isZloginFullScreen ? "Exit Full Screen" : "Enter Full Screen"}
                >
                  <span className='icon'>
                    <i className={`fas ${isZloginFullScreen ? 'fa-compress' : 'fa-expand'}`}></i>
                  </span>
                  <span>{isZloginFullScreen ? 'Exit' : 'Full'}</span>
                </button>
                <button 
                  className='button is-small'
                  onClick={() => {
                    // 🟡 MODAL LIFECYCLE TRACKING
                    console.log(`🟡 MODAL LIFECYCLE:`, {
                      action: 'close',
                      modalType: 'zlogin',
                      zoneName: selectedZone,
                      sessionStateBefore: zoneDetails.zlogin_session?.id || null,
                      activeZloginSession: zoneDetails.active_zlogin_session,
                      trigger: 'exit-button-click',
                      timestamp: new Date().toISOString()
                    });
                    setShowZloginConsole(false);
                  }}
                  title="Close Console"
                >
                  <span className='icon'>
                    <i className='fas fa-times'></i>
                  </span>
                  <span>Exit</span>
                </button>
              </div>
            </header>
            <section 
              className='modal-card-body p-0' 
              style={{
                flex: 1,
                display: 'flex',
                overflow: 'hidden'
              }}
            >
              <ZoneShell 
                key={`zlogin-modal-${selectedZone}`} 
                zoneName={selectedZone} 
                readOnly={false} 
                context="modal" 
              />
            </section>
          </div>
        </div>
      )}

      {/* VNC Console Modal */}
      {showVncConsole && (
        <div className='modal is-active' style={{zIndex: 9999}}>
          <div className='modal-background' onClick={closeVncConsole}></div>
          <div 
            style={{
              width: isVncFullScreen ? '99vw' : '90vw', 
              height: isVncFullScreen ? '100vh' : '86vh',
              position: isVncFullScreen ? 'fixed' : 'relative',
              top: isVncFullScreen ? '0' : 'auto',
              left: isVncFullScreen ? '0' : 'auto',
              margin: isVncFullScreen ? '0' : 'auto',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              backgroundColor: 'white',
              borderRadius: '0',
              boxShadow: isVncFullScreen ? 'none' : '0 8px 16px rgba(10, 10, 10, 0.1)'
            }}
          >
            {/* Header - minimal in full screen, normal otherwise */}
            <header 
              className='modal-card-head' 
              style={{
                padding: isVncFullScreen ? '0.25rem 0.5rem' : '0.75rem 1rem',
                minHeight: 'auto',
                flexShrink: 0,
                '--bulma-modal-card-head-radius': '0',
                borderRadius: '0'
              }}
            >
              <p 
                className='modal-card-title' 
                style={{
                  fontSize: isVncFullScreen ? '0.9rem' : '1.1rem',
                  margin: 0,
                  lineHeight: '1.2'
                }}
              >
                <span className='icon-text'>
                  <span className='icon is-small'>
                    <i className='fas fa-terminal'></i>
                  </span>
                  <span>Console - {selectedZone}</span>
                </span>
              </p>
              <div className='buttons' style={{margin: 0}}>
                <VncActionsDropdown
                  variant="button"
                  onScreenshot={() => {
                    // Proper screenshot implementation for modal
                    const vncContainer = document.querySelector('.vnc-viewer-react canvas');
                    if (vncContainer) {
                      vncContainer.toBlob((blob) => {
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `vnc-screenshot-${selectedZone}-${Date.now()}.png`;
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                        URL.revokeObjectURL(url);
                      });
                    }
                  }}
                  onNewTab={() => handleVncConsole(selectedZone, true)}
                  onKillSession={() => handleKillVncSession(selectedZone)}
                  style={{boxShadow: '0 2px 8px rgba(0,0,0,0.3)'}}
                />
                {/* Switch to zlogin Console Button - Modal */}
                {zoneDetails.zlogin_session && (
                  <button 
                    className='button is-small is-warning'
                    onClick={() => {
                      closeVncConsole();
                      setTimeout(() => setShowZloginConsole(true), 100);
                    }}
                    title="Switch to zlogin Console"
                    style={{boxShadow: '0 2px 8px rgba(0,0,0,0.3)'}}
                  >
                    <span className='icon is-small'>
                      <i className='fas fa-terminal'></i>
                    </span>
                    <span>zlogin</span>
                  </button>
                )}
                <button 
                  className='button is-small is-info'
                  onClick={openVncFullScreen}
                  title={isVncFullScreen ? "Exit Full Screen" : "Enter Full Screen"}
                >
                  <span className='icon'>
                    <i className={`fas ${isVncFullScreen ? 'fa-compress' : 'fa-expand'}`}></i>
                  </span>
                  <span>{isVncFullScreen ? 'Exit' : 'Full'}</span>
                </button>
                <button 
                  className='button is-small'
                  onClick={closeVncConsole}
                  title="Close Console"
                >
                  <span className='icon'>
                    <i className='fas fa-times'></i>
                  </span>
                  <span>Exit</span>
                </button>
              </div>
            </header>
            <section 
              className='modal-card-body p-0' 
              style={{
                flex: 1,
                display: 'flex',
                overflow: 'hidden'
              }}
            >
              {vncLoadError ? (
                <div className='has-text-centered p-6' style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <div className='icon is-large mb-3'>
                    <i className='fas fa-exclamation-triangle fa-3x has-text-warning'></i>
                  </div>
                  <h4 className='title is-4'>VNC Console Loading Error</h4>
                  <p className='mb-4'>The VNC console failed to load in embedded mode. This could be due to proxy issues or browser compatibility.</p>
                  <div className='buttons is-centered'>
                    <button className='button is-warning' onClick={openDirectVncFallback}>
                      <span className='icon'>
                        <i className='fas fa-external-link-alt'></i>
                      </span>
                      <span>Open Direct VNC Console</span>
                    </button>
                    <button className='button' onClick={() => setVncLoadError(false)}>
                      <span className='icon'>
                        <i className='fas fa-redo'></i>
                      </span>
                      <span>Retry Embedded</span>
                    </button>
                  </div>
                </div>
              ) : currentServer && selectedZone ? (
                <VncViewerReact
                  serverHostname={currentServer.hostname}
                  serverPort={currentServer.port}
                  serverProtocol={currentServer.protocol}
                  zoneName={selectedZone}
                  viewOnly={false}
                  autoConnect={true}
                  showControls={false}
                  onConnect={() => console.log('✅ VNC MODAL: Connected to VNC server')}
                  onDisconnect={(reason) => console.log('❌ VNC MODAL: Disconnected:', reason)}
                  style={{
                    width: '100%',
                    height: '100%',
                    flex: '1 1 auto',
                    minHeight: 0
                  }}
                />
              ) : loadingVnc ? (
                <div className='has-text-centered p-6' style={{ 
                  flex: 1, 
                  display: 'flex', 
                  flexDirection: 'column', 
                  justifyContent: 'center',
                  backgroundColor: '#2c3e50',
                  color: '#ecf0f1'
                }}>
                  <div className='icon is-large'>
                    <i className='fas fa-spinner fa-pulse fa-3x' style={{ color: '#95a5a6' }}></i>
                  </div>
                  <p className='mt-3'>Starting VNC console...</p>
                </div>
              ) : null}
            </section>
          </div>
        </div>
      )}
    </div>
  );
};

export default Zones;
