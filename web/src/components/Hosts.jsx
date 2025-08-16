import React, { useState, useRef } from "react";
import { Helmet } from "@dr.pogodin/react-helmet";
import { useAuth } from "../contexts/AuthContext";
import { useServers } from "../contexts/ServerContext";
import { useHostData } from "./Host/useHostData";
import HostHeader from "./Host/HostHeader";
import SystemInfo from "./Host/SystemInfo";
import ZoneManager from "./Host/ZoneManager";
import NetworkStorageSummary from "./Host/NetworkStorageSummary";
import StorageIOChart from "./Host/PerformanceCharts/StorageIOChart";
import ZfsArcChart from "./Host/PerformanceCharts/ZfsArcChart";
import NetworkChart from "./Host/PerformanceCharts/NetworkChart";
import CpuChart from "./Host/PerformanceCharts/CpuChart";
import MemoryChart from "./Host/PerformanceCharts/MemoryChart";
import ExpandedChartModal from "./Host/PerformanceCharts/ExpandedChartModal";
import ProvisioningStatus from "./Host/ProvisioningStatus.jsx";

/**
 * Host Overview Dashboard Component
 * 
 * Displays comprehensive overview for the currently selected host from navbar context.
 * No server selection sidebar - uses global currentServer from ServerContext.
 */
