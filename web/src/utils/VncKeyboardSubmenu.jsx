import PropTypes from "prop-types";
import { useState } from "react";

import { keysymMap, sendKeyWithModifiers } from "../../utils/vncKeyUtils";

const VncKeyboardSubmenu = ({
  vncRef,
  modifierKeys,
  setModifierKeys,
  calculateSubmenuPosition,
  onClose,
  handleCtrlAltDel,
}) => {
  const [showFunctionKeys, setShowFunctionKeys] = useState(false);
  const [showKeyboardInput, setShowKeyboardInput] = useState(false);

  const toggleModifier = (key) => {
    setModifierKeys((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const buildKeyString = (baseKey) => {
    const modifiers = [];
    if (modifierKeys.ctrl) {
      modifiers.push("ctrl");
    }
    if (modifierKeys.alt) {
      modifiers.push("alt");
    }
    if (modifierKeys.shift) {
      modifiers.push("shift");
    }

    if (modifiers.length > 0) {
      return `${modifiers.join("-")}-${baseKey.toLowerCase()}`;
    }
    return baseKey.toLowerCase();
  };

  const handleKeyboardShortcut = (keyCode, keysym, withModifiers = true) => {
    if (vncRef?.current?.sendKey) {
      const activeModifiers = withModifiers
        ? Object.keys(modifierKeys).filter((mod) => modifierKeys[mod])
        : [];
      console.log(
        `🎹 VNC DROPDOWN: Sending key: ${keyCode} (keysym: 0x${keysym.toString(16)}) with modifiers: [${activeModifiers.join(", ")}]`
      );

      try {
        sendKeyWithModifiers(vncRef.current, keysym, keyCode, activeModifiers);
        onClose();
      } catch (error) {
        console.error(
          `❌ VNC DROPDOWN: Error sending keyboard shortcut:`,
          error
        );
      }
    }
  };

  return (
    <div
      className="dropdown-item is-relative is-flex is-justify-content-space-between is-align-items-center"
      onMouseEnter={() => setShowKeyboardInput(true)}
      onMouseLeave={() => setShowKeyboardInput(false)}
    >
      <div className="is-flex is-align-items-center">
        <span className="icon mr-2">
          <i className="fas fa-keyboard" />
        </span>
        <span>Keyboard & Input</span>
      </div>
      <span className="icon">
        <i className="fas fa-chevron-right" />
      </span>

      {showKeyboardInput && (
        <div
          className={`dropdown-menu has-z-index-modal-high ${calculateSubmenuPosition(350)}`}
        >
          <div className="dropdown-content">
            <div className="dropdown-item has-text-weight-semibold has-text-grey-dark">
              <span className="icon mr-2">
                <i className="fas fa-keyboard" />
              </span>
              <span>Common Shortcuts</span>
            </div>
            <hr className="dropdown-divider" />

            <div
              className="dropdown-item is-clickable"
              onClick={handleCtrlAltDel}
            >
              <span className="icon mr-2">
                <i className="fas fa-power-off" />
              </span>
              <span>Ctrl+Alt+Del</span>
            </div>

            <div
              className="dropdown-item is-clickable"
              onClick={() => handleKeyboardShortcut("Alt+Tab", keysymMap.tab)}
            >
              <span className="icon mr-2">
                <i className="fas fa-window-restore" />
              </span>
              <span>Alt+Tab</span>
            </div>

            <div
              className="dropdown-item is-clickable"
              onClick={() => handleKeyboardShortcut("Alt+F4", keysymMap.f4)}
            >
              <span className="icon mr-2">
                <i className="fas fa-times" />
              </span>
              <span>Alt+F4</span>
            </div>

            <hr className="dropdown-divider" />

            <div className="dropdown-item has-text-weight-semibold has-text-grey-dark">
              <span className="icon mr-2">
                <i className="fas fa-hand-paper" />
              </span>
              <span>Modifier Keys</span>
            </div>

            <div className="dropdown-item px-3 py-2">
              <div className="field is-grouped">
                {["ctrl", "alt", "shift"].map((mod) => (
                  <div className="control" key={mod}>
                    <button
                      className={`button is-small ${modifierKeys[mod] ? (mod === "alt" ? "is-warning" : mod === "shift" ? "is-info" : "is-primary") : "is-light"}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleModifier(mod);
                      }}
                      title={`${mod.toUpperCase()} ${modifierKeys[mod] ? "ON" : "OFF"} - Click to toggle`}
                    >
                      <span className="icon is-small">
                        <i
                          className={`fas ${modifierKeys[mod] ? "fa-toggle-on" : "fa-toggle-off"}`}
                        />
                      </span>
                      <span>{mod.toUpperCase()}</span>
                    </button>
                  </div>
                ))}
              </div>
              {(modifierKeys.ctrl ||
                modifierKeys.alt ||
                modifierKeys.shift) && (
                <div className="help is-size-7 has-text-grey mt-1">
                  Active modifiers will be combined with function keys
                </div>
              )}
            </div>

            <hr className="dropdown-divider" />

            <div
              className="dropdown-item is-relative"
              onMouseEnter={() => setShowFunctionKeys(true)}
              onMouseLeave={() => setShowFunctionKeys(false)}
            >
              <span className="icon mr-2">
                <i className="fas fa-keyboard" />
              </span>
              <span>Function Keys</span>
              <span className="icon ml-auto">
                <i className="fas fa-chevron-right" />
              </span>

              {showFunctionKeys && (
                <div className="dropdown-menu has-z-index-modal-top zw-dropdown-function-keys">
                  <div className="dropdown-content">
                    {[...Array(12)].map((_, i) => {
                      const fKeyNum = i + 1;
                      const keyCode = `F${fKeyNum}`;
                      const keysym = keysymMap[`f${fKeyNum}`];
                      return (
                        <div
                          key={i}
                          className="dropdown-item is-clickable"
                          onClick={() =>
                            handleKeyboardShortcut(keyCode, keysym, true)
                          }
                          title={`Send ${modifierKeys.ctrl || modifierKeys.alt || modifierKeys.shift ? buildKeyString(`F${fKeyNum}`) : `F${fKeyNum}`} to guest`}
                        >
                          <span className="icon mr-2">
                            <i className="fas fa-keyboard" />
                          </span>
                          <span>F{fKeyNum}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

VncKeyboardSubmenu.propTypes = {
  vncRef: PropTypes.object,
  modifierKeys: PropTypes.object.isRequired,
  setModifierKeys: PropTypes.func.isRequired,
  calculateSubmenuPosition: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
  handleCtrlAltDel: PropTypes.func.isRequired,
};

export default VncKeyboardSubmenu;
