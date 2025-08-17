import React, { createContext, useState, useEffect, useContext, useCallback, useRef } from 'react';
import { useServers } from './ServerContext';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { WebLinksAddon } from '@xterm/addon-web-links';
import '@xterm/xterm/css/xterm.css';
import axios from 'axios';

// ⚡ SESSION COOKIE MANAGEMENT - For Backend Session Reuse Optimization
const generateBrowserFingerprint = () => {
  let browserFingerprint = localStorage.getItem('browser_id');
  if (!browserFingerprint) {
    browserFingerprint = crypto.randomUUID();
    localStorage.setItem('browser_id', browserFingerprint);
  }
  return browserFingerprint;
};

const generateTerminalCookie = (server) => {
  const browserFingerprint = generateBrowserFingerprint();
  return `terminal_${server.hostname}_${server.port}_${browserFingerprint}_${Date.now()}`;
};

const getOrCreateSessionCookie = (server) => {
  if (!server) return null;
  
  const storageKey = `terminal_session_${server.hostname}:${server.port}`;
  let sessionCookie = localStorage.getItem(storageKey);
  
  if (!sessionCookie) {
    sessionCookie = generateTerminalCookie(server);
    localStorage.setItem(storageKey, sessionCookie);
    console.log(`🆕 SESSION COOKIE: Generated new session cookie for ${server.hostname}:${server.port} - ${sessionCookie}`);
  } else {
    console.log(`♻️ SESSION COOKIE: Reusing existing session cookie for ${server.hostname}:${server.port} - ${sessionCookie}`);
  }
  
  return sessionCookie;
};

const clearSessionCookie = (server) => {
  if (!server) return;
  
  const storageKey = `terminal_session_${server.hostname}:${server.port}`;
  localStorage.removeItem(storageKey);
  console.log(`🧹 SESSION COOKIE: Cleared session cookie for ${server.hostname}:${server.port}`);
};

// Optional health check function
const validateSessionHealth = async (server, terminalCookie) => {
  if (!server || !terminalCookie) return false;
  
  try {
    const response = await axios.get(`/api/servers/${server.hostname}:${server.port}/terminal/sessions/${terminalCookie}/health`);
    const isHealthy = response.data.healthy;
    console.log(`🏥 HEALTH CHECK: Session ${terminalCookie} health: ${isHealthy}`);
    return isHealthy;
  } catch (error) {
    console.warn(`🏥 HEALTH CHECK: Failed to check session health for ${terminalCookie}:`, error);
    return false;
  }
};

const ZoneTerminalContext = createContext();

export const useZoneTerminal = () => {
  return useContext(ZoneTerminalContext);
};

