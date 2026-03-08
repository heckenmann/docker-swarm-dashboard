/**
 * Validates the "since" option for log fetching.
 * Accepts a duration string (e.g. "5m", "1h", "2d") or an ISO timestamp.
 * @param {string} s - the value to validate
 * @returns {boolean} true if the value is a valid duration or ISO date
 */
export function isValidSince(s) {
  if (!s) return false
  if (/^\d+[smhd]$/.test(s)) return true
  const d = Date.parse(s)
  return !Number.isNaN(d)
}
