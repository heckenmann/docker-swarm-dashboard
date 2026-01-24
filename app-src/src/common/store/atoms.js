import { atom } from 'jotai'
import { atomWithReducer, atomWithReset, selectAtom } from 'jotai/utils'
import a11yDark from 'react-syntax-highlighter/dist/esm/styles/hljs/a11y-dark'
import a11yLight from 'react-syntax-highlighter/dist/esm/styles/hljs/a11y-light'
import { MessageReducer, RefreshIntervalToggleReducer } from './reducers'
import { atomWithHash } from 'jotai-location'
import { dashboardHId, dashboardVId } from '../navigationConstants'

// Initiale Werte
const hash = window.location.hash
const hashWithoutHash = hash.substring(1)

// Den Hash-Teil in eine Objektstruktur parsen
const parsedHash = hashWithoutHash
  .split('&')
  .map((pair) => pair.split('='))
  .reduce((acc, [key, value]) => {
    acc[key] = decodeURIComponent(value)
    return acc
  }, {})

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
  let id = get(viewAtom)['detail']
  return (await fetch(get(baseUrlAtom) + 'docker/nodes/' + id)).json()
})
export const logsServicesAtom = atom(async (get) => {
  // Reload when view changed
  get(viewAtom)
  return (await fetch(get(baseUrlAtom) + 'ui/logs/services')).json()
})
export const serviceDetailAtom = atom(async (get) => {
  let id = get(viewAtom)['detail']
  return (await fetch(get(baseUrlAtom) + 'docker/services/' + id)).json()
})
export const taskDetailAtom = atom(async (get) => {
  let id = get(viewAtom)['detail']
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

// Track outstanding network requests (number)
export const networkRequestsAtom = atom(0)
export const currentSyntaxHighlighterStyleAtom = atom((get) =>
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
