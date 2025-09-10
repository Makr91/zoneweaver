import React from "react";

import ZloginActionsDropdown from "./ZloginActionsDropdown";
import ZoneShell from "./ZoneShell";

const ZloginConsoleDisplay = ({
  zoneDetails,
  selectedZone,
  currentServer,
  user,
  loading,
  loadingVnc,
  previewReadOnly,
  previewReconnectKey,
  hasVnc,
  setLoading,
  setLoadingVnc,
  setError,
  setPreviewReadOnly,
  setZoneDetails,
  setActiveConsoleType,
  setShowZloginConsole,
  startVncSession,
  waitForVncSessionReady,
  forceZoneSessionCleanup,
  pasteTextToZone,
  handleZloginConsole,
}) => (
  <div className="zw-console-container">
    {/* zlogin Console Header */}
    <div className="has-background-dark has-text-white p-3 is-flex is-justify-content-space-between is-align-items-center">
      <div>
        <h6 className="title is-7 has-text-white mb-1">
          Active zlogin Session
        </h6>
        {zoneDetails.zlogin_session && (
          <p className="is-size-7 has-text-white-ter mb-0">
            Session ID:{" "}
            {zoneDetails.zlogin_session.id?.substring(0, 8) || "Unknown"} |
            Started:{" "}
            {zoneDetails.zlogin_session.created_at
              ? new Date(zoneDetails.zlogin_session.created_at).toLocaleString()
              : "Unknown"}
          </p>
        )}
      </div>
      <div className="buttons m-0">
        <ZloginActionsDropdown
          variant="button"
          onToggleReadOnly={() => {
            console.log(
              `🔧 ZLOGIN READ-ONLY: Toggling from ${previewReadOnly} to ${!previewReadOnly}`
            );
            setPreviewReadOnly(!previewReadOnly);
          }}
          onNewSession={() => handleZloginConsole(selectedZone)}
          onKillSession={async () => {
            if (!currentServer || !selectedZone) {
              return;
            }
            try {
              setLoading(true);
              await forceZoneSessionCleanup(currentServer, selectedZone);
              setZoneDetails((prev) => ({
                ...prev,
                zlogin_session: null,
                active_zlogin_session: false,
              }));
            } catch (error) {
              console.error("Error killing zlogin session:", error);
              setError("Error killing zlogin session");
            } finally {
              setLoading(false);
            }
          }}
          onScreenshot={() => {
            const terminalElement = document.querySelector(".xterm-screen");
            if (terminalElement) {
              const text =
                terminalElement.textContent || terminalElement.innerText;
              const blob = new Blob([text], { type: "text/plain" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = `zlogin-output-${selectedZone}-${Date.now()}.txt`;
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
              URL.revokeObjectURL(url);
            }
          }}
          isReadOnly={previewReadOnly}
          isAdmin={
            user?.role === "admin" ||
            user?.role === "super-admin" ||
            user?.role === "organization-admin"
          }
        />
        {!previewReadOnly && (
          <button
            className="button is-small is-info has-box-shadow"
            onClick={async () => {
              try {
                const text = await navigator.clipboard.readText();
                if (text && currentServer && selectedZone) {
                  console.log(
                    `📋 ZLOGIN PREVIEW PASTE: Pasting ${text.length} characters`
                  );
                  await pasteTextToZone(currentServer, selectedZone, text);
                }
              } catch (error) {
                console.error("📋 ZLOGIN PREVIEW PASTE: Error:", error);
              }
            }}
            title="Paste from Browser Clipboard"
          >
            <span className="icon is-small">
              <i className="fas fa-paste" />
            </span>
          </button>
        )}
        <button
          className="button is-small is-primary"
          onClick={() => {
            if (zoneDetails.zlogin_session) {
              setShowZloginConsole(true);
            } else {
              handleZloginConsole(selectedZone);
            }
          }}
          disabled={loading}
          title="Expand zlogin Console"
        >
          <span className="icon is-small">
            <i className="fas fa-expand" />
          </span>
        </button>
        {hasVnc ? (
          <button
            className="button is-small is-warning"
            onClick={() => {
              console.log(
                `🔄 PREVIEW SWITCH: Switching to VNC preview from zlogin`
              );
              setActiveConsoleType("vnc");
            }}
            title="Switch to VNC Console"
          >
            <span className="icon is-small">
              <i className="fas fa-desktop" />
            </span>
          </button>
        ) : (
          <button
            className="button is-small is-warning"
            onClick={async () => {
              console.log(`🚀 START VNC: Starting VNC for preview from zlogin`);
              try {
                setLoadingVnc(true);
                const result = await startVncSession(
                  currentServer.hostname,
                  currentServer.port,
                  currentServer.protocol,
                  selectedZone
                );

                if (result.success) {
                  const readinessResult =
                    await waitForVncSessionReady(selectedZone);
                  if (readinessResult.ready) {
                    setZoneDetails((prev) => ({
                      ...prev,
                      active_vnc_session: true,
                      vnc_session_info: {
                        ...result.data,
                        ...readinessResult.sessionInfo,
                      },
                    }));
                    setActiveConsoleType("vnc");
                  }
                }
              } catch (error) {
                console.error("Error starting VNC:", error);
                setError("Error starting VNC console");
              } finally {
                setLoadingVnc(false);
              }
            }}
            disabled={loadingVnc}
            title="Start VNC Console"
          >
            <span className="icon is-small">
              <i
                className={`fas ${loadingVnc ? "fa-spinner fa-pulse" : "fa-desktop"}`}
              />
            </span>
          </button>
        )}
      </div>
    </div>

    {/* zlogin Console Content */}
    <div className="zw-console-content">
      <ZoneShell
        key={`preview-zlogin-${selectedZone}-${previewReconnectKey}-${previewReadOnly ? "ro" : "rw"}`}
        zoneName={selectedZone}
        readOnly={previewReadOnly}
        context="preview"
        className="zw-console-zone-shell"
      />

      <div className="zw-console-status-overlay">
        <span className="icon is-small has-margin-right-3px">
          <i
            className={`fas fa-circle zw-console-status-icon ${
              zoneDetails.zlogin_session
                ? "zw-status-icon-active"
                : "zw-status-icon-inactive"
            }`}
          />
        </span>
        {zoneDetails.zlogin_session ? "Live" : "Offline"}
      </div>
    </div>
  </div>
);

export default React.memo(ZloginConsoleDisplay);
