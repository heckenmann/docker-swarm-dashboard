/**
 * Build filesystem stacked-bar chart configuration.
 * @param {object} m - Task metrics object
 * @param {object} commonOpts - Base ApexCharts options
 * @returns {{ fsChartOptions, fsChartSeries }}
 */
export function buildFSChart(m, commonOpts) {
  const fsUsed = m.fsUsage || 0
  const fsAvail = m.fsLimit > 0 ? Math.max(0, m.fsLimit - fsUsed) : 0
  const fsChartOptions = {
    ...commonOpts,
    chart: { ...commonOpts.chart, type: 'bar', stacked: true },
    plotOptions: { bar: { horizontal: true } },
    dataLabels: { enabled: false },
    xaxis: { categories: ['Filesystem'], title: { text: 'GB' } },
    title: { text: 'Filesystem Usage', align: 'center' },
  }
  const fsChartSeries = [
    {
      name: 'Used',
      data: [parseFloat((fsUsed / 1024 / 1024 / 1024).toFixed(2))],
    },
    ...(m.fsLimit > 0
      ? [
          {
            name: 'Available',
            data: [parseFloat((fsAvail / 1024 / 1024 / 1024).toFixed(2))],
          },
        ]
      : []),
  ]
  return { fsChartOptions, fsChartSeries }
}
