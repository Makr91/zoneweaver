import PropTypes from "prop-types";

import ZloginActionsDropdown from "../ZloginActionsDropdown";
import ZoneShell from "../ZoneShell";

const ZloginModal = ({
  showZloginConsole,
  setShowZloginConsole,
  isZloginFullScreen,
  setIsZloginFullScreen,
  selectedZone,
  handleZloginConsole,
  handleZloginModalPaste,
  user,
  zoneDetails,
  setShowVncConsole,
  handleVncConsole,
  loadingVnc,
  setLoading,
  makeZoneweaverAPIRequest,
  currentServer,
  forceZoneSessionCleanup,
  refreshZloginSessionStatus,
  setError,
  modalReadOnly,
  setModalReadOnly,
}) => {
  if (!showZloginConsole) {
    return null;
  }

  return (
    <div className="modal is-active has-z-index-modal">
      <div
        className="modal-background"
        onClick={() => setShowZloginConsole(false)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            setShowZloginConsole(false);
          }
        }}
        role="button"
        tabIndex={0}
        aria-label="Close modal"
      />
      <div
        className={
          isZloginFullScreen
            ? "zw-modal-container-fullscreen"
            : "zw-modal-container-normal"
        }
      >
        <header
          className={`modal-card-head ${isZloginFullScreen ? "zw-modal-header-fullscreen" : "zw-modal-header-normal"}`}
        >
          <p
            className={`modal-card-title ${isZloginFullScreen ? "zw-modal-title-fullscreen" : "zw-modal-title-normal"}`}
          >
            <span className="icon-text">
              <span className="icon is-small">
                <i className="fas fa-terminal" />
              </span>
              <span>zlogin Console - {selectedZone}</span>
            </span>
          </p>
          <div className="buttons m-0">
            <ZloginActionsDropdown
              variant="button"
              onToggleReadOnly={() => {
                console.log(
                  `🔧 ZLOGIN MODAL READ-ONLY: Toggling from ${modalReadOnly} to ${!modalReadOnly}`
                );
                setModalReadOnly(!modalReadOnly);
              }}
              onNewSession={() => {
                setShowZloginConsole(false);
                setTimeout(() => {
                  handleZloginConsole(selectedZone).then((result) => {
                    if (!result.success) {
                      setError(result.message);
                    }
                  });
                }, 100);
              }}
              onKillSession={async () => {
                if (!currentServer || !selectedZone) {
                  return;
                }
                try {
                  setLoading(true);
                  const sessionsResult = await makeZoneweaverAPIRequest(
                    currentServer.hostname,
                    currentServer.port,
                    currentServer.protocol,
                    "zlogin/sessions"
                  );
                  if (sessionsResult.success && sessionsResult.data) {
                    const activeSessions = Array.isArray(sessionsResult.data)
                      ? sessionsResult.data
                      : sessionsResult.data.sessions || [];
                    const activeZoneSession = activeSessions.find(
                      (session) =>
                        session.zone_name === selectedZone &&
                        session.status === "active"
                    );
                    if (activeZoneSession) {
                      const killResult = await makeZoneweaverAPIRequest(
                        currentServer.hostname,
                        currentServer.port,
                        currentServer.protocol,
                        `zlogin/sessions/${activeZoneSession.id}/stop`,
                        "DELETE"
                      );
                      if (killResult.success) {
                        await forceZoneSessionCleanup(
                          currentServer,
                          selectedZone
                        );
                        await refreshZloginSessionStatus(selectedZone);
                      } else {
                        setError(
                          `Failed to kill zlogin session: ${killResult.message}`
                        );
                      }
                    }
                  } else {
                    setError("Failed to get active sessions");
                  }
                } catch (error) {
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
              isReadOnly={modalReadOnly}
              isAdmin={
                user?.role === "admin" ||
                user?.role === "super-admin" ||
                user?.role === "organization-admin"
              }
            />
            {!modalReadOnly && (
              <button
                className="button is-small is-info"
                onClick={handleZloginModalPaste}
                title="Paste from Browser Clipboard"
              >
                <span className="icon is-small">
                  <i className="fas fa-paste" />
                </span>
              </button>
            )}
            <button
              className="button is-small is-warning"
              onClick={async () => {
                if (zoneDetails.active_vnc_session) {
                  setShowZloginConsole(false);
                  setShowVncConsole(true);
                } else {
                  setShowZloginConsole(false);
                  const errorMsg = await handleVncConsole(selectedZone);
                  if (errorMsg) {
                    setError(errorMsg);
                  }
                }
              }}
              disabled={loadingVnc}
              title={
                zoneDetails.active_vnc_session
                  ? "Switch to VNC Console"
                  : "Start VNC Console"
              }
            >
              <span className="icon is-small">
                <i
                  className={`fas ${loadingVnc ? "fa-spinner fa-pulse" : "fa-desktop"}`}
                />
              </span>
              <span>{loadingVnc ? "Starting..." : "VNC"}</span>
            </button>
            <button
              className="button is-small is-info"
              onClick={() => setIsZloginFullScreen(!isZloginFullScreen)}
              title={
                isZloginFullScreen ? "Exit Full Screen" : "Enter Full Screen"
              }
            >
              <span className="icon">
                <i
                  className={`fas ${isZloginFullScreen ? "fa-compress" : "fa-expand"}`}
                />
              </span>
              <span>{isZloginFullScreen ? "Exit" : "Full"}</span>
            </button>
            <button
              className="button is-small"
              onClick={() => setShowZloginConsole(false)}
              title="Close Console"
            >
              <span className="icon">
                <i className="fas fa-times" />
              </span>
              <span>Exit</span>
            </button>
          </div>
        </header>
        <section className="modal-card-body p-0 zw-modal-body">
          <ZoneShell
            key={`zlogin-modal-${selectedZone}-${modalReadOnly ? "ro" : "rw"}`}
            zoneName={selectedZone}
            readOnly={modalReadOnly}
            context="modal"
          />
        </section>
      </div>
    </div>
  );
};

ZloginModal.propTypes = {
  showZloginConsole: PropTypes.bool.isRequired,
  setShowZloginConsole: PropTypes.func.isRequired,
  isZloginFullScreen: PropTypes.bool.isRequired,
  setIsZloginFullScreen: PropTypes.func.isRequired,
  selectedZone: PropTypes.string,
  handleZloginConsole: PropTypes.func.isRequired,
  handleZloginModalPaste: PropTypes.func.isRequired,
  user: PropTypes.shape({
    role: PropTypes.string,
  }),
  zoneDetails: PropTypes.shape({
    active_vnc_session: PropTypes.bool,
  }),
  setShowVncConsole: PropTypes.func.isRequired,
  handleVncConsole: PropTypes.func.isRequired,
  loadingVnc: PropTypes.bool.isRequired,
  setLoading: PropTypes.func.isRequired,
  makeZoneweaverAPIRequest: PropTypes.func.isRequired,
  currentServer: PropTypes.shape({
    hostname: PropTypes.string,
    port: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    protocol: PropTypes.string,
  }),
  forceZoneSessionCleanup: PropTypes.func.isRequired,
  refreshZloginSessionStatus: PropTypes.func.isRequired,
  setError: PropTypes.func.isRequired,
  modalReadOnly: PropTypes.bool.isRequired,
  setModalReadOnly: PropTypes.func.isRequired,
};

export default ZloginModal;
