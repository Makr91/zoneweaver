import { useState, useCallback } from 'react';
import { useServers } from '../contexts/ServerContext';

/**
 * Custom hook to manage all VNC session state and logic for a zone.
 * @param {object} currentServer - The currently selected server object.
 * @param {string} currentZone - The name of the currently selected zone.
 * @param {function} setZoneDetails - The state setter function for the parent component's zoneDetails.
 * @returns {object} An object containing all VNC-related state and handler functions.
 */
export const useVncSession = (currentServer, currentZone, setZoneDetails) => {
  const [vncSession, setVncSession] = useState(null);
  const [loadingVnc, setLoadingVnc] = useState(false);
  const [showVncConsole, setShowVncConsole] = useState(false);
  const [vncLoadError, setVncLoadError] = useState(false);
  const [isVncFullScreen, setIsVncFullScreen] = useState(false);
  const [showFullScreenControls, setShowFullScreenControls] = useState(false);
  const [vncConsoleUrl, setVncConsoleUrl] = useState("");
  const [hoverTimeout, setHoverTimeout] = useState(null);
  const [killInProgress, setKillInProgress] = useState(false);
  const [vncReconnectKey, setVncReconnectKey] = useState(0);
  const [vncSettings, setVncSettings] = useState({
    quality: 6,
    compression: 2,
    resize: 'scale',
    showDot: true,
  });

  const { makeZoneweaverAPIRequest, startVncSession, stopVncSession } = useServers();

  const handleVncQualityChange = (quality) => {
    setVncSettings(prev => ({ ...prev, quality }));
  };

  const handleVncCompressionChange = (compression) => {
    setVncSettings(prev => ({ ...prev, compression }));
  };

  const handleVncResizeChange = (resize) => {
    setVncSettings(prev => ({ ...prev, resize }));
    setVncReconnectKey(prev => prev + 1);
  };

  const handleVncShowDotChange = (showDot) => {
    setVncSettings(prev => ({ ...prev, showDot }));
    setVncReconnectKey(prev => prev + 1);
  };

  const waitForVncSessionReady = useCallback(async (zoneName, maxAttempts = 10) => {
    if (!currentServer) return { ready: false, reason: 'No current server selected' };
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const vncResult = await makeZoneweaverAPIRequest(
          currentServer.hostname,
          currentServer.port,
          currentServer.protocol,
          `zones/${zoneName}/vnc/info?_ready_check=${Date.now()}`, 'GET', null, null, true
        );
        if (vncResult.success && vncResult.data?.active_vnc_session && vncResult.data?.vnc_session_info?.status === 'active') {
          return { ready: true, sessionInfo: vncResult.data.vnc_session_info };
        }
        if (attempt < maxAttempts) await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        if (attempt < maxAttempts) await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    return { ready: false, reason: `Session not ready after ${maxAttempts} attempts.` };
  }, [currentServer, makeZoneweaverAPIRequest]);

  const handleVncConsole = useCallback(async (zoneName, openInNewTab = false) => {
    if (!currentServer) return;
    let errorMsg = '';
    try {
      setLoadingVnc(true);
      const result = await startVncSession(currentServer.hostname, currentServer.port, currentServer.protocol, zoneName);

      if (result.success && typeof result.data === 'object') {
        const readinessResult = await waitForVncSessionReady(zoneName);
        if (readinessResult.ready) {
          setVncSession(result.data);
          if (openInNewTab) {
            // This logic might need adjustment depending on proxy setup
            const proxyUrl = `/vnc-proxy/${currentServer.hostname}/${readinessResult.sessionInfo.web_port}/`;
            window.open(proxyUrl, '_blank', 'width=1024,height=768,scrollbars=yes,resizable=yes');
          } else {
            setShowVncConsole(true);
          }
          setZoneDetails(prev => ({
            ...prev,
            active_vnc_session: true,
            vnc_session_info: { ...result.data, ...readinessResult.sessionInfo },
          }));
        } else {
          errorMsg = `VNC session started but not ready: ${readinessResult.reason}`;
        }
      } else {
        errorMsg = `Failed to start VNC console for ${zoneName}: ${result.message}`;
      }
    } catch (error) {
      errorMsg = `Error starting VNC console for ${zoneName}`;
    } finally {
      setLoadingVnc(false);
      return errorMsg; // Return error message to be set by the component
    }
  }, [currentServer, startVncSession, waitForVncSessionReady, setZoneDetails]);
  
  const closeVncConsole = () => {
    setShowVncConsole(false);
    setVncLoadError(false);
    setIsVncFullScreen(false);
  };

  const handleKillVncSession = useCallback(async (zoneName) => {
    if (!currentServer || killInProgress) return { success: false, message: 'Action in progress or server not selected.' };
    let result = { success: false, message: '' };
    try {
      setKillInProgress(true);
      const apiResult = await stopVncSession(currentServer.hostname, currentServer.port, currentServer.protocol, zoneName);
      if (apiResult.success) {
        setZoneDetails(prev => ({ ...prev, active_vnc_session: false, vnc_session_info: null }));
        setVncReconnectKey(prev => prev + 1);
        closeVncConsole();
        result = { success: true };
      } else {
        result.message = `Failed to kill VNC session: ${apiResult.message}`;
      }
    } catch (error) {
      result.message = 'Error killing VNC session.';
    } finally {
      setKillInProgress(false);
      return result;
    }
  }, [currentServer, killInProgress, stopVncSession, setZoneDetails]);

  const refreshVncSessionStatus = useCallback(async (zoneName) => {
    if (!currentServer) return;
    try {
      console.log(`🔍 VNC STATUS: Checking session status for zone: ${zoneName}`);
      
      const vncResult = await makeZoneweaverAPIRequest(
        currentServer.hostname, currentServer.port, currentServer.protocol,
        `zones/${zoneName}/vnc/info?_t=${Date.now()}`, 'GET', null, null, true
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
            timestamp: Date.now()
          });
          
          return newState;
        });
      }
    } catch (error) {
      console.error('💥 VNC STATUS: Error checking session status:', error);
      setZoneDetails(prev => {
        // 🛡️ DEFENSIVE STATE MERGE: Only clear VNC fields, explicitly preserve zlogin state
        const newState = {
          ...prev,
          active_vnc_session: false,
          vnc_session_info: null,
          // CRITICAL: Explicitly preserve zlogin session state to prevent overwrites
          zlogin_session: prev.zlogin_session || null,
          active_zlogin_session: prev.active_zlogin_session || false
        };
        return newState;
      });
    }
  }, [currentServer, makeZoneweaverAPIRequest, setZoneDetails]);

  const validateVncSession = useCallback(async (zoneName, maxAttempts = 3) => {
    if (!currentServer) return { valid: false, reason: 'No current server selected' };
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const vncResult = await makeZoneweaverAPIRequest(
          currentServer.hostname, currentServer.port, currentServer.protocol,
          `zones/${zoneName}/vnc/info?_validation=true&_t=${Date.now()}`, 'GET', null, null, true
        );

        if (vncResult.success && vncResult.data) {
          const hasActiveProperty = typeof vncResult.data.active !== 'undefined';
          const hasStatusProperty = vncResult.data.status;
          const hasConsoleUrl = vncResult.data.console_url;
          const hasWebPort = vncResult.data.web_port;
          
          const isActive = hasActiveProperty ? vncResult.data.active : 
                           (hasStatusProperty ? vncResult.data.status === 'active' : false);
          
          if (isActive && hasConsoleUrl && hasWebPort) {
            return { valid: true, sessionInfo: vncResult.data, reason: 'Session active and accessible' };
          }
        }
        
        if (attempt < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      } catch (error) {
        if (attempt < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
    }

    return { valid: false, reason: `Session validation failed after ${maxAttempts} attempts.` };
  }, [currentServer, makeZoneweaverAPIRequest]);

  const verifyKillCompletion = useCallback(async (zoneName, maxAttempts = 3) => {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        const statusResult = await makeZoneweaverAPIRequest(
          currentServer.hostname, currentServer.port, currentServer.protocol,
          `zones/${zoneName}/vnc/info?_kill_check=${Date.now()}`, 'GET', null, null, true
        );
        
        if (!statusResult.success || statusResult.status === 404) {
          setZoneDetails(prev => ({ ...prev, active_vnc_session: false, vnc_session_info: null }));
          if (showVncConsole) closeVncConsole();
          return;
        }
      } catch (error) {
        console.error(`VNC KILL VERIFY: Error on attempt ${attempt}:`, error);
      }
    }
    
    console.warn(`VNC KILL VERIFY: Verification failed after ${maxAttempts} attempts`);
  }, [currentServer, makeZoneweaverAPIRequest, setZoneDetails, showVncConsole]);

  const handleVncClipboardPaste = (text) => {
    console.log(`VNC CLIPBOARD: Attempting to paste text of length ${text.length}`);
  };

  const handleVncPreviewPaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text && previewVncRef?.current?.clipboardPaste) {
        previewVncRef.current.clipboardPaste(text);
      }
    } catch (error) {
      console.error('VNC PREVIEW PASTE: Clipboard access error:', error);
    }
  };

  const handleVncModalPaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text && modalVncRef?.current?.clipboardPaste) {
        modalVncRef.current.clipboardPaste(text);
      }
    } catch (error) {
      console.error('VNC MODAL PASTE: Clipboard access error:', error);
    }
  };

  const handleCornerHover = () => {
    if (!isVncFullScreen) return;
    
    if (hoverTimeout) clearTimeout(hoverTimeout);
    
    const timeout = setTimeout(() => {
      setShowFullScreenControls(true);
    }, 4000);
    
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
    closeVncConsole();
  };

  return {
    vncSession,
    loadingVnc,
    setLoadingVnc,
    showVncConsole,
    setShowVncConsole,
    vncLoadError,
    setVncLoadError,
    isVncFullScreen,
    setIsVncFullScreen,
    showFullScreenControls,
    setShowFullScreenControls,
    vncConsoleUrl,
    setVncConsoleUrl,
    hoverTimeout,
    setHoverTimeout,
    killInProgress,
    vncReconnectKey,
    vncSettings,
    handleVncQualityChange,
    handleVncCompressionChange,
    handleVncResizeChange,
    handleVncShowDotChange,
    handleVncConsole,
    closeVncConsole,
    handleKillVncSession,
    refreshVncSessionStatus,
    validateVncSession,
    verifyKillCompletion,
    handleVncClipboardPaste,
    handleVncPreviewPaste,
    handleVncModalPaste,
    handleCornerHover,
    handleCornerLeave,
    handleVncIframeError,
    openDirectVncFallback,
    waitForVncSessionReady,
  };
};
