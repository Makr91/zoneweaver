import React from 'react';

const HostHeader = ({ 
  currentServer, 
  loading, 
  refreshInterval, 
  setRefreshInterval, 
  loadHostData,
  timeWindow,
  setTimeWindow,
  resolution,
  setResolution,
  autoRefresh,
  setAutoRefresh
}) => {
  return (
    <div className='titlebar box active level is-mobile mb-0 p-3'>
      <div className='level-left'>
        <strong>Host Overview - {currentServer.hostname}</strong>
      </div>
      <div className='level-right'>
        <div className='field is-grouped'>
          <div className='control'>
            <div className='select is-small'>
              <select
                value={timeWindow}
                onChange={(e) => setTimeWindow(e.target.value)}
                disabled={loading}
                title="Select time window for charts"
              >
                <option value="1min">1 Minute</option>
                <option value="5min">5 Minutes</option>
                <option value="10min">10 Minutes</option>
                <option value="15min">15 Minutes</option>
                <option value="30min">30 Minutes</option>
                <option value="1hour">1 Hour</option>
                <option value="3hour">3 Hours</option>
                <option value="6hour">6 Hours</option>
                <option value="12hour">12 Hours</option>
                <option value="24hour">24 Hours</option>
              </select>
            </div>
          </div>
          <div className='control'>
            <div className='select is-small'>
              <select
                value={resolution}
                onChange={(e) => setResolution(e.target.value)}
                disabled={loading}
                title="Chart resolution - controls the number of data points"
              >
                <option value="realtime">Real-time (125 points)</option>
                <option value="high">High (38 points)</option>
                <option value="medium">Medium (13 points)</option>
                <option value="low">Low (5 points)</option>
              </select>
            </div>
          </div>
          <div className='control'>
            <div className='select is-small'>
              <select
                value={refreshInterval}
                onChange={(e) => setRefreshInterval(parseInt(e.target.value))}
                disabled={loading || !autoRefresh}
              >
                <option value={1}>1s</option>
                <option value={2}>2s</option>
                <option value={5}>5s</option>
                <option value={10}>10s</option>
                <option value={30}>30s</option>
                <option value={60}>1m</option>
                <option value={300}>5m</option>
              </select>
            </div>
          </div>
          <div className='control'>
            <button
              className={`button is-small ${autoRefresh ? 'is-success' : 'is-warning'}`}
              onClick={() => setAutoRefresh(!autoRefresh)}
              title={autoRefresh ? 'Auto-refresh enabled' : 'Auto-refresh disabled'}
            >
              <span className='icon'>
                <i className={`fas ${autoRefresh ? 'fa-pause' : 'fa-play'}`}></i>
              </span>
              <span>{autoRefresh ? 'Auto' : 'Manual'}</span>
            </button>
          </div>
          <div className='control'>
            <button 
              className={`button is-small is-info ${loading ? 'is-loading' : ''}`}
              onClick={() => loadHostData(currentServer)}
              disabled={loading}
            >
              <span className='icon'>
                <i className='fas fa-sync'></i>
              </span>
              <span>Refresh</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HostHeader;
