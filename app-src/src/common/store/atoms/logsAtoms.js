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

// Logs output state
export const logsLinesAtom = atomWithReset([])
export const logsShowLogsAtom = atom(false)

// Logs number of lines setting
export const logsNumberOfLinesAtom = createHashAtomWithDefault(
  'logsNumberOfLines',
  logsNumberOfLinesDefaultAtom,
)

// Logs config atom (holds current logs configuration)
export const logsConfigAtom = atom()

// Logs message max length setting
export const logsMessageMaxLenAtom = createHashAtomWithDefault(
  'logsMessageMaxLen',
  logsMessageMaxLenDefaultAtom,
)

// Form-level atoms to persist logs form state across navigation
export const logsFormServiceIdAtom = atomWithReset('')
export const logsFormServiceNameAtom = atomWithReset('')

// Logs form tail setting
export const logsFormTailAtom = createHashAtomWithDefault(
  'logsFormTail',
  logsFormTailDefaultAtom,
)

// Logs form since setting
export const logsFormSinceAtom = createHashAtomWithDefault(
  'logsFormSince',
  logsFormSinceDefaultAtom,
)

// Logs form since error state
export const logsFormSinceErrorAtom = atomWithReset(false)

// Logs form show advanced toggle
export const logsFormShowAdvancedAtom = atomWithReset(false)

// Logs form since amount setting
export const logsFormSinceAmountAtom = createHashAtomWithDefault(
  'logsFormSinceAmount',
  logsFormSinceAmountDefaultAtom,
)

// Logs form since unit setting
export const logsFormSinceUnitAtom = createHashAtomWithDefault(
  'logsFormSinceUnit',
  logsFormSinceUnitDefaultAtom,
)

// Logs form since ISO timestamp flag
export const logsFormSinceIsISOAtom = atomWithReset(false)

// Logs form follow setting
export const logsFormFollowAtom = createHashAtomWithDefault(
  'logsFormFollow',
  logsFormFollowDefaultAtom,
)

// Logs form timestamps setting
export const logsFormTimestampsAtom = createHashAtomWithDefault(
  'logsFormTimestamps',
  logsFormTimestampsDefaultAtom,
)

// Logs form stdout setting
export const logsFormStdoutAtom = createHashAtomWithDefault(
  'logsFormStdout',
  logsFormStdoutDefaultAtom,
)

// Logs form stderr setting
export const logsFormStderrAtom = createHashAtomWithDefault(
  'logsFormStderr',
  logsFormStderrDefaultAtom,
)

// Logs form details setting
export const logsFormDetailsAtom = createHashAtomWithDefault(
  'logsFormDetails',
  logsFormDetailsDefaultAtom,
)

// Logs search keyword setting
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
