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

  const { instance, ref } = useXTerm();

  const addonsRef = useRef(null);
  const [isReady, setIsReady] = useState(false);

  if (!addonsRef.current) {
    addonsRef.current = {
      fitAddon: new FitAddon(),
      serializeAddon: new SerializeAddon(),
      clipboardAddon: new ClipboardAddon(),
      webLinksAddon: new WebLinksAddon(),
      searchAddon: new SearchAddon(),
    };

    try {
      addonsRef.current.webglAddon = new WebglAddon();
    } catch (error) {
      addonsRef.current.webglAddon = null;
    }
  }

  useEffect(() => {
    if (instance && ref?.current) {
      try {
        // CRITICAL: Manually attach terminal to DOM element
        instance.open(ref.current);
      } catch (error) {
        console.error("HOSTSHELL: Failed to attach terminal to DOM:", error);
      }
    }
  }, [instance, ref?.current]);

  // Terminal initialization following GitHub issue #1 pattern
  useEffect(() => {
    if (instance) {
      try {
        // Basic terminal setup
        instance.writeln("Host terminal ready...");
        
        // Set up local echo ONLY when WebSocket is not connected
        instance.onData((data) => {
          if (!session?.websocket || session.websocket.readyState !== WebSocket.OPEN) {
            instance.write(data); // Local echo when no WebSocket
          }
        });

        // Load addons
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
            console.error("HOSTSHELL: WebGL addon failed:", error);
          }
        }
      } catch (error) {
        console.error("HOSTSHELL: Terminal initialization failed:", error);
      }
    }
  }, [instance]);

  // Handle WebSocket attachment separately
  useEffect(() => {

    if (!instance || !session?.websocket) {
      setIsReady(false);
      return;
    }

    const websocket = session.websocket;

    const checkConnection = () => {
      if (websocket.readyState === WebSocket.OPEN) {
        const attachAddon = new AttachAddon(websocket);
        instance.loadAddon(attachAddon);
        setIsReady(true);

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
              console.error("HOSTSHELL: Failed to communicate size:", error);
            }
          }
        });

        // NOTE: Removed initial size send to prevent JSON garbage in terminal

        return () => {
          onResizeDisposable?.dispose();
          attachAddon?.dispose();
          setIsReady(false);
        };
      }
    };

    checkConnection();

    const onOpen = () => {
      checkConnection();
    };

    const onClose = () => {
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

  if (!instance) {
    return (
      <div className="is-fullheight is-fullwidth is-flex is-align-items-center is-justify-content-center has-text-white-ter">
        <div className="has-text-centered">
          <div className="icon is-large mb-2">
            <i className="fas fa-terminal fa-2x fa-pulse"></i>
          </div>
          <p>Loading terminal...</p>
          <p className="is-size-7 has-text-grey">
            Initializing xterm.js
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ position: "relative", height: "100%", width: "100%" }}>
      {/* Terminal div - ALWAYS render when instance exists */}
      <div
        ref={ref}
        style={{ height: "100%", width: "100%" }}
        className="terminal xterm is-fullheight is-fullwidth"
      />
      
      {/* Connection status overlay when not ready */}
      {!isReady && (
        <div 
          style={{
            position: "absolute",
            top: "8px",
            right: "8px",
            backgroundColor: "rgba(0, 0, 0, 0.8)",
            color: "white",
            padding: "4px 8px",
            borderRadius: "4px",
            fontSize: "0.7rem",
            zIndex: 20
          }}
        >
          <i className="fas fa-plug fa-pulse mr-1"></i>
          {session?.websocket?.readyState === WebSocket.CONNECTING
            ? "Connecting..."
            : "Waiting for server"}
        </div>
      )}
    </div>
  );
};

export default HostShell;
