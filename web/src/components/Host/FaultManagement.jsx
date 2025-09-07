import React, { useState } from 'react';
import FaultList from './FaultList';
import SystemLogs from './SystemLogs';
import FaultManagerConfig from './FaultManagerConfig';
import SyslogConfiguration from './SyslogConfiguration';

const FaultManagement = ({ server }) => {
  const [activeTab, setActiveTab] = useState('faults');

  if (!server) {
    return (
      <div className='notification is-info'>
        <p>No server selected for fault management.</p>
      </div>
    );
  }

  return (
    <div>
      {/* Sub-Tab Navigation */}
      <div className='tabs is-boxed'>
        <ul>
          <li className={activeTab === 'faults' ? 'is-active' : ''}>
            <a onClick={() => setActiveTab('faults')}>
              <span className='icon is-small'><i className='fas fa-exclamation-triangle'></i></span>
              <span>Current Faults</span>
            </a>
          </li>
          <li className={activeTab === 'logs' ? 'is-active' : ''}>
            <a onClick={() => setActiveTab('logs')}>
              <span className='icon is-small'><i className='fas fa-file-alt'></i></span>
              <span>System Logs</span>
            </a>
          </li>
          <li className={activeTab === 'config' ? 'is-active' : ''}>
            <a onClick={() => setActiveTab('config')}>
              <span className='icon is-small'><i className='fas fa-cog'></i></span>
              <span>Configuration</span>
            </a>
          </li>
          <li className={activeTab === 'syslog-config' ? 'is-active' : ''}>
            <a onClick={() => setActiveTab('syslog-config')}>
              <span className='icon is-small'><i className='fas fa-edit'></i></span>
              <span>Syslog Config</span>
            </a>
          </li>
        </ul>
      </div>

      {/* Tab Content */}
      <div className='mt-4'>
        {activeTab === 'faults' && (
          <div>
            <div className='mb-4'>
              <h3 className='title is-6'>
                <span className='icon-text'>
                  <span className='icon'><i className='fas fa-exclamation-triangle'></i></span>
                  <span>Current System Faults</span>
                </span>
              </h3>
              <p className='content'>
                Monitor and manage active system faults on <strong>{server.hostname}</strong>. 
                View fault details, acquit resolved issues, and track fault resolution status.
              </p>
            </div>
            
            <FaultList server={server} />
          </div>
        )}

        {activeTab === 'logs' && (
          <div>
            <div className='mb-4'>
              <h3 className='title is-6'>
                <span className='icon-text'>
                  <span className='icon'><i className='fas fa-file-alt'></i></span>
                  <span>System Logs</span>
                </span>
              </h3>
              <p className='content'>
                Browse and analyze system log files on <strong>{server.hostname}</strong>. 
                View system messages, authentication logs, and fault manager logs with real-time filtering.
              </p>
            </div>
            
            <SystemLogs server={server} />
          </div>
        )}

        {activeTab === 'config' && (
          <div>
            <div className='mb-4'>
              <h3 className='title is-6'>
                <span className='icon-text'>
                  <span className='icon'><i className='fas fa-cog'></i></span>
                  <span>Fault Manager Configuration</span>
                </span>
              </h3>
              <p className='content'>
                View fault manager configuration and module status on <strong>{server.hostname}</strong>. 
                Monitor installed fault management modules and their current state.
              </p>
            </div>
            
            <FaultManagerConfig server={server} />
          </div>
        )}

        {activeTab === 'syslog-config' && (
          <div>
            <div className='mb-4'>
              <h3 className='title is-6'>
                <span className='icon-text'>
                  <span className='icon'><i className='fas fa-edit'></i></span>
                  <span>Syslog Configuration</span>
                </span>
              </h3>
              <p className='content'>
                Configure system logging on <strong>{server.hostname}</strong>. 
                Manage syslog rules, facilities, and log destinations with validation and backup support.
              </p>
            </div>
            
            <SyslogConfiguration server={server} />
          </div>
        )}
      </div>
    </div>
  );
};

export default FaultManagement;
