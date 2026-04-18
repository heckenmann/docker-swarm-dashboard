/**
 * Safely get a CSS variable value from the document root.
 * Falls back to a provided default if not found or in non-browser env.
 * @param {string} varName - CSS variable name (e.g. '--chart-cpu')
 * @param {string} fallback - Fallback hex color
 * @returns {string} Color hex string
 */
export function getCssVar(varName, fallback) {
  if (typeof window === 'undefined' || !window.getComputedStyle) return fallback
  const val = window
    .getComputedStyle(document.documentElement)
    .getPropertyValue(varName)
    .trim()
  return val || fallback
}

/**
 * Get chart theme configuration based on dark mode.
 * @param {boolean} isDarkMode - Whether dark mode is enabled
 * @returns {object} Theme configuration for ApexCharts
 */
export const CHART_PALETTES = {
  get cpu() {
    return [
      getCssVar('--chart-cpu', '#0d6efd'),
      getCssVar('--bs-indigo', '#6610f2'),
      getCssVar('--bs-teal', '#20c997'),
      getCssVar('--bs-cyan', '#0dcaf0'),
    ]
  },
  get memory() {
    return [
      getCssVar('--chart-mem', '#198754'),
      getCssVar('--bs-teal', '#20c997'),
      getCssVar('--bs-cyan', '#0dcaf0'),
      getCssVar('--bs-info', '#0dcaf0'),
    ]
  },
  get network() {
    return [
      getCssVar('--chart-net', '#6610f2'),
      getCssVar('--bs-purple', '#6f42c1'),
      getCssVar('--bs-pink', '#d63384'),
      getCssVar('--bs-indigo', '#6610f2'),
    ]
  },
  get filesystem() {
    return [
      getCssVar('--chart-fs', '#fd7e14'),
      getCssVar('--bs-orange', '#fd7e14'),
      getCssVar('--bs-yellow', '#ffc107'),
      getCssVar('--bs-warning', '#ffc107'),
    ]
  },
  status: {
    get normal() {
      return getCssVar('--chart-normal', '#198754')
    },
    get warning() {
      return getCssVar('--chart-warning', '#ffc107')
    },
    get critical() {
      return getCssVar('--chart-critical', '#dc3545')
    },
  },
}

export const GAUGE_DEFAULTS = {
  startAngle: -130,
  endAngle: 130,
  hollowSize: '55%',
  get trackBackground() {
    return getCssVar('--chart-gauge-track', '#e0e0e0')
  },
  valueFontSize: '22px',
  nameFontSize: '14px',
}

export const getGaugeTrackBackground = () => GAUGE_DEFAULTS.trackBackground

/**
 * Get the current theme mode from document
 * Checks for data-bs-theme attribute or theme-dark class
 * @returns {string} 'dark' or 'light'
 */
export function getCurrentTheme() {
  if (typeof document === 'undefined') return 'light'
  const dataTheme = document.documentElement.getAttribute('data-bs-theme')
  if (dataTheme) return dataTheme
  return document.documentElement.classList.contains('theme-dark')
    ? 'dark'
    : 'light'
}

export const METRIC_THRESHOLDS = {
  warning: 75,
  critical: 90,
}

export const getStatusColor = (percentage) => {
  if (percentage > METRIC_THRESHOLDS.critical) return CHART_PALETTES.status.critical
  if (percentage > METRIC_THRESHOLDS.warning) return CHART_PALETTES.status.warning
  return CHART_PALETTES.status.normal
}

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
  // Read from dedicated chart CSS variables
  // These are set on document.documentElement and updated via useEffect in App.jsx
  const textColor = getCssVar(
    '--chart-text',
    isDarkMode ? '#e6eef8' : '#212529',
  )
  const gridColor = getCssVar(
    '--chart-grid',
    isDarkMode ? '#495057' : '#dee2e6',
  )

  return {
    theme: getChartTheme(isDarkMode),
    chart: {
      foreColor: textColor,
      background: 'transparent',
      fontFamily:
        'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
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
          fontFamily:
            'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        },
      },
    },
    yaxis: {
      labels: {
        style: {
          colors: textColor,
          fontFamily:
            'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        },
      },
    },
    legend: {
      labels: {
        colors: textColor,
        useSeriesColors: false,
      },
      fontFamily:
        'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    },
    tooltip: {
      theme: isDarkMode ? 'dark' : 'light',
      style: {
        fontFamily:
          'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      },
    },
  }
}
