import {
  formatBytesCompact as formatBytes,
} from '../../../common/formatUtils'

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
    title: { text: 'Network Traffic (Total)', align: 'center' },
    legend: { show: false },
  }
  const networkChartSeries = [
    { name: 'Bytes', data: [m.networkRxBytes || 0, m.networkTxBytes || 0] },
  ]
  return { networkChartOptions, networkChartSeries }
}
