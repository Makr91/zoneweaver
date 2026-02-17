import { useState, useEffect, useRef } from "react";

import { useAuth } from "../../contexts/AuthContext";
import { useServers } from "../../contexts/ServerContext";

import { parseSize } from "./StorageUtils";
import { useStorageCharts } from "./useStorageCharts";
import { getSortIcon, useStorageSorting } from "./useStorageSorting";
import { getHistoricalTimestamp, getResolutionLimit } from "./utils/hostUtils";

const getMaxDataPointsForWindow = (window) => {
  const windowConfig = {
    "1min": { points: 12, since: "1minute", limit: 500 },
    "5min": { points: 60, since: "5minutes", limit: 2000 },
    "10min": { points: 120, since: "10minutes", limit: 4000 },
    "15min": { points: 180, since: "15minutes", limit: 6000 },
    "30min": { points: 360, since: "30minutes", limit: 12000 },
    "1hour": { points: 720, since: "1hour", limit: 25000 },
    "3hour": { points: 2160, since: "3hours", limit: 70000 },
    "6hour": { points: 4320, since: "6hours", limit: 140000 },
    "12hour": { points: 8640, since: "12hours", limit: 280000 },
    "24hour": { points: 17280, since: "24hours", limit: 500000 },
  };
  return windowConfig[window] || windowConfig["1hour"];
};

const groupByKey = (records, key) => {
  const groups = {};
  records.forEach((record) => {
    const groupName = record[key];
    if (!groupName) {
      return;
    }
    if (!groups[groupName]) {
      groups[groupName] = [];
    }
    groups[groupName].push(record);
  });
  return groups;
};

const buildIOChartData = (groups) => {
  const chartResult = {};
  Object.entries(groups).forEach(([name, records]) => {
    const sorted = records.sort(
      (a, b) => new Date(a.scan_timestamp) - new Date(b.scan_timestamp)
    );
    chartResult[name] = { readData: [], writeData: [], totalData: [] };
    sorted.forEach((io) => {
      const timestamp = new Date(io.scan_timestamp).getTime();
      const readMBps =
        (parseFloat(io.read_bandwidth_bytes) || 0) / (1024 * 1024);
      const writeMBps =
        (parseFloat(io.write_bandwidth_bytes) || 0) / (1024 * 1024);
      const totalMBps = readMBps + writeMBps;
      chartResult[name].readData.push([
        timestamp,
        parseFloat(readMBps.toFixed(3)),
      ]);
      chartResult[name].writeData.push([
        timestamp,
        parseFloat(writeMBps.toFixed(3)),
      ]);
      chartResult[name].totalData.push([
        timestamp,
        parseFloat(totalMBps.toFixed(3)),
      ]);
    });
  });
  return chartResult;
};

const extractLatestPerGroup = (groups) =>
  Object.values(groups)
    .map(
      (records) =>
        records.sort(
          (a, b) => new Date(b.scan_timestamp) - new Date(a.scan_timestamp)
        )[0]
    )
    .filter(Boolean);

const deduplicateRecords = (items, getKey) =>
  items.reduce((acc, item) => {
    const existing = acc.find((e) => getKey(e) === getKey(item));
    if (!existing) {
      acc.push(item);
    } else if (
      item.scan_timestamp &&
      existing.scan_timestamp &&
      new Date(item.scan_timestamp) > new Date(existing.scan_timestamp)
    ) {
      acc[acc.indexOf(existing)] = item;
    }
    return acc;
  }, []);

const deduplicateDisksByIdentity = (disks) =>
  disks.reduce((acc, disk) => {
    const existing = acc.find(
      (e) =>
        (e.device_name === disk.device_name && disk.device_name) ||
        (e.serial_number === disk.serial_number && disk.serial_number) ||
        (e.device === disk.device && disk.device) ||
        (e.name === disk.name && disk.name)
    );
    if (!existing) {
      acc.push(disk);
    } else if (
      disk.scan_timestamp &&
      existing.scan_timestamp &&
      new Date(disk.scan_timestamp) > new Date(existing.scan_timestamp)
    ) {
      acc[acc.indexOf(existing)] = disk;
    }
    return acc;
  }, []);

