// networkChart.test.js
// Tests for network chart builder functions

const { buildNetworkChart } = require('../../../../../src/components/tasks/details/networkChart')

describe('networkChart', () => {
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
      
      expect(result.networkChartOptions.title.text).toBe('Network Traffic (Total)')
      expect(result.networkChartSeries).toEqual([{ name: 'Bytes', data: [1000, 2000] }])
    })

    test('builds network chart with missing values', () => {
      const m = {}
      const result = buildNetworkChart(m, commonOpts)
      
      expect(result.networkChartSeries).toEqual([{ name: 'Bytes', data: [0, 0] }])
    })
  })
})
