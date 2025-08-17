import React, { createContext, useState, useEffect, useContext, useCallback, useRef } from 'react';
import { useServers } from './ServerContext';
import { UserSettings } from './UserSettingsContext';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { WebLinksAddon } from '@xterm/addon-web-links';
import '@xterm/xterm/css/xterm.css';
import axios from 'axios';

const FooterContext = createContext();

export const useFooter = () => {
  return useContext(FooterContext);
};

export const FooterProvider = ({ children }) => {
  // Add mount/unmount debugging
  useEffect(() => {
    console.log('🔄 FOOTER PROVIDER: Component mounted', {
      timestamp: new Date().toISOString()
    });
    
    return () => {
      console.log('🔄 FOOTER PROVIDER: Component unmounting', {
        timestamp: new Date().toISOString()
      });
    };
  }, []);

  const { currentServer, makeZoneweaverAPIRequest } = useServers();
  const { footerActiveView, footerIsActive } = useContext(UserSettings);
  const [tasks, setTasks] = useState([]);
  const [tasksError, setTasksError] = useState('');
  const [term, setTerm] = useState(null);
  const [session, setSession] = useState(null);
  
  // Use ref to track current tasks for since parameter
  const tasksRef = useRef([]);
  const intervalRef = useRef(null);
  
  // Use refs to prevent multiple terminal initializations and manage persistent session
  const terminalInitializing = useRef(false);
  const terminalInitialized = useRef(false);
  const persistentTerminal = useRef(null);
  const persistentSession = useRef(null);
  const persistentWs = useRef(null);
  const persistentFitAddon = useRef(null);
  const terminalCreating = useRef(false); // Guard against race conditions
  const terminalAttaching = useRef(false); // Guard against multiple attach calls
  const initialPromptSent = useRef(false); // Track if the initial prompt has been sent for the session
  
  // Update ref when tasks change
  useEffect(() => {
    tasksRef.current = tasks;
  }, [tasks]);

  // Single useEffect to manage task fetching and refresh intervals
  useEffect(() => {
    console.log('🔄 FOOTER: Polling state changed', {
      currentServer: currentServer?.hostname || 'none',
      footerIsActive,
      footerActiveView,
      shouldPoll: !!(currentServer && footerIsActive && footerActiveView === 'tasks'),
      hasInterval: !!intervalRef.current,
      timestamp: new Date().toISOString()
    });

    // Clear existing interval first
    if (intervalRef.current) {
      console.log('🛑 FOOTER: Clearing existing polling interval');
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    const shouldPoll = currentServer && footerIsActive && footerActiveView === 'tasks';

    if (currentServer) {
      // Clear tasks when server changes
      if (tasks.length > 0) {
        setTasks([]);
        setTasksError('');
      }
      
      // Only fetch and refresh tasks when footer is active and tasks view is selected
      if (shouldPoll) {
        console.log('🔄 FOOTER: Starting task polling');
        const loadAndStartRefresh = async () => {
          // Wait for initial load to complete
          await fetchTasks();
          // Only start the interval after initial load is done and if conditions are still met
          if (currentServer && footerIsActive && footerActiveView === 'tasks') {
            console.log('⏰ FOOTER: Starting 1-second polling interval');
            intervalRef.current = setInterval(() => {
              // Double-check conditions before each fetch to prevent unnecessary requests
              if (currentServer && footerIsActive && footerActiveView === 'tasks') {
                fetchTasks();
              } else {
                console.log('🛑 FOOTER: Stopping interval due to changed conditions');
                if (intervalRef.current) {
                  clearInterval(intervalRef.current);
                  intervalRef.current = null;
                }
              }
            }, 1000);
          }
        };
        
        loadAndStartRefresh();
      } else {
        console.log('🚫 FOOTER: Not starting polling - conditions not met');
      }
    } else {
      // Clear tasks when no server selected
      setTasks([]);
      setTasksError('');
      console.log('🚫 FOOTER: No server selected, tasks cleared');
    }
    
    return () => {
      if (intervalRef.current) {
        console.log('🧹 FOOTER: Cleanup - clearing polling interval');
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [currentServer, footerIsActive, footerActiveView]);

  const fetchTasks = useCallback(async () => {
    if (!currentServer || !makeZoneweaverAPIRequest) return;
    
    try {
      // Get current tasks from ref to determine since parameter
      const currentTasks = tasksRef.current;
      const params = { operation_ne: 'discover', limit: 50 };
      if (currentTasks.length > 0) {
        params.since = new Date(currentTasks[0].created_at).toISOString();
      }

      const result = await makeZoneweaverAPIRequest(
        currentServer.hostname,
        currentServer.port,
        currentServer.protocol,
        'tasks',
        'GET',
        null,
        params
      );

      if (result.success) {
        setTasks(prevTasks => {
          if (prevTasks.length === 0) {
            // First load - set all tasks
            const sortedTasks = result.data.tasks.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
            return sortedTasks;
          } else {
            // Subsequent loads - update existing tasks and add new ones
            if (result.data.tasks.length > 0) {
              const newTasks = result.data.tasks;
              const existingTasksMap = new Map(prevTasks.map(task => [task.id, task]));
              const updatedTasks = [...prevTasks];
              const tasksToAdd = [];
              let hasUpdates = false;
              
              // Process each task from API
              newTasks.forEach(apiTask => {
                if (existingTasksMap.has(apiTask.id)) {
                  // Update existing task if it has changed
                  const existingTask = existingTasksMap.get(apiTask.id);
                  if (existingTask.status !== apiTask.status || 
                      existingTask.updatedAt !== apiTask.updatedAt ||
                      existingTask.completed_at !== apiTask.completed_at ||
                      existingTask.error_message !== apiTask.error_message) {
                    // Find and update the existing task
                    const taskIndex = updatedTasks.findIndex(task => task.id === apiTask.id);
                    if (taskIndex !== -1) {
                      updatedTasks[taskIndex] = apiTask;
                      hasUpdates = true;
                    }
                  }
                } else {
                  // New task to add
                  tasksToAdd.push(apiTask);
                }
              });
              
              // Add new tasks to the beginning and sort them
              if (tasksToAdd.length > 0) {
                const sortedNewTasks = tasksToAdd.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
                return [...sortedNewTasks, ...updatedTasks];
              }
              
              // Return updated tasks if there were changes
              if (hasUpdates) {
                return updatedTasks;
              }
            }
            return prevTasks;
          }
        });
      } else {
        console.error(result.message || 'Failed to fetch tasks');
      }
    } catch (err) {
      console.error('An error occurred while fetching tasks:', err);
    }
  }, [currentServer, makeZoneweaverAPIRequest]);

  // Clean up persistent terminal when server changes
  useEffect(() => {
    console.log('🔄 FOOTER: Server change detected - cleanup check', {
      serverHostname: currentServer?.hostname || 'null',
      hasWs: !!persistentWs.current,
      hasSession: !!persistentSession.current,
      hasTerminal: !!persistentTerminal.current,
      timestamp: new Date().toISOString()
    });
    
    // Clean up previous terminal session when server changes
    if (persistentWs.current) {
      console.log('🔄 FOOTER: Closing WebSocket');
      persistentWs.current.close();
      persistentWs.current = null;
    }
    if (persistentSession.current) {
      console.log('🔄 FOOTER: Cleaning up session:', persistentSession.current.id);
      axios.delete(`/api/servers/${currentServer.hostname}/terminal/sessions/${persistentSession.current.id}/stop`).catch(console.error);
      persistentSession.current = null;
    }
    if (persistentTerminal.current) {
      console.log('🔄 FOOTER: Disposing terminal');
      persistentTerminal.current.dispose();
      persistentTerminal.current = null;
    }
    
    // Reset terminal state
    setTerm(null);
    setSession(null);
    terminalInitializing.current = false;
    terminalInitialized.current = false;
    initialPromptSent.current = false; // Reset prompt flag for new session
  }, [currentServer?.hostname]); // Only trigger when server hostname changes

  // Create persistent session and WebSocket (not terminal instance)
  const createPersistentTerminal = useCallback(async () => {
    console.log('🛠️ FOOTER: Creating persistent session', {
      currentServer: currentServer?.hostname || 'null',
      existingSession: !!persistentSession.current,
      existingWs: !!persistentWs.current,
      currentlyCreating: terminalCreating.current,
      timestamp: new Date().toISOString()
    });
    
    // Guard against race conditions - only allow one creation at a time
    if (!currentServer || persistentSession.current || terminalCreating.current) {
      console.log('🚫 FOOTER: Session creation blocked - already exists or creating');
      return;
    }

    // Set the creation guard
    terminalCreating.current = true;

    try {
      // Create backend session with terminal cookie
      const terminalCookie = `terminal_${currentServer.hostname}_${currentServer.port}_${crypto.randomUUID()}_${Date.now()}`;
      const res = await axios.post(`/api/servers/${currentServer.hostname}/terminal/start`, {
        terminal_cookie: terminalCookie
      });
      // Handle double-nested response structure from backend
      const sessionData = res.data.data?.data || res.data.data;
      console.log(`🔍 FOOTER: Parsed session data:`, {
        websocket_url: sessionData.websocket_url,
        id: sessionData.id,
        reused: sessionData.reused
      });
      
      // Create WebSocket connection using backend-provided URL
      const ws = new WebSocket(`wss://${window.location.host}${sessionData.websocket_url}`);
      
      // Single persistent message handler that forwards to current terminal
      const handlePersistentMessage = (event) => {
        if (persistentTerminal.current) {
          if (event.data instanceof Blob) {
            event.data.text().then(text => {
              persistentTerminal.current.write(text);
            });
          } else {
            persistentTerminal.current.write(event.data);
          }
        }
      };

      ws.onopen = () => {
        console.log('🔗 FOOTER: WebSocket connected for session:', sessionData.id);
        // Don't send initial newline here - wait for terminal to attach
      };

      ws.onmessage = handlePersistentMessage;

      ws.onclose = (event) => {
        console.log('🔗 FOOTER: WebSocket closed for session:', sessionData.id, 'Code:', event.code, 'Reason:', event.reason);
      };

      ws.onerror = (error) => {
        console.error('🚨 FOOTER: WebSocket error for session:', sessionData.id, error);
      };

      // Store persistent session and WebSocket
      persistentSession.current = sessionData;
      persistentWs.current = ws;
      setSession(sessionData);
      
      console.log('✅ FOOTER: Persistent session created:', sessionData.id);
      
    } catch (error) {
      console.error('Failed to create persistent session:', error);
    } finally {
      // Always reset the creation guard
      terminalCreating.current = false;
    }
  }, [currentServer]);

  // Create persistent session immediately when server is available (independent of UI state)
  useEffect(() => {
    if (currentServer && !persistentSession.current) {
      console.log('🛠️ FOOTER: Auto-creating session for server:', currentServer.hostname);
      createPersistentTerminal();
    }
  }, [currentServer, createPersistentTerminal]);

  // Create a fresh terminal instance that connects to the persistent session
  const attachTerminal = useCallback((terminalRef) => {
    console.log('🔗 FOOTER: Creating fresh terminal for HostShell', {
      hasSession: !!persistentSession.current,
      hasWs: !!persistentWs.current,
      hasRef: !!terminalRef.current,
      attaching: terminalAttaching.current,
      timestamp: new Date().toISOString()
    });
    
    if (!terminalRef.current || terminalAttaching.current) {
      console.log('🚫 FOOTER: No terminal ref provided or attach is already in progress');
      return () => {};
    }

    terminalAttaching.current = true;

    let cleanup = () => {};
    let terminalInstance = null;

    const createTerminalInstance = async () => {
      // Wait for session to be ready (with timeout)
      let attempts = 0;
      const maxAttempts = 50; // 5 seconds max wait
      
      while ((!persistentSession.current || !persistentWs.current) && attempts < maxAttempts) {
        if (attempts === 0) {
          console.log('🔗 FOOTER: Waiting for session to be ready...');
          // Trigger session creation if it doesn't exist
          if (!persistentSession.current && !terminalCreating.current) {
            createPersistentTerminal();
          }
        }
        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
      }

      if (!persistentSession.current || !persistentWs.current) {
        console.error('🚫 FOOTER: Timeout waiting for session');
        return;
      }

      // Create a fresh terminal instance for this mount
      const newTerm = new Terminal({
        cursorBlink: true,
        theme: {
          background: '#000000',
        },
      });
      const fitAddon = new FitAddon();
      newTerm.loadAddon(fitAddon);
      newTerm.loadAddon(new WebLinksAddon());

      // Connect new terminal to persistent WebSocket for input only
      const ws = persistentWs.current;
      
      // Set up terminal data handling (input to WebSocket)
      newTerm.onData((data) => {
        if (ws && ws.readyState === WebSocket.OPEN) {
          ws.send(data);
        }
      });

      // Open terminal in DOM
      console.log('🔗 FOOTER: Opening fresh terminal in DOM');
      try {
        newTerm.open(terminalRef.current);
        
        // Store current terminal instance (for resizing and message forwarding)
        persistentTerminal.current = newTerm;
        persistentFitAddon.current = fitAddon;
        setTerm(newTerm);
        terminalInstance = newTerm;
        
        // Fit terminal after DOM is ready and trigger shell prompt
        setTimeout(() => {
          try {
            fitAddon.fit();
            
            // Send initial newline to trigger shell prompt only if it hasn't been sent for this session
            if (ws && ws.readyState === WebSocket.OPEN && !initialPromptSent.current) {
              console.log('🔗 FOOTER: Triggering initial shell prompt for attached terminal');
              ws.send('\n');
              initialPromptSent.current = true; // Mark as sent
            }
          } catch (error) {
            console.warn('Error fitting terminal during attach:', error);
          }
        }, 100);
        
        // Set up cleanup function
        cleanup = () => {
          console.log('🔗 FOOTER: Disposing terminal instance');
          try {
            // Dispose terminal instance
            newTerm.dispose();
            
            // Clear refs if this was the current terminal
            if (persistentTerminal.current === newTerm) {
              persistentTerminal.current = null;
              persistentFitAddon.current = null;
              setTerm(null);
            }
          } catch (error) {
            console.warn('Error during terminal cleanup:', error);
          }
        };
        
      } catch (error) {
        console.error('Error opening fresh terminal:', error);
      } finally {
        terminalAttaching.current = false;
      }
    };

    // Start terminal creation asynchronously
    createTerminalInstance();

    // Return cleanup function
    return () => cleanup();
  }, [createPersistentTerminal]);

  // Function to resize terminal when footer expands/collapses
  const resizeTerminal = useCallback(() => {
    if (persistentTerminal.current && persistentFitAddon.current && persistentTerminal.current.element) {
      try {
        console.log('🔄 FOOTER: Resizing terminal');
        persistentFitAddon.current.fit();
      } catch (error) {
        console.warn('Failed to resize terminal:', error);
      }
    }
  }, []);

  // Function to restart the shell session
  const restartShell = useCallback(async () => {
    console.log('🔄 FOOTER: Restarting shell session');
    
    if (!currentServer) return;

    try {
      // Clean up current terminal session
      if (persistentWs.current) {
        persistentWs.current.close();
        persistentWs.current = null;
      }
      if (persistentSession.current) {
        await axios.delete(`/api/servers/${currentServer.hostname}/terminal/sessions/${persistentSession.current.id}/stop`).catch(console.error);
        persistentSession.current = null;
      }
      if (persistentTerminal.current) {
        persistentTerminal.current.dispose();
        persistentTerminal.current = null;
      }

      // Reset state
      setTerm(null);
      setSession(null);
      terminalInitializing.current = false;
      terminalInitialized.current = false;

      // Create new terminal session (which will be fresh/cleared)
      await createPersistentTerminal();
    } catch (error) {
      console.error('Failed to restart shell:', error);
    }
  }, [currentServer, createPersistentTerminal]);

  const value = React.useMemo(() => ({
    tasks,
    tasksError,
    fetchTasks,
    term,
    attachTerminal,
    resizeTerminal,
    restartShell,
  }), [tasks, tasksError, fetchTasks, term, attachTerminal, resizeTerminal, restartShell]);

  return (
    <FooterContext.Provider value={value}>
      {children}
    </FooterContext.Provider>
  );
};
