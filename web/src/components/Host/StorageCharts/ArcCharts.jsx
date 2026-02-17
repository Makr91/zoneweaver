import { HighchartsReact } from "highcharts-react-official";
import PropTypes from "prop-types";

import Highcharts from "../../Highcharts";

import { createChartOptions } from "./chartDefaults";

const ArcCharts = ({ arcChartData, arcStats, expandChart }) => {
  if (arcStats.length === 0 || !arcChartData.arcSize) {
    return null;
  }

  return (
    <div className="mb-4">
      <h5 className="title is-6 mb-3">
        <span className="icon-text">
          <span className="icon">
            <i className="fas fa-memory" />
          </span>
          <span>ZFS ARC Performance & Efficiency Metrics</span>
        </span>
      </h5>

      <div className="columns">
        {/* Memory Allocation Chart */}
        <div className="column is-4">
          <div className="is-chart-container is-relative">
            <button
              className="button is-small is-ghost is-chart-expand-button"
              onClick={() => expandChart("arc-memory", "arc-memory")}
              title="Expand chart to full size"
            >
              <span className="icon has-text-white">
                <i className="fas fa-expand" />
              </span>
            </button>
            <HighchartsReact
              highcharts={Highcharts}
              options={createChartOptions({
                title: "Memory Allocation",
                yAxisTitle: "Memory (GB)",
                tooltipSuffix: " GB",
                series: [
                  {
                    name: "ARC Size",
                    data: arcChartData.arcSize || [],
                    color: "#64b5f6",
                    lineWidth: 3,
                  },
                  {
                    name: "Target Size",
                    data: arcChartData.arcTargetSize || [],
                    color: "#9c27b0",
                    lineWidth: 2,
                    dashStyle: "Dash",
                  },
                  {
                    name: "MRU Size",
                    data: arcChartData.mruSize || [],
                    color: "#4caf50",
                    lineWidth: 2,
                  },
                  {
                    name: "MFU Size",
                    data: arcChartData.mfuSize || [],
                    color: "#ff9800",
                    lineWidth: 2,
                  },
                ],
              })}
            />
          </div>
        </div>

        {/* Performance Efficiency Chart */}
        <div className="column is-4">
          <div className="is-chart-container is-relative">
            <button
              className="button is-small is-ghost is-chart-expand-button"
              onClick={() => expandChart("arc-efficiency", "arc-efficiency")}
              title="Expand chart to full size"
            >
              <span className="icon has-text-white">
                <i className="fas fa-expand" />
              </span>
            </button>
            <HighchartsReact
              highcharts={Highcharts}
              options={createChartOptions({
                title: "Cache Efficiency",
                yAxisTitle: "Efficiency (%)",
                yAxisMax: 100,
                tooltipSuffix: "%",
                series: [
                  {
                    name: "Hit Ratio",
                    data: arcChartData.hitRatio || [],
                    color: "#2ecc71",
                    lineWidth: 3,
                  },
                  {
                    name: "Demand Efficiency",
                    data: arcChartData.dataDemandEfficiency || [],
                    color: "#e74c3c",
                    lineWidth: 2,
                  },
                  {
                    name: "Prefetch Efficiency",
                    data: arcChartData.dataPrefetchEfficiency || [],
                    color: "#f39c12",
                    lineWidth: 2,
                  },
                ],
              })}
            />
          </div>
        </div>

        {/* Compression Chart */}
        <div className="column is-4">
          <div className="is-chart-container is-relative">
            <button
              className="button is-small is-ghost is-chart-expand-button"
              onClick={() => expandChart("arc-compression", "arc-compression")}
              title="Expand chart to full size"
            >
              <span className="icon has-text-white">
                <i className="fas fa-expand" />
              </span>
            </button>
            <HighchartsReact
              highcharts={Highcharts}
              options={createChartOptions({
                title: "Compression Effectiveness",
                yAxisTitle: "Compression Ratio (x)",
                yAxisMin: 1,
                tooltipSuffix: "x",
                series: [
                  {
                    name: "Compression Ratio",
                    data: arcChartData.compressionRatio || [],
                    color: "#8e44ad",
                    lineWidth: 3,
                  },
                ],
              })}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

ArcCharts.propTypes = {
  arcChartData: PropTypes.object.isRequired,
  arcStats: PropTypes.array.isRequired,
  expandChart: PropTypes.func.isRequired,
};

export default ArcCharts;
