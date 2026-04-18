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

/** Stores all captured chart instances keyed by "type-title" or "type-id". */
const capturedCharts = {}

function ReactApexChart({ type, series, options, height }) {
  // Store props for programmatic access in tests
  // Prioritize chart ID, then title, then type as a fallback
  const titleText = options && options.title ? options.title.text : ''
  const chartId = options && options.chart ? options.chart.id : ''
  const key = chartId || (titleText ? `${type}-${titleText}` : `${type}-${Object.keys(capturedCharts).length}`)
  
  capturedCharts[key] = { type, series, options, height }

  return React.createElement('div', {
    'data-testid': `apex-chart-${type}`,
    'data-chart-type': type,
    'data-chart-id': chartId,
    'data-height': height,
    'data-series-length': Array.isArray(series) ? series.length : 0,
    'aria-label': titleText || chartId || type,
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
