import { useEffect, useState, useCallback, useRef, useMemo } from "react";
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

  // Create stable addon refs
  const fitAddonRef = useRef(null);
  const webLinksAddonRef = useRef(null);
  const serializeAddonRef = useRef(null);
  const clipboardAddonRef = useRef(null);
  const searchAddonRef = useRef(null);
  const webglAddonRef = useRef(null);

  // Initialize addons once
  if (!fitAddonRef.current) {
    fitAddonRef.current = new FitAddon();
    webLinksAddonRef.current = new WebLinksAddon();
    serializeAddonRef.current = new SerializeAddon();
    clipboardAddonRef.current = new ClipboardAddon();
    searchAddonRef.current = new SearchAddon();

    // WebGL addon with error handling
    try {
      webglAddonRef.current = new WebglAddon();
      webglAddonRef.current.onContextLoss(() =>
        webglAddonRef.current.dispose()
      );
    } catch {
      console.log("🖥️ HOSTSHELL: WebGL not supported, using canvas renderer");
      webglAddonRef.current = null;
    }
  }

  // Terminal history preservation
  const terminalHistoryRef = useRef("");

  // Addon state management (like your working version)
  const [attachAddon, setAttachAddon] = useState(null);
  const [isReady, setIsReady] = useState(false);

  console.log("🖥️ HOSTSHELL: Render with session:", {
    sessionId: session?.id,
    wsState: session?.websocket?.readyState,
    isReady,
    hasHistory: terminalHistoryRef.current.length > 0,
    timestamp: new Date().toISOString(),
  });

  // Debounced resize handling
  const debounceTimeoutRef = useRef(null);

  // Handle resize function with debouncing
  const handleResize = useCallback(() => {
    // Clear any existing timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    // Immediate fit for responsiveness
    if (fitAddonRef.current) {
      fitAddonRef.current.fit();
    }

    // Debounced backend communication
    debounceTimeoutRef.current = setTimeout(() => {
      if (instance && session?.websocket?.readyState === WebSocket.OPEN) {
        try {
          session.websocket.send(
            JSON.stringify({
              type: "resize",
              rows: instance.rows,
              cols: instance.cols,
            })
          );
          console.log("🖥️ HOSTSHELL: Debounced size communicated to backend");
        } catch (error) {
          console.warn(
            "🖥️ HOSTSHELL: Failed to communicate debounced size:",
            error
          );
        }
      }
    }, 300); // Wait 300ms after user stops dragging

    console.log("🖥️ HOSTSHELL: Terminal fitted");
  }, [instance, session?.websocket]);

  // Handle terminal data
  const handleData = useCallback((data) => {
    console.log("🖥️ HOSTSHELL: Terminal data:", data.length, "bytes");
  }, []);

  // Preserve terminal history utility
  const preserveTerminalHistory = useCallback(() => {
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
  }, [instance]);

  // Restore terminal history utility
  const restoreTerminalHistory = useCallback(() => {
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
  }, []);

  // Create addon array based on WebSocket state
  const addons = useMemo(() => {
    const baseAddons = [
      fitAddonRef.current,
      webLinksAddonRef.current,
      serializeAddonRef.current,
      clipboardAddonRef.current,
      searchAddonRef.current,
    ];

    // Add WebGL if available
    if (webglAddonRef.current) {
      baseAddons.push(webglAddonRef.current);
    }

    // Add AttachAddon if WebSocket is ready
    if (attachAddon) {
      baseAddons.push(attachAddon);
    }

    return baseAddons.filter((addon) => addon !== null);
  }, [attachAddon]);

  // Stable useXTerm params using useMemo (Komodo pattern)
  const terminalParams = useMemo(
    () => ({
      options: {
        cursorBlink: true,
        theme: {
          background: "#000000",
          foreground: "#ffffff",
        },
        scrollback: 10000,
        fontSize: 14,
        fontFamily:
          '"Cascadia Code", Consolas, "Liberation Mono", Menlo, Courier, monospace',
        allowTransparency: false,
        convertEol: false,
      },
      listeners: {
        onResize: handleResize,
        onData: handleData,
      },
      addons: addons, // Pass addons as props like Komodo!
    }),
    [addons, handleResize, handleData]
  );

  // Use useXTerm with stable params (Komodo pattern)
  const { instance, ref } = useXTerm(terminalParams);

  // Manage AttachAddon based on WebSocket state (like your working version)
  useEffect(() => {
    if (!session?.websocket) {
      setAttachAddon(null);
      setIsReady(false);
      return;
    }

    const handleWebSocketReady = () => {
      console.log(
        "🖥️ HOSTSHELL: WebSocket ready, creating AttachAddon for session:",
        session.id
      );

      // Preserve history before changing connection
      preserveTerminalHistory();

      // Create new AttachAddon for this WebSocket
      const newAttachAddon = new AttachAddon(session.websocket);
      setAttachAddon(newAttachAddon);
      setIsReady(true);

      // Restore history after connection is established
      setTimeout(() => {
        restoreTerminalHistory();

        // Ensure terminal is properly fitted and scrolled after content load
        setTimeout(() => {
          if (fitAddonRef.current && instance) {
            fitAddonRef.current.fit();
            // Scroll to bottom to show latest content
            instance.scrollToBottom();
            console.log(
              "🖥️ HOSTSHELL: Terminal fitted and scrolled to bottom after history restore"
            );
          }
        }, 100);
      }, 200);
    };

    const handleWebSocketError = () => {
      console.log("🖥️ HOSTSHELL: WebSocket error, preserving history");
      preserveTerminalHistory();
      setAttachAddon(null);
      setIsReady(false);
    };

    const handleWebSocketClose = () => {
      console.log("🖥️ HOSTSHELL: WebSocket closed, preserving history");
      preserveTerminalHistory();
    };

    if (session.websocket.readyState === WebSocket.OPEN) {
      handleWebSocketReady();
    } else if (session.websocket.readyState === WebSocket.CONNECTING) {
      session.websocket.addEventListener("open", handleWebSocketReady);
      session.websocket.addEventListener("error", handleWebSocketError);
      session.websocket.addEventListener("close", handleWebSocketClose);

      return () => {
        session.websocket.removeEventListener("open", handleWebSocketReady);
        session.websocket.removeEventListener("error", handleWebSocketError);
        session.websocket.removeEventListener("close", handleWebSocketClose);
      };
    }
  }, [
    session?.websocket,
    session?.id,
    preserveTerminalHistory,
    restoreTerminalHistory,
  ]);

  // Handle resize communication to backend
  useEffect(() => {
    if (!instance || !session?.websocket) return;

    const onResizeDisposable = instance.onResize(({ cols, rows }) => {
      console.log(
        "🖥️ HOSTSHELL: Terminal resized to",
        cols,
        "columns and",
        rows,
        "rows"
      );

      if (session.websocket.readyState === WebSocket.OPEN) {
        try {
          session.websocket.send(
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

    return () => {
      onResizeDisposable.dispose();
    };
  }, [instance, session?.websocket]);

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

  if (!isReady || !attachAddon) {
    return (
      <div className="is-fullheight is-fullwidth is-flex is-align-items-center is-justify-content-center has-text-white-ter">
        <div className="has-text-centered">
          <div className="icon is-large mb-2">
            <i className="fas fa-terminal fa-2x fa-pulse"></i>
          </div>
          <p>Connecting to terminal...</p>
          <p className="is-size-7 has-text-grey">
            {session.websocket?.readyState === WebSocket.CONNECTING
              ? "Establishing connection"
              : "Preparing session"}
          </p>
        </div>
      </div>
    );
  }

  // Simple div with ref (Komodo/useXTerm pattern)
  return (
    <div
      ref={ref}
      style={{ height: "100%", width: "100%" }}
      className="is-fullheight is-fullwidth"
    />
  );
};

export default HostShell;
