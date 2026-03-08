/**
 * Format a byte count into a human-readable string using binary prefixes.
 * Uses "Bytes" as the base unit label (e.g. "1.23 KB", "0 Bytes").
 * Suitable for displaying totals in metrics dashboards.
 *
 * @param {number} bytes - Number of bytes
 * @param {number} [decimals=2] - Number of decimal places
 * @returns {string} Formatted string, e.g. "1.23 MB"
 */
export function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
}

/**
 * Format a byte count into a compact human-readable string using binary prefixes.
 * Uses "B" as the base unit label (e.g. "1.2 KB", "0 B").
 * Suitable for compact table cells and detail views.
 *
 * @param {number} bytes - Number of bytes
 * @param {number} [decimals=1] - Number of decimal places
 * @returns {string} Formatted string, e.g. "1.2 MB"
 */
export function formatBytesCompact(bytes, decimals = 1) {
  if (bytes === 0) return '0 B'
  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
}

/**
 * Format an uptime value in seconds to a human-readable "Xd Yh Zm" string.
 * @param {number} seconds - Uptime in seconds
 * @returns {string} Formatted uptime, e.g. "3d 4h 12m", or "N/A" if falsy
 */
export function formatUptime(seconds) {
  if (!seconds) return 'N/A'
  const days = Math.floor(seconds / 86400)
  const hours = Math.floor((seconds % 86400) / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  return `${days}d ${hours}h ${minutes}m`
}

/**
 * Convert bytes to megabytes with two decimal places.
 * @param {number} bytes - Number of bytes
 * @returns {string} Megabyte value with 2 decimals, e.g. "1.23"
 */
export function bytesToMB(bytes) {
  return (bytes / 1024 / 1024).toFixed(2)
}

/**
 * Determine a Bootstrap text-colour class based on a usage percentage.
 * Returns danger styling above 90 %, warning above 75 %, nothing below.
 *
 * @param {number} pct - Percentage value 0–100
 * @returns {string} Bootstrap utility class string
 */
export function pctClass(pct) {
  if (pct > 90) return 'text-danger fw-bold'
  if (pct > 75) return 'text-warning fw-bold'
  return ''
}
