const React = require('react')

/**
 * Minimal mock of `react-apexcharts` used in tests.
 * Renders a div with test attributes so assertions can verify chart type/height.
 * Also captures the most recently rendered chart's options so tests can invoke
 * formatter callbacks directly to reach coverage thresholds.
 *
 * @param {{type: string, series: any[], options: object, height: number}} props
 * @returns {React.Element}
 */

/** Stores all captured chart instances keyed by "type-title". */
const capturedCharts = {}

function ReactApexChart({ type, series, options, height }) {
  // Store props for programmatic access in tests
  const key = `${type}-${options && options.title ? options.title.text : type}`
  capturedCharts[key] = { type, series, options, height }

  return React.createElement('div', {
    'data-testid': `apex-chart-${type}`,
    'data-chart-type': type,
    'data-height': height,
    'data-series-length': Array.isArray(series) ? series.length : 0,
    'aria-label': options && options.title ? options.title.text : type,
  })
}

/** Returns all captured chart prop objects (useful for testing formatters). */
ReactApexChart.getCaptured = () => ({ ...capturedCharts })

/** Clears the captured charts store between tests. */
ReactApexChart.clearCaptured = () => {
  Object.keys(capturedCharts).forEach((k) => delete capturedCharts[k])
}

module.exports = ReactApexChart
module.exports.default = ReactApexChart
