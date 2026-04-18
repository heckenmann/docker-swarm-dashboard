// fsChart.test.js
// Tests for filesystem chart builder functions

const { buildFSChart } = require('../../../../../src/components/tasks/details/fsChart')

describe('fsChart', () => {
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
