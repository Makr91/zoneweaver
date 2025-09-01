import React, { useState, useEffect, useRef } from "react";
import { Helmet } from "@dr.pogodin/react-helmet";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useServers } from "../contexts/ServerContext";
import { useZoneManager } from "../hooks/useZoneManager";
import { useZoneDetails } from "../hooks/useZoneDetails";
import { useVncSession } from "../hooks/useVncSession";
import { useZloginSession } from "../hooks/useZloginSession";
import { useZoneTerminal } from "../contexts/ZoneTerminalContext";
import ConsoleDisplay from "./ConsoleDisplay";
import ZoneInfo from "./Zone/ZoneInfo";
import ZoneHardware from "./Zone/ZoneHardware";
import ZoneStorage from "./Zone/ZoneStorage";
import ZoneNetwork from "./Zone/ZoneNetwork";
import VncModal from "./Zone/VncModal";
import ZloginModal from "./Zone/ZloginModal";

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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedZone, setSelectedZone] = useState(null);
  
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeConsoleType, setActiveConsoleType] = useState('vnc'); // 'vnc' or 'zlogin'
  const [previewReadOnly, setPreviewReadOnly] = useState(true); // Track preview terminal read-only state
  const [previewReconnectKey, setPreviewReconnectKey] = useState(0); // Force preview reconnection
  const [previewVncViewOnly, setPreviewVncViewOnly] = useState(true); // Track preview VNC view-only state
  const [modalVncViewOnly, setModalVncViewOnly] = useState(false); // Track modal VNC view-only state
  const [modalReadOnly, setModalReadOnly] = useState(false); // Track modal zlogin read-only state
  
  // VNC component refs to pass to action dropdowns
  const modalVncRef = useRef(null);
  
  const { user } = useAuth();
  const { 
    makeZoneweaverAPIRequest, 
    servers: allServers, 
    currentServer, 
    currentZone, 
    selectZone,
    // Get raw session functions for ConsoleDisplay
    startVncSession: rawStartVncSession
  } = useServers();

  const { zones, runningZones, error: zonesError, getZoneStatus } = useZoneManager(currentServer);

  const {
    zoneDetails,
    setZoneDetails,
    monitoringHealth,
    error: detailsError,
  } = useZoneDetails(currentServer, currentZone);

  const {
    loadingVnc,
    setLoadingVnc,
    showVncConsole,
    setShowVncConsole,
    vncLoadError,
    setVncLoadError,
    isVncFullScreen,
    setIsVncFullScreen,
    vncReconnectKey,
    vncSettings,
    handleVncQualityChange,
    handleVncCompressionChange,
    handleVncResizeChange,
    handleVncShowDotChange,
    handleVncConsole,
    closeVncConsole,
    handleKillVncSession,
    handleVncClipboardPaste,
    handleVncModalPaste,
    openDirectVncFallback,
    waitForVncSessionReady,
  } = useVncSession(currentServer, currentZone, setZoneDetails);

  const {
    showZloginConsole,
    setShowZloginConsole,
    isZloginFullScreen,
    setIsZloginFullScreen,
    handleZloginConsole,
    refreshZloginSessionStatus,
    handleZloginModalPaste,
  } = useZloginSession(currentServer, currentZone, setZoneDetails);

  const { forceZoneSessionCleanup, startZloginSessionExplicitly, pasteTextToZone } = useZoneTerminal();

  // Handle URL query parameter for zone selection
  useEffect(() => {
    const zloginParam = searchParams.get('zlogin');
    if (zloginParam) {
      handleZoneSelect(zloginParam);
      handleZloginConsole(zloginParam).then(result => {
        if (!result.success) setError(result.message);
      });
      setSearchParams({});
    }

    const vncParam = searchParams.get('vnc');
    if (vncParam) {
      handleZoneSelect(vncParam);
      handleVncConsole(vncParam).then(errorMsg => {
        if (errorMsg) setError(errorMsg);
      });
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

  const handleZoneSelect = (zoneName) => {
    selectZone(zoneName);
    // Zone details load now automatically includes session detection
    // No need for separate session refresh orchestration
  };

  // Sync local selectedZone with global currentZone
  useEffect(() => {
    setSelectedZone(currentZone);
  }, [currentZone]);

  // Auto-select console type based on what's available - FIXED to respect manual switching
  useEffect(() => {
    const hasVnc = zoneDetails.active_vnc_session;
    const hasZlogin = zoneDetails.zlogin_session;
    
    console.log(`🔧 CONSOLE AUTO-SWITCH CHECK:`, {
      hasVnc,
      hasZlogin, 
      currentType: activeConsoleType,
      zloginSessionId: zoneDetails.zlogin_session?.id
    });
    
    // LOOP PREVENTION: Only change console type if there's a meaningful difference
    // This prevents VNC disconnect -> console switch -> remount -> VNC disconnect loops
    
    if (hasVnc && hasZlogin) {
      // Both active - keep current selection or default to VNC
      if (!activeConsoleType || (activeConsoleType !== 'vnc' && activeConsoleType !== 'zlogin')) {
        console.log('🔧 CONSOLE SWITCH: Both sessions available, defaulting to VNC');
        setActiveConsoleType('vnc');
      }
    } else if (hasZlogin && !hasVnc) {
      // Only zlogin available - ALWAYS switch to zlogin (don't check current type)
      console.log('🔧 CONSOLE SWITCH: Only zlogin available, switching to zlogin');
      setActiveConsoleType('zlogin');
    } else if (hasVnc && !hasZlogin) {
      // Only VNC available - ALWAYS switch to VNC (don't check current type)
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


  if (allServers.length === 0) {
    return (
      <div className='hero-body p-0 is-align-items-stretch'>
        <Helmet>
          <meta charSet='utf-8' />
          <title>Zones - Zoneweaver</title>
          <link rel='canonical' href={window.location.origin} />
        </Helmet>
        <div className='container is-fluid p-0'>
          <div className='box p-0 is-radiusless'>
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
    <div className='hero-body p-0 is-align-items-stretch'>
      <Helmet>
        <meta charSet='utf-8' />
        <title>Zones - Zoneweaver</title>
        <link rel='canonical' href={window.location.origin} />
      </Helmet>
      <div className='container is-fluid p-0'>
        <div className='box p-0 is-radiusless'>
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
              <div className='notification is-danger mb-4'>
                <p>{error}</p>
              </div>
            )}
            {zonesError && (
              <div className='notification is-danger mb-4'>
                <p>{zonesError}</p>
              </div>
            )}
            {detailsError && (
              <div className='notification is-danger mb-4'>
                <p>{detailsError}</p>
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
                            <ZoneInfo 
                              zoneDetails={zoneDetails}
                              monitoringHealth={monitoringHealth}
                              getZoneStatus={getZoneStatus}
                              selectedZone={selectedZone}
                            />

                            <ZoneHardware zoneDetails={zoneDetails} />
                          </div>
                              
                          {/* Right Column - Console Display with Toggle */}
                          <div className='column is-6'>
                            <ConsoleDisplay
                              zoneDetails={zoneDetails}
                              activeConsoleType={activeConsoleType}
                              selectedZone={selectedZone}
                              currentServer={currentServer}
                              user={user}
                              loading={loading}
                              loadingVnc={loadingVnc}
                              previewReadOnly={previewReadOnly}
                              previewVncViewOnly={previewVncViewOnly}
                              previewReconnectKey={previewReconnectKey}
                              vncReconnectKey={vncReconnectKey}
                              vncSettings={vncSettings}
                              setActiveConsoleType={setActiveConsoleType}
                              setLoading={setLoading}
                              setLoadingVnc={setLoadingVnc}
                              setError={setError}
                              setPreviewReadOnly={setPreviewReadOnly}
                              setPreviewVncViewOnly={setPreviewVncViewOnly}
                              setZoneDetails={setZoneDetails}
                              startZloginSessionExplicitly={startZloginSessionExplicitly}
                              forceZoneSessionCleanup={forceZoneSessionCleanup}
                              handleZloginConsole={handleZloginConsole}
                              handleVncConsole={handleVncConsole}
                              handleKillVncSession={handleKillVncSession}
                              handleVncQualityChange={handleVncQualityChange}
                              handleVncCompressionChange={handleVncCompressionChange}
                              handleVncResizeChange={handleVncResizeChange}
                              handleVncShowDotChange={handleVncShowDotChange}
                              handleVncClipboardPaste={handleVncClipboardPaste}
                              startVncSession={rawStartVncSession}
                              waitForVncSessionReady={waitForVncSessionReady}
                              pasteTextToZone={pasteTextToZone}
                              setShowZloginConsole={setShowZloginConsole}
                            />
                          </div>
                        </div>

                        {/* Configuration Display */}
                        {zoneDetails.configuration && Object.keys(zoneDetails.configuration).length > 0 ? (
                          <div>
                            <ZoneStorage configuration={zoneDetails.configuration} />
                            <ZoneNetwork configuration={zoneDetails.configuration} />
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
                          <summary className='title is-6 is-clickable'>Raw Data (Debug)</summary>
                          <div className='box'>
                            <pre className='is-size-7 has-overflow-auto'>{JSON.stringify(zoneDetails, null, 2)}</pre>
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

      <ZloginModal
        showZloginConsole={showZloginConsole}
        setShowZloginConsole={setShowZloginConsole}
        isZloginFullScreen={isZloginFullScreen}
        setIsZloginFullScreen={setIsZloginFullScreen}
        selectedZone={selectedZone}
        handleZloginConsole={handleZloginConsole}
        handleZloginModalPaste={handleZloginModalPaste}
        user={user}
        zoneDetails={zoneDetails}
        setShowVncConsole={setShowVncConsole}
        handleVncConsole={handleVncConsole}
        loadingVnc={loadingVnc}
        setLoading={setLoading}
        makeZoneweaverAPIRequest={makeZoneweaverAPIRequest}
        currentServer={currentServer}
        forceZoneSessionCleanup={forceZoneSessionCleanup}
        refreshZloginSessionStatus={refreshZloginSessionStatus}
        setError={setError}
        modalReadOnly={modalReadOnly}
        setModalReadOnly={setModalReadOnly}
      />

      <VncModal
        showVncConsole={showVncConsole}
        closeVncConsole={closeVncConsole}
        isVncFullScreen={isVncFullScreen}
        openVncFullScreen={() => setIsVncFullScreen(!isVncFullScreen)}
        vncLoadError={vncLoadError}
        openDirectVncFallback={openDirectVncFallback}
        setVncLoadError={setVncLoadError}
        currentServer={currentServer}
        selectedZone={selectedZone}
        vncReconnectKey={vncReconnectKey}
        modalVncRef={modalVncRef}
        modalVncViewOnly={modalVncViewOnly}
        setModalVncViewOnly={setModalVncViewOnly}
        handleVncModalPaste={handleVncModalPaste}
        handleVncConsole={handleVncConsole}
        handleKillVncSession={handleKillVncSession}
        user={user}
        zoneDetails={zoneDetails}
        setShowZloginConsole={setShowZloginConsole}
        handleZloginConsole={handleZloginConsole}
        loading={loading}
        loadingVnc={loadingVnc}
        vncSettings={vncSettings}
        handleVncQualityChange={handleVncQualityChange}
        handleVncCompressionChange={handleVncCompressionChange}
        handleVncResizeChange={handleVncResizeChange}
        handleVncShowDotChange={handleVncShowDotChange}
        handleVncClipboardPaste={handleVncClipboardPaste}
      />
    </div>
  );
};

export default React.memo(Zones);
