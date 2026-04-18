// TaskMetricsContent.logic.test.js
// Tests for the extracted memory metrics functions

const {
  calculateMemoryMetrics,
  createMemoryDonutOptions,
  buildMemoryCharts,
  buildCPUCharts,
  buildNetworkChart,
  buildFSChart,
} = require('../../../../../src/components/tasks/details')

describe('TaskMetricsContent logic', () => {
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
  })

  describe('buildCPUCharts', () => {
    const commonOpts = {
      chart: {},
      theme: { mode: 'light' },
      xaxis: {},
    }

    test('builds CPU charts with normal usage (cpuPercent <= 75)', () => {
      const m = {
        cpuPercent: 50,
        cpuUserSeconds: 100,
        cpuSystemSeconds: 50,
      }
      const result = buildCPUCharts(m, commonOpts, false)

      expect(result.cpuGaugeOptions.colors).toEqual(['#198754'])
      expect(result.cpuGaugeSeries).toEqual([50])
      expect(result.cpuBreakdownOptions.labels).toEqual(['User', 'System'])
      expect(result.cpuBreakdownSeries).toEqual([100, 50])
    })

    test('builds CPU charts with warning usage (cpuPercent > 75 and <= 90)', () => {
      const m = {
        cpuPercent: 80,
        cpuUserSeconds: 100,
        cpuSystemSeconds: 50,
      }
      const result = buildCPUCharts(m, commonOpts, false)
      
      expect(result.cpuGaugeOptions.colors).toEqual(['#ffc107'])
    })

    test('builds CPU charts with critical usage (cpuPercent > 90)', () => {
      const m = {
        cpuPercent: 95,
        cpuUserSeconds: 100,
        cpuSystemSeconds: 50,
      }
      const result = buildCPUCharts(m, commonOpts, false)
      
      expect(result.cpuGaugeOptions.colors).toEqual(['#dc3545'])
    })

    test('builds CPU charts caps cpuGaugeSeries at 100', () => {
      const m = {
        cpuPercent: 150, // Over 100
        cpuUserSeconds: 100,
        cpuSystemSeconds: 50,
      }
      const result = buildCPUCharts(m, commonOpts, false)
      
      expect(result.cpuGaugeSeries).toEqual([100])
    })

    test('builds CPU charts with dark mode', () => {
      const m = {
        cpuPercent: 50,
        cpuUserSeconds: 100,
        cpuSystemSeconds: 50,
      }
      const result = buildCPUCharts(m, commonOpts, true)
      
      expect(result.cpuGaugeOptions.plotOptions.radialBar.track.background).toBe('#e0e0e0')
    })

    test('builds CPU charts with missing values', () => {
      const m = {}
      const result = buildCPUCharts(m, commonOpts, false)
      
      expect(result.cpuGaugeSeries).toEqual([0])
      expect(result.cpuBreakdownSeries).toEqual([0, 0])
    })
  })

  describe('buildNetworkChart', () => {
    const commonOpts = {
      chart: {},
      theme: { mode: 'light' },
      xaxis: {},
    }

    test('builds network chart with data', () => {
      const m = {
        networkRxBytes: 1000,
        networkTxBytes: 2000,
      }
      const result = buildNetworkChart(m, commonOpts)

      expect(result.networkChartSeries).toEqual([{ name: 'Bytes', data: [1000, 2000] }])
    })

    test('builds network chart with missing values', () => {
      const m = {}
      const result = buildNetworkChart(m, commonOpts)
      
      expect(result.networkChartSeries).toEqual([{ name: 'Bytes', data: [0, 0] }])
    })
  })

  describe('buildFSChart', () => {
    const commonOpts = {
      chart: {},
      theme: { mode: 'light' },
      xaxis: {},
    }

    test('builds FS chart with limit', () => {
      const m = {
        fsUsage: 50,
        fsLimit: 100,
      }
      const result = buildFSChart(m, commonOpts)

      expect(result.fsChartSeries.length).toBe(2)
    })

    test('builds FS chart without limit', () => {
      const m = {
        fsUsage: 50,
      }
      const result = buildFSChart(m, commonOpts)
      
      expect(result.fsChartSeries.length).toBe(1)
    })

    test('builds FS chart with missing values', () => {
      const m = {}
      const result = buildFSChart(m, commonOpts)
      
      expect(result.fsChartSeries).toEqual([{ name: 'Used', data: [0] }])
    })
  })
})
