import React from 'react';
import Highcharts from '../Highcharts';
import { HighchartsReact } from 'highcharts-react-official';

const BandwidthCharts = ({
    chartData,
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
    chartRefs
}) => {
    if (Object.keys(chartData).length === 0) {
        return null;
    }

    return (
        <div className='box mb-4'>
            <div className='level is-mobile mb-3'>
                <div className='level-left'>
                    <h4 className='title is-5 mb-0'>
                        <span className='icon-text'>
                            <span className='icon'><i className='fas fa-chart-area'></i></span>
                            <span>Real-Time Bandwidth Charts</span>
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
                                    <option value="name">Interface Name</option>
                                    <option value="rx">RX Bandwidth</option>
                                    <option value="tx">TX Bandwidth</option>
                                </select>
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
                    {/* Summary Charts - All Interfaces Combined */}
                    <div className='mb-5'>
                        <h5 className='title is-6 mb-3'>
                            <span className='icon-text'>
                                <span className='icon'><i className='fas fa-layer-group'></i></span>
                                <span>All Interfaces Summary</span>
                            </span>
                        </h5>
                        <div className='columns'>
                            {/* RX Summary Chart */}
                            <div className='column is-4'>
                                <div className='is-chart-container is-relative'>
                                    <button
                                        className='button is-small is-ghost is-chart-expand-button'
                                        onClick={() => expandChart('summary-rx', 'summary-rx')}
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
                                                summaryChartRefs.current['summary-rx'] = ref;
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
                                                text: 'RX Bandwidth (Download)',
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
                                                    text: 'Bandwidth (Mbps)',
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
                                                .filter(([, data]) => data.rxData.length > 0)
                                                .map(([interfaceName, data], index) => ({
                                                    name: interfaceName,
                                                    data: data.rxData,
                                                    color: `hsl(${(index * 360 / Object.keys(chartData).length)}, 70%, 60%)`,
                                                    visible: true
                                                })),
                                            credits: {
                                                enabled: false
                                            },
                                            tooltip: {
                                                shared: true,
                                                valueSuffix: ' Mbps',
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

                            {/* TX Summary Chart */}
                            <div className='column is-4'>
                                <div
                                    style={{
                                        borderRadius: '8px',
                                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
                                        backgroundColor: '#1e2a3a',
                                        padding: '10px',
                                        border: '1px solid #37474f',
                                        position: 'relative'
                                    }}
                                >
                                    <button
                                        className='button is-small is-ghost'
                                        style={{
                                            position: 'absolute',
                                            top: '5px',
                                            right: '5px',
                                            zIndex: 1000,
                                            backgroundColor: 'rgba(0,0,0,0.7)',
                                            border: 'none'
                                        }}
                                        onClick={() => expandChart('summary-tx', 'summary-tx')}
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
                                                summaryChartRefs.current['summary-tx'] = ref;
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
                                                text: 'TX Bandwidth (Upload)',
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
                                                    text: 'Bandwidth (Mbps)',
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
                                                .filter(([, data]) => data.txData.length > 0)
                                                .map(([interfaceName, data], index) => ({
                                                    name: interfaceName,
                                                    data: data.txData,
                                                    color: `hsl(${(index * 360 / Object.keys(chartData).length)}, 70%, 60%)`,
                                                    visible: true
                                                })),
                                            credits: {
                                                enabled: false
                                            },
                                            tooltip: {
                                                shared: true,
                                                valueSuffix: ' Mbps',
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
                                <div
                                    style={{
                                        borderRadius: '8px',
                                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
                                        backgroundColor: '#1e2a3a',
                                        padding: '10px',
                                        border: '1px solid #37474f',
                                        position: 'relative'
                                    }}
                                >
                                    <button
                                        className='button is-small is-ghost'
                                        style={{
                                            position: 'absolute',
                                            top: '5px',
                                            right: '5px',
                                            zIndex: 1000,
                                            backgroundColor: 'rgba(0,0,0,0.7)',
                                            border: 'none'
                                        }}
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
                                                    text: 'Bandwidth (Mbps)',
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
                                                .map(([interfaceName, data], index) => ({
                                                    name: interfaceName,
                                                    data: data.totalData,
                                                    color: `hsl(${(index * 360 / Object.keys(chartData).length)}, 70%, 60%)`,
                                                    visible: true
                                                })),
                                            credits: {
                                                enabled: false
                                            },
                                            tooltip: {
                                                shared: true,
                                                valueSuffix: ' Mbps',
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

                    {/* Individual Interface Charts */}
                    <div>
                        <h5 className='title is-6 mb-3'>
                            <span className='icon-text'>
                                <span className='icon'><i className='fas fa-chart-line'></i></span>
                                <span>Individual Interface Charts</span>
                            </span>
                        </h5>
                        <div className='columns is-multiline'>
                            {getSortedChartEntries()
                                .map(([interfaceName, data], chartIndex) => {
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
                                            text: interfaceName,
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
                                                text: 'Bandwidth (Mbps)',
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
                                                name: 'RX',
                                                data: data.rxData,
                                                color: '#64b5f6',
                                                fillOpacity: 0.3
                                            },
                                            {
                                                name: 'TX',
                                                data: data.txData,
                                                color: '#ff9800',
                                                fillOpacity: 0.3
                                            },
                                            {
                                                name: 'Total',
                                                data: data.totalData,
                                                color: '#4caf50',
                                                fillOpacity: 0.2,
                                                lineWidth: 3
                                            }
                                        ],
                                        credits: {
                                            enabled: false
                                        },
                                        tooltip: {
                                            shared: true,
                                            valueSuffix: ' Mbps',
                                            backgroundColor: '#263238',
                                            borderColor: '#37474f',
                                            style: {
                                                color: '#ffffff',
                                                fontSize: '11px'
                                            }
                                        }
                                    };

                                    return (
                                        <div key={`chart-${interfaceName}`} className='column is-6'>
                                            <div
                                                style={{
                                                    borderRadius: '8px',
                                                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
                                                    backgroundColor: '#1e2a3a',
                                                    padding: '10px',
                                                    border: '1px solid #37474f',
                                                    position: 'relative'
                                                }}
                                            >
                                                <button
                                                    className='button is-small is-ghost'
                                                    style={{
                                                        position: 'absolute',
                                                        top: '5px',
                                                        right: '5px',
                                                        zIndex: 1000,
                                                        backgroundColor: 'rgba(0,0,0,0.7)',
                                                        border: 'none'
                                                    }}
                                                    onClick={() => expandChart(interfaceName, 'individual')}
                                                    title="Expand chart to full size"
                                                >
                                                    <span className='icon has-text-white'>
                                                        <i className='fas fa-expand'></i>
                                                    </span>
                                                </button>
                                                <HighchartsReact
                                                    key={`chart-${interfaceName}`}
                                                    highcharts={Highcharts}
                                                    options={chartOptions}
                                                    ref={ref => {
                                                        if (ref) {
                                                            chartRefs.current[interfaceName] = ref;
                                                        }
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                        </div>
                    </div>
                </div>
            )}
            {!sectionsCollapsed.charts && Object.keys(chartData).length === 0 && (
                <div className='notification is-info'>
                    <p>No chart data available yet. Data will appear as the system collects bandwidth measurements.</p>
                </div>
            )}
        </div>
    );
};

export default BandwidthCharts;
