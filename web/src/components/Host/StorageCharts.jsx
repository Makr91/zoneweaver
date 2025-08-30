import React from 'react';
import Highcharts from '../Highcharts';
import { HighchartsReact } from 'highcharts-react-official';

const StorageCharts = ({
    chartData,
    poolChartData,
    arcChartData,
    diskIOStats,
    poolIOStats,
    arcStats,
    sectionsCollapsed,
    toggleSection,
    timeWindow,
    setTimeWindow,
    loading,
    chartSortBy,
    setChartSortBy,
    getSortedChartEntries,
    expandChart,
    summaryChartRefs,
    chartRefs,
    poolChartRefs,
    seriesVisibility,
    setSeriesVisibility
}) => {
    if (Object.keys(chartData).length === 0 && Object.keys(poolChartData).length === 0 && Object.keys(arcChartData).length === 0) {
        return null;
    }

    return (
        <div className='box mb-4'>
            <div className='level is-mobile mb-3'>
                <div className='level-left'>
                    <h4 className='title is-5 mb-0'>
                        <span className='icon-text'>
                            <span className='icon'><i className='fas fa-chart-area'></i></span>
                            <span>Real-Time Storage Performance Charts</span>
                        </span>
                    </h4>
                </div>
                <div className='level-right'>
                    <div className='field is-grouped'>
                        <div className='control'>
                            <div className='select is-small'>
                                <select
                                    value={chartSortBy}
                                    onChange={(e) => setChartSortBy(e.target.value)}
                                    disabled={loading}
                                    title="Sort individual charts by"
                                >
                                    <option value="bandwidth">Most Bandwidth</option>
                                    <option value="name">Device Name</option>
                                    <option value="read">Read Bandwidth</option>
                                    <option value="write">Write Bandwidth</option>
                                </select>
                            </div>
                        </div>
                        <div className='control'>
                            <div className='field is-grouped'>
                                <div className='control'>
                                    <button
                                        className={`button is-small ${seriesVisibility.read ? 'is-info' : 'is-dark'}`}
                                        onClick={() => setSeriesVisibility(prev => ({ ...prev, read: !prev.read }))}
                                        title="Toggle Read bandwidth visibility on all charts"
                                    >
                                        <span className='icon'>
                                            <i className={`fas ${seriesVisibility.read ? 'fa-eye' : 'fa-eye-slash'}`}></i>
                                        </span>
                                        <span>Read</span>
                                    </button>
                                </div>
                                <div className='control'>
                                    <button
                                        className={`button is-small ${seriesVisibility.write ? 'is-warning' : 'is-dark'}`}
                                        onClick={() => setSeriesVisibility(prev => ({ ...prev, write: !prev.write }))}
                                        title="Toggle Write bandwidth visibility on all charts"
                                    >
                                        <span className='icon'>
                                            <i className={`fas ${seriesVisibility.write ? 'fa-eye' : 'fa-eye-slash'}`}></i>
                                        </span>
                                        <span>Write</span>
                                    </button>
                                </div>
                                <div className='control'>
                                    <button
                                        className={`button is-small ${seriesVisibility.total ? 'is-success' : 'is-dark'}`}
                                        onClick={() => setSeriesVisibility(prev => ({ ...prev, total: !prev.total }))}
                                        title="Toggle Total bandwidth visibility on all charts"
                                    >
                                        <span className='icon'>
                                            <i className={`fas ${seriesVisibility.total ? 'fa-eye' : 'fa-eye-slash'}`}></i>
                                        </span>
                                        <span>Total</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div className='control'>
                            <button
                                className='button is-small is-ghost'
                                onClick={() => toggleSection('charts')}
                                title={sectionsCollapsed.charts ? 'Expand section' : 'Collapse section'}
                            >
                                <span className='icon'>
                                    <i className={`fas ${sectionsCollapsed.charts ? 'fa-chevron-down' : 'fa-chevron-up'}`}></i>
                                </span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            {!sectionsCollapsed.charts && (
                <div>
                    {/* Summary Charts - All Devices Combined */}
                    <div className='mb-5'>
                        <h5 className='title is-6 mb-3'>
                            <span className='icon-text'>
                                <span className='icon'><i className='fas fa-layer-group'></i></span>
                                <span>All Devices Summary</span>
                            </span>
                        </h5>
                        <div className='columns'>
                            {/* Read Summary Chart */}
                            <div className='column is-4'>
                                <div className='is-chart-container is-relative'>
                                    <button
                                        className='button is-small is-ghost is-chart-expand-button'
                                        onClick={() => expandChart('summary-read', 'summary-read')}
                                        title="Expand chart to full size"
                                    >
                                        <span className='icon has-text-white'>
                                            <i className='fas fa-expand'></i>
                                        </span>
                                    </button>
                                    <HighchartsReact
                                        highcharts={Highcharts}
                                        ref={ref => {
                                            if (ref) {
                                                summaryChartRefs.current['summary-read'] = ref;
                                            }
                                        }}
                                        options={{
                                            chart: {
                                                type: 'spline',
                                                animation: {
                                                    duration: 1000,
                                                    easing: 'easeOutQuart'
                                                },
                                                marginRight: 10,
                                                height: 300,
                                                backgroundColor: '#1e2a3a',
                                                style: {
                                                    fontFamily: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif'
                                                }
                                            },
                                            time: {
                                                useUTC: false
                                            },
                                            title: {
                                                text: 'Read Bandwidth (All Devices)',
                                                style: {
                                                    fontSize: '14px',
                                                    fontWeight: 'bold',
                                                    color: '#ffffff'
                                                }
                                            },
                                            xAxis: {
                                                type: 'datetime',
                                                tickPixelInterval: 150,
                                                labels: {
                                                    style: {
                                                        fontSize: '10px',
                                                        color: '#b0bec5'
                                                    }
                                                },
                                                lineColor: '#37474f',
                                                tickColor: '#37474f',
                                                gridLineColor: '#37474f'
                                            },
                                            yAxis: {
                                                title: {
                                                    text: 'Bandwidth (MB/s)',
                                                    style: {
                                                        fontSize: '12px',
                                                        color: '#b0bec5'
                                                    }
                                                },
                                                min: 0,
                                                labels: {
                                                    style: {
                                                        fontSize: '10px',
                                                        color: '#b0bec5'
                                                    }
                                                },
                                                lineColor: '#37474f',
                                                tickColor: '#37474f',
                                                gridLineColor: '#37474f'
                                            },
                                            legend: {
                                                enabled: true,
                                                itemStyle: {
                                                    fontSize: '9px',
                                                    color: '#ffffff'
                                                },
                                                itemHoverStyle: {
                                                    color: '#64b5f6'
                                                },
                                                maxHeight: 80
                                            },
                                            plotOptions: {
                                                spline: {
                                                    marker: {
                                                        enabled: false
                                                    },
                                                    lineWidth: 2
                                                }
                                            },
                                            series: Object.entries(chartData)
                                                .filter(([, data]) => data.readData.length > 0)
                                                .map(([deviceName, data], index) => ({
                                                    name: deviceName,
                                                    data: data.readData,
                                                    color: `hsl(${(index * 360 / Object.keys(chartData).length)}, 70%, 60%)`,
                                                    visible: true
                                                })),
                                            credits: {
                                                enabled: false
                                            },
                                            tooltip: {
                                                shared: true,
                                                valueSuffix: ' MB/s',
                                                backgroundColor: '#263238',
                                                borderColor: '#37474f',
                                                style: {
                                                    color: '#ffffff',
                                                    fontSize: '11px'
                                                }
                                            }
                                        }}
                                    />
                                </div>
                            </div>

                            {/* Write Summary Chart */}
                            <div className='column is-4'>
                                <div className='is-chart-container is-relative'>
                                    <button
                                        className='button is-small is-ghost is-chart-expand-button'
                                        onClick={() => expandChart('summary-write', 'summary-write')}
                                        title="Expand chart to full size"
                                    >
                                        <span className='icon has-text-white'>
                                            <i className='fas fa-expand'></i>
                                        </span>
                                    </button>
                                    <HighchartsReact
                                        highcharts={Highcharts}
                                        ref={ref => {
                                            if (ref) {
                                                summaryChartRefs.current['summary-write'] = ref;
                                            }
                                        }}
                                        options={{
                                            chart: {
                                                type: 'spline',
                                                animation: {
                                                    duration: 1000,
                                                    easing: 'easeOutQuart'
                                                },
                                                marginRight: 10,
                                                height: 300,
                                                backgroundColor: '#1e2a3a',
                                                style: {
                                                    fontFamily: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif'
                                                }
                                            },
                                            time: {
                                                useUTC: false
                                            },
                                            title: {
                                                text: 'Write Bandwidth (All Devices)',
                                                style: {
                                                    fontSize: '14px',
                                                    fontWeight: 'bold',
                                                    color: '#ffffff'
                                                }
                                            },
                                            xAxis: {
                                                type: 'datetime',
                                                tickPixelInterval: 150,
                                                labels: {
                                                    style: {
                                                        fontSize: '10px',
                                                        color: '#b0bec5'
                                                    }
                                                },
                                                lineColor: '#37474f',
                                                tickColor: '#37474f',
                                                gridLineColor: '#37474f'
                                            },
                                            yAxis: {
                                                title: {
                                                    text: 'Bandwidth (MB/s)',
                                                    style: {
                                                        fontSize: '12px',
                                                        color: '#b0bec5'
                                                    }
                                                },
                                                min: 0,
                                                labels: {
                                                    style: {
                                                        fontSize: '10px',
                                                        color: '#b0bec5'
                                                    }
                                                },
                                                lineColor: '#37474f',
                                                tickColor: '#37474f',
                                                gridLineColor: '#37474f'
                                            },
                                            legend: {
                                                enabled: true,
                                                itemStyle: {
                                                    fontSize: '9px',
                                                    color: '#ffffff'
                                                },
                                                itemHoverStyle: {
                                                    color: '#ff9800'
                                                },
                                                maxHeight: 80
                                            },
                                            plotOptions: {
                                                spline: {
                                                    marker: {
                                                        enabled: false
                                                    },
                                                    lineWidth: 2
                                                }
                                            },
                                            series: Object.entries(chartData)
                                                .filter(([, data]) => data.writeData.length > 0)
                                                .map(([deviceName, data], index) => ({
                                                    name: deviceName,
                                                    data: data.writeData,
                                                    color: `hsl(${(index * 360 / Object.keys(chartData).length)}, 70%, 60%)`,
                                                    visible: true
                                                })),
                                            credits: {
                                                enabled: false
                                            },
                                            tooltip: {
                                                shared: true,
                                                valueSuffix: ' MB/s',
                                                backgroundColor: '#263238',
                                                borderColor: '#37474f',
                                                style: {
                                                    color: '#ffffff',
                                                    fontSize: '11px'
                                                }
                                            }
                                        }}
                                    />
                                </div>
                            </div>

                            {/* Total Summary Chart */}
                            <div className='column is-4'>
                                <div className='is-chart-container is-relative'>
                                    <button
                                        className='button is-small is-ghost is-chart-expand-button'
                                        onClick={() => expandChart('summary-total', 'summary-total')}
                                        title="Expand chart to full size"
                                    >
                                        <span className='icon has-text-white'>
                                            <i className='fas fa-expand'></i>
                                        </span>
                                    </button>
                                    <HighchartsReact
                                        highcharts={Highcharts}
                                        ref={ref => {
                                            if (ref) {
                                                summaryChartRefs.current['summary-total'] = ref;
                                            }
                                        }}
                                        options={{
                                            chart: {
                                                type: 'spline',
                                                animation: {
                                                    duration: 1000,
                                                    easing: 'easeOutQuart'
                                                },
                                                marginRight: 10,
                                                height: 300,
                                                backgroundColor: '#1e2a3a',
                                                style: {
                                                    fontFamily: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif'
                                                }
                                            },
                                            time: {
                                                useUTC: false
                                            },
                                            title: {
                                                text: 'Total Bandwidth (Combined)',
                                                style: {
                                                    fontSize: '14px',
                                                    fontWeight: 'bold',
                                                    color: '#ffffff'
                                                }
                                            },
                                            xAxis: {
                                                type: 'datetime',
                                                tickPixelInterval: 150,
                                                labels: {
                                                    style: {
                                                        fontSize: '10px',
                                                        color: '#b0bec5'
                                                    }
                                                },
                                                lineColor: '#37474f',
                                                tickColor: '#37474f',
                                                gridLineColor: '#37474f'
                                            },
                                            yAxis: {
                                                title: {
                                                    text: 'Bandwidth (MB/s)',
                                                    style: {
                                                        fontSize: '12px',
                                                        color: '#b0bec5'
                                                    }
                                                },
                                                min: 0,
                                                labels: {
                                                    style: {
                                                        fontSize: '10px',
                                                        color: '#b0bec5'
                                                    }
                                                },
                                                lineColor: '#37474f',
                                                tickColor: '#37474f',
                                                gridLineColor: '#37474f'
                                            },
                                            legend: {
                                                enabled: true,
                                                itemStyle: {
                                                    fontSize: '9px',
                                                    color: '#ffffff'
                                                },
                                                itemHoverStyle: {
                                                    color: '#4caf50'
                                                },
                                                maxHeight: 80
                                            },
                                            plotOptions: {
                                                spline: {
                                                    marker: {
                                                        enabled: false
                                                    },
                                                    lineWidth: 2
                                                }
                                            },
                                            series: Object.entries(chartData)
                                                .filter(([, data]) => data.totalData.length > 0)
                                                .map(([deviceName, data], index) => ({
                                                    name: deviceName,
                                                    data: data.totalData,
                                                    color: `hsl(${(index * 360 / Object.keys(chartData).length)}, 70%, 60%)`,
                                                    visible: true
                                                })),
                                            credits: {
                                                enabled: false
                                            },
                                            tooltip: {
                                                shared: true,
                                                valueSuffix: ' MB/s',
                                                backgroundColor: '#263238',
                                                borderColor: '#37474f',
                                                style: {
                                                    color: '#ffffff',
                                                    fontSize: '11px'
                                                }
                                            }
                                        }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Individual Device Charts */}
                    {diskIOStats.length > 0 && (
                        <div className='mb-5'>
                            <h5 className='title is-6 mb-3'>
                                <span className='icon-text'>
                                    <span className='icon'><i className='fas fa-chart-line'></i></span>
                                    <span>Individual Device Charts</span>
                                </span>
                            </h5>
                            <div className='columns is-multiline'>
                                {getSortedChartEntries().map(([deviceName, deviceData], chartIndex) => {
                                    const io = diskIOStats.find(io => io.device_name === deviceName);
                                    if (!io || !deviceData) return null;

                                    const chartOptions = {
                                        chart: {
                                            type: 'spline',
                                            animation: Highcharts.svg,
                                            marginRight: 10,
                                            height: 300,
                                            backgroundColor: '#1e2a3a',
                                            style: {
                                                fontFamily: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif'
                                            }
                                        },
                                        time: {
                                            useUTC: false
                                        },
                                        title: {
                                            text: deviceName,
                                            style: {
                                                fontSize: '14px',
                                                fontWeight: 'bold',
                                                color: '#ffffff'
                                            }
                                        },
                                        xAxis: {
                                            type: 'datetime',
                                            tickPixelInterval: 150,
                                            labels: {
                                                style: {
                                                    fontSize: '10px',
                                                    color: '#b0bec5'
                                                }
                                            },
                                            lineColor: '#37474f',
                                            tickColor: '#37474f',
                                            gridLineColor: '#37474f'
                                        },
                                        yAxis: {
                                            title: {
                                                text: 'Bandwidth (MB/s)',
                                                style: {
                                                    fontSize: '12px',
                                                    color: '#b0bec5'
                                                }
                                            },
                                            min: 0,
                                            labels: {
                                                style: {
                                                    fontSize: '10px',
                                                    color: '#b0bec5'
                                                }
                                            },
                                            lineColor: '#37474f',
                                            tickColor: '#37474f',
                                            gridLineColor: '#37474f'
                                        },
                                        legend: {
                                            enabled: true,
                                            itemStyle: {
                                                fontSize: '10px',
                                                color: '#ffffff'
                                            },
                                            itemHoverStyle: {
                                                color: '#64b5f6'
                                            }
                                        },
                                        plotOptions: {
                                            spline: {
                                                marker: {
                                                    enabled: false
                                                },
                                                lineWidth: 2
                                            }
                                        },
                                        series: [
                                            {
                                                name: 'Read',
                                                data: deviceData.readData || [],
                                                color: '#64b5f6',
                                                fillOpacity: 0.3,
                                                visible: seriesVisibility.read
                                            },
                                            {
                                                name: 'Write',
                                                data: deviceData.writeData || [],
                                                color: '#ff9800',
                                                fillOpacity: 0.3,
                                                visible: seriesVisibility.write
                                            },
                                            {
                                                name: 'Total',
                                                data: deviceData.totalData || [],
                                                color: '#4caf50',
                                                fillOpacity: 0.2,
                                                lineWidth: 3,
                                                visible: seriesVisibility.total
                                            }
                                        ],
                                        credits: {
                                            enabled: false
                                        },
                                        tooltip: {
                                            shared: true,
                                            valueSuffix: ' MB/s',
                                            backgroundColor: '#263238',
                                            borderColor: '#37474f',
                                            style: {
                                                color: '#ffffff',
                                                fontSize: '11px'
                                            }
                                        }
                                    };

                                    return (
                                        <div key={deviceName} className='column is-6'>
                                            <div className='is-chart-container is-relative'>
                                                <button
                                                    className='button is-small is-ghost is-chart-expand-button'
                                                    onClick={() => expandChart(deviceName, 'individual')}
                                                    title="Expand chart to full size"
                                                >
                                                    <span className='icon has-text-white'>
                                                        <i className='fas fa-expand'></i>
                                                    </span>
                                                </button>
                                                <HighchartsReact
                                                    key={`chart-${deviceName}`}
                                                    highcharts={Highcharts}
                                                    options={chartOptions}
                                                    ref={ref => {
                                                        if (ref) {
                                                            chartRefs.current[deviceName] = ref;
                                                        }
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {getSortedChartEntries().length > 0 && (
                                <div className='has-text-centered mt-3'>
                                    <p className='is-size-7 has-text-grey'>
                                        Showing all {getSortedChartEntries().length} devices with I/O activity. Sorted by: {chartSortBy}.
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Pool I/O Performance Charts */}
                    {poolIOStats.length > 0 && Object.keys(poolChartData).length > 0 && (
                        <div className='mb-5'>
                            <h5 className='title is-6 mb-3'>
                                <span className='icon-text'>
                                    <span className='icon'><i className='fas fa-database'></i></span>
                                    <span>ZFS Pool I/O Performance Charts</span>
                                </span>
                            </h5>
                            <div className='columns is-multiline'>
                                {Object.entries(poolChartData)
                                    .filter(([poolName, data]) => data.totalData.length > 0)
                                    .map(([poolName, poolData], chartIndex) => {
                                        const poolIO = poolIOStats.find(pool => pool.pool === poolName);
                                        if (!poolIO || !poolData) return null;

                                        const chartOptions = {
                                            chart: {
                                                type: 'spline',
                                                animation: Highcharts.svg,
                                                marginRight: 10,
                                                height: 300,
                                                backgroundColor: '#1e2a3a',
                                                style: {
                                                    fontFamily: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif'
                                                }
                                            },
                                            time: {
                                                useUTC: false
                                            },
                                            title: {
                                                text: `${poolName} (${poolIO.pool_type})`,
                                                style: {
                                                    fontSize: '14px',
                                                    fontWeight: 'bold',
                                                    color: '#ffffff'
                                                }
                                            },
                                            xAxis: {
                                                type: 'datetime',
                                                tickPixelInterval: 150,
                                                labels: {
                                                    style: {
                                                        fontSize: '10px',
                                                        color: '#b0bec5'
                                                    }
                                                },
                                                lineColor: '#37474f',
                                                tickColor: '#37474f',
                                                gridLineColor: '#37474f'
                                            },
                                            yAxis: {
                                                title: {
                                                    text: 'Bandwidth (MB/s)',
                                                    style: {
                                                        fontSize: '12px',
                                                        color: '#b0bec5'
                                                    }
                                                },
                                                min: 0,
                                                labels: {
                                                    style: {
                                                        fontSize: '10px',
                                                        color: '#b0bec5'
                                                    }
                                                },
                                                lineColor: '#37474f',
                                                tickColor: '#37474f',
                                                gridLineColor: '#37474f'
                                            },
                                            legend: {
                                                enabled: true,
                                                itemStyle: {
                                                    fontSize: '10px',
                                                    color: '#ffffff'
                                                },
                                                itemHoverStyle: {
                                                    color: '#64b5f6'
                                                }
                                            },
                                            plotOptions: {
                                                spline: {
                                                    marker: {
                                                        enabled: false
                                                    },
                                                    lineWidth: 2
                                                }
                                            },
                                            series: [
                                                {
                                                    name: 'Read',
                                                    data: poolData.readData || [],
                                                    color: '#64b5f6',
                                                    fillOpacity: 0.3,
                                                    visible: seriesVisibility.read
                                                },
                                                {
                                                    name: 'Write',
                                                    data: poolData.writeData || [],
                                                    color: '#ff9800',
                                                    fillOpacity: 0.3,
                                                    visible: seriesVisibility.write
                                                },
                                                {
                                                    name: 'Total',
                                                    data: poolData.totalData || [],
                                                    color: '#4caf50',
                                                    fillOpacity: 0.2,
                                                    lineWidth: 3,
                                                    visible: seriesVisibility.total
                                                }
                                            ],
                                            credits: {
                                                enabled: false
                                            },
                                            tooltip: {
                                                shared: true,
                                                valueSuffix: ' MB/s',
                                                backgroundColor: '#263238',
                                                borderColor: '#37474f',
                                                style: {
                                                    color: '#ffffff',
                                                    fontSize: '11px'
                                                }
                                            }
                                        };

                                        return (
                                            <div key={poolName} className='column is-6'>
                                                <div className='is-chart-container is-relative'>
                                                    <button
                                                        className='button is-small is-ghost is-chart-expand-button'
                                                        onClick={() => expandChart(poolName, 'pool')}
                                                        title="Expand chart to full size"
                                                    >
                                                        <span className='icon has-text-white'>
                                                            <i className='fas fa-expand'></i>
                                                        </span>
                                                    </button>
                                                    <HighchartsReact
                                                        key={`pool-chart-${poolName}`}
                                                        highcharts={Highcharts}
                                                        options={chartOptions}
                                                        ref={ref => {
                                                            if (ref) {
                                                                poolChartRefs.current[poolName] = ref;
                                                            }
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        );
                                    })}
                            </div>

                            {Object.keys(poolChartData).length > 0 && (
                                <div className='has-text-centered mt-3'>
                                    <p className='is-size-7 has-text-grey'>
                                        Showing {Object.keys(poolChartData).length} ZFS pools with I/O activity.
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ZFS ARC Performance Charts - Split into 3 focused charts */}
                    {arcStats.length > 0 && arcChartData.arcSize && (
                        <div className='mb-4'>
                            <h5 className='title is-6 mb-3'>
                                <span className='icon-text'>
                                    <span className='icon'><i className='fas fa-memory'></i></span>
                                    <span>ZFS ARC Performance & Efficiency Metrics</span>
                                </span>
                            </h5>

                            <div className='columns'>
                                {/* Memory Allocation Chart */}
                                <div className='column is-4'>
                                    <div className='is-chart-container is-relative'>
                                        <button
                                            className='button is-small is-ghost is-chart-expand-button'
                                            onClick={() => expandChart('arc-memory', 'arc-memory')}
                                            title="Expand chart to full size"
                                        >
                                            <span className='icon has-text-white'>
                                                <i className='fas fa-expand'></i>
                                            </span>
                                        </button>
                                        <HighchartsReact
                                            highcharts={Highcharts}
                                            options={{
                                                chart: {
                                                    type: 'spline',
                                                    height: 300,
                                                    backgroundColor: '#1e2a3a',
                                                    animation: {
                                                        duration: 1000,
                                                        easing: 'easeOutQuart'
                                                    },
                                                    style: {
                                                        fontFamily: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif'
                                                    }
                                                },
                                                time: {
                                                    useUTC: false
                                                },
                                                title: {
                                                    text: 'Memory Allocation',
                                                    style: {
                                                        fontSize: '14px',
                                                        fontWeight: 'bold',
                                                        color: '#ffffff'
                                                    }
                                                },
                                                xAxis: {
                                                    type: 'datetime',
                                                    labels: {
                                                        style: { color: '#b0bec5', fontSize: '10px' }
                                                    },
                                                    lineColor: '#37474f',
                                                    tickColor: '#37474f',
                                                    gridLineColor: '#37474f'
                                                },
                                                yAxis: {
                                                    title: {
                                                        text: 'Memory (GB)',
                                                        style: { color: '#b0bec5', fontSize: '12px' }
                                                    },
                                                    min: 0,
                                                    labels: {
                                                        style: { color: '#b0bec5', fontSize: '10px' }
                                                    },
                                                    lineColor: '#37474f',
                                                    tickColor: '#37474f',
                                                    gridLineColor: '#37474f'
                                                },
                                                legend: {
                                                    enabled: true,
                                                    itemStyle: {
                                                        color: '#ffffff',
                                                        fontSize: '10px'
                                                    }
                                                },
                                                plotOptions: {
                                                    spline: {
                                                        marker: { enabled: false },
                                                        lineWidth: 2
                                                    }
                                                },
                                                series: [
                                                    {
                                                        name: 'ARC Size',
                                                        data: arcChartData.arcSize || [],
                                                        color: '#64b5f6',
                                                        lineWidth: 3
                                                    },
                                                    {
                                                        name: 'Target Size',
                                                        data: arcChartData.arcTargetSize || [],
                                                        color: '#9c27b0',
                                                        lineWidth: 2,
                                                        dashStyle: 'Dash'
                                                    },
                                                    {
                                                        name: 'MRU Size',
                                                        data: arcChartData.mruSize || [],
                                                        color: '#4caf50',
                                                        lineWidth: 2
                                                    },
                                                    {
                                                        name: 'MFU Size',
                                                        data: arcChartData.mfuSize || [],
                                                        color: '#ff9800',
                                                        lineWidth: 2
                                                    }
                                                ],
                                                credits: { enabled: false },
                                                tooltip: {
                                                    shared: true,
                                                    valueSuffix: ' GB',
                                                    backgroundColor: '#263238',
                                                    borderColor: '#37474f',
                                                    style: {
                                                        color: '#ffffff',
                                                        fontSize: '11px'
                                                    }
                                                }
                                            }}
                                        />
                                    </div>
                                </div>

                                {/* Performance Efficiency Chart */}
                                <div className='column is-4'>
                                    <div className='is-chart-container is-relative'>
                                        <button
                                            className='button is-small is-ghost is-chart-expand-button'
                                            onClick={() => expandChart('arc-efficiency', 'arc-efficiency')}
                                            title="Expand chart to full size"
                                        >
                                            <span className='icon has-text-white'>
                                                <i className='fas fa-expand'></i>
                                            </span>
                                        </button>
                                        <HighchartsReact
                                            highcharts={Highcharts}
                                            options={{
                                                chart: {
                                                    type: 'spline',
                                                    height: 300,
                                                    backgroundColor: '#1e2a3a',
                                                    animation: {
                                                        duration: 1000,
                                                        easing: 'easeOutQuart'
                                                    },
                                                    style: {
                                                        fontFamily: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif'
                                                    }
                                                },
                                                time: {
                                                    useUTC: false
                                                },
                                                title: {
                                                    text: 'Cache Efficiency',
                                                    style: {
                                                        fontSize: '14px',
                                                        fontWeight: 'bold',
                                                        color: '#ffffff'
                                                    }
                                                },
                                                xAxis: {
                                                    type: 'datetime',
                                                    labels: {
                                                        style: { color: '#b0bec5', fontSize: '10px' }
                                                    },
                                                    lineColor: '#37474f',
                                                    tickColor: '#37474f',
                                                    gridLineColor: '#37474f'
                                                },
                                                yAxis: {
                                                    title: {
                                                        text: 'Efficiency (%)',
                                                        style: { color: '#b0bec5', fontSize: '12px' }
                                                    },
                                                    min: 0,
                                                    max: 100,
                                                    labels: {
                                                        style: { color: '#b0bec5', fontSize: '10px' }
                                                    },
                                                    lineColor: '#37474f',
                                                    tickColor: '#37474f',
                                                    gridLineColor: '#37474f'
                                                },
                                                legend: {
                                                    enabled: true,
                                                    itemStyle: {
                                                        color: '#ffffff',
                                                        fontSize: '10px'
                                                    }
                                                },
                                                plotOptions: {
                                                    spline: {
                                                        marker: { enabled: false },
                                                        lineWidth: 2
                                                    }
                                                },
                                                series: [
                                                    {
                                                        name: 'Hit Ratio',
                                                        data: arcChartData.hitRatio || [],
                                                        color: '#2ecc71',
                                                        lineWidth: 3
                                                    },
                                                    {
                                                        name: 'Demand Efficiency',
                                                        data: arcChartData.dataDemandEfficiency || [],
                                                        color: '#e74c3c',
                                                        lineWidth: 2
                                                    },
                                                    {
                                                        name: 'Prefetch Efficiency',
                                                        data: arcChartData.dataPrefetchEfficiency || [],
                                                        color: '#f39c12',
                                                        lineWidth: 2
                                                    }
                                                ],
                                                credits: { enabled: false },
                                                tooltip: {
                                                    shared: true,
                                                    valueSuffix: '%',
                                                    backgroundColor: '#263238',
                                                    borderColor: '#37474f',
                                                    style: {
                                                        color: '#ffffff',
                                                        fontSize: '11px'
                                                    }
                                                }
                                            }}
                                        />
                                    </div>
                                </div>

                                {/* Compression Chart */}
                                <div className='column is-4'>
                                    <div className='is-chart-container is-relative'>
                                        <button
                                            className='button is-small is-ghost is-chart-expand-button'
                                            onClick={() => expandChart('arc-compression', 'arc-compression')}
                                            title="Expand chart to full size"
                                        >
                                            <span className='icon has-text-white'>
                                                <i className='fas fa-expand'></i>
                                            </span>
                                        </button>
                                        <HighchartsReact
                                            highcharts={Highcharts}
                                            options={{
                                                chart: {
                                                    type: 'spline',
                                                    height: 300,
                                                    backgroundColor: '#1e2a3a',
                                                    animation: {
                                                        duration: 1000,
                                                        easing: 'easeOutQuart'
                                                    },
                                                    style: {
                                                        fontFamily: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif'
                                                    }
                                                },
                                                time: {
                                                    useUTC: false
                                                },
                                                title: {
                                                    text: 'Compression Effectiveness',
                                                    style: {
                                                        fontSize: '14px',
                                                        fontWeight: 'bold',
                                                        color: '#ffffff'
                                                    }
                                                },
                                                xAxis: {
                                                    type: 'datetime',
                                                    labels: {
                                                        style: { color: '#b0bec5', fontSize: '10px' }
                                                    },
                                                    lineColor: '#37474f',
                                                    tickColor: '#37474f',
                                                    gridLineColor: '#37474f'
                                                },
                                                yAxis: {
                                                    title: {
                                                        text: 'Compression Ratio (x)',
                                                        style: { color: '#b0bec5', fontSize: '12px' }
                                                    },
                                                    min: 1,
                                                    labels: {
                                                        style: { color: '#b0bec5', fontSize: '10px' }
                                                    },
                                                    lineColor: '#37474f',
                                                    tickColor: '#37474f',
                                                    gridLineColor: '#37474f'
                                                },
                                                legend: {
                                                    enabled: true,
                                                    itemStyle: {
                                                        color: '#ffffff',
                                                        fontSize: '10px'
                                                    }
                                                },
                                                plotOptions: {
                                                    spline: {
                                                        marker: { enabled: false },
                                                        lineWidth: 3
                                                    }
                                                },
                                                series: [
                                                    {
                                                        name: 'Compression Ratio',
                                                        data: arcChartData.compressionRatio || [],
                                                        color: '#8e44ad',
                                                        lineWidth: 3
                                                    }
                                                ],
                                                credits: { enabled: false },
                                                tooltip: {
                                                    shared: true,
                                                    valueSuffix: 'x',
                                                    backgroundColor: '#263238',
                                                    borderColor: '#37474f',
                                                    style: {
                                                        color: '#ffffff',
                                                        fontSize: '11px'
                                                    }
                                                }
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {diskIOStats.length === 0 && arcStats.length === 0 && (
                        <div className='notification is-info'>
                            <p>No performance data available for charting. Charts will appear when real-time data is collected.</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default StorageCharts;
