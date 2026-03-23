import { atom } from 'jotai'
import { atomWithReducer, atomWithReset } from 'jotai/utils'
const a11yDark = {}
const a11yLight = {}
import { MessageReducer } from './reducers'
import { atomWithHash } from 'jotai-location'

/**
 * Creates an atom that:
 * 1. Reads from URL hash first (if value exists)
 * 2. Falls back to server default if no hash value
 * 3. Writes changes back to URL hash
 *
 * @param {string} key - The URL hash key
 * @param {Atom} defaultAtom - The atom providing server defaults
 * @returns {Atom} An atom with hash persistence and server fallback
 */
const createHashAtomWithDefault = (key, defaultAtom) => {
  const hashAtom = atomWithHash(key)
  return atom(
    (get) => get(hashAtom) ?? get(defaultAtom),
    (get, set, value) => set(hashAtom, value),
  )
}
import {
  dashboardHId,
  dashboardVId,
  servicesDetailId,
  nodesDetailId,
  tasksId,
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
export const refreshIntervalAtom = atomWithHash('refreshInterval', null)
export const refreshIntervalDefaultAtom = atom(
  async (get) => (await get(dashboardSettingsAtom)).refreshInterval ?? null,
)
export const viewAtom = atomWithHash('view', {})
export const messagesAtom = atomWithReducer([], MessageReducer)
export const tableSizeAtom = createHashAtomWithDefault(
  'tablesize',
  tableSizeDefaultAtom,
)
export const tableSizeDefaultAtom = atom(
  async (get) => (await get(dashboardSettingsAtom)).tableSize,
)
export const serviceNameFilterAtom = createHashAtomWithDefault(
  'serviceNameFilter',
  serviceNameFilterDefaultAtom,
)
export const serviceNameFilterDefaultAtom = atom(
  async (get) => (await get(dashboardSettingsAtom)).serviceNameFilter,
)
export const stackNameFilterAtom = createHashAtomWithDefault(
  'stackNameFilter',
  stackNameFilterDefaultAtom,
)
export const stackNameFilterDefaultAtom = atom(
  async (get) => (await get(dashboardSettingsAtom)).stackNameFilter,
)
// Which type the filter UI currently uses: 'service' or 'stack'
export const filterTypeAtom = createHashAtomWithDefault(
  'filterType',
  filterTypeDefaultAtom,
)
export const filterTypeDefaultAtom = atom(
  async (get) => (await get(dashboardSettingsAtom)).filterType,
)

export const dashboardHAtom = atom(async (get) => {
  get(viewAtom)
  return (await fetch(get(baseUrlAtom) + 'ui/dashboardh')).json()
})
export const dashboardVAtom = atom(async (get) => {
  get(viewAtom)
  return (await fetch(get(baseUrlAtom) + 'ui/dashboardv')).json()
})
export const stacksAtom = atom(async (get) => {
  get(viewAtom)
  return (await fetch(get(baseUrlAtom) + 'ui/stacks')).json()
})
export const portsAtom = atom(async (get) => {
  get(viewAtom)
  return (await fetch(get(baseUrlAtom) + 'ui/ports')).json()
})
export const nodesAtomNew = atom(async (get) => {
  get(viewAtom)
  return (await fetch(get(baseUrlAtom) + 'ui/nodes')).json()
})
export const tasksAtomNew = atom(async (get) => {
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
  // Accept both the legacy `tasks` id and the more explicit `tasksDetail`
  if (view.id !== tasksDetailId && view.id !== tasksId) return null
  const id = view['detail']
  if (!id) return null
  return (await fetch(get(baseUrlAtom) + 'docker/tasks/' + id)).json()
})

export const timelineAtom = atom(async (get) => {
  get(viewAtom)
  return (await fetch(get(baseUrlAtom) + 'ui/timeline')).json()
})

// Logs
export const logsLinesAtom = atomWithReset([])
export const logsShowLogsAtom = atom(false)
export const logsNumberOfLinesAtom = createHashAtomWithDefault(
  'logsNumberOfLines',
  logsNumberOfLinesDefaultAtom,
)
export const logsNumberOfLinesDefaultAtom = atom(
  async (get) => (await get(dashboardSettingsAtom)).logsNumberOfLines,
)
export const logsConfigAtom = atom()
export const logsMessageMaxLenAtom = createHashAtomWithDefault(
  'logsMessageMaxLen',
  logsMessageMaxLenDefaultAtom,
)
export const logsMessageMaxLenDefaultAtom = atom(
  async (get) => (await get(dashboardSettingsAtom)).logsMessageMaxLen,
)
// Form-level atoms to persist logs form state across navigation
export const logsFormServiceIdAtom = atomWithReset('')
export const logsFormServiceNameAtom = atomWithReset('')
export const logsFormTailAtom = createHashAtomWithDefault(
  'logsFormTail',
  logsFormTailDefaultAtom,
)
export const logsFormTailDefaultAtom = atom(
  async (get) => (await get(dashboardSettingsAtom)).logsFormTail,
)
export const logsFormSinceAtom = createHashAtomWithDefault(
  'logsFormSince',
  logsFormSinceDefaultAtom,
)
export const logsFormSinceDefaultAtom = atom(
  async (get) => (await get(dashboardSettingsAtom)).logsFormSince,
)
export const logsFormSinceErrorAtom = atomWithReset(false)
export const logsFormShowAdvancedAtom = atomWithReset(false)
export const logsFormSinceAmountAtom = createHashAtomWithDefault(
  'logsFormSinceAmount',
  logsFormSinceAmountDefaultAtom,
)
export const logsFormSinceAmountDefaultAtom = atom(
  async (get) => (await get(dashboardSettingsAtom)).logsFormSinceAmount,
)
export const logsFormSinceUnitAtom = createHashAtomWithDefault(
  'logsFormSinceUnit',
  logsFormSinceUnitDefaultAtom,
)
export const logsFormSinceUnitDefaultAtom = atom(
  async (get) => (await get(dashboardSettingsAtom)).logsFormSinceUnit,
)
export const logsFormSinceIsISOAtom = atomWithReset(false)
export const logsFormFollowAtom = createHashAtomWithDefault(
  'logsFormFollow',
  logsFormFollowDefaultAtom,
)
export const logsFormFollowDefaultAtom = atom(
  async (get) => (await get(dashboardSettingsAtom)).logsFormFollow,
)
export const logsFormTimestampsAtom = createHashAtomWithDefault(
  'logsFormTimestamps',
  logsFormTimestampsDefaultAtom,
)
export const logsFormTimestampsDefaultAtom = atom(
  async (get) => (await get(dashboardSettingsAtom)).logsFormTimestamps,
)
export const logsFormStdoutAtom = createHashAtomWithDefault(
  'logsFormStdout',
  logsFormStdoutDefaultAtom,
)
export const logsFormStdoutDefaultAtom = atom(
  async (get) => (await get(dashboardSettingsAtom)).logsFormStdout,
)
export const logsFormStderrAtom = createHashAtomWithDefault(
  'logsFormStderr',
  logsFormStderrDefaultAtom,
)
export const logsFormStderrDefaultAtom = atom(
  async (get) => (await get(dashboardSettingsAtom)).logsFormStderr,
)
export const logsFormDetailsAtom = createHashAtomWithDefault(
  'logsFormDetails',
  logsFormDetailsDefaultAtom,
)
export const logsFormDetailsDefaultAtom = atom(
  async (get) => (await get(dashboardSettingsAtom)).logsFormDetails,
)
export const logsSearchKeywordAtom = createHashAtomWithDefault(
  'logsSearchKeyword',
  logsSearchKeywordDefaultAtom,
)
export const logsSearchKeywordDefaultAtom = atom(
  async (get) => (await get(dashboardSettingsAtom)).logsSearchKeyword,
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

// Theme
export const isDarkModeAtom = createHashAtomWithDefault(
  'darkMode',
  isDarkModeDefaultAtom,
)
export const isDarkModeDefaultAtom = atom(
  async (get) => (await get(dashboardSettingsAtom)).isDarkMode,
)
export const currentVariantAtom = atom((get) =>
  get(isDarkModeAtom) ? 'dark' : 'light',
)
export const currentVariantClassesAtom = atom((get) =>
  get(isDarkModeAtom)
    ? 'bg-dark text-light border-secondary'
    : 'bg-light text-dark',
)

// Track outstanding network requests (number)
export const networkRequestsAtom = atom(0)
export const currentSyntaxHighlighterStyleAtom = atom((get) =>
  // keep API shape for tests/components — returns an object
  get(isDarkModeAtom) ? a11yDark : a11yLight,
)

// Dashboard settings from server
export const dashboardSettingsAtom = atom(async (get) => {
  return (await fetch(get(baseUrlAtom) + 'ui/dashboard-settings')).json()
})

// UI Settings with server defaults
// These atoms use URL hash values with server defaults as fallback
// Note: tableSizeAtom, serviceNameFilterAtom, stackNameFilterAtom, filterTypeAtom are already defined above
export const showNamesButtonsAtom = createHashAtomWithDefault(
  'showNamesButtons',
  showNamesButtonsDefaultAtom,
)
export const showNamesButtonsDefaultAtom = atom(
  async (get) => (await get(dashboardSettingsAtom)).showNamesButtons,
)
export const showNavLabelsAtom = createHashAtomWithDefault(
  'showNavLabels',
  showNavLabelsDefaultAtom,
)
export const showNavLabelsDefaultAtom = atom(
  async (get) => (await get(dashboardSettingsAtom)).showNavLabels,
)
export const maxContentWidthAtom = createHashAtomWithDefault(
  'maxContentWidth',
  maxContentWidthDefaultAtom,
)
export const maxContentWidthDefaultAtom = atom(
  async (get) => (await get(dashboardSettingsAtom)).maxContentWidth,
)

// Additional settings with server defaults
export const defaultLayoutAtom = createHashAtomWithDefault(
  'defaultLayout',
  defaultLayoutDefaultAtom,
)
export const defaultLayoutDefaultAtom = atom(
  async (get) => (await get(dashboardSettingsAtom)).defaultLayout,
)

export const hiddenServiceStatesAtom = createHashAtomWithDefault(
  'hiddenServiceStates',
  hiddenServiceStatesDefaultAtom,
)
export const hiddenServiceStatesDefaultAtom = atom(
  async (get) => (await get(dashboardSettingsAtom)).hiddenServiceStates,
)
export const timeZoneAtom = createHashAtomWithDefault(
  'timeZone',
  timeZoneDefaultAtom,
)
export const timeZoneDefaultAtom = atom(
  async (get) => (await get(dashboardSettingsAtom)).timeZone,
)
export const localeAtom = createHashAtomWithDefault('locale', localeDefaultAtom)
export const localeDefaultAtom = atom(
  async (get) => (await get(dashboardSettingsAtom)).locale,
)

// Incrementing this atom triggers a re-fetch of versionAtom without causing
// a full-page Suspense re-render on every navigation (unlike viewAtom).
export const versionRefreshAtom = atom(0)

export const versionAtom = atom(async (get) => {
  // Only re-fetch when the user explicitly triggers a refresh, not on navigation.
  get(versionRefreshAtom)
  try {
    return await (await fetch(get(baseUrlAtom) + 'ui/version')).json()
  } catch {
    // Return a safe fallback so the UI does not crash on network errors.
    return {
      version: '',
      remoteVersion: '',
      updateAvailable: false,
      lastChecked: '',
    }
  }
})

export const dashboardSettingsDefaultLayoutViewIdAtom = atom(async (get) => {
  const defaultLayout = await get(defaultLayoutAtom)
  return defaultLayout === 'row' ? dashboardHId : dashboardVId
})

export const showWelcomeMessageAtom = atom(true)

export const baseUrlDefaultAtom = atomWithHash(
  'baseUrlDefault',
  window.location.pathname,
)
