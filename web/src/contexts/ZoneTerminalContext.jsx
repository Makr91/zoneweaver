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

    // Check if we already have a terminal for this zone
    if (terminalsMap.current.has(zoneKey)) {
      const existingMode = terminalModesMap.current.get(zoneKey);
      const existingContext = terminalContextsMap.current.get(zoneKey);
      
      // Smart context detection - check if we're switching contexts
      const isContextSwitch = existingContext && existingContext !== context;
      const isModeChange = existingMode !== readOnly;
      
      if (isContextSwitch) {
        console.log(`🔄 ZONE TERMINAL: Context switch detected for ${zoneKey} (${existingContext} -> ${context}), forcing fresh terminal`);
      } else if (isModeChange) {
        console.log(`🔄 ZONE TERMINAL: ReadOnly mode changed for ${zoneKey} (${existingMode} -> ${readOnly}), creating new terminal`);
      }
      
      // DISABLED: Terminal reuse for context switches (fixes DOM reattachment issues)
      // Always create fresh terminal UI for context switches or mode changes
      if (isContextSwitch || isModeChange) {
        console.log(`🚀 ZONE TERMINAL: Creating fresh terminal UI (preserving WebSocket/session) for ${zoneKey}`);
        // Fall through to create new terminal - WebSocket/session will be reused automatically
      } else {
        // Same context and same mode - can safely reuse (rare case, mostly for rapid re-renders)
        console.log(`♻️ ZONE TERMINAL: Reusing existing terminal for ${zoneKey} (same context: ${context}, same mode: ${readOnly})`);
        const existingTerminal = terminalsMap.current.get(zoneKey);
        const existingFitAddon = fitAddonsMap.current.get(zoneKey);
        
        // Re-attach existing terminal to new DOM element
        try {
          existingTerminal.open(terminalRef.current);
          if (existingFitAddon) {
            setTimeout(() => existingFitAddon.fit(), 100);
          }
          
          // Update context (same terminal, potentially different DOM location)
          terminalContextsMap.current.set(zoneKey, context);
          
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
          console.error(`🚨 ZONE TERMINAL: Error reusing terminal for ${zoneKey} (creating fresh terminal):`, error);
          // Fall through to create new terminal
        }
      }
      
      // Context switch or mode change detected - dispose existing terminal BUT PRESERVE SESSION STATE
      const existingTerminal = terminalsMap.current.get(zoneKey);
      if (existingTerminal) {
        try {
          console.log(`🗑️ ZONE TERMINAL: Disposing existing terminal for context/mode change ${zoneKey}`);
          existingTerminal.dispose();
        } catch (error) {
          console.warn(`Error disposing existing terminal for ${zoneKey}:`, error);
        }
      }
      
      // Clean up ONLY terminal UI references - PRESERVE session/websocket state for context switching
      terminalsMap.current.delete(zoneKey);
      fitAddonsMap.current.delete(zoneKey);
      terminalModesMap.current.delete(zoneKey);
      terminalContextsMap.current.delete(zoneKey);
      
      // IMPORTANT: Do NOT delete sessionsMap or websocketsMap - they should persist across contexts!
      console.log(`🔄 ZONE TERMINAL: Context switch preserving session/websocket state for ${zoneKey}`);
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
        
        // Update global state if this is the current zone
        setTerm(newTerm);
        terminalInstance = newTerm;

        console.log(`✅ ZONE TERMINAL: Terminal ready for ${zoneKey}, checking for existing session`);

        // Step 4: ONLY connect to existing sessions - NEVER auto-start new ones
        let sessionData = sessionsMap.current.get(zoneKey);
        if (!sessionData) {
          // Try to find existing session on server without starting new one
          sessionData = await findExistingSession(currentServer, zoneName);
        if (sessionData) {
          console.log(`🔄 ZONE TERMINAL: Found existing session for ${zoneKey}:`, sessionData.id);
          
          // Add websocket_url to existing sessions that don't have it (for backward compatibility)
          if (!sessionData.websocket_url) {
            console.log(`🔧 ZONE TERMINAL: Adding missing websocket_url to existing session for ${zoneKey}`);
            sessionData.websocket_url = `/zlogin/${sessionData.id}`;
          }
          
          // Check if WebSocket already exists for this session - REUSE instead of creating duplicate
          let existingWs = websocketsMap.current.get(zoneKey);
          
          if (existingWs && existingWs.readyState === WebSocket.OPEN) {
            console.log(`♻️ ZONE TERMINAL: Reusing existing WebSocket connection for ${zoneKey}`);
            // Store session data (in case it was missing)
            sessionsMap.current.set(zoneKey, sessionData);
          } else {
            // Only create new WebSocket if none exists or existing one is closed
            console.log(`🔗 ZONE TERMINAL: Creating new WebSocket for existing session: ${sessionData.websocket_url}`);
            const wsUrl = `wss://${window.location.host}${sessionData.websocket_url}`;
            const ws = new WebSocket(wsUrl);

            const handleZoneMessage = (event) => {
              const terminal = terminalsMap.current.get(zoneKey);
              if (terminal) {
                if (event.data instanceof Blob) {
                  event.data.text().then(text => terminal.write(text));
                } else {
                  terminal.write(event.data);
                }
              }
            };

            ws.onopen = () => {
              console.log(`🔗 ZONE TERMINAL: WebSocket connected for existing session ${sessionData.id}`);
            };
            ws.onmessage = handleZoneMessage;
            ws.onclose = (event) => {
              console.log(`🔗 ZONE TERMINAL: WebSocket closed for existing session ${sessionData.id}`);
              websocketsMap.current.delete(zoneKey);
            };
            ws.onerror = (error) => {
              console.error(`🚨 ZONE TERMINAL: WebSocket error for existing session ${sessionData.id}:`, error);
            };

            // Store session and WebSocket
            sessionsMap.current.set(zoneKey, sessionData);
            websocketsMap.current.set(zoneKey, ws);
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
    validateSessionHealth: (server, sessionId) => validateSessionHealth(server, sessionId),
    // Explicit session creation (only for user actions)
    startZloginSessionExplicitly
  }), [term, attachTerminal, resizeTerminal, clearAllZoneSessions, getZoneSessionInfo, forceZoneSessionRefresh, startZloginSessionExplicitly]);

  return (
    <ZoneTerminalContext.Provider value={value}>
      {children}
    </ZoneTerminalContext.Provider>
  );
};
