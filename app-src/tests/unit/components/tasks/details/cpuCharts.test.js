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
      
      expect(result.cpuGaugeOptions.colors).toEqual(['#0d6efd'])
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
      
      expect(result.cpuGaugeOptions.colors).toEqual(['#fd7e14'])
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
      
      expect(result.cpuGaugeOptions.plotOptions.radialBar.track.background).toBe('#444')
    })

    test('builds CPU charts with missing values', () => {
      const m = {}
      const result = buildCPUCharts(m, commonOpts, false)
      
      expect(result.cpuGaugeSeries).toEqual([0])
      expect(result.cpuBreakdownSeries).toEqual([0, 0])
    })
  })
})
