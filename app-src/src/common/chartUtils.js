/**
 * Get chart theme configuration based on dark mode.
 * @param {boolean} isDarkMode - Whether dark mode is enabled
 * @returns {object} Theme configuration for ApexCharts
 */
export function getChartTheme(isDarkMode) {
  return {
    mode: isDarkMode ? 'dark' : 'light',
    palette: 'palette1',
    monochrome: {
      enabled: false,
    },
  }
}

/**
 * Get common ApexCharts options respecting dark mode and toolbar visibility.
 * Used as a base for all charts in the dashboard; individual charts can spread
 * and override specific keys.
 *
 * @param {boolean} isDarkMode - Whether dark mode is active
 * @param {boolean} [showToolbar=true] - Whether to show the chart download toolbar
 * @returns {object} Shared chart option overrides
 */
export function getCommonChartOptions(isDarkMode, showToolbar = true) {
  const textColor = isDarkMode ? '#e0e0e0' : '#373d3f'
  const gridColor = isDarkMode ? '#444' : '#e0e0e0'

  return {
    theme: getChartTheme(isDarkMode),
    chart: {
      foreColor: textColor,
      background: 'transparent',
      toolbar: showToolbar
        ? {
            show: true,
            tools: {
              download: true,
              selection: false,
              zoom: false,
              zoomin: false,
              zoomout: false,
              pan: false,
              reset: false,
            },
          }
        : { show: false },
    },
    grid: {
      borderColor: gridColor,
    },
    xaxis: {
      labels: {
        style: {
          colors: textColor,
        },
      },
    },
    yaxis: {
      labels: {
        style: {
          colors: textColor,
        },
      },
    },
    legend: {
      labels: {
        colors: textColor,
      },
    },
    tooltip: {
      theme: isDarkMode ? 'dark' : 'light',
    },
  }
}
