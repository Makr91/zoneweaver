import React, { useState } from "react";
import { Helmet } from "@dr.pogodin/react-helmet";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useServers } from "../contexts/ServerContext";
import ServiceManagement from "./Host/ServiceManagement";
import NetworkHostnameManagement from "./Host/NetworkHostnameManagement";
import PackageManagement from "./Host/PackageManagement";
import BootEnvironmentManagement from "./Host/BootEnvironmentManagement";
import StorageManagement from "./Host/StorageManagement";
import TimeNTPManagement from "./Host/TimeNTPManagement";
import FaultManagement from "./Host/FaultManagement";
import ProcessManagement from "./Host/ProcessManagement";
import EnhancedFileManager from "./Host/FileManager/EnhancedFileManager";

const HostManage = () => {
  const [activeTab, setActiveTab] = useState('services');

  const { user } = useAuth();
  const { currentServer } = useServers();
  const navigate = useNavigate();

  if (!user || (user.role !== 'admin' && user.role !== 'super-admin')) {
    return (
      <div className='zw-page-content-scrollable'>
        <Helmet>
          <meta charSet='utf-8' />
          <title>Access Denied - Zoneweaver</title>
        </Helmet>
        <div className='container is-fluid m-2'>
          <div className='notification is-danger'>
            Admin privileges are required to manage servers.
          </div>
        </div>
      </div>
    );
  }

  // Show message if no server is selected
  if (!currentServer) {
    return (
      <div className='zw-page-content-scrollable'>
        <Helmet>
          <meta charSet='utf-8' />
          <title>No Server Selected - Zoneweaver</title>
        </Helmet>
        <div className='container is-fluid p-0'>
          <div className='box p-0 is-radiusless'>
            <div className='titlebar box active level is-mobile mb-0 p-3'>
              <div className='level-left'>
                <strong>Host Management</strong>
              </div>
              <div className='level-right'>
                <button className='button' onClick={() => navigate('/ui/hosts')}>
                  <span className='icon'>
                    <i className='fas fa-arrow-left'></i>
                  </span>
                  <span>Back to Hosts</span>
                </button>
              </div>
            </div>
            <div className='p-4'>
              <div className='notification is-info'>
                <p>Please select a server from the navbar to manage its services.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='zw-page-content-scrollable'>
      <Helmet>
        <meta charSet='utf-8' />
        <title>{`Manage ${currentServer.hostname} - Zoneweaver`}</title>
      </Helmet>
      <div className='container is-fluid p-0'>
        <div className='box p-0 is-radiusless'>
          {/* Server Header */}
          <div className='titlebar box active level is-mobile mb-0 p-3'>
            <div className='level-left'>
              <div>
                <strong>Host Management: {currentServer.hostname}</strong>
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className='tabs is-boxed'>
            <ul>
              <li className={activeTab === 'services' ? 'is-active' : ''}>
                <a onClick={() => setActiveTab('services')}>
                  <span className='icon is-small'><i className='fas fa-cogs'></i></span>
                  <span>Services</span>
                </a>
              </li>
              <li className={activeTab === 'network' ? 'is-active' : ''}>
                <a onClick={() => setActiveTab('network')}>
                  <span className='icon is-small'><i className='fas fa-network-wired'></i></span>
                  <span>Network & Hostname</span>
                </a>
              </li>
              <li className={activeTab === 'packages' ? 'is-active' : ''}>
                <a onClick={() => setActiveTab('packages')}>
                  <span className='icon is-small'><i className='fas fa-box'></i></span>
                  <span>Package Management</span>
                </a>
              </li>
              <li className={activeTab === 'boot-environments' ? 'is-active' : ''}>
                <a onClick={() => setActiveTab('boot-environments')}>
                  <span className='icon is-small'><i className='fas fa-layer-group'></i></span>
                  <span>Boot Environments</span>
                </a>
              </li>
              <li className={activeTab === 'storage' ? 'is-active' : ''}>
                <a onClick={() => setActiveTab('storage')}>
                  <span className='icon is-small'><i className='fas fa-database'></i></span>
                  <span>Storage Management</span>
                </a>
              </li>
              <li className={activeTab === 'time-ntp' ? 'is-active' : ''}>
                <a onClick={() => setActiveTab('time-ntp')}>
                  <span className='icon is-small'><i className='fas fa-clock'></i></span>
                  <span>Time & NTP</span>
                </a>
              </li>
              <li className={activeTab === 'processes' ? 'is-active' : ''}>
                <a onClick={() => setActiveTab('processes')}>
                  <span className='icon is-small'><i className='fas fa-tasks'></i></span>
                  <span>Processes</span>
                </a>
              </li>
              <li className={activeTab === 'fault-management' ? 'is-active' : ''}>
                <a onClick={() => setActiveTab('fault-management')}>
                  <span className='icon is-small'><i className='fas fa-exclamation-triangle'></i></span>
                  <span>Fault Management</span>
                </a>
              </li>
              <li className={activeTab === 'file-manager' ? 'is-active' : ''}>
                <a onClick={() => setActiveTab('file-manager')}>
                  <span className='icon is-small'><i className='fas fa-folder'></i></span>
                  <span>File Manager</span>
                </a>
              </li>
            </ul>
          </div>

          <div className='p-4'>
            {/* Services Tab */}
            {activeTab === 'services' && (
              <div>
                <div className='mb-4'>
                  <h2 className='title is-5'>Service Management</h2>
                  <p className='content'>
                    Manage OmniOS services on <strong>{currentServer.hostname}</strong>. 
                    You can view, start, stop, restart, and refresh services running on this host.
                  </p>
                </div>
                
                <ServiceManagement server={currentServer} />
              </div>
            )}

            {/* Network & Hostname Tab */}
            {activeTab === 'network' && (
              <div>
                <div className='mb-4'>
                  <h2 className='title is-5'>Network & Hostname Management</h2>
                  <p className='content'>
                    Manage network configuration and hostname settings on <strong>{currentServer.hostname}</strong>. 
                    Configure VNICs, IP addresses, link aggregates, and system hostname.
                  </p>
                </div>
                
                <NetworkHostnameManagement server={currentServer} />
              </div>
            )}

            {/* Package Management Tab */}
            {activeTab === 'packages' && (
              <div>
                <div className='mb-4'>
                  <h2 className='title is-5'>Package Management</h2>
                  <p className='content'>
                    Manage packages, repositories, and system updates on <strong>{currentServer.hostname}</strong>. 
                    Install, uninstall, and search for packages, manage publishers and repositories.
                  </p>
                </div>
                
                <PackageManagement server={currentServer} />
              </div>
            )}

            {/* Boot Environments Tab */}
            {activeTab === 'boot-environments' && (
              <div>
                <div className='mb-4'>
                  <h2 className='title is-5'>Boot Environment Management</h2>
                  <p className='content'>
                    Manage boot environments on <strong>{currentServer.hostname}</strong>. 
                    Create, activate, mount, and delete boot environments for system administration and recovery.
                  </p>
                </div>
                
                <BootEnvironmentManagement server={currentServer} />
              </div>
            )}

            {/* Storage Management Tab */}
            {activeTab === 'storage' && (
              <div>
                <div className='mb-4'>
                  <h2 className='title is-5'>Storage Management</h2>
                  <p className='content'>
                    Manage ZFS storage configuration on <strong>{currentServer.hostname}</strong>. 
                    Configure ZFS ARC settings, manage pools, datasets, and storage resources.
                  </p>
                </div>
                
                <StorageManagement server={currentServer} />
              </div>
            )}

            {/* Time & NTP Tab */}
            {activeTab === 'time-ntp' && (
              <div>
                <div className='mb-4'>
                  <h2 className='title is-5'>Time Synchronization & NTP Management</h2>
                  <p className='content'>
                    Manage time synchronization services, NTP configuration, and timezone settings on <strong>{currentServer.hostname}</strong>. 
                    Monitor time server peers, configure NTP servers, and manage system timezone.
                  </p>
                </div>
                
                <TimeNTPManagement server={currentServer} />
              </div>
            )}

            {/* Process Management Tab */}
            {activeTab === 'processes' && (
              <div>
                <div className='mb-4'>
                  <h2 className='title is-5'>Process Management</h2>
                  <p className='content'>
                    Monitor and manage system processes on <strong>{currentServer.hostname}</strong>. 
                    View running processes, send signals, terminate processes, and analyze process details including open files and resource usage.
                  </p>
                </div>
                
                <ProcessManagement server={currentServer} />
              </div>
            )}

            {/* Fault Management Tab */}
            {activeTab === 'fault-management' && (
              <div>
                <div className='mb-4'>
                  <h2 className='title is-5'>Fault Management</h2>
                  <p className='content'>
                    Monitor and manage system faults on <strong>{currentServer.hostname}</strong>. 
                    View active faults, review system logs, manage fault resolution, and monitor system health.
                  </p>
                </div>
                
                <FaultManagement server={currentServer} />
              </div>
            )}

            {/* File Manager Tab */}
            {activeTab === 'file-manager' && (
              <div>
                <div className='mb-4'>
                  <h2 className='title is-5'>File Manager</h2>
                  <p className='content'>
                    Browse and manage files on <strong>{currentServer.hostname}</strong>. 
                    Upload, download, create folders, edit text files, and perform file operations with drag-and-drop, keyboard shortcuts, and advanced features including archive support.
                  </p>
                </div>
                
                <EnhancedFileManager server={currentServer} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HostManage;
