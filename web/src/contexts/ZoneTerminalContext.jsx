import React, { createContext, useState, useEffect, useContext, useCallback, useRef } from 'react';
import { useServers } from './ServerContext';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { WebLinksAddon } from '@xterm/addon-web-links';
import '@xterm/xterm/css/xterm.css';
import axios from 'axios';

// Zone terminals use ZLOGIN sessions (not HOST terminal cookies)

// Optional health check function for zlogin sessions
const validateSessionHealth = async (server, sessionId) => {
  if (!server || !sessionId) return false;
  
  try {
    const response = await axios.get(`/api/servers/${server.hostname}/zlogin/sessions/${sessionId}`);
    const isHealthy = response.data.success && response.data.session.status === 'active';
    console.log(`🏥 ZLOGIN HEALTH CHECK: Session ${sessionId} health: ${isHealthy}`);
    return isHealthy;
  } catch (error) {
    console.warn(`🏥 ZLOGIN HEALTH CHECK: Failed to check session health for ${sessionId}:`, error);
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
  const websocketSessionMap = useRef(new Map());    // zoneKey -> session ID that WebSocket is connected to
  const fitAddonsMap = useRef(new Map());           // zoneKey -> fit addon
  const terminalModesMap = useRef(new Map());       // zoneKey -> readOnly mode
  const terminalContextsMap = useRef(new Map());    // zoneKey -> UI context (preview/modal)
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
      terminalContextsMap.current.clear();
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

  // ⚡ ZLOGIN SESSION LOGIC - Uses proper zone login sessions
  const createOrReuseTerminalSession = useCallback(async (server, zoneName) => {
    if (!server || !zoneName) {
      console.error('🚫 ZLOGIN SESSION: Invalid server or zone name');
      return null;
    }

    const zoneKey = getZoneKey(server, zoneName);
    if (!zoneKey) return null;

    // Check if we're already creating a session for this zone
    if (creatingSessionsSet.current.has(zoneKey)) {
      console.log(`⏳ ZLOGIN SESSION: Already creating session for ${zoneKey}`);
      return null;
    }

    // Check if we already have a session for this zone
    if (sessionsMap.current.has(zoneKey)) {
      console.log(`✅ ZLOGIN SESSION: Reusing existing session for ${zoneKey}`);
      return sessionsMap.current.get(zoneKey);
    }

    creatingSessionsSet.current.add(zoneKey);

    try {
      console.log(`🚀 ZLOGIN SESSION: Starting session for ${zoneKey}`);

      // Call correct ZLOGIN endpoint for zone terminal access
      const response = await axios.post(`/api/servers/${server.hostname}/zones/${zoneName}/zlogin/start`);

      if (!response.data.success) {
        console.error(`❌ ZLOGIN SESSION: Backend failed to start session for ${zoneKey}:`, response.data.error);
        return null;
      }

      // Handle response structure from backend
      const sessionData = response.data.session || response.data.data;
      console.log(`🔍 ZLOGIN SESSION: Full response data for ${zoneKey}:`, response.data);
      console.log(`🔍 ZLOGIN SESSION: Parsed session data for ${zoneKey}:`, {
        websocket_url: sessionData.websocket_url,
        id: sessionData.id,
        allSessionFields: Object.keys(sessionData)
      });
      
      console.log(`🆕 ZLOGIN CREATE: New session created for ${zoneKey}`);

      // Step 4: Display buffer content if available (reconnection context)
      if (sessionData.buffer && sessionData.buffer.trim()) {
        console.log(`📜 TERMINAL BUFFER: Restoring ${sessionData.buffer.split('\n').length} lines of history for ${zoneKey}`);
      }

      // Step 5: CRITICAL FIX - Check for undefined websocket_url
      if (!sessionData.websocket_url) {
        console.error(`🚫 ZLOGIN SESSION: Missing websocket_url for ${zoneKey}!`, {
          sessionData,
          responseKeys: Object.keys(response.data),
          sessionKeys: Object.keys(sessionData)
        });
        return null; // Don't create malformed WebSocket connection
      }

      // Step 5: Create WebSocket connection using backend-provided URL
      const wsUrl = `wss://${window.location.host}${sessionData.websocket_url}`;
      console.log(`🔗 TERMINAL SESSION: Connecting WebSocket to ${wsUrl}`);
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log(`🔗 ZONE TERMINAL: WebSocket connected for ${zoneKey}:`, sessionData.id, {
          readyState: ws.readyState,
          url: ws.url,
          protocol: ws.protocol,
          extensions: ws.extensions,
          timestamp: new Date().toISOString()
        });
      };

      // 🔧 CRITICAL FIX: Do NOT attach message handler here - let attachTerminal handle it synchronously
      // This prevents race condition where messages arrive before terminal is in terminalsMap
      console.log(`🔧 ZONE TERMINAL: WebSocket created WITHOUT message handler for ${zoneKey} - attachTerminal will handle it synchronously`);

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
      websocketSessionMap.current.set(zoneKey, sessionData.id); // 🔧 CRITICAL FIX: Store session ID mapping
      
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

  const attachTerminal = useCallback((terminalRef, zoneName, readOnly = false, context = 'preview') => {
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

    // COMPLETELY DISABLED: All terminal reuse - always create fresh terminals
    // Check if we already have a terminal for this zone and dispose it
    if (terminalsMap.current.has(zoneKey)) {
      const existingMode = terminalModesMap.current.get(zoneKey);
      const existingContext = terminalContextsMap.current.get(zoneKey);
      
      console.log(`🚀 ZONE TERMINAL: Always creating fresh terminal UI (preserving WebSocket/session) for ${zoneKey}`);
      console.log(`🔄 ZONE TERMINAL: Previous context: ${existingContext} -> ${context}, Mode: ${existingMode} -> ${readOnly}`);
      
      // Always dispose existing terminal to prevent DOM reattachment issues
      const existingTerminal = terminalsMap.current.get(zoneKey);
      if (existingTerminal) {
        try {
          console.log(`🗑️ ZONE TERMINAL: Disposing existing terminal (no reuse) for ${zoneKey}`);
          existingTerminal.dispose();
        } catch (error) {
          console.warn(`Error disposing existing terminal for ${zoneKey}:`, error);
        }
      }
      
      // Clean up ONLY terminal UI references - PRESERVE session/websocket state
      terminalsMap.current.delete(zoneKey);
      fitAddonsMap.current.delete(zoneKey);
      terminalModesMap.current.delete(zoneKey);
      terminalContextsMap.current.delete(zoneKey);
      
      // IMPORTANT: Do NOT delete sessionsMap or websocketsMap - they persist for performance!
      console.log(`🔄 ZONE TERMINAL: Fresh terminal creation preserving session/websocket state for ${zoneKey}`);
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

        // Step 3: Store terminal, fit addon, readOnly mode, and context for this zone
        terminalsMap.current.set(zoneKey, newTerm);
        fitAddonsMap.current.set(zoneKey, fitAddon);
        terminalModesMap.current.set(zoneKey, readOnly);
        terminalContextsMap.current.set(zoneKey, context);
        
        // CIRCULAR DEPENDENCY FIX: Only update global term state if current zone matches
        // This prevents unnecessary re-renders that cause infinite loops
        if (currentServer && getZoneKey(currentServer, zoneName) === zoneKey) {
          setTerm(newTerm);
        }
        terminalInstance = newTerm;

        console.log(`✅ ZONE TERMINAL: Terminal ready for ${zoneKey}, checking for existing session`);

        // Step 4: FORCE refresh session data to avoid stale cache after kill->start cycles
        console.log(`🔄 ZONE TERMINAL: Force refreshing session data for ${zoneKey} to avoid stale cache`);
        
        // Always check for fresh session data from server instead of using cache
        let sessionData = await findExistingSession(currentServer, zoneName);
        
        if (sessionData) {
          console.log(`🔄 ZONE TERMINAL: Found active session for ${zoneKey}:`, sessionData.id);
          
          // Add websocket_url to existing sessions that don't have it (for backward compatibility)
          if (!sessionData.websocket_url) {
            console.log(`🔧 ZONE TERMINAL: Adding missing websocket_url to session for ${zoneKey}`);
            sessionData.websocket_url = `/zlogin/${sessionData.id}`;
          }
          
          // Update cache with fresh session data
          sessionsMap.current.set(zoneKey, sessionData);
          
          console.log(`💾 ZONE TERMINAL: Updated cache with fresh session data for ${zoneKey}:`, sessionData.id);
        } else {
          // Clear any stale cached session if no active session found
          console.log(`🧹 ZONE TERMINAL: No active session found, clearing stale cache for ${zoneKey}`);
          sessionsMap.current.delete(zoneKey);
        }

        if (sessionData) {
          // Check if we need to create/recreate WebSocket connection
          let existingWs = websocketsMap.current.get(zoneKey);
          const existingWsSessionId = websocketSessionMap.current.get(zoneKey);
          
          // 🚨 CRITICAL FIX: Only reuse WebSocket if it's connected to the SAME session
          const canReuseWebSocket = existingWs && 
                                   existingWs.readyState === WebSocket.OPEN && 
                                   existingWsSessionId === sessionData.id;
          
          if (canReuseWebSocket) {
            console.log(`♻️ ZONE TERMINAL: Reusing existing WebSocket connection for ${zoneKey}`, {
              sessionId: sessionData.id,
              existingSessionId: existingWsSessionId,
              wsReadyState: existingWs.readyState,
              wsUrl: existingWs.url,
              sessionMatch: true,
              hasExistingHandler: !!existingWs.onmessage
            });
            
            // 🔧 CRITICAL FIX: ALWAYS attach fresh message handler - this ensures terminal is in terminalsMap
            console.log(`📨 ZONE TERMINAL: Attaching FRESH message handler to reused WebSocket for ${zoneKey} to fix race condition`);
            
            // Create fresh message handler that can find the terminal (now that it's in terminalsMap)
            const handleZoneMessageReused = (event) => {
              console.log(`📨 ZONE TERMINAL: WebSocket message received for ${zoneKey} (REUSED WS)`, {
                sessionId: sessionData.id,
                dataType: typeof event.data,
                isBlob: event.data instanceof Blob,
                dataLength: event.data.length || (event.data.size || 'unknown'),
                timestamp: new Date().toISOString()
              });

              const terminal = terminalsMap.current.get(zoneKey);
              if (terminal) {
                console.log(`✅ ZONE TERMINAL: Terminal exists for ${zoneKey}, processing message (REUSED WS)`);
                
                if (event.data instanceof Blob) {
                  console.log(`📄 ZONE TERMINAL: Processing Blob data for ${zoneKey} (REUSED WS)`);
                  event.data.text().then(text => {
                    console.log(`📝 ZONE TERMINAL: Blob converted to text for ${zoneKey}:`, {
                      textLength: text.length,
                      textPreview: text.substring(0, 100)
                    });
                    try {
                      terminal.write(text);
                      console.log(`✅ ZONE TERMINAL: Successfully wrote Blob text to terminal for ${zoneKey} (REUSED WS)`);
                    } catch (error) {
                      console.error(`❌ ZONE TERMINAL: Error writing Blob text to terminal for ${zoneKey}:`, error);
                    }
                  }).catch(error => {
                    console.error(`❌ ZONE TERMINAL: Error converting Blob to text for ${zoneKey}:`, error);
                  });
                } else {
                  console.log(`📝 ZONE TERMINAL: Processing string data for ${zoneKey} (REUSED WS):`, {
                    dataLength: event.data.length,
                    dataPreview: event.data.substring(0, 100)
                  });
                  try {
                    terminal.write(event.data);
                    console.log(`✅ ZONE TERMINAL: Successfully wrote string data to terminal for ${zoneKey} (REUSED WS)`);
                  } catch (error) {
                    console.error(`❌ ZONE TERMINAL: Error writing string data to terminal for ${zoneKey}:`, error);
                  }
                }
              } else {
                console.error(`❌ ZONE TERMINAL: Cannot write to terminal for ${zoneKey} - terminal not found! (REUSED WS)`, {
                  sessionId: sessionData.id,
                  dataLost: event.data.substring ? event.data.substring(0, 100) : '[Blob data]',
                  availableTerminals: Array.from(terminalsMap.current.keys())
                });
              }
            };

            // 🔧 CRITICAL FIX: Explicitly clear old handler first to prevent double output
            existingWs.onmessage = null;
            console.log(`🧹 ZONE TERMINAL: Cleared old message handler for ${zoneKey}`);
            
            // Now attach the fresh message handler
            existingWs.onmessage = handleZoneMessageReused;
            console.log(`📨 ZONE TERMINAL: Fresh message handler attached to reused WebSocket for ${zoneKey}`);

            // 🔌 IMMEDIATE INPUT CONNECTION for reused WebSocket (already OPEN)
            if (!readOnly) {
              console.log(`🔌 ZONE TERMINAL: Attaching input handler to reused WebSocket for ${zoneKey}`);
              newTerm.onData((data) => {
                const currentWs = websocketsMap.current.get(zoneKey);
                if (currentWs && currentWs.readyState === WebSocket.OPEN) {
                  console.log(`⌨️ ZONE TERMINAL: Sending input data for ${zoneKey} (REUSED WS):`, {
                    dataLength: data.length,
                    dataPreview: data.substring(0, 20),
                    wsReadyState: currentWs.readyState
                  });
                  currentWs.send(data);
                } else {
                  console.warn(`⚠️ ZONE TERMINAL: Cannot send input - WebSocket not ready for ${zoneKey}`, {
                    wsExists: !!currentWs,
                    wsReadyState: currentWs?.readyState
                  });
                }
              });
              console.log(`✅ ZONE TERMINAL: Input handler attached to reused WebSocket for ${zoneKey}`);
            } else {
              console.log(`👁️ ZONE TERMINAL: Skipping input connection for read-only reused WebSocket ${zoneKey}`);
            }
            
          } else {
            // 🔄 SESSION CHANGED: Close old WebSocket and create new one
            if (existingWs) {
              console.log(`🔄 ZONE TERMINAL: Session changed - closing old WebSocket for ${zoneKey}`, {
                oldSessionId: existingWsSessionId,
                newSessionId: sessionData.id,
                wsReadyState: existingWs.readyState,
                reason: existingWsSessionId !== sessionData.id ? 'session_mismatch' : 'ws_not_open'
              });
              
              try {
                if (existingWs.readyState === WebSocket.OPEN || existingWs.readyState === WebSocket.CONNECTING) {
                  existingWs.close(1000, 'Session changed');
                }
              } catch (error) {
                console.warn(`⚠️ ZONE TERMINAL: Error closing old WebSocket for ${zoneKey}:`, error);
              }
              
              // Clean up old WebSocket references
              websocketsMap.current.delete(zoneKey);
              websocketSessionMap.current.delete(zoneKey);
            }
            console.log(`🔗 ZONE TERMINAL: Creating new WebSocket for session: ${sessionData.websocket_url}`, {
              sessionId: sessionData.id,
              reason: existingWs ? `existing ws state: ${existingWs.readyState}` : 'no existing ws',
              timestamp: new Date().toISOString()
            });
            
            const wsUrl = `wss://${window.location.host}${sessionData.websocket_url}`;
            const ws = new WebSocket(wsUrl);

            // CRITICAL FIX: Enhanced message handler with proper terminal connection
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
                  dataLost: event.data.substring ? event.data.substring(0, 100) : '[Blob data]',
                  availableTerminals: Array.from(terminalsMap.current.keys())
                });
              }
            };

            ws.onopen = () => {
              console.log(`🔗 ZONE TERMINAL: WebSocket connected for session ${sessionData.id}`, {
                readyState: ws.readyState,
                url: ws.url,
                zoneKey: zoneKey,
                timestamp: new Date().toISOString()
              });
            };
            
            // CRITICAL FIX: Ensure message handler is always properly attached
            ws.onmessage = handleZoneMessage;
            console.log(`📨 ZONE TERMINAL: Message handler attached to WebSocket for ${zoneKey}`, {
              sessionId: sessionData.id,
              handlerAttached: !!ws.onmessage,
              timestamp: new Date().toISOString()
            });
            
            ws.onclose = (event) => {
              console.log(`🔗 ZONE TERMINAL: WebSocket closed for session ${sessionData.id}`, {
                code: event.code,
                reason: event.reason,
                wasClean: event.wasClean,
                zoneKey: zoneKey,
                timestamp: new Date().toISOString()
              });
              websocketsMap.current.delete(zoneKey);
            };
            
            ws.onerror = (error) => {
              console.error(`🚨 ZONE TERMINAL: WebSocket error for session ${sessionData.id}:`, {
                error: error,
                readyState: ws.readyState,
                url: ws.url,
                zoneKey: zoneKey,
                timestamp: new Date().toISOString()
              });
            };

            // Store WebSocket connection and track session ID
            websocketsMap.current.set(zoneKey, ws);
            websocketSessionMap.current.set(zoneKey, sessionData.id);
            console.log(`💾 ZONE TERMINAL: Stored WebSocket for ${zoneKey}`, {
              sessionId: sessionData.id,
              wsStored: websocketsMap.current.has(zoneKey),
              sessionTracked: websocketSessionMap.current.has(zoneKey),
              timestamp: new Date().toISOString()
            });

            // 🔄 NEW WEBSOCKET: Wait for OPEN state then attach input
            console.log(`⏳ ZONE TERMINAL: Waiting for NEW WebSocket to be OPEN for ${zoneKey}...`);
            let attempts = 0;
            const maxAttempts = 50;
            
            while (ws.readyState !== WebSocket.OPEN && attempts < maxAttempts) {
              await new Promise(resolve => setTimeout(resolve, 100));
              console.log(`🔍 ZONE TERMINAL: NEW WebSocket state check for ${zoneKey}:`, {
                attempt: attempts + 1,
                readyState: ws.readyState,
                states: {
                  CONNECTING: WebSocket.CONNECTING,
                  OPEN: WebSocket.OPEN,
                  CLOSING: WebSocket.CLOSING,
                  CLOSED: WebSocket.CLOSED
                }
              });
              attempts++;
            }

            if (ws.readyState !== WebSocket.OPEN) {
              console.error(`🚫 ZONE TERMINAL: NEW WebSocket failed to open for ${zoneKey}`, {
                finalReadyState: ws.readyState,
                attemptsUsed: attempts
              });
              return;
            }

            console.log(`✅ ZONE TERMINAL: NEW WebSocket is OPEN for ${zoneKey}, connecting terminal input (readOnly: ${readOnly})`);
            
            // Connect input to NEW WebSocket
            if (!readOnly) {
              console.log(`🔌 ZONE TERMINAL: Attaching input handler to NEW WebSocket for ${zoneKey}`);
              newTerm.onData((data) => {
                const currentWs = websocketsMap.current.get(zoneKey);
                if (currentWs && currentWs.readyState === WebSocket.OPEN) {
                  console.log(`⌨️ ZONE TERMINAL: Sending input data for ${zoneKey} (NEW WS):`, {
                    dataLength: data.length,
                    dataPreview: data.substring(0, 20),
                    wsReadyState: currentWs.readyState
                  });
                  currentWs.send(data);
                } else {
                  console.warn(`⚠️ ZONE TERMINAL: Cannot send input - WebSocket not ready for ${zoneKey}`, {
                    wsExists: !!currentWs,
                    wsReadyState: currentWs?.readyState
                  });
                }
              });
              console.log(`✅ ZONE TERMINAL: Input handler attached to NEW WebSocket for ${zoneKey}`);
            } else {
              console.log(`👁️ ZONE TERMINAL: Skipping input connection for read-only NEW WebSocket ${zoneKey}`);
            }
          }
        }

        if (!sessionData) {
          console.log(`📋 ZONE TERMINAL: No existing session for ${zoneKey} - showing no session state`);
          // Display "No Session" indicator in terminal
          newTerm.write('\r\n\x1b[33m[NO ACTIVE ZLOGIN SESSION]\x1b[0m\r\n');
          newTerm.write('\x1b[37m[Click the zlogin button to start a new session]\x1b[0m\r\n');
          return; // Don't create WebSocket connection without session
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
            // Only remove from DOM, don't dispose terminal completely
            if (newTerm.element && newTerm.element.parentNode) {
              newTerm.element.parentNode.removeChild(newTerm.element);
            }
            
            // CIRCULAR DEPENDENCY FIX: Don't update term state in cleanup to prevent loops
            // Only clear if this was actually the current term
            const currentTerm = terminalsMap.current.get(zoneKey);
            if (currentTerm === newTerm && term === newTerm) {
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
  }, [getZoneKey, currentServer, createOrReuseTerminalSession]); // REMOVED 'term' from dependencies to break circular loop

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

  // ⚡ ZLOGIN SESSION MANAGEMENT UTILITIES
  const clearAllZoneSessions = useCallback(() => {
    console.log('🧹 ZLOGIN SESSION MANAGEMENT: Clearing all zone sessions');
    
    // Clear all cached sessions for all zones
    sessionsMap.current.clear();
    
    // Close all WebSockets
    websocketsMap.current.forEach((ws, zoneKey) => {
      if (ws && ws.readyState === WebSocket.OPEN) {
        console.log(`🔗 ZLOGIN SESSION MANAGEMENT: Closing WebSocket for ${zoneKey}`);
        ws.close();
      }
    });
    websocketsMap.current.clear();
    
    console.log('🧹 ZLOGIN SESSION MANAGEMENT: All zone sessions cleared');
  }, []);

  const getZoneSessionInfo = useCallback((server, zoneName) => {
    if (!server || !zoneName) return null;
    
    const zoneKey = getZoneKey(server, zoneName);
    const sessionData = sessionsMap.current.get(zoneKey);
    
    return {
      hasSession: !!sessionData,
      sessionId: sessionData?.id || null,
      status: sessionData?.status || null,
      server: `${server.hostname}:${server.port}`,
      zone: zoneName
    };
  }, [getZoneKey]);

  const forceZoneSessionRefresh = useCallback((server, zoneName) => {
    if (!server || !zoneName) return;
    
    const zoneKey = getZoneKey(server, zoneName);
    console.log(`🔄 ZLOGIN SESSION REFRESH: Forcing session refresh for ${zoneKey}`);
    
    // Clear the specific zone session
    const sessionData = sessionsMap.current.get(zoneKey);
    if (sessionData) {
      console.log(`🧹 ZLOGIN SESSION REFRESH: Clearing cached session for ${zoneKey}`);
      sessionsMap.current.delete(zoneKey);
      
      // Close WebSocket if exists
      const ws = websocketsMap.current.get(zoneKey);
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
      websocketsMap.current.delete(zoneKey);
    }
  }, [getZoneKey]);

  // 🧹 CRITICAL SESSION CLEANUP - Called when sessions are explicitly killed
  const forceZoneSessionCleanup = useCallback(async (server, zoneName) => {
    if (!server || !zoneName) {
      console.error('🚫 ZLOGIN CLEANUP: Invalid server or zoneName provided');
      return;
    }
    
    const zoneKey = getZoneKey(server, zoneName);
    console.log(`🧹 ZLOGIN CLEANUP: Force cleaning up session state for ${zoneKey}`, {
      server: `${server.hostname}:${server.port}`,
      zoneName,
      timestamp: new Date().toISOString()
    });
    
    try {
      // 🔥 CRITICAL: Close and clear WebSocket (most important!)
      const ws = websocketsMap.current.get(zoneKey);
      if (ws) {
        console.log(`🔗 ZLOGIN CLEANUP: Closing WebSocket for ${zoneKey}`, {
          readyState: ws.readyState,
          url: ws.url
        });
        
        try {
          if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
            ws.close(1000, 'Session killed by user');
          }
          console.log(`✅ ZLOGIN CLEANUP: WebSocket closed for ${zoneKey}`);
        } catch (wsCloseError) {
          console.warn(`⚠️ ZLOGIN CLEANUP: Error closing WebSocket for ${zoneKey}:`, wsCloseError);
          // Continue with cleanup even if close fails
        }
      } else {
        console.log(`ℹ️ ZLOGIN CLEANUP: No WebSocket found for ${zoneKey}`);
      }
      
      // 🧹 FORCE DELETE: Always remove WebSocket from map regardless of close success
      const wsDeleted = websocketsMap.current.delete(zoneKey);
      const wsSessionDeleted = websocketSessionMap.current.delete(zoneKey);
      console.log(`🗑️ ZLOGIN CLEANUP: WebSocket ${wsDeleted ? 'removed' : 'not found'} in map for ${zoneKey}`);
      console.log(`🗑️ ZLOGIN CLEANUP: WebSocket session tracking ${wsSessionDeleted ? 'removed' : 'not found'} for ${zoneKey}`);
      
      // 🧹 Clear cached session and state
      const sessionDeleted = sessionsMap.current.delete(zoneKey);
      console.log(`🗑️ ZLOGIN CLEANUP: Session data ${sessionDeleted ? 'removed' : 'not found'} for ${zoneKey}`);
      
      const promptDeleted = initialPromptSentSet.current.delete(zoneKey);
      console.log(`🗑️ ZLOGIN CLEANUP: Initial prompt flag ${promptDeleted ? 'removed' : 'not found'} for ${zoneKey}`);
      
      // 🧹 Clear terminal state tracking
      const modeDeleted = terminalModesMap.current.delete(zoneKey);
      const contextDeleted = terminalContextsMap.current.delete(zoneKey);
      console.log(`🗑️ ZLOGIN CLEANUP: Terminal tracking data removed for ${zoneKey}`, {
        modeDeleted,
        contextDeleted
      });
      
      // 🔍 Verification: Check that everything is actually cleared
      const verificationCheck = {
        websocketExists: websocketsMap.current.has(zoneKey),
        sessionExists: sessionsMap.current.has(zoneKey),
        promptExists: initialPromptSentSet.current.has(zoneKey),
        modeExists: terminalModesMap.current.has(zoneKey),
        contextExists: terminalContextsMap.current.has(zoneKey),
        timestamp: new Date().toISOString()
      };
      
      console.log(`🔍 ZLOGIN CLEANUP: Verification check for ${zoneKey}:`, verificationCheck);
      
      if (verificationCheck.websocketExists || verificationCheck.sessionExists) {
        console.error(`🚨 ZLOGIN CLEANUP: CLEANUP FAILED - Some data still exists for ${zoneKey}:`, verificationCheck);
        throw new Error(`Cleanup verification failed - data still exists`);
      }
      
      console.log(`✅ ZLOGIN CLEANUP: Complete cleanup finished for ${zoneKey}`, {
        server: `${server.hostname}:${server.port}`,
        zoneName,
        success: true,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      console.error(`💥 ZLOGIN CLEANUP: Error during cleanup for ${zoneKey}:`, {
        error: error.message,
        errorStack: error.stack,
        server: `${server.hostname}:${server.port}`,
        zoneName,
        timestamp: new Date().toISOString()
      });
      
      // 🚨 FALLBACK CLEANUP: Force clear everything even on error
      console.log(`🚨 ZLOGIN CLEANUP: Executing fallback cleanup for ${zoneKey}`);
      websocketsMap.current.delete(zoneKey);
      sessionsMap.current.delete(zoneKey);
      initialPromptSentSet.current.delete(zoneKey);
      terminalModesMap.current.delete(zoneKey);
      terminalContextsMap.current.delete(zoneKey);
      console.log(`🧹 ZLOGIN CLEANUP: Fallback cleanup completed for ${zoneKey}`);
      
      // Re-throw the error so the caller knows cleanup had issues
      throw error;
    }
  }, [getZoneKey]);

  // ⚡ EXPLICIT SESSION CREATION - Only called by user actions (button clicks)
  const startZloginSessionExplicitly = useCallback(async (server, zoneName) => {
    if (!server || !zoneName) {
      console.error('🚫 START ZLOGIN: Invalid server or zone name');
      return { success: false, message: 'Invalid parameters' };
    }

    const zoneKey = getZoneKey(server, zoneName);
    if (!zoneKey) {
      return { success: false, message: 'Could not generate zone key' };
    }

    try {
      console.log(`🎬 START ZLOGIN: User explicitly requested session start for ${zoneKey}`);
      
      // Use the existing session creation logic
      const sessionData = await createOrReuseTerminalSession(server, zoneName);
      
      if (sessionData) {
        console.log(`✅ START ZLOGIN: Session started successfully for ${zoneKey}:`, sessionData.id);
        
        // After creating session, refresh any existing terminals to connect to it
        const terminal = terminalsMap.current.get(zoneKey);
        if (terminal) {
          console.log(`🔄 START ZLOGIN: Refreshing existing terminal for ${zoneKey}`);
          // Clear the "no session" message and show connection
          terminal.clear();
          terminal.write('\r\n\x1b[32m[ZLOGIN SESSION STARTED]\x1b[0m\r\n');
          terminal.write('\x1b[37m[Connecting to session...]\x1b[0m\r\n');
          
          // Wait for WebSocket connection
          let attempts = 0;
          const maxAttempts = 50;
          let ws = websocketsMap.current.get(zoneKey);

          while (!ws && attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 100));
            ws = websocketsMap.current.get(zoneKey);
            attempts++;
          }

          if (ws && ws.readyState === WebSocket.OPEN) {
            terminal.clear(); // Clear connection message
            console.log(`🔗 START ZLOGIN: Terminal connected to session for ${zoneKey}`);
            
            // Connect terminal input to WebSocket if not read-only
            const isReadOnly = terminalModesMap.current.get(zoneKey);
            if (!isReadOnly) {
              terminal.onData((data) => {
                const currentWs = websocketsMap.current.get(zoneKey);
                if (currentWs && currentWs.readyState === WebSocket.OPEN) {
                  currentWs.send(data);
                }
              });
            }
            
            // Send initial prompt if not read-only
            if (!isReadOnly && !initialPromptSentSet.current.has(zoneKey)) {
              ws.send('\n');
              initialPromptSentSet.current.add(zoneKey);
            }
          }
        }
        
        return { success: true, session: sessionData };
      } else {
        console.error(`❌ START ZLOGIN: Failed to start session for ${zoneKey}`);
        return { success: false, message: 'Failed to create session' };
      }
    } catch (error) {
      console.error(`💥 START ZLOGIN: Error starting session for ${zoneKey}:`, error);
      return { success: false, message: error.message || 'Unknown error' };
    }
  }, [getZoneKey, createOrReuseTerminalSession]);

  const value = React.useMemo(() => ({
    term,
    attachTerminal,
    resizeTerminal,
    // Zone session management utilities
    clearAllZoneSessions,
    getZoneSessionInfo,
    forceZoneSessionRefresh,
    forceZoneSessionCleanup, // 🧹 CRITICAL: Cleanup function for killed sessions
    validateSessionHealth: (server, sessionId) => validateSessionHealth(server, sessionId),
    // Explicit session creation (only for user actions)
    startZloginSessionExplicitly
  }), [term, attachTerminal, resizeTerminal, clearAllZoneSessions, getZoneSessionInfo, forceZoneSessionRefresh, forceZoneSessionCleanup, startZloginSessionExplicitly]);

  return (
    <ZoneTerminalContext.Provider value={value}>
      {children}
    </ZoneTerminalContext.Provider>
  );
};
