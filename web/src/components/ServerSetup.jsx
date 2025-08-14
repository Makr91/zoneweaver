import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useServers } from '../contexts/ServerContext';
import { Helmet } from 'react-helmet-async';

/**
 * Server Setup component for bootstrapping Zoneweaver API Servers
 * @returns {JSX.Element} ServerSetup component
 */
const ServerSetup = () => {
  const [hostname, setHostname] = useState('');
  const [port, setPort] = useState('5001');
  const [protocol, setProtocol] = useState('https');
  const [entityName, setEntityName] = useState('Zoneweaver-Production');
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { addServer, testServer, refreshServers } = useServers();

  /**
   * Handle server bootstrap form submission
   * @param {Event} e - Form submit event
   */
  const handleBootstrap = async (e) => {
    e.preventDefault();
    
    if (!hostname || !port || !protocol || !entityName) {
      setMsg('All fields are required');
      return;
    }

    if (!isAuthenticated) {
      setMsg('Please login first to bootstrap a server');
      return;
    }

    try {
      setLoading(true);
      setMsg('');
      
      // Add server (this will bootstrap automatically)
      const result = await addServer({
        hostname,
        port: parseInt(port),
        protocol,
        entityName
      });
      
      if (result.success) {
        setMsg('Server bootstrapped successfully! Testing connection...');
        
        // Test the connection
        const testResult = await testServer({
          hostname,
          port: parseInt(port),
          protocol
        });
        
        if (testResult.success) {
          setMsg('Bootstrap successful and connection verified! Refreshing servers...');
          
          // Refresh servers context
          await refreshServers();
          
          setTimeout(() => {
            navigate('/ui');
          }, 2000);
        } else {
          setMsg(`Bootstrap successful but connection test failed: ${testResult.message}`);
        }
      } else {
        setMsg(result.message);
      }
    } catch (error) {
      console.error('Bootstrap error:', error);
      setMsg('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Test connection to server without bootstrapping
   */
  const handleTestConnection = async () => {
    if (!hostname || !port || !protocol) {
      setMsg('Please fill in hostname, port, and protocol first');
      return;
    }

    if (!isAuthenticated) {
      setMsg('Please login first to test connection');
      return;
    }

    try {
      setLoading(true);
      setMsg('Testing connection...');
      
      const result = await testServer({
        hostname,
        port: parseInt(port),
        protocol
      });
      
      if (result.success) {
        setMsg('Connection test successful! Server is reachable and ready for bootstrap.');
      } else {
        setMsg(`Connection test failed: ${result.message}`);
      }
    } catch (error) {
      console.error('Test connection error:', error);
      setMsg('Connection test failed. Please check your server details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className='hero is-fullheight is-fullwidth'>
      <Helmet>
        <meta charSet='utf-8' />
        <title>Server Setup - Zoneweaver</title>
        <link rel='canonical' href={window.location.origin} />
      </Helmet>
      <div className='hero-body'>
        <div className='container'>
          <div className='columns is-centered'>
            <div className='column is-6-desktop'>
              <form onSubmit={handleBootstrap} className='box'>
                <h1 className='title has-text-centered'>Zoneweaver API Server Setup</h1>
                <p className='subtitle has-text-centered'>
                  Bootstrap a new Zoneweaver API Server for zone management
                </p>
                
                {user && (
                  <div className='notification is-info'>
                    <p><strong>Welcome, {user.username}!</strong></p>
                    <p>You can now add Zoneweaver API Servers to manage your zones.</p>
                  </div>
                )}

                {msg && (
                  <div className={`notification ${
                    msg.includes('successful') || msg.includes('verified') ? 'is-success' : 
                    msg.includes('failed') || msg.includes('error') ? 'is-danger' : 
                    'is-info'
                  }`}>
                    <p>{msg}</p>
                  </div>
                )}

                <div className='columns'>
                  <div className='column'>
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
                  <div className='column is-two-thirds'>
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
                        />
                      </div>
                    </div>
                  </div>
                  <div className='column'>
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
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className='field'>
                  <label className='label'>Entity Name</label>
                  <div className='control'>
                    <input 
                      type='text' 
                      className='input' 
                      placeholder='Zoneweaver-Production' 
                      value={entityName} 
                      onChange={(e) => setEntityName(e.target.value)}
                      disabled={loading}
                    />
                  </div>
                  <p className='help'>This name will identify this Zoneweaver instance on the Zoneweaver API Server</p>
                </div>

                <div className='field is-grouped'>
                  <div className='control is-expanded'>
                    <button 
                      type='button'
                      className={`button is-info is-fullwidth ${loading ? 'is-loading' : ''}`}
                      onClick={handleTestConnection}
                      disabled={loading}
                    >
                      Test Connection
                    </button>
                  </div>
                  <div className='control is-expanded'>
                    <button 
                      type='submit'
                      className={`button is-primary is-fullwidth ${loading ? 'is-loading' : ''}`}
                      disabled={loading}
                    >
                      Bootstrap Server
                    </button>
                  </div>
                </div>

                <div className='has-text-centered mt-4'>
                  <p className='help'>
                    <strong>Note:</strong> The bootstrap endpoint will be automatically disabled after first use for security.
                  </p>
                </div>

                <div className='has-text-centered mt-3'>
                  <a href='/ui' className='button is-text'>
                    Skip Setup (Go to Dashboard)
                  </a>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ServerSetup;
