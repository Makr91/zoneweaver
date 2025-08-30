import React, { useEffect, useState } from "react";
import { Helmet } from "@dr.pogodin/react-helmet";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useServers } from "../contexts/ServerContext";

/**
 * Multi-Host Application Overview Dashboard
 * 
 * This dashboard provides an infrastructure-wide view across all configured
 * Zoneweaver API Servers, showing aggregate data and health status rather than
 * detailed single-host information (which is available in Hosts.jsx).
 */
const Dashboard = () => {
  const [infrastructureData, setInfrastructureData] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [lastRefresh, setLastRefresh] = useState(null);
  const [showHealthModal, setShowHealthModal] = useState(false);
  
  const { user } = useAuth();
  const { 
    getServers, 
    makeZoneweaverAPIRequest, 
    servers, 
    loading: serversLoading,
    selectServer,
    selectZone 
  } = useServers();
  const navigate = useNavigate();

  // Fetch infrastructure data from all servers
  const fetchInfrastructureData = async () => {
    if (!servers || servers.length === 0) {
      setError("No Zoneweaver API Servers configured. Please add a server first.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      
      const serverPromises = servers.map(async (server) => {
        try {
          const result = await makeZoneweaverAPIRequest(
            server.hostname,
            server.port,
            server.protocol,
            'stats'
          );

          return {
            server,
            success: result.success,
            data: result.success ? result.data : null,
            error: result.success ? null : result.message || 'Failed to fetch data'
          };
        } catch (error) {
          return {
            server,
            success: false,
            data: null,
            error: error.message || 'Connection failed'
          };
        }
      });

      const results = await Promise.all(serverPromises);
      
      // Process results into infrastructure overview
      const processed = {
        servers: results,
        summary: calculateInfrastructureSummary(results),
        lastUpdated: new Date().toISOString()
      };
      
      setInfrastructureData(processed);
      setLastRefresh(new Date());
      
    } catch (error) {
      console.error('Error fetching infrastructure data:', error);
      setError('Error fetching infrastructure overview');
    } finally {
      setLoading(false);
    }
  };

  // Calculate aggregate infrastructure metrics
  const calculateInfrastructureSummary = (serverResults) => {
    const summary = {
      totalServers: serverResults.length,
      onlineServers: 0,
      offlineServers: 0,
      totalZones: 0,
      runningZones: 0,
      stoppedZones: 0,
      totalMemory: 0,
      usedMemory: 0,
      healthyServers: 0,
      serversWithIssues: 0,
      recentActivity: []
    };

    serverResults.forEach(result => {
      if (result.success && result.data) {
        summary.onlineServers++;
        
        // Zone statistics
        const allZones = result.data.allzones || [];
        const runningZones = result.data.runningzones || [];
        
        summary.totalZones += allZones.length;
        summary.runningZones += runningZones.length;
        summary.stoppedZones += (allZones.length - runningZones.length);
        
        // Memory statistics
        if (result.data.totalmem && result.data.freemem) {
          summary.totalMemory += result.data.totalmem;
          summary.usedMemory += (result.data.totalmem - result.data.freemem);
        }
        
        // Health assessment (simplified)
        const hasHighLoad = result.data.loadavg && result.data.loadavg[0] > 2;
        const hasLowFreeMemory = result.data.totalmem && result.data.freemem && 
          (result.data.freemem / result.data.totalmem) < 0.1;
        
        if (hasHighLoad || hasLowFreeMemory) {
          summary.serversWithIssues++;
        } else {
          summary.healthyServers++;
        }
        
      } else {
        summary.offlineServers++;
        summary.serversWithIssues++;
      }
    });

    return summary;
  };

  // Helper functions
  const bytesToSize = (bytes) => {
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
    if (bytes === 0) return "0 Byte";
    const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
    return Math.round(bytes / Math.pow(1024, i), 2) + " " + sizes[i];
  };

  const getServerHealthStatus = (serverResult) => {
    if (!serverResult.success) return 'offline';
    
    const data = serverResult.data;
    if (!data) return 'offline';
    
    // Check for performance issues
    const hasHighLoad = data.loadavg && data.loadavg[0] > 2;
    const hasLowFreeMemory = data.totalmem && data.freemem && 
      (data.freemem / data.totalmem) < 0.1;
    
    if (hasHighLoad || hasLowFreeMemory) return 'warning';
    return 'healthy';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'healthy': return 'has-text-success';
      case 'warning': return 'has-text-warning';
      case 'offline': return 'has-text-danger';
      default: return 'has-text-grey';
    }
  };

  // Navigation helpers
  const navigateToServer = (server) => {
    selectServer(server);
    navigate('/ui/hosts');
  };

  const navigateToZones = () => {
    navigate('/ui/zones');
  };

  const navigateToServerRegister = () => {
    navigate('/ui/settings/zoneweaver?tab=servers');
  };

  const navigateToZoneRegister = () => {
    navigate('/ui/zone-register');
  };

  // Effects
  useEffect(() => {
    if (!serversLoading && servers && servers.length > 0) {
      fetchInfrastructureData();
      
      // Set up auto-refresh every 30 seconds (less frequent than single host)
      const interval = setInterval(fetchInfrastructureData, 30 * 1000);
      return () => clearInterval(interval);
    }
  }, [servers, serversLoading]);

  // Loading state
  if (serversLoading || (loading && !infrastructureData.servers)) {
    return (
      <div className='hero-body mainbody p-0 is-align-items-stretch'>
        <div className='container has-text-centered p-6'>
          <div className='button is-loading is-large is-ghost'></div>
          <p className='mt-2'>Loading infrastructure overview...</p>
        </div>
      </div>
    );
  }

  // No servers state
  if (!servers || servers.length === 0) {
    return (
      <div className='hero-body mainbody p-0 is-align-items-stretch'>
        <Helmet>
          <meta charSet='utf-8' />
          <title>Infrastructure Overview - Zoneweaver</title>
          <link rel='canonical' href={window.location.origin} />
        </Helmet>
        <div className='container p-6'>
          <div className='notification is-info'>
            <h2 className='title is-4'>Welcome to Zoneweaver</h2>
            <p className='mb-4'>Get started by adding your first Zoneweaver API Server to begin managing your infrastructure.</p>
            <button 
              onClick={navigateToServerRegister}
              className='button is-primary'
            >
              <span className='icon'>
                <i className='fas fa-plus'></i>
              </span>
              <span>Add Zoneweaver API Server</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  const { summary } = infrastructureData;

  return (
    <div className='hero-body mainbody p-0 is-align-items-stretch'>
      <Helmet>
        <meta charSet='utf-8' />
        <title>Infrastructure Overview - Zoneweaver</title>
        <link rel='canonical' href={window.location.origin} />
      </Helmet>

      <div className='container is-fluid p-3'>
        {/* Header with rounded corners */}
        <div className='box mb-3'>
          <div className='level is-mobile'>
            <div className='level-left'>
              <div className='level-item'>
                <div>
                  <h1 className='title is-3 mb-1'>Infrastructure Overview</h1>
                  <p className='subtitle is-6 has-text-grey'>
                    Managing {summary?.totalServers || 0} servers with {summary?.totalZones || 0} zones
                    {lastRefresh && (
                      <span className='ml-2'>
                        • Last updated {lastRefresh.toLocaleTimeString()}
                      </span>
                    )}
                  </p>
                </div>
              </div>
            </div>
            <div className='level-right'>
              <div className='level-item'>
                <button 
                  className={`button is-small ${loading ? 'is-loading' : ''}`}
                  onClick={fetchInfrastructureData}
                  disabled={loading}
                >
                  <span className='icon'>
                    <i className='fas fa-sync-alt'></i>
                  </span>
                  <span>Refresh</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className='notification is-dangermb-4'>
            <p>{error}</p>
          </div>
        )}

        {/* Infrastructure Summary Cards */}
        {summary && (
          <div className='columns is-multiline mb-3'>
            <div className='column is-3'>
              <div className='box has-text-centered'>
                <div className='heading'>Total Servers</div>
                <div className='title is-2 has-text-info'>{summary.totalServers}</div>
                <div className='level is-mobile mt-2'>
                  <div className='level-item has-text-centered'>
                    <div>
                      <div className='heading has-text-success'>Online</div>
                      <div className='title is-6'>{summary.onlineServers}</div>
                    </div>
                  </div>
                  <div className='level-item has-text-centered'>
                    <div>
                      <div className='heading has-text-danger'>Offline</div>
                      <div className='title is-6'>{summary.offlineServers}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className='column is-3'>
              <div className='box has-text-centered'>
                <div className='heading'>Total Zones</div>
                <div className='title is-2 has-text-primary'>{summary.totalZones}</div>
                <div className='level is-mobile mt-2'>
                  <div className='level-item has-text-centered'>
                    <div>
                      <div className='heading has-text-success'>Running</div>
                      <div className='title is-6'>{summary.runningZones}</div>
                    </div>
                  </div>
                  <div className='level-item has-text-centered'>
                    <div>
                      <div className='heading has-text-warning'>Stopped</div>
                      <div className='title is-6'>{summary.stoppedZones}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className='column is-3'>
              <div className='box has-text-centered'>
                <div className='heading'>Memory Usage</div>
                <div className='title is-2 has-text-link'>
                  {summary.totalMemory > 0 ? 
                    `${Math.round((summary.usedMemory / summary.totalMemory) * 100)}%` : 
                    'N/A'
                  }
                </div>
                <div className='mt-2'>
                  <div className='heading'>
                    {summary.totalMemory > 0 ? 
                      `${bytesToSize(summary.usedMemory)} / ${bytesToSize(summary.totalMemory)}` :
                      'No data available'
                    }
                  </div>
                  {summary.totalMemory > 0 && (
                    <progress 
                      className='progress is-small is-link mt-2' 
                      value={summary.usedMemory} 
                      max={summary.totalMemory}
                    ></progress>
                  )}
                </div>
              </div>
            </div>

            <div className='column is-3'>
              <div className={`box has-text-centered ${summary.serversWithIssues > 0 ? 'is-clickable' : ''}`}
                onClick={() => {
                  if (summary.serversWithIssues > 0) {
                    setShowHealthModal(true);
                  }
                }}
                title={summary.serversWithIssues > 0 ? 'Click to view details' : ''}
              >
                <div className='heading'>Health Status</div>
                <div className='title is-2 has-text-success'>{summary.healthyServers}</div>
                <div className='level is-mobile mt-2'>
                  <div className='level-item has-text-centered'>
                    <div>
                      <div className='heading has-text-success'>Healthy</div>
                      <div className='title is-6'>{summary.healthyServers}</div>
                    </div>
                  </div>
                  <div className='level-item has-text-centered'>
                    <div>
                      <div className='heading has-text-warning'>Issues</div>
                      <div className='title is-6'>{summary.serversWithIssues}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions and Zone Distribution */}
        <div className='columns mb-3'>
          <div className='column is-8'>
            <div className='box'>
              <h2 className='title is-4 mb-4'>
                <span className='icon-text'>
                  <span className='icon'><i className='fas fa-bolt'></i></span>
                  <span>Quick Actions</span>
                </span>
              </h2>
              
              <div className='columns is-multiline'>
                <div className='column is-6'>
                  <button 
                    className='button is-fullwidth is-primary is-medium'
                    onClick={navigateToZoneRegister}
                  >
                    <span className='icon'>
                      <i className='fas fa-plus'></i>
                    </span>
                    <span>Create New Zone</span>
                  </button>
                </div>
                <div className='column is-6'>
                  <button 
                    className='button is-fullwidth is-info is-medium'
                    onClick={navigateToZones}
                  >
                    <span className='icon'>
                      <i className='fas fa-list'></i>
                    </span>
                    <span>Manage Zones</span>
                  </button>
                </div>
                <div className='column is-6'>
                  <button 
                    className='button is-fullwidth is-success is-medium'
                    onClick={navigateToServerRegister}
                  >
                    <span className='icon'>
                      <i className='fas fa-server'></i>
                    </span>
                    <span>Add New Host</span>
                  </button>
                </div>
                <div className='column is-6'>
                  <button 
                    onClick={() => navigate('/ui/settings')}
                    className='button is-fullwidth is-link is-medium'
                  >
                    <span className='icon'>
                      <i className='fas fa-cog'></i>
                    </span>
                    <span>Settings</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          <div className='column is-4'>
            <div className='box'>
              <h2 className='title is-4 mb-4'>
                <span className='icon-text'>
                  <span className='icon'><i className='fas fa-chart-pie'></i></span>
                  <span>Zone Distribution</span>
                </span>
              </h2>
              
              <div className='content'>
                {infrastructureData.servers && infrastructureData.servers.length > 0 ? (
                  <>
                    {infrastructureData.servers
                      .filter(s => s.success && s.data)
                      .map((serverResult, index) => {
                        const zoneCount = serverResult.data.allzones?.length || 0;
                        const runningCount = serverResult.data.runningzones?.length || 0;
                        const percentage = summary.totalZones > 0 ? 
                          Math.round((zoneCount / summary.totalZones) * 100) : 0;
                        
                        return (
                          <div key={index} className='mb-3'>
                            <div className='level is-mobile mb-1'>
                              <div className='level-left'>
                                <div className='level-item'>
                                  <strong className='is-size-7'>{serverResult.server.hostname}</strong>
                                </div>
                              </div>
                              <div className='level-right'>
                                <div className='level-item'>
                                  <span className='is-size-7'>{zoneCount} zones ({percentage}%)</span>
                                </div>
                              </div>
                            </div>
                            <progress 
                              className='progress is-small is-primary' 
                              value={zoneCount} 
                              max={summary.totalZones || 1}
                            ></progress>
                            <p className='is-size-7 has-text-grey'>
                              {runningCount} running, {zoneCount - runningCount} stopped
                            </p>
                          </div>
                        );
                      })}
                    
                    <hr className='my-3' />
                    
                    <div className='has-text-centered'>
                      <p className='heading'>Total Infrastructure</p>
                      <p className='title is-5'>{summary?.totalZones || 0} Zones</p>
                      <p className='subtitle is-7 has-text-grey'>
                        Across {summary?.onlineServers || 0} active hosts
                      </p>
                    </div>
                  </>
                ) : (
                  <div className='has-text-centered has-text-grey'>
                    <p>No zone data available</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Server Status - Individual Cards */}
        <div className='columns is-multiline is-variable is-2 mb-0'>
          {infrastructureData.servers?.map((serverResult, index) => {
            const { server, success, data, error } = serverResult;
            const status = getServerHealthStatus(serverResult);
            const statusColor = getStatusColor(status);
            
            // Determine tooltip text based on status
            let statusTooltip = 'Host is healthy';
            if (status === 'offline') {
              statusTooltip = error || 'Connection failed';
            } else if (status === 'warning') {
              const issues = [];
              if (data?.loadavg?.[0] > 2) issues.push('High CPU load');
              if (data?.totalmem && data?.freemem && (data.freemem / data.totalmem) < 0.1) {
                issues.push('Low memory');
              }
              statusTooltip = issues.join(', ');
            }
            
            return (
              <div key={index} className='column is-6'>
                <div className='box'>
                  <h2 className='title is-5 mb-3'>
                    <span className='icon-text'>
                      <span className={`icon ${statusColor}`} title={statusTooltip}>
                        <i className='fas fa-circle' style={{fontSize: '0.6rem'}}></i>
                      </span>
                      <span>{server.hostname}</span>
                    </span>
                  </h2>
                  
                  {success && data ? (
                    <>
                      <p className='subtitle is-6 has-text-grey mb-3'>
                        {data?.type || 'Unknown'} {data?.release || ''}
                      </p>
                      
                      <div className='columns is-mobile mb-3'>
                        <div className='column'>
                          <div className='has-text-centered'>
                            <div className='heading'>Zones</div>
                            <div className='title is-4'>
                              {(data.runningzones?.length || 0)} / {(data.allzones?.length || 0)}
                            </div>
                          </div>
                        </div>
                        <div className='column'>
                          <div className='has-text-centered'>
                            <div className='heading'>CPU Load</div>
                            <div className='title is-4'>
                              {data.loadavg ? data.loadavg[0].toFixed(2) : 'N/A'}
                            </div>
                          </div>
                        </div>
                        <div className='column'>
                          <div className='has-text-centered'>
                            <div className='heading'>Memory</div>
                            <div className='title is-4'>
                              {data.totalmem && data.freemem ? 
                                `${Math.round(((data.totalmem - data.freemem) / data.totalmem) * 100)}%` : 
                                'N/A'
                              }
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <button 
                        className='button is-fullwidth is-primary'
                        onClick={() => navigateToServer(server)}
                      >
                        <span className='icon'>
                          <i className='fas fa-arrow-right'></i>
                        </span>
                        <span>View Details</span>
                      </button>
                    </>
                  ) : (
                    <>
                      <p className='subtitle is-6 has-text-grey mb-3'>
                        Connection Failed
                      </p>
                      
                      <div className='columns is-mobile mb-3'>
                        <div className='column'>
                          <div className='has-text-centered'>
                            <div className='heading'>Zones</div>
                            <div className='title is-4 has-text-grey'>-</div>
                          </div>
                        </div>
                        <div className='column'>
                          <div className='has-text-centered'>
                            <div className='heading'>CPU Load</div>
                            <div className='title is-4 has-text-grey'>-</div>
                          </div>
                        </div>
                        <div className='column'>
                          <div className='has-text-centered'>
                            <div className='heading'>Memory</div>
                            <div className='title is-4 has-text-grey'>-</div>
                          </div>
                        </div>
                      </div>
                      
                      <button 
                        className='button is-fullwidth is-primary'
                        onClick={() => navigateToServer(server)}
                        disabled={true}
                      >
                        <span className='icon'>
                          <i className='fas fa-arrow-right'></i>
                        </span>
                        <span>View Details</span>
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Health Status Modal */}
        <div className={`modal ${showHealthModal ? 'is-active' : ''}`}>
          <div className='modal-background' onClick={() => setShowHealthModal(false)}></div>
          <div className='modal-card'>
            <header className='modal-card-head'>
              <p className='modal-card-title'>Infrastructure Health Issues</p>
              <button className='delete' aria-label='close' onClick={() => setShowHealthModal(false)}></button>
            </header>
            <section className='modal-card-body'>
              {infrastructureData.servers && infrastructureData.servers
                .filter(s => getServerHealthStatus(s) !== 'healthy')
                .map((serverResult, index) => {
                  const status = getServerHealthStatus(serverResult);
                  const statusColor = status === 'offline' ? 'is-danger' : 'is-warning';
                  const issues = [];
                  
                  if (status === 'offline') {
                    issues.push(serverResult.error || 'Connection failed');
                  } else if (status === 'warning' && serverResult.data) {
                    if (serverResult.data.loadavg?.[0] > 2) {
                      issues.push(`High CPU load: ${serverResult.data.loadavg[0].toFixed(2)}`);
                    }
                    if (serverResult.data.totalmem && serverResult.data.freemem && 
                        (serverResult.data.freemem / serverResult.data.totalmem) < 0.1) {
                      const memUsed = Math.round(((serverResult.data.totalmem - serverResult.data.freemem) / serverResult.data.totalmem) * 100);
                      issues.push(`Low memory: ${memUsed}% used`);
                    }
                  }
                  
                  return (
                    <div key={index} className={`notification ${statusColor}mb-3`}>
                      <strong>{serverResult.server.hostname}</strong>
                      <ul className='mt-2'>
                        {issues.map((issue, idx) => (
                          <li key={idx}>{issue}</li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
            </section>
            <footer className='modal-card-foot'>
              <button className='button' onClick={() => setShowHealthModal(false)}>Close</button>
            </footer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
