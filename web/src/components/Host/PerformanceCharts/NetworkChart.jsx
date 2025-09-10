import { HighchartsReact } from "highcharts-react-official";
import React from "react";

import Highcharts from "../../Highcharts";

const NetworkChart = ({
  networkChartData,
  networkSeriesVisibility,
  setNetworkSeriesVisibility,
  expandChart,
}) => (
  <div className="column is-4">
    <div className="card has-background-dark">
      <header className="card-header has-background-grey-darker">
        <p className="card-header-title has-text-white">
          <span className="icon-text">
            <span className="icon">
              <i className="fas fa-network-wired" />
            </span>
            <span>Network</span>
          </span>
        </p>
        <div className="card-header-icon">
          <div className="field is-grouped">
            <div className="control">
              <button
                className={`button is-small ${networkSeriesVisibility.read ? "is-info" : "is-dark"}`}
                onClick={() =>
                  setNetworkSeriesVisibility((prev) => ({
                    ...prev,
                    read: !prev.read,
                  }))
                }
                title="Toggle RX bandwidth visibility"
              >
                <span className="icon">
                  <i
                    className={`fas ${networkSeriesVisibility.read ? "fa-eye" : "fa-eye-slash"}`}
                  />
                </span>
                <span>RX</span>
              </button>
            </div>
            <div className="control">
              <button
                className={`button is-small ${networkSeriesVisibility.write ? "is-warning" : "is-dark"}`}
                onClick={() =>
                  setNetworkSeriesVisibility((prev) => ({
                    ...prev,
                    write: !prev.write,
                  }))
                }
                title="Toggle TX bandwidth visibility"
              >
                <span className="icon">
                  <i
                    className={`fas ${networkSeriesVisibility.write ? "fa-eye" : "fa-eye-slash"}`}
                  />
                </span>
                <span>TX</span>
              </button>
            </div>
            <div className="control">
              <button
                className={`button is-small ${networkSeriesVisibility.total ? "is-success" : "is-dark"}`}
                onClick={() =>
                  setNetworkSeriesVisibility((prev) => ({
                    ...prev,
                    total: !prev.total,
                  }))
                }
                title="Toggle Total bandwidth visibility"
              >
                <span className="icon">
                  <i
                    className={`fas ${networkSeriesVisibility.total ? "fa-eye" : "fa-eye-slash"}`}
                  />
                </span>
                <span>Total</span>
              </button>
            </div>
            <div className="control">
              <button
                className="button is-small is-light"
                onClick={() => expandChart("network", "network")}
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
        {networkChartData && Object.keys(networkChartData).length > 0 ? (
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
                  text: "Network Bandwidth",
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
                    text: "Mbps",
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
                series: Object.entries(networkChartData)
                  .filter(
                    ([, data]) => data.totalData && data.totalData.length > 0
                  )
                  .flatMap(([interfaceName, data], interfaceIndex) => {
                    const baseHue =
                      (interfaceIndex * 360) /
                      Object.keys(networkChartData).length;
                    return [
                      // RX series for this interface
                      {
                        name: `${interfaceName} RX`,
                        data: data.rxData || [],
                        color: `hsl(${baseHue}, 70%, 75%)`,
                        visible: networkSeriesVisibility.read,
                        dashStyle: "Solid",
                        lineWidth: 2,
                      },
                      // TX series for this interface
                      {
                        name: `${interfaceName} TX`,
                        data: data.txData || [],
                        color: `hsl(${baseHue}, 70%, 50%)`,
                        visible: networkSeriesVisibility.write,
                        dashStyle: "Dash",
                        lineWidth: 2,
                      },
                      // Total series for this interface
                      {
                        name: `${interfaceName} Total`,
                        data: data.totalData || [],
                        color: `hsl(${baseHue}, 70%, 35%)`,
                        visible: networkSeriesVisibility.total,
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
                  valueSuffix: " Mbps",
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
            <p className="has-text-grey">No real interface data available</p>
          </div>
        )}
      </div>
    </div>
  </div>
);

export default NetworkChart;
