import { useState, useEffect, useCallback } from 'react';
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
  const [refreshInterval, setRefreshInterval] = useState(60);

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
  const [maxDataPoints, setMaxDataPoints] = useState(180);

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
    poolIOData.forEach(poolIO => {
      const poolName = poolIO.pool;
      const timestamp = new Date(poolIO.scan_timestamp).getTime();
      
      const readBandwidth = poolIO.read_bandwidth_bytes || 0;
      const writeBandwidth = poolIO.write_bandwidth_bytes || 0;
      
      const readMBps = readBandwidth / (1024 * 1024);
      const writeMBps = writeBandwidth / (1024 * 1024);
      const totalMBps = readMBps + writeMBps;
      
      const readPoint = [timestamp, parseFloat(readMBps.toFixed(3))];
      const writePoint = [timestamp, parseFloat(writeMBps.toFixed(3))]; 
      const totalPoint = [timestamp, parseFloat(totalMBps.toFixed(3))];
      
      setChartData(prevData => {
        const newData = { ...prevData };
        
        if (!newData[poolName]) {
          newData[poolName] = {
            readData: [],
            writeData: [],
            totalData: []
          };
        }
        
        newData[poolName].readData.push(readPoint);
        newData[poolName].writeData.push(writePoint);
        newData[poolName].totalData.push(totalPoint);
        
        if (newData[poolName].readData.length > maxDataPoints) {
          newData[poolName].readData = newData[poolName].readData.slice(-maxDataPoints);
          newData[poolName].writeData = newData[poolName].writeData.slice(-maxDataPoints);
          newData[poolName].totalData = newData[poolName].totalData.slice(-maxDataPoints);
        }
        
        return newData;
      });
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
    networkUsageData.forEach(usage => {
      const bandwidth = calculateNetworkBandwidth(usage);
      const interfaceName = usage.link;
      const timestamp = new Date(usage.scan_timestamp).getTime();
      
      const rxPoint = [timestamp, parseFloat(bandwidth.rxMbps.toFixed(3))];
      const txPoint = [timestamp, parseFloat(bandwidth.txMbps.toFixed(3))]; 
      const totalPoint = [timestamp, parseFloat(bandwidth.totalMbps.toFixed(3))];
      
      setNetworkChartData(prevData => {
        const newData = { ...prevData };
        
        if (!newData[interfaceName]) {
          newData[interfaceName] = {
            rxData: [],
            txData: [],
            totalData: []
          };
        }
        
        newData[interfaceName].rxData.push(rxPoint);
        newData[interfaceName].txData.push(txPoint);
        newData[interfaceName].totalData.push(totalPoint);
        
        if (newData[interfaceName].rxData.length > maxDataPoints) {
          newData[interfaceName].rxData = newData[interfaceName].rxData.slice(-maxDataPoints);
          newData[interfaceName].txData = newData[interfaceName].txData.slice(-maxDataPoints);
          newData[interfaceName].totalData = newData[interfaceName].totalData.slice(-maxDataPoints);
        }
        
        return newData;
      });
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
    const used = [];
    const free = [];
    const cached = [];
    const total = [];

    memoryData.forEach(d => {
      const timestamp = new Date(d.scan_timestamp).getTime();
      used.push([timestamp, parseFloat((d.used_memory_bytes / (1024 ** 3)).toFixed(2))]);
      free.push([timestamp, parseFloat((d.free_memory_bytes / (1024 ** 3)).toFixed(2))]);
      cached.push([timestamp, parseFloat((d.cached_bytes / (1024 ** 3)).toFixed(2))]);
      total.push([timestamp, parseFloat((d.total_memory_bytes / (1024 ** 3)).toFixed(2))]);
    });

    setMemoryChartData({
      used: used.sort((a, b) => a[0] - b[0]),
      free: free.sort((a, b) => a[0] - b[0]),
      cached: cached.sort((a, b) => a[0] - b[0]),
      total: total.sort((a, b) => a[0] - b[0]),
    });
  }, []);

  const loadHistoricalPoolIOData = useCallback(async (server) => {
    if (!server) return;
    
    try {
      const config = getMaxDataPointsForWindow(timeWindow);
      const historicalResult = await makeZoneweaverAPIRequest(
        server.hostname,
        server.port,
        server.protocol,
        `monitoring/storage/pool-io?limit=${config.limit}`
      );

      if (historicalResult.success && historicalResult.data?.poolio) {
        const historicalPoolIO = historicalResult.data.poolio;
        const validHistoricalPoolIO = historicalPoolIO.filter(poolIO => 
          poolIO.pool && poolIO.scan_timestamp
        );
        
        const poolData = {};
        validHistoricalPoolIO.forEach(poolIO => {
          const poolName = poolIO.pool;
          if (!poolData[poolName]) {
            poolData[poolName] = [];
          }
          poolData[poolName].push(poolIO);
        });
        
        const historicalChartData = {};
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
        const cutoffTime = new Date(now.getTime() - (timeWindowMs[timeWindow] || timeWindowMs['1hour']));
        
        Object.entries(poolData).forEach(([poolName, poolIOArray]) => {
          poolIOArray.sort((a, b) => new Date(a.scan_timestamp) - new Date(b.scan_timestamp));
          const recentPoolIO = poolIOArray.filter(poolIO => 
            new Date(poolIO.scan_timestamp) >= cutoffTime
          );
          
          historicalChartData[poolName] = {
            readData: [],
            writeData: [],
            totalData: []
          };
          
          recentPoolIO.forEach(poolIO => {
            const timestamp = new Date(poolIO.scan_timestamp).getTime();
            const readBandwidth = poolIO.read_bandwidth_bytes || 0;
            const writeBandwidth = poolIO.write_bandwidth_bytes || 0;
            const readMBps = readBandwidth / (1024 * 1024);
            const writeMBps = writeBandwidth / (1024 * 1024);
            const totalMBps = readMBps + writeMBps;
            
            historicalChartData[poolName].readData.push([timestamp, parseFloat(readMBps.toFixed(3))]);
            historicalChartData[poolName].writeData.push([timestamp, parseFloat(writeMBps.toFixed(3))]);
            historicalChartData[poolName].totalData.push([timestamp, parseFloat(totalMBps.toFixed(3))]);
          });
        });
        
        setChartData(historicalChartData);
      }
    } catch (error) {
      console.error('Error loading historical pool I/O data:', error);
    }
  }, [timeWindow, makeZoneweaverAPIRequest]);

  const loadHistoricalNetworkData = useCallback(async (server) => {
    if (!server) return;
    
    try {
      const config = getMaxDataPointsForWindow(timeWindow);
      const [historicalResult, interfacesResult] = await Promise.allSettled([
        makeZoneweaverAPIRequest(
          server.hostname,
          server.port,
          server.protocol,
          `monitoring/network/usage?limit=${config.limit}`
        ),
        makeZoneweaverAPIRequest(
          server.hostname,
          server.port,
          server.protocol,
          'monitoring/network/interfaces'
        )
      ]);

      if (historicalResult.status === 'fulfilled' && historicalResult.value.success && historicalResult.value.data?.usage) {
        const historicalNetworkUsage = historicalResult.value.data.usage;
        const interfacesData = (interfacesResult.status === 'fulfilled' && interfacesResult.value.success) 
          ? interfacesResult.value.data?.interfaces || [] 
          : [];
        
        const validHistoricalUsage = historicalNetworkUsage.filter(usage => 
          usage.link && 
          usage.link !== 'LINK' && 
          usage.ipackets !== 'IPACKETS' &&
          usage.time_delta_seconds > 0
        );
        
        const realInterfacesOnlyHistorical = validHistoricalUsage.filter(usage => {
          const interfaceInfo = interfacesData.find(iface => iface.link === usage.link);
          return interfaceInfo && interfaceInfo.class === 'phys';
        });
        
        const interfaceData = {};
        realInterfacesOnlyHistorical.forEach(usage => {
          const interfaceName = usage.link;
          if (!interfaceData[interfaceName]) {
            interfaceData[interfaceName] = [];
          }
          interfaceData[interfaceName].push(usage);
        });
        
        const historicalNetworkChartData = {};
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
        const cutoffTime = new Date(now.getTime() - (timeWindowMs[timeWindow] || timeWindowMs['15min']));
        
        Object.entries(interfaceData).forEach(([interfaceName, usageArray]) => {
          usageArray.sort((a, b) => new Date(a.scan_timestamp) - new Date(b.scan_timestamp));
          const recentUsage = usageArray.filter(usage => 
            new Date(usage.scan_timestamp) >= cutoffTime
          );
          
          if (recentUsage.length > 0) {
            historicalNetworkChartData[interfaceName] = {
              rxData: [],
              txData: [],
              totalData: []
            };
            
            recentUsage.forEach(usage => {
              const bandwidth = calculateNetworkBandwidth(usage);
              const timestamp = new Date(usage.scan_timestamp).getTime();
              
              historicalNetworkChartData[interfaceName].rxData.push([timestamp, parseFloat(bandwidth.rxMbps.toFixed(3))]);
              historicalNetworkChartData[interfaceName].txData.push([timestamp, parseFloat(bandwidth.txMbps.toFixed(3))]);
              historicalNetworkChartData[interfaceName].totalData.push([timestamp, parseFloat(bandwidth.totalMbps.toFixed(3))]);
            });
          }
        });
        
        setNetworkChartData(historicalNetworkChartData);
      }
    } catch (error) {
      console.error('Error loading historical network data:', error);
    }
  }, [timeWindow, makeZoneweaverAPIRequest]);

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
        getStoragePoolIO(server.hostname, server.port, server.protocol, diskIOFilters), // 7
        getStorageARC(server.hostname, server.port, server.protocol, diskIOFilters), // 8
        getNetworkUsage(server.hostname, server.port, server.protocol), // 9
        getSystemCPU(server.hostname, server.port, server.protocol, { since: sinceTime.toISOString(), include_cores: true }), // 10
        getSystemMemory(server.hostname, server.port, server.protocol, { since: sinceTime.toISOString() }), // 11
        makeZoneweaverAPIRequest(server.hostname, server.port, server.protocol, 'system/swap/summary') // 12
      ]);

      const [
        statsResult, 
        healthResult, 
        statusResult, 
        networkResult, 
        poolsResult,
        datasetsResult, 
        taskResult,
        poolIOResult,
        arcResult,
        networkUsageResult,
        cpuResult,
        memoryResult, // This is actually the 12th result (index 11)
        swapSummaryResult // This is the 13th result (index 12)
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

      if (poolIOResult.status === 'fulfilled' && poolIOResult.value.success) {
        const poolIOData = poolIOResult.value.data?.poolio || [];
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
        updatePoolIOChartData(deduplicatedPoolIO);
      } else {
        setDiskIOStats([]);
      }

      if (arcResult.status === 'fulfilled' && arcResult.value.success) {
        const arcData = arcResult.value.data?.arc || [];
        const deduplicatedARC = arcData.reduce((acc, arc) => {
          const existing = acc.find(existing => existing.scan_timestamp === arc.scan_timestamp);
          if (!existing) {
            acc.push({...arc});
          }
          return acc;
        }, []);
        deduplicatedARC.sort((a, b) => new Date(a.scan_timestamp) - new Date(b.scan_timestamp));
        setArcStats(deduplicatedARC);
        updateARCChartData(deduplicatedARC);
      } else {
        setArcStats([]);
      }

      if (networkUsageResult.status === 'fulfilled' && networkUsageResult.value.success) {
        const networkData = networkUsageResult.value.data?.usage || [];
        const interfacesData = (networkResult.status === 'fulfilled' && networkResult.value.success) 
          ? networkResult.value.data?.interfaces || [] 
          : [];
        const validNetworkUsage = networkData.filter(usage => 
          usage.link && 
          usage.link !== 'LINK' && 
          usage.ipackets !== 'IPACKETS' &&
          usage.time_delta_seconds > 0
        );
        const realInterfacesOnly = validNetworkUsage.filter(usage => {
          const interfaceInfo = interfacesData.find(iface => iface.link === usage.link);
          return interfaceInfo && interfaceInfo.class === 'phys';
        });
        const deduplicatedNetworkUsage = realInterfacesOnly.reduce((acc, usage) => {
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
        deduplicatedNetworkUsage.sort((a, b) => {
          const aBandwidth = calculateNetworkBandwidth(a);
          const bBandwidth = calculateNetworkBandwidth(b);
          return bBandwidth.totalMbps - aBandwidth.totalMbps;
        });
        setNetworkUsage(deduplicatedNetworkUsage);
        updateNetworkChartData(deduplicatedNetworkUsage);
      } else {
        setNetworkUsage([]);
      }

      if (cpuResult.status === 'fulfilled' && cpuResult.value.success) {
        const cpuData = cpuResult.value.data?.cpu || [];
        setCpuStats(cpuData);
        updateCPUChartData(cpuData);
        updateCPUCoreChartData(cpuData);
      } else {
        setCpuStats([]);
      }

      if (memoryResult.status === 'fulfilled' && memoryResult.value.success) {
        const memoryData = memoryResult.value.data?.memory || [];
        setMemoryStats(memoryData);
        updateMemoryChartData(memoryData);
      } else {
        setMemoryStats([]);
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
  }, [timeWindow, makeZoneweaverAPIRequest, getMonitoringHealth, getMonitoringStatus, getStoragePools, getStorageDatasets, getStoragePoolIO, getStorageARC, getNetworkUsage, getSystemCPU, getSystemMemory, updatePoolIOChartData, updateARCChartData, updateNetworkChartData, updateCPUChartData, updateCPUCoreChartData, updateMemoryChartData]);

  useEffect(() => {
    if (currentServer) {
      loadHistoricalPoolIOData(currentServer);
      loadHistoricalNetworkData(currentServer);
      loadHostData(currentServer);
    }
  }, [currentServer, loadHostData, loadHistoricalPoolIOData, loadHistoricalNetworkData]);

  useEffect(() => {
    if (refreshInterval === 0 || !currentServer) return;

    const interval = setInterval(() => {
      loadHostData(currentServer);
    }, refreshInterval * 1000);

    return () => clearInterval(interval);
  }, [refreshInterval, currentServer, loadHostData]);

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
    chartData,
    arcChartData,
    networkChartData,
    cpuChartData,
    memoryChartData,
    timeWindow,
    setTimeWindow,
    maxDataPoints,
    setMaxDataPoints,
    loadHostData
  };
};
