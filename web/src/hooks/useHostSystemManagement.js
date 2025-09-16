import { useServers } from "../contexts/ServerContext";

/**
 * Custom hook for host system management operations
 * Provides access to advanced system control, status monitoring, and orchestration functions
 * @returns {object} An object containing all host system management functions
 */
export const useHostSystemManagement = () => {
  const { makeZoneweaverAPIRequest } = useServers();

  // ========================================
  // SYSTEM STATUS FUNCTIONS (Direct Response)
  // ========================================

  /**
   * Get comprehensive host system status
   * @param {string} hostname - Server hostname
   * @param {number} port - Server port
   * @param {string} protocol - Server protocol
   * @returns {Promise<Object>} System status with uptime, memory, runlevel, reboot info
   */
  const getHostSystemStatus = async (hostname, port, protocol) =>
    await makeZoneweaverAPIRequest(hostname, port, protocol, "system/host/status");

  /**
   * Get host uptime information
   * @param {string} hostname - Server hostname
   * @param {number} port - Server port
   * @param {string} protocol - Server protocol
   * @returns {Promise<Object>} Uptime and load average information
   */
  const getHostUptime = async (hostname, port, protocol) =>
    await makeZoneweaverAPIRequest(hostname, port, protocol, "system/host/uptime");

  /**
   * Get current host reboot status
   * @param {string} hostname - Server hostname
   * @param {number} port - Server port
   * @param {string} protocol - Server protocol
   * @returns {Promise<Object>} Reboot requirement status and reasons
   */
  const getHostRebootStatus = async (hostname, port, protocol) =>
    await makeZoneweaverAPIRequest(hostname, port, protocol, "system/host/reboot-status");

  /**
   * Clear reboot required flags
   * @param {string} hostname - Server hostname
   * @param {number} port - Server port
   * @param {string} protocol - Server protocol
   * @param {string} [reason] - Optional reason for clearing flags
   * @returns {Promise<Object>} Clear operation result
   */
  const clearHostRebootStatus = async (hostname, port, protocol, reason = null) => {
    const data = reason ? { reason } : {};
    return await makeZoneweaverAPIRequest(hostname, port, protocol, "system/host/reboot-status", "DELETE", data);
  };

  /**
   * Get current runlevel information
   * @param {string} hostname - Server hostname
   * @param {number} port - Server port
   * @param {string} protocol - Server protocol
   * @returns {Promise<Object>} Current runlevel and available runlevels
   */
  const getHostRunlevel = async (hostname, port, protocol) =>
    await makeZoneweaverAPIRequest(hostname, port, protocol, "system/host/runlevel");

  // ========================================
  // ADVANCED POWER MANAGEMENT FUNCTIONS (Task Queue - HTTP 202)
  // ========================================

  /**
   * Perform fast reboot (x86 systems only)
   * @param {string} hostname - Server hostname
   * @param {number} port - Server port
   * @param {string} protocol - Server protocol
   * @param {Object} [options] - Fast reboot options
   * @param {string} [options.bootEnvironment] - Boot environment to use
   * @returns {Promise<Object>} Task creation result
   */
  const hostFastReboot = async (hostname, port, protocol, options = {}) =>
    await makeZoneweaverAPIRequest(hostname, port, protocol, "system/host/reboot/fast", "POST", {
      confirm: true,
      boot_environment: options.bootEnvironment,
      ...options
    });

  /**
   * Power off the host system completely
   * @param {string} hostname - Server hostname
   * @param {number} port - Server port
   * @param {string} protocol - Server protocol
   * @param {Object} [options] - Power off options
   * @param {number} [options.gracePeriod] - Grace period in seconds (0-7200, default 60)
   * @param {string} [options.message] - Optional message for the shutdown
   * @returns {Promise<Object>} Task creation result
   */
  const hostPoweroff = async (hostname, port, protocol, options = {}) =>
    await makeZoneweaverAPIRequest(hostname, port, protocol, "system/host/poweroff", "POST", {
      confirm: true,
      grace_period: options.gracePeriod || 60,
      message: options.message || "System poweroff via Zoneweaver UI",
      ...options
    });

  /**
   * Emergency halt the host system (immediate)
   * @param {string} hostname - Server hostname
   * @param {number} port - Server port
   * @param {string} protocol - Server protocol
   * @returns {Promise<Object>} Task creation result
   */
  const hostHalt = async (hostname, port, protocol) =>
    await makeZoneweaverAPIRequest(hostname, port, protocol, "system/host/halt", "POST", {
      confirm: true,
      emergency: true
    });

  // ========================================
  // RUNLEVEL MANAGEMENT FUNCTIONS
  // ========================================

  /**
   * Change system runlevel
   * @param {string} hostname - Server hostname
   * @param {number} port - Server port
   * @param {string} protocol - Server protocol
   * @param {string} runlevel - Target runlevel (0-6, s, S)
   * @returns {Promise<Object>} Task creation result
   */
  const changeHostRunlevel = async (hostname, port, protocol, runlevel) =>
    await makeZoneweaverAPIRequest(hostname, port, protocol, "system/host/runlevel", "POST", {
      confirm: true,
      runlevel
    });

  /**
   * Switch to single-user mode
   * @param {string} hostname - Server hostname
   * @param {number} port - Server port
   * @param {string} protocol - Server protocol
   * @returns {Promise<Object>} Task creation result
   */
  const setHostSingleUser = async (hostname, port, protocol) =>
    await makeZoneweaverAPIRequest(hostname, port, protocol, "system/host/single-user", "POST", {
      confirm: true
    });

  /**
   * Switch to multi-user mode
   * @param {string} hostname - Server hostname
   * @param {number} port - Server port
   * @param {string} protocol - Server protocol
   * @param {boolean} [networkServices] - Enable network services (runlevel 3 vs 2)
   * @returns {Promise<Object>} Task creation result
   */
  const setHostMultiUser = async (hostname, port, protocol, networkServices = true) =>
    await makeZoneweaverAPIRequest(hostname, port, protocol, "system/host/multi-user", "POST", {
      network_services: networkServices
    });

  // ========================================
  // ZONE ORCHESTRATION FUNCTIONS
  // ========================================

  /**
   * Get zone orchestration status
   * @param {string} hostname - Server hostname
   * @param {number} port - Server port
   * @param {string} protocol - Server protocol
   * @returns {Promise<Object>} Orchestration status and controller info
   */
  const getZoneOrchestrationStatus = async (hostname, port, protocol) =>
    await makeZoneweaverAPIRequest(hostname, port, protocol, "zones/orchestration/status");

  /**
   * Enable zone orchestration
   * @param {string} hostname - Server hostname
   * @param {number} port - Server port
   * @param {string} protocol - Server protocol
   * @returns {Promise<Object>} Enable operation result
   */
  const enableZoneOrchestration = async (hostname, port, protocol) =>
    await makeZoneweaverAPIRequest(hostname, port, protocol, "zones/orchestration/enable", "POST", {
      confirm: true
    });

  /**
   * Disable zone orchestration
   * @param {string} hostname - Server hostname
   * @param {number} port - Server port
   * @param {string} protocol - Server protocol
   * @returns {Promise<Object>} Disable operation result
   */
  const disableZoneOrchestration = async (hostname, port, protocol) =>
    await makeZoneweaverAPIRequest(hostname, port, protocol, "zones/orchestration/disable", "POST");

  /**
   * Get zone priorities for orchestration
   * @param {string} hostname - Server hostname
   * @param {number} port - Server port
   * @param {string} protocol - Server protocol
   * @returns {Promise<Object>} Zone priorities and groupings
   */
  const getZonePriorities = async (hostname, port, protocol) =>
    await makeZoneweaverAPIRequest(hostname, port, protocol, "zones/priorities");

  /**
   * Test zone orchestration with specified strategy
   * @param {string} hostname - Server hostname
   * @param {number} port - Server port
   * @param {string} protocol - Server protocol
   * @param {string} [strategy] - Orchestration strategy to test
   * @returns {Promise<Object>} Test execution plan and duration estimate
   */
  const testZoneOrchestration = async (hostname, port, protocol, strategy = "parallel_by_priority") =>
    await makeZoneweaverAPIRequest(hostname, port, protocol, "zones/orchestration/test", "POST", {
      strategy
    });

  return {
    // System Status Functions
    getHostSystemStatus,
    getHostUptime,
    getHostRebootStatus,
    clearHostRebootStatus,
    getHostRunlevel,
    
    // Advanced Power Management
    hostFastReboot,
    hostPoweroff,
    hostHalt,
    
    // Runlevel Management
    changeHostRunlevel,
    setHostSingleUser,
    setHostMultiUser,
    
    // Zone Orchestration
    getZoneOrchestrationStatus,
    enableZoneOrchestration,
    disableZoneOrchestration,
    getZonePriorities,
    testZoneOrchestration,
  };
};
