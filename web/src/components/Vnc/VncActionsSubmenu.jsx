import PropTypes from "prop-types";
import { useState } from "react";

const VncActionsSubmenu = ({
  vncRef,
  isAdmin,
  isReadOnly,
  onToggleReadOnly,
  onClipboardPaste,
  onScreenshot,
  onFullScreen,
  onNewTab,
  calculateSubmenuPosition,
  onClose,
}) => {
  const [showActions, setShowActions] = useState(false);

  const handleScreenshot = () => {
    if (onScreenshot) {
      onScreenshot();
    } else if (vncRef?.current) {
      const canvas = vncRef.current.getCanvas?.();
      if (canvas) {
        canvas.toBlob((blob) => {
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `vnc-screenshot-${Date.now()}.png`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        });
      }
    }
    onClose();
  };

  const handleFullScreen = () => {
    if (onFullScreen) {
      onFullScreen();
    }
    onClose();
  };

  const handleNewTab = () => {
    if (onNewTab) {
      onNewTab();
    }
    onClose();
  };

  return (
    <div
      className="dropdown-item is-relative is-flex is-justify-content-space-between is-align-items-center"
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div className="is-flex is-align-items-center">
        <span className="icon mr-2">
          <i className="fas fa-tools" />
        </span>
        <span>Actions</span>
      </div>
      <span className="icon">
        <i className="fas fa-chevron-right" />
      </span>

      {showActions && (
        <div className={`dropdown-menu ${calculateSubmenuPosition(300)}`}>
          <div className="dropdown-content">
            {isAdmin && onToggleReadOnly && (
              <>
                <div
                  className="dropdown-item is-clickable"
                  onClick={() => {
                    onToggleReadOnly();
                    onClose();
                  }}
                  title={
                    isReadOnly
                      ? "Enable interactive mode"
                      : "Enable read-only mode"
                  }
                >
                  <span className="icon mr-2">
                    <i className={`fas ${isReadOnly ? "fa-edit" : "fa-eye"}`} />
                  </span>
                  <span>
                    {isReadOnly ? "Enable Interactive" : "Set Read-Only"}
                  </span>
                </div>
                <hr className="dropdown-divider" />
              </>
            )}

            {(onClipboardPaste || vncRef?.current?.clipboardPaste) && (
              <>
                <div
                  className="dropdown-item is-clickable"
                  onClick={async () => {
                    try {
                      if (navigator.clipboard && navigator.clipboard.readText) {
                        const text = await navigator.clipboard.readText();
                        if (text) {
                          if (vncRef?.current?.clipboardPaste) {
                            vncRef.current.clipboardPaste(text);
                          } else if (onClipboardPaste) {
                            onClipboardPaste(text);
                          }
                        }
                      }
                    } catch (error) {
                      console.error(
                        "📋 VNC DROPDOWN: Error reading clipboard:",
                        error
                      );
                    }
                    onClose();
                  }}
                >
                  <span className="icon mr-2">
                    <i className="fas fa-paste" />
                  </span>
                  <span>Paste from Browser Clipboard</span>
                </div>
                <hr className="dropdown-divider" />
              </>
            )}

            <div
              className="dropdown-item is-clickable"
              onClick={handleScreenshot}
            >
              <span className="icon mr-2">
                <i className="fas fa-camera" />
              </span>
              <span>Take Screenshot</span>
            </div>

            {onFullScreen && (
              <div
                className="dropdown-item is-clickable"
                onClick={handleFullScreen}
              >
                <span className="icon mr-2">
                  <i className="fas fa-expand" />
                </span>
                <span>Full Screen</span>
              </div>
            )}

            {onNewTab && (
              <div
                className="dropdown-item is-clickable"
                onClick={handleNewTab}
              >
                <span className="icon mr-2">
                  <i className="fas fa-external-link-alt" />
                </span>
                <span>Open in New Tab</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

VncActionsSubmenu.propTypes = {
  vncRef: PropTypes.object,
  isAdmin: PropTypes.bool,
  isReadOnly: PropTypes.bool,
  onToggleReadOnly: PropTypes.func,
  onClipboardPaste: PropTypes.func,
  onScreenshot: PropTypes.func,
  onFullScreen: PropTypes.func,
  onNewTab: PropTypes.func,
  calculateSubmenuPosition: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default VncActionsSubmenu;
