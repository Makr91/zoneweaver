import { HighchartsReact } from "highcharts-react-official";
import PropTypes from "prop-types";

import Highcharts from "../../Highcharts";

import { createChartOptions } from "./chartDefaults";

const DeviceCharts = ({
  diskIOStats,
  getSortedChartEntries,
  expandChart,
  chartRefs,
  seriesVisibility,
  chartSortBy,
}) => {
  const sortedEntries = getSortedChartEntries();

  if (diskIOStats.length === 0) {
    return null;
  }

  return (
    <div className="mb-5">
      <h5 className="title is-6 mb-3">
        <span className="icon-text">
          <span className="icon">
            <i className="fas fa-chart-line" />
          </span>
          <span>Individual Device Charts</span>
        </span>
      </h5>
      <div className="columns is-multiline">
        {sortedEntries.map(([deviceName, deviceData]) => {
          const matchedIO = diskIOStats.find(
            (stat) => stat.device_name === deviceName
          );
          if (!matchedIO || !deviceData) {
            return null;
          }

          return (
            <div key={deviceName} className="column is-6">
              <div className="is-chart-container is-relative">
                <button
                  className="button is-small is-ghost is-chart-expand-button"
                  onClick={() => expandChart(deviceName, "individual")}
                  title="Expand chart to full size"
                >
                  <span className="icon has-text-white">
                    <i className="fas fa-expand" />
                  </span>
                </button>
                <HighchartsReact
                  key={`chart-${deviceName}`}
                  highcharts={Highcharts}
                  ref={(ref) => {
                    if (ref) {
                      chartRefs.current[deviceName] = ref;
                    }
                  }}
                  options={createChartOptions({
                    title: deviceName,
                    animation: Highcharts.svg,
                    series: [
                      {
                        name: "Read",
                        data: deviceData.readData || [],
                        color: "#64b5f6",
                        fillOpacity: 0.3,
                        visible: seriesVisibility.read,
                      },
                      {
                        name: "Write",
                        data: deviceData.writeData || [],
                        color: "#ff9800",
                        fillOpacity: 0.3,
                        visible: seriesVisibility.write,
                      },
                      {
                        name: "Total",
                        data: deviceData.totalData || [],
                        color: "#4caf50",
                        fillOpacity: 0.2,
                        lineWidth: 3,
                        visible: seriesVisibility.total,
                      },
                    ],
                  })}
                />
              </div>
            </div>
          );
        })}
      </div>

      {sortedEntries.length > 0 && (
        <div className="has-text-centered mt-3">
          <p className="is-size-7 has-text-grey">
            Showing all {sortedEntries.length} devices with I/O activity. Sorted
            by: {chartSortBy}.
          </p>
        </div>
      )}
    </div>
  );
};

DeviceCharts.propTypes = {
  diskIOStats: PropTypes.array.isRequired,
  getSortedChartEntries: PropTypes.func.isRequired,
  expandChart: PropTypes.func.isRequired,
  chartRefs: PropTypes.shape({ current: PropTypes.object }).isRequired,
  seriesVisibility: PropTypes.shape({
    read: PropTypes.bool.isRequired,
    write: PropTypes.bool.isRequired,
    total: PropTypes.bool.isRequired,
  }).isRequired,
  chartSortBy: PropTypes.string.isRequired,
};

export default DeviceCharts;
