import { useState, useCallback } from 'react';
import { useServers } from '../contexts/ServerContext';
import { useZoneTerminal } from '../contexts/ZoneTerminalContext';

/**
 * Custom hook to manage all zlogin session state and logic for a zone.
 * @param {object} currentServer - The currently selected server object.
 * @param {string} currentZone - The name of the currently selected zone.
 * @param {function} setZoneDetails - The state setter function for the parent component's zoneDetails.
 * @returns {object} An object containing all zlogin-related state and handler functions.
 */
export const useZloginSession = (currentServer, currentZone, setZoneDetails) => {
  const [showZloginConsole, setShowZloginConsole] = useState(false);
  const [isZloginFullScreen, setIsZloginFullScreen] = useState(false);

  const { makeZoneweaverAPIRequest, startZloginSession } = useServers();
  const { initializeSessionFromExisting, pasteTextToZone } = useZoneTerminal();

  const handleZloginConsole = useCallback(async (zoneName) => {
    if (!currentServer) return { success: false, message: 'No server selected.' };
    try {
      const result = await startZloginSession(currentServer.hostname, currentServer.port, currentServer.protocol, zoneName);
      if (result.success) {
        setZoneDetails(prev => ({ ...prev, zlogin_session: result.session }));
        setShowZloginConsole(true);
        return { success: true };
      }
      return { success: false, message: `Failed to start zlogin console: ${result.message}` };
    } catch (error) {
      return { success: false, message: 'Error starting zlogin console.' };
    }
  }, [currentServer, startZloginSession, setZoneDetails]);

  const refreshZloginSessionStatus = useCallback(async (zoneName) => {
    if (!currentServer) return;
    try {
      const sessionsResult = await makeZoneweaverAPIRequest(
        currentServer.hostname, currentServer.port, currentServer.protocol,
        `zlogin/sessions?_t=${Date.now()}`, 'GET', null, null, true
      );

      let activeZoneSession = null;
      if (sessionsResult.success && sessionsResult.data) {
        const activeSessions = Array.isArray(sessionsResult.data) ? sessionsResult.data : (sessionsResult.data.sessions || []);
        activeZoneSession = activeSessions.find(session => session.zone_name === zoneName && session.status === 'active');
      }

      if (activeZoneSession) {
        initializeSessionFromExisting(currentServer, zoneName, activeZoneSession);
      }

      setZoneDetails(prev => ({
        ...prev,
        zlogin_session: activeZoneSession,
        active_zlogin_session: !!activeZoneSession,
      }));

    } catch (error) {
      console.error('Error checking zlogin session status:', error);
      setZoneDetails(prev => ({ ...prev, zlogin_session: null, active_zlogin_session: false }));
    }
  }, [currentServer, makeZoneweaverAPIRequest, setZoneDetails, initializeSessionFromExisting]);

  const handleZloginPreviewPaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text && currentServer && currentZone) {
        await pasteTextToZone(currentServer, currentZone, text);
      }
    } catch (error) {
      console.error('Clipboard access error:', error);
    }
  };

  const handleZloginModalPaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text && currentServer && currentZone) {
        await pasteTextToZone(currentServer, currentZone, text);
      }
    } catch (error) {
      console.error('Clipboard access error:', error);
    }
  };

  return {
    showZloginConsole,
    setShowZloginConsole,
    isZloginFullScreen,
    setIsZloginFullScreen,
    handleZloginConsole,
    refreshZloginSessionStatus,
    handleZloginPreviewPaste,
    handleZloginModalPaste,
  };
};
