import { atom } from 'jotai'
import { atomWithReducer, atomWithReset } from 'jotai/utils'
const a11yDark = {}
const a11yLight = {}
import { MessageReducer, RefreshIntervalToggleReducer } from './reducers'
import { atomWithHash } from 'jotai-location'
import {
  dashboardHId,
  dashboardVId,
  servicesDetailId,
  nodesDetailId,
  tasksDetailId,
} from '../navigationConstants'

// Initial values
/**
 * Parse a window.location.hash string into an object map.
 *
 * Supports hashes like `#base=/app&view=foo` and decodes URI components.
 * Surrounding or embedded quotes are removed to normalize values.
 *
 * @param {string} hashString - The hash string to parse (may start with `#`).
 * @returns {Object<string,string>} A map of parsed key/value pairs.
 */
export function parseHashToObj(hashString) {
  const hash = typeof hashString === 'string' ? hashString : ''
  const hashWithoutHash = hash.startsWith('#') ? hash.substring(1) : hash
  if (!hashWithoutHash) return {}
  return hashWithoutHash
    .split('&')
    .map((pair) => pair.split('='))
    .reduce((acc, [key, value]) => {
      try {
        // Decode and remove surrounding or embedded quotes to normalize values
        acc[key] = decodeURIComponent(value).replaceAll('"', '')
      } catch {
        acc[key] = (value || '').replaceAll('"', '')
      }
      return acc
    }, {})
}

// Initial parsed hash (computed from real window during module load)
const parsedHash = parseHashToObj(window.location.hash)

// Jotai-Atoms
export const baseUrlAtom = atomWithHash(
  'base',
  parsedHash.base
    ? parsedHash.base.replaceAll('"', '')
    : window.location.pathname,
)
export const refreshIntervalAtom = atomWithReducer(
  null,
  RefreshIntervalToggleReducer,
)
export const viewAtom = atomWithHash('view', {})
export const messagesAtom = atomWithReducer([], MessageReducer)
export const tableSizeAtom = atomWithHash('tablesize', 'sm')
export const serviceNameFilterAtom = atomWithHash('serviceNameFilter', '')
export const stackNameFilterAtom = atomWithHash('stackNameFilter', '')
// Which type the filter UI currently uses: 'service' or 'stack'
export const filterTypeAtom = atomWithHash('filterType', 'service')

// New API
export const dashboardHAtom = atom(async (get) => {
  // Reload when view changed
  get(viewAtom)
  return (await fetch(get(baseUrlAtom) + 'ui/dashboardh')).json()
})
export const dashboardVAtom = atom(async (get) => {
  // Reload when view changed
  get(viewAtom)
  return (await fetch(get(baseUrlAtom) + 'ui/dashboardv')).json()
})
export const stacksAtom = atom(async (get) => {
  // Reload when view changed
  get(viewAtom)
  return (await fetch(get(baseUrlAtom) + 'ui/stacks')).json()
})
export const portsAtom = atom(async (get) => {
  // Reload when view changed
  get(viewAtom)
  return (await fetch(get(baseUrlAtom) + 'ui/ports')).json()
})
export const nodesAtomNew = atom(async (get) => {
  // Reload when view changed
  get(viewAtom)
  return (await fetch(get(baseUrlAtom) + 'ui/nodes')).json()
})
export const tasksAtomNew = atom(async (get) => {
  // Reload when view changed
  get(viewAtom)
  return (await fetch(get(baseUrlAtom) + 'ui/tasks')).json()
})
export const nodeDetailAtom = atom(async (get) => {
  const view = get(viewAtom) || {}
  // Only fetch node details when the active view is the nodes detail view
  if (view.id !== nodesDetailId) return null
  const id = view['detail']
  if (!id) return null
  return (await fetch(get(baseUrlAtom) + 'docker/nodes/' + id)).json()
})
export const logsServicesAtom = atom(async (get) => {
  // Reload when view changed
  get(viewAtom)
  return (await fetch(get(baseUrlAtom) + 'ui/logs/services')).json()
})
export const serviceDetailAtom = atom(async (get) => {
  const view = get(viewAtom) || {}
  // Only fetch service details when the active view is the services detail view
  if (view.id !== servicesDetailId) return null
  const id = view['detail']
  if (!id) return null
  return (await fetch(get(baseUrlAtom) + 'docker/services/' + id)).json()
})
export const taskDetailAtom = atom(async (get) => {
  const view = get(viewAtom) || {}
  // Only fetch task details when the active view is the tasks detail view
  if (view.id !== tasksDetailId) return null
  const id = view['detail']
  if (!id) return null
  return (await fetch(get(baseUrlAtom) + 'docker/tasks/' + id)).json()
})

export const timelineAtom = atom(async (get) => {
  // Reload when view changed
  get(viewAtom)
  return (await fetch(get(baseUrlAtom) + 'ui/timeline')).json()
})

// Logs
export const logsLinesAtom = atomWithReset([])
export const logsShowLogsAtom = atom(false)
export const logsNumberOfLinesAtom = atomWithReset(20)
export const logsConfigAtom = atom()
export const logsMessageMaxLenAtom = atomWithReset(10000)
// Form-level atoms to persist logs form state across navigation
export const logsFormServiceIdAtom = atomWithReset('')
export const logsFormServiceNameAtom = atomWithReset('')
export const logsFormTailAtom = atomWithReset('20')
export const logsFormSinceAtom = atomWithReset('1h')
export const logsFormSinceErrorAtom = atomWithReset(false)
export const logsFormShowAdvancedAtom = atomWithReset(false)
export const logsFormSinceAmountAtom = atomWithReset('1')
export const logsFormSinceUnitAtom = atomWithReset('h')
export const logsFormSinceIsISOAtom = atomWithReset(false)
export const logsFormFollowAtom = atomWithReset(false)
export const logsFormTimestampsAtom = atomWithReset(false)
export const logsFormStdoutAtom = atomWithReset(true)
export const logsFormStderrAtom = atomWithReset(true)
export const logsFormDetailsAtom = atomWithReset(false)
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

// Theme
export const isDarkModeAtom = atomWithHash('darkMode', false)
export const currentVariantAtom = atom((get) =>
  get(isDarkModeAtom) ? 'dark' : 'light',
)
export const currentVariantClassesAtom = atom((get) =>
  get(isDarkModeAtom)
    ? 'bg-dark text-light border-secondary'
    : 'bg-light text-dark',
)

// UI preferences
// Control whether action buttons next to entity names are shown
export const showNamesButtonsAtom = atomWithHash('showNamesButtons', true)

// Track outstanding network requests (number)
export const networkRequestsAtom = atom(0)
export const currentSyntaxHighlighterStyleAtom = atom((get) =>
  // keep API shape for tests/components — returns an object
  get(isDarkModeAtom) ? a11yDark : a11yLight,
)

// Dashboard settings
export const dashboardSettingsAtom = atom(async (get) => {
  return (await fetch(get(baseUrlAtom) + 'ui/dashboard-settings')).json()
})

export const versionAtom = atom(async (get) => {
  return (await fetch(get(baseUrlAtom) + 'ui/version')).json()
})

export const dashboardSettingsDefaultLayoutViewIdAtom = atom(async (get) =>
  (await get(dashboardSettingsAtom)).defaultLayout === 'row'
    ? dashboardHId
    : dashboardVId,
)

export const showWelcomeMessageAtom = atom(true)
