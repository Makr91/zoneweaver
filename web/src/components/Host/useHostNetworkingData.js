import { useState, useEffect, useRef } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useServers } from "../../contexts/ServerContext";

export const useHostNetworkingData = () => {
    console.log('🐛 DEBUG: useHostNetworkingData hook starting - Enhanced for topology');
    
    
    // Network data state
    const [networkInterfaces, setNetworkInterfaces] = useState([]);
    const [networkUsage, setNetworkUsage] = useState([]);
    const [ipAddresses, setIpAddresses] = useState([]);
    const [routes, setRoutes] = useState([]);
    
    // Topology data state
    const [aggregates, setAggregates] = useState([]);
    const [etherstubs, setEtherstubs] = useState([]);
    const [vnics, setVnics] = useState([]);
    const [zones, setZones] = useState([]);
    
    // UI state
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [autoRefresh, setAutoRefresh] = useState(true);
    const [refreshInterval, setRefreshInterval] = useState(60); // seconds
    
    // Chart data state
    const [chartData, setChartData] = useState({});
    const [timeWindow, setTimeWindow] = useState('15min');
    const [resolution, setResolution] = useState('high'); // 'realtime', 'high', 'medium', 'low'
    const [chartSortBy, setChartSortBy] = useState('bandwidth');
    const [expandedChart, setExpandedChart] = useState(null);
    const [expandedChartType, setExpandedChartType] = useState(null);
    const [interfaceSort, setInterfaceSort] = useState([{ column: 'link', direction: 'asc' }]);
    const [bandwidthSort, setBandwidthSort] = useState([{ column: 'totalMbps', direction: 'desc' }]);
    
    // Chart refs
    const chartRefs = useRef({});
    const summaryChartRefs = useRef({});
    
    // Track initial loading to prevent duplicate historical calls
    const initialLoadDone = useRef(false);
    const [initialDataLoaded, setInitialDataLoaded] = useState(false);
    
    // Authentication
    const { user } = useAuth();
    
    // Server context
    const { currentServer, makeZoneweaverAPIRequest } = useServers();
    
    // Simplified section state
    const [sectionsCollapsed, setSectionsCollapsed] = useState({
        topology: false,
        ipAddresses: false,
        routingTable: false,
        interfaces: false,
        bandwidth: false,
        summary: false,
        charts: false
    });

    // Load data when server changes
    useEffect(() => {
        console.log('🔍 NETWORKING: Server changed effect triggered', {
            currentServer: currentServer?.hostname,
            hasRequest: !!makeZoneweaverAPIRequest
        });
        if (currentServer && makeZoneweaverAPIRequest) {
            loadHistoricalChartData(); // Load historical data first to establish chart foundation
            loadNetworkData().then(() => {
                setInitialDataLoaded(true); // Mark initial data load as completed
                initialLoadDone.current = true; // Mark initial load as completed AFTER completion
                console.log('🔍 NETWORKING: Initial data loading completed - preventing duplicate historical calls');
            });
        }
    }, [currentServer]);

    // Auto-refresh effect - wait for initial data to load before starting
    useEffect(() => {
        if (!autoRefresh || !currentServer || !initialDataLoaded) {
            if (!initialDataLoaded) {
                console.log('🔄 NETWORKING: Auto-refresh waiting for initial data load to complete');
            }
            return;
        }

        console.log('🔄 NETWORKING: Setting up auto-refresh every', refreshInterval, 'seconds');
        const interval = setInterval(() => {
            console.log('🔄 NETWORKING: Auto-refreshing network data...');
            loadNetworkData();
        }, refreshInterval * 1000);

        return () => {
            console.log('🔄 NETWORKING: Cleaning up auto-refresh interval');
            clearInterval(interval);
        };
    }, [autoRefresh, refreshInterval, currentServer, initialDataLoaded]);

    const loadNetworkData = async () => {
        if (!currentServer || loading) return;

        try {
            setLoading(true);
            setError('');

            console.log('🔍 NETWORKING: Loading complete network data for', currentServer.hostname);

            // Load all network data in parallel - current usage data for animations, topology data for structure
            const [
                interfacesResult,
                usageResult,
                ipResult,
                routesResult,
                aggregatesResult,
                etherstubsResult,
                vnicsResult,
                zonesResult
            ] = await Promise.allSettled([
                makeZoneweaverAPIRequest(currentServer.hostname, currentServer.port, currentServer.protocol, 'monitoring/network/interfaces'),
                makeZoneweaverAPIRequest(currentServer.hostname, currentServer.port, currentServer.protocol, 'monitoring/network/usage?limit=1&per_interface=true'),
                makeZoneweaverAPIRequest(currentServer.hostname, currentServer.port, currentServer.protocol, 'monitoring/network/ipaddresses'),
                makeZoneweaverAPIRequest(currentServer.hostname, currentServer.port, currentServer.protocol, 'monitoring/network/routes'),
                makeZoneweaverAPIRequest(currentServer.hostname, currentServer.port, currentServer.protocol, 'network/aggregates'),
                makeZoneweaverAPIRequest(currentServer.hostname, currentServer.port, currentServer.protocol, 'network/etherstubs'),
                makeZoneweaverAPIRequest(currentServer.hostname, currentServer.port, currentServer.protocol, 'network/vnics'),
                makeZoneweaverAPIRequest(currentServer.hostname, currentServer.port, currentServer.protocol, 'zones')
            ]);

            // Process network interfaces with deduplication
            console.log('🔍 NETWORKING: Interfaces API response:', interfacesResult);
            if (interfacesResult.status === 'fulfilled') {
                console.log('🔍 NETWORKING: Interfaces response value:', interfacesResult.value);
                
                // Access interfaces from nested data structure
                const interfaces = interfacesResult.value?.data?.interfaces || interfacesResult.value?.interfaces || [];
                console.log('🔍 NETWORKING: Raw interfaces count:', interfaces.length);
                console.log('🔍 NETWORKING: Sample interface structure:', interfaces[0]);
                
                const deduplicatedInterfaces = interfaces.reduce((acc, netInterface) => {
                    // Use link field as primary identifier since that's what the API provides
                    const interfaceId = netInterface.link;
                    const existing = acc.find(existing => existing.link === interfaceId);
                    
                    if (!existing) {
                        acc.push(netInterface);
                        console.log('🔍 NETWORKING: Added new interface:', interfaceId);
                    } else {
                        // Keep the one with the most recent scan_timestamp
                        if (netInterface.scan_timestamp && existing.scan_timestamp &&
                            new Date(netInterface.scan_timestamp) > new Date(existing.scan_timestamp)) {
                            const index = acc.indexOf(existing);
                            acc[index] = netInterface;
                            console.log('🔍 NETWORKING: Updated interface with newer timestamp:', interfaceId);
                        }
                    }
                    return acc;
                }, []);
                
                console.log('🔍 NETWORKING: After deduplication:', deduplicatedInterfaces.length, 'unique interfaces');
                console.log('🔍 NETWORKING: Unique interface links:', deduplicatedInterfaces.map(i => i.link));
                setNetworkInterfaces(deduplicatedInterfaces);
            } else {
                console.error('🔍 NETWORKING: Failed to load interfaces - promise rejected:', interfacesResult);
            }

            // Process network usage with deduplication
            console.log('🔍 NETWORKING: Usage API response:', usageResult);
            if (usageResult.status === 'fulfilled') {
                console.log('🔍 NETWORKING: Usage response value:', usageResult.value);
                
                // Access usage from nested data structure
                const usage = usageResult.value?.data?.usage || usageResult.value?.usage || [];
                const deduplicatedUsage = usage.reduce((acc, entry) => {
                    const interfaceId = entry.link;
                    const existing = acc.find(existing => existing.link === interfaceId);
                    if (!existing) {
                        acc.push(entry);
                    } else {
                        // Keep the one with the most recent scan_timestamp
                        if (entry.scan_timestamp && existing.scan_timestamp &&
                            new Date(entry.scan_timestamp) > new Date(existing.scan_timestamp)) {
                            const index = acc.indexOf(existing);
                            acc[index] = entry;
                        }
                    }
                    return acc;
                }, []);
                setNetworkUsage(deduplicatedUsage);
                console.log('🔍 NETWORKING: Loaded', deduplicatedUsage.length, 'unique usage entries from monitoring API');
            } else {
                console.error('🔍 NETWORKING: Failed to load usage - promise rejected:', usageResult);
            }

            // Process IP addresses with deduplication
            if (ipResult.status === 'fulfilled') {
                // Access addresses from nested data structure
                const ips = ipResult.value?.data?.addresses || ipResult.value?.addresses || [];
                const deduplicatedIps = ips.reduce((acc, ip) => {
                    const ipId = ip.addrobj || `${ip.interface}-${ip.ip_address}`;
                    const existing = acc.find(existing => 
                        (existing.addrobj || `${existing.interface}-${existing.ip_address}`) === ipId
                    );
                    if (!existing) {
                        acc.push(ip);
                    } else {
                        // Keep the one with the most recent scan_timestamp
                        if (ip.scan_timestamp && existing.scan_timestamp &&
                            new Date(ip.scan_timestamp) > new Date(existing.scan_timestamp)) {
                            const index = acc.indexOf(existing);
                            acc[index] = ip;
                        }
                    }
                    return acc;
                }, []);
                setIpAddresses(deduplicatedIps);
                console.log('🔍 NETWORKING: Loaded', deduplicatedIps.length, 'unique IP addresses from monitoring API');
            } else {
                console.error('🔍 NETWORKING: Failed to load IP addresses:', ipResult);
            }

            // Process routes with deduplication
            if (routesResult.status === 'fulfilled') {
                // Access routes from nested data structure
                const routes = routesResult.value?.data?.routes || routesResult.value?.routes || [];
                const deduplicatedRoutes = routes.reduce((acc, route) => {
                    const routeId = `${route.destination}-${route.gateway}-${route.interface}`;
                    const existing = acc.find(existing => 
                        `${existing.destination}-${existing.gateway}-${existing.interface}` === routeId
                    );
                    if (!existing) {
                        acc.push(route);
                    } else {
                        // Keep the one with the most recent scan_timestamp
                        if (route.scan_timestamp && existing.scan_timestamp &&
                            new Date(route.scan_timestamp) > new Date(existing.scan_timestamp)) {
                            const index = acc.indexOf(existing);
                            acc[index] = route;
                        }
                    }
                    return acc;
                }, []);
                setRoutes(deduplicatedRoutes);
                console.log('🔍 NETWORKING: Loaded', deduplicatedRoutes.length, 'unique routes from monitoring API');
            } else {
                console.error('🔍 NETWORKING: Failed to load routes:', routesResult);
            }

            // Process aggregates with deduplication
            // TODO: Backend API Consistency - Standardize all endpoints to return { success: true, data: {...} } format
            if (aggregatesResult.status === 'fulfilled') {
                const aggregates = aggregatesResult.value?.data?.aggregates || aggregatesResult.value?.aggregates || [];
                const deduplicatedAggregates = aggregates.reduce((acc, aggregate) => {
                    const aggregateId = aggregate.name || aggregate.link;
                    const existing = acc.find(existing => 
                        (existing.name || existing.link) === aggregateId
                    );
                    if (!existing) {
                        acc.push(aggregate);
                    } else {
                        // Keep the one with the most recent scan_timestamp
                        if (aggregate.scan_timestamp && existing.scan_timestamp &&
                            new Date(aggregate.scan_timestamp) > new Date(existing.scan_timestamp)) {
                            const index = acc.indexOf(existing);
                            acc[index] = aggregate;
                        }
                    }
                    return acc;
                }, []);
                setAggregates(deduplicatedAggregates);
            }

            // Process etherstubs with deduplication
            // TODO: Backend API Consistency - May need to standardize all endpoints to return { success: true, data: {...} } format
            if (etherstubsResult.status === 'fulfilled') {
                const etherstubs = etherstubsResult.value?.data?.etherstubs || etherstubsResult.value?.etherstubs || [];
                const deduplicatedEtherstubs = etherstubs.reduce((acc, etherstub) => {
                    const etherstubId = etherstub.name || etherstub.link;
                    const existing = acc.find(existing => 
                        (existing.name || existing.link) === etherstubId
                    );
                    if (!existing) {
                        acc.push(etherstub);
                    } else {
                        // Keep the one with the most recent scan_timestamp
                        if (etherstub.scan_timestamp && existing.scan_timestamp &&
                            new Date(etherstub.scan_timestamp) > new Date(existing.scan_timestamp)) {
                            const index = acc.indexOf(existing);
                            acc[index] = etherstub;
                        }
                    }
                    return acc;
                }, []);
                setEtherstubs(deduplicatedEtherstubs);
            }

            // Process VNICs with deduplication
            // TODO: Backend API Consistency - Currently /network/vnics returns { vnics: [...] } directly instead of { success: true, data: {...} } format
            if (vnicsResult.status === 'fulfilled') {
                const vnics = vnicsResult.value?.data?.vnics || vnicsResult.value?.vnics || [];
                const deduplicatedVnics = vnics.reduce((acc, vnic) => {
                    const vnicId = vnic.name || vnic.link;
                    const existing = acc.find(existing => 
                        (existing.name || existing.link) === vnicId
                    );
                    if (!existing) {
                        acc.push(vnic);
                    } else {
                        // Keep the one with the most recent scan_timestamp
                        if (vnic.scan_timestamp && existing.scan_timestamp &&
                            new Date(vnic.scan_timestamp) > new Date(existing.scan_timestamp)) {
                            const index = acc.indexOf(existing);
                            acc[index] = vnic;
                        }
                    }
                    return acc;
                }, []);
                setVnics(deduplicatedVnics);
            }

            // Process zones with deduplication
            // TODO: Backend API Consistency - Currently /zones returns { zones: [...] } directly instead of { success: true, data: {...} } format
            if (zonesResult.status === 'fulfilled') {
                const zones = zonesResult.value?.data?.zones || zonesResult.value?.zones || [];
                const deduplicatedZones = zones.reduce((acc, zone) => {
                    const zoneId = zone.name || zone.zonename;
                    const existing = acc.find(existing => 
                        (existing.name || existing.zonename) === zoneId
                    );
                    if (!existing) {
                        acc.push(zone);
                    } else {
                        // Keep the one with the most recent scan_timestamp
                        if (zone.scan_timestamp && existing.scan_timestamp &&
                            new Date(zone.scan_timestamp) > new Date(existing.scan_timestamp)) {
                            const index = acc.indexOf(existing);
                            acc[index] = zone;
                        }
                    }
                    return acc;
                }, []);
                setZones(deduplicatedZones);
            }

            console.log('🔍 NETWORKING: Complete network data loaded');

        } catch (err) {
            console.error('💥 NETWORKING: Error loading network data:', err);
            setError('Error loading network data: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const toggleSection = (section) => {
        setSectionsCollapsed(prev => ({
            ...prev,
            [section]: !prev[section]
        }));
    };

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

    // Helper function to get resolution limit for API requests (per interface)
    const getResolutionLimit = (resolution) => {
        const resolutionLimits = {
            'realtime': 125,  // per interface
            'high': 38,       // per interface
            'medium': 13,     // per interface
            'low': 5          // per interface
        };
        return resolutionLimits[resolution] || 13;
    };

    // Load historical chart data for the selected time window and resolution
    const loadHistoricalChartData = async () => {
        if (!currentServer || !makeZoneweaverAPIRequest) return;

        try {
            console.log('📊 HISTORICAL CHARTS: Loading historical data for time window:', timeWindow, 'resolution:', resolution);
            
            const historicalTimestamp = getHistoricalTimestamp(timeWindow);
            const limit = getResolutionLimit(resolution);
            
            console.log('📊 HISTORICAL CHARTS: Requesting data since:', historicalTimestamp, 'with limit:', limit);
            
            const historicalResult = await makeZoneweaverAPIRequest(
                currentServer.hostname, 
                currentServer.port, 
                currentServer.protocol, 
                `monitoring/network/usage?since=${encodeURIComponent(historicalTimestamp)}&limit=${limit}&per_interface=true`
            );

            const historicalUsage = historicalResult?.data?.usage || historicalResult?.usage || [];
            if (historicalUsage && Array.isArray(historicalUsage) && historicalUsage.length > 0) {
                console.log('📊 HISTORICAL CHARTS: Received', historicalUsage.length, 'historical records');
                
                // Group historical data by interface
                const interfaceGroups = {};
                
                historicalUsage.forEach(record => {
                    const interfaceName = record.link;
                    if (!interfaceName) return;
                    
                    if (!interfaceGroups[interfaceName]) {
                        interfaceGroups[interfaceName] = [];
                    }
                    interfaceGroups[interfaceName].push(record);
                });

                // Build chart data from historical records
                const newChartData = {};
                
                Object.entries(interfaceGroups).forEach(([interfaceName, records]) => {
                    // Sort records by timestamp (oldest first)
                    const sortedRecords = records.sort((a, b) => 
                        new Date(a.scan_timestamp) - new Date(b.scan_timestamp)
                    );

                    newChartData[interfaceName] = {
                        rxData: [],
                        txData: [],
                        totalData: []
                    };

                    sortedRecords.forEach(record => {
                        const timestamp = new Date(record.scan_timestamp).getTime();
                        const rxMbps = parseFloat(record.rx_mbps) || 0;
                        const txMbps = parseFloat(record.tx_mbps) || 0;

                        newChartData[interfaceName].rxData.push([timestamp, rxMbps]);
                        newChartData[interfaceName].txData.push([timestamp, txMbps]);
                        newChartData[interfaceName].totalData.push([timestamp, rxMbps + txMbps]);
                    });

                    console.log(`📊 HISTORICAL CHARTS: Built ${sortedRecords.length} historical points for ${interfaceName}`);
                });

                setChartData(newChartData);
                console.log('📊 HISTORICAL CHARTS: Loaded historical data for', Object.keys(newChartData).length, 'interfaces');
            } else {
                console.warn('📊 HISTORICAL CHARTS: No historical usage data received');
            }
        } catch (error) {
            console.error('📊 HISTORICAL CHARTS: Error loading historical data:', error);
        }
    };

    // Chart data processing function (for real-time updates)
    const processChartData = () => {
        console.log('📊 CHARTS: Processing real-time chart data update...');
        
        if (networkUsage.length === 0) {
            console.log('📊 CHARTS: No real-time usage data available yet');
            return;
        }
        
        const currentTime = Date.now();
        const maxPoints = 200; // Increased to handle more historical data
        
        setChartData(prevChartData => {
            const newChartData = { ...prevChartData };
            
            // Process each interface's current usage data
            networkUsage.forEach(usage => {
                const interfaceName = usage.link;
                
                if (interfaceName) {
                    // Use pre-calculated bandwidth values directly from API
                    const rxMbps = parseFloat(usage.rx_mbps) || 0;
                    const txMbps = parseFloat(usage.tx_mbps) || 0;
                    
                    console.log(`📊 CHARTS: Adding real-time point for ${interfaceName} - RX: ${rxMbps}Mbps, TX: ${txMbps}Mbps`);
                    
                    // Initialize chart data for new interfaces if needed
                    if (!newChartData[interfaceName]) {
                        newChartData[interfaceName] = {
                            rxData: [],
                            txData: [],
                            totalData: []
                        };
                    }
                    
                    // Add current data point to existing data
                    const interfaceData = newChartData[interfaceName];
                    
                    interfaceData.rxData.push([currentTime, rxMbps]);
                    interfaceData.txData.push([currentTime, txMbps]);
                    interfaceData.totalData.push([currentTime, rxMbps + txMbps]);
                    
                    // Keep only the latest points (rolling window)
                    if (interfaceData.rxData.length > maxPoints) {
                        interfaceData.rxData.shift();
                        interfaceData.txData.shift();
                        interfaceData.totalData.shift();
                    }
                    
                    console.log(`📊 CHARTS: Updated ${interfaceName}: RX=${rxMbps.toFixed(3)}Mbps, TX=${txMbps.toFixed(3)}Mbps (${interfaceData.rxData.length} points)`);
                }
            });
            
            console.log('📊 CHARTS: Updated real-time chart data for', Object.keys(newChartData).length, 'interfaces');
            return newChartData;
        });
    };

    // Load historical chart data when time window or resolution changes (but not during initial load)
    useEffect(() => {
        if (currentServer && makeZoneweaverAPIRequest && initialLoadDone.current) {
            console.log('📊 HISTORICAL CHARTS: Time window or resolution changed, loading historical data');
            loadHistoricalChartData();
        } else if (!initialLoadDone.current) {
            console.log('📊 HISTORICAL CHARTS: Skipping settings change during initial load');
        }
    }, [timeWindow, resolution]);

    // Note: networkUsage is now only for react-flow topology animations (current values)
    // Chart data comes from loadHistoricalChartData() with time-based sampling

    // Chart functionality
    const expandChart = (chartId, type) => {
        setExpandedChart(chartId);
        setExpandedChartType(type);
    };

    const closeExpandedChart = () => {
        setExpandedChart(null);
        setExpandedChartType(null);
    };

    const getSortedChartEntries = () => {
        const entries = Object.entries(chartData);
        
        switch (chartSortBy) {
            case 'name':
                return entries.sort(([a], [b]) => a.localeCompare(b));
            case 'rx':
                return entries.sort(([, a], [, b]) => {
                    const aRx = a.rxData[a.rxData.length - 1]?.[1] || 0;
                    const bRx = b.rxData[b.rxData.length - 1]?.[1] || 0;
                    return bRx - aRx;
                });
            case 'tx':
                return entries.sort(([, a], [, b]) => {
                    const aTx = a.txData[a.txData.length - 1]?.[1] || 0;
                    const bTx = b.txData[b.txData.length - 1]?.[1] || 0;
                    return bTx - aTx;
                });
            case 'bandwidth':
            default:
                return entries.sort(([, a], [, b]) => {
                    const aTotal = a.totalData[a.totalData.length - 1]?.[1] || 0;
                    const bTotal = b.totalData[b.totalData.length - 1]?.[1] || 0;
                    return bTotal - aTotal;
                });
        }
    };

    // Sorting functions
    const handleInterfaceSort = (column) => {
        setInterfaceSort(prev => {
            const existing = prev.find(s => s.column === column);
            if (existing) {
                return prev.map(s => 
                    s.column === column 
                        ? { ...s, direction: s.direction === 'asc' ? 'desc' : 'asc' }
                        : s
                );
            } else {
                return [{ column, direction: 'asc' }];
            }
        });
    };

    const handleBandwidthSort = (column) => {
        setBandwidthSort(prev => {
            const existing = prev.find(s => s.column === column);
            if (existing) {
                return prev.map(s => 
                    s.column === column 
                        ? { ...s, direction: s.direction === 'asc' ? 'desc' : 'asc' }
                        : s
                );
            } else {
                return [{ column, direction: 'desc' }];
            }
        });
    };

    const resetInterfaceSort = () => {
        setInterfaceSort([{ column: 'link', direction: 'asc' }]);
    };

    const resetBandwidthSort = () => {
        setBandwidthSort([{ column: 'totalMbps', direction: 'desc' }]);
    };

    const getSortedInterfaces = () => {
        let sorted = [...networkInterfaces];
        
        interfaceSort.forEach(sort => {
            sorted.sort((a, b) => {
                const aVal = a[sort.column] || '';
                const bVal = b[sort.column] || '';
                
                if (sort.direction === 'asc') {
                    return aVal.toString().localeCompare(bVal.toString());
                } else {
                    return bVal.toString().localeCompare(aVal.toString());
                }
            });
        });
        
        return sorted;
    };

    const getSortedBandwidthUsage = () => {
        let sorted = [...networkUsage];
        
        bandwidthSort.forEach(sort => {
            sorted.sort((a, b) => {
                let aVal, bVal;
                
                // Handle calculated total bandwidth
                if (sort.column === 'totalMbps') {
                    aVal = (parseFloat(a.rx_mbps) || 0) + (parseFloat(a.tx_mbps) || 0);
                    bVal = (parseFloat(b.rx_mbps) || 0) + (parseFloat(b.tx_mbps) || 0);
                } else {
                    aVal = parseFloat(a[sort.column]) || 0;
                    bVal = parseFloat(b[sort.column]) || 0;
                }
                
                if (sort.direction === 'asc') {
                    return aVal - bVal;
                } else {
                    return bVal - aVal;
                }
            });
        });
        
        return sorted;
    };

    const getSortIcon = (currentSortArray, column) => {
        // Ensure we always have a valid array
        if (!Array.isArray(currentSortArray)) {
            return 'fa-sort';
        }
        const sort = currentSortArray.find(s => s.column === column);
        if (!sort) return 'fa-sort';
        return sort.direction === 'asc' ? 'fa-sort-up' : 'fa-sort-down';
    };

    const handleServerChange = () => {
        // Server changes are handled via the useEffect
    };

    console.log('🐛 DEBUG: Returning enhanced hook interface with topology data');

    return {
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
        selectedServer: currentServer,
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
        getSortIcon: (currentSortArray, column) => getSortIcon(currentSortArray || interfaceSort, column),
        expandedChart,
        expandedChartType,
        expandChart,
        closeExpandedChart,
        chartSortBy,
        setChartSortBy,
        getSortedChartEntries,
        user,
        getServers: () => currentServer ? [currentServer] : [],
        handleServerChange,
        loadNetworkData,
        loadHistoricalChartData
    };
};
