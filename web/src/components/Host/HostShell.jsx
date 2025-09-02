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

  // Simple useXTerm hook like official Qovery example
  const { instance, ref } = useXTerm();

  // Create addons like official examples
  const fitAddon = new FitAddon();
  const serializeAddon = new SerializeAddon();

  // Terminal history preservation
  const [isReady, setIsReady] = useState(false);

  console.log("🖥️ HOSTSHELL: Render with session:", {
    sessionId: session?.id,
    wsState: session?.websocket?.readyState,
    hasInstance: !!instance,
    isReady,
    timestamp: new Date().toISOString(),
  });

  // Immediate setup like official Qovery example (no useEffect needed)
  if (instance) {
    // Load addons immediately
    instance.loadAddon?.(fitAddon);
    instance.loadAddon?.(new ClipboardAddon());
    instance.loadAddon?.(new WebLinksAddon());
    instance.loadAddon?.(serializeAddon);
    instance.loadAddon?.(new SearchAddon());

    // Try WebGL addon
    try {
      const webglAddon = new WebglAddon();
      webglAddon.onContextLoss?.(() => webglAddon.dispose());
      instance.loadAddon?.(webglAddon);
    } catch (error) {
      console.warn("🖥️ WebGL:", error);
    }
  }

  // Handle WebSocket connection when ready
  useEffect(() => {
    if (!instance || !session?.websocket) {
      setIsReady(false);
      return;
    }

    const websocket = session.websocket;

    if (websocket.readyState === WebSocket.OPEN) {
      console.log("🖥️ HOSTSHELL: WebSocket ready, creating AttachAddon");

      // Create AttachAddon
      const attachAddon = new AttachAddon(websocket);
      instance.loadAddon?.(attachAddon);
      setIsReady(true);

      // Set up resize communication
      const onResizeDisposable = instance.onResize?.(({ cols, rows }) => {
        if (websocket.readyState === WebSocket.OPEN) {
          try {
            websocket.send(
              JSON.stringify({
                type: "resize",
                rows: rows,
                cols: cols,
              })
            );
          } catch (error) {
            console.warn("🖥️ HOSTSHELL: Failed to communicate size:", error);
          }
        }
      });

      // Send initial size
      try {
        websocket.send(
          JSON.stringify({
            rows: instance.rows,
            cols: instance.cols,
          })
        );
      } catch (error) {
        console.warn("🖥️ HOSTSHELL: Failed to send initial size:", error);
      }

      return () => {
        onResizeDisposable?.dispose();
        attachAddon?.dispose();
      };
    }
  }, [instance, session?.websocket?.readyState, session?.id]);

  // Handle footer resize events
  useEffect(() => {
    const handleFooterResize = () => {
      if (fitAddon && instance) {
        setTimeout(() => fitAddon.fit?.(), 50);
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

  // Simple div with ref like official Qovery example
  return (
    <div
      ref={ref}
      style={{ height: "100%", width: "100%" }}
      className="is-fullheight is-fullwidth"
    />
  );
};

export default HostShell;
