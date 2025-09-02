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

  // EXTREME DEBUG: Track component lifecycle
  console.log("🔥 HOSTSHELL: Component function called", {
    timestamp: new Date().toISOString(),
    renderCount: ++window.hostShellRenderCount || (window.hostShellRenderCount = 1)
  });

  // Simple useXTerm hook like official Qovery example
  const { instance, ref } = useXTerm();

  // EXTREME DEBUG: Track useXTerm hook state
  console.log("🔥 HOSTSHELL: useXTerm hook result:", {
    instanceType: typeof instance,
    instanceConstructor: instance?.constructor?.name,
    instanceMethods: instance ? Object.getOwnPropertyNames(instance) : [],
    refType: typeof ref,
    refCurrent: ref?.current,
    refCurrentType: typeof ref?.current,
    refCurrentChildren: ref?.current?.children?.length,
    refCurrentHTML: ref?.current?.innerHTML,
    timestamp: new Date().toISOString(),
  });

  // Create addons once (avoid recreating on every render)
  const addonsRef = useRef(null);
  const [isReady, setIsReady] = useState(false);

  // Initialize addons once
  if (!addonsRef.current) {
    console.log("🔥 HOSTSHELL: Initializing addons for first time");
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
      console.log("🔥 HOSTSHELL: WebGL addon created successfully");
    } catch (error) {
      console.warn("🔥 HOSTSHELL: WebGL addon failed:", error);
      addonsRef.current.webglAddon = null;
    }

    console.log("🔥 HOSTSHELL: Addons initialized:", Object.keys(addonsRef.current));
  } else {
    console.log("🔥 HOSTSHELL: Reusing existing addons");
  }

  // EXTREME DEBUG: Component state logging
  console.log("🔥 HOSTSHELL: Current component state:", {
    sessionId: session?.id,
    wsState: session?.websocket?.readyState,
    hasInstance: !!instance,
    instanceReady: !!instance && typeof instance.write === 'function',
    isReady,
    refCurrent: !!ref?.current,
    refCurrentType: ref?.current?.constructor?.name,
    timestamp: new Date().toISOString(),
  });

  // OFFICIAL StrictMode solution from GitHub issue #1
  useEffect(() => {
    console.log("🔥 HOSTSHELL: useEffect [instance] triggered", {
      hasInstance: !!instance,
      instanceType: typeof instance,
      instanceConstructor: instance?.constructor?.name,
      effectRunCount: ++window.hostShellEffectCount || (window.hostShellEffectCount = 1),
      timestamp: new Date().toISOString(),
    });

    if (instance) {
      console.log("🔥 HOSTSHELL: Instance exists, starting initialization");
      console.log("🔥 HOSTSHELL: Instance details:", {
        instanceMethods: Object.getOwnPropertyNames(instance).slice(0, 20), // First 20 methods
        hasWrite: typeof instance.write === 'function',
        hasWriteln: typeof instance.writeln === 'function',  
        hasOnData: typeof instance.onData === 'function',
        hasLoadAddon: typeof instance.loadAddon === 'function',
        element: instance.element,
        elementType: instance.element?.constructor?.name,
        elementChildren: instance.element?.children?.length,
      });

      try {
        console.log("🔥 HOSTSHELL: Calling instance.writeln()");
        const writeResult = instance.writeln("Host terminal ready...");
        console.log("🔥 HOSTSHELL: writeln() result:", writeResult);

        console.log("🔥 HOSTSHELL: Setting up onData handler");
        const onDataResult = instance.onData((data) => {
          console.log("🔥 HOSTSHELL: onData triggered with:", data);
          if (!session?.websocket || session.websocket.readyState !== WebSocket.OPEN) {
            console.log("🔥 HOSTSHELL: Writing local echo:", data);
            instance.write(data); // Local echo when no WebSocket
          } else {
            console.log("🔥 HOSTSHELL: WebSocket active, skipping local echo");
          }
        });
        console.log("🔥 HOSTSHELL: onData() result:", onDataResult);

        // Check DOM state after writeln
        setTimeout(() => {
          console.log("🔥 HOSTSHELL: DOM state after writeln:", {
            refCurrent: !!ref?.current,
            refCurrentHTML: ref?.current?.innerHTML?.substring(0, 200),
            refCurrentChildren: ref?.current?.children?.length,
            refCurrentChildrenDetails: ref?.current ? Array.from(ref.current.children).map(child => ({
              tagName: child.tagName,
              className: child.className,
              innerHTML: child.innerHTML?.substring(0, 100)
            })) : [],
            instanceElement: !!instance.element,
            instanceElementHTML: instance.element?.innerHTML?.substring(0, 200)
          });
        }, 100);

        console.log("🔥 HOSTSHELL: Loading addons...");
        
        // Load addons with detailed logging
        try {
          console.log("🔥 HOSTSHELL: Loading FitAddon");
          instance.loadAddon(addonsRef.current.fitAddon);
          console.log("🔥 HOSTSHELL: FitAddon loaded successfully");
        } catch (error) {
          console.error("🔥 HOSTSHELL: FitAddon failed:", error);
        }

        try {
          console.log("🔥 HOSTSHELL: Loading ClipboardAddon");
          instance.loadAddon(addonsRef.current.clipboardAddon);
          console.log("🔥 HOSTSHELL: ClipboardAddon loaded successfully");
        } catch (error) {
          console.error("🔥 HOSTSHELL: ClipboardAddon failed:", error);
        }

        try {
          console.log("🔥 HOSTSHELL: Loading WebLinksAddon");
          instance.loadAddon(addonsRef.current.webLinksAddon);
          console.log("🔥 HOSTSHELL: WebLinksAddon loaded successfully");
        } catch (error) {
          console.error("🔥 HOSTSHELL: WebLinksAddon failed:", error);
        }

        try {
          console.log("🔥 HOSTSHELL: Loading SerializeAddon");
          instance.loadAddon(addonsRef.current.serializeAddon);
          console.log("🔥 HOSTSHELL: SerializeAddon loaded successfully");
        } catch (error) {
          console.error("🔥 HOSTSHELL: SerializeAddon failed:", error);
        }

        try {
          console.log("🔥 HOSTSHELL: Loading SearchAddon");
          instance.loadAddon(addonsRef.current.searchAddon);
          console.log("🔥 HOSTSHELL: SearchAddon loaded successfully");
        } catch (error) {
          console.error("🔥 HOSTSHELL: SearchAddon failed:", error);
        }

        if (addonsRef.current.webglAddon) {
          try {
            console.log("🔥 HOSTSHELL: Loading WebGL addon");
            addonsRef.current.webglAddon.onContextLoss?.(() => 
              addonsRef.current.webglAddon.dispose()
            );
            instance.loadAddon(addonsRef.current.webglAddon);
            console.log("🔥 HOSTSHELL: WebGL addon loaded successfully");
          } catch (error) {
            console.error("🔥 HOSTSHELL: WebGL addon failed:", error);
          }
        }

        console.log("🔥 HOSTSHELL: All addons loaded, checking final DOM state");
        
        // Final DOM check
        setTimeout(() => {
          console.log("🔥 HOSTSHELL: FINAL DOM STATE:", {
            refCurrent: !!ref?.current,
            refCurrentHTML: ref?.current?.innerHTML,
            refCurrentChildren: ref?.current?.children?.length,
            refCurrentChildrenDetails: ref?.current ? Array.from(ref.current.children).map(child => ({
              tagName: child.tagName,
              className: child.className,
              id: child.id,
              style: child.style?.cssText,
              innerHTML: child.innerHTML?.substring(0, 100)
            })) : [],
            instanceElement: !!instance.element,
            instanceElementHTML: instance.element?.innerHTML?.substring(0, 200),
            instanceRows: instance.rows,
            instanceCols: instance.cols,
          });
        }, 500);

        console.log("🔥 HOSTSHELL: Terminal initialization completed successfully");

      } catch (error) {
        console.error("🔥 HOSTSHELL: Terminal initialization FAILED:", error);
        console.error("🔥 HOSTSHELL: Error stack:", error.stack);
      }
    } else {
      console.log("🔥 HOSTSHELL: No instance available, skipping initialization");
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

  // ALWAYS render the terminal div when instance exists - let terminal attach to DOM
  console.log("🔥 HOSTSHELL: Rendering terminal div with ref:", {
    hasInstance: !!instance,
    hasRef: !!ref,
    isReady,
    refCurrent: ref?.current,
    timestamp: new Date().toISOString(),
  });

  return (
    <div style={{ position: "relative", height: "100%", width: "100%" }}>
      {/* Terminal div - ALWAYS render when instance exists */}
      <div
        ref={ref}
        style={{ height: "100%", width: "100%" }}
        className="terminal xterm is-fullheight is-fullwidth"
      />
      
      {/* Overlay when not ready */}
      {!isReady && (
        <div 
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.7)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 10
          }}
          className="has-text-white-ter"
        >
          <div className="has-text-centered">
            <div className="icon is-large mb-2">
              <i className="fas fa-terminal fa-2x fa-pulse"></i>
            </div>
            <p>Connecting to server...</p>
            <p className="is-size-7 has-text-grey">
              {session?.websocket?.readyState === WebSocket.CONNECTING
                ? "Establishing connection"
                : "Waiting for WebSocket"}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default HostShell;
