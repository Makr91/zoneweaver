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
    const [chartSortBy, setChartSortBy] = useState('bandwidth');
    const [expandedChart, setExpandedChart] = useState(null);
    const [expandedChartType, setExpandedChartType] = useState(null);
    const [interfaceSort, setInterfaceSort] = useState([{ column: 'link', direction: 'asc' }]);
    const [bandwidthSort, setBandwidthSort] = useState([{ column: 'totalMbps', direction: 'desc' }]);
    
    // Chart refs
    const chartRefs = useRef({});
    const summaryChartRefs = useRef({});
    
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
            loadNetworkData();
        }
    }, [currentServer]);

    // Auto-refresh effect
    useEffect(() => {
        if (!autoRefresh || !currentServer) return;

        console.log('🔄 NETWORKING: Setting up auto-refresh every', refreshInterval, 'seconds');
        const interval = setInterval(() => {
            console.log('🔄 NETWORKING: Auto-refreshing network data...');
            loadNetworkData();
        }, refreshInterval * 1000);

        return () => {
            console.log('🔄 NETWORKING: Cleaning up auto-refresh interval');
            clearInterval(interval);
        };
    }, [autoRefresh, refreshInterval, currentServer]);

    const loadNetworkData = async () => {
        if (!currentServer || loading) return;

        try {
            setLoading(true);
            setError('');

            console.log('🔍 NETWORKING: Loading complete network data for', currentServer.hostname);

            // Load all network data in parallel - uses monitoring endpoints for historical data
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
                makeZoneweaverAPIRequest(currentServer.hostname, currentServer.port, currentServer.protocol, 'monitoring/network/usage'),
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
                
                // Access interfaces directly from API response
                const interfaces = interfacesResult.value?.interfaces || [];
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
                
                // Access usage directly from API response
                const usage = usageResult.value?.usage || [];
                const deduplicatedUsage = usage.reduce((acc, entry) => {
                    const interfaceId = entry.interface || entry.name || entry.link;
                    const existing = acc.find(existing => 
                        (existing.interface || existing.name || existing.link) === interfaceId
                    );
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
                // Access addresses directly from API response
                const ips = ipResult.value?.addresses || [];
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
                // Access routes directly from API response
                const routes = routesResult.value?.routes || [];
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
            if (aggregatesResult.status === 'fulfilled' && aggregatesResult.value.success) {
                const aggregates = aggregatesResult.value.data?.aggregates || [];
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
            if (etherstubsResult.status === 'fulfilled' && etherstubsResult.value.success) {
                const etherstubs = etherstubsResult.value.data?.etherstubs || [];
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
            if (vnicsResult.status === 'fulfilled' && vnicsResult.value.success) {
                const vnics = vnicsResult.value.data?.vnics || [];
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
            if (zonesResult.status === 'fulfilled' && zonesResult.value.success) {
                const zones = zonesResult.value.data?.zones || [];
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

    // Chart data processing function 
    const processChartData = () => {
        console.log('📊 CHARTS: Processing chart data from current usage data...');
        
        if (networkUsage.length === 0) {
            console.log('📊 CHARTS: No usage data available yet');
            return;
        }
        
        const currentTime = Date.now();
        const maxPoints = 50; // Maintain more data points for better charts
        
        setChartData(prevChartData => {
            const newChartData = { ...prevChartData };
            
            // Process each interface's usage data
            networkUsage.forEach(usage => {
                const interfaceName = usage.interface || usage.name || usage.link;
                
                if (interfaceName) {
                    // Use pre-calculated bandwidth values directly from API
                    const rxMbps = parseFloat(usage.rx_mbps) || 0;
                    const txMbps = parseFloat(usage.tx_mbps) || 0;
                    
                    console.log(`📊 CHARTS: Processing ${interfaceName} - RX: ${rxMbps}Mbps, TX: ${txMbps}Mbps (from API pre-calculated values)`);
                    
                    // Initialize chart data for new interfaces
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
                    
                    console.log(`📊 CHARTS: Added data for ${interfaceName}: RX=${rxMbps.toFixed(3)}Mbps, TX=${txMbps.toFixed(3)}Mbps (${interfaceData.rxData.length} points)`);
                }
            });
            
            console.log('📊 CHARTS: Processed chart data for', Object.keys(newChartData).length, 'interfaces');
            return newChartData;
        });
    };

    // Process chart data when usage data changes
    useEffect(() => {
        if (networkUsage.length > 0) {
            processChartData();
        }
    }, [networkUsage, timeWindow]);

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
                const aVal = parseFloat(a[sort.column]) || 0;
                const bVal = parseFloat(b[sort.column]) || 0;
                
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
        getSortIcon: (column, sortArray) => getSortIcon(sortArray || interfaceSort, column),
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
        loadNetworkData
    };
};
