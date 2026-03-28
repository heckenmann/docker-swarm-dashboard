import { atom } from 'jotai'
import { atomWithReset } from 'jotai/utils'
import {
  createHashAtomWithDefault,
  baseUrlAtom,
  logsNumberOfLinesDefaultAtom,
  logsMessageMaxLenDefaultAtom,
  logsFormTailDefaultAtom,
  logsFormSinceDefaultAtom,
  logsFormSinceAmountDefaultAtom,
  logsFormSinceUnitDefaultAtom,
  logsFormFollowDefaultAtom,
  logsFormTimestampsDefaultAtom,
  logsFormStdoutDefaultAtom,
  logsFormStderrDefaultAtom,
  logsFormDetailsDefaultAtom,
  logsSearchKeywordDefaultAtom,
} from './foundationAtoms'

/**
 * Logs output: stores the array of log lines currently displayed in the logs panel.
 */
export const logsLinesAtom = atomWithReset([])
/**
 * Logs visibility toggle: controls whether the logs panel is shown.
 */
export const logsShowLogsAtom = atom(false)

/**
 * Logs number of lines: persists the number of log lines to fetch in URL hash, falling back to server default.
 */
export const logsNumberOfLinesAtom = createHashAtomWithDefault(
  'logsNumberOfLines',
  logsNumberOfLinesDefaultAtom,
)

/**
 * Logs configuration: holds the current service ID and filter parameters used to configure log retrieval.
 */
export const logsConfigAtom = atom()

/**
 * Logs message max length: persists the maximum character length for log messages in URL hash, falling back to server default.
 */
export const logsMessageMaxLenAtom = createHashAtomWithDefault(
  'logsMessageMaxLen',
  logsMessageMaxLenDefaultAtom,
)

/**
 * Logs form service ID: stores the Docker service ID for log retrieval, reset when navigating away.
 */
export const logsFormServiceIdAtom = atomWithReset('')
/**
 * Logs form service name: stores the Docker service name for log retrieval, reset when navigating away.
 */
export const logsFormServiceNameAtom = atomWithReset('')

/**
 * Logs form tail: persists whether to fetch last N lines vs all logs in URL hash, falling back to server default.
 */
export const logsFormTailAtom = createHashAtomWithDefault(
  'logsFormTail',
  logsFormTailDefaultAtom,
)

/**
 * Logs form since: persists whether to filter logs by time (since) vs all logs in URL hash, falling back to server default.
 */
export const logsFormSinceAtom = createHashAtomWithDefault(
  'logsFormSince',
  logsFormSinceDefaultAtom,
)

/**
 * Logs form since error: tracks validation errors for the since input field.
 */
export const logsFormSinceErrorAtom = atomWithReset(false)

/**
 * Logs form show advanced: toggles visibility of advanced log options (since, follow, timestamps).
 */
export const logsFormShowAdvancedAtom = atomWithReset(false)

/**
 * Logs form since amount: persists the numeric amount for the since filter in URL hash, falling back to server default.
 */
export const logsFormSinceAmountAtom = createHashAtomWithDefault(
  'logsFormSinceAmount',
  logsFormSinceAmountDefaultAtom,
)

/**
 * Logs form since unit: persists the time unit (seconds, minutes, hours) for the since filter in URL hash, falling back to server default.
 */
export const logsFormSinceUnitAtom = createHashAtomWithDefault(
  'logsFormSinceUnit',
  logsFormSinceUnitDefaultAtom,
)

/**
 * Logs form since ISO: tracks whether the since input is in ISO timestamp format vs relative time.
 */
export const logsFormSinceIsISOAtom = atomWithReset(false)

/**
 * Logs form follow: persists whether to stream logs in real-time in URL hash, falling back to server default.
 */
export const logsFormFollowAtom = createHashAtomWithDefault(
  'logsFormFollow',
  logsFormFollowDefaultAtom,
)

/**
 * Logs form timestamps: persists whether to show timestamps in log output in URL hash, falling back to server default.
 */
export const logsFormTimestampsAtom = createHashAtomWithDefault(
  'logsFormTimestamps',
  logsFormTimestampsDefaultAtom,
)

/**
 * Logs form stdout: persists whether to show stdout logs in URL hash, falling back to server default.
 */
export const logsFormStdoutAtom = createHashAtomWithDefault(
  'logsFormStdout',
  logsFormStdoutDefaultAtom,
)

/**
 * Logs form stderr: persists whether to show stderr logs in URL hash, falling back to server default.
 */
export const logsFormStderrAtom = createHashAtomWithDefault(
  'logsFormStderr',
  logsFormStderrDefaultAtom,
)

/**
 * Logs form details: persists whether to show extra log details in URL hash, falling back to server default.
 */
export const logsFormDetailsAtom = createHashAtomWithDefault(
  'logsFormDetails',
  logsFormDetailsDefaultAtom,
)

/**
 * Logs search keyword: persists the keyword filter for log output in URL hash, falling back to server default.
 */
export const logsSearchKeywordAtom = createHashAtomWithDefault(
  'logsSearchKeyword',
  logsSearchKeywordDefaultAtom,
)

/**
 * Build the websocket URL used to fetch logs for the currently configured
 * `logsConfigAtom` value. Returns `null` when no logs config is set.
 *
 * The atom reads `baseUrlAtom` and adapts to absolute or relative base
 * URLs, switching the protocol to `ws(s)` and appending query parameters.
 *
 * @returns {string|null} websocket URL or null
 */
export const logsWebsocketUrlAtom = atom((get) => {
  const logsConfig = get(logsConfigAtom)
  if (!logsConfig) {
    return null
  }
  const baseUrl = get(baseUrlAtom)

  // Split baseUrl into components
  let protocol, host, pathname
  if (/^https?:\/\//.test(baseUrl)) {
    // baseUrl is a full URL
    const urlObj = new URL(baseUrl)
    protocol = urlObj.protocol.replace(/^http/, 'ws')
    host = urlObj.host
    pathname = urlObj.pathname
  } else {
    // baseUrl is a relative path
    protocol = window.location.protocol.replace(/^http/, 'ws')
    host = window.location.host
    pathname = baseUrl
  }

  // Ensure the path ends with a slash before appending
  if (!pathname.endsWith('/')) pathname += '/'
  pathname += 'docker/logs/' + logsConfig.serviceId

  // Build query string from logsConfig parameters
  const params = new URLSearchParams({
    tail: logsConfig.tail,
    since: logsConfig.since,
    follow: logsConfig.follow,
    timestamps: logsConfig.timestamps,
    stdout: logsConfig.stdout,
    stderr: logsConfig.stderr,
    details: logsConfig.details,
  })

  // Construct the full WebSocket URL
  const wsUrl = `${protocol}//${host}${pathname}?${params.toString()}`
  return wsUrl
})
