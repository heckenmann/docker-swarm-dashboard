import { getChartTheme, getCommonChartOptions } from '../../../src/common/chartUtils'

describe('chartUtils', () => {
  describe('getChartTheme', () => {
    it('returns dark theme when isDarkMode is true', () => {
      const result = getChartTheme(true)
      expect(result.mode).toBe('dark')
      expect(result.palette).toBe('palette1')
    })

    it('returns light theme when isDarkMode is false', () => {
      const result = getChartTheme(false)
      expect(result.mode).toBe('light')
      expect(result.palette).toBe('palette1')
    })
  })

  describe('getCommonChartOptions', () => {
    it('returns options with toolbar hidden when showToolbar is false', () => {
      const result = getCommonChartOptions(true, false)
      expect(result.chart.toolbar).toEqual({ show: false })
    })

    it('returns options with toolbar shown by default', () => {
      const result = getCommonChartOptions(true)
      expect(result.chart.toolbar.show).toBe(true)
      expect(result.chart.toolbar.tools).toBeDefined()
    })

    it('returns options with dark mode colors', () => {
      const result = getCommonChartOptions(true)
      expect(result.chart.foreColor).toBeDefined()
      expect(result.grid.borderColor).toBeDefined()
    })

    it('returns options with light mode colors', () => {
      const result = getCommonChartOptions(false)
      expect(result.chart.foreColor).toBeDefined()
      expect(result.grid.borderColor).toBeDefined()
    })
  })
})
