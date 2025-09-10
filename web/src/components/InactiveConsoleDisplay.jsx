import React from "react";

const InactiveConsoleDisplay = ({
  selectedZone,
  currentServer,
  loading,
  loadingVnc,
  setLoading,
  setLoadingVnc,
  setError,
  setZoneDetails,
  setActiveConsoleType,
  startVncSession,
  waitForVncSessionReady,
  startZloginSessionExplicitly,
}) => (
  <div className="zw-console-container-hidden">
    {/* Inactive Console Header */}
    <div className="has-background-dark has-text-white p-3 is-flex is-justify-content-space-between is-align-items-center">
      <div>
        <h6 className="title is-7 has-text-white mb-1">Console Management</h6>
        <p className="is-size-7 has-text-white-ter mb-0">
          No active sessions • Click to start
        </p>
      </div>
      <div className="buttons m-0">
        <button
          className="button is-small is-info"
          onClick={async () => {
            console.log(
              `🚀 START VNC: Starting VNC for preview in ${selectedZone}`
            );
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
          disabled={loading || loadingVnc}
          title="Start VNC Console"
        >
          <span className="icon is-small">
            <i className="fas fa-desktop" />
          </span>
          <span>{loadingVnc ? "Starting..." : "Start VNC"}</span>
        </button>
        <button
          className="button is-small is-success"
          onClick={async () => {
            if (!currentServer || !selectedZone) {
              return;
            }
            console.log(
              `🚀 START ZLOGIN: Starting zlogin for preview in ${selectedZone}`
            );
            try {
              setLoading(true);
              const result = await startZloginSessionExplicitly(
                currentServer,
                selectedZone
              );
              if (result) {
                setZoneDetails((prev) => ({
                  ...prev,
                  zlogin_session: result,
                  active_zlogin_session: true,
                }));
                setActiveConsoleType("zlogin");
              }
            } catch (error) {
              console.error("Error starting zlogin:", error);
              setError("Error starting zlogin console");
            } finally {
              setLoading(false);
            }
          }}
          disabled={loading}
          title="Start zlogin Console"
        >
          <span className="icon is-small">
            <i className="fas fa-terminal" />
          </span>
          <span>{loading ? "Starting..." : "Start zlogin"}</span>
        </button>
      </div>
    </div>

    {/* Console Content - Inactive State */}
    <div className="zw-inactive-console-content">
      <div className="zw-text-placeholder has-text-centered">
        <div className="has-margin-bottom-12px">
          <img
            src="/images/startcloud.svg"
            alt="Start Console"
            className="zw-startup-icon"
          />
        </div>
        <div className="is-size-6 has-text-weight-medium mb-2">
          <strong>No Active Console Session</strong>
        </div>
        <div className="is-size-7">
          Click the buttons above to start VNC or zlogin console
        </div>
      </div>
    </div>
  </div>
);

export default React.memo(InactiveConsoleDisplay);
