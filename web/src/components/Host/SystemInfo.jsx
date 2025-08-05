import React from 'react';
import { formatUptime, bytesToSize, getCpuCount } from './utils';

const SystemInfo = ({ serverStats, monitoringStatus, monitoringHealth, taskStats, swapSummaryData }) => {
  return (
    <div className='box mb-5'>
      <h3 className='title is-5 mb-4'>
        <span className='icon-text'>
          <span className='icon'><i className='fas fa-tachometer-alt'></i></span>
          <span>Host Overview</span>
        </span>
      </h3>
      
      <div className='columns'>
        {/* System Information with Monitoring & Tasks */}
        <div className='column is-6'>
          <div className='content'>
            <h4 className='subtitle is-6 mb-3'>
              <span className='icon-text'>
                <span className='icon has-text-info'><i className='fas fa-server'></i></span>
                <span>System Information</span>
              </span>
            </h4>
            <table className='table is-fullwidth is-narrow'>
              <tbody>
                <tr>
                  <td><strong>Hostname</strong></td>
                  <td>{serverStats.hostname || 'N/A'}</td>
                </tr>
                <tr>
                  <td><strong>Platform</strong></td>
                  <td>{serverStats.type || 'N/A'} {serverStats.release || ''}</td>
                </tr>
                <tr>
                  <td><strong>Architecture</strong></td>
                  <td>{serverStats.arch || 'N/A'}</td>
                </tr>
                <tr>
                  <td><strong>WebHyve Version</strong></td>
                  <td>{serverStats.version || 'N/A'}</td>
                </tr>
                <tr>
                  <td><strong>Uptime</strong></td>
                  <td>{formatUptime(serverStats.uptime)}</td>
                </tr>
                {/* Monitoring Status in table */}
                {Object.keys(monitoringStatus).length > 0 && (
                  <>
                    <tr>
                      <td><strong>Monitoring Service</strong></td>
                      <td>
                        <span className={`tag ${monitoringStatus.isRunning ? 'is-success' : 'is-danger'}`}>
                          {monitoringStatus.isRunning ? 'Running' : 'Stopped'}
                        </span>
                        {monitoringStatus.isInitialized && (
                          <span className='tag is-success ml-1'>Initialized</span>
                        )}
                      </td>
                    </tr>
                  </>
                )}
                {monitoringHealth.status && (
                  <tr>
                    <td><strong>Service Health</strong></td>
                    <td>
                      <span className={`tag ${
                        monitoringHealth.status === 'healthy' ? 'is-success' : 
                        monitoringHealth.status === 'warning' ? 'is-warning' : 'is-danger'
                      }`}>
                        {monitoringHealth.status}
                      </span>
                    </td>
                  </tr>
                )}
                {/* Task Queue Status in table */}
                {Object.keys(taskStats).length > 0 && (
                  <tr>
                    <td><strong>Task Queue</strong></td>
                    <td>
                      <span className='tag is-info mr-1'>{taskStats.pending || 0} Pending</span>
                      <span className='tag is-success mr-1'>{taskStats.completed || 0} Done</span>
                      {(taskStats.failed || 0) > 0 && (
                        <span className='tag is-danger'>{taskStats.failed} Failed</span>
                      )}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Resource Utilization */}
        <div className='column is-6'>
          <div className='content'>
            <h4 className='subtitle is-6 mb-3'>
              <span className='icon-text'>
                <span className='icon has-text-warning'><i className='fas fa-chart-pie'></i></span>
                <span>Resource Utilization</span>
              </span>
            </h4>
            {/* CPU Usage */}
            <div className='level is-mobile mb-3'>
              <div className='level-left'>
                <span className='icon'><i className='fas fa-microchip'></i></span>
                <span className='ml-2'>CPU Usage</span>
              </div>
              <div className='level-right'>
                <span>
                  {serverStats.loadavg && getCpuCount(serverStats) !== 'N/A' 
                    ? `${((parseFloat(serverStats.loadavg[0]) / getCpuCount(serverStats)) * 100).toFixed(1)}%`
                    : '0%'
                  }
                </span>
              </div>
            </div>
            <progress 
              className='progress is-small is-info mb-4' 
              value={serverStats.loadavg && getCpuCount(serverStats) !== 'N/A' ? Math.min((parseFloat(serverStats.loadavg[0]) / getCpuCount(serverStats)) * 100, 100) : 0} 
              max='100'
            ></progress>

            {/* Memory Usage */}
            <div className='level is-mobile mb-1'>
              <div className='level-left'>
                <span className='icon'><i className='fas fa-memory'></i></span>
                <span className='ml-2'>Memory Usage</span>
                <span className='is-size-7 has-text-grey ml-2'>
                  (Total: {serverStats.totalmem ? bytesToSize(serverStats.totalmem) : 'N/A'})
                </span>
              </div>
              <div className='level-right'>
                <span>
                  {serverStats.totalmem && serverStats.freemem 
                    ? `${(((serverStats.totalmem - serverStats.freemem) / serverStats.totalmem) * 100).toFixed(1)}%`
                    : 'N/A'
                  }
                </span>
              </div>
            </div>
            <progress 
              className='progress is-small is-warning mb-4' 
              value={serverStats.totalmem && serverStats.freemem ? ((serverStats.totalmem - serverStats.freemem) / serverStats.totalmem) * 100 : 0} 
              max='100'
            ></progress>

            {/* Swap Usage */}
            {swapSummaryData && Object.keys(swapSummaryData).length > 0 && (
              <>
                <div className='level is-mobile mb-1'>
                  <div className='level-left'>
                    <span className='icon'><i className='fas fa-hdd'></i></span>
                    <span className='ml-2'>Swap Usage</span>
                    <span className='is-size-7 has-text-grey ml-2'>
                      (Total: {swapSummaryData.totalSwapGB || 'N/A'} GB, 
                      Used: {swapSummaryData.usedSwapGB || 'N/A'} GB, 
                      Free: {swapSummaryData.freeSwapGB || 'N/A'} GB)
                    </span>
                  </div>
                  <div className='level-right'>
                    <span>
                      {typeof swapSummaryData.overallUtilization === 'number' 
                        ? `${swapSummaryData.overallUtilization.toFixed(1)}%`
                        : 'N/A'
                      }
                    </span>
                  </div>
                </div>
                <progress 
                  className='progress is-small is-link mb-4' 
                  value={typeof swapSummaryData.overallUtilization === 'number' ? swapSummaryData.overallUtilization : 0} 
                  max='100'
                ></progress>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SystemInfo;
