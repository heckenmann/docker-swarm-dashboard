import {
  CHART_PALETTES,
  GAUGE_DEFAULTS,
  getGaugeTrackBackground,
  getStatusColor,
} from '../../../common/utils/chartUtils'

/**
 * Build CPU gauge + pie chart configurations.
 * @param {object} m - Task metrics object
 * @param {object} commonOpts - Base ApexCharts options
 * @returns {{ cpuGaugeOptions, cpuGaugeSeries, cpuBreakdownOptions, cpuBreakdownSeries }}
 */
export function buildCPUCharts(m, commonOpts) {
  const cpuGaugeOptions = {
    ...commonOpts,
    chart: { ...commonOpts.chart, type: 'radialBar' },
    plotOptions: {
      radialBar: {
        startAngle: GAUGE_DEFAULTS.startAngle,
        endAngle: GAUGE_DEFAULTS.endAngle,
        hollow: { size: GAUGE_DEFAULTS.hollowSize },
        dataLabels: {
          name: { fontSize: GAUGE_DEFAULTS.nameFontSize, offsetY: -10 },
          value: {
            fontSize: GAUGE_DEFAULTS.valueFontSize,
            formatter: (val) => `${parseFloat(val).toFixed(1)}%`,
          },
        },
        track: { background: getGaugeTrackBackground() },
      },
    },
    colors: [getStatusColor(m.cpuPercent)],
    labels: ['CPU Quota'],
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
    dataLabels: { formatter: (val) => val.toFixed(1) + '%' },
    colors: CHART_PALETTES.cpu,
  }
  const cpuBreakdownSeries = [userSec, sysSec]

  return {
    cpuGaugeOptions,
    cpuGaugeSeries,
    cpuBreakdownOptions,
    cpuBreakdownSeries,
  }
}
