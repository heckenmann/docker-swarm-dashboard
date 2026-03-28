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
  const hashAtom = atomWithHash(key)
  return atom(
    (get) => get(hashAtom) ?? get(defaultAtom),
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

// Dashboard settings from server - must be declared before Default atoms that depend on it
export const dashboardSettingsAtom = atom(async (get) => {
  return (await fetch(get(baseUrlAtom) + 'ui/dashboard-settings')).json()
})

// Default atoms - provide server defaults for UI settings
// Note: Server always returns valid JSON with all properties, so no ?? null fallback needed
export const refreshIntervalDefaultAtom = atom(
  async (get) => (await get(dashboardSettingsAtom)).refreshInterval,
)
export const tableSizeDefaultAtom = atom(
  async (get) => (await get(dashboardSettingsAtom)).tableSize,
)
export const serviceNameFilterDefaultAtom = atom(
  async (get) => (await get(dashboardSettingsAtom)).serviceNameFilter,
)
export const stackNameFilterDefaultAtom = atom(
  async (get) => (await get(dashboardSettingsAtom)).stackNameFilter,
)
export const filterTypeDefaultAtom = atom(
  async (get) => (await get(dashboardSettingsAtom)).filterType,
)
export const logsNumberOfLinesDefaultAtom = atom(
  async (get) => (await get(dashboardSettingsAtom)).logsNumberOfLines,
)
export const logsMessageMaxLenDefaultAtom = atom(
  async (get) => (await get(dashboardSettingsAtom)).logsMessageMaxLen,
)
export const logsFormTailDefaultAtom = atom(
  async (get) => (await get(dashboardSettingsAtom)).logsFormTail,
)
export const logsFormSinceDefaultAtom = atom(
  async (get) => (await get(dashboardSettingsAtom)).logsFormSince,
)
export const logsFormSinceAmountDefaultAtom = atom(
  async (get) => (await get(dashboardSettingsAtom)).logsFormSinceAmount,
)
export const logsFormSinceUnitDefaultAtom = atom(
  async (get) => (await get(dashboardSettingsAtom)).logsFormSinceUnit,
)
export const logsFormFollowDefaultAtom = atom(
  async (get) => (await get(dashboardSettingsAtom)).logsFormFollow,
)
export const logsFormTimestampsDefaultAtom = atom(
  async (get) => (await get(dashboardSettingsAtom)).logsFormTimestamps,
)
export const logsFormStdoutDefaultAtom = atom(
  async (get) => (await get(dashboardSettingsAtom)).logsFormStdout,
)
export const logsFormStderrDefaultAtom = atom(
  async (get) => (await get(dashboardSettingsAtom)).logsFormStderr,
)
export const logsFormDetailsDefaultAtom = atom(
  async (get) => (await get(dashboardSettingsAtom)).logsFormDetails,
)
export const logsSearchKeywordDefaultAtom = atom(
  async (get) => (await get(dashboardSettingsAtom)).logsSearchKeyword,
)
export const isDarkModeDefaultAtom = atom(
  async (get) => (await get(dashboardSettingsAtom)).isDarkMode,
)
export const showNamesButtonsDefaultAtom = atom(
  async (get) => (await get(dashboardSettingsAtom)).showNamesButtons,
)
export const showNavLabelsDefaultAtom = atom(
  async (get) => (await get(dashboardSettingsAtom)).showNavLabels,
)
export const maxContentWidthDefaultAtom = atom(
  async (get) => (await get(dashboardSettingsAtom)).maxContentWidth,
)
export const defaultLayoutDefaultAtom = atom(
  async (get) => (await get(dashboardSettingsAtom)).defaultLayout,
)
export const hiddenServiceStatesDefaultAtom = atom(
  async (get) => (await get(dashboardSettingsAtom)).hiddenServiceStates,
)
export const timeZoneDefaultAtom = atom(
  async (get) => (await get(dashboardSettingsAtom)).timeZone,
)
export const localeDefaultAtom = atom(
  async (get) => (await get(dashboardSettingsAtom)).locale,
)

// Re-export utility for use in other atom files
export { createHashAtomWithDefault }
