import Highcharts from '../../Highcharts';
import { HighchartsReact } from 'highcharts-react-official';
import { ContentModal } from '../../common';

const ExpandedChartModal = ({ 
  expandedChart, 
  closeExpandedChart, 
  expandedChartType, 
  currentServer,
  storageSeriesVisibility,
  setStorageSeriesVisibility,
  networkSeriesVisibility,
  setNetworkSeriesVisibility,
  cpuSeriesVisibility,
  setCpuSeriesVisibility,
  memorySeriesVisibility,
  setMemorySeriesVisibility,
  chartData,
  arcChartData,
  networkChartData,
  cpuChartData,
  memoryChartData
}) => {
  if (!expandedChart) return null;

  // Get modal title based on chart type
  const getModalTitle = () => {
    const baseTitle = expandedChartType === 'storage-io' ? 'Storage I/O Performance' :
                     expandedChartType === 'arc' ? 'ZFS ARC Performance' :
                     expandedChartType === 'network' ? 'Network Performance' : 
                     expandedChartType === 'cpu' ? 'CPU Performance' :
                     expandedChartType === 'memory' ? 'Memory Performance' :
                     'Performance';
    return `${baseTitle} - ${currentServer?.hostname}`;
  };

  // Get modal icon based on chart type  
  const getModalIcon = () => {
    return expandedChartType === 'storage-io' ? 'fa-hdd' :
           expandedChartType === 'arc' ? 'fa-memory' :
           expandedChartType === 'network' ? 'fa-network-wired' :
           expandedChartType === 'cpu' ? 'fa-microchip' :
           expandedChartType === 'memory' ? 'fa-memory' :
           'fa-chart-area';
  };

  return (
    <ContentModal
      isOpen={!!expandedChart}
      onClose={closeExpandedChart}
      title={getModalTitle()}
      icon={`fas ${getModalIcon()}`}
    >
          {/* Series Visibility Controls */}
          {(expandedChartType === 'storage-io' || expandedChartType === 'network' || expandedChartType === 'cpu' || expandedChartType === 'memory') && (
            <div className='mb-4'>
              <div className='field is-grouped is-grouped-centered'>
                {expandedChartType === 'storage-io' && (
                  <>
                    <div className='control'>
                      <button 
                        className={`button is-small ${storageSeriesVisibility.read ? 'is-info' : 'is-dark'}`}
                        onClick={() => setStorageSeriesVisibility(prev => ({...prev, read: !prev.read}))}
                        title="Toggle Read bandwidth visibility"
                      >
                        <span className='icon'><i className={`fas ${storageSeriesVisibility.read ? 'fa-eye' : 'fa-eye-slash'}`}></i></span>
                        <span>Read</span>
                      </button>
                    </div>
                    <div className='control'>
                      <button 
                        className={`button is-small ${storageSeriesVisibility.write ? 'is-warning' : 'is-dark'}`}
                        onClick={() => setStorageSeriesVisibility(prev => ({...prev, write: !prev.write}))}
                        title="Toggle Write bandwidth visibility"
                      >
                        <span className='icon'><i className={`fas ${storageSeriesVisibility.write ? 'fa-eye' : 'fa-eye-slash'}`}></i></span>
                        <span>Write</span>
                      </button>
                    </div>
                    <div className='control'>
                      <button 
                        className={`button is-small ${storageSeriesVisibility.total ? 'is-success' : 'is-dark'}`}
                        onClick={() => setStorageSeriesVisibility(prev => ({...prev, total: !prev.total}))}
                        title="Toggle Total bandwidth visibility"
                      >
                        <span className='icon'><i className={`fas ${storageSeriesVisibility.total ? 'fa-eye' : 'fa-eye-slash'}`}></i></span>
                        <span>Total</span>
                      </button>
                    </div>
                  </>
                )}
                {expandedChartType === 'network' && (
                  <>
                    <div className='control'>
                      <button 
                        className={`button is-small ${networkSeriesVisibility.read ? 'is-info' : 'is-dark'}`}
                        onClick={() => setNetworkSeriesVisibility(prev => ({...prev, read: !prev.read}))}
                        title="Toggle RX bandwidth visibility"
                      >
                        <span className='icon'><i className={`fas ${networkSeriesVisibility.read ? 'fa-eye' : 'fa-eye-slash'}`}></i></span>
                        <span>RX</span>
                      </button>
                    </div>
                    <div className='control'>
                      <button 
                        className={`button is-small ${networkSeriesVisibility.write ? 'is-warning' : 'is-dark'}`}
                        onClick={() => setNetworkSeriesVisibility(prev => ({...prev, write: !prev.write}))}
                        title="Toggle TX bandwidth visibility"
                      >
                        <span className='icon'><i className={`fas ${networkSeriesVisibility.write ? 'fa-eye' : 'fa-eye-slash'}`}></i></span>
                        <span>TX</span>
                      </button>
                    </div>
                    <div className='control'>
                      <button 
                        className={`button is-small ${networkSeriesVisibility.total ? 'is-success' : 'is-dark'}`}
                        onClick={() => setNetworkSeriesVisibility(prev => ({...prev, total: !prev.total}))}
                        title="Toggle Total bandwidth visibility"
                      >
                        <span className='icon'><i className={`fas ${networkSeriesVisibility.total ? 'fa-eye' : 'fa-eye-slash'}`}></i></span>
                        <span>Total</span>
                      </button>
                    </div>
                  </>
                )}
                {expandedChartType === 'cpu' && (
                  <>
                    <div className='control'>
                      <button
                        className={`button is-small ${cpuSeriesVisibility.overall ? 'is-info' : 'is-dark'}`}
                        onClick={() => setCpuSeriesVisibility(prev => ({...prev, overall: !prev.overall}))}
                        title="Toggle Historical Average"
                      >
                        Avg
                      </button>
                    </div>
                    <div className='control'>
                      <button
                        className={`button is-small ${cpuSeriesVisibility.cores ? 'is-info' : 'is-dark'}`}
                        onClick={() => setCpuSeriesVisibility(prev => ({...prev, cores: !prev.cores}))}
                        title="Toggle All Cores"
                      >
                        Cores
                      </button>
                    </div>
                    <div className='control'>
                      <button
                        className={`button is-small ${cpuSeriesVisibility.load ? 'is-info' : 'is-dark'}`}
                        onClick={() => setCpuSeriesVisibility(prev => ({...prev, load: !prev.load}))}
                        title="Toggle Load"
                      >
                        Load
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Expanded Chart */}
          <div className="zw-expanded-chart-container">
            {expandedChartType === 'storage-io' && (
              <HighchartsReact 
                highcharts={Highcharts} 
                options={{
                  chart: { type: 'spline', animation: Highcharts.svg, marginRight: 10, height: 'calc(90vh - 200px)', backgroundColor: '#1e2a3a', style: { fontFamily: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif' } },
                  time: { useUTC: false },
                  title: { text: 'ZFS Pool I/O Performance - Individual Pools', style: { fontSize: '16px', fontWeight: 'bold', color: '#ffffff' } },
                  xAxis: { type: 'datetime', tickPixelInterval: 150, labels: { style: { fontSize: '12px', color: '#b0bec5' } }, lineColor: '#37474f', tickColor: '#37474f', gridLineColor: '#37474f' },
                  yAxis: { title: { text: 'Bandwidth (MB/s)', style: { fontSize: '14px', color: '#b0bec5' } }, min: 0, labels: { style: { fontSize: '12px', color: '#b0bec5' } }, lineColor: '#37474f', tickColor: '#37474f', gridLineColor: '#37474f' },
                  legend: { enabled: true, itemStyle: { fontSize: '12px', color: '#ffffff' }, layout: 'horizontal', align: 'center', verticalAlign: 'bottom' },
                  plotOptions: { spline: { marker: { enabled: false }, lineWidth: 2 } },
                  series: Object.entries(chartData)
                    .filter(([, data]) => data.totalData && data.totalData.length > 0)
                    .flatMap(([poolName, data], poolIndex) => {
                      const baseHue = (poolIndex * 360 / Object.keys(chartData).length);
                      return [
                        { name: `${poolName} Read`, data: data.readData || [], color: `hsl(${baseHue}, 70%, 75%)`, visible: storageSeriesVisibility.read, dashStyle: 'Solid', lineWidth: 2 },
                        { name: `${poolName} Write`, data: data.writeData || [], color: `hsl(${baseHue}, 70%, 50%)`, visible: storageSeriesVisibility.write, dashStyle: 'Dash', lineWidth: 2 },
                        { name: `${poolName} Total`, data: data.totalData || [], color: `hsl(${baseHue}, 70%, 35%)`, visible: storageSeriesVisibility.total, dashStyle: 'Solid', lineWidth: 3 }
                      ];
                    }),
                  credits: { enabled: false },
                  tooltip: { shared: true, valueSuffix: ' MB/s', backgroundColor: '#263238', borderColor: '#37474f', style: { color: '#ffffff', fontSize: '12px' } }
                }}
              />
            )}

            {expandedChartType === 'arc' && (
              <HighchartsReact 
                highcharts={Highcharts} 
                options={{
                  chart: { type: 'spline', animation: Highcharts.svg, marginRight: 10, height: 'calc(90vh - 200px)', backgroundColor: '#1e2a3a', style: { fontFamily: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif' } },
                  time: { useUTC: false },
                  title: { text: 'ZFS ARC Performance Details', style: { fontSize: '16px', fontWeight: 'bold', color: '#ffffff' } },
                  xAxis: { type: 'datetime', tickPixelInterval: 150, labels: { style: { fontSize: '12px', color: '#b0bec5' } }, lineColor: '#37474f', tickColor: '#37474f', gridLineColor: '#37474f' },
                  yAxis: [{ title: { text: 'Size (GB)', style: { fontSize: '14px', color: '#b0bec5' } }, min: 0, labels: { style: { fontSize: '12px', color: '#b0bec5' } }, lineColor: '#37474f', tickColor: '#37474f', gridLineColor: '#37474f' }, { title: { text: 'Hit Rate (%)', style: { fontSize: '14px', color: '#b0bec5' } }, min: 0, max: 100, opposite: true, labels: { style: { fontSize: '12px', color: '#b0bec5' } }, lineColor: '#37474f', tickColor: '#37474f', gridLineColor: 'transparent' }],
                  legend: { enabled: true, itemStyle: { fontSize: '12px', color: '#ffffff' }, layout: 'horizontal', align: 'center', verticalAlign: 'bottom' },
                  plotOptions: { spline: { marker: { enabled: false }, lineWidth: 3 } },
                  series: [
                    { name: 'ARC Size', data: arcChartData.sizeData || [], color: '#3498db', yAxis: 0, lineWidth: 3 },
                    { name: 'ARC Target', data: arcChartData.targetData || [], color: '#e74c3c', yAxis: 0, dashStyle: 'Dash', lineWidth: 3 },
                    { name: 'Hit Rate', data: arcChartData.hitRateData || [], color: '#2ecc71', yAxis: 1, lineWidth: 4 }
                  ],
                  credits: { enabled: false },
                  tooltip: { shared: true, backgroundColor: '#263238', borderColor: '#37474f', style: { color: '#ffffff', fontSize: '12px' }, formatter: function() { let tooltipText = '<b>' + Highcharts.dateFormat('%Y-%m-%d %H:%M:%S', this.x) + '</b><br/>'; this.points.forEach(function(point) { if (point.series.name === 'Hit Rate') { tooltipText += point.series.name + ': <b>' + point.y.toFixed(1) + '%</b><br/>'; } else { tooltipText += point.series.name + ': <b>' + point.y.toFixed(2) + ' GB</b><br/>'; } }); return tooltipText; } }
                }}
              />
            )}

            {expandedChartType === 'network' && (
              <HighchartsReact 
                highcharts={Highcharts} 
                options={{
                  chart: { type: 'spline', animation: Highcharts.svg, marginRight: 10, height: 'calc(90vh - 200px)', backgroundColor: '#1e2a3a', style: { fontFamily: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif' } },
                  time: { useUTC: false },
                  title: { text: 'Network Bandwidth Performance - Real Interfaces Only', style: { fontSize: '16px', fontWeight: 'bold', color: '#ffffff' } },
                  xAxis: { type: 'datetime', tickPixelInterval: 150, labels: { style: { fontSize: '12px', color: '#b0bec5' } }, lineColor: '#37474f', tickColor: '#37474f', gridLineColor: '#37474f' },
                  yAxis: { title: { text: 'Bandwidth (Mbps)', style: { fontSize: '14px', color: '#b0bec5' } }, min: 0, labels: { style: { fontSize: '12px', color: '#b0bec5' } }, lineColor: '#37474f', tickColor: '#37474f', gridLineColor: '#37474f' },
                  legend: { enabled: true, itemStyle: { fontSize: '12px', color: '#ffffff' }, layout: 'horizontal', align: 'center', verticalAlign: 'bottom' },
                  plotOptions: { spline: { marker: { enabled: false }, lineWidth: 2 } },
                  series: Object.entries(networkChartData)
                    .filter(([, data]) => data.totalData && data.totalData.length > 0)
                    .flatMap(([interfaceName, data], interfaceIndex) => {
                      const baseHue = (interfaceIndex * 360 / Object.keys(networkChartData).length);
                      return [
                        { name: `${interfaceName} RX`, data: data.rxData || [], color: `hsl(${baseHue}, 70%, 75%)`, visible: networkSeriesVisibility.read, dashStyle: 'Solid', lineWidth: 2 },
                        { name: `${interfaceName} TX`, data: data.txData || [], color: `hsl(${baseHue}, 70%, 50%)`, visible: networkSeriesVisibility.write, dashStyle: 'Dash', lineWidth: 2 },
                        { name: `${interfaceName} Total`, data: data.totalData || [], color: `hsl(${baseHue}, 70%, 35%)`, visible: networkSeriesVisibility.total, dashStyle: 'Solid', lineWidth: 3 }
                      ];
                    }),
                  credits: { enabled: false },
                  tooltip: { shared: true, valueSuffix: ' Mbps', backgroundColor: '#263238', borderColor: '#37474f', style: { color: '#ffffff', fontSize: '12px' } }
                }}
              />
            )}

            {expandedChartType === 'cpu' && (
              <HighchartsReact
                highcharts={Highcharts}
                options={{
                  chart: { type: 'spline', height: 'calc(90vh - 200px)', backgroundColor: '#1e2a3a' },
                  title: { text: 'CPU Performance', style: { color: '#ffffff', fontSize: '16px' } },
                  xAxis: { type: 'datetime', labels: { style: { color: '#b0bec5' } } },
                  yAxis: [{ title: { text: 'Usage %', style: { color: '#b0bec5' } }, min: 0, max: 100 }, { title: { text: 'Load', style: { color: '#b0bec5' } }, opposite: true }],
                  legend: { enabled: true, itemStyle: { color: '#ffffff' } },
                  series: [
                    { name: 'Overall Usage', data: cpuChartData.overall, yAxis: 0, color: '#7cb5ec', lineWidth: 3, visible: cpuSeriesVisibility.overall, marker: { enabled: false } },
                    ...Object.entries(cpuChartData.cores).map(([core, data]) => ({
                      name: core,
                      data: data,
                      yAxis: 0,
                      lineWidth: 1,
                      color: `rgba(124, 181, 236, 0.5)`,
                      visible: cpuSeriesVisibility.cores,
                      marker: { enabled: false }
                    })),
                    { name: 'Load 1m', data: cpuChartData.load['1min'], yAxis: 1, color: '#f7a35c', dashStyle: 'shortdot', visible: cpuSeriesVisibility.load, marker: { enabled: false } },
                    { name: 'Load 5m', data: cpuChartData.load['5min'], yAxis: 1, color: '#90ed7d', dashStyle: 'shortdot', visible: cpuSeriesVisibility.load, marker: { enabled: false } },
                    { name: 'Load 15m', data: cpuChartData.load['15min'], yAxis: 1, color: '#f15c80', dashStyle: 'shortdot', visible: cpuSeriesVisibility.load, marker: { enabled: false } }
                  ],
                  credits: { enabled: false },
                  tooltip: { shared: true }
                }}
              />
            )}

            {expandedChartType === 'memory' && (
              <HighchartsReact
                highcharts={Highcharts}
                options={{
                  chart: { type: 'spline', height: 'calc(90vh - 200px)', backgroundColor: '#1e2a3a' },
                  title: { text: 'Memory Usage', style: { color: '#ffffff', fontSize: '16px' } },
                  xAxis: { type: 'datetime', labels: { style: { color: '#b0bec5' } } },
                  yAxis: { title: { text: 'GB', style: { color: '#b0bec5' } }, min: 0 },
                  legend: { enabled: true, itemStyle: { color: '#ffffff' } },
                  series: [
                    { name: 'Used', data: memoryChartData.used, color: '#f7a35c', visible: memorySeriesVisibility.used, marker: { enabled: false } },
                    { name: 'Free', data: memoryChartData.free, color: '#90ed7d', visible: memorySeriesVisibility.free, marker: { enabled: false } },
                    { name: 'Cached', data: memoryChartData.cached, color: '#7cb5ec', visible: memorySeriesVisibility.cached, marker: { enabled: false } }
                  ],
                  credits: { enabled: false },
                  tooltip: { shared: true, valueSuffix: ' GB' }
                }}
              />
            )}
          </div>
    </ContentModal>
  );
};

export default ExpandedChartModal;