export const useHostStorageData = () => {
  const [storagePools, setStoragePools] = useState([]);
  const [storageDatasets, setStorageDatasets] = useState([]);
  const [storageDisks, setStorageDisks] = useState([]);
  const [diskIOStats, setDiskIOStats] = useState([]);
  const [poolIOStats, setPoolIOStats] = useState([]);
  const [arcStats, setArcStats] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedServer, setSelectedServer] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(300);
  const [sectionsCollapsed, setSectionsCollapsed] = useState({
    summary: false,
    pools: false,
    datasets: false,
    disks: false,
    diskIO: false,
    poolIO: false,
    arcStats: false,
    charts: false,
  });
  const [timeWindow, setTimeWindow] = useState("15min");
  const [resolution, setResolution] = useState("high");
  const [maxDataPoints, setMaxDataPoints] = useState(720);

  const { user } = useAuth();
  const {
    getServers,
    servers,
    currentServer,
    getStoragePools,
    getStorageDatasets,
    getStorageDisks,
    makeZoneweaverAPIRequest,
  } = useServers();

  const sorting = useStorageSorting();
  const charts = useStorageCharts();
  const loaders = useRef({});

  const toggleSection = (section) => {
    setSectionsCollapsed((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const loadStorageData = async (server) => {
    if (!server || loading) {
      return;
    }

    try {
      setLoading(true);
      setError("");

      const [poolsResult, datasetsResult, disksResult] =
        await Promise.allSettled([
          getStoragePools(server.hostname, server.port, server.protocol),
          getStorageDatasets(server.hostname, server.port, server.protocol),
          getStorageDisks(server.hostname, server.port, server.protocol),
        ]);

      if (poolsResult.status === "fulfilled" && poolsResult.value.success) {
        const pools =
          poolsResult.value.data?.pools || poolsResult.value.data || [];
        const deduplicated = deduplicateRecords(pools, (p) => p.name || p.pool);
        deduplicated.sort((a, b) =>
          (a.name || a.pool).localeCompare(b.name || b.pool)
        );
        setStoragePools(deduplicated);
      }

      if (
        datasetsResult.status === "fulfilled" &&
        datasetsResult.value.success
      ) {
        const datasets =
          datasetsResult.value.data?.datasets ||
          datasetsResult.value.data ||
          [];
        const deduplicated = deduplicateRecords(
          datasets,
          (d) => d.name || d.dataset
        );
        deduplicated.sort((a, b) =>
          (a.name || a.dataset).localeCompare(b.name || b.dataset)
        );
        setStorageDatasets(deduplicated);
      }

      if (disksResult.status === "fulfilled" && disksResult.value.success) {
        const disks =
          disksResult.value.data?.disks || disksResult.value.data || [];
        const deduplicated = deduplicateDisksByIdentity(disks);
        deduplicated.sort((a, b) => {
          const aName = a.device_name || a.device || a.name || "";
          const bName = b.device_name || b.device || b.name || "";
          return aName.localeCompare(bName);
        });
        setStorageDisks(deduplicated);
      }
    } catch (err) {
      console.error("Error loading storage data:", err);
      setError("Error loading storage monitoring data");
    } finally {
      setLoading(false);
    }
  };

  const loadDiskIOStats = async (server) => {
    if (!server || loading) {
      return;
    }

    try {
      const historicalTimestamp = getHistoricalTimestamp(timeWindow);
      const result = await makeZoneweaverAPIRequest(
        server.hostname,
        server.port,
        server.protocol,
        `monitoring/storage/disk-io?limit=${getResolutionLimit(resolution)}&per_device=true&since=${encodeURIComponent(historicalTimestamp)}`
      );

      if (result.success && result.data?.diskio) {
        const deviceGroups = groupByKey(result.data.diskio, "device_name");
        charts.setChartData(buildIOChartData(deviceGroups));

        const latestDiskIO = extractLatestPerGroup(deviceGroups);
        latestDiskIO.sort((a, b) => a.device_name.localeCompare(b.device_name));
        setDiskIOStats(latestDiskIO);
      } else {
        setDiskIOStats([]);
        charts.setChartData({});
      }
    } catch (err) {
      console.error("Error loading disk I/O statistics:", err);
      setDiskIOStats([]);
    }
  };

  const loadPoolIOStats = async (server) => {
    if (!server || loading) {
      return;
    }

    try {
      const historicalTimestamp = getHistoricalTimestamp(timeWindow);
      const historicalResult = await makeZoneweaverAPIRequest(
        server.hostname,
        server.port,
        server.protocol,
        `monitoring/storage/pool-io?limit=${getResolutionLimit(resolution)}&per_pool=true&since=${encodeURIComponent(historicalTimestamp)}`
      );

      if (historicalResult.success && historicalResult.data?.poolio) {
        const validRecords = historicalResult.data.poolio.filter(
          (io) => io.pool && io.scan_timestamp
        );
        const poolGroups = groupByKey(validRecords, "pool");
        charts.setPoolChartData(buildIOChartData(poolGroups));

        const latestPoolIO = extractLatestPerGroup(poolGroups);
        latestPoolIO.sort((a, b) => a.pool.localeCompare(b.pool));
        setPoolIOStats(latestPoolIO);
      } else {
        setPoolIOStats([]);
        charts.setPoolChartData({});
      }
    } catch (err) {
      console.error("Error loading pool I/O statistics:", err);
      setPoolIOStats([]);
      charts.setPoolChartData({});
    }
  };

  const loadArcStats = async (server) => {
    if (!server || loading) {
      return;
    }

    try {
      const historicalTimestamp = getHistoricalTimestamp(timeWindow);
      const result = await makeZoneweaverAPIRequest(
        server.hostname,
        server.port,
        server.protocol,
        `monitoring/storage/arc?limit=${getResolutionLimit(resolution)}&since=${encodeURIComponent(historicalTimestamp)}`
      );

      if (result.success && result.data?.arc) {
        const arcData = result.data.arc;
        arcData.sort(
          (a, b) => new Date(b.scan_timestamp) - new Date(a.scan_timestamp)
        );
        setArcStats(arcData);
        charts.updateArcChartData(arcData, maxDataPoints);
      } else {
        setArcStats([]);
      }
    } catch (err) {
      console.error("Error loading ARC statistics:", err);
      setArcStats([]);
    }
  };

  const getSortedPools = () =>
    [...storagePools].sort((a, b) => {
      for (const sort of sorting.poolSort) {
        const { column, direction } = sort;
        let aVal = a[column];
        let bVal = b[column];

        if (column === "health" || column === "status") {
          aVal = aVal?.toLowerCase() || "";
          bVal = bVal?.toLowerCase() || "";
        } else if (typeof aVal === "string") {
          aVal = aVal.toLowerCase();
          bVal = bVal ? bVal.toLowerCase() : "";
        }

        if (aVal < bVal) {
          return direction === "asc" ? -1 : 1;
        }
        if (aVal > bVal) {
          return direction === "asc" ? 1 : -1;
        }
      }
      return 0;
    });

  const getSortedDatasets = () =>
    [...storageDatasets].sort((a, b) => {
      for (const sort of sorting.datasetSort) {
        const { column, direction } = sort;
        let aVal = a[column];
        let bVal = b[column];

        if (
          column === "used" ||
          column === "available" ||
          column === "referenced"
        ) {
          aVal = parseSize(aVal) || 0;
          bVal = parseSize(bVal) || 0;
        } else if (typeof aVal === "string") {
          aVal = aVal.toLowerCase();
          bVal = bVal ? bVal.toLowerCase() : "";
        }

        if (aVal < bVal) {
          return direction === "asc" ? -1 : 1;
        }
        if (aVal > bVal) {
          return direction === "asc" ? 1 : -1;
        }
      }
      return 0;
    });

  const getSortedDisks = () =>
    [...storageDisks].sort((a, b) => {
      for (const sort of sorting.diskSort) {
        const { column, direction } = sort;
        let aVal = a[column];
        let bVal = b[column];

        if (
          column === "capacity_bytes" ||
          column === "size" ||
          column === "capacity" ||
          column === "temperature"
        ) {
          aVal = parseFloat(aVal) || 0;
          bVal = parseFloat(bVal) || 0;
        } else if (typeof aVal === "string") {
          aVal = aVal.toLowerCase();
          bVal = bVal ? bVal.toLowerCase() : "";
        }

        if (aVal < bVal) {
          return direction === "asc" ? -1 : 1;
        }
        if (aVal > bVal) {
          return direction === "asc" ? 1 : -1;
        }
      }
      return 0;
    });

  const getSortedDiskIOStats = () =>
    [...diskIOStats].sort((a, b) => {
      for (const sort of sorting.diskIOSort) {
        const { column, direction } = sort;
        let aVal;
        let bVal;

        if (
          column === "totalMbps" ||
          column === "readMbps" ||
          column === "writeMbps"
        ) {
          const readMBpsA = (a.read_bandwidth_bytes || 0) / (1024 * 1024);
          const writeMBpsA = (a.write_bandwidth_bytes || 0) / (1024 * 1024);
          const readMBpsB = (b.read_bandwidth_bytes || 0) / (1024 * 1024);
          const writeMBpsB = (b.write_bandwidth_bytes || 0) / (1024 * 1024);

          if (column === "totalMbps") {
            aVal = readMBpsA + writeMBpsA;
            bVal = readMBpsB + writeMBpsB;
          } else if (column === "readMbps") {
            aVal = readMBpsA;
            bVal = readMBpsB;
          } else if (column === "writeMbps") {
            aVal = writeMBpsA;
            bVal = writeMBpsB;
          }
        } else if (column === "device_name") {
          aVal = a.device_name?.toLowerCase() || "";
          bVal = b.device_name?.toLowerCase() || "";
        } else if (column === "read_ops" || column === "write_ops") {
          aVal = parseInt(a[column]) || 0;
          bVal = parseInt(b[column]) || 0;
        } else {
          aVal = a[column] || "";
          bVal = b[column] || "";
        }

        if (aVal < bVal) {
          return direction === "asc" ? -1 : 1;
        }
        if (aVal > bVal) {
          return direction === "asc" ? 1 : -1;
        }
      }
      return 0;
    });

  loaders.current = {
    loadStorageData,
    loadDiskIOStats,
    loadPoolIOStats,
    loadArcStats,
  };

  useEffect(() => {
    const serverList = getServers();
    if (serverList.length > 0) {
      const server = currentServer || serverList[0];
      setSelectedServer(server);
      loaders.current.loadStorageData(server);
      loaders.current.loadDiskIOStats(server);
      loaders.current.loadPoolIOStats(server);
      loaders.current.loadArcStats(server);
    }
  }, [getServers, servers, currentServer]);

  useEffect(() => {
    if (!autoRefresh || !selectedServer) {
      return undefined;
    }

    const interval = setInterval(() => {
      loaders.current.loadStorageData(selectedServer);
      loaders.current.loadDiskIOStats(selectedServer);
      loaders.current.loadPoolIOStats(selectedServer);
      loaders.current.loadArcStats(selectedServer);
    }, refreshInterval * 1000);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, selectedServer]);

  useEffect(() => {
    const config = getMaxDataPointsForWindow(timeWindow);
    setMaxDataPoints(config.points);

    if (selectedServer) {
      loaders.current.loadDiskIOStats(selectedServer);
      loaders.current.loadPoolIOStats(selectedServer);
      loaders.current.loadArcStats(selectedServer);
    }
  }, [timeWindow, resolution, selectedServer]);

  return {
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
    ...sorting,
    getSortedPools,
    getSortedDatasets,
    getSortedDisks,
    getSortedDiskIOStats,
    getSortIcon,
    ...charts,
    timeWindow,
    setTimeWindow,
    user,
    getServers,
    servers,
    loadStorageData,
  };
};
