import React from 'react';

const ServerForm = ({
  hostname, setHostname,
  port, setPort,
  protocol, setProtocol,
  entityName, setEntityName,
  apiKey, setApiKey,
  useExistingApiKey, setUseExistingApiKey,
  loading
}) => {
  return (
    <div className='box'>
      <h2 className='title is-5 mb-4'>Server Configuration</h2>
      
      <div className='columns'>
        <div className='column is-3'>
          <div className='field'>
            <label className='label'>Protocol</label>
            <div className='control'>
              <div className='select is-fullwidth'>
                <select 
                  value={protocol} 
                  onChange={(e) => setProtocol(e.target.value)}
                  disabled={loading}
                >
                  <option value="https">HTTPS</option>
                  <option value="http">HTTP</option>
                </select>
              </div>
            </div>
          </div>
        </div>
        <div className='column is-6'>
          <div className='field'>
            <label className='label'>Server Hostname</label>
            <div className='control'>
              <input 
                type='text' 
                className='input' 
                placeholder='zoneweaver-api.example.com' 
                value={hostname} 
                onChange={(e) => setHostname(e.target.value)}
                disabled={loading}
                required
              />
            </div>
          </div>
        </div>
        <div className='column is-3'>
          <div className='field'>
            <label className='label'>Port</label>
            <div className='control'>
              <input 
                type='number' 
                className='input' 
                placeholder='5001' 
                value={port} 
                onChange={(e) => setPort(e.target.value)}
                disabled={loading}
                required
              />
            </div>
          </div>
        </div>
      </div>

      <div className='field'>
        <div className='control'>
          <label className='checkbox'>
            <input 
              type='checkbox' 
              checked={useExistingApiKey}
              onChange={(e) => setUseExistingApiKey(e.target.checked)}
              disabled={loading}
            />
            <span className='ml-2'>I have an existing API key</span>
          </label>
        </div>
        <p className='help has-text-grey'>
          Check this if you already have an API key and don't need to bootstrap
        </p>
      </div>

      {useExistingApiKey && (
        <div className='field'>
          <label className='label'>API Key</label>
          <div className='control'>
            <input 
              type='password' 
              className='input' 
              placeholder='Enter your existing API key' 
              value={apiKey} 
              onChange={(e) => setApiKey(e.target.value)}
              disabled={loading}
              required
            />
          </div>
          <p className='help has-text-grey'>
            Enter the API key you received from your Zoneweaver API Server
          </p>
        </div>
      )}

      {!useExistingApiKey && (
        <div className='field'>
          <label className='label'>Entity Name</label>
          <div className='control'>
            <input 
              type='text' 
              className='input' 
              placeholder='ZoneWeaver-Production' 
              value={entityName} 
              onChange={(e) => setEntityName(e.target.value)}
              disabled={loading}
              required
            />
          </div>
          <p className='help has-text-grey'>
            This name will identify this ZoneWeaver instance on the Zoneweaver API Server
          </p>
        </div>
      )}

      <div className='field'>
        <label className='label'>Connection URL</label>
        <div className='control'>
          <input 
            type='text' 
            className='input is-static' 
            value={hostname ? `${protocol}://${hostname}:${port}` : 'Enter hostname to see URL'}
            readOnly
          />
        </div>
      </div>
    </div>
  );
};

export default ServerForm;
