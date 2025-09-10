import { HighchartsReact } from "highcharts-react-official";
import React from "react";

import Highcharts from "../../Highcharts";

const CpuChart = ({
  cpuChartData,
  cpuSeriesVisibility,
  setCpuSeriesVisibility,
  expandChart,
}) => (
  <div className="column is-4">
    <div className="card has-background-dark">
      <header className="card-header has-background-grey-darker">
        <p className="card-header-title has-text-white">
          <span className="icon-text">
            <span className="icon">
              <i className="fas fa-microchip" />
            </span>
            <span>CPU Usage</span>
          </span>
        </p>
        <div className="card-header-icon">
          <div className="field is-grouped">
            <div className="control">
              <button
                className={`button is-small ${cpuSeriesVisibility.overall ? "is-info" : "is-dark"}`}
                onClick={() =>
                  setCpuSeriesVisibility((prev) => ({
                    ...prev,
                    overall: !prev.overall,
                  }))
                }
                title="Toggle Historical Average"
              >
                Avg
              </button>
            </div>
            <div className="control">
              <button
                className={`button is-small ${cpuSeriesVisibility.cores ? "is-info" : "is-dark"}`}
                onClick={() =>
                  setCpuSeriesVisibility((prev) => ({
                    ...prev,
                    cores: !prev.cores,
                  }))
                }
                title="Toggle All Cores"
              >
                Cores
              </button>
            </div>
            <div className="control">
              <button
                className={`button is-small ${cpuSeriesVisibility.load ? "is-info" : "is-dark"}`}
                onClick={() =>
                  setCpuSeriesVisibility((prev) => ({
                    ...prev,
                    load: !prev.load,
                  }))
                }
                title="Toggle Load"
              >
                Load
              </button>
            </div>
            <div className="control">
              <button
                className="button is-small is-light"
                onClick={() => expandChart("cpu", "cpu")}
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
        {cpuChartData.overall.length > 0 ? (
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
                  text: "CPU Performance",
                  style: { color: "#ffffff", fontSize: "12px" },
                },
                xAxis: {
                  type: "datetime",
                  labels: { style: { color: "#b0bec5" } },
                },
                yAxis: [
                  {
                    title: { text: "Usage %", style: { color: "#b0bec5" } },
                    min: 0,
                    max: 100,
                  },
                  {
                    title: { text: "Load", style: { color: "#b0bec5" } },
                    opposite: true,
                  },
                ],
                legend: { enabled: false },
                series: [
                  {
                    name: "Overall Usage",
                    data: cpuChartData.overall,
                    yAxis: 0,
                    color: "#7cb5ec",
                    lineWidth: 3,
                    visible: cpuSeriesVisibility.overall,
                    marker: { enabled: false },
                  },
                  ...Object.entries(cpuChartData.cores).map(([core, data]) => ({
                    name: core,
                    data,
                    yAxis: 0,
                    lineWidth: 1,
                    color: `rgba(124, 181, 236, 0.5)`,
                    visible: cpuSeriesVisibility.cores,
                    marker: { enabled: false },
                  })),
                  {
                    name: "Load 1m",
                    data: cpuChartData.load["1min"],
                    yAxis: 1,
                    color: "#f7a35c",
                    dashStyle: "shortdot",
                    visible: cpuSeriesVisibility.load,
                    marker: { enabled: false },
                  },
                  {
                    name: "Load 5m",
                    data: cpuChartData.load["5min"],
                    yAxis: 1,
                    color: "#90ed7d",
                    dashStyle: "shortdot",
                    visible: cpuSeriesVisibility.load,
                    marker: { enabled: false },
                  },
                  {
                    name: "Load 15m",
                    data: cpuChartData.load["15min"],
                    yAxis: 1,
                    color: "#f15c80",
                    dashStyle: "shortdot",
                    visible: cpuSeriesVisibility.load,
                    marker: { enabled: false },
                  },
                ],
                credits: { enabled: false },
                tooltip: { shared: true },
              }}
            />
          </div>
        ) : (
          <div className="has-text-centered p-4">
            <p className="has-text-grey">No CPU data available</p>
          </div>
        )}
      </div>
    </div>
  </div>
);

export default CpuChart;
