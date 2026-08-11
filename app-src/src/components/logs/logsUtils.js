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

/**
 * Converts a raw websocket payload into a log line, truncating overly long
 * messages so a single huge line cannot freeze the output panel.
 *
 * @param {*} raw - the raw `MessageEvent.data` value
 * @param {number|string} maxLen - maximum message length before truncation
 * @returns {string} the log line to display
 */
export function toLogLine(raw, maxLen) {
  let message
  if (typeof raw === 'string') message = raw
  else {
    try {
      message = JSON.stringify(raw)
    } catch {
      message = String(raw)
    }
  }
  const limit = Number(maxLen) || 10000
  return message.length > limit ? message.slice(0, limit) + '...' : message
}
