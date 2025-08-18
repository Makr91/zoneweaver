import React, { createContext, useState, useEffect, useContext, useCallback, useRef } from 'react';
import { useServers } from './ServerContext';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { WebLinksAddon } from '@xterm/addon-web-links';
import '@xterm/xterm/css/xterm.css';
import axios from 'axios';

const ZoneTerminalContext = createContext();

export const useZoneTerminal = () => {
  return useContext(ZoneTerminalContext);
};

export const ZoneTerminalProvider = ({ children }) => {
  const { currentServer, stopZloginSession: apiStopZloginSession } = useServers();
  const [term, setTerm] = useState(null);

  const terminalsMap = useRef(new Map());
  const sessionsMap = useRef(new Map());
  const websocketsMap = useRef(new Map());
  const fitAddonsMap = useRef(new Map());
  const onDataListenersMap = useRef(new Map());
  const creatingSessionsSet = useRef(new Set());

  const getZoneKey = useCallback((server, zoneName) => {
    if (!server || !zoneName) return null;
    return `${server.hostname}:${server.port}:${zoneName}`;
  }, []);

  const createOrReuseTerminalSession = useCallback(async (server, zoneName) => {
    const zoneKey = getZoneKey(server, zoneName);
    if (!zoneKey) return null;

    if (creatingSessionsSet.current.has(zoneKey)) {
      console.log(`⏳ ZLOGIN SESSION: Creation already in progress for ${zoneKey}`);
      return null;
    }

    if (sessionsMap.current.has(zoneKey)) {
      console.log(`✅ ZLOGIN SESSION: Reusing existing session for ${zoneKey}`);
      return sessionsMap.current.get(zoneKey);
    }

    creatingSessionsSet.current.add(zoneKey);

    try {
      console.log(`🚀 ZLOGIN SESSION: Starting new session for ${zoneKey}`);
      const response = await axios.post(`/api/servers/${server.hostname}/zones/${zoneName}/zlogin/start`);

      if (!response.data.success || !response.data.session) {
        console.error(`❌ ZLOGIN SESSION: Backend failed to start session for ${zoneKey}:`, response.data.error);
        return null;
      }

      const sessionData = response.data.session;
      if (!sessionData.websocket_url) {
        console.error(`🚫 ZLOGIN SESSION: Missing websocket_url for ${zoneKey}!`);
        return null;
      }

      const wsUrl = `wss://${window.location.host}${sessionData.websocket_url}`;
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => console.log(`🔗 ZONE TERMINAL: WebSocket connected for ${zoneKey}`);
      ws.onclose = () => {
        console.log(`🔗 ZONE TERMINAL: WebSocket closed for ${zoneKey}`);
        websocketsMap.current.delete(zoneKey);
      };
      ws.onerror = (error) => console.error(`🚨 ZONE TERMINAL: WebSocket error for ${zoneKey}:`, error);

      ws.onmessage = (event) => {
        const terminal = terminalsMap.current.get(zoneKey);
        if (terminal) {
          const data = event.data;
          if (data instanceof Blob) {
            data.text().then(text => terminal.write(text));
          } else {
            terminal.write(data);
          }
        }
      };

      sessionsMap.current.set(zoneKey, sessionData);
      websocketsMap.current.set(zoneKey, ws);

      console.log(`🎉 ZONE TERMINAL: Session and WebSocket created successfully for ${zoneKey}`);
      return sessionData;
    } catch (error) {
      console.error(`💥 ZONE TERMINAL: Failed to create session for ${zoneKey}:`, error);
      return null;
    } finally {
      creatingSessionsSet.current.delete(zoneKey);
    }
  }, [getZoneKey]);

  const attachTerminal = useCallback((terminalRef, zoneName, readOnly = false) => {
    const zoneKey = getZoneKey(currentServer, zoneName);
    if (!terminalRef.current || !zoneKey) return () => {};

    if (terminalsMap.current.has(zoneKey)) {
        const oldTerminal = terminalsMap.current.get(zoneKey);
        try {
            oldTerminal.dispose();
        } catch (e) {
            console.warn("Old terminal already disposed");
        }
    }

    const newTerm = new Terminal({
      cursorBlink: !readOnly,
      theme: { background: '#000000' },
      disableStdin: readOnly,
    });
    const fitAddon = new FitAddon();
    newTerm.loadAddon(fitAddon);
    newTerm.loadAddon(new WebLinksAddon());
    newTerm.open(terminalRef.current);

    if (readOnly) {
        newTerm.write('\r\n\x1b[33m[READ-ONLY MODE - Console output only]\x1b[0m\r\n');
    }

    terminalsMap.current.set(zoneKey, newTerm);
    fitAddonsMap.current.set(zoneKey, fitAddon);
    if (getZoneKey(currentServer, zoneName) === zoneKey) {
      setTerm(newTerm);
    }

    const sessionData = sessionsMap.current.get(zoneKey);
    const ws = websocketsMap.current.get(zoneKey);

    if (sessionData && ws) {
      console.log(`✅ ZONE ATTACH: Connecting UI to existing session for ${zoneKey}`);
      if (sessionData.buffer) {
        newTerm.write(sessionData.buffer);
      }
      if (!readOnly) {
        if (onDataListenersMap.current.has(zoneKey)) {
          onDataListenersMap.current.get(zoneKey).dispose();
        }
        const onDataListener = newTerm.onData((data) => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(data);
          }
        });
        onDataListenersMap.current.set(zoneKey, onDataListener);
      } else {
         if (onDataListenersMap.current.has(zoneKey)) {
          onDataListenersMap.current.get(zoneKey).dispose();
          onDataListenersMap.current.delete(zoneKey);
        }
      }
    } else {
      newTerm.write('\r\n\x1b[33m[NO ACTIVE ZLOGIN SESSION]\x1b[0m\r\n');
      newTerm.write('\x1b[37m[Click the zlogin button to start a new session]\x1b[0m\r\n');
    }

    fitAddon.fit();

    return () => {
        try {
            newTerm.dispose();
            terminalsMap.current.delete(zoneKey);
            fitAddonsMap.current.delete(zoneKey);
            if (onDataListenersMap.current.has(zoneKey)) {
                onDataListenersMap.current.get(zoneKey).dispose();
                onDataListenersMap.current.delete(zoneKey);
            }
        } catch (e) {
            console.warn("Terminal already disposed during cleanup");
        }
    };
  }, [getZoneKey, currentServer]);

  const forceZoneSessionCleanup = useCallback(async (server, zoneName) => {
    const zoneKey = getZoneKey(server, zoneName);
    if (!zoneKey) return;

    console.log(`🧹 ZLOGIN CLEANUP: Force cleaning up session state for ${zoneKey}`);
    
    const sessionData = sessionsMap.current.get(zoneKey);
    if (sessionData) {
        try {
            await apiStopZloginSession(server.hostname, server.port, server.protocol, sessionData.id);
        } catch (e) {
            console.warn("Failed to stop session on backend during cleanup", e);
        }
    }

    const ws = websocketsMap.current.get(zoneKey);
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.close();
    }
    
    const terminal = terminalsMap.current.get(zoneKey);
    if (terminal) {
      terminal.dispose();
    }

    if (onDataListenersMap.current.has(zoneKey)) {
      onDataListenersMap.current.get(zoneKey).dispose();
    }

    sessionsMap.current.delete(zoneKey);
    websocketsMap.current.delete(zoneKey);
    terminalsMap.current.delete(zoneKey);
    fitAddonsMap.current.delete(zoneKey);
    onDataListenersMap.current.delete(zoneKey);

    console.log(`✅ ZLOGIN CLEANUP: Complete cleanup finished for ${zoneKey}`);
  }, [getZoneKey, apiStopZloginSession]);

  const startZloginSessionExplicitly = useCallback(async (server, zoneName) => {
    console.log(`🎬 START ZLOGIN: User explicitly requested session start for ${getZoneKey(server, zoneName)}`);
    return await createOrReuseTerminalSession(server, zoneName);
  }, [createOrReuseTerminalSession]);

  const value = React.useMemo(() => ({
    term,
    attachTerminal,
    forceZoneSessionCleanup,
    startZloginSessionExplicitly
  }), [term, attachTerminal, forceZoneSessionCleanup, startZloginSessionExplicitly]);

  return (
    <ZoneTerminalContext.Provider value={value}>
      {children}
    </ZoneTerminalContext.Provider>
  );
};
