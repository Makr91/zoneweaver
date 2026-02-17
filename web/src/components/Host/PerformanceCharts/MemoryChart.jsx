import { HighchartsReact } from "highcharts-react-official";
import Highcharts from "../../Highcharts";

const MemoryChart = ({
  memoryChartData,
  memorySeriesVisibility,
  expandChart,
}) => (
  <div className="column is-4">
    <div className="card has-background-dark">
      <header className="card-header has-background-grey-darker">
        <p className="card-header-title has-text-white">
          <span className="icon-text">
            <span className="icon">
              <i className="fas fa-memory" />
            </span>
            <span>Memory Usage</span>
          </span>
        </p>
        <div className="card-header-icon">
          <div className="field is-grouped">
            <div className="control">
              <button
                className="button is-small is-light"
                onClick={() => expandChart("memory", "memory")}
                title="Expand chart to full size"
              >
                <span className="icon">
                  <i className="fas fa-expand" />
                </span>
              </button>
            </div>
          </div>
        </div>
      </header>
      <div className="card-content p-2">
        {memoryChartData.used.length > 0 ? (
          <div>
            <HighchartsReact
              highcharts={Highcharts}
              options={{
                chart: {
                  type: "spline",
                  height: 200,
                  backgroundColor: "#1e2a3a",
                },
                time: {
                  useUTC: false,
                },
                title: {
                  text: "Memory Usage",
                  style: { color: "#ffffff", fontSize: "12px" },
                },
                xAxis: {
                  type: "datetime",
                  labels: { style: { color: "#b0bec5" } },
                },
                yAxis: {
                  title: { text: "GB", style: { color: "#b0bec5" } },
                  min: 0,
                },
                legend: {
                  enabled: true,
                  itemStyle: { color: "#ffffff", fontSize: "10px" },
                },
                series: [
                  {
                    name: "Used",
                    data: memoryChartData.used,
                    color: "#f7a35c",
                    visible: memorySeriesVisibility.used,
                    marker: { enabled: false },
                  },
                  {
                    name: "Free",
                    data: memoryChartData.free,
                    color: "#90ed7d",
                    visible: memorySeriesVisibility.free,
                    marker: { enabled: false },
                  },
                  {
                    name: "Cached",
                    data: memoryChartData.cached,
                    color: "#7cb5ec",
                    visible: memorySeriesVisibility.cached,
                    marker: { enabled: false },
                  },
                ],
                credits: { enabled: false },
                tooltip: { shared: true, valueSuffix: " GB" },
              }}
            />
          </div>
        ) : (
          <div className="has-text-centered p-4">
            <p className="has-text-grey">No memory data available</p>
          </div>
        )}
      </div>
    </div>
  </div>
);

export default MemoryChart;
