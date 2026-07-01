import { useCallback } from "react";

import { useServers } from "../contexts/ServerContext";

/**
 * Custom hook for host system management operations
 * Provides access to advanced system control, status monitoring, and orchestration functions.
 * Every function is memoized on `makeZoneweaverAPIRequest` (itself stable) so consumers can
 * safely use them in useEffect/useCallback dependency arrays without re-render loops.
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
  const getHostSystemStatus = useCallback(
    async (hostname, port, protocol) =>
      await makeZoneweaverAPIRequest(
        hostname,
        port,
        protocol,
        "system/host/status"
      ),
    [makeZoneweaverAPIRequest]
  );

  /**
   * Get host uptime information
   * @param {string} hostname - Server hostname
   * @param {number} port - Server port
   * @param {string} protocol - Server protocol
   * @returns {Promise<Object>} Uptime and load average information
   */
  const getHostUptime = useCallback(
    async (hostname, port, protocol) =>
      await makeZoneweaverAPIRequest(
        hostname,
        port,
        protocol,
        "system/host/uptime"
      ),
    [makeZoneweaverAPIRequest]
  );

  /**
   * Get current host reboot status
   * @param {string} hostname - Server hostname
   * @param {number} port - Server port
   * @param {string} protocol - Server protocol
   * @returns {Promise<Object>} Reboot requirement status and reasons
   */
  const getHostRebootStatus = useCallback(
    async (hostname, port, protocol) =>
      await makeZoneweaverAPIRequest(
        hostname,
        port,
        protocol,
        "system/host/reboot-status"
      ),
    [makeZoneweaverAPIRequest]
  );

  /**
   * Clear reboot required flags
   * @param {string} hostname - Server hostname
   * @param {number} port - Server port
   * @param {string} protocol - Server protocol
   * @param {string} [reason] - Optional reason for clearing flags
   * @returns {Promise<Object>} Clear operation result
   */
  const clearHostRebootStatus = useCallback(
    async (hostname, port, protocol, reason = null) => {
      const data = reason ? { reason } : {};
      return await makeZoneweaverAPIRequest(
        hostname,
        port,
        protocol,
        "system/host/reboot-status",
        "DELETE",
        data
      );
    },
    [makeZoneweaverAPIRequest]
  );

  /**
   * Get current runlevel information
   * @param {string} hostname - Server hostname
   * @param {number} port - Server port
   * @param {string} protocol - Server protocol
   * @returns {Promise<Object>} Current runlevel and available runlevels
   */
  const getHostRunlevel = useCallback(
    async (hostname, port, protocol) =>
      await makeZoneweaverAPIRequest(
        hostname,
        port,
        protocol,
        "system/host/runlevel"
      ),
    [makeZoneweaverAPIRequest]
  );

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
  const hostFastReboot = useCallback(
    async (hostname, port, protocol, options = {}) =>
      await makeZoneweaverAPIRequest(
        hostname,
        port,
        protocol,
        "system/host/reboot/fast",
        "POST",
        {
          confirm: true,
          boot_environment: options.bootEnvironment,
          ...options,
        }
      ),
    [makeZoneweaverAPIRequest]
  );

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
  const hostPoweroff = useCallback(
    async (hostname, port, protocol, options = {}) =>
      await makeZoneweaverAPIRequest(
        hostname,
        port,
        protocol,
        "system/host/poweroff",
        "POST",
        {
          confirm: true,
          grace_period: options.gracePeriod || 60,
          message: options.message || "System poweroff via Zoneweaver UI",
          ...options,
        }
      ),
    [makeZoneweaverAPIRequest]
  );

  /**
   * Emergency halt the host system (immediate)
   * @param {string} hostname - Server hostname
   * @param {number} port - Server port
   * @param {string} protocol - Server protocol
   * @returns {Promise<Object>} Task creation result
   */
  const hostHalt = useCallback(
    async (hostname, port, protocol) =>
      await makeZoneweaverAPIRequest(
        hostname,
        port,
        protocol,
        "system/host/halt",
        "POST",
        {
          confirm: true,
          emergency: true,
        }
      ),
    [makeZoneweaverAPIRequest]
  );

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
  const changeHostRunlevel = useCallback(
    async (hostname, port, protocol, runlevel) =>
      await makeZoneweaverAPIRequest(
        hostname,
        port,
        protocol,
        "system/host/runlevel",
        "POST",
        {
          confirm: true,
          runlevel,
        }
      ),
    [makeZoneweaverAPIRequest]
  );

  /**
   * Switch to single-user mode
   * @param {string} hostname - Server hostname
   * @param {number} port - Server port
   * @param {string} protocol - Server protocol
   * @returns {Promise<Object>} Task creation result
   */
  const setHostSingleUser = useCallback(
    async (hostname, port, protocol) =>
      await makeZoneweaverAPIRequest(
        hostname,
        port,
        protocol,
        "system/host/single-user",
        "POST",
        {
          confirm: true,
        }
      ),
    [makeZoneweaverAPIRequest]
  );

  /**
   * Switch to multi-user mode
   * @param {string} hostname - Server hostname
   * @param {number} port - Server port
   * @param {string} protocol - Server protocol
   * @param {boolean} [networkServices] - Enable network services (runlevel 3 vs 2)
   * @returns {Promise<Object>} Task creation result
   */
  const setHostMultiUser = useCallback(
    async (hostname, port, protocol, networkServices = true) =>
      await makeZoneweaverAPIRequest(
        hostname,
        port,
        protocol,
        "system/host/multi-user",
        "POST",
        {
          network_services: networkServices,
        }
      ),
    [makeZoneweaverAPIRequest]
  );

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
  const getZoneOrchestrationStatus = useCallback(
    async (hostname, port, protocol) =>
      await makeZoneweaverAPIRequest(
        hostname,
        port,
        protocol,
        "zones/orchestration/status"
      ),
    [makeZoneweaverAPIRequest]
  );

  /**
   * Enable zone orchestration
   * @param {string} hostname - Server hostname
   * @param {number} port - Server port
   * @param {string} protocol - Server protocol
   * @returns {Promise<Object>} Enable operation result
   */
  const enableZoneOrchestration = useCallback(
    async (hostname, port, protocol) =>
      await makeZoneweaverAPIRequest(
        hostname,
        port,
        protocol,
        "zones/orchestration/enable",
        "POST",
        {
          confirm: true,
        }
      ),
    [makeZoneweaverAPIRequest]
  );

  /**
   * Disable zone orchestration
   * @param {string} hostname - Server hostname
   * @param {number} port - Server port
   * @param {string} protocol - Server protocol
   * @returns {Promise<Object>} Disable operation result
   */
  const disableZoneOrchestration = useCallback(
    async (hostname, port, protocol) =>
      await makeZoneweaverAPIRequest(
        hostname,
        port,
        protocol,
        "zones/orchestration/disable",
        "POST"
      ),
    [makeZoneweaverAPIRequest]
  );

  /**
   * Get zone priorities for orchestration
   * @param {string} hostname - Server hostname
   * @param {number} port - Server port
   * @param {string} protocol - Server protocol
   * @returns {Promise<Object>} Zone priorities and groupings
   */
  const getZonePriorities = useCallback(
    async (hostname, port, protocol) =>
      await makeZoneweaverAPIRequest(
        hostname,
        port,
        protocol,
        "zones/priorities"
      ),
    [makeZoneweaverAPIRequest]
  );

  /**
   * Test zone orchestration with specified strategy
   * @param {string} hostname - Server hostname
   * @param {number} port - Server port
   * @param {string} protocol - Server protocol
   * @param {string} [strategy] - Orchestration strategy to test
   * @returns {Promise<Object>} Test execution plan and duration estimate
   */
  const testZoneOrchestration = useCallback(
    async (hostname, port, protocol, strategy = "parallel_by_priority") =>
      await makeZoneweaverAPIRequest(
        hostname,
        port,
        protocol,
        "zones/orchestration/test",
        "POST",
        {
          strategy,
        }
      ),
    [makeZoneweaverAPIRequest]
  );

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
