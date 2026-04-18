// memoryCharts.test.js
// Tests for memory chart builder functions

const {
  calculateMemoryMetrics,
  createMemoryDonutOptions,
  buildMemoryCharts,
} = require('../../../../../src/components/tasks/details/MemoryCharts.jsx')
const { formatBytesCompact } = require('../../../../../src/common/formatUtils')

describe('memoryCharts', () => {
  describe('calculateMemoryMetrics', () => {
    test('calculates metrics with limit', () => {
      const m = {
        memoryCache: 100,
        workingSet: 200,
        usage: 500,
        limit: 1000
      }
      
      const result = calculateMemoryMetrics(m)
      expect(result.memCache).toBe(100)
      expect(result.workingSet).toBe(200)
      expect(result.otherUsed).toBe(200) // 500 - 200 - 100
      expect(result.memAvailable).toBe(500) // 1000 - 500
    })

    test('calculates metrics without limit', () => {
      const m = {
        memoryCache: 100,
        workingSet: 200,
        usage: 500
      }
      
      const result = calculateMemoryMetrics(m)
      expect(result.memCache).toBe(100)
      expect(result.workingSet).toBe(200)
      expect(result.otherUsed).toBe(200) // 500 - 200 - 100
      expect(result.memAvailable).toBe(0) // no limit
    })

    test('handles missing values', () => {
      const m = {}
      
      const result = calculateMemoryMetrics(m)
      expect(result.memCache).toBe(0)
      expect(result.workingSet).toBe(0)
      expect(result.otherUsed).toBe(0)
      expect(result.memAvailable).toBe(0)
    })

    test('handles negative values', () => {
      const m = {
        memoryCache: -100,
        workingSet: -200,
        usage: -500,
        limit: 1000
      }
      
      const result = calculateMemoryMetrics(m)
      expect(result.memCache).toBe(-100)
      expect(result.workingSet).toBe(-200)
      expect(result.otherUsed).toBe(0) // Math.max(0, -500 - (-200) - (-100)) = Math.max(0, -200)
      expect(result.memAvailable).toBe(1500) // 1000 - (-500)
    })

    test('handles zero values', () => {
      const m = {
        memoryCache: 0,
        workingSet: 0,
        usage: 0,
        limit: 0
      }
      
      const result = calculateMemoryMetrics(m)
      expect(result.memCache).toBe(0)
      expect(result.workingSet).toBe(0)
      expect(result.otherUsed).toBe(0)
      expect(result.memAvailable).toBe(0)
    })
  })

  describe('createMemoryDonutOptions', () => {
    const commonOpts = {
      chart: { id: 'test' },
      colors: ['#008FFB', '#00E396', '#FEB019', '#FF4560'],
      theme: { mode: 'light' }
    }
    
    const formatBytes = (bytes) => `${bytes} B`
    
    test('creates options with limit', () => {
      const m = { limit: 1000, usage: 500 }
      const options = createMemoryDonutOptions(m, commonOpts, formatBytes)
      
      expect(options.labels).toEqual(['Working Set', 'Cache', 'Other Used', 'Available'])
      expect(options.plotOptions.pie.donut.labels.total.label).toBe('Limit')
      expect(options.plotOptions.pie.donut.labels.total.formatter()).toBe('1000 B')
    })

    test('creates options without limit', () => {
      const m = { usage: 500 }
      const options = createMemoryDonutOptions(m, commonOpts, formatBytes)
      
      expect(options.labels).toEqual(['Working Set', 'Cache', 'Other Used'])
      expect(options.plotOptions.pie.donut.labels.total.label).toBe('Total RSS')
      expect(options.plotOptions.pie.donut.labels.total.formatter()).toBe('500 B')
    })

    test('creates options with dark mode', () => {
      const m = { limit: 1000, usage: 500 }
      const darkOpts = {
        ...commonOpts,
        theme: { mode: 'dark' }
      }
      const options = createMemoryDonutOptions(m, darkOpts, formatBytes)
      
      expect(options.theme.mode).toBe('dark')
    })

    test('creates options with dataLabels formatter', () => {
      const m = { limit: 1000, usage: 500 }
      const options = createMemoryDonutOptions(m, commonOpts, formatBytes)

      // Verify dataLabels formatter exists and produces correct output
      expect(options.dataLabels).toBeDefined()
      expect(options.dataLabels.formatter(50)).toBe('50.0%')
      expect(options.dataLabels.formatter(0)).toBe('0.0%')
      expect(options.dataLabels.formatter(100)).toBe('100.0%')
    })

    test('creates options with formatter using 0 usage', () => {
      const m = { limit: 1000, usage: 0 }
      const options = createMemoryDonutOptions(m, commonOpts, formatBytes)
      
      // formatter uses limit (1000) since limit > 0
      expect(options.plotOptions.pie.donut.labels.total.formatter()).toBe('1000 B')
    })
  })

  describe('buildMemoryCharts', () => {
    const commonOpts = {
      chart: {},
      theme: { mode: 'light' },
      xaxis: {},
    }

    test('builds memory charts with normal usage (usagePercent <= 75)', () => {
      const m = {
        usagePercent: 50,
        memoryCache: 100,
        workingSet: 200,
        usage: 500,
        limit: 1000
      }
      const result = buildMemoryCharts(m, commonOpts, false)
      
      expect(result.memGaugeOptions.colors).toEqual(['#198754'])
      expect(result.memGaugeSeries).toEqual([50])
      expect(result.memDonutOptions.labels).toEqual(['Working Set', 'Cache', 'Other Used', 'Available'])
      expect(result.memDonutSeries).toEqual([200, 100, 200, 500])
    })

    test('builds memory charts with warning usage (usagePercent > 75 and <= 90)', () => {
      const m = {
        usagePercent: 80,
        memoryCache: 100,
        workingSet: 200,
        usage: 800,
        limit: 1000
      }
      const result = buildMemoryCharts(m, commonOpts, false)
      
      expect(result.memGaugeOptions.colors).toEqual(['#ffc107'])
      expect(result.memGaugeSeries).toEqual([80])
    })

    test('builds memory charts with critical usage (usagePercent > 90)', () => {
      const m = {
        usagePercent: 95,
        memoryCache: 100,
        workingSet: 200,
        usage: 950,
        limit: 1000
      }
      const result = buildMemoryCharts(m, commonOpts, false)
      
      expect(result.memGaugeOptions.colors).toEqual(['#dc3545'])
      expect(result.memGaugeSeries).toEqual([95])
    })

    test('builds memory charts with dark mode', () => {
      const m = {
        usagePercent: 50,
        memoryCache: 100,
        workingSet: 200,
        usage: 500,
        limit: 1000
      }
      const result = buildMemoryCharts(m, commonOpts, true)
      
      expect(result.memGaugeOptions.plotOptions.radialBar.track.background).toBe('#e0e0e0')
    })

    test('builds memory charts without limit', () => {
      const m = {
        usagePercent: 50,
        memoryCache: 100,
        workingSet: 200,
        usage: 500
      }
      const result = buildMemoryCharts(m, commonOpts, false)
      
      expect(result.memDonutOptions.labels).toEqual(['Working Set', 'Cache', 'Other Used'])
      expect(result.memDonutSeries).toEqual([200, 100, 200])
    })

    test('builds memory charts with missing usagePercent', () => {
      const m = {
        memoryCache: 100,
        workingSet: 200,
        usage: 500,
        limit: 1000
      }
      const result = buildMemoryCharts(m, commonOpts, false)
      
      expect(result.memGaugeSeries).toEqual([0])
    })

    test('memory gauge formatter produces valid output', () => {
      const m = {
        usagePercent: 50,
        memoryCache: 100,
        workingSet: 200,
        usage: 500,
        limit: 1000
      }
      const result = buildMemoryCharts(m, commonOpts, false)
      
      // The formatter should produce a valid percentage string
      // dataLabels is nested inside plotOptions.radialBar
      const formatter = result.memGaugeOptions.plotOptions.radialBar.dataLabels.value.formatter
      expect(formatter(50)).toBe('50.0%')
      expect(formatter(0)).toBe('0.0%')
      expect(formatter(100)).toBe('100.0%')
    })

    test('memory donut formatter produces valid output', () => {
      const m = {
        memoryCache: 100,
        workingSet: 200,
        usage: 500,
        limit: 1000
      }
      const result = createMemoryDonutOptions(m, commonOpts, formatBytesCompact)
      
      // The formatter should produce a valid bytes string
      const formatter = result.plotOptions.pie.donut.labels.total.formatter
      expect(formatter()).toBe('1000 B')
    })
  })
})
