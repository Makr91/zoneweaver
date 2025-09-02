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

  // Create addons once (avoid recreating on every render)
  const addonsRef = useRef(null);
  const [isReady, setIsReady] = useState(false);

  // Initialize addons once
  if (!addonsRef.current) {
    addonsRef.current = {
      fitAddon: new FitAddon(),
      serializeAddon: new SerializeAddon(),
      clipboardAddon: new ClipboardAddon(),
      webLinksAddon: new WebLinksAddon(),
      searchAddon: new SearchAddon(),
    };

    // Try WebGL addon with fallback
    try {
      addonsRef.current.webglAddon = new WebglAddon();
    } catch (error) {
      console.warn("🖥️ WebGL addon not available:", error);
      addonsRef.current.webglAddon = null;
    }
  }

  console.log("🖥️ HOSTSHELL: Render with session:", {
    sessionId: session?.id,
    wsState: session?.websocket?.readyState,
    hasInstance: !!instance,
    isReady,
    timestamp: new Date().toISOString(),
  });

  // OFFICIAL StrictMode solution from GitHub issue #1
  useEffect(() => {
    if (instance) {
      console.log("🖥️ HOSTSHELL: Initializing terminal (GitHub issue #1 pattern)");
      
      // Follow the exact pattern from the maintainer's solution
      instance.writeln("Host terminal ready...");
      instance.onData((data) => {
        if (!session?.websocket || session.websocket.readyState !== WebSocket.OPEN) {
          instance.write(data); // Local echo when no WebSocket
        }
      });

      // Load addons after basic setup
      instance.loadAddon(addonsRef.current.fitAddon);
      instance.loadAddon(addonsRef.current.clipboardAddon);
      instance.loadAddon(addonsRef.current.webLinksAddon);
      instance.loadAddon(addonsRef.current.serializeAddon);
      instance.loadAddon(addonsRef.current.searchAddon);

      if (addonsRef.current.webglAddon) {
        try {
          addonsRef.current.webglAddon.onContextLoss?.(() => 
            addonsRef.current.webglAddon.dispose()
          );
          instance.loadAddon(addonsRef.current.webglAddon);
        } catch (error) {
          console.warn("🖥️ WebGL loading failed:", error);
        }
      }

      console.log("🖥️ HOSTSHELL: Terminal initialized successfully");
    }
  }, [instance]); // The effect will run only once when the `instance` is initialized.

  // Handle WebSocket attachment separately
  useEffect(() => {
    console.log("🖥️ HOSTSHELL: WebSocket effect running", {
      hasInstance: !!instance,
      hasSession: !!session,
      hasWebSocket: !!session?.websocket,
      wsState: session?.websocket?.readyState,
    });

    if (!instance || !session?.websocket) {
      setIsReady(false);
      return;
    }

    const websocket = session.websocket;

    // Listen for WebSocket state changes
    const checkConnection = () => {
      if (websocket.readyState === WebSocket.OPEN) {
        console.log("🖥️ HOSTSHELL: WebSocket ready, creating AttachAddon");

        // Create AttachAddon for WebSocket communication
        const attachAddon = new AttachAddon(websocket);
        instance.loadAddon(attachAddon);
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
          console.log("🖥️ HOSTSHELL: Cleaning up AttachAddon");
          onResizeDisposable?.dispose();
          attachAddon?.dispose();
          setIsReady(false);
        };
      }
    };

    // Check immediately
    checkConnection();

    // Also listen for WebSocket events
    const onOpen = () => {
      console.log("🖥️ HOSTSHELL: WebSocket opened event");
      checkConnection();
    };

    const onClose = () => {
      console.log("🖥️ HOSTSHELL: WebSocket closed event");
      setIsReady(false);
    };

    websocket.addEventListener('open', onOpen);
    websocket.addEventListener('close', onClose);

    return () => {
      websocket.removeEventListener('open', onOpen);
      websocket.removeEventListener('close', onClose);
    };
  }, [instance, session?.websocket]); // Simplified dependencies

  // Handle footer resize events
  useEffect(() => {
    const handleFooterResize = () => {
      if (addonsRef.current?.fitAddon && instance) {
        setTimeout(() => addonsRef.current.fitAddon.fit?.(), 50);
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
      className="terminal xterm is-fullheight is-fullwidth"
    />
  );
};

export default HostShell;
