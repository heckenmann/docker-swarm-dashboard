// cpuCharts.test.js
// Tests for CPU chart builder functions

const { buildCPUCharts } = require('../../../../../src/components/tasks/details/CpuCharts.jsx')

describe('cpuCharts', () => {
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
      // Note: track background now comes from CSS variables
      const result = buildCPUCharts(m, commonOpts, true)
      
      expect(result.cpuGaugeOptions.plotOptions.radialBar.track.background).toBe('#e0e0e0')
    })

    test('builds CPU charts with light mode', () => {
      const m = {
        cpuPercent: 50,
        cpuUserSeconds: 100,
        cpuSystemSeconds: 50,
      }
      const result = buildCPUCharts(m, commonOpts, false)
      
      expect(result.cpuGaugeOptions.plotOptions.radialBar.track.background).toBe('#e0e0e0')
    })

    test('builds CPU charts with missing values', () => {
      const m = {}
      const result = buildCPUCharts(m, commonOpts, false)
      
      expect(result.cpuGaugeSeries).toEqual([0])
      expect(result.cpuBreakdownSeries).toEqual([0, 0])
    })

    test('builds CPU charts with zero values', () => {
      const m = {
        cpuPercent: 0,
        cpuUserSeconds: 0,
        cpuSystemSeconds: 0,
      }
      const result = buildCPUCharts(m, commonOpts, false)
      
      expect(result.cpuGaugeSeries).toEqual([0])
      expect(result.cpuBreakdownSeries).toEqual([0, 0])
    })

    test('builds CPU charts with only user seconds', () => {
      const m = {
        cpuPercent: 50,
        cpuUserSeconds: 100,
      }
      const result = buildCPUCharts(m, commonOpts, false)
      
      expect(result.cpuBreakdownSeries).toEqual([100, 0])
    })

    test('builds CPU charts with only system seconds', () => {
      const m = {
        cpuPercent: 50,
        cpuSystemSeconds: 50,
      }
      const result = buildCPUCharts(m, commonOpts, false)

      expect(result.cpuBreakdownSeries).toEqual([0, 50])
    })

    test('builds CPU charts without quota but with usage', () => {
      const m = {
        cpuPercent: 0,
        cpuUsage: 123.456,
        cpuUserSeconds: 50,
        cpuSystemSeconds: 30,
      }
      const result = buildCPUCharts(m, commonOpts, false)

      // Gauge should show 0 series value (empty gauge) when no quota
      expect(result.cpuGaugeSeries).toEqual([0])
      
      // Label should show 'CPU Time' instead of 'CPU Quota'
      expect(result.cpuGaugeOptions.labels).toEqual(['CPU Time'])
      
      // Formatter should show absolute CPU time
      const formatter = result.cpuGaugeOptions.plotOptions.radialBar.dataLabels.value.formatter
      expect(formatter(0)).toBe('123.46s')
    })

    test('builds CPU charts with zero usage and no quota', () => {
      const m = {
        cpuPercent: 0,
        cpuUsage: 0,
        cpuUserSeconds: 0,
        cpuSystemSeconds: 0,
      }
      const result = buildCPUCharts(m, commonOpts, false)

      expect(result.cpuGaugeSeries).toEqual([0])
      expect(result.cpuGaugeOptions.labels).toEqual(['CPU Time'])
    })

    test('cpuGaugeOptions formatter function formats value correctly with quota', () => {
      const m = { cpuPercent: 50, cpuUsage: 2.5, cpuUserSeconds: 100, cpuSystemSeconds: 50 }
      const result = buildCPUCharts(m, commonOpts, false)
      const formatter = result.cpuGaugeOptions.plotOptions.radialBar.dataLabels.value.formatter
      expect(formatter(75.123)).toBe('75.1%')
    })

    test('cpuGaugeOptions formatter shows absolute time without quota', () => {
      const m = { cpuPercent: 0, cpuUsage: 123.456, cpuUserSeconds: 100, cpuSystemSeconds: 50 }
      const result = buildCPUCharts(m, commonOpts, false)
      const formatter = result.cpuGaugeOptions.plotOptions.radialBar.dataLabels.value.formatter
      expect(formatter(0)).toBe('123.46s')
    })

    test('cpuBreakdownOptions dataLabels formatter formats value correctly', () => {
      const m = { cpuPercent: 50, cpuUserSeconds: 100, cpuSystemSeconds: 50 }
      const result = buildCPUCharts(m, commonOpts, false)
      const formatter = result.cpuBreakdownOptions.dataLabels.formatter
      expect(formatter(33.333)).toBe('33.3%')
    })
  })
})
