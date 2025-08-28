import { useState, useEffect, useCallback, useRef } from 'react';
import { useServers } from '../../contexts/ServerContext';
import { getMaxDataPointsForWindow, calculateNetworkBandwidth } from './utils';

export const useHostData = (currentServer) => {
  const [serverStats, setServerStats] = useState({});
  const [monitoringHealth, setMonitoringHealth] = useState({});
  const [monitoringStatus, setMonitoringStatus] = useState({});
  const [networkInterfaces, setNetworkInterfaces] = useState({});
  const [storageSummary, setStorageSummary] = useState({});
  const [taskStats, setTaskStats] = useState({});
  const [diskIOStats, setDiskIOStats] = useState([]);
  const [arcStats, setArcStats] = useState([]);
  const [networkUsage, setNetworkUsage] = useState([]);
  const [cpuStats, setCpuStats] = useState([]);
  const [cpuCoreStats, setCpuCoreStats] = useState({});
  const [memoryStats, setMemoryStats] = useState([]);
  const [swapSummaryData, setSwapSummaryData] = useState({}); // New state for swap summary
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [refreshInterval, setRefreshInterval] = useState(300);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const [chartData, setChartData] = useState({});
  const [arcChartData, setArcChartData] = useState({
    sizeData: [],
    targetData: [],
    hitRateData: []
  });
  const [networkChartData, setNetworkChartData] = useState({});
  const [cpuChartData, setCpuChartData] = useState({
    overall: [],
    cores: {},
    load: { '1min': [], '5min': [], '15min': [] }
  });
  const [memoryChartData, setMemoryChartData] = useState({
    used: [],
    free: [],
    cached: [],
    total: []
  });
  const [timeWindow, setTimeWindow] = useState('15min');
  const [resolution, setResolution] = useState('high');
  const [maxDataPoints, setMaxDataPoints] = useState(180);

  // Track initial loading to prevent duplicate historical calls and auto-refresh overlap
  const initialLoadDone = useRef(false);
  const [initialDataLoaded, setInitialDataLoaded] = useState(false);

  // Track latest timestamps for incremental chart updates
  const [lastChartTimestamps, setLastChartTimestamps] = useState({
    poolIO: null,
    network: null,
    arc: null,
    cpu: null,
    memory: null
  });

  const {
    makeZoneweaverAPIRequest,
    getMonitoringHealth,
    getMonitoringStatus,
    getStoragePools,
    getStorageDatasets,
    getStoragePoolIO,
    getStorageARC,
    getNetworkUsage,
    getSystemCPU,
    getSystemMemory
  } = useServers();

  const updatePoolIOChartData = useCallback((poolIOData) => {
    // Group by pool and sort by timestamp for proper chart initialization
    const poolData = {};
    poolIOData.forEach(poolIO => {
      const poolName = poolIO.pool;
      if (!poolData[poolName]) {
        poolData[poolName] = [];
      }
      poolData[poolName].push(poolIO);
    });

    // Initialize charts with historical data
    setChartData(prevData => {
      const newData = { ...prevData };
      
      Object.entries(poolData).forEach(([poolName, poolIOArray]) => {
        // Sort by timestamp (oldest first)
        poolIOArray.sort((a, b) => new Date(a.scan_timestamp) - new Date(b.scan_timestamp));
        
        if (!newData[poolName]) {
          newData[poolName] = {
            readData: [],
            writeData: [],
            totalData: []
          };
        }
        
        // If this is initial load, replace the data. If updating, append.
        const isInitialLoad = newData[poolName].readData.length === 0;
        
        if (isInitialLoad) {
          // Initialize with all historical data
          poolIOArray.forEach(poolIO => {
            const timestamp = new Date(poolIO.scan_timestamp).getTime();
            const readBandwidth = poolIO.read_bandwidth_bytes || 0;
            const writeBandwidth = poolIO.write_bandwidth_bytes || 0;
            const readMBps = readBandwidth / (1024 * 1024);
            const writeMBps = writeBandwidth / (1024 * 1024);
            const totalMBps = readMBps + writeMBps;
            
            newData[poolName].readData.push([timestamp, parseFloat(readMBps.toFixed(3))]);
            newData[poolName].writeData.push([timestamp, parseFloat(writeMBps.toFixed(3))]);
            newData[poolName].totalData.push([timestamp, parseFloat(totalMBps.toFixed(3))]);
          });
        } else {
          // Update mode - just add the latest points
          const latestPoolIO = poolIOArray[poolIOArray.length - 1];
          if (latestPoolIO) {
            const timestamp = new Date(latestPoolIO.scan_timestamp).getTime();
            const readBandwidth = latestPoolIO.read_bandwidth_bytes || 0;
            const writeBandwidth = latestPoolIO.write_bandwidth_bytes || 0;
            const readMBps = readBandwidth / (1024 * 1024);
            const writeMBps = writeBandwidth / (1024 * 1024);
            const totalMBps = readMBps + writeMBps;
            
            newData[poolName].readData.push([timestamp, parseFloat(readMBps.toFixed(3))]);
            newData[poolName].writeData.push([timestamp, parseFloat(writeMBps.toFixed(3))]);
            newData[poolName].totalData.push([timestamp, parseFloat(totalMBps.toFixed(3))]);
          }
        }
        
        // Trim to max data points
        if (newData[poolName].readData.length > maxDataPoints) {
          newData[poolName].readData = newData[poolName].readData.slice(-maxDataPoints);
          newData[poolName].writeData = newData[poolName].writeData.slice(-maxDataPoints);
          newData[poolName].totalData = newData[poolName].totalData.slice(-maxDataPoints);
        }
      });
      
      return newData;
    });
  }, [maxDataPoints]);

  const updateARCChartData = useCallback((arcData) => {
    arcData.forEach(arc => {
      const timestamp = new Date(arc.scan_timestamp).getTime();
      
      const arcSize = arc.arc_size ? parseFloat(arc.arc_size) / (1024 * 1024 * 1024) : 0;
      const arcTarget = arc.arc_target_size ? parseFloat(arc.arc_target_size) / (1024 * 1024 * 1024) : 0;
      
      const arcHits = parseFloat(arc.hits || arc.arc_hits) || 0;
      const arcMisses = parseFloat(arc.misses || arc.arc_misses) || 0;
      const hitRate = arc.hit_ratio || (arcHits + arcMisses > 0 ? (arcHits / (arcHits + arcMisses)) * 100 : 0);
      
      const sizePoint = [timestamp, parseFloat(arcSize.toFixed(2))];
      const targetPoint = [timestamp, parseFloat(arcTarget.toFixed(2))];
      const hitRatePoint = [timestamp, parseFloat(hitRate.toFixed(1))];
      
      setArcChartData(prevData => {
        const newData = { ...prevData };
        
        newData.sizeData.push(sizePoint);
        newData.targetData.push(targetPoint);
        newData.hitRateData.push(hitRatePoint);
        
        if (newData.sizeData.length > maxDataPoints) {
          newData.sizeData = newData.sizeData.slice(-maxDataPoints);
          newData.targetData = newData.targetData.slice(-maxDataPoints);
          newData.hitRateData = newData.hitRateData.slice(-maxDataPoints);
        }
        
        return newData;
      });
    });
  }, [maxDataPoints]);

  const updateNetworkChartData = useCallback((networkUsageData) => {
    // Group by interface and sort by timestamp for proper chart initialization
    const interfaceData = {};
    networkUsageData.forEach(usage => {
      const interfaceName = usage.link;
      if (!interfaceData[interfaceName]) {
        interfaceData[interfaceName] = [];
      }
      interfaceData[interfaceName].push(usage);
    });

    // Initialize charts with historical data
    setNetworkChartData(prevData => {
      const newData = { ...prevData };
      
      Object.entries(interfaceData).forEach(([interfaceName, usageArray]) => {
        // Sort by timestamp (oldest first)
        usageArray.sort((a, b) => new Date(a.scan_timestamp) - new Date(b.scan_timestamp));
        
        if (!newData[interfaceName]) {
          newData[interfaceName] = {
            rxData: [],
            txData: [],
            totalData: []
          };
        }
        
        // If this is initial load, replace the data. If updating, append.
        const isInitialLoad = newData[interfaceName].rxData.length === 0;
        
        if (isInitialLoad) {
          // Initialize with all historical data
          usageArray.forEach(usage => {
            const bandwidth = calculateNetworkBandwidth(usage);
            const timestamp = new Date(usage.scan_timestamp).getTime();
            
            newData[interfaceName].rxData.push([timestamp, parseFloat(bandwidth.rxMbps.toFixed(3))]);
            newData[interfaceName].txData.push([timestamp, parseFloat(bandwidth.txMbps.toFixed(3))]);
            newData[interfaceName].totalData.push([timestamp, parseFloat(bandwidth.totalMbps.toFixed(3))]);
          });
        } else {
          // Update mode - just add the latest points
          const latestUsage = usageArray[usageArray.length - 1];
          if (latestUsage) {
            const bandwidth = calculateNetworkBandwidth(latestUsage);
            const timestamp = new Date(latestUsage.scan_timestamp).getTime();
            
            newData[interfaceName].rxData.push([timestamp, parseFloat(bandwidth.rxMbps.toFixed(3))]);
            newData[interfaceName].txData.push([timestamp, parseFloat(bandwidth.txMbps.toFixed(3))]);
            newData[interfaceName].totalData.push([timestamp, parseFloat(bandwidth.totalMbps.toFixed(3))]);
          }
        }
        
        // Trim to max data points
        if (newData[interfaceName].rxData.length > maxDataPoints) {
          newData[interfaceName].rxData = newData[interfaceName].rxData.slice(-maxDataPoints);
          newData[interfaceName].txData = newData[interfaceName].txData.slice(-maxDataPoints);
          newData[interfaceName].totalData = newData[interfaceName].totalData.slice(-maxDataPoints);
        }
      });
      
      return newData;
    });
  }, [maxDataPoints]);

  const updateCPUChartData = useCallback((cpuData) => {
    const overall = [];
    const load1 = [];
    const load5 = [];
    const load15 = [];

    cpuData.forEach(d => {
      const timestamp = new Date(d.scan_timestamp).getTime();
      overall.push([timestamp, d.cpu_utilization_pct]);
      load1.push([timestamp, d.load_avg_1min]);
      load5.push([timestamp, d.load_avg_5min]);
      load15.push([timestamp, d.load_avg_15min]);
    });

    setCpuChartData(prev => ({
      ...prev,
      overall: overall.sort((a, b) => a[0] - b[0]),
      load: {
        '1min': load1.sort((a, b) => a[0] - b[0]),
        '5min': load5.sort((a, b) => a[0] - b[0]),
        '15min': load15.sort((a, b) => a[0] - b[0]),
      }
    }));
  }, []);

  const updateCPUCoreChartData = useCallback((cpuData) => {
    const cores = {};
    cpuData.forEach(d => {
      if (d.per_core_parsed) {
        d.per_core_parsed.forEach(coreData => {
          if (!cores[coreData.cpu_id]) {
            cores[coreData.cpu_id] = [];
          }
          cores[coreData.cpu_id].push([new Date(d.scan_timestamp).getTime(), coreData.utilization_pct]);
        });
      }
    });
    Object.keys(cores).forEach(core => {
      cores[core].sort((a, b) => a[0] - b[0]);
    });
    setCpuChartData(prev => ({ ...prev, cores }));
  }, []);

  const updateMemoryChartData = useCallback((memoryData) => {
    // Sort memory data by timestamp for proper initialization
    const sortedMemoryData = [...memoryData].sort((a, b) => new Date(a.scan_timestamp) - new Date(b.scan_timestamp));
    
    setMemoryChartData(prevData => {
      const isInitialLoad = prevData.used.length === 0;
      
      if (isInitialLoad) {
        // Initialize with all historical data
        const used = [];
        const free = [];
        const cached = [];
        const total = [];

        sortedMemoryData.forEach(d => {
          const timestamp = new Date(d.scan_timestamp).getTime();
          used.push([timestamp, parseFloat((d.used_memory_bytes / (1024 ** 3)).toFixed(2))]);
          free.push([timestamp, parseFloat((d.free_memory_bytes / (1024 ** 3)).toFixed(2))]);
          cached.push([timestamp, parseFloat((d.cached_bytes / (1024 ** 3)).toFixed(2))]);
          total.push([timestamp, parseFloat((d.total_memory_bytes / (1024 ** 3)).toFixed(2))]);
        });

        return {
          used: used,
          free: free,
          cached: cached,
          total: total,
        };
      } else {
        // Update mode - add the latest point
        const latestData = sortedMemoryData[sortedMemoryData.length - 1];
        if (latestData) {
          const timestamp = new Date(latestData.scan_timestamp).getTime();
          const newUsed = [...prevData.used, [timestamp, parseFloat((latestData.used_memory_bytes / (1024 ** 3)).toFixed(2))]];
          const newFree = [...prevData.free, [timestamp, parseFloat((latestData.free_memory_bytes / (1024 ** 3)).toFixed(2))]];
          const newCached = [...prevData.cached, [timestamp, parseFloat((latestData.cached_bytes / (1024 ** 3)).toFixed(2))]];
          const newTotal = [...prevData.total, [timestamp, parseFloat((latestData.total_memory_bytes / (1024 ** 3)).toFixed(2))]];

          return {
            used: newUsed.length > maxDataPoints ? newUsed.slice(-maxDataPoints) : newUsed,
            free: newFree.length > maxDataPoints ? newFree.slice(-maxDataPoints) : newFree,
            cached: newCached.length > maxDataPoints ? newCached.slice(-maxDataPoints) : newCached,
            total: newTotal.length > maxDataPoints ? newTotal.slice(-maxDataPoints) : newTotal,
          };
        }
      }
      
      return prevData;
    });
  }, [maxDataPoints]);

  // Helper function to calculate historical timestamp based on time window
  const getHistoricalTimestamp = (timeWindow) => {
    const now = new Date();
    const minutesAgo = {
      '1min': 1, '5min': 5, '10min': 10, '15min': 15,
      '30min': 30, '1hour': 60, '3hour': 180, 
      '6hour': 360, '12hour': 720, '24hour': 1440
    };
    const minutes = minutesAgo[timeWindow] || 15;
    return new Date(now.getTime() - (minutes * 60 * 1000)).toISOString();
  };

  // Helper function to get resolution limit for API requests
  const getResolutionLimit = (resolution) => {
    const resolutionLimits = {
      'realtime': 125,
      'high': 38,
      'medium': 13,
      'low': 5
    };
    return resolutionLimits[resolution] || 38;
  };

  // Load historical chart data for the selected time window
  const loadHistoricalChartData = useCallback(async () => {
    if (!currentServer || !makeZoneweaverAPIRequest) return;

    try {
      console.log('📊 HISTORICAL CHARTS: Loading historical data for time window:', timeWindow);
      
      const historicalTimestamp = getHistoricalTimestamp(timeWindow);
      console.log('📊 HISTORICAL CHARTS: Requesting data since:', historicalTimestamp);
      
      // Load historical data for all chart types in parallel
      const results = await Promise.allSettled([
        // Network usage data
        makeZoneweaverAPIRequest(
          currentServer.hostname, 
          currentServer.port, 
          currentServer.protocol, 
          `monitoring/network/usage?since=${encodeURIComponent(historicalTimestamp)}&limit=${getResolutionLimit(resolution)}&per_interface=true`
        ),
        // Storage pool I/O data  
        getStoragePoolIO(currentServer.hostname, currentServer.port, currentServer.protocol, {
          limit: getResolutionLimit(resolution),
          since: historicalTimestamp,
          per_pool: true
        }),
        // ZFS ARC data
        getStorageARC(currentServer.hostname, currentServer.port, currentServer.protocol, {
          limit: getResolutionLimit(resolution),
          since: historicalTimestamp  
        }),
        // CPU data
        makeZoneweaverAPIRequest(
          currentServer.hostname, 
          currentServer.port, 
          currentServer.protocol, 
          `monitoring/system/cpu?limit=${getResolutionLimit(resolution)}&since=${encodeURIComponent(historicalTimestamp)}&include_cores=true`
        ),
        // Memory data
        makeZoneweaverAPIRequest(
          currentServer.hostname, 
          currentServer.port, 
          currentServer.protocol, 
          `monitoring/system/memory?limit=${getResolutionLimit(resolution)}&since=${encodeURIComponent(historicalTimestamp)}`
        )
      ]);

      const [networkResult, poolIOResult, arcResult, cpuResult, memoryResult] = results;

      // Process network historical data
      if (networkResult.status === 'fulfilled' && networkResult.value?.success) {
        const networkData = networkResult.value.data?.usage || [];
        console.log('📊 HISTORICAL CHARTS: Processing', networkData.length, 'historical network records');
        
        // Group by interface
        const interfaceGroups = {};
        networkData.forEach(record => {
          const interfaceName = record.link;
          if (!interfaceName) return;
          
          if (!interfaceGroups[interfaceName]) {
            interfaceGroups[interfaceName] = [];
          }
          interfaceGroups[interfaceName].push(record);
        });

        // Build network chart data from historical records
        const newNetworkChartData = {};
        Object.entries(interfaceGroups).forEach(([interfaceName, records]) => {
          // Sort records by timestamp (oldest first)
          const sortedRecords = records.sort((a, b) => 
            new Date(a.scan_timestamp) - new Date(b.scan_timestamp)
          );

          newNetworkChartData[interfaceName] = {
            rxData: [],
            txData: [],
            totalData: []
          };

          sortedRecords.forEach(record => {
            const timestamp = new Date(record.scan_timestamp).getTime();
            const rxMbps = parseFloat(record.rx_mbps) || 0;  // Use pre-calculated API value
            const txMbps = parseFloat(record.tx_mbps) || 0;  // Use pre-calculated API value
            
            newNetworkChartData[interfaceName].rxData.push([timestamp, parseFloat(rxMbps.toFixed(3))]);
            newNetworkChartData[interfaceName].txData.push([timestamp, parseFloat(txMbps.toFixed(3))]);
            newNetworkChartData[interfaceName].totalData.push([timestamp, parseFloat((rxMbps + txMbps).toFixed(3))]);
          });

          console.log(`📊 HISTORICAL CHARTS: Built ${sortedRecords.length} historical points for network ${interfaceName}`);
        });

        setNetworkChartData(newNetworkChartData);
        
        // Extract latest values for network usage state (for tables)
        const validNetworkUsage = networkData.filter(usage => 
          usage.link && 
          usage.link !== 'LINK' && 
          usage.ipackets !== 'IPACKETS' &&
          usage.time_delta_seconds > 0
        );
        
        const deduplicatedNetworkUsage = validNetworkUsage.reduce((acc, usage) => {
          const existing = acc.find(existing => existing.link === usage.link);
          if (!existing) {
            acc.push({...usage});
          } else {
            if (new Date(usage.scan_timestamp) > new Date(existing.scan_timestamp)) {
              const index = acc.indexOf(existing);
              acc[index] = {...usage};
            }
          }
          return acc;
        }, []);
        
        // Use API's pre-calculated bandwidth values for sorting
        const networkUsageWithBandwidth = deduplicatedNetworkUsage.map(usage => ({
          ...usage,
          totalMbps: (parseFloat(usage.rx_mbps) || 0) + (parseFloat(usage.tx_mbps) || 0)
        }));
        
        // Sort by pre-calculated bandwidth values from API
        networkUsageWithBandwidth.sort((a, b) => 
          b.totalMbps - a.totalMbps
        );
        
        // Use the sorted data for state (remove totalMbps property for consistency)
        const sortedNetworkUsage = networkUsageWithBandwidth.map(({ totalMbps, ...usage }) => usage);
        setNetworkUsage(sortedNetworkUsage);
      }

      // Process storage pool I/O historical data
      if (poolIOResult.status === 'fulfilled' && poolIOResult.value?.success) {
        const poolIOData = poolIOResult.value.data?.poolio || [];
        console.log('📊 HISTORICAL CHARTS: Processing', poolIOData.length, 'historical pool I/O records');
        updatePoolIOChartData(poolIOData);
        
        // Extract latest values for current state
        const deduplicatedPoolIO = poolIOData.reduce((acc, poolIO) => {
          const existing = acc.find(existing => existing.pool === poolIO.pool);
          if (!existing) {
            acc.push({...poolIO});
          } else {
            if (new Date(poolIO.scan_timestamp) > new Date(existing.scan_timestamp)) {
              const index = acc.indexOf(existing);
              acc[index] = {...poolIO};
            }
          }
          return acc;
        }, []);
        deduplicatedPoolIO.sort((a, b) => a.pool.localeCompare(b.pool));
        setDiskIOStats(deduplicatedPoolIO);
      }

      // Process ZFS ARC historical data  
      if (arcResult.status === 'fulfilled' && arcResult.value?.success) {
        const arcData = arcResult.value.data?.arc || [];
        console.log('📊 HISTORICAL CHARTS: Processing', arcData.length, 'historical ARC records');
        
        // Reset ARC chart data and build from historical records
        const sizeData = [];
        const targetData = [];
        const hitRateData = [];

        arcData.sort((a, b) => new Date(a.scan_timestamp) - new Date(b.scan_timestamp));
        
        arcData.forEach(arc => {
          const timestamp = new Date(arc.scan_timestamp).getTime();
          const arcSize = arc.arc_size ? parseFloat(arc.arc_size) / (1024 * 1024 * 1024) : 0;
          const arcTarget = arc.arc_target_size ? parseFloat(arc.arc_target_size) / (1024 * 1024 * 1024) : 0;
          const arcHits = parseFloat(arc.hits || arc.arc_hits) || 0;
          const arcMisses = parseFloat(arc.misses || arc.arc_misses) || 0;
          const hitRate = arc.hit_ratio || (arcHits + arcMisses > 0 ? (arcHits / (arcHits + arcMisses)) * 100 : 0);
          
          sizeData.push([timestamp, parseFloat(arcSize.toFixed(2))]);
          targetData.push([timestamp, parseFloat(arcTarget.toFixed(2))]);  
          hitRateData.push([timestamp, parseFloat(hitRate.toFixed(1))]);
        });

        setArcChartData({ sizeData, targetData, hitRateData });
        
        // Extract latest values for current state
        const deduplicatedARC = arcData.reduce((acc, arc) => {
          const existing = acc.find(existing => existing.scan_timestamp === arc.scan_timestamp);
          if (!existing) {
            acc.push({...arc});
          }
          return acc;
        }, []);
        deduplicatedARC.sort((a, b) => new Date(a.scan_timestamp) - new Date(b.scan_timestamp));
        setArcStats(deduplicatedARC);
      }

      // Process CPU historical data
      if (cpuResult.status === 'fulfilled' && cpuResult.value?.success) {
        const cpuData = cpuResult.value.data?.cpu || [];
        console.log('📊 HISTORICAL CHARTS: Processing', cpuData.length, 'historical CPU records');
        updateCPUChartData(cpuData);
        updateCPUCoreChartData(cpuData);
        setCpuStats(cpuData);
      }

      // Process memory historical data
      if (memoryResult.status === 'fulfilled' && memoryResult.value?.success) {
        const memoryData = memoryResult.value.data?.memory || [];
        console.log('📊 HISTORICAL CHARTS: Processing', memoryData.length, 'historical memory records');
        updateMemoryChartData(memoryData);
        setMemoryStats(memoryData);
      }

      console.log('📊 HISTORICAL CHARTS: Completed loading historical data for all chart types');

      // Update timestamp tracking after successful historical load
      const newTimestamps = {};
      
      if (networkResult.status === 'fulfilled' && networkResult.value?.success) {
        const networkData = networkResult.value.data?.usage || [];
        if (networkData.length > 0) {
          const latestNetwork = networkData.reduce((latest, current) => 
            new Date(current.scan_timestamp) > new Date(latest.scan_timestamp) ? current : latest
          );
          newTimestamps.network = latestNetwork.scan_timestamp;
        }
      }
      
      if (poolIOResult.status === 'fulfilled' && poolIOResult.value?.success) {
        const poolIOData = poolIOResult.value.data?.poolio || [];
        if (poolIOData.length > 0) {
          const latestPoolIO = poolIOData.reduce((latest, current) => 
            new Date(current.scan_timestamp) > new Date(latest.scan_timestamp) ? current : latest
          );
          newTimestamps.poolIO = latestPoolIO.scan_timestamp;
        }
      }
      
      if (arcResult.status === 'fulfilled' && arcResult.value?.success) {
        const arcData = arcResult.value.data?.arc || [];
        if (arcData.length > 0) {
          const latestARC = arcData.reduce((latest, current) => 
            new Date(current.scan_timestamp) > new Date(latest.scan_timestamp) ? current : latest
          );
          newTimestamps.arc = latestARC.scan_timestamp;
        }
      }
      
      if (cpuResult.status === 'fulfilled' && cpuResult.value?.success) {
        const cpuData = cpuResult.value.data?.cpu || [];
        if (cpuData.length > 0) {
          const latestCPU = cpuData.reduce((latest, current) => 
            new Date(current.scan_timestamp) > new Date(latest.scan_timestamp) ? current : latest
          );
          newTimestamps.cpu = latestCPU.scan_timestamp;
        }
      }
      
      if (memoryResult.status === 'fulfilled' && memoryResult.value?.success) {
        const memoryData = memoryResult.value.data?.memory || [];
        if (memoryData.length > 0) {
          const latestMemory = memoryData.reduce((latest, current) => 
            new Date(current.scan_timestamp) > new Date(latest.scan_timestamp) ? current : latest
          );
          newTimestamps.memory = latestMemory.scan_timestamp;
        }
      }

      setLastChartTimestamps(prev => ({ ...prev, ...newTimestamps }));

    } catch (error) {
      console.error('📊 HISTORICAL CHARTS: Error loading historical data:', error);
    }
  }, [currentServer, makeZoneweaverAPIRequest, timeWindow, resolution, getStoragePoolIO, getStorageARC, getSystemCPU, getSystemMemory, updatePoolIOChartData, updateCPUChartData, updateCPUCoreChartData, updateMemoryChartData]);

  // Load recent chart data for incremental refresh
  const loadRecentChartData = useCallback(async () => {
    if (!currentServer || !makeZoneweaverAPIRequest) return;

    try {
      console.log('🔄 RECENT CHARTS: Loading recent chart data for refresh');

      // Check if we have any timestamps - if not, fall back to historical load
      const hasTimestamps = Object.values(lastChartTimestamps).some(timestamp => timestamp !== null);
      if (!hasTimestamps) {
        console.log('🔄 RECENT CHARTS: No timestamps found, falling back to historical load');
        return loadHistoricalChartData();
      }

      // Load recent data for all chart types in parallel
      const results = await Promise.allSettled([
        // Network usage data (if we have a timestamp)
        lastChartTimestamps.network ? makeZoneweaverAPIRequest(
          currentServer.hostname, 
          currentServer.port, 
          currentServer.protocol, 
          `monitoring/network/usage?since=${encodeURIComponent(lastChartTimestamps.network)}&limit=${getResolutionLimit(resolution)}&per_interface=true`
        ) : Promise.resolve({ success: false, message: 'No network timestamp' }),
        
        // Storage pool I/O data (if we have a timestamp)
        lastChartTimestamps.poolIO ? getStoragePoolIO(currentServer.hostname, currentServer.port, currentServer.protocol, {
          limit: getResolutionLimit(resolution),
          since: lastChartTimestamps.poolIO,
          per_pool: true
        }) : Promise.resolve({ success: false, message: 'No poolIO timestamp' }),
        
        // ZFS ARC data (if we have a timestamp)
        lastChartTimestamps.arc ? getStorageARC(currentServer.hostname, currentServer.port, currentServer.protocol, {
          limit: getResolutionLimit(resolution),
          since: lastChartTimestamps.arc
        }) : Promise.resolve({ success: false, message: 'No arc timestamp' }),
        
        // CPU data (if we have a timestamp)
        lastChartTimestamps.cpu ? makeZoneweaverAPIRequest(
          currentServer.hostname, 
          currentServer.port, 
          currentServer.protocol, 
          `monitoring/system/cpu?limit=${getResolutionLimit(resolution)}&since=${encodeURIComponent(lastChartTimestamps.cpu)}&include_cores=true`
        ) : Promise.resolve({ success: false, message: 'No cpu timestamp' }),
        
        // Memory data (if we have a timestamp)
        lastChartTimestamps.memory ? makeZoneweaverAPIRequest(
          currentServer.hostname, 
          currentServer.port, 
          currentServer.protocol, 
          `monitoring/system/memory?limit=${getResolutionLimit(resolution)}&since=${encodeURIComponent(lastChartTimestamps.memory)}`
        ) : Promise.resolve({ success: false, message: 'No memory timestamp' })
      ]);

      const [networkResult, poolIOResult, arcResult, cpuResult, memoryResult] = results;

      // Track updated timestamps
      const newTimestamps = {};

      // Process network recent data
      if (networkResult.status === 'fulfilled' && networkResult.value?.success) {
        const networkData = networkResult.value.data?.usage || [];
        console.log('🔄 RECENT CHARTS: Processing', networkData.length, 'recent network records');
        
        if (networkData.length > 0) {
          updateNetworkChartData(networkData);
          
          // Update network usage state (for tables)
          const validNetworkUsage = networkData.filter(usage => 
            usage.link && 
            usage.link !== 'LINK' && 
            usage.ipackets !== 'IPACKETS' &&
            usage.time_delta_seconds > 0
          );
          
          if (validNetworkUsage.length > 0) {
            // Find latest timestamp for this chart type
            const latestNetwork = validNetworkUsage.reduce((latest, current) => 
              new Date(current.scan_timestamp) > new Date(latest.scan_timestamp) ? current : latest
            );
            newTimestamps.network = latestNetwork.scan_timestamp;
          }
        }
      }

      // Process storage pool I/O recent data
      if (poolIOResult.status === 'fulfilled' && poolIOResult.value?.success) {
        const poolIOData = poolIOResult.value.data?.poolio || [];
        console.log('🔄 RECENT CHARTS: Processing', poolIOData.length, 'recent pool I/O records');
        
        if (poolIOData.length > 0) {
          updatePoolIOChartData(poolIOData);
          
          // Find latest timestamp for this chart type
          const latestPoolIO = poolIOData.reduce((latest, current) => 
            new Date(current.scan_timestamp) > new Date(latest.scan_timestamp) ? current : latest
          );
          newTimestamps.poolIO = latestPoolIO.scan_timestamp;
        }
      }

      // Process ZFS ARC recent data
      if (arcResult.status === 'fulfilled' && arcResult.value?.success) {
        const arcData = arcResult.value.data?.arc || [];
        console.log('🔄 RECENT CHARTS: Processing', arcData.length, 'recent ARC records');
        
        if (arcData.length > 0) {
          updateARCChartData(arcData);
          
          // Find latest timestamp for this chart type
          const latestARC = arcData.reduce((latest, current) => 
            new Date(current.scan_timestamp) > new Date(latest.scan_timestamp) ? current : latest
          );
          newTimestamps.arc = latestARC.scan_timestamp;
        }
      }

      // Process CPU recent data
      if (cpuResult.status === 'fulfilled' && cpuResult.value?.success) {
        const cpuData = cpuResult.value.data?.cpu || [];
        console.log('🔄 RECENT CHARTS: Processing', cpuData.length, 'recent CPU records');
        
        if (cpuData.length > 0) {
          updateCPUChartData(cpuData);
          updateCPUCoreChartData(cpuData);
          
          // Find latest timestamp for this chart type
          const latestCPU = cpuData.reduce((latest, current) => 
            new Date(current.scan_timestamp) > new Date(latest.scan_timestamp) ? current : latest
          );
          newTimestamps.cpu = latestCPU.scan_timestamp;
        }
      }

      // Process memory recent data
      if (memoryResult.status === 'fulfilled' && memoryResult.value?.success) {
        const memoryData = memoryResult.value.data?.memory || [];
        console.log('🔄 RECENT CHARTS: Processing', memoryData.length, 'recent memory records');
        
        if (memoryData.length > 0) {
          updateMemoryChartData(memoryData);
          
          // Find latest timestamp for this chart type
          const latestMemory = memoryData.reduce((latest, current) => 
            new Date(current.scan_timestamp) > new Date(latest.scan_timestamp) ? current : latest
          );
          newTimestamps.memory = latestMemory.scan_timestamp;
        }
      }

      // Update timestamps with any new data we received
      if (Object.keys(newTimestamps).length > 0) {
        setLastChartTimestamps(prev => ({ ...prev, ...newTimestamps }));
      }

      console.log('🔄 RECENT CHARTS: Completed loading recent data for all chart types');

    } catch (error) {
      console.error('🔄 RECENT CHARTS: Error loading recent chart data:', error);
    }
  }, [currentServer, makeZoneweaverAPIRequest, lastChartTimestamps, resolution, getStoragePoolIO, getStorageARC, updateNetworkChartData, updatePoolIOChartData, updateARCChartData, updateCPUChartData, updateCPUCoreChartData, updateMemoryChartData, loadHistoricalChartData]);


  const loadHostData = useCallback(async (server) => {
    if (!server || loading) return;
    
    try {
      setLoading(true);
      setError("");
      
      const now = new Date();
      const timeWindowMs = {
        '1min': 1 * 60 * 1000,
        '5min': 5 * 60 * 1000,
        '10min': 10 * 60 * 1000,
        '15min': 15 * 60 * 1000,
        '30min': 30 * 60 * 1000,
        '1hour': 60 * 60 * 1000,
        '3hour': 3 * 60 * 60 * 1000,
        '6hour': 6 * 60 * 60 * 1000,
        '12hour': 12 * 60 * 60 * 1000,
        '24hour': 24 * 60 * 60 * 1000
      };
      const sinceTime = new Date(now.getTime() - (timeWindowMs[timeWindow] || timeWindowMs['1hour']));
      
      const diskIOFilters = {
        limit: 2000,
        since: sinceTime.toISOString()
      };

      const results = await Promise.allSettled([
        makeZoneweaverAPIRequest(server.hostname, server.port, server.protocol, 'stats'), // 0
        getMonitoringHealth(server.hostname, server.port, server.protocol), // 1
        getMonitoringStatus(server.hostname, server.port, server.protocol), // 2
        makeZoneweaverAPIRequest(server.hostname, server.port, server.protocol, 'monitoring/network/interfaces'), // 3
        getStoragePools(server.hostname, server.port, server.protocol), // 4
        getStorageDatasets(server.hostname, server.port, server.protocol), // 5
        makeZoneweaverAPIRequest(server.hostname, server.port, server.protocol, 'tasks/stats'), // 6
        makeZoneweaverAPIRequest(server.hostname, server.port, server.protocol, 'system/swap/summary') // 7
      ]);

      const [
        statsResult, 
        healthResult, 
        statusResult, 
        networkResult, 
        poolsResult,
        datasetsResult, 
        taskResult,
        swapSummaryResult // This is now the 8th result (index 7)
      ] = results;


      if (statsResult.status === 'fulfilled' && statsResult.value.success) {
        setServerStats(statsResult.value.data);
      } else if (statsResult.status === 'fulfilled') {
        setError(`Failed to fetch stats: ${statsResult.value.message}`);
      }

      if (healthResult.status === 'fulfilled' && healthResult.value.success) {
        setMonitoringHealth(healthResult.value.data);
      } else {
        setMonitoringHealth({});
      }

      if (statusResult.status === 'fulfilled' && statusResult.value.success) {
        setMonitoringStatus(statusResult.value.data);
      } else {
        setMonitoringStatus({});
      }

      if (networkResult.status === 'fulfilled' && networkResult.value.success) {
        setNetworkInterfaces(networkResult.value.data?.interfaces || []);
      } else {
        setNetworkInterfaces([]);
      }

      let deduplicatedPools = [];
      let deduplicatedDatasets = [];

      if (poolsResult.status === 'fulfilled' && poolsResult.value.success) {
        const pools = poolsResult.value.data?.pools || poolsResult.value.data || [];
        deduplicatedPools = pools.reduce((acc, pool) => {
          const existing = acc.find(existing => (existing.name || existing.pool) === (pool.name || pool.pool));
          if (!existing) {
            acc.push(pool);
          } else {
            if (pool.scan_timestamp && existing.scan_timestamp && 
                new Date(pool.scan_timestamp) > new Date(existing.scan_timestamp)) {
              const index = acc.indexOf(existing);
              acc[index] = pool;
            }
          }
          return acc;
        }, []);
        deduplicatedPools.sort((a, b) => (a.name || a.pool).localeCompare(b.name || b.pool));
      }

      if (datasetsResult.status === 'fulfilled' && datasetsResult.value.success) {
        const datasets = datasetsResult.value.data?.datasets || datasetsResult.value.data || [];
        deduplicatedDatasets = datasets.reduce((acc, dataset) => {
          const existing = acc.find(existing => (existing.name || existing.dataset) === (dataset.name || dataset.dataset));
          if (!existing) {
            acc.push(dataset);
          } else {
            if (dataset.scan_timestamp && existing.scan_timestamp && 
                new Date(dataset.scan_timestamp) > new Date(existing.scan_timestamp)) {
              const index = acc.indexOf(existing);
              acc[index] = dataset;
            }
          }
          return acc;
        }, []);
        deduplicatedDatasets.sort((a, b) => (a.name || a.dataset).localeCompare(b.name || b.dataset));
      }
      
      setStorageSummary({
        pools: deduplicatedPools,
        datasets: deduplicatedDatasets
      });

      if (taskResult.status === 'fulfilled' && taskResult.value.success) {
        setTaskStats(taskResult.value.data || {});
      } else {
        setTaskStats({});
      }


      // Process swap summary data
      if (swapSummaryResult.status === 'fulfilled' && swapSummaryResult.value.success) {
        setSwapSummaryData(swapSummaryResult.value.data);
      } else {
        setSwapSummaryData({}); // Set to empty object on failure
        // Optionally, log an error or set a specific error state for swap
        console.error('Failed to fetch swap summary:', swapSummaryResult.value?.message || 'Unknown error');
      }

    } catch (error) {
      console.error('Error fetching host data:', error);
      setError(`Error connecting to ${server.hostname}`);
    } finally {
      setLoading(false);
    }
  }, [timeWindow, makeZoneweaverAPIRequest, getMonitoringHealth, getMonitoringStatus, getStoragePools, getStorageDatasets, getStoragePoolIO, getStorageARC, getNetworkUsage, getSystemCPU, getSystemMemory, updatePoolIOChartData, updateARCChartData, updateNetworkChartData, updateCPUChartData, updateCPUCoreChartData, updateMemoryChartData, loading]);

  // Load data when server changes - sequential loading pattern like networking page
  useEffect(() => {
    console.log('🔍 HOST: Server changed effect triggered', {
      currentServer: currentServer?.hostname,
      hasRequest: !!makeZoneweaverAPIRequest
    });
    
    if (currentServer && makeZoneweaverAPIRequest) {
      // Load historical chart data first to establish chart foundation
      loadHistoricalChartData();
      
      // Load main host data
      loadHostData(currentServer).then(() => {
        setInitialDataLoaded(true); // Mark initial data load as completed
        initialLoadDone.current = true; // Mark initial load as completed AFTER completion
        console.log('🔍 HOST: Initial data loading completed - preventing duplicate calls');
      });
    }
  }, [currentServer]);

  // Load historical chart data when time window or resolution changes (but not during initial load)
  // Also reset timestamps since we're changing the time window
  useEffect(() => {
    if (currentServer && makeZoneweaverAPIRequest && initialLoadDone.current) {
      console.log('📊 HISTORICAL CHARTS: Time window or resolution changed, loading historical data');
      // Reset timestamps when time window or resolution changes
      setLastChartTimestamps({
        poolIO: null,
        network: null,
        arc: null,
        cpu: null,
        memory: null
      });
      loadHistoricalChartData();
    } else if (!initialLoadDone.current) {
      console.log('📊 HISTORICAL CHARTS: Skipping settings change during initial load');
    }
  }, [timeWindow, resolution, loadHistoricalChartData]);

  // Combined refresh function for both auto-refresh and manual refresh
  const refreshAllData = useCallback(async (server = currentServer) => {
    if (!server) return;
    
    console.log('🔄 REFRESH: Starting combined refresh for host data and charts');
    
    // Run both in parallel
    await Promise.all([
      loadHostData(server),
      loadRecentChartData()
    ]);
    
    console.log('🔄 REFRESH: Completed combined refresh');
  }, [currentServer, loadHostData, loadRecentChartData]);

  // Auto-refresh effect - wait for initial data to load before starting
  useEffect(() => {
    if (!refreshInterval || refreshInterval === 0 || !currentServer || !initialDataLoaded) {
      if (!initialDataLoaded) {
        console.log('🔄 HOST: Auto-refresh waiting for initial data load to complete');
      }
      return;
    }

    console.log('🔄 HOST: Setting up auto-refresh every', refreshInterval, 'seconds');
    const interval = setInterval(() => {
      console.log('🔄 HOST: Auto-refreshing host data and charts...');
      refreshAllData(currentServer);
    }, refreshInterval * 1000);

    return () => {
      console.log('🔄 HOST: Cleaning up auto-refresh interval');
      clearInterval(interval);
    };
  }, [refreshInterval, currentServer, initialDataLoaded, refreshAllData]);

  return {
    serverStats,
    monitoringHealth,
    monitoringStatus,
    networkInterfaces,
    storageSummary,
    taskStats,
    diskIOStats,
    arcStats,
    networkUsage,
    cpuStats,
    cpuCoreStats,
    memoryStats,
    swapSummaryData, // Add swapSummaryData to the returned object
    loading,
    error,
    refreshInterval,
    setRefreshInterval,
    autoRefresh,
    setAutoRefresh,
    chartData,
    arcChartData,
    networkChartData,
    cpuChartData,
    memoryChartData,
    timeWindow,
    setTimeWindow,
    resolution,
    setResolution,
    maxDataPoints,
    setMaxDataPoints,
    loadHostData,
    refreshAllData  // Export the combined refresh function
  };
};
