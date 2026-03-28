import { atom } from 'jotai'
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
  const hashAtom = atomWithHash(key, null)
  return atom(
    (get) => {
      const hashValue = get(hashAtom)
      if (hashValue !== undefined && hashValue !== null) return hashValue
      return get(defaultAtom)
    },
    (get, set, value) => set(hashAtom, value),
  )
}

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

// Base URL - persisted in URL hash
export const baseUrlAtom = atomWithHash(
  'base',
  parsedHash.base
    ? parsedHash.base.replaceAll('"', '')
    : window.location.pathname,
)

/**
 * Dashboard settings: fetches the user's dashboard configuration from the backend.
 * This includes refresh intervals, table sizes, filter settings, and UI preferences.
 */
export const dashboardSettingsAtom = atom(async (get) => {
  return (await fetch(get(baseUrlAtom) + 'ui/dashboard-settings')).json()
})

/**
 * Default refresh interval: extracted from dashboardSettingsAtom for initializing the refresh interval setting.
 */
export const refreshIntervalDefaultAtom = atom(
  async (get) => (await get(dashboardSettingsAtom)).refreshInterval,
)
/**
 * Default table size: extracted from dashboardSettingsAtom for initializing the table size setting.
 */
export const tableSizeDefaultAtom = atom(
  async (get) => (await get(dashboardSettingsAtom)).tableSize,
)
/**
 * Default service name filter: extracted from dashboardSettingsAtom for initializing the service filter.
 */
export const serviceNameFilterDefaultAtom = atom(
  async (get) => (await get(dashboardSettingsAtom)).serviceNameFilter,
)
/**
 * Default stack name filter: extracted from dashboardSettingsAtom for initializing the stack filter.
 */
export const stackNameFilterDefaultAtom = atom(
  async (get) => (await get(dashboardSettingsAtom)).stackNameFilter,
)
/**
 * Default filter type: extracted from dashboardSettingsAtom for initializing whether service or stack filter is active.
 */
export const filterTypeDefaultAtom = atom(
  async (get) => (await get(dashboardSettingsAtom)).filterType,
)
/**
 * Default logs number of lines: extracted from dashboardSettingsAtom for initializing the logs tail setting.
 */
export const logsNumberOfLinesDefaultAtom = atom(
  async (get) => (await get(dashboardSettingsAtom)).logsNumberOfLines,
)
/**
 * Default logs message max length: extracted from dashboardSettingsAtom for initializing the logs message truncation limit.
 */
export const logsMessageMaxLenDefaultAtom = atom(
  async (get) => (await get(dashboardSettingsAtom)).logsMessageMaxLen,
)
/**
 * Default logs form tail: extracted from dashboardSettingsAtom for initializing the logs tail checkbox.
 */
export const logsFormTailDefaultAtom = atom(
  async (get) => (await get(dashboardSettingsAtom)).logsFormTail,
)
/**
 * Default logs form since: extracted from dashboardSettingsAtom for initializing the logs since selector.
 */
export const logsFormSinceDefaultAtom = atom(
  async (get) => (await get(dashboardSettingsAtom)).logsFormSince,
)
/**
 * Default logs form since amount: extracted from dashboardSettingsAtom for initializing the logs since amount input.
 */
export const logsFormSinceAmountDefaultAtom = atom(
  async (get) => (await get(dashboardSettingsAtom)).logsFormSinceAmount,
)
/**
 * Default logs form since unit: extracted from dashboardSettingsAtom for initializing the logs since unit selector.
 */
export const logsFormSinceUnitDefaultAtom = atom(
  async (get) => (await get(dashboardSettingsAtom)).logsFormSinceUnit,
)
/**
 * Default logs form follow: extracted from dashboardSettingsAtom for initializing the logs follow checkbox.
 */
export const logsFormFollowDefaultAtom = atom(
  async (get) => (await get(dashboardSettingsAtom)).logsFormFollow,
)
/**
 * Default logs form timestamps: extracted from dashboardSettingsAtom for initializing the logs timestamps checkbox.
 */
export const logsFormTimestampsDefaultAtom = atom(
  async (get) => (await get(dashboardSettingsAtom)).logsFormTimestamps,
)
/**
 * Default logs form stdout: extracted from dashboardSettingsAtom for initializing the logs stdout checkbox.
 */
export const logsFormStdoutDefaultAtom = atom(
  async (get) => (await get(dashboardSettingsAtom)).logsFormStdout,
)
/**
 * Default logs form stderr: extracted from dashboardSettingsAtom for initializing the logs stderr checkbox.
 */
export const logsFormStderrDefaultAtom = atom(
  async (get) => (await get(dashboardSettingsAtom)).logsFormStderr,
)
/**
 * Default logs form details: extracted from dashboardSettingsAtom for initializing the logs details checkbox.
 */
export const logsFormDetailsDefaultAtom = atom(
  async (get) => (await get(dashboardSettingsAtom)).logsFormDetails,
)
/**
 * Default logs search keyword: extracted from dashboardSettingsAtom for initializing the logs search input.
 */
export const logsSearchKeywordDefaultAtom = atom(
  async (get) => (await get(dashboardSettingsAtom)).logsSearchKeyword,
)
/**
 * Default dark mode: extracted from dashboardSettingsAtom for initializing the dark mode setting.
 */
export const isDarkModeDefaultAtom = atom(
  async (get) => (await get(dashboardSettingsAtom)).isDarkMode,
)
/**
 * Default show names buttons: extracted from dashboardSettingsAtom for initializing whether service/node name buttons are visible.
 */
export const showNamesButtonsDefaultAtom = atom(
  async (get) => (await get(dashboardSettingsAtom)).showNamesButtons,
)
/**
 * Default show nav labels: extracted from dashboardSettingsAtom for initializing whether navigation labels are visible.
 */
export const showNavLabelsDefaultAtom = atom(
  async (get) => (await get(dashboardSettingsAtom)).showNavLabels,
)
/**
 * Default max content width: extracted from dashboardSettingsAtom for initializing the content width limit setting.
 */
export const maxContentWidthDefaultAtom = atom(
  async (get) => (await get(dashboardSettingsAtom)).maxContentWidth,
)
/**
 * Default layout: extracted from dashboardSettingsAtom for initializing whether horizontal or vertical dashboard layout is used.
 */
export const defaultLayoutDefaultAtom = atom(
  async (get) => (await get(dashboardSettingsAtom)).defaultLayout,
)
/**
 * Default hidden service states: extracted from dashboardSettingsAtom for initializing which service states are hidden in the UI.
 */
export const hiddenServiceStatesDefaultAtom = atom(
  async (get) => (await get(dashboardSettingsAtom)).hiddenServiceStates,
)
/**
 * Default timezone: extracted from dashboardSettingsAtom for initializing the timezone setting for timestamps.
 */
export const timeZoneDefaultAtom = atom(
  async (get) => (await get(dashboardSettingsAtom)).timeZone,
)
/**
 * Default locale: extracted from dashboardSettingsAtom for initializing the language/locale setting.
 */
export const localeDefaultAtom = atom(
  async (get) => (await get(dashboardSettingsAtom)).locale,
)

// Re-export utility for use in other atom files
export { createHashAtomWithDefault }