export const ZoneTerminalProvider = ({ children }) => {
  const { currentServer, startZloginSession, stopZloginSession } = useServers();
  const [term, setTerm] = useState(null);
  const [session, setSession] = useState(null);

  // Map-based storage for multiple zone sessions
  // Key format: "${hostname}:${port}:${zoneName}"
  const terminalsMap = useRef(new Map());           // zoneKey -> terminal instance
  const sessionsMap = useRef(new Map());            // zoneKey -> session data  
  const websocketsMap = useRef(new Map());          // zoneKey -> websocket
  const fitAddonsMap = useRef(new Map());           // zoneKey -> fit addon
  const terminalModesMap = useRef(new Map());       // zoneKey -> readOnly mode
  const creatingSessionsSet = useRef(new Set());    // zoneKey -> creating flag
  const attachingTerminalsSet = useRef(new Set());  // zoneKey -> attaching flag
  const initialPromptSentSet = useRef(new Set());   // zoneKey -> prompt sent flag

  // Helper function to generate unique zone key
  const getZoneKey = useCallback((server, zoneName) => {
    if (!server || !zoneName) return null;
    return `${server.hostname}:${server.port}:${zoneName}`;
  }, []);

  // Cleanup effect - now handles multiple sessions
  useEffect(() => {
    return () => {
      // Cleanup all active sessions on unmount
      console.log('🧹 ZONE TERMINAL: Cleaning up all sessions');
      
      // Close all WebSockets
      websocketsMap.current.forEach((ws, zoneKey) => {
        if (ws && ws.readyState === WebSocket.OPEN) {
          console.log(`🔗 ZONE TERMINAL: Closing WebSocket for ${zoneKey}`);
          ws.close();
        }
      });
      
      // Stop all sessions
      sessionsMap.current.forEach(async (session, zoneKey) => {
        if (session && session.id) {
          const [hostname, port] = zoneKey.split(':');
          console.log(`🛑 ZONE TERMINAL: Stopping session ${session.id} for ${zoneKey}`);
          try {
            await stopZloginSession(hostname, parseInt(port), 'https', session.id);
          } catch (error) {
            console.warn(`Failed to stop session for ${zoneKey}:`, error);
          }
        }
      });
      
      // Dispose all terminals
      terminalsMap.current.forEach((terminal, zoneKey) => {
        if (terminal) {
          console.log(`🖥️ ZONE TERMINAL: Disposing terminal for ${zoneKey}`);
          try {
            terminal.dispose();
          } catch (error) {
            console.warn(`Failed to dispose terminal for ${zoneKey}:`, error);
          }
        }
      });
      
      // Clear all maps
      terminalsMap.current.clear();
      sessionsMap.current.clear();
      websocketsMap.current.clear();
      fitAddonsMap.current.clear();
      terminalModesMap.current.clear();
      creatingSessionsSet.current.clear();
      attachingTerminalsSet.current.clear();
      initialPromptSentSet.current.clear();
    };
  }, [stopZloginSession]);

  // Helper function to find existing session for a zone
  const findExistingSession = useCallback(async (server, zoneName) => {
    if (!server || !zoneName) return null;

    try {
      const result = await axios.get(`/api/servers/${server.hostname}:${server.port}/zlogin/sessions`);
      if (result.data.success && result.data.sessions) {
        return result.data.sessions.find(session => 
          session.zone_name === zoneName && session.status === 'active'
        );
      }
    } catch (error) {
      console.warn('Error checking for existing sessions:', error);
    }
    return null;
  }, []);

  // ⚡ NEW SESSION REUSE LOGIC - Uses Backend Terminal Cookie API
  const createOrReuseTerminalSession = useCallback(async (server, zoneName) => {
    if (!server || !zoneName) {
      console.error('🚫 TERMINAL SESSION: Invalid server or zone name');
      return null;
    }

    const zoneKey = getZoneKey(server, zoneName);
    if (!zoneKey) return null;

    // Check if we're already creating a session for this zone
    if (creatingSessionsSet.current.has(zoneKey)) {
      console.log(`⏳ TERMINAL SESSION: Already creating session for ${zoneKey}`);
      return null;
    }

    // Check if we already have a session for this zone
    if (sessionsMap.current.has(zoneKey)) {
      console.log(`✅ TERMINAL SESSION: Reusing existing session for ${zoneKey}`);
      return sessionsMap.current.get(zoneKey);
    }

    creatingSessionsSet.current.add(zoneKey);

    try {
      // Step 1: Get or create terminal cookie for session persistence
      const terminalCookie = getOrCreateSessionCookie(server);
      if (!terminalCookie) {
        console.error(`🚫 TERMINAL SESSION: Failed to generate terminal cookie for ${zoneKey}`);
        return null;
      }

      console.log(`🚀 TERMINAL SESSION: Starting session with cookie ${terminalCookie} for ${zoneKey}`);

      // Step 2: Call new backend API with terminal_cookie
      const response = await axios.post(`/api/servers/${server.hostname}:${server.port}/terminal/start`, {
        terminal_cookie: terminalCookie,
        zone_name: zoneName
      });

      if (!response.data.success) {
        console.error(`❌ TERMINAL SESSION: Backend failed to start session for ${zoneKey}:`, response.data.error);
        
        // Clear cached session cookie on error to force retry
        clearSessionCookie(server);
        return null;
      }

      const sessionData = response.data.data;
      
      // Step 3: Log performance tracking
      if (sessionData.reused) {
        console.log(`⚡ TERMINAL REUSE: Session ${terminalCookie} reused for ${zoneKey} (INSTANT ~200ms)`);
      } else {
        console.log(`🆕 TERMINAL CREATE: New session ${terminalCookie} created for ${zoneKey} (~2s)`);
      }

      // Step 4: Display buffer content if available (reconnection context)
      if (sessionData.buffer && sessionData.buffer.trim()) {
        console.log(`📜 TERMINAL BUFFER: Restoring ${sessionData.buffer.split('\n').length} lines of history for ${zoneKey}`);
      }

      // Step 5: Create WebSocket connection using backend-provided URL
      const wsUrl = `wss://${window.location.host}${sessionData.websocket_url}`;
      console.log(`🔗 TERMINAL SESSION: Connecting WebSocket to ${wsUrl}`);
      const ws = new WebSocket(wsUrl);

      const handleZoneMessage = (event) => {
        console.log(`📨 ZONE TERMINAL: WebSocket message received for ${zoneKey}`, {
          sessionId: sessionData.id,
          dataType: typeof event.data,
          isBlob: event.data instanceof Blob,
          dataLength: event.data.length || (event.data.size || 'unknown'),
          timestamp: new Date().toISOString()
        });

        const terminal = terminalsMap.current.get(zoneKey);
        if (terminal) {
          console.log(`✅ ZONE TERMINAL: Terminal exists for ${zoneKey}, processing message`);
          
          if (event.data instanceof Blob) {
            console.log(`📄 ZONE TERMINAL: Processing Blob data for ${zoneKey}`);
            event.data.text().then(text => {
              console.log(`📝 ZONE TERMINAL: Blob converted to text for ${zoneKey}:`, {
                textLength: text.length,
                textPreview: text.substring(0, 100),
                textContent: text
              });
              try {
                terminal.write(text);
                console.log(`✅ ZONE TERMINAL: Successfully wrote Blob text to terminal for ${zoneKey}`);
              } catch (error) {
                console.error(`❌ ZONE TERMINAL: Error writing Blob text to terminal for ${zoneKey}:`, error);
              }
            }).catch(error => {
              console.error(`❌ ZONE TERMINAL: Error converting Blob to text for ${zoneKey}:`, error);
            });
          } else {
            console.log(`📝 ZONE TERMINAL: Processing string data for ${zoneKey}:`, {
              dataLength: event.data.length,
              dataPreview: event.data.substring(0, 100),
              dataContent: event.data
            });
            try {
              terminal.write(event.data);
              console.log(`✅ ZONE TERMINAL: Successfully wrote string data to terminal for ${zoneKey}`);
            } catch (error) {
              console.error(`❌ ZONE TERMINAL: Error writing string data to terminal for ${zoneKey}:`, error);
            }
          }
        } else {
          console.error(`❌ ZONE TERMINAL: Cannot write to terminal for ${zoneKey} - terminal not found!`, {
            sessionId: sessionData.id,
            dataLost: event.data.substring ? event.data.substring(0, 100) : '[Blob data]'
          });
        }
      };

      ws.onopen = () => {
        console.log(`🔗 ZONE TERMINAL: WebSocket connected for ${zoneKey}:`, sessionData.id, {
          readyState: ws.readyState,
          url: ws.url,
          protocol: ws.protocol,
          extensions: ws.extensions,
          timestamp: new Date().toISOString()
        });
      };

      ws.onmessage = handleZoneMessage;

      ws.onclose = (event) => {
        console.log(`🔗 ZONE TERMINAL: WebSocket closed for ${zoneKey}:`, sessionData.id, {
          code: event.code,
          reason: event.reason,
          wasClean: event.wasClean,
          timestamp: new Date().toISOString()
        });
        
        // Clean up this zone's WebSocket
        websocketsMap.current.delete(zoneKey);
      };

      ws.onerror = (error) => {
        console.error(`🚨 ZONE TERMINAL: WebSocket error for ${zoneKey}:`, sessionData.id, {
          error: error,
          readyState: ws.readyState,
          url: ws.url,
          timestamp: new Date().toISOString()
        });
      };

      // Store session and WebSocket for this zone
      sessionsMap.current.set(zoneKey, sessionData);
      websocketsMap.current.set(zoneKey, ws);
      
      // Update global state if this is the current zone
      if (currentServer && getZoneKey(currentServer, zoneName) === zoneKey) {
        setSession(sessionData);
      }

      console.log(`🎉 ZONE TERMINAL: Session created successfully for ${zoneKey}:`, sessionData.id);
      return sessionData;

    } catch (error) {
      console.error(`💥 ZONE TERMINAL: Failed to create session for ${zoneKey}:`, error);
      return null;
    } finally {
      creatingSessionsSet.current.delete(zoneKey);
    }
  }, [getZoneKey, findExistingSession, startZloginSession, currentServer]);

  const attachTerminal = useCallback((terminalRef, zoneName, readOnly = false) => {
    if (!terminalRef.current || !currentServer || !zoneName) {
      console.error('🚫 ZONE TERMINAL: Invalid terminal ref, server, or zone name');
      return () => {};
    }

    const zoneKey = getZoneKey(currentServer, zoneName);
    if (!zoneKey) {
      console.error('🚫 ZONE TERMINAL: Could not generate zone key');
      return () => {};
    }

    // Check if we're already attaching a terminal for this zone
    if (attachingTerminalsSet.current.has(zoneKey)) {
      console.log(`⏳ ZONE TERMINAL: Already attaching terminal for ${zoneKey}`);
      return () => {};
    }

    // Check if we already have a terminal for this zone
    if (terminalsMap.current.has(zoneKey)) {
      const existingMode = terminalModesMap.current.get(zoneKey);
      
      // Check if the existing terminal's readOnly mode matches the requested mode
      if (existingMode === readOnly) {
        console.log(`♻️ ZONE TERMINAL: Reusing existing terminal for ${zoneKey} (readOnly: ${readOnly})`);
        const existingTerminal = terminalsMap.current.get(zoneKey);
        const existingFitAddon = fitAddonsMap.current.get(zoneKey);
        
        // Re-attach existing terminal to new DOM element
        try {
          existingTerminal.open(terminalRef.current);
          if (existingFitAddon) {
            setTimeout(() => existingFitAddon.fit(), 100);
          }
          
          // Update global state if this is the current zone
          setTerm(existingTerminal);
          
          return () => {
            // Don't dispose on cleanup for reused terminals, just remove from DOM
            try {
              if (existingTerminal.element && existingTerminal.element.parentNode) {
                existingTerminal.element.parentNode.removeChild(existingTerminal.element);
              }
            } catch (error) {
              console.warn(`Error detaching terminal for ${zoneKey}:`, error);
            }
          };
        } catch (error) {
          console.error(`Error reusing terminal for ${zoneKey}:`, error);
          // Fall through to create new terminal
        }
      } else {
        console.log(`🔄 ZONE TERMINAL: ReadOnly mode changed for ${zoneKey} (${existingMode} -> ${readOnly}), creating new terminal`);
        
        // Dispose the existing terminal since the mode has changed
        const existingTerminal = terminalsMap.current.get(zoneKey);
        if (existingTerminal) {
          try {
            existingTerminal.dispose();
          } catch (error) {
            console.warn(`Error disposing existing terminal for ${zoneKey}:`, error);
          }
        }
        
        // Clean up existing terminal references
        terminalsMap.current.delete(zoneKey);
        fitAddonsMap.current.delete(zoneKey);
        terminalModesMap.current.delete(zoneKey);
      }
    }

    attachingTerminalsSet.current.add(zoneKey);

    let cleanup = () => {};
    let terminalInstance = null;

    const createTerminalInstance = async () => {
      console.log(`🖥️ ZONE TERMINAL: Creating terminal instance FIRST for ${zoneKey} (readOnly: ${readOnly})`);
      
      // Step 1: Create terminal instance FIRST (synchronously)
      const newTerm = new Terminal({
        cursorBlink: !readOnly,
        theme: {
          background: '#000000',
        },
        disableStdin: readOnly, // Disable input in read-only mode
      });
      const fitAddon = new FitAddon();
      newTerm.loadAddon(fitAddon);
      newTerm.loadAddon(new WebLinksAddon());

      try {
        // Step 2: Open terminal in DOM immediately
        newTerm.open(terminalRef.current);

        // Add read-only indicator if needed
        if (readOnly) {
          console.log(`👁️ ZONE TERMINAL: Terminal set to read-only mode for ${zoneKey}`);
          // Add visual indicator that terminal is read-only
          newTerm.write('\r\n\x1b[33m[READ-ONLY MODE - Console output only]\x1b[0m\r\n');
        }

        // Step 3: Store terminal, fit addon, and readOnly mode for this zone
        terminalsMap.current.set(zoneKey, newTerm);
        fitAddonsMap.current.set(zoneKey, fitAddon);
        terminalModesMap.current.set(zoneKey, readOnly);
        
        // Update global state if this is the current zone
        setTerm(newTerm);
        terminalInstance = newTerm;

        console.log(`✅ ZONE TERMINAL: Terminal ready for ${zoneKey}, now creating WebSocket session`);

        // Step 4: NOW create WebSocket session (terminal is ready to receive data)
        let sessionData = sessionsMap.current.get(zoneKey);
        if (!sessionData) {
          sessionData = await createOrReuseTerminalSession(currentServer, zoneName);
        }

        if (!sessionData) {
          console.error(`🚫 ZONE TERMINAL: Failed to create session for ${zoneKey}`);
          return;
        }

        // Step 5: Wait for WebSocket to be ready
        let attempts = 0;
        const maxAttempts = 50;
        let ws = websocketsMap.current.get(zoneKey);

        while (!ws && attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 100));
          ws = websocketsMap.current.get(zoneKey);
          attempts++;
        }

        if (!ws) {
          console.error(`🚫 ZONE TERMINAL: Timeout waiting for WebSocket for ${zoneKey}`);
          return;
        }

        console.log(`🔗 ZONE TERMINAL: WebSocket ready for ${zoneKey}, connecting terminal input (readOnly: ${readOnly})`);
        
        // Step 6: Connect terminal input to WebSocket (only if not read-only)
        if (!readOnly) {
          newTerm.onData((data) => {
            const currentWs = websocketsMap.current.get(zoneKey);
            if (currentWs && currentWs.readyState === WebSocket.OPEN) {
              currentWs.send(data);
            }
          });
        } else {
          console.log(`👁️ ZONE TERMINAL: Skipping input connection for read-only terminal ${zoneKey}`);
        }

        // Step 7: Fit terminal and send initial prompt (only if not read-only)
        setTimeout(() => {
          try {
            fitAddon.fit();
            if (!readOnly) {
              const currentWs = websocketsMap.current.get(zoneKey);
              if (currentWs && currentWs.readyState === WebSocket.OPEN && !initialPromptSentSet.current.has(zoneKey)) {
                currentWs.send('\n');
                initialPromptSentSet.current.add(zoneKey);
              }
            }
          } catch (error) {
            console.warn(`Error fitting terminal for ${zoneKey}:`, error);
          }
        }, 100);

        console.log(`🎉 ZONE TERMINAL: Terminal fully attached and ready for ${zoneKey} (readOnly: ${readOnly})`);

        cleanup = () => {
          try {
            // Only remove from DOM, keep terminal in map for reuse
            if (newTerm.element && newTerm.element.parentNode) {
              newTerm.element.parentNode.removeChild(newTerm.element);
            }
            
            // Update global state if this was the current terminal
            if (term === newTerm) {
              setTerm(null);
            }
          } catch (error) {
            console.warn(`Error during terminal cleanup for ${zoneKey}:`, error);
          }
        };

      } catch (error) {
        console.error(`💥 ZONE TERMINAL: Error creating terminal instance for ${zoneKey}:`, error);
        
        // Clean up on error
        terminalsMap.current.delete(zoneKey);
        fitAddonsMap.current.delete(zoneKey);
      } finally {
        attachingTerminalsSet.current.delete(zoneKey);
      }
    };

    createTerminalInstance();

    return () => cleanup();
  }, [getZoneKey, currentServer, createOrReuseTerminalSession, term]);

  const resizeTerminal = useCallback((zoneName = null) => {
    if (zoneName && currentServer) {
      // Resize specific zone terminal
      const zoneKey = getZoneKey(currentServer, zoneName);
      if (zoneKey) {
        const terminal = terminalsMap.current.get(zoneKey);
        const fitAddon = fitAddonsMap.current.get(zoneKey);
        
        if (terminal && fitAddon && terminal.element) {
          try {
            fitAddon.fit();
            console.log(`📐 ZONE TERMINAL: Resized terminal for ${zoneKey}`);
          } catch (error) {
            console.warn(`Failed to resize terminal for ${zoneKey}:`, error);
          }
        }
      }
    } else if (term) {
      // Resize current terminal (backward compatibility)
      // Find the fit addon for the current terminal
      let targetFitAddon = null;
      for (const [zoneKey, terminal] of terminalsMap.current.entries()) {
        if (terminal === term) {
          targetFitAddon = fitAddonsMap.current.get(zoneKey);
          break;
        }
      }
      
      if (targetFitAddon && term.element) {
        try {
          targetFitAddon.fit();
          console.log('📐 ZONE TERMINAL: Resized current terminal');
        } catch (error) {
          console.warn('Failed to resize current terminal:', error);
        }
      }
    } else {
      // Resize all terminals
      console.log('📐 ZONE TERMINAL: Resizing all terminals');
      fitAddonsMap.current.forEach((fitAddon, zoneKey) => {
        const terminal = terminalsMap.current.get(zoneKey);
        if (terminal && terminal.element) {
          try {
            fitAddon.fit();
            console.log(`📐 ZONE TERMINAL: Resized terminal for ${zoneKey}`);
          } catch (error) {
            console.warn(`Failed to resize terminal for ${zoneKey}:`, error);
          }
        }
      });
    }
  }, [getZoneKey, currentServer, term]);

  // ⚡ SESSION MANAGEMENT UTILITIES
  const clearAllSessionCookies = useCallback(() => {
    console.log('🧹 SESSION MANAGEMENT: Clearing all session cookies');
    Object.keys(localStorage)
      .filter(key => key.startsWith('terminal_session_'))
      .forEach(key => {
        console.log(`🧹 SESSION MANAGEMENT: Removing ${key}`);
        localStorage.removeItem(key);
      });
    
    // Also clear browser fingerprint to force complete refresh
    localStorage.removeItem('browser_id');
    console.log('🧹 SESSION MANAGEMENT: Cleared browser fingerprint');
  }, []);

  const getSessionInfo = useCallback((server) => {
    if (!server) return null;
    
    const terminalCookie = getOrCreateSessionCookie(server);
    const storageKey = `terminal_session_${server.hostname}:${server.port}`;
    
    return {
      terminalCookie,
      hasSession: !!localStorage.getItem(storageKey),
      server: `${server.hostname}:${server.port}`
    };
  }, []);

  const forceSessionRefresh = useCallback((server) => {
    if (!server) return;
    
    console.log(`🔄 SESSION REFRESH: Forcing session refresh for ${server.hostname}:${server.port}`);
    clearSessionCookie(server);
    
    // Clear any existing session data from maps
    const serverPattern = `${server.hostname}:${server.port}:`;
    
    // Find and clear all sessions for this server
    for (const [zoneKey, sessionData] of sessionsMap.current.entries()) {
      if (zoneKey.startsWith(serverPattern)) {
        console.log(`🧹 SESSION REFRESH: Clearing cached session for ${zoneKey}`);
        sessionsMap.current.delete(zoneKey);
        
        // Close WebSocket if exists
        const ws = websocketsMap.current.get(zoneKey);
        if (ws && ws.readyState === WebSocket.OPEN) {
          ws.close();
        }
        websocketsMap.current.delete(zoneKey);
      }
    }
  }, []);

  const value = React.useMemo(() => ({
    term,
    attachTerminal,
    resizeTerminal,
    // Session management utilities
    clearAllSessionCookies,
    getSessionInfo,
    forceSessionRefresh,
    validateSessionHealth: (server, terminalCookie) => validateSessionHealth(server, terminalCookie)
  }), [term, attachTerminal, resizeTerminal, clearAllSessionCookies, getSessionInfo, forceSessionRefresh]);

  return (
    <ZoneTerminalContext.Provider value={value}>
      {children}
    </ZoneTerminalContext.Provider>
  );
};
