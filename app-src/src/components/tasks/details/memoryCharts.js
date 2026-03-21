import {
  formatBytesCompact as formatBytes,
} from '../../../common/formatUtils'

/**
 * Calculates memory metrics for donut chart
 * Extracted for better testability
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
    memAvailable
  }
}

/**
 * Creates memory donut chart options
 * Extracted for better testability
 */
export function createMemoryDonutOptions(m, commonOpts, formatBytes) {
  const { memCache, workingSet, otherUsed, memAvailable } = calculateMemoryMetrics(m)
  
  const labels = m.limit > 0
    ? ['Working Set', 'Cache', 'Other Used', 'Available']
    : ['Working Set', 'Cache', 'Other Used']
  
  return {
    ...commonOpts,
    chart: { ...commonOpts.chart, type: 'donut' },
    labels: labels,
    title: { text: 'Memory Breakdown', align: 'center' },
    plotOptions: {
      pie: {
        donut: {
          labels: {
            show: true,
            total: {
              show: true,
              label: m.limit > 0 ? 'Limit' : 'Total RSS',
              formatter: () => formatBytes(m.limit > 0 ? m.limit : m.usage || 0),
            },
          },
        },
      },
    },
    dataLabels: { formatter: (val) => val.toFixed(1) + '%' },
  }
}

/**
 * Build memory gauge + donut chart configurations.
 * @param {object} m - Task metrics object
 * @param {object} commonOpts - Base ApexCharts options
 * @param {boolean} isDarkMode
 * @returns {{ memGaugeOptions, memGaugeSeries, memDonutOptions, memDonutSeries }}
 */
export function buildMemoryCharts(m, commonOpts, isDarkMode) {
  const memGaugeOptions = {
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
      m.usagePercent > 90
        ? ['#dc3545']
        : m.usagePercent > 75
          ? ['#fd7e14']
          : ['#28a745'],
    labels: ['Memory'],
    title: { text: 'Memory Usage', align: 'center' },
  }
  const memGaugeSeries = [parseFloat((m.usagePercent || 0).toFixed(1))]

  const { memCache, workingSet, otherUsed, memAvailable } = calculateMemoryMetrics(m)
  const memDonutOptions = createMemoryDonutOptions(m, commonOpts, formatBytes)
  const memDonutSeries =
    m.limit > 0
      ? [workingSet, memCache, otherUsed, memAvailable]
      : [workingSet, memCache, otherUsed]

  return { memGaugeOptions, memGaugeSeries, memDonutOptions, memDonutSeries }
}
