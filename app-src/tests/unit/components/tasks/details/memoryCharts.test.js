// memoryCharts.test.js
// Tests for memory chart builder functions

const {
  calculateMemoryMetrics,
  createMemoryDonutOptions,
  buildMemoryCharts,
} = require('../../../../../src/components/tasks/details/MemoryCharts.jsx')

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
      
      expect(result.memGaugeOptions.colors).toEqual(['#28a745'])
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
      
      expect(result.memGaugeOptions.colors).toEqual(['#fd7e14'])
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
      
      expect(result.memGaugeOptions.plotOptions.radialBar.track.background).toBe('#444')
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
  })
})
