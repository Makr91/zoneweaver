import React from 'react';

const HostHeader = ({ currentServer, loading, refreshInterval, setRefreshInterval, loadHostData }) => {
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
                value={refreshInterval}
                onChange={(e) => setRefreshInterval(parseInt(e.target.value))}
              >
                <option value={0}>Manual Refresh</option>
                <option value={5}>Auto 5s</option>
                <option value={10}>Auto 10s</option>
                <option value={30}>Auto 30s</option>
                <option value={60}>Auto 1m</option>
                <option value={300}>Auto 5m</option>
              </select>
            </div>
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
