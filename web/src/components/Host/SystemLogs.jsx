import React, { useState, useEffect } from 'react';
import { useServers } from '../../contexts/ServerContext';

const SystemLogs = ({ server }) => {
  const [logFiles, setLogFiles] = useState([]);
  const [selectedLog, setSelectedLog] = useState(null);
  const [logData, setLogData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [logLoading, setLogLoading] = useState(false);
  const [error, setError] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamSession, setStreamSession] = useState(null);
  const [websocket, setWebsocket] = useState(null);
  const [streamLines, setStreamLines] = useState([]);
  const [filters, setFilters] = useState({
    lines: 100,
    tail: true,
    grep: '',
    since: ''
  });
  
  const { makeZoneweaverAPIRequest } = useServers();

  // Load log files on component mount
  useEffect(() => {
    loadLogFiles();
  }, [server]);

  // Auto-refresh logic
  useEffect(() => {
    if (autoRefresh && selectedLog && !isStreaming) {
      const interval = setInterval(() => {
        loadLogContent();
      }, 5000); // Refresh every 5 seconds
      
      return () => clearInterval(interval);
    }
  }, [autoRefresh, selectedLog, filters, isStreaming]);

  // Cleanup WebSocket on unmount or server change
  useEffect(() => {
    return () => {
      if (websocket) {
        websocket.close();
      }
      if (streamSession) {
        stopLogStream();
      }
    };
  }, [server]);

  const loadLogFiles = async () => {
    if (!server || !makeZoneweaverAPIRequest) return;
    
    try {
      setLoading(true);
      setError('');
      
      const result = await makeZoneweaverAPIRequest(
        server.hostname,
        server.port,
        server.protocol,
        'system/logs/list',
        'GET'
      );
      
      if (result.success) {
        setLogFiles(result.data?.log_files || []);
      } else {
        setError(result.message || 'Failed to load log files');
        setLogFiles([]);
      }
    } catch (err) {
      setError('Error loading log files: ' + err.message);
      setLogFiles([]);
    } finally {
      setLoading(false);
    }
  };

  const loadLogContent = async () => {
    if (!server || !selectedLog || !makeZoneweaverAPIRequest) return;
    
    try {
      setLogLoading(true);
      setError('');
      
      const params = {
        lines: filters.lines,
        tail: filters.tail
      };
      if (filters.grep) params.grep = filters.grep;
      if (filters.since) params.since = filters.since;
      
      let endpoint = '';
      if (selectedLog.type === 'fault-manager') {
        endpoint = `system/logs/fault-manager/${selectedLog.subtype}`;
      } else {
        endpoint = `system/logs/${selectedLog.name}`;
      }
      
      const result = await makeZoneweaverAPIRequest(
        server.hostname,
        server.port,
        server.protocol,
        endpoint,
        'GET',
        null,
        params
      );
      
      if (result.success) {
        setLogData(result.data);
      } else {
        setError(result.message || 'Failed to load log content');
        setLogData(null);
      }
    } catch (err) {
      setError('Error loading log content: ' + err.message);
      setLogData(null);
    } finally {
      setLogLoading(false);
    }
  };

  const handleLogSelect = (log) => {
    setSelectedLog(log);
    setLogData(null);
    // Auto-load content when a log is selected
    setTimeout(() => loadLogContent(), 100);
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const toggleAutoRefresh = () => {
    setAutoRefresh(prev => !prev);
  };

  // WebSocket streaming functions
  const startLogStream = async () => {
    if (!server || !selectedLog || !makeZoneweaverAPIRequest) return;
    if (selectedLog.type === 'fault-manager') {
      setError('Real-time streaming is not available for Fault Manager logs');
      return;
    }
    
    try {
      setLogLoading(true);
      setError('');
      
      const payload = {
        follow_lines: filters.lines,
        grep_pattern: filters.grep || null
      };
      
      const result = await makeZoneweaverAPIRequest(
        server.hostname,
        server.port,
        server.protocol,
        `system/logs/${selectedLog.name}/stream/start`,
        'POST',
        payload
      );
      
      if (result.success) {
        const session = result.data;
        setStreamSession(session);
        setStreamLines([]);
        connectToWebSocket(session);
      } else {
        setError(result.message || 'Failed to start log stream');
      }
    } catch (err) {
      setError('Error starting log stream: ' + err.message);
    } finally {
      setLogLoading(false);
    }
  };

  const stopLogStream = async () => {
    if (!streamSession || !makeZoneweaverAPIRequest) return;
    
    try {
      // Close WebSocket first
      if (websocket) {
        websocket.close();
        setWebsocket(null);
      }
      
      const result = await makeZoneweaverAPIRequest(
        server.hostname,
        server.port,
        server.protocol,
        `system/logs/stream/${streamSession.session_id}/stop`,
        'DELETE'
      );
      
      setIsStreaming(false);
      setStreamSession(null);
      setStreamLines([]);
      
      if (!result.success) {
        console.warn('Failed to stop stream session:', result.message);
      }
    } catch (err) {
      console.error('Error stopping log stream:', err);
    }
  };

  const connectToWebSocket = (session) => {
    const protocol = server.protocol === 'https' ? 'wss' : 'ws';
    const wsUrl = `${protocol}://${server.hostname}:${server.port}/logs/stream/${session.session_id}`;
    
    const ws = new WebSocket(wsUrl);
    
    ws.onopen = () => {
      console.log('Connected to log stream:', session.session_id);
      setIsStreaming(true);
      setWebsocket(ws);
    };
    
    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        
        switch (message.type) {
          case 'status':
            console.log('Stream status:', message.message);
            break;
          case 'log_line':
            setStreamLines(prev => {
              const newLines = [...prev, {
                line: message.line,
                timestamp: message.timestamp,
                id: Date.now() + Math.random()
              }];
              // Keep only last 1000 lines to prevent memory issues
              return newLines.slice(-1000);
            });
            break;
          case 'error':
            setError(`Stream error: ${message.message}`);
            break;
        }
      } catch (err) {
        console.error('Error parsing WebSocket message:', err);
      }
    };
    
    ws.onclose = (event) => {
      console.log('Log stream disconnected:', event.code, event.reason);
      setIsStreaming(false);
      setWebsocket(null);
      if (event.code !== 1000) { // Not a normal closure
        setError('Log stream connection lost');
      }
    };
    
    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      setError('WebSocket connection error');
      setIsStreaming(false);
    };
  };

  const toggleStreaming = () => {
    if (isStreaming) {
      stopLogStream();
    } else {
      startLogStream();
    }
  };

  const clearStreamLines = () => {
    setStreamLines([]);
  };

  const getLogIcon = (type) => {
    switch (type) {
      case 'system':
        return 'fas fa-server';
      case 'authentication':
        return 'fas fa-key';
      case 'fault-manager':
        return 'fas fa-exclamation-triangle';
      default:
        return 'fas fa-file-alt';
    }
  };

  const getLogLevelClass = (line) => {
    const lower = line.toLowerCase();
    if (lower.includes('error') || lower.includes('fail')) return 'has-text-danger';
    if (lower.includes('warning') || lower.includes('warn')) return 'has-text-warning';
    if (lower.includes('info')) return 'has-text-info';
    if (lower.includes('debug')) return 'has-text-grey';
    return 'has-text-white';
  };

  const formatTimestamp = (line) => {
    // Extract timestamp from beginning of line if present
    const timestampMatch = line.match(/^(\w{3}\s+\d{1,2}\s+\d{2}:\d{2}:\d{2})/);
    return timestampMatch ? timestampMatch[1] : '';
  };

  // Group log files by type for the file explorer
  const groupedLogs = logFiles.reduce((acc, log) => {
    if (!acc[log.type]) acc[log.type] = [];
    acc[log.type].push(log);
    return acc;
  }, {});

  // Add fault manager special logs
  if (!groupedLogs['fault-manager']) {
    groupedLogs['fault-manager'] = [
      { name: 'faults', displayName: 'Faults', type: 'fault-manager', subtype: 'faults' },
      { name: 'errors', displayName: 'Errors', type: 'fault-manager', subtype: 'errors' },
      { name: 'info', displayName: 'Info', type: 'fault-manager', subtype: 'info' },
      { name: 'info-hival', displayName: 'Info (High Value)', type: 'fault-manager', subtype: 'info-hival' }
    ];
  }

  return (
    <div>
      {/* Error Display */}
      {error && (
        <div className='notification is-danger mb-4'>
          <button className='delete' onClick={() => setError('')}></button>
          <p>{error}</p>
        </div>
      )}

      <div className='columns'>
        {/* Left Panel - File Explorer */}
        <div className='column is-3'>
          <div className='box'>
            <h4 className='title is-6 mb-3'>
              <span className='icon-text'>
                <span className='icon'><i className='fas fa-folder-open'></i></span>
                <span>Log Files</span>
              </span>
            </h4>
            
            {loading ? (
              <div className='has-text-centered p-4'>
                <span className='icon'>
                  <i className='fas fa-spinner fa-spin'></i>
                </span>
                <p className='mt-2 is-size-7'>Loading...</p>
              </div>
            ) : (
              <div className='menu'>
                {Object.entries(groupedLogs).map(([type, logs]) => (
                  <div key={type}>
                    <p className='menu-label'>
                      {type.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} Logs
                    </p>
                    <ul className='menu-list'>
                      {logs.map((log, index) => (
                        <li key={index}>
                          <a 
                            className={selectedLog?.name === log.name ? 'is-active' : ''}
                            onClick={() => handleLogSelect(log)}
                          >
                            <span className='icon'>
                              <i className={getLogIcon(log.type)}></i>
                            </span>
                            <span>{log.displayName || log.name}</span>
                            {log.sizeFormatted && (
                              <span className='tag is-small is-light ml-auto'>
                                {log.sizeFormatted}
                              </span>
                            )}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Panel - Log Viewer */}
        <div className='column is-9'>
          {selectedLog ? (
            <div>
              {/* Log Controls */}
              <div className='box mb-4'>
                <div className='columns'>
                  <div className='column is-2'>
                    <div className='field'>
                      <label className='label is-small'>Lines</label>
                      <div className='control'>
                        <input 
                          className='input is-small'
                          type='number'
                          min='10'
                          max='1000'
                          value={filters.lines}
                          onChange={(e) => handleFilterChange('lines', parseInt(e.target.value))}
                        />
                      </div>
                    </div>
                  </div>
                  <div className='column is-3'>
                    <div className='field'>
                      <label className='label is-small'>Filter (grep)</label>
                      <div className='control'>
                        <input 
                          className='input is-small'
                          type='text'
                          placeholder='error, warning...'
                          value={filters.grep}
                          onChange={(e) => handleFilterChange('grep', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                  <div className='column is-3'>
                    <div className='field'>
                      <label className='label is-small'>Since</label>
                      <div className='control'>
                        <input 
                          className='input is-small'
                          type='datetime-local'
                          value={filters.since}
                          onChange={(e) => handleFilterChange('since', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                  <div className='column is-1'>
                    <div className='field'>
                      <label className='label is-small'>Tail</label>
                      <div className='control'>
                        <label className='checkbox'>
                          <input 
                            type='checkbox'
                            checked={filters.tail}
                            onChange={(e) => handleFilterChange('tail', e.target.checked)}
                          />
                          <span className='ml-1'>Latest</span>
                        </label>
                      </div>
                    </div>
                  </div>
                  <div className='column is-narrow'>
                    <div className='field'>
                      <label className='label is-small'>&nbsp;</label>
                      <div className='control'>
                        <button 
                          className='button is-small is-info'
                          onClick={loadLogContent}
                          disabled={logLoading}
                        >
                          <span className='icon'>
                            <i className='fas fa-sync-alt'></i>
                          </span>
                          <span>Refresh</span>
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className='column is-narrow'>
                    <div className='field'>
                      <label className='label is-small'>&nbsp;</label>
                      <div className='control'>
                        <button 
                          className={`button is-small ${autoRefresh ? 'is-success' : ''}`}
                          onClick={toggleAutoRefresh}
                          disabled={logLoading || isStreaming}
                        >
                          <span className='icon'>
                            <i className={`fas ${autoRefresh ? 'fa-pause' : 'fa-play'}`}></i>
                          </span>
                          <span>{autoRefresh ? 'Stop' : 'Auto'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className='column is-narrow'>
                    <div className='field'>
                      <label className='label is-small'>&nbsp;</label>
                      <div className='control'>
                        <button 
                          className={`button is-small ${isStreaming ? 'is-primary' : 'is-warning'}`}
                          onClick={toggleStreaming}
                          disabled={logLoading || selectedLog?.type === 'fault-manager'}
                          title={selectedLog?.type === 'fault-manager' ? 'Streaming not available for Fault Manager logs' : (isStreaming ? 'Stop real-time streaming' : 'Start real-time streaming')}
                        >
                          <span className='icon'>
                            <i className={`fas ${isStreaming ? 'fa-stop' : 'fa-stream'}`}></i>
                          </span>
                          <span>{isStreaming ? 'Stop Stream' : 'Live Stream'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Log Content */}
              <div className='box'>
                <div className='level is-mobile mb-3'>
                  <div className='level-left'>
                    <h4 className='title is-6'>
                      <span className='icon-text'>
                        <span className='icon'><i className={getLogIcon(selectedLog.type)}></i></span>
                        <span>{selectedLog.displayName || selectedLog.name}</span>
                      </span>
                      {logLoading && <span className='ml-2'><i className='fas fa-spinner fa-spin'></i></span>}
                      {isStreaming && (
                        <span className='tag is-primary is-small ml-2'>
                          <span className='icon is-small'>
                            <i className='fas fa-satellite-dish'></i>
                          </span>
                          <span>Live Stream</span>
                        </span>
                      )}
                    </h4>
                  </div>
                  <div className='level-right'>
                    <div className='field has-addons'>
                      {isStreaming && streamLines.length > 0 && (
                        <div className='control'>
                          <button 
                            className='button is-small'
                            onClick={clearStreamLines}
                            title='Clear stream buffer'
                          >
                            <span className='icon'>
                              <i className='fas fa-eraser'></i>
                            </span>
                            <span>Clear</span>
                          </button>
                        </div>
                      )}
                      <div className='control'>
                        <div className='tags'>
                          {isStreaming ? (
                            <>
                              <span className='tag is-primary is-small'>
                                {streamLines.length} stream lines
                              </span>
                              {filters.grep && (
                                <span className='tag is-warning is-small'>
                                  Filtered: {filters.grep}
                                </span>
                              )}
                            </>
                          ) : logData ? (
                            <>
                              <span className='tag is-info is-small'>
                                {logData.totalLines} lines
                              </span>
                              {logData.filters?.grep && (
                                <span className='tag is-warning is-small'>
                                  Filtered: {logData.filters.grep}
                                </span>
                              )}
                              <span className='tag is-light is-small'>
                                {filters.tail ? 'Latest' : 'Oldest'} {filters.lines}
                              </span>
                            </>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Log Display */}
                {(isStreaming && streamLines.length > 0) || (logData && logData.lines) ? (
                  <div className='content'>
                    <pre className='box has-background-black has-text-light p-4 log-viewer' 
                         style={{ height: '500px', overflowY: 'auto', fontSize: '0.8rem', lineHeight: '1.2' }}
                         ref={(el) => {
                           // Auto-scroll to bottom for streaming
                           if (el && isStreaming) {
                             el.scrollTop = el.scrollHeight;
                           }
                         }}>
                      {isStreaming ? (
                        // Display streaming lines
                        streamLines.map((item) => {
                          const timestamp = formatTimestamp(item.line);
                          const content = timestamp ? item.line.substring(timestamp.length).trim() : item.line;
                          
                          return (
                            <div key={item.id} className='log-line mb-1'>
                              {timestamp && (
                                <span className='has-text-grey-light mr-2'>
                                  {timestamp}
                                </span>
                              )}
                              <span className={getLogLevelClass(content)}>
                                {content}
                              </span>
                            </div>
                          );
                        })
                      ) : (
                        // Display static log lines
                        logData.lines.map((line, index) => {
                          const timestamp = formatTimestamp(line);
                          const content = timestamp ? line.substring(timestamp.length).trim() : line;
                          
                          return (
                            <div key={index} className='log-line mb-1'>
                              {timestamp && (
                                <span className='has-text-grey-light mr-2'>
                                  {timestamp}
                                </span>
                              )}
                              <span className={getLogLevelClass(content)}>
                                {content}
                              </span>
                            </div>
                          );
                        })
                      )}
                    </pre>
                  </div>
                ) : logLoading ? (
                  <div className='has-text-centered p-6'>
                    <span className='icon is-large'>
                      <i className='fas fa-spinner fa-spin fa-2x'></i>
                    </span>
                    <p className='mt-2'>
                      {isStreaming ? 'Connecting to log stream...' : 'Loading log content...'}
                    </p>
                  </div>
                ) : isStreaming ? (
                  <div className='has-text-centered p-6'>
                    <span className='icon is-large has-text-success'>
                      <i className='fas fa-satellite-dish fa-2x'></i>
                    </span>
                    <p className='mt-2 has-text-success'>
                      <strong>Live stream active</strong>
                    </p>
                    <p className='is-size-7 has-text-grey'>Waiting for new log entries...</p>
                  </div>
                ) : (
                  <div className='has-text-centered p-6'>
                    <span className='icon is-large has-text-grey'>
                      <i className='fas fa-file-alt fa-2x'></i>
                    </span>
                    <p className='mt-2 has-text-grey'>
                      {selectedLog ? 'Click Refresh to load log content' : 'Select a log file to view content'}
                    </p>
                  </div>
                )}

                {/* Log File Info */}
                {logData && logData.fileInfo && (
                  <div className='notification is-light mt-3 is-small'>
                    <div className='level is-mobile'>
                      <div className='level-left'>
                        <div>
                          <p className='is-size-7'>
                            <strong>File:</strong> {logData.path} 
                            <span className='ml-3'><strong>Size:</strong> {logData.fileInfo.sizeFormatted}</span>
                            <span className='ml-3'><strong>Modified:</strong> {new Date(logData.fileInfo.modified).toLocaleString()}</span>
                          </p>
                        </div>
                      </div>
                      <div className='level-right'>
                        <div className='buttons are-small'>
                          <button 
                            className='button is-small'
                            onClick={() => {
                              // Download log content
                              const blob = new Blob([logData.raw_output || logData.lines?.join('\n') || ''], 
                                                  { type: 'text/plain' });
                              const url = URL.createObjectURL(blob);
                              const a = document.createElement('a');
                              a.href = url;
                              a.download = `${selectedLog.name}-${new Date().toISOString().split('T')[0]}.log`;
                              document.body.appendChild(a);
                              a.click();
                              document.body.removeChild(a);
                              URL.revokeObjectURL(url);
                            }}
                            title='Download Log'
                          >
                            <span className='icon'>
                              <i className='fas fa-download'></i>
                            </span>
                            <span>Download</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className='box'>
              <div className='has-text-centered p-6'>
                <span className='icon is-large has-text-info'>
                  <i className='fas fa-file-alt fa-3x'></i>
                </span>
                <h4 className='title is-5 mt-4'>System Log Viewer</h4>
                <p className='content'>
                  Select a log file from the left panel to view its contents. 
                  Use filters to search specific entries, limit line count, or view recent activity.
                </p>
                <div className='content is-small has-text-grey'>
                  <p><strong>Available Logs:</strong></p>
                  <ul>
                    <li><strong>System Logs:</strong> messages, syslog</li>
                    <li><strong>Authentication:</strong> authlog</li>
                    <li><strong>Fault Manager:</strong> faults, errors, info</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SystemLogs;
