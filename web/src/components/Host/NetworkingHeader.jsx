import React from 'react';

const NetworkingHeader = ({
    loading,
    autoRefresh,
    setAutoRefresh,
    refreshInterval,
    setRefreshInterval,
    selectedServer,
    loadNetworkData
}) => {
    return (
        <div className='titlebar box active level is-mobile mb-0 p-3'>
            <div className='level-left'>
                <strong>Network Monitoring</strong>
            </div>
            <div className='level-right'>
                <div className='field is-grouped'>
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
                            onClick={() => selectedServer && loadNetworkData(selectedServer)}
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

export default NetworkingHeader;