const Hosts = () => {
  const { user } = useAuth();
  const { currentServer, servers, startZone, stopZone, restartZone } = useServers();

  const {
    serverStats,
    monitoringHealth,
    monitoringStatus,
    storageSummary,
    taskStats,
    swapSummaryData, // Add swapSummaryData here
    loading,
    error,
    refreshInterval,
    setRefreshInterval,
    chartData,
    arcChartData,
    networkChartData,
    cpuChartData,
    memoryChartData,
    loadHostData,
  } = useHostData(currentServer);

  const [expandedChart, setExpandedChart] = useState(null);
  const [expandedChartType, setExpandedChartType] = useState(null);
  
  // Series visibility controls for each chart
  const [storageSeriesVisibility, setStorageSeriesVisibility] = useState({
    read: true,
    write: true,
    total: true
  });
  
  const [networkSeriesVisibility, setNetworkSeriesVisibility] = useState({
    read: true, // Corresponds to RX
    write: true, // Corresponds to TX
    total: true
  });
  
  const [cpuSeriesVisibility, setCpuSeriesVisibility] = useState({
    overall: true,
    cores: true, // A master toggle for all cores
    load: false, // Load average hidden by default
  });

  const [memorySeriesVisibility, setMemorySeriesVisibility] = useState({
    used: true,
    free: true,
    cached: true,
  });
  
  // Expand chart function (like HostNetworking.jsx)
  const expandChart = (chartId, chartType) => {
    setExpandedChart(chartId);
    setExpandedChartType(chartType);
  };

  // Close expanded chart modal
  const closeExpandedChart = () => {
    setExpandedChart(null);
    setExpandedChartType(null);
  };

  // Zone management functions
  const handleZoneAction = async (action, zoneName = null) => {
    if (!currentServer) return;

    try {
      let result;
      const zones = zoneName ? [zoneName] : 
                   action === 'startAll' ? serverStats.allzones?.filter(zone => !serverStats.runningzones?.includes(zone)) :
                   action === 'stopAll' ? serverStats.runningzones : [];

      for (const zone of zones || []) {
        switch (action) {
          case 'start':
          case 'startAll':
            result = await startZone(currentServer.hostname, currentServer.port, currentServer.protocol, zone);
            break;
          case 'stop':
          case 'stopAll':
            result = await stopZone(currentServer.hostname, currentServer.port, currentServer.protocol, zone);
            break;
          case 'restart':
            result = await restartZone(currentServer.hostname, currentServer.port, currentServer.protocol, zone);
            break;
        }
      }

      // Refresh data after action
      setTimeout(() => loadHostData(currentServer), 2000);
    } catch (error) {
      console.error(`Error performing zone action ${action}:`, error);
    }
  };

  // No servers available
  if (!servers || servers.length === 0) {
    return (
      <div className='hero-body mainbody p-0 is-align-items-stretch'>
        <Helmet>
          <meta charSet='utf-8' />
          <title>Host Overview - Zoneweaver</title>
          <link rel='canonical' href={window.location.origin} />
        </Helmet>
        <div className='container is-fluid m-2'>
          <div className='box p-0'>
            <div className='titlebar box active level is-mobile mb-0 p-3'>
              <div className='level-left'>
                <strong>Host Overview</strong>
              </div>
            </div>
            <div className='p-4'>
              <div className='notification is-info'>
                <h2 className='title is-4'>No Zoneweaver API Servers</h2>
                <p>You haven't added any Zoneweaver API Servers yet. Add a server to start managing hosts and zones.</p>
                <div className='mt-4'>
                  <a href='/ui/settings/zoneweaver?tab=servers' className='button is-primary'>
                    <span className='icon'>
                      <i className='fas fa-plus'></i>
                    </span>
                    <span>Add Zoneweaver API Server</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // No current server selected
  if (!currentServer) {
    return (
      <div className='hero-body mainbody p-0 is-align-items-stretch'>
        <Helmet>
          <meta charSet='utf-8' />
          <title>Host Overview - Zoneweaver</title>
          <link rel='canonical' href={window.location.origin} />
        </Helmet>
        <div className='container is-fluid m-2'>
          <div className='box p-0'>
            <div className='titlebar box active level is-mobile mb-0 p-3'>
              <div className='level-left'>
                <strong>Host Overview</strong>
              </div>
            </div>
            <div className='p-4'>
              <div className='notification is-warning'>
                <h2 className='title is-4'>No Host Selected</h2>
                <p>Please select a host from the dropdown in the navigation bar to view its overview.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='hero-body mainbody p-0 is-align-items-stretch'>
      <Helmet>
        <meta charSet='utf-8' />
        <title>Host Overview - Zoneweaver</title>
        <link rel='canonical' href={window.location.origin} />
      </Helmet>
      <div className='container is-fluid m-2'>
        <div className='box p-0'>
          <HostHeader
            currentServer={currentServer}
            loading={loading}
            refreshInterval={refreshInterval}
            setRefreshInterval={setRefreshInterval}
            loadHostData={loadHostData}
          />

          <div className='p-4'>
            {error && (
              <div className='notification is-danger'>
                <p>{error}</p>
              </div>
            )}

            {/* Host Overview - Unified Section */}
            {Object.keys(serverStats).length > 0 && (
              <>
                <SystemInfo
                  serverStats={serverStats}
                  monitoringStatus={monitoringStatus}
                  monitoringHealth={monitoringHealth}
                  taskStats={taskStats}
                  swapSummaryData={swapSummaryData} // Pass swapSummaryData here
                />

                <ZoneManager
                  serverStats={serverStats}
                  currentServer={currentServer}
                  handleZoneAction={handleZoneAction}
                />

                <NetworkStorageSummary
                  serverStats={serverStats}
                  storageSummary={storageSummary}
                />

                {/* Performance Monitoring Charts Section */}
                <div className='box mb-5'>
                  <h3 className='title is-5 mb-4'>
                    <span className='icon-text'>
                      <span className='icon'><i className='fas fa-chart-area'></i></span>
                      <span>Performance Monitoring</span>
                    </span>
                  </h3>
                  
                  <div className='columns is-multiline'>
                    <StorageIOChart
                      chartData={chartData}
                      storageSeriesVisibility={storageSeriesVisibility}
                      setStorageSeriesVisibility={setStorageSeriesVisibility}
                      expandChart={expandChart}
                    />

                    <ZfsArcChart
                      arcChartData={arcChartData}
                      expandChart={expandChart}
                    />

                    <NetworkChart
                      networkChartData={networkChartData}
                      networkSeriesVisibility={networkSeriesVisibility}
                      setNetworkSeriesVisibility={setNetworkSeriesVisibility}
                      expandChart={expandChart}
                    />

                    <CpuChart
                      cpuChartData={cpuChartData}
                      cpuSeriesVisibility={cpuSeriesVisibility}
                      setCpuSeriesVisibility={setCpuSeriesVisibility}
                      expandChart={expandChart}
                    />

                    <MemoryChart
                      memoryChartData={memoryChartData}
                      memorySeriesVisibility={memorySeriesVisibility}
                      expandChart={expandChart}
                    />
                  </div>
                </div>

                <ProvisioningStatus currentServer={currentServer} />
              </>
            )}
          </div>
        </div>
      </div>

      <ExpandedChartModal
        expandedChart={expandedChart}
        closeExpandedChart={closeExpandedChart}
        expandedChartType={expandedChartType}
        currentServer={currentServer}
        storageSeriesVisibility={storageSeriesVisibility}
        setStorageSeriesVisibility={setStorageSeriesVisibility}
        networkSeriesVisibility={networkSeriesVisibility}
        setNetworkSeriesVisibility={setNetworkSeriesVisibility}
        cpuSeriesVisibility={cpuSeriesVisibility}
        setCpuSeriesVisibility={setCpuSeriesVisibility}
        memorySeriesVisibility={memorySeriesVisibility}
        setMemorySeriesVisibility={setMemorySeriesVisibility}
        chartData={chartData}
        arcChartData={arcChartData}
        networkChartData={networkChartData}
        cpuChartData={cpuChartData}
        memoryChartData={memoryChartData}
      />
    </div>
  );
};

export default Hosts;
