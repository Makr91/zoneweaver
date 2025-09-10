import { Helmet } from "@dr.pogodin/react-helmet";
import React, { useMemo } from "react";

import ArcStats from "./Host/ArcStats";
import DatasetsTable from "./Host/DatasetsTable";
import DiskIOTable from "./Host/DiskIOTable";
import DisksTable from "./Host/DisksTable";
import ExpandedChartModal from "./Host/ExpandedChartModal";
import PoolIOTable from "./Host/PoolIOTable";
import PoolsTable from "./Host/PoolsTable";
import StorageCharts from "./Host/StorageCharts";
import StorageHeader from "./Host/StorageHeader";
import StorageSummary from "./Host/StorageSummary";
import { useHostStorageData } from "./Host/useHostStorageData";

const HostStorage = () => {
  const {
    storagePools,
    storageDatasets,
    storageDisks,
    diskIOStats,
    poolIOStats,
    arcStats,
    loading,
    error,
    selectedServer,
    autoRefresh,
    setAutoRefresh,
    refreshInterval,
    setRefreshInterval,
    resolution,
    setResolution,
    sectionsCollapsed,
    toggleSection,
    poolSort,
    handlePoolSort,
    datasetSort,
    handleDatasetSort,
    diskSort,
    handleDiskSort,
    diskIOSort,
    handleDiskIOSort,
    resetPoolSort,
    resetDatasetSort,
    resetDiskSort,
    resetDiskIOSort,
    getSortedPools,
    getSortedDatasets,
    getSortedDisks,
    getSortedDiskIOStats,
    getSortIcon,
    chartData,
    poolChartData,
    arcChartData,
    timeWindow,
    setTimeWindow,
    chartRefs,
    poolChartRefs,
    summaryChartRefs,
    expandedChart,
    expandedChartType,
    expandChart,
    closeExpandedChart,
    chartSortBy,
    setChartSortBy,
    getSortedChartEntries,
    seriesVisibility,
    setSeriesVisibility,
    user,
    getServers,
    handleServerChange,
    loadStorageData,
    servers,
  } = useHostStorageData();

  // Use useMemo to prevent getServers() calls on every render
  const serverList = useMemo(() => getServers(), [servers]);

  if (!user) {
    return (
      <div className="zw-page-content-scrollable">
        <Helmet>
          <meta charSet="utf-8" />
          <title>Storage Monitoring - Zoneweaver</title>
          <link rel="canonical" href={window.location.origin} />
        </Helmet>
        <div className="container is-fluid p-0">
          <div className="box p-0 is-radiusless">
            <div className="titlebar box active level is-mobile mb-0 p-3">
              <div className="level-left">
                <strong>Access Denied</strong>
              </div>
            </div>
            <div className="p-4">
              <div className="notification is-danger">
                <p>Please log in to access storage monitoring.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (serverList.length === 0) {
    return (
      <div className="zw-page-content-scrollable">
        <Helmet>
          <meta charSet="utf-8" />
          <title>Storage Monitoring - Zoneweaver</title>
          <link rel="canonical" href={window.location.origin} />
        </Helmet>
        <div className="container is-fluid p-0">
          <div className="box p-0 is-radiusless">
            <div className="titlebar box active level is-mobile mb-0 p-3">
              <div className="level-left">
                <strong>Storage Monitoring</strong>
              </div>
            </div>
            <div className="p-4">
              <div className="notification is-info">
                <h2 className="title is-4">No Zoneweaver API Servers</h2>
                <p>
                  You haven't added any Zoneweaver API Servers yet. Add a server
                  to start monitoring storage systems.
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
        <title>Storage Monitoring - Zoneweaver</title>
        <link rel="canonical" href={window.location.origin} />
      </Helmet>
      <div className="container is-fluid p-0">
        <div className="box p-0 is-radiusless">
          <StorageHeader
            loading={loading}
            autoRefresh={autoRefresh}
            setAutoRefresh={setAutoRefresh}
            refreshInterval={refreshInterval}
            setRefreshInterval={setRefreshInterval}
            resolution={resolution}
            setResolution={setResolution}
            selectedServer={selectedServer}
            loadStorageData={loadStorageData}
            timeWindow={timeWindow}
            setTimeWindow={setTimeWindow}
          />

          <div className="p-4">
            {error && (
              <div className="notification is-danger mb-4">
                <p>{error}</p>
              </div>
            )}

            <StorageSummary
              storagePools={storagePools}
              storageDatasets={storageDatasets}
              storageDisks={storageDisks}
              sectionsCollapsed={sectionsCollapsed}
              toggleSection={toggleSection}
            />

            <PoolsTable
              storagePools={getSortedPools()}
              poolSort={poolSort}
              handlePoolSort={handlePoolSort}
              getSortIcon={getSortIcon}
              resetPoolSort={resetPoolSort}
              sectionsCollapsed={sectionsCollapsed}
              toggleSection={toggleSection}
            />

            <DatasetsTable
              storageDatasets={getSortedDatasets()}
              datasetSort={datasetSort}
              handleDatasetSort={handleDatasetSort}
              getSortIcon={getSortIcon}
              resetDatasetSort={resetDatasetSort}
              sectionsCollapsed={sectionsCollapsed}
              toggleSection={toggleSection}
            />

            <DisksTable
              storageDisks={getSortedDisks()}
              diskSort={diskSort}
              handleDiskSort={handleDiskSort}
              getSortIcon={getSortIcon}
              resetDiskSort={resetDiskSort}
              sectionsCollapsed={sectionsCollapsed}
              toggleSection={toggleSection}
            />

            <DiskIOTable
              diskIOStats={getSortedDiskIOStats()}
              diskIOSort={diskIOSort}
              handleDiskIOSort={handleDiskIOSort}
              getSortIcon={getSortIcon}
              resetDiskIOSort={resetDiskIOSort}
              sectionsCollapsed={sectionsCollapsed}
              toggleSection={toggleSection}
            />

            <PoolIOTable
              poolIOStats={poolIOStats}
              sectionsCollapsed={sectionsCollapsed}
              toggleSection={toggleSection}
            />

            <ArcStats
              arcStats={arcStats}
              sectionsCollapsed={sectionsCollapsed}
              toggleSection={toggleSection}
            />

            <StorageCharts
              chartData={chartData}
              poolChartData={poolChartData}
              arcChartData={arcChartData}
              diskIOStats={diskIOStats}
              poolIOStats={poolIOStats}
              arcStats={arcStats}
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
              poolChartRefs={poolChartRefs}
              seriesVisibility={seriesVisibility}
              setSeriesVisibility={setSeriesVisibility}
            />
          </div>
        </div>
      </div>

      <ExpandedChartModal
        chartId={expandedChart}
        type={expandedChartType}
        close={closeExpandedChart}
        chartData={chartData}
        poolChartData={poolChartData}
        arcChartData={arcChartData}
      />
    </div>
  );
};

export default HostStorage;
