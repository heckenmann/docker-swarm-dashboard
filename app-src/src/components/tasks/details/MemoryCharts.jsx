import { formatBytesCompact as formatBytes } from '../../../common/formatUtils'
import {
  CHART_PALETTES,
  GAUGE_DEFAULTS,
  getGaugeTrackBackground,
  getStatusColor,
} from '../../../common/utils/chartUtils'

/**
 * Calculates memory metrics for donut chart
 * Extracted for better testability
 *
 * @param {object} m - Memory metrics object
 */
export function calculateMemoryMetrics(m) {
  const memCache = m.memoryCache || 0
  const workingSet = m.workingSet || 0
  const otherUsed = Math.max(0, (m.usage || 0) - workingSet - memCache)
  const memAvailable = m.limit > 0 ? Math.max(0, m.limit - (m.usage || 0)) : 0

  return {
    memCache,
    workingSet,
    otherUsed,
    memAvailable,
  }
}

/**
 * Creates memory donut chart options
 * Extracted for better testability
 *
 * @param {object} m - Memory metrics object
 * @param {object} commonOpts - Base ApexCharts options
 * @param {Function} formatBytes - Function to format bytes
 */
export function createMemoryDonutOptions(m, commonOpts, formatBytes) {
  const {} = calculateMemoryMetrics(m)

  const labels =
    m.limit > 0
      ? ['Working Set', 'Cache', 'Other Used', 'Available']
      : ['Working Set', 'Cache', 'Other Used']

  return {
    ...commonOpts,
    chart: { ...commonOpts.chart, type: 'donut' },
    labels: labels,
    plotOptions: {
      pie: {
        donut: {
          labels: {
            show: true,
            total: {
              show: true,
              label: m.limit > 0 ? 'Limit' : 'Total RSS',
              formatter: () =>
                formatBytes(m.limit > 0 ? m.limit : m.usage || 0),
            },
          },
        },
      },
    },
    dataLabels: { formatter: (val) => val.toFixed(1) + '%' },
    colors: CHART_PALETTES.memory,
  }
}

/**
 * Build memory gauge + donut chart configurations.
 * @param {object} m - Task metrics object
 * @param {object} commonOpts - Base ApexCharts options
 * @returns {{ memGaugeOptions, memGaugeSeries, memDonutOptions, memDonutSeries }}
 */
export function buildMemoryCharts(m, commonOpts) {
  const hasLimit = m.limit > 0

  // Gauge: shows percentage if limit exists, otherwise shows absolute usage
  const memGaugeOptions = {
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
            formatter: (val) => {
              if (hasLimit) {
                return `${parseFloat(val).toFixed(1)}%`
              }
              // Without limit, show absolute value
              return formatBytes(m.usage || 0)
            },
          },
        },
        track: { background: getGaugeTrackBackground() },
      },
    },
    colors: [
      hasLimit ? getStatusColor(m.usagePercent) : CHART_PALETTES.memory[0],
    ],
    labels: ['Memory'],
  }
  // Without limit, show empty gauge or minimal fill
  const memGaugeSeries = [
    hasLimit ? parseFloat((m.usagePercent || 0).toFixed(1)) : 0,
  ]

  const { memCache, workingSet, otherUsed, memAvailable } =
    calculateMemoryMetrics(m)
  const memDonutOptions = createMemoryDonutOptions(m, commonOpts, formatBytes)
  const memDonutSeries =
    m.limit > 0
      ? [workingSet, memCache, otherUsed, memAvailable]
      : [workingSet, memCache, otherUsed]

  return { memGaugeOptions, memGaugeSeries, memDonutOptions, memDonutSeries }
}
