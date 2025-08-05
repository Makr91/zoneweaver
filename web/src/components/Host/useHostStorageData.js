import { useState, useEffect, useRef } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useServers } from "../../contexts/ServerContext";

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
    const [refreshInterval, setRefreshInterval] = useState(60); // seconds

    // Collapsible section states
    const [sectionsCollapsed, setSectionsCollapsed] = useState({
        summary: false,
        pools: false,
        datasets: false,
        disks: false,
        diskIO: false,
        poolIO: false,
        arcStats: false,
        charts: false
    });

    // Multi-column sorting states
    const [poolSort, setPoolSort] = useState([{ column: 'pool', direction: 'asc' }]);
    const [datasetSort, setDatasetSort] = useState([{ column: 'name', direction: 'asc' }]);
    const [diskSort, setDiskSort] = useState([{ column: 'device_name', direction: 'asc' }]);
    const [diskIOSort, setDiskIOSort] = useState([{ column: 'totalMbps', direction: 'desc' }]);

    // Chart-related states
    const [chartData, setChartData] = useState({});
    const [poolChartData, setPoolChartData] = useState({});
    const [arcChartData, setArcChartData] = useState({});
    const [timeWindow, setTimeWindow] = useState('15min');
    const [maxDataPoints, setMaxDataPoints] = useState(720);
    const chartRefs = useRef({});
    const poolChartRefs = useRef({});
    const summaryChartRefs = useRef({});
    const arcChartRef = useRef(null);
    const [expandedChart, setExpandedChart] = useState(null);
    const [expandedChartType, setExpandedChartType] = useState(null);

    // Chart sorting state
    const [chartSortBy, setChartSortBy] = useState('bandwidth'); // 'bandwidth', 'name', 'read', 'write'

    // Global series visibility controls
    const [seriesVisibility, setSeriesVisibility] = useState({
        read: true,
        write: true,
        total: true
    });

    const { user } = useAuth();
    const {
        getServers,
        servers,
        currentServer,
        getStoragePools,
        getStorageDatasets,
        getStorageDisks,
        getStoragePoolIO,
        getStorageDiskIO,
        getStorageARC,
        makeWebHyveRequest
    } = useServers();

    useEffect(() => {
        const serverList = getServers();
        if (serverList.length > 0) {
            const server = currentServer || serverList[0];
            setSelectedServer(server);
            // Load historical data first to initialize charts, then current data
            loadHistoricalDiskIOData(server);
            loadStorageData(server);
            loadDiskIOStats(server);
            loadPoolIOStats(server);
            loadArcStats(server);
        }
    }, [servers, currentServer]);

    // Auto-refresh effect
    useEffect(() => {
        if (!autoRefresh || !selectedServer) return;

        const interval = setInterval(() => {
            loadStorageData(selectedServer);
            loadDiskIOStats(selectedServer);
            loadPoolIOStats(selectedServer);
            loadArcStats(selectedServer);
        }, refreshInterval * 1000);

        return () => clearInterval(interval);
    }, [autoRefresh, refreshInterval, selectedServer]);

    const loadStorageData = async (server) => {
        if (!server || loading) return;

        try {
            setLoading(true);
            setError("");

            // Load all storage monitoring data
            const [poolsResult, datasetsResult, disksResult] = await Promise.allSettled([
                getStoragePools(server.hostname, server.port, server.protocol),
                getStorageDatasets(server.hostname, server.port, server.protocol),
                getStorageDisks(server.hostname, server.port, server.protocol)
            ]);

            // Handle pools with deduplication
            if (poolsResult.status === 'fulfilled' && poolsResult.value.success) {
                const pools = poolsResult.value.data?.pools || poolsResult.value.data || [];
                const deduplicatedPools = pools.reduce((acc, pool) => {
                    const existing = acc.find(existing => (existing.name || existing.pool) === (pool.name || pool.pool));
                    if (!existing) {
                        acc.push(pool);
                    } else {
                        // Keep the one with the most recent scan_timestamp
                        if (pool.scan_timestamp && existing.scan_timestamp &&
                            new Date(pool.scan_timestamp) > new Date(existing.scan_timestamp)) {
                            const index = acc.indexOf(existing);
                            acc[index] = pool;
                        }
                    }
                    return acc;
                }, []);
                deduplicatedPools.sort((a, b) => (a.name || a.pool).localeCompare(b.name || b.pool));
                setStoragePools(deduplicatedPools);
            }

            // Handle datasets with deduplication
            if (datasetsResult.status === 'fulfilled' && datasetsResult.value.success) {
                const datasets = datasetsResult.value.data?.datasets || datasetsResult.value.data || [];
                const deduplicatedDatasets = datasets.reduce((acc, dataset) => {
                    const existing = acc.find(existing => (existing.name || existing.dataset) === (dataset.name || dataset.dataset));
                    if (!existing) {
                        acc.push(dataset);
                    } else {
                        // Keep the one with the most recent scan_timestamp
                        if (dataset.scan_timestamp && existing.scan_timestamp &&
                            new Date(dataset.scan_timestamp) > new Date(existing.scan_timestamp)) {
                            const index = acc.indexOf(existing);
                            acc[index] = dataset;
                        }
                    }
                    return acc;
                }, []);
                deduplicatedDatasets.sort((a, b) => (a.name || a.dataset).localeCompare(b.name || b.dataset));
                setStorageDatasets(deduplicatedDatasets);
            }

            // Handle disks with deduplication
            if (disksResult.status === 'fulfilled' && disksResult.value.success) {
                const disks = disksResult.value.data?.disks || disksResult.value.data || [];
                const deduplicatedDisks = disks.reduce((acc, disk) => {
                    // Use device_name and serial_number for proper deduplication based on actual API response
                    const diskId = disk.device_name || disk.serial_number || disk.device || disk.name;
                    const existing = acc.find(existing =>
                        (existing.device_name === disk.device_name && disk.device_name) ||
                        (existing.serial_number === disk.serial_number && disk.serial_number) ||
                        (existing.device === disk.device && disk.device) ||
                        (existing.name === disk.name && disk.name)
                    );

                    if (!existing) {
                        acc.push(disk);
                    } else {
                        // Keep the one with the most recent scan_timestamp
                        if (disk.scan_timestamp && existing.scan_timestamp &&
                            new Date(disk.scan_timestamp) > new Date(existing.scan_timestamp)) {
                            const index = acc.indexOf(existing);
                            acc[index] = disk;
                        }
                    }
                    return acc;
                }, []);
                deduplicatedDisks.sort((a, b) => {
                    const aName = a.device_name || a.device || a.name || '';
                    const bName = b.device_name || b.device || b.name || '';
                    return aName.localeCompare(bName);
                });
                setStorageDisks(deduplicatedDisks);
            }

        } catch (error) {
            console.error('Error loading storage data:', error);
            setError('Error loading storage monitoring data');
        } finally {
            setLoading(false);
        }
    };

    const handleServerChange = (event) => {
        const serverKey = event.target.value;
        const serverList = getServers();
        const server = serverList.find(s => `${s.hostname}:${s.port}` === serverKey);
        if (server) {
            setSelectedServer(server);
            loadStorageData(server);
        }
    };

    // Multi-column sorting helper functions
    const handlePoolSort = (column, event) => {
        setPoolSort(prevSort => {
            const existingIndex = prevSort.findIndex(sort => sort.column === column);

            // If Ctrl/Cmd is held down, add to existing sort. Otherwise, start fresh
            if (!event?.ctrlKey && !event?.metaKey) {
                // Single column sort (default behavior)
                if (existingIndex >= 0) {
                    const currentSort = prevSort[existingIndex];
                    if (currentSort.direction === 'asc') {
                        return [{ column, direction: 'desc' }];
                    } else {
                        return [{ column: 'pool', direction: 'asc' }]; // Reset to default
                    }
                } else {
                    return [{ column, direction: 'asc' }];
                }
            } else {
                // Multi-column sort (Ctrl/Cmd held)
                if (existingIndex >= 0) {
                    const newSort = [...prevSort];
                    if (newSort[existingIndex].direction === 'asc') {
                        newSort[existingIndex].direction = 'desc';
                    } else {
                        newSort.splice(existingIndex, 1); // Remove column from sort
                    }
                    return newSort.length > 0 ? newSort : [{ column: 'pool', direction: 'asc' }];
                } else {
                    return [...prevSort, { column, direction: 'asc' }];
                }
            }
        });
    };

    const handleDatasetSort = (column, event) => {
        setDatasetSort(prevSort => {
            const existingIndex = prevSort.findIndex(sort => sort.column === column);

            if (!event?.ctrlKey && !event?.metaKey) {
                if (existingIndex >= 0) {
                    const currentSort = prevSort[existingIndex];
                    if (currentSort.direction === 'asc') {
                        return [{ column, direction: 'desc' }];
                    } else {
                        return [{ column: 'name', direction: 'asc' }];
                    }
                } else {
                    return [{ column, direction: 'asc' }];
                }
            } else {
                if (existingIndex >= 0) {
                    const newSort = [...prevSort];
                    if (newSort[existingIndex].direction === 'asc') {
                        newSort[existingIndex].direction = 'desc';
                    } else {
                        newSort.splice(existingIndex, 1);
                    }
                    return newSort.length > 0 ? newSort : [{ column: 'name', direction: 'asc' }];
                } else {
                    return [...prevSort, { column, direction: 'asc' }];
                }
            }
        });
    };

    const handleDiskSort = (column, event) => {
        setDiskSort(prevSort => {
            const existingIndex = prevSort.findIndex(sort => sort.column === column);

            if (!event?.ctrlKey && !event?.metaKey) {
                if (existingIndex >= 0) {
                    const currentSort = prevSort[existingIndex];
                    if (currentSort.direction === 'asc') {
                        return [{ column, direction: 'desc' }];
                    } else {
                        return [{ column: 'device_name', direction: 'asc' }];
                    }
                } else {
                    return [{ column, direction: 'asc' }];
                }
            } else {
                if (existingIndex >= 0) {
                    const newSort = [...prevSort];
                    if (newSort[existingIndex].direction === 'asc') {
                        newSort[existingIndex].direction = 'desc';
                    } else {
                        newSort.splice(existingIndex, 1);
                    }
                    return newSort.length > 0 ? newSort : [{ column: 'device_name', direction: 'asc' }];
                } else {
                    return [...prevSort, { column, direction: 'asc' }];
                }
            }
        });
    };

    const handleDiskIOSort = (column, event) => {
        setDiskIOSort(prevSort => {
            const existingIndex = prevSort.findIndex(sort => sort.column === column);

            if (!event?.ctrlKey && !event?.metaKey) {
                if (existingIndex >= 0) {
                    const currentSort = prevSort[existingIndex];
                    if (currentSort.direction === 'asc') {
                        return [{ column, direction: 'desc' }];
                    } else {
                        return [{ column: 'totalMbps', direction: 'desc' }];
                    }
                } else {
                    return [{ column, direction: 'asc' }];
                }
            } else {
                if (existingIndex >= 0) {
                    const newSort = [...prevSort];
                    if (newSort[existingIndex].direction === 'asc') {
                        newSort[existingIndex].direction = 'desc';
                    } else {
                        newSort.splice(existingIndex, 1);
                    }
                    return newSort.length > 0 ? newSort : [{ column: 'totalMbps', direction: 'desc' }];
                } else {
                    return [...prevSort, { column, direction: 'asc' }];
                }
            }
        });
    };

    // Reset sorting functions
    const resetPoolSort = () => {
        setPoolSort([{ column: 'pool', direction: 'asc' }]);
    };

    const resetDatasetSort = () => {
        setDatasetSort([{ column: 'name', direction: 'asc' }]);
    };

    const resetDiskSort = () => {
        setDiskSort([{ column: 'device_name', direction: 'asc' }]);
    };

    const resetDiskIOSort = () => {
        setDiskIOSort([{ column: 'totalMbps', direction: 'desc' }]);
    };

    // Multi-column sort data functions
    const getSortedPools = () => {
        return [...storagePools].sort((a, b) => {
            for (const sort of poolSort) {
                const { column, direction } = sort;
                let aVal = a[column];
                let bVal = b[column];

                if (column === 'health' || column === 'status') {
                    aVal = aVal?.toLowerCase() || '';
                    bVal = bVal?.toLowerCase() || '';
                } else if (typeof aVal === 'string') {
                    aVal = aVal.toLowerCase();
                    bVal = bVal ? bVal.toLowerCase() : '';
                }

                if (aVal < bVal) return direction === 'asc' ? -1 : 1;
                if (aVal > bVal) return direction === 'asc' ? 1 : -1;
            }
            return 0;
        });
    };

    const getSortedDatasets = () => {
        return [...storageDatasets].sort((a, b) => {
            for (const sort of datasetSort) {
                const { column, direction } = sort;
                let aVal = a[column];
                let bVal = b[column];

                if (column === 'used' || column === 'available' || column === 'referenced') {
                    aVal = parseSize(aVal) || 0;
                    bVal = parseSize(bVal) || 0;
                } else if (typeof aVal === 'string') {
                    aVal = aVal.toLowerCase();
                    bVal = bVal ? bVal.toLowerCase() : '';
                }

                if (aVal < bVal) return direction === 'asc' ? -1 : 1;
                if (aVal > bVal) return direction === 'asc' ? 1 : -1;
            }
            return 0;
        });
    };

    const getSortedDisks = () => {
        return [...storageDisks].sort((a, b) => {
            for (const sort of diskSort) {
                const { column, direction } = sort;
                let aVal = a[column];
                let bVal = b[column];

                if (column === 'capacity_bytes' || column === 'size' || column === 'capacity') {
                    aVal = parseFloat(aVal) || 0;
                    bVal = parseFloat(bVal) || 0;
                } else if (column === 'temperature') {
                    aVal = parseFloat(aVal) || 0;
                    bVal = parseFloat(bVal) || 0;
                } else if (typeof aVal === 'string') {
                    aVal = aVal.toLowerCase();
                    bVal = bVal ? bVal.toLowerCase() : '';
                }

                if (aVal < bVal) return direction === 'asc' ? -1 : 1;
                if (aVal > bVal) return direction === 'asc' ? 1 : -1;
            }
            return 0;
        });
    };

    const getSortedDiskIOStats = () => {
        return [...diskIOStats].sort((a, b) => {
            for (const sort of diskIOSort) {
                const { column, direction } = sort;
                let aVal, bVal;

                if (column === 'totalMbps' || column === 'readMbps' || column === 'writeMbps') {
                    const readMBpsA = (a.read_bandwidth_bytes || 0) / (1024 * 1024);
                    const writeMBpsA = (a.write_bandwidth_bytes || 0) / (1024 * 1024);
                    const readMBpsB = (b.read_bandwidth_bytes || 0) / (1024 * 1024);
                    const writeMBpsB = (b.write_bandwidth_bytes || 0) / (1024 * 1024);

                    if (column === 'totalMbps') {
                        aVal = readMBpsA + writeMBpsA;
                        bVal = readMBpsB + writeMBpsB;
                    } else if (column === 'readMbps') {
                        aVal = readMBpsA;
                        bVal = readMBpsB;
                    } else if (column === 'writeMbps') {
                        aVal = writeMBpsA;
                        bVal = writeMBpsB;
                    }
                } else if (column === 'device_name') {
                    aVal = a.device_name?.toLowerCase() || '';
                    bVal = b.device_name?.toLowerCase() || '';
                } else if (column === 'read_ops' || column === 'write_ops') {
                    aVal = parseInt(a[column]) || 0;
                    bVal = parseInt(b[column]) || 0;
                } else {
                    aVal = a[column] || '';
                    bVal = b[column] || '';
                }

                if (aVal < bVal) return direction === 'asc' ? -1 : 1;
                if (aVal > bVal) return direction === 'asc' ? 1 : -1;
            }
            return 0;
        });
    };

    // Get sort icon
    const getSortIcon = (currentSortArray, column) => {
        const sortIndex = currentSortArray.findIndex(sort => sort.column === column);
        if (sortIndex === -1) return 'fa-sort';

        const sort = currentSortArray[sortIndex];
        const baseIcon = sort.direction === 'asc' ? 'fa-sort-up' : 'fa-sort-down';

        return baseIcon + (currentSortArray.length > 1 ? ` ${sortIndex + 1}` : '');
    };

    // Chart sorting function
    const getSortedChartEntries = () => {
        return Object.entries(chartData)
            .filter(([deviceName, data]) => data.totalData.length > 0)
            .sort(([deviceNameA, dataA], [deviceNameB, dataB]) => {
                switch (chartSortBy) {
                    case 'name':
                        return deviceNameA.localeCompare(deviceNameB);

                    case 'bandwidth': {
                        const aAvg = dataA.totalData.slice(-5).reduce((sum, point) => sum + (point[1] || 0), 0) / Math.min(5, dataA.totalData.length);
                        const bAvg = dataB.totalData.slice(-5).reduce((sum, point) => sum + (point[1] || 0), 0) / Math.min(5, dataB.totalData.length);
                        return bAvg - aAvg; // Descending order (highest first)
                    }

                    case 'read': {
                        const aAvg = dataA.readData.slice(-5).reduce((sum, point) => sum + (point[1] || 0), 0) / Math.min(5, dataA.readData.length);
                        const bAvg = dataB.readData.slice(-5).reduce((sum, point) => sum + (point[1] || 0), 0) / Math.min(5, dataB.readData.length);
                        return bAvg - aAvg; // Descending order (highest first)
                    }

                    case 'write': {
                        const aAvg = dataA.writeData.slice(-5).reduce((sum, point) => sum + (point[1] || 0), 0) / Math.min(5, dataA.writeData.length);
                        const bAvg = dataB.writeData.slice(-5).reduce((sum, point) => sum + (point[1] || 0), 0) / Math.min(5, dataB.writeData.length);
                        return bAvg - aAvg; // Descending order (highest first)
                    }

                    default:
                        return deviceNameA.localeCompare(deviceNameB);
                }
            });
    };

    // Time window configuration
    const getMaxDataPointsForWindow = (window) => {
        const windowConfig = {
            '1min': { points: 12, since: '1minute', limit: 500 },
            '5min': { points: 60, since: '5minutes', limit: 2000 },
            '10min': { points: 120, since: '10minutes', limit: 4000 },
            '15min': { points: 180, since: '15minutes', limit: 6000 },
            '30min': { points: 360, since: '30minutes', limit: 12000 },
            '1hour': { points: 720, since: '1hour', limit: 25000 },
            '3hour': { points: 2160, since: '3hours', limit: 70000 },
            '6hour': { points: 4320, since: '6hours', limit: 140000 },
            '12hour': { points: 8640, since: '12hours', limit: 280000 },
            '24hour': { points: 17280, since: '24hours', limit: 500000 }
        };
        return windowConfig[window] || windowConfig['1hour'];
    };

    // Update maxDataPoints when timeWindow changes
    useEffect(() => {
        const config = getMaxDataPointsForWindow(timeWindow);
        setMaxDataPoints(config.points);

        // Reload historical data with new time window
        if (selectedServer) {
            loadHistoricalDiskIOData(selectedServer);
        }
    }, [timeWindow, selectedServer]);

    // Toggle section collapse
    const toggleSection = (section) => {
        setSectionsCollapsed(prev => ({
            ...prev,
            [section]: !prev[section]
        }));
    };

    // Parse size strings like "176G", "1.72T" etc to bytes
    const parseSize = (sizeStr) => {
        if (!sizeStr || sizeStr === '-' || sizeStr === 'none' || sizeStr === 'N/A') {
            return 0;
        }

        if (typeof sizeStr === 'number') {
            return isNaN(sizeStr) ? 0 : Math.floor(sizeStr);
        }

        const cleanStr = String(sizeStr).trim();
        if (!cleanStr) return 0;

        const match = cleanStr.match(/^([0-9.]+)\s*([KMGTPEZB]?)/i);
        if (!match) return 0;

        const value = parseFloat(match[1]);
        if (isNaN(value)) return 0;

        const unit = (match[2] || '').toUpperCase();

        const multipliers = {
            '': 1,
            'B': 1,
            'K': 1024,
            'M': 1024 * 1024,
            'G': 1024 * 1024 * 1024,
            'T': 1024 * 1024 * 1024 * 1024,
            'P': 1024 * 1024 * 1024 * 1024 * 1024,
            'E': 1024 * 1024 * 1024 * 1024 * 1024 * 1024,
            'Z': 1024 * 1024 * 1024 * 1024 * 1024 * 1024 * 1024
        };

        const multiplier = multipliers[unit] || 1;
        const result = value * multiplier;

        return isNaN(result) || result < 0 ? 0 : Math.floor(result);
    };

    // Load disk I/O statistics
    const loadDiskIOStats = async (server) => {
        if (!server || loading) return;

        try {
            const config = getMaxDataPointsForWindow(timeWindow);
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

            const filters = {
                limit: config.limit,
                since: sinceTime.toISOString()
            };

            const result = await getStorageDiskIO(server.hostname, server.port, server.protocol, filters);

            if (result.success && result.data?.diskio) {
                const diskIOData = result.data.diskio;

                const deduplicatedDiskIO = diskIOData.reduce((acc, io) => {
                    const existing = acc.find(existing => existing.device_name === io.device_name);
                    if (!existing) {
                        acc.push({ ...io });
                    } else {
                        if (new Date(io.scan_timestamp) > new Date(existing.scan_timestamp)) {
                            const index = acc.indexOf(existing);
                            acc[index] = { ...io };
                        }
                    }
                    return acc;
                }, []);

                deduplicatedDiskIO.sort((a, b) => a.device_name.localeCompare(b.device_name));
                setDiskIOStats([...deduplicatedDiskIO]);
                updateDiskIOChartData(deduplicatedDiskIO);
            } else {
                setDiskIOStats([]);
            }
        } catch (error) {
            console.error('Error loading disk I/O statistics:', error);
            setDiskIOStats([]);
        }
    };

    // Load Pool I/O statistics
    const loadPoolIOStats = async (server) => {
        if (!server || loading) return;

        try {
            const config = getMaxDataPointsForWindow(timeWindow);
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
            const sinceISO = sinceTime.toISOString();

            const historicalResult = await makeWebHyveRequest(
                server.hostname,
                server.port,
                server.protocol,
                `monitoring/storage/pool-io?limit=${config.limit}&since=${encodeURIComponent(sinceISO)}`
            );

            if (historicalResult.success && historicalResult.data?.poolio) {
                const historicalPoolIO = historicalResult.data.poolio;
                const validHistoricalPoolIO = historicalPoolIO.filter(io =>
                    io.pool && io.scan_timestamp
                );

                const poolData = {};
                validHistoricalPoolIO.forEach(io => {
                    const poolName = io.pool;
                    if (!poolData[poolName]) {
                        poolData[poolName] = [];
                    }
                    poolData[poolName].push(io);
                });

                const historicalPoolChartData = {};

                Object.entries(poolData).forEach(([poolName, ioArray]) => {
                    ioArray.sort((a, b) => new Date(a.scan_timestamp) - new Date(b.scan_timestamp));
                    const recentIO = ioArray.filter(io =>
                        new Date(io.scan_timestamp) >= sinceTime
                    );

                    historicalPoolChartData[poolName] = {
                        readData: [],
                        writeData: [],
                        totalData: []
                    };

                    recentIO.forEach(io => {
                        const timestamp = new Date(io.scan_timestamp).getTime();
                        const readBandwidth = parseFloat(io.read_bandwidth_bytes) || 0;
                        const writeBandwidth = parseFloat(io.write_bandwidth_bytes) || 0;
                        const readMBps = readBandwidth / (1024 * 1024);
                        const writeMBps = writeBandwidth / (1024 * 1024);
                        const totalMBps = readMBps + writeMBps;

                        historicalPoolChartData[poolName].readData.push([timestamp, parseFloat(readMBps.toFixed(3))]);
                        historicalPoolChartData[poolName].writeData.push([timestamp, parseFloat(writeMBps.toFixed(3))]);
                        historicalPoolChartData[poolName].totalData.push([timestamp, parseFloat(totalMBps.toFixed(3))]);
                    });

                    const allSeries = ['readData', 'writeData', 'totalData'];
                    allSeries.forEach(series => {
                        if (historicalPoolChartData[poolName][series].length > maxDataPoints) {
                            historicalPoolChartData[poolName][series] = historicalPoolChartData[poolName][series].slice(-maxDataPoints);
                        }
                    });
                });

                setPoolChartData(historicalPoolChartData);

                const latestPoolIOStats = Object.entries(poolData).map(([poolName, ioArray]) => {
                    return ioArray.sort((a, b) => new Date(b.scan_timestamp) - new Date(a.scan_timestamp))[0];
                }).filter(Boolean);

                latestPoolIOStats.sort((a, b) => a.pool.localeCompare(b.pool));
                setPoolIOStats(latestPoolIOStats);
            } else {
                setPoolIOStats([]);
                setPoolChartData({});
            }
        } catch (error) {
            console.error('Error loading pool I/O statistics:', error);
            setPoolIOStats([]);
            setPoolChartData({});
        }
    };

    // Load ARC statistics
    const loadArcStats = async (server) => {
        if (!server || loading) return;

        try {
            const config = getMaxDataPointsForWindow(timeWindow);
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

            const filters = {
                limit: config.limit,
                since: sinceTime.toISOString()
            };

            const result = await getStorageARC(server.hostname, server.port, server.protocol, filters);

            if (result.success && result.data?.arc) {
                const arcData = result.data.arc;
                arcData.sort((a, b) => new Date(b.scan_timestamp) - new Date(a.scan_timestamp));
                setArcStats(arcData);
                updateArcChartData(arcData);
            } else {
                setArcStats([]);
            }
        } catch (error) {
            console.error('Error loading ARC statistics:', error);
            setArcStats([]);
        }
    };

    // Update disk I/O chart data
    const updateDiskIOChartData = (diskIOData) => {
        diskIOData.forEach(io => {
            const deviceName = io.device_name;
            const timestamp = new Date(io.scan_timestamp).getTime();
            const readBandwidth = io.read_bandwidth_bytes || 0;
            const writeBandwidth = io.write_bandwidth_bytes || 0;
            const readMBps = readBandwidth / (1024 * 1024);
            const writeMBps = writeBandwidth / (1024 * 1024);
            const totalMBps = readMBps + writeMBps;
            const readPoint = [timestamp, parseFloat(readMBps.toFixed(3))];
            const writePoint = [timestamp, parseFloat(writeMBps.toFixed(3))];
            const totalPoint = [timestamp, parseFloat(totalMBps.toFixed(3))];

            const chart = chartRefs.current[deviceName];
            if (chart && chart.chart) {
                const chartObj = chart.chart;
                const shift = chartObj.series[0].data.length > maxDataPoints;

                try {
                    if (chartObj.series[0]) chartObj.series[0].addPoint(readPoint, false, shift);
                    if (chartObj.series[1]) chartObj.series[1].addPoint(writePoint, false, shift);
                    if (chartObj.series[2]) chartObj.series[2].addPoint(totalPoint, false, shift);
                    chartObj.redraw();
                } catch (error) {
                    console.warn(`Error updating individual chart for ${deviceName}:`, error);
                }
            }

            ['read', 'write', 'total'].forEach((type, typeIndex) => {
                const summaryChart = summaryChartRefs.current[`summary-${type}`];
                if (summaryChart && summaryChart.chart) {
                    const chart = summaryChart.chart;
                    try {
                        const deviceSeries = chart.series.find(series => series.name === deviceName);
                        if (deviceSeries) {
                            const shift = deviceSeries.data.length > maxDataPoints;
                            const point = type === 'read' ? readPoint : type === 'write' ? writePoint : totalPoint;
                            deviceSeries.addPoint(point, false, shift);
                        }
                    } catch (error) {
                        console.warn(`Error updating summary ${type} chart for ${deviceName}:`, error);
                    }
                }
            });

            setChartData(prevData => {
                const newData = { ...prevData };
                if (!newData[deviceName]) {
                    newData[deviceName] = {
                        readData: [],
                        writeData: [],
                        totalData: []
                    };
                }
                newData[deviceName].readData.push(readPoint);
                newData[deviceName].writeData.push(writePoint);
                newData[deviceName].totalData.push(totalPoint);
                if (newData[deviceName].readData.length > maxDataPoints) {
                    newData[deviceName].readData = newData[deviceName].readData.slice(-maxDataPoints);
                    newData[deviceName].writeData = newData[deviceName].writeData.slice(-maxDataPoints);
                    newData[deviceName].totalData = newData[deviceName].totalData.slice(-maxDataPoints);
                }
                return newData;
            });
        });

        setTimeout(() => {
            ['read', 'write', 'total'].forEach(type => {
                const summaryChart = summaryChartRefs.current[`summary-${type}`];
                if (summaryChart && summaryChart.chart) {
                    try {
                        summaryChart.chart.redraw();
                    } catch (error) {
                        console.warn(`Error redrawing summary ${type} chart:`, error);
                    }
                }
            });
        }, 0);
    };

    // Update pool I/O chart data
    const updatePoolIOChartData = (poolIOData) => {
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

            const chart = poolChartRefs.current[poolName];
            if (chart && chart.chart) {
                const chartObj = chart.chart;
                const shift = chartObj.series[0].data.length > maxDataPoints;
                try {
                    if (chartObj.series[0]) chartObj.series[0].addPoint(readPoint, false, shift);
                    if (chartObj.series[1]) chartObj.series[1].addPoint(writePoint, false, shift);
                    if (chartObj.series[2]) chartObj.series[2].addPoint(totalPoint, false, shift);
                    chartObj.redraw();
                } catch (error) {
                    console.warn(`Error updating individual pool chart for ${poolName}:`, error);
                }
            }

            setPoolChartData(prevData => {
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
    };

    // Update ARC chart data
    const updateArcChartData = (arcData) => {
        if (arcData.length === 0) return;

        const sortedArcData = [...arcData].sort((a, b) => new Date(a.scan_timestamp) - new Date(b.scan_timestamp));
        const historicalChartData = {
            arcSize: [],
            arcTargetSize: [],
            mruSize: [],
            mfuSize: [],
            dataSize: [],
            metadataSize: [],
            hitRatio: [],
            dataDemandEfficiency: [],
            dataPrefetchEfficiency: [],
            compressionRatio: []
        };

        sortedArcData.forEach(arcRecord => {
            const timestamp = new Date(arcRecord.scan_timestamp).getTime();
            const arcSize = parseFloat(arcRecord.arc_size) || 0;
            const arcTargetSize = parseFloat(arcRecord.arc_target_size) || 0;
            const mruSize = parseFloat(arcRecord.mru_size) || 0;
            const mfuSize = parseFloat(arcRecord.mfu_size) || 0;
            const dataSize = parseFloat(arcRecord.data_size) || 0;
            const metadataSize = parseFloat(arcRecord.metadata_size) || 0;
            const arcHits = parseFloat(arcRecord.hits || arcRecord.arc_hits) || 0;
            const arcMisses = parseFloat(arcRecord.misses || arcRecord.arc_misses) || 0;
            const hitRatio = arcRecord.hit_ratio || (arcHits + arcMisses > 0 ? (arcHits / (arcHits + arcMisses)) * 100 : 0);
            const dataDemandEfficiency = parseFloat(arcRecord.data_demand_efficiency) || 0;
            const dataPrefetchEfficiency = parseFloat(arcRecord.data_prefetch_efficiency) || 0;
            const compressionRatio = arcRecord.uncompressed_size && arcRecord.compressed_size ?
                (parseFloat(arcRecord.uncompressed_size) / parseFloat(arcRecord.compressed_size)) : 1;
            const arcSizeGB = arcSize / (1024 * 1024 * 1024);
            const arcTargetSizeGB = arcTargetSize / (1024 * 1024 * 1024);
            const mruSizeGB = mruSize / (1024 * 1024 * 1024);
            const mfuSizeGB = mfuSize / (1024 * 1024 * 1024);
            const dataSizeGB = dataSize / (1024 * 1024 * 1024);
            const metadataSizeGB = metadataSize / (1024 * 1024 * 1024);

            historicalChartData.arcSize.push([timestamp, parseFloat(arcSizeGB.toFixed(2))]);
            historicalChartData.arcTargetSize.push([timestamp, parseFloat(arcTargetSizeGB.toFixed(2))]);
            historicalChartData.mruSize.push([timestamp, parseFloat(mruSizeGB.toFixed(2))]);
            historicalChartData.mfuSize.push([timestamp, parseFloat(mfuSizeGB.toFixed(2))]);
            historicalChartData.dataSize.push([timestamp, parseFloat(dataSizeGB.toFixed(2))]);
            historicalChartData.metadataSize.push([timestamp, parseFloat(metadataSizeGB.toFixed(2))]);
            historicalChartData.hitRatio.push([timestamp, parseFloat(hitRatio.toFixed(2))]);
            historicalChartData.dataDemandEfficiency.push([timestamp, parseFloat(dataDemandEfficiency.toFixed(2))]);
            historicalChartData.dataPrefetchEfficiency.push([timestamp, parseFloat(dataPrefetchEfficiency.toFixed(2))]);
            historicalChartData.compressionRatio.push([timestamp, parseFloat(compressionRatio.toFixed(2))]);
        });

        const allSeries = ['arcSize', 'arcTargetSize', 'mruSize', 'mfuSize', 'dataSize', 'metadataSize',
            'hitRatio', 'dataDemandEfficiency', 'dataPrefetchEfficiency', 'compressionRatio'];

        allSeries.forEach(series => {
            if (historicalChartData[series].length > maxDataPoints) {
                historicalChartData[series] = historicalChartData[series].slice(-maxDataPoints);
            }
        });

        setArcChartData(historicalChartData);
    };

    // Load historical disk I/O data
    const loadHistoricalDiskIOData = async (server) => {
        if (!server) return;

        try {
            const config = getMaxDataPointsForWindow(timeWindow);
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
            const sinceISO = sinceTime.toISOString();

            const historicalResult = await makeWebHyveRequest(
                server.hostname,
                server.port,
                server.protocol,
                `monitoring/storage/disk-io?limit=${config.limit}`
            );

            if (historicalResult.success && historicalResult.data?.diskio) {
                const historicalDiskIO = historicalResult.data.diskio;
                const validHistoricalDiskIO = historicalDiskIO.filter(io =>
                    io.device_name && io.scan_timestamp
                );

                const deviceData = {};
                validHistoricalDiskIO.forEach(io => {
                    const deviceName = io.device_name;
                    if (!deviceData[deviceName]) {
                        deviceData[deviceName] = [];
                    }
                    deviceData[deviceName].push(io);
                });

                const historicalChartData = {};

                Object.entries(deviceData).forEach(([deviceName, ioArray]) => {
                    ioArray.sort((a, b) => new Date(a.scan_timestamp) - new Date(b.scan_timestamp));
                    const recentIO = ioArray.filter(io =>
                        new Date(io.scan_timestamp) >= sinceTime
                    );

                    historicalChartData[deviceName] = {
                        readData: [],
                        writeData: [],
                        totalData: []
                    };

                    recentIO.forEach(io => {
                        const timestamp = new Date(io.scan_timestamp).getTime();
                        const readBandwidth = io.read_bandwidth_bytes || 0;
                        const writeBandwidth = io.write_bandwidth_bytes || 0;
                        const readMBps = readBandwidth / (1024 * 1024);
                        const writeMBps = writeBandwidth / (1024 * 1024);
                        const totalMBps = readMBps + writeMBps;

                        historicalChartData[deviceName].readData.push([timestamp, parseFloat(readMBps.toFixed(3))]);
                        historicalChartData[deviceName].writeData.push([timestamp, parseFloat(writeMBps.toFixed(3))]);
                        historicalChartData[deviceName].totalData.push([timestamp, parseFloat(totalMBps.toFixed(3))]);
                    });
                });

                setChartData(historicalChartData);
            }
        } catch (error) {
            console.error('Error loading historical disk I/O data:', error);
        }
    };

    // Chart expansion functions
    const expandChart = (chartId, type) => {
        setExpandedChart(chartId);
        setExpandedChartType(type);
    };

    const closeExpandedChart = () => {
        setExpandedChart(null);
        setExpandedChartType(null);
    };

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
        maxDataPoints,
        chartRefs,
        poolChartRefs,
        summaryChartRefs,
        arcChartRef,
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
        parseSize
    };
};
