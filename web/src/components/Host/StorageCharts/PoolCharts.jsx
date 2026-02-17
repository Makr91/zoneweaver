import { HighchartsReact } from "highcharts-react-official";
import PropTypes from "prop-types";

import Highcharts from "../../Highcharts";

import { createChartOptions } from "./chartDefaults";

const PoolCharts = ({
  poolChartData,
  poolIOStats,
  expandChart,
  poolChartRefs,
  seriesVisibility,
}) => {
  const poolEntries = Object.entries(poolChartData).filter(
    ([, data]) => data.totalData.length > 0
  );

  if (poolIOStats.length === 0 || poolEntries.length === 0) {
    return null;
  }

  return (
    <div className="mb-5">
      <h5 className="title is-6 mb-3">
        <span className="icon-text">
          <span className="icon">
            <i className="fas fa-database" />
          </span>
          <span>ZFS Pool I/O Performance Charts</span>
        </span>
      </h5>
      <div className="columns is-multiline">
        {poolEntries.map(([poolName, poolData]) => {
          const poolIO = poolIOStats.find((pool) => pool.pool === poolName);
          if (!poolIO || !poolData) {
            return null;
          }

          return (
            <div key={poolName} className="column is-6">
              <div className="is-chart-container is-relative">
                <button
                  className="button is-small is-ghost is-chart-expand-button"
                  onClick={() => expandChart(poolName, "pool")}
                  title="Expand chart to full size"
                >
                  <span className="icon has-text-white">
                    <i className="fas fa-expand" />
                  </span>
                </button>
                <HighchartsReact
                  key={`pool-chart-${poolName}`}
                  highcharts={Highcharts}
                  ref={(ref) => {
                    if (ref) {
                      poolChartRefs.current[poolName] = ref;
                    }
                  }}
                  options={createChartOptions({
                    title: `${poolName} (${poolIO.pool_type})`,
                    animation: Highcharts.svg,
                    series: [
                      {
                        name: "Read",
                        data: poolData.readData || [],
                        color: "#64b5f6",
                        fillOpacity: 0.3,
                        visible: seriesVisibility.read,
                      },
                      {
                        name: "Write",
                        data: poolData.writeData || [],
                        color: "#ff9800",
                        fillOpacity: 0.3,
                        visible: seriesVisibility.write,
                      },
                      {
                        name: "Total",
                        data: poolData.totalData || [],
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

      {poolEntries.length > 0 && (
        <div className="has-text-centered mt-3">
          <p className="is-size-7 has-text-grey">
            Showing {poolEntries.length} ZFS pools with I/O activity.
          </p>
        </div>
      )}
    </div>
  );
};

PoolCharts.propTypes = {
  poolChartData: PropTypes.object.isRequired,
  poolIOStats: PropTypes.array.isRequired,
  expandChart: PropTypes.func.isRequired,
  poolChartRefs: PropTypes.shape({ current: PropTypes.object }).isRequired,
  seriesVisibility: PropTypes.shape({
    read: PropTypes.bool.isRequired,
    write: PropTypes.bool.isRequired,
    total: PropTypes.bool.isRequired,
  }).isRequired,
};

export default PoolCharts;
