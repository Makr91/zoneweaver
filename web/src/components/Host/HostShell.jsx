import React, { useEffect, useRef } from "react";
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

  // Use useXTerm hook exactly like Qovery
  const { instance, ref } = useXTerm({
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
  });

  // Create addons once
  const fitAddon = useRef(new FitAddon()).current;
  const attachAddonRef = useRef(null);

  console.log("🖥️ HOSTSHELL: Render with session:", {
    sessionId: session?.id,
    wsState: session?.websocket?.readyState,
    hasInstance: !!instance,
    timestamp: new Date().toISOString(),
  });

  // Load addons when instance is ready (Qovery pattern)
  useEffect(() => {
    if (!instance) return;

    console.log("🖥️ HOSTSHELL: Loading addons on instance");

    // Load the fit addon
    instance.loadAddon(fitAddon);

    // Load other addons
    instance.loadAddon(new ClipboardAddon());
    instance.loadAddon(new WebLinksAddon());
    instance.loadAddon(new SerializeAddon());
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

    const handleResize = () => fitAddon.fit();

    // Handle resize event
    window.addEventListener("resize", handleResize);

    // Initial fit
    setTimeout(() => fitAddon.fit(), 100);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [ref, instance]); // Qovery dependencies

  // Handle WebSocket connection (simplified)
  useEffect(() => {
    if (
      !instance ||
      !session?.websocket ||
      session.websocket.readyState !== WebSocket.OPEN
    ) {
      return;
    }

    console.log("🖥️ HOSTSHELL: WebSocket ready, loading AttachAddon");

    // Create and load AttachAddon
    const attachAddon = new AttachAddon(session.websocket);
    attachAddonRef.current = attachAddon;
    instance.loadAddon(attachAddon);

    // Handle terminal resize
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
        } catch (error) {
          console.warn(
            "🖥️ HOSTSHELL: Failed to communicate size to backend:",
            error
          );
        }
      }
    });

    // Send initial terminal size
    try {
      session.websocket.send(
        JSON.stringify({
          rows: instance.rows,
          cols: instance.cols,
        })
      );
    } catch (error) {
      console.warn("🖥️ HOSTSHELL: Failed to send initial size:", error);
    }

    return () => {
      onResizeDisposable.dispose();
      attachAddon.dispose();
    };
  }, [instance, session?.websocket?.readyState, session?.id]);

  // Listen for footer resize events
  useEffect(() => {
    const handleFooterResize = () => {
      if (fitAddon) {
        setTimeout(() => fitAddon.fit(), 50);
      }
    };

    window.addEventListener("footer-resized", handleFooterResize);
    return () => {
      window.removeEventListener("footer-resized", handleFooterResize);
    };
  }, [fitAddon]);

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
          <p>Connecting to terminal...</p>
          <p className="is-size-7 has-text-grey">
            Loading terminal interface...
          </p>
        </div>
      </div>
    );
  }

  // Simple div with ref (Qovery pattern)
  return (
    <div
      ref={ref}
      style={{ height: "100%", width: "100%" }}
      className="is-fullheight is-fullwidth"
    />
  );
};

export default HostShell;
