import { Helmet } from "@dr.pogodin/react-helmet";
import { useMemo } from "react";

import BandwidthCharts from "./Host/BandwidthCharts";
import BandwidthTable from "./Host/BandwidthTable";
import ExpandedChartModal from "./Host/ExpandedChartModal";
import InterfacesTable from "./Host/InterfacesTable";
import IpAddressTable from "./Host/IpAddressTable";
import NetworkingHeader from "./Host/NetworkingHeader";
import NetworkSummary from "./Host/NetworkSummary";
import BandwidthLegend from "./Host/NetworkTopology/BandwidthLegend";
import NetworkTopologyViewer from "./Host/NetworkTopology/NetworkTopologyViewer";
import RoutingTable from "./Host/RoutingTable";
import { useHostNetworkingData } from "./Host/useHostNetworkingData";

const HostNetworking = () => {
  console.log("🐛 DEBUG: HostNetworking component starting render");

  // ALWAYS call hooks first, before any conditional logic or early returns
  console.log("🐛 DEBUG: About to call useHostNetworkingData hook");
  const {
    networkInterfaces,
    networkUsage,
    ipAddresses,
    routes,
    // Topology data
    aggregates,
    etherstubs,
    vnics,
    zones,
    loading,
    error,
    selectedServer,
    autoRefresh,
    setAutoRefresh,
    refreshInterval,
    setRefreshInterval,
    sectionsCollapsed,
    toggleSection,
    chartData,
    timeWindow,
    setTimeWindow,
    resolution,
    setResolution,
    chartRefs,
    summaryChartRefs,
    interfaceSort,
    handleInterfaceSort,
    bandwidthSort,
    handleBandwidthSort,
    resetInterfaceSort,
    resetBandwidthSort,
    getSortedInterfaces,
    getSortedBandwidthUsage,
    getSortIcon,
    expandedChart,
    expandedChartType,
    expandChart,
    closeExpandedChart,
    chartSortBy,
    setChartSortBy,
    getSortedChartEntries,
    user,
    getServers,
    loadNetworkData,
    servers,
  } = useHostNetworkingData();
  console.log(
    "🐛 DEBUG: Hook data destructured successfully, user:",
    !!user,
    "getServers type:",
    typeof getServers
  );

  // Use useMemo to prevent getServers() calls on every render
  const serverList = useMemo(() => getServers(), [getServers, servers]);

  // Network monitoring is accessible to all authenticated users
  // No permission check needed - removed the user access restriction

  if (serverList.length === 0) {
    return (
      <div className="zw-page-content-scrollable">
        <Helmet>
          <meta charSet="utf-8" />
          <title>Network Monitoring - Zoneweaver</title>
          <link rel="canonical" href={window.location.origin} />
        </Helmet>
        <div className="container is-fluid p-0">
          <div className="box p-0 is-radiusless">
            <div className="titlebar box active level is-mobile mb-0 p-3">
              <div className="level-left">
                <strong>Network Monitoring</strong>
              </div>
            </div>
            <div className="px-4">
              <div className="notification is-info">
                <h2 className="title is-4">No Zoneweaver API Servers</h2>
                <p>
                  You haven&apos;t added any Zoneweaver API Servers yet. Add a
                  server to start monitoring network interfaces.
                </p>
                <div className="mt-4">
                  <a
                    href="/ui/settings/zoneweaver?tab=servers"
                    className="button is-primary"
                  >
                    <span className="icon">
                      <i className="fas fa-plus" />
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

  return (
    <div className="zw-page-content-scrollable">
      <Helmet>
        <meta charSet="utf-8" />
        <title>Network Monitoring - Zoneweaver</title>
        <link rel="canonical" href={window.location.origin} />
      </Helmet>
      <div className="container is-fluid p-0">
        <div className="box p-0 is-radiusless">
          <NetworkingHeader
            loading={loading}
            autoRefresh={autoRefresh}
            setAutoRefresh={setAutoRefresh}
            refreshInterval={refreshInterval}
            setRefreshInterval={setRefreshInterval}
            resolution={resolution}
            setResolution={setResolution}
            selectedServer={selectedServer}
            loadNetworkData={loadNetworkData}
            timeWindow={timeWindow}
            setTimeWindow={setTimeWindow}
          />

          <div className="px-4">
            {error && (
              <div className="notification is-danger mb-4">
                <p>{error}</p>
              </div>
            )}

            <NetworkSummary
              networkInterfaces={networkInterfaces}
              sectionsCollapsed={sectionsCollapsed}
              toggleSection={toggleSection}
            />

            {/* Network Topology Visualization */}
            <div className="box mb-4">
              <div className="level is-mobile mb-3">
                <div className="level-left">
                  <div className="level-item">
                    <h2 className="title is-5 mb-0">
                      <span className="icon-text">
                        <span className="icon">
                          <i className="fas fa-project-diagram" />
                        </span>
                        <span>Network Topology</span>
                      </span>
                    </h2>
                  </div>
                </div>
                <div className="level-right">
                  <div className="level-item">
                    <button
                      className={`button is-small ${sectionsCollapsed.topology ? "" : "is-primary"}`}
                      onClick={() => toggleSection("topology")}
                    >
                      <span className="icon is-small">
                        <i
                          className={`fas fa-chevron-${sectionsCollapsed.topology ? "down" : "up"}`}
                        />
                      </span>
                      <span>
                        {sectionsCollapsed.topology ? "Show" : "Hide"}
                      </span>
                    </button>
                  </div>
                </div>
              </div>

              {!sectionsCollapsed.topology && (
                <div className="content has-min-height-600">
                  <NetworkTopologyViewer
                    networkData={{
                      networkInterfaces: networkInterfaces || [],
                      networkUsage: networkUsage || [],
                      ipAddresses: ipAddresses || [],
                      aggregates: aggregates || [],
                      etherstubs: etherstubs || [],
                      vnics: vnics || [],
                      zones: zones || [],
                    }}
                    server={selectedServer}
                    onNodeClick={(node) => {
                      console.log("Network node clicked:", node);
                      // TODO: Add node details modal or action
                    }}
                    onEdgeClick={(edge) => {
                      console.log("Network edge clicked:", edge);
                      // TODO: Add edge details modal or action
                    }}
                  />
                </div>
              )}
            </div>

            {/* Network Topology Legend */}
            {!sectionsCollapsed.topology && (
              <div className="box mb-4">
                <div className="content">
                  <BandwidthLegend horizontal />
                </div>
              </div>
            )}

            <IpAddressTable
              ipAddresses={ipAddresses}
              sectionsCollapsed={sectionsCollapsed}
              toggleSection={toggleSection}
            />

            <RoutingTable
              routes={routes}
              sectionsCollapsed={sectionsCollapsed}
              toggleSection={toggleSection}
            />

            <InterfacesTable
              networkInterfaces={getSortedInterfaces()}
              interfaceSort={interfaceSort}
              handleInterfaceSort={handleInterfaceSort}
              getSortIcon={getSortIcon}
              resetInterfaceSort={resetInterfaceSort}
              sectionsCollapsed={sectionsCollapsed}
              toggleSection={toggleSection}
            />

            <BandwidthTable
              networkUsage={getSortedBandwidthUsage()}
              bandwidthSort={bandwidthSort}
              handleBandwidthSort={handleBandwidthSort}
              getSortIcon={getSortIcon}
              resetBandwidthSort={resetBandwidthSort}
              sectionsCollapsed={sectionsCollapsed}
              toggleSection={toggleSection}
            />

            <BandwidthCharts
              chartData={chartData}
              sectionsCollapsed={sectionsCollapsed}
              toggleSection={toggleSection}
              timeWindow={timeWindow}
              setTimeWindow={setTimeWindow}
              loading={loading}
              chartSortBy={chartSortBy}
              setChartSortBy={setChartSortBy}
              getSortedChartEntries={getSortedChartEntries}
              expandChart={expandChart}
              summaryChartRefs={summaryChartRefs}
              chartRefs={chartRefs}
            />
          </div>
        </div>
      </div>

      <ExpandedChartModal
        chartId={expandedChart}
        type={expandedChartType}
        close={closeExpandedChart}
        chartData={chartData}
      />
    </div>
  );
};

export default HostNetworking;
