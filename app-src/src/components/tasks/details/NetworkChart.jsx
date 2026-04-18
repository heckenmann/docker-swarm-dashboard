import { formatBytesCompact as formatBytes } from '../../../common/formatUtils'
import { CHART_PALETTES } from '../../../common/utils/chartUtils'

/**
 * Build network bar chart configuration.
 * @param {object} m - Task metrics object
 * @param {object} commonOpts - Base ApexCharts options
 * @returns {{ networkChartOptions, networkChartSeries }}
 */
export function buildNetworkChart(m, commonOpts) {
  const networkChartOptions = {
    ...commonOpts,
    chart: { ...commonOpts.chart, type: 'bar' },
    plotOptions: { bar: { horizontal: true, distributed: true } },
    dataLabels: { enabled: true, formatter: (val) => formatBytes(val) },
    xaxis: {
      categories: ['Received', 'Transmitted'],
      labels: { formatter: (val) => formatBytes(val) },
      title: { text: 'Bytes' },
    },
    legend: { show: false },
    colors: CHART_PALETTES.network,
  }
  const networkChartSeries = [
    { name: 'Bytes', data: [m.networkRxBytes || 0, m.networkTxBytes || 0] },
  ]
  return { networkChartOptions, networkChartSeries }
}
