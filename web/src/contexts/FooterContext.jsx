import React, { createContext, useState, useEffect, useContext, useCallback, useRef } from 'react';
import { useServers } from './ServerContext';
import { UserSettings } from './UserSettingsContext';
import axios from 'axios';

// Throttle utility for performance optimization
const throttle = (func, limit) => {
  let inThrottle;
  return function() {
    const args = arguments;
    const context = this;
    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  }
};

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
  const [session, setSession] = useState(null);
  
  // Use ref to track current tasks for since parameter
  const tasksRef = useRef([]);
  const intervalRef = useRef(null);
  
  // Simplified session management for react-xtermjs
  const persistentSession = useRef(null);
  const persistentWs = useRef(null);
  const terminalCreating = useRef(false);
  
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

  // Clean up session when server changes
  useEffect(() => {
    console.log('🔄 FOOTER: Server change detected - cleanup check', {
      serverHostname: currentServer?.hostname || 'null',
      hasWs: !!persistentWs.current,
      hasSession: !!persistentSession.current,
      timestamp: new Date().toISOString()
    });
    
    // Clean up previous session when server changes
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
    
    // Reset session state
    setSession(null);
  }, [currentServer?.hostname]); // Only trigger when server hostname changes

  // Create session and WebSocket for react-xtermjs
  const createSession = useCallback(async () => {
    console.log('🛠️ FOOTER: Creating session', {
      currentServer: currentServer?.hostname || 'null',
      existingSession: !!persistentSession.current,
      currentlyCreating: terminalCreating.current,
      timestamp: new Date().toISOString()
    });
    
    if (!currentServer || persistentSession.current || terminalCreating.current) {
      console.log('🚫 FOOTER: Session creation blocked - already exists or creating');
      return;
    }

    terminalCreating.current = true;

    try {
      // Create backend session
      const terminalCookie = `terminal_${currentServer.hostname}_${currentServer.port}_${crypto.randomUUID()}_${Date.now()}`;
      const res = await axios.post(`/api/servers/${currentServer.hostname}/terminal/start`, {
        terminal_cookie: terminalCookie
      });
      
      const sessionData = res.data.data?.data || res.data.data;
      console.log(`🔍 FOOTER: Parsed session data:`, {
        websocket_url: sessionData.websocket_url,
        id: sessionData.id,
        reused: sessionData.reused
      });
      
      // Create WebSocket for react-xtermjs
      const ws = new WebSocket(`wss://${window.location.host}${sessionData.websocket_url}`);
      
      ws.onopen = () => {
        console.log('🔗 FOOTER: WebSocket connected for session:', sessionData.id);
        // Send initial prompt
        ws.send('\n');
      };

      ws.onclose = (event) => {
        console.log('🔗 FOOTER: WebSocket closed for session:', sessionData.id, 'Code:', event.code, 'Reason:', event.reason);
      };

      ws.onerror = (error) => {
        console.error('🚨 FOOTER: WebSocket error for session:', sessionData.id, error);
      };

      // Store session with WebSocket for HostShell
      const sessionWithWs = {
        ...sessionData,
        websocket: ws
      };
      
      persistentSession.current = sessionWithWs;
      persistentWs.current = ws;
      setSession(sessionWithWs);
      
      console.log('✅ FOOTER: Session created:', sessionData.id);
      
    } catch (error) {
      console.error('Failed to create session:', error);
    } finally {
      terminalCreating.current = false;
    }
  }, [currentServer]);

  // Create session when server is available
  useEffect(() => {
    if (currentServer && !persistentSession.current) {
      console.log('🛠️ FOOTER: Auto-creating session for server:', currentServer.hostname);
      createSession();
    }
  }, [currentServer, createSession]);

  // Restart shell session
  const restartShell = useCallback(async () => {
    console.log('🔄 FOOTER: Restarting shell session');
    
    if (!currentServer) return;

    try {
      // Clean up current session
      if (persistentWs.current) {
        persistentWs.current.close();
        persistentWs.current = null;
      }
      if (persistentSession.current) {
        await axios.delete(`/api/servers/${currentServer.hostname}/terminal/sessions/${persistentSession.current.id}/stop`).catch(console.error);
        persistentSession.current = null;
      }

      // Reset state
      setSession(null);

      // Create new session
      await createSession();
    } catch (error) {
      console.error('Failed to restart shell:', error);
    }
  }, [currentServer, createSession]);

  const value = React.useMemo(() => ({
    tasks,
    tasksError,
    fetchTasks,
    session,
    restartShell,
  }), [tasks, tasksError, fetchTasks, session, restartShell]);

  return (
    <FooterContext.Provider value={value}>
      {children}
    </FooterContext.Provider>
  );
};
