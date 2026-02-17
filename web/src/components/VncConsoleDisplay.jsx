import PropTypes from "prop-types";
import React from "react";

import VncActionsDropdown from "./VncActionsDropdown";
import VncViewerReact from "./VncViewerReact";

const VncConsoleDisplay = ({
  zoneDetails,
  selectedZone,
  currentServer,
  user,
  loading,
  loadingVnc,
  previewVncViewOnly,
  vncReconnectKey,
  vncSettings,
  vncRef,
  hasZlogin,
  setLoading,
  setError,
  setPreviewVncViewOnly,
  setZoneDetails,
  setActiveConsoleType,
  startZloginSessionExplicitly,
  handleVncConsole,
  handleKillVncSession,
  handleVncQualityChange,
  handleVncCompressionChange,
  handleVncResizeChange,
  handleVncShowDotChange,
  handleVncClipboardPaste,
}) => (
  <div className="zw-console-container">
    {/* VNC Console Header */}
    <div className="has-background-dark has-text-white p-3 is-flex is-justify-content-space-between is-align-items-center">
      <div>
        <h6 className="title is-7 has-text-white mb-1">Active VNC Session</h6>
        {zoneDetails.vnc_session_info &&
          zoneDetails.vnc_session_info.web_port && (
            <p className="is-size-7 has-text-white-ter mb-0">
              Port: {zoneDetails.vnc_session_info.web_port} | Started:{" "}
              {zoneDetails.vnc_session_info.created_at
                ? new Date(
                    zoneDetails.vnc_session_info.created_at
                  ).toLocaleString()
                : "Unknown"}
            </p>
          )}
      </div>
      <div className="buttons m-0">
        <VncActionsDropdown
          vncRef={vncRef}
          variant="button"
          onToggleReadOnly={() => {
            console.log(
              `🔧 VNC READ-ONLY: Toggling from ${previewVncViewOnly} to ${!previewVncViewOnly}`
            );
            setPreviewVncViewOnly(!previewVncViewOnly);
          }}
          onScreenshot={() => {
            const vncContainer = document.querySelector(
              ".vnc-viewer-react canvas"
            );
            if (vncContainer) {
              vncContainer.toBlob((blob) => {
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
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
          isReadOnly={previewVncViewOnly}
          isAdmin={
            user?.role === "admin" ||
            user?.role === "super-admin" ||
            user?.role === "organization-admin"
          }
          quality={vncSettings.quality}
          compression={vncSettings.compression}
          resize={vncSettings.resize}
          showDot={vncSettings.showDot}
          onQualityChange={handleVncQualityChange}
          onCompressionChange={handleVncCompressionChange}
          onResizeChange={handleVncResizeChange}
          onShowDotChange={handleVncShowDotChange}
          onClipboardPaste={handleVncClipboardPaste}
        />
        {!previewVncViewOnly && (
          <button
            className="button is-small is-info"
            onClick={async () => {
              try {
                const text = await navigator.clipboard.readText();
                if (text && vncRef.current?.clipboardPaste) {
                  console.log(
                    `📋 VNC PREVIEW PASTE: Pasting ${text.length} characters`
                  );
                  vncRef.current.clipboardPaste(text);
                }
              } catch (error) {
                console.error("📋 VNC PREVIEW PASTE: Error:", error);
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
          onClick={() => handleVncConsole(selectedZone)}
          disabled={loading || loadingVnc}
          title="Expand VNC Console"
        >
          <span className="icon is-small">
            <i className="fas fa-expand" />
          </span>
        </button>
        {hasZlogin ? (
          <button
            className="button is-small is-warning"
            onClick={() => {
              console.log(
                `🔄 PREVIEW SWITCH: Switching to zlogin preview from VNC`
              );
              setActiveConsoleType("zlogin");
            }}
            title="Switch to zlogin Console"
          >
            <span className="icon is-small">
              <i className="fas fa-terminal" />
            </span>
          </button>
        ) : (
          <button
            className="button is-small is-warning"
            onClick={async () => {
              console.log(
                `🚀 START ZLOGIN: Starting zlogin for preview from VNC`
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
              <i
                className={`fas ${loading ? "fa-spinner fa-pulse" : "fa-terminal"}`}
              />
            </span>
          </button>
        )}
      </div>
    </div>

    {/* VNC Console Content */}
    <div className="zw-console-content">
      {(() => {
        if (zoneDetails.vnc_session_info) {
          return (
            <VncViewerReact
              ref={vncRef}
              key={`vnc-preview-${selectedZone}-${previewVncViewOnly}-${vncReconnectKey}`}
              serverHostname={currentServer.hostname}
              serverPort={currentServer.port}
              serverProtocol={currentServer.protocol}
              zoneName={selectedZone}
              viewOnly={previewVncViewOnly}
              autoConnect
              showControls={false}
              quality={vncSettings.quality}
              compression={vncSettings.compression}
              resize={vncSettings.resize}
              showDot={vncSettings.showDot}
              resizeSession={vncSettings.resize === "remote"}
              onClipboard={(event) => {
                console.log(
                  "📋 VNC PREVIEW: Clipboard received from server:",
                  event
                );
              }}
              className="zw-vnc-container"
            />
          );
        }
        if (zoneDetails.configuration?.zonepath) {
          return (
            <img
              src={`/api/servers/${encodeURIComponent(currentServer.hostname)}:${currentServer.port}/zones/${encodeURIComponent(selectedZone)}/screenshot`}
              alt={`Screenshot of ${selectedZone}`}
              className="zw-console-screenshot"
              onError={(e) => {
                e.target.style.display = "none";
                if (e.target.nextElementSibling) {
                  e.target.nextElementSibling.style.display = "flex";
                }
              }}
              onLoad={(e) => {
                if (e.target.nextElementSibling) {
                  e.target.nextElementSibling.style.display = "none";
                }
              }}
            />
          );
        }
        return null;
      })()}

      {!(
        zoneDetails.vnc_session_info?.proxy_url ||
        zoneDetails.vnc_session_info?.console_url
      ) && (
        <div
          className={
            zoneDetails.configuration?.zonepath
              ? "zw-console-placeholder-none"
              : "zw-console-placeholder-hidden"
          }
        >
          <div className="has-text-centered">
            <div className="has-margin-bottom-12px">
              <img
                src="/images/startcloud.svg"
                alt="Start Console"
                className="zw-startup-icon"
              />
            </div>
            <div className="is-size-6 has-text-weight-medium">
              No Console Session
            </div>
            <div className="is-size-7 mt-6 opacity-07">
              Click Console to start session
            </div>
          </div>
        </div>
      )}
    </div>
  </div>
);

VncConsoleDisplay.propTypes = {
  zoneDetails: PropTypes.shape({
    vnc_session_info: PropTypes.shape({
      web_port: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      created_at: PropTypes.string,
      proxy_url: PropTypes.string,
      console_url: PropTypes.string,
    }),
    configuration: PropTypes.shape({
      zonepath: PropTypes.string,
    }),
  }).isRequired,
  selectedZone: PropTypes.string,
  currentServer: PropTypes.shape({
    hostname: PropTypes.string,
    port: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    protocol: PropTypes.string,
  }),
  user: PropTypes.shape({
    role: PropTypes.string,
  }),
  loading: PropTypes.bool,
  loadingVnc: PropTypes.bool,
  previewVncViewOnly: PropTypes.bool,
  vncReconnectKey: PropTypes.number,
  vncSettings: PropTypes.object,
  vncRef: PropTypes.object,
  hasZlogin: PropTypes.bool,
  setLoading: PropTypes.func,
  setError: PropTypes.func,
  setPreviewVncViewOnly: PropTypes.func,
  setZoneDetails: PropTypes.func,
  setActiveConsoleType: PropTypes.func,
  startZloginSessionExplicitly: PropTypes.func,
  handleVncConsole: PropTypes.func,
  handleKillVncSession: PropTypes.func,
  handleVncQualityChange: PropTypes.func,
  handleVncCompressionChange: PropTypes.func,
  handleVncResizeChange: PropTypes.func,
  handleVncShowDotChange: PropTypes.func,
  handleVncClipboardPaste: PropTypes.func,
};

export default React.memo(VncConsoleDisplay);
