import Highcharts from 'highcharts';
import accessibility from 'highcharts/modules/accessibility';

// Initialize the accessibility module with defensive loading check
// This handles cases where Highcharts might not be fully loaded due to chunking
if (typeof Highcharts === 'object' && Highcharts.chart && typeof accessibility === 'function') {
  try {
    accessibility(Highcharts);
  } catch (error) {
    console.warn('Highcharts accessibility module initialization failed:', error);
  }
}

export default Highcharts;
