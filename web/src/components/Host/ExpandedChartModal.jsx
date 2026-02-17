import { HighchartsReact } from "highcharts-react-official";
import PropTypes from "prop-types";

import { ContentModal } from "../common";
import Highcharts from "../Highcharts";

const ExpandedChartModal = ({
  chartId,
  type,
  close,
  chartData,
  poolChartData,
  arcChartData,
}) => {
  if (!chartId) {
    return null;
  }

  // Get the chart title for the modal header
  const getChartTitle = (chartId, type) => {
    if (type === "individual") {
      return `${chartId} - Bandwidth Detail`;
    } else if (type === "pool") {
      return `${chartId} - ZFS Pool I/O Performance`;
    } else if (type.startsWith("summary-")) {
      const summaryType = type.replace("summary-", "");
      const titleMap = {
        rx: "RX Bandwidth (Download) - All Interfaces",
        tx: "TX Bandwidth (Upload) - All Interfaces",
        read: "Read Bandwidth - All Storage Devices",
        write: "Write Bandwidth - All Storage Devices",
        total: "Total Bandwidth (Combined) - All Devices",
      };
      return titleMap[summaryType];
    } else if (type === "arc-memory") {
      return "ZFS ARC Memory Allocation";
    } else if (type === "arc-efficiency") {
      return "ZFS ARC Cache Efficiency";
    } else if (type === "arc-compression") {
      return "ZFS ARC Compression Effectiveness";
    }
    return "Performance Chart";
  };

  const getExpandedChartOptions = (chartId, type) => {
    if (type === "individual" && chartData[chartId]) {
      const data = chartData[chartId];
      return {
        chart: {
          type: "spline",
          animation: Highcharts.svg,
          marginRight: 10,
          height: "calc(90vh - 200px)",
          backgroundColor: "#1e2a3a",
          style: {
            fontFamily: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif',
          },
        },
        time: {
          useUTC: false,
        },
        title: {
          text: `${chartId} - Bandwidth Detail`,
          style: {
            fontSize: "18px",
            fontWeight: "bold",
            color: "#ffffff",
          },
        },
        xAxis: {
          type: "datetime",
          tickPixelInterval: 150,
          labels: {
            style: {
              fontSize: "12px",
              color: "#b0bec5",
            },
          },
          lineColor: "#37474f",
          tickColor: "#37474f",
          gridLineColor: "#37474f",
        },
        yAxis: {
          title: {
            text: "Bandwidth (MB/s)",
            style: {
              fontSize: "14px",
              color: "#b0bec5",
            },
          },
          min: 0,
          labels: {
            style: {
              fontSize: "12px",
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
            fontSize: "12px",
            color: "#ffffff",
          },
          itemHoverStyle: {
            color: "#64b5f6",
          },
        },
        plotOptions: {
          spline: {
            marker: {
              enabled: false,
            },
            lineWidth: 3,
          },
        },
        series: [
          {
            name: "Read",
            data: data.readData || [],
            color: "#64b5f6",
            fillOpacity: 0.3,
          },
          {
            name: "Write",
            data: data.writeData || [],
            color: "#ff9800",
            fillOpacity: 0.3,
          },
          {
            name: "Total",
            data: data.totalData || [],
            color: "#4caf50",
            fillOpacity: 0.2,
            lineWidth: 4,
          },
        ],
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
            fontSize: "12px",
          },
        },
      };
    } else if (type === "pool" && poolChartData && poolChartData[chartId]) {
      const data = poolChartData[chartId];
      return {
        chart: {
          type: "spline",
          animation: Highcharts.svg,
          marginRight: 10,
          height: "calc(90vh - 200px)",
          backgroundColor: "#1e2a3a",
          style: {
            fontFamily: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif',
          },
        },
        time: {
          useUTC: false,
        },
        title: {
          text: `${chartId} - ZFS Pool I/O Performance`,
          style: {
            fontSize: "18px",
            fontWeight: "bold",
            color: "#ffffff",
          },
        },
        xAxis: {
          type: "datetime",
          tickPixelInterval: 150,
          labels: {
            style: {
              fontSize: "12px",
              color: "#b0bec5",
            },
          },
          lineColor: "#37474f",
          tickColor: "#37474f",
          gridLineColor: "#37474f",
        },
        yAxis: {
          title: {
            text: "Bandwidth (MB/s)",
            style: {
              fontSize: "14px",
              color: "#b0bec5",
            },
          },
          min: 0,
          labels: {
            style: {
              fontSize: "12px",
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
            fontSize: "12px",
            color: "#ffffff",
          },
          itemHoverStyle: {
            color: "#64b5f6",
          },
        },
        plotOptions: {
          spline: {
            marker: {
              enabled: false,
            },
            lineWidth: 3,
          },
        },
        series: [
          {
            name: "Read",
            data: data.readData || [],
            color: "#64b5f6",
            fillOpacity: 0.3,
          },
          {
            name: "Write",
            data: data.writeData || [],
            color: "#ff9800",
            fillOpacity: 0.3,
          },
          {
            name: "Total",
            data: data.totalData || [],
            color: "#4caf50",
            fillOpacity: 0.2,
            lineWidth: 4,
          },
        ],
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
            fontSize: "12px",
          },
        },
      };
    } else if (type.startsWith("summary-")) {
      const summaryType = type.replace("summary-", "");
      const titleMap = {
        rx: "RX Bandwidth (Download) - All Interfaces",
        tx: "TX Bandwidth (Upload) - All Interfaces",
        read: "Read Bandwidth - All Storage Devices",
        write: "Write Bandwidth - All Storage Devices",
        total: "Total Bandwidth (Combined) - All Devices",
      };

      return {
        chart: {
          type: "spline",
          animation: {
            duration: 1000,
            easing: "easeOutQuart",
          },
          marginRight: 10,
          height: "calc(90vh - 200px)",
          backgroundColor: "#1e2a3a",
          style: {
            fontFamily: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif',
          },
        },
        time: {
          useUTC: false,
        },
        title: {
          text: titleMap[summaryType],
          style: {
            fontSize: "18px",
            fontWeight: "bold",
            color: "#ffffff",
          },
        },
        xAxis: {
          type: "datetime",
          tickPixelInterval: 150,
          labels: {
            style: {
              fontSize: "12px",
              color: "#b0bec5",
            },
          },
          lineColor: "#37474f",
          tickColor: "#37474f",
          gridLineColor: "#37474f",
        },
        yAxis: {
          title: {
            text:
              summaryType === "read" ||
              summaryType === "write" ||
              (summaryType === "total" &&
                titleMap[summaryType].includes("Storage"))
                ? "Bandwidth (MB/s)"
                : "Bandwidth (Mbps)",
            style: {
              fontSize: "14px",
              color: "#b0bec5",
            },
          },
          min: 0,
          labels: {
            style: {
              fontSize: "12px",
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
            fontSize: "10px",
            color: "#ffffff",
          },
          itemHoverStyle: {
            color: "#64b5f6",
          },
          maxHeight: 120,
        },
        plotOptions: {
          spline: {
            marker: {
              enabled: false,
            },
            lineWidth: 3,
          },
        },
        series: Object.entries(chartData)
          .filter(([, data]) => data[`${summaryType}Data`].length > 0)
          .map(([interfaceName, data], index) => ({
            name: interfaceName,
            data: data[`${summaryType}Data`],
            color: `hsl(${(index * 360) / Object.keys(chartData).length}, 70%, 60%)`,
            visible: true,
          })),
        credits: {
          enabled: false,
        },
        tooltip: {
          shared: true,
          valueSuffix:
            summaryType === "read" ||
            summaryType === "write" ||
            (summaryType === "total" &&
              titleMap[summaryType].includes("Storage"))
              ? " MB/s"
              : " Mbps",
          backgroundColor: "#263238",
          borderColor: "#37474f",
          style: {
            color: "#ffffff",
            fontSize: "12px",
          },
        },
      };
    } else if (type === "arc-memory" && arcChartData) {
      return {
        chart: {
          type: "spline",
          height: "calc(90vh - 200px)",
          backgroundColor: "#1e2a3a",
          animation: {
            duration: 1000,
            easing: "easeOutQuart",
          },
          style: {
            fontFamily: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif',
          },
        },
        time: {
          useUTC: false,
        },
        title: {
          text: "ZFS ARC Memory Allocation",
          style: {
            fontSize: "20px",
            fontWeight: "bold",
            color: "#ffffff",
          },
        },
        xAxis: {
          type: "datetime",
          labels: {
            style: { color: "#b0bec5", fontSize: "12px" },
          },
          lineColor: "#37474f",
          tickColor: "#37474f",
          gridLineColor: "#37474f",
        },
        yAxis: {
          title: {
            text: "Memory (GB)",
            style: { color: "#b0bec5", fontSize: "14px" },
          },
          min: 0,
          labels: {
            style: { color: "#b0bec5", fontSize: "12px" },
          },
          lineColor: "#37474f",
          tickColor: "#37474f",
          gridLineColor: "#37474f",
        },
        legend: {
          enabled: true,
          itemStyle: {
            color: "#ffffff",
            fontSize: "12px",
          },
        },
        plotOptions: {
          spline: {
            marker: { enabled: false },
            lineWidth: 3,
          },
        },
        series: [
          {
            name: "ARC Size",
            data: arcChartData.arcSize || [],
            color: "#64b5f6",
            lineWidth: 4,
          },
          {
            name: "Target Size",
            data: arcChartData.arcTargetSize || [],
            color: "#9c27b0",
            lineWidth: 3,
            dashStyle: "Dash",
          },
          {
            name: "MRU Size",
            data: arcChartData.mruSize || [],
            color: "#4caf50",
            lineWidth: 3,
          },
          {
            name: "MFU Size",
            data: arcChartData.mfuSize || [],
            color: "#ff9800",
            lineWidth: 3,
          },
        ],
        credits: { enabled: false },
        tooltip: {
          shared: true,
          valueSuffix: " GB",
          backgroundColor: "#263238",
          borderColor: "#37474f",
          style: {
            color: "#ffffff",
            fontSize: "12px",
          },
        },
      };
    } else if (type === "arc-efficiency" && arcChartData) {
      return {
        chart: {
          type: "spline",
          height: "calc(90vh - 200px)",
          backgroundColor: "#1e2a3a",
          animation: {
            duration: 1000,
            easing: "easeOutQuart",
          },
          style: {
            fontFamily: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif',
          },
        },
        time: {
          useUTC: false,
        },
        title: {
          text: "ZFS ARC Cache Efficiency",
          style: {
            fontSize: "20px",
            fontWeight: "bold",
            color: "#ffffff",
          },
        },
        xAxis: {
          type: "datetime",
          labels: {
            style: { color: "#b0bec5", fontSize: "12px" },
          },
          lineColor: "#37474f",
          tickColor: "#37474f",
          gridLineColor: "#37474f",
        },
        yAxis: {
          title: {
            text: "Efficiency (%)",
            style: { color: "#b0bec5", fontSize: "14px" },
          },
          min: 0,
          max: 100,
          labels: {
            style: { color: "#b0bec5", fontSize: "12px" },
          },
          lineColor: "#37474f",
          tickColor: "#37474f",
          gridLineColor: "#37474f",
        },
        legend: {
          enabled: true,
          itemStyle: {
            color: "#ffffff",
            fontSize: "12px",
          },
        },
        plotOptions: {
          spline: {
            marker: { enabled: false },
            lineWidth: 3,
          },
        },
        series: [
          {
            name: "Hit Ratio",
            data: arcChartData.hitRatio || [],
            color: "#2ecc71",
            lineWidth: 4,
          },
          {
            name: "Demand Efficiency",
            data: arcChartData.dataDemandEfficiency || [],
            color: "#e74c3c",
            lineWidth: 3,
          },
          {
            name: "Prefetch Efficiency",
            data: arcChartData.dataPrefetchEfficiency || [],
            color: "#f39c12",
            lineWidth: 3,
          },
        ],
        credits: { enabled: false },
        tooltip: {
          shared: true,
          valueSuffix: "%",
          backgroundColor: "#263238",
          borderColor: "#37474f",
          style: {
            color: "#ffffff",
            fontSize: "12px",
          },
        },
      };
    } else if (type === "arc-compression" && arcChartData) {
      return {
        chart: {
          type: "spline",
          height: "calc(90vh - 200px)",
          backgroundColor: "#1e2a3a",
          animation: {
            duration: 1000,
            easing: "easeOutQuart",
          },
          style: {
            fontFamily: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif',
          },
        },
        time: {
          useUTC: false,
        },
        title: {
          text: "ZFS ARC Compression Effectiveness",
          style: {
            fontSize: "20px",
            fontWeight: "bold",
            color: "#ffffff",
          },
        },
        xAxis: {
          type: "datetime",
          labels: {
            style: { color: "#b0bec5", fontSize: "12px" },
          },
          lineColor: "#37474f",
          tickColor: "#37474f",
          gridLineColor: "#37474f",
        },
        yAxis: {
          title: {
            text: "Compression Ratio (x)",
            style: { color: "#b0bec5", fontSize: "14px" },
          },
          min: 1,
          labels: {
            style: { color: "#b0bec5", fontSize: "12px" },
          },
          lineColor: "#37474f",
          tickColor: "#37474f",
          gridLineColor: "#37474f",
        },
        legend: {
          enabled: true,
          itemStyle: {
            color: "#ffffff",
            fontSize: "12px",
          },
        },
        plotOptions: {
          spline: {
            marker: { enabled: false },
            lineWidth: 4,
          },
        },
        series: [
          {
            name: "Compression Ratio",
            data: arcChartData.compressionRatio || [],
            color: "#8e44ad",
            lineWidth: 4,
          },
        ],
        credits: { enabled: false },
        tooltip: {
          shared: true,
          valueSuffix: "x",
          backgroundColor: "#263238",
          borderColor: "#37474f",
          style: {
            color: "#ffffff",
            fontSize: "12px",
          },
        },
      };
    }
    return {};
  };

  return (
    <ContentModal
      isOpen={!!chartId}
      onClose={close}
      title={getChartTitle(chartId, type)}
      icon="fas fa-chart-line"
    >
      <HighchartsReact
        highcharts={Highcharts}
        options={getExpandedChartOptions(chartId, type)}
      />
    </ContentModal>
  );
};

ExpandedChartModal.propTypes = {
  chartId: PropTypes.string,
  type: PropTypes.string.isRequired,
  close: PropTypes.func.isRequired,
  chartData: PropTypes.object,
  poolChartData: PropTypes.object,
  arcChartData: PropTypes.object,
};

export default ExpandedChartModal;
