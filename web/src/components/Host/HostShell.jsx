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
        instance.open(ref.current);
      } catch (error) {
        console.error("HOSTSHELL: Failed to attach terminal to DOM:", error);
      }
    }
  }, [instance, ref?.current]);

  useEffect(() => {
    if (instance) {
      try {
        instance.writeln("Host terminal ready...");

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

        return () => {
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
  }, [instance, session?.websocket]);

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
    <div className="is-fullheight is-fullwidth">
      <div
        ref={ref}
        className="is-fullheight is-fullwidth"
      />
      
      {!isReady && (
        <div className="notification is-dark is-small is-pulled-right mt-1 mr-1">
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
