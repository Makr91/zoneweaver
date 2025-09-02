import { useEffect, useState, useRef } from "react";
import { useXTerm } from "react-xtermjs";
import { FitAddon } from "@xterm/addon-fit";
import { AttachAddon } from "@xterm/addon-attach";
import { WebLinksAddon } from "@xterm/addon-web-links";
import { SerializeAddon } from "@xterm/addon-serialize";
import { ClipboardAddon } from "@xterm/addon-clipboard";
import { SearchAddon } from "@xterm/addon-search";
import { WebglAddon } from "@xterm/addon-webgl";
import { useFooter } from "../../contexts/FooterContext";

const HostShell = () => {
  const { session } = useFooter();

  // Create stable addon refs (prevents re-creation on every render)
  const fitAddonRef = useRef(null);
  const serializeAddonRef = useRef(null);
  const terminalHistoryRef = useRef("");
  const attachAddonRef = useRef(null);

  // Ready state tracking (like original working version)
  const [isReady, setIsReady] = useState(false);

  // Initialize addons once
  useEffect(() => {
    if (!fitAddonRef.current) {
      fitAddonRef.current = new FitAddon();
      serializeAddonRef.current = new SerializeAddon();
      console.log("🖥️ HOSTSHELL: Stable addons created");
    }
  }, []); // Empty deps - only run once

  // Simple useXTerm hook like working examples
  const { instance, ref } = useXTerm();

  console.log("🖥️ HOSTSHELL: Render with session:", {
    sessionId: session?.id,
    wsState: session?.websocket?.readyState,
    hasInstance: !!instance,
    timestamp: new Date().toISOString(),
  });

  // Simple functions (no useCallback to avoid circular dependencies)
  const preserveTerminalHistory = () => {
    if (serializeAddonRef.current && instance) {
      try {
        const serializedContent = serializeAddonRef.current.serialize();
        terminalHistoryRef.current = serializedContent;
        console.log(
          "🖥️ HOSTSHELL: Terminal history preserved",
          serializedContent.length,
          "characters"
        );
      } catch (error) {
        console.warn(
          "🖥️ HOSTSHELL: Failed to preserve terminal history:",
          error
        );
      }
    }
  };

  const restoreTerminalHistory = () => {
    if (terminalHistoryRef.current && instance) {
      try {
        instance.clear();
        instance.write(terminalHistoryRef.current);
        console.log("🖥️ HOSTSHELL: Terminal history restored");
      } catch (error) {
        console.warn(
          "🖥️ HOSTSHELL: Failed to restore terminal history:",
          error
        );
      }
    }
  };

  // Load addons when instance is ready (exactly like working examples)
  useEffect(() => {
    if (instance && fitAddonRef.current) {
      console.log("🖥️ HOSTSHELL: Loading addons on instance");

      // Load addons directly on instance using refs
      instance.loadAddon(fitAddonRef.current);
      instance.loadAddon(new ClipboardAddon());
      instance.loadAddon(new WebLinksAddon());
      instance.loadAddon(serializeAddonRef.current);
      instance.loadAddon(new SearchAddon());

      // Try WebGL addon if supported
      try {
        const webglAddon = new WebglAddon();
        webglAddon.onContextLoss(() => webglAddon.dispose());
        instance.loadAddon(webglAddon);
        console.log("🖥️ HOSTSHELL: WebGL renderer loaded");
      } catch (error) {
        console.log("🖥️ HOSTSHELL: WebGL failed to load:", error);
      }

      const handleResize = () => {
        if (fitAddonRef.current) {
          fitAddonRef.current.fit();
        }
      };

      // Handle resize event
      window.addEventListener("resize", handleResize);

      // Initial fit
      setTimeout(() => {
        if (fitAddonRef.current) {
          fitAddonRef.current.fit();
        }
      }, 100);

      return () => {
        window.removeEventListener("resize", handleResize);
      };
    }
  }, [instance]);

  // Handle WebSocket and AttachAddon
  useEffect(() => {
    if (!instance || !session?.websocket) {
      return;
    }

    const websocket = session.websocket;

    const handleWebSocketReady = () => {
      console.log(
        "🖥️ HOSTSHELL: WebSocket ready, creating AttachAddon for session:",
        session.id
      );

      // Preserve history before changing connection
      preserveTerminalHistory();

      // Clean up existing attach addon
      if (attachAddonRef.current) {
        attachAddonRef.current.dispose();
        attachAddonRef.current = null;
      }

      // Create new AttachAddon for this WebSocket
      const attachAddon = new AttachAddon(websocket);
      attachAddonRef.current = attachAddon;
      instance.loadAddon(attachAddon);

      // Set ready state (like original working version)
      setIsReady(true);

      // Handle terminal resize - communicate to backend
      const onResizeDisposable = instance.onResize(({ cols, rows }) => {
        console.log(
          "🖥️ HOSTSHELL: Terminal resized to",
          cols,
          "columns and",
          rows,
          "rows"
        );

        if (websocket.readyState === WebSocket.OPEN) {
          try {
            websocket.send(
              JSON.stringify({
                type: "resize",
                rows: rows,
                cols: cols,
              })
            );
            console.log("🖥️ HOSTSHELL: Size communicated to backend");
          } catch (error) {
            console.warn(
              "🖥️ HOSTSHELL: Failed to communicate size to backend:",
              error
            );
          }
        }
      });

      // Send initial terminal size
      if (websocket.readyState === WebSocket.OPEN) {
        websocket.send(
          JSON.stringify({
            type: "resize",
            rows: instance.rows,
            cols: instance.cols,
          })
        );
        console.log("🖥️ HOSTSHELL: Initial terminal size sent to backend");
      }

      // Restore history after connection is established
      setTimeout(() => {
        restoreTerminalHistory();
      }, 200);

      // Store cleanup function
      attachAddonRef.current._onResizeDisposable = onResizeDisposable;
    };

    const handleWebSocketError = () => {
      console.log("🖥️ HOSTSHELL: WebSocket error, preserving history");
      preserveTerminalHistory();
      setIsReady(false);
    };

    const handleWebSocketClose = () => {
      console.log("🖥️ HOSTSHELL: WebSocket closed, preserving history");
      preserveTerminalHistory();
      setIsReady(false);
    };

    if (websocket.readyState === WebSocket.OPEN) {
      handleWebSocketReady();
    } else if (websocket.readyState === WebSocket.CONNECTING) {
      websocket.addEventListener("open", handleWebSocketReady);
      websocket.addEventListener("error", handleWebSocketError);
      websocket.addEventListener("close", handleWebSocketClose);

      return () => {
        websocket.removeEventListener("open", handleWebSocketReady);
        websocket.removeEventListener("error", handleWebSocketError);
        websocket.removeEventListener("close", handleWebSocketClose);

        // Clean up attach addon and its resize handler
        if (attachAddonRef.current) {
          if (attachAddonRef.current._onResizeDisposable) {
            attachAddonRef.current._onResizeDisposable.dispose();
          }
          attachAddonRef.current.dispose();
          attachAddonRef.current = null;
        }
      };
    }

    return () => {
      // Clean up attach addon and its resize handler
      if (attachAddonRef.current) {
        if (attachAddonRef.current._onResizeDisposable) {
          attachAddonRef.current._onResizeDisposable.dispose();
        }
        attachAddonRef.current.dispose();
        attachAddonRef.current = null;
      }
    };
  }, [instance, session?.websocket, session?.id]);

  // Listen for footer resize events
  useEffect(() => {
    const handleFooterResize = () => {
      if (fitAddonRef.current && instance) {
        setTimeout(() => {
          fitAddonRef.current.fit();
          console.log("🖥️ HOSTSHELL: Terminal refitted after footer resize");
        }, 50);
      }
    };

    window.addEventListener("footer-resized", handleFooterResize);
    return () => {
      window.removeEventListener("footer-resized", handleFooterResize);
    };
  }, [instance]);

  if (!session) {
    return (
      <div className="is-fullheight is-fullwidth is-flex is-align-items-center is-justify-content-center has-text-white-ter">
        <div className="has-text-centered">
          <div className="icon is-large mb-2">
            <i className="fas fa-terminal fa-2x"></i>
          </div>
          <p>No session available</p>
          <p className="is-size-7 has-text-grey">
            Select a server to start terminal
          </p>
        </div>
      </div>
    );
  }

  if (!instance || !isReady) {
    return (
      <div className="is-fullheight is-fullwidth is-flex is-align-items-center is-justify-content-center has-text-white-ter">
        <div className="has-text-centered">
          <div className="icon is-large mb-2">
            <i className="fas fa-terminal fa-2x fa-pulse"></i>
          </div>
          <p>Connecting to terminal...</p>
          <p className="is-size-7 has-text-grey">
            {session?.websocket?.readyState === WebSocket.CONNECTING
              ? "Establishing connection"
              : "Preparing session"}
          </p>
        </div>
      </div>
    );
  }

  // Simple div with ref (exactly like working examples)
  return (
    <div
      ref={ref}
      style={{ height: "100%", width: "100%" }}
      className="is-fullheight is-fullwidth"
    />
  );
};

export default HostShell;
