import { HighchartsReact } from "highcharts-react-official";
import React from "react";

import Highcharts from "../../Highcharts";

const StorageIOChart = ({
  chartData,
  storageSeriesVisibility,
  setStorageSeriesVisibility,
  expandChart,
}) => (
  <div className="column is-4">
    <div className="card has-background-dark">
      <header className="card-header has-background-grey-darker">
        <p className="card-header-title has-text-white">
          <span className="icon-text">
            <span className="icon">
              <i className="fas fa-hdd" />
            </span>
            <span>Storage I/O</span>
          </span>
        </p>
        <div className="card-header-icon">
          <div className="field is-grouped">
            <div className="control">
              <button
                className={`button is-small ${storageSeriesVisibility.read ? "is-info" : "is-dark"}`}
                onClick={() =>
                  setStorageSeriesVisibility((prev) => ({
                    ...prev,
                    read: !prev.read,
                  }))
                }
                title="Toggle Read bandwidth visibility"
              >
                <span className="icon">
                  <i
                    className={`fas ${storageSeriesVisibility.read ? "fa-eye" : "fa-eye-slash"}`}
                  />
                </span>
                <span>Read</span>
              </button>
            </div>
            <div className="control">
              <button
                className={`button is-small ${storageSeriesVisibility.write ? "is-warning" : "is-dark"}`}
                onClick={() =>
                  setStorageSeriesVisibility((prev) => ({
                    ...prev,
                    write: !prev.write,
                  }))
                }
                title="Toggle Write bandwidth visibility"
              >
                <span className="icon">
                  <i
                    className={`fas ${storageSeriesVisibility.write ? "fa-eye" : "fa-eye-slash"}`}
                  />
                </span>
                <span>Write</span>
              </button>
            </div>
            <div className="control">
              <button
                className={`button is-small ${storageSeriesVisibility.total ? "is-success" : "is-dark"}`}
                onClick={() =>
                  setStorageSeriesVisibility((prev) => ({
                    ...prev,
                    total: !prev.total,
                  }))
                }
                title="Toggle Total bandwidth visibility"
              >
                <span className="icon">
                  <i
                    className={`fas ${storageSeriesVisibility.total ? "fa-eye" : "fa-eye-slash"}`}
                  />
                </span>
                <span>Total</span>
              </button>
            </div>
            <div className="control">
              <button
                className="button is-small is-light"
                onClick={() => expandChart("storage", "storage-io")}
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
        {chartData && Object.keys(chartData).length > 0 ? (
          <div>
            <HighchartsReact
              highcharts={Highcharts}
              options={{
                chart: {
                  type: "spline",
                  animation: Highcharts.svg,
                  marginRight: 10,
                  height: 200,
                  backgroundColor: "#1e2a3a",
                  style: {
                    fontFamily:
                      '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif',
                  },
                },
                time: {
                  useUTC: false,
                },
                title: {
                  text: "ZFS Pool I/O",
                  style: {
                    fontSize: "12px",
                    fontWeight: "bold",
                    color: "#ffffff",
                  },
                },
                xAxis: {
                  type: "datetime",
                  tickPixelInterval: 150,
                  labels: {
                    style: {
                      fontSize: "9px",
                      color: "#b0bec5",
                    },
                  },
                  lineColor: "#37474f",
                  tickColor: "#37474f",
                  gridLineColor: "#37474f",
                },
                yAxis: {
                  title: {
                    text: "MB/s",
                    style: {
                      fontSize: "10px",
                      color: "#b0bec5",
                    },
                  },
                  min: 0,
                  labels: {
                    style: {
                      fontSize: "9px",
                      color: "#b0bec5",
                    },
                  },
                  lineColor: "#37474f",
                  tickColor: "#37474f",
                  gridLineColor: "#37474f",
                },
                legend: {
                  enabled: true,
                  itemStyle: {
                    fontSize: "8px",
                    color: "#ffffff",
                  },
                  maxHeight: 40,
                },
                plotOptions: {
                  spline: {
                    marker: {
                      enabled: false,
                    },
                    lineWidth: 2,
                  },
                },
                series: Object.entries(chartData)
                  .filter(
                    ([, data]) => data.totalData && data.totalData.length > 0
                  )
                  .flatMap(([poolName, data], poolIndex) => {
                    const baseHue =
                      (poolIndex * 360) / Object.keys(chartData).length;
                    return [
                      // Read series for this pool
                      {
                        name: `${poolName} Read`,
                        data: data.readData || [],
                        color: `hsl(${baseHue}, 70%, 75%)`,
                        visible: storageSeriesVisibility.read,
                        dashStyle: "Solid",
                        lineWidth: 2,
                      },
                      // Write series for this pool
                      {
                        name: `${poolName} Write`,
                        data: data.writeData || [],
                        color: `hsl(${baseHue}, 70%, 50%)`,
                        visible: storageSeriesVisibility.write,
                        dashStyle: "Dash",
                        lineWidth: 2,
                      },
                      // Total series for this pool
                      {
                        name: `${poolName} Total`,
                        data: data.totalData || [],
                        color: `hsl(${baseHue}, 70%, 35%)`,
                        visible: storageSeriesVisibility.total,
                        dashStyle: "Solid",
                        lineWidth: 3,
                      },
                    ];
                  }),
                credits: {
                  enabled: false,
                },
                tooltip: {
                  shared: true,
                  valueSuffix: " MB/s",
                  backgroundColor: "#263238",
                  borderColor: "#37474f",
                  style: {
                    color: "#ffffff",
                    fontSize: "10px",
                  },
                },
              }}
            />
          </div>
        ) : (
          <div className="has-text-centered p-4">
            <p className="has-text-grey">No pool I/O data available</p>
          </div>
        )}
      </div>
    </div>
  </div>
);

export default StorageIOChart;
