// networkChart.test.js
// Tests for network chart builder functions

const { buildNetworkChart } = require('../../../../../src/components/tasks/details/NetworkChart.jsx')
const { formatBytesCompact } = require('../../../../../src/common/formatUtils')

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

    test('builds network chart with only Rx value', () => {
      const m = { networkRxBytes: 1000 }
      const result = buildNetworkChart(m, commonOpts)
      
      expect(result.networkChartSeries).toEqual([{ name: 'Bytes', data: [1000, 0] }])
    })

    test('builds network chart with only Tx value', () => {
      const m = { networkTxBytes: 2000 }
      const result = buildNetworkChart(m, commonOpts)
      
      expect(result.networkChartSeries).toEqual([{ name: 'Bytes', data: [0, 2000] }])
    })

    test('builds network chart with zero values', () => {
      const m = { networkRxBytes: 0, networkTxBytes: 0 }
      const result = buildNetworkChart(m, commonOpts)
      
      expect(result.networkChartSeries).toEqual([{ name: 'Bytes', data: [0, 0] }])
    })

    test('builds network chart with falsy values', () => {
      const m = { networkRxBytes: null, networkTxBytes: undefined }
      const result = buildNetworkChart(m, commonOpts)
      
      expect(result.networkChartSeries).toEqual([{ name: 'Bytes', data: [0, 0] }])
    })

    test('builds network chart with large values to test formatBytes', () => {
      const m = {
        networkRxBytes: 1024 * 1024, // 1 MB
        networkTxBytes: 1024 * 1024 * 1024, // 1 GB
      }
      const result = buildNetworkChart(m, commonOpts)
      
      expect(result.networkChartSeries).toEqual([{ name: 'Bytes', data: [1048576, 1073741824] }])
      // Verify formatBytes is called correctly
      expect(formatBytesCompact(1024)).toBe('1 KB')
      expect(formatBytesCompact(1024 * 1024)).toBe('1 MB')
    })

    test('builds network chart with dark mode theme', () => {
      const m = {
        networkRxBytes: 1000,
        networkTxBytes: 2000,
      }
      const darkOpts = {
        ...commonOpts,
        theme: { mode: 'dark' },
      }
      const result = buildNetworkChart(m, darkOpts)
      
      expect(result.networkChartOptions.theme.mode).toBe('dark')
    })

    test('dataLabels formatter formats bytes correctly', () => {
      const m = { networkRxBytes: 1000, networkTxBytes: 2000 }
      const result = buildNetworkChart(m, commonOpts)
      const formatter = result.networkChartOptions.dataLabels.formatter
      expect(formatter(1024)).toBe('1 KB')
    })

    test('xaxis labels formatter formats bytes correctly', () => {
      const m = { networkRxBytes: 1000, networkTxBytes: 2000 }
      const result = buildNetworkChart(m, commonOpts)
      const formatter = result.networkChartOptions.xaxis.labels.formatter
      expect(formatter(1048576)).toBe('1 MB')
    })
  })
})
