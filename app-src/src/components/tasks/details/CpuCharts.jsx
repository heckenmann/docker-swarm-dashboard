/**
 * Build CPU gauge + pie chart configurations.
 * @param {object} m - Task metrics object
 * @param {object} commonOpts - Base ApexCharts options
 * @param {boolean} isDarkMode
 * @returns {{ cpuGaugeOptions, cpuGaugeSeries, cpuBreakdownOptions, cpuBreakdownSeries }}
 */
export function buildCPUCharts(m, commonOpts, isDarkMode) {
  const cpuGaugeOptions = {
    ...commonOpts,
    chart: { ...commonOpts.chart, type: 'radialBar' },
    plotOptions: {
      radialBar: {
        startAngle: -130,
        endAngle: 130,
        hollow: { size: '55%' },
        dataLabels: {
          name: { fontSize: '14px', offsetY: -10 },
          value: {
            fontSize: '22px',
            formatter: (val) => `${parseFloat(val).toFixed(1)}%`,
          },
        },
        track: { background: isDarkMode ? '#444' : '#e0e0e0' },
      },
    },
    colors:
      m.cpuPercent > 90
        ? ['#dc3545']
        : m.cpuPercent > 75
          ? ['#fd7e14']
          : ['#0d6efd'],
    labels: ['CPU Quota'],
    title: { text: 'CPU vs Quota', align: 'center' },
  }
  const cpuGaugeSeries = [
    Math.min(parseFloat((m.cpuPercent || 0).toFixed(1)), 100),
  ]

  const userSec = m.cpuUserSeconds || 0
  const sysSec = m.cpuSystemSeconds || 0
  const cpuBreakdownOptions = {
    ...commonOpts,
    chart: { ...commonOpts.chart, type: 'pie' },
    labels: ['User', 'System'],
    title: { text: 'CPU Time Split', align: 'center' },
    dataLabels: { formatter: (val) => val.toFixed(1) + '%' },
  }
  const cpuBreakdownSeries = [userSec, sysSec]

  return {
    cpuGaugeOptions,
    cpuGaugeSeries,
    cpuBreakdownOptions,
    cpuBreakdownSeries,
  }
}
