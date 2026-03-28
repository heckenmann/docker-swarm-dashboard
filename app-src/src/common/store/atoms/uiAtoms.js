import { atom } from 'jotai'
import { atomWithHash } from 'jotai-location'
import {
  createHashAtomWithDefault,
  tableSizeDefaultAtom,
  serviceNameFilterDefaultAtom,
  stackNameFilterDefaultAtom,
  filterTypeDefaultAtom,
  showNamesButtonsDefaultAtom,
  showNavLabelsDefaultAtom,
  maxContentWidthDefaultAtom,
  defaultLayoutDefaultAtom,
  hiddenServiceStatesDefaultAtom,
  timeZoneDefaultAtom,
  localeDefaultAtom,
} from './foundationAtoms'

/**
 * Refresh interval: stores the auto-refresh interval in URL hash (null means auto-refresh is disabled).
 */
export const refreshIntervalAtom = atomWithHash('refreshInterval', null)

/**
 * Table size: persists the table row density preference in URL hash, falling back to server default.
 */
export const tableSizeAtom = createHashAtomWithDefault(
  'tablesize',
  tableSizeDefaultAtom,
)

/**
 * Service name filter: persists the service name search filter in URL hash, falling back to server default.
 */
export const serviceNameFilterAtom = createHashAtomWithDefault(
  'serviceNameFilter',
  serviceNameFilterDefaultAtom,
)

/**
 * Stack name filter: persists the stack name search filter in URL hash, falling back to server default.
 */
export const stackNameFilterAtom = createHashAtomWithDefault(
  'stackNameFilter',
  stackNameFilterDefaultAtom,
)

/**
 * Filter type: persists whether the filter UI shows 'service' or 'stack' filter options in URL hash, falling back to server default.
 */
export const filterTypeAtom = createHashAtomWithDefault(
  'filterType',
  filterTypeDefaultAtom,
)

/**
 * Show names buttons: persists whether to display service/node name buttons in URL hash, falling back to server default.
 */
export const showNamesButtonsAtom = createHashAtomWithDefault(
  'showNamesButtons',
  showNamesButtonsDefaultAtom,
)

/**
 * Show nav labels: persists whether to show text labels next to navigation icons in URL hash, falling back to server default.
 */
export const showNavLabelsAtom = createHashAtomWithDefault(
  'showNavLabels',
  showNavLabelsDefaultAtom,
)

/**
 * Max content width: persists the maximum content width (null = unlimited) in URL hash, falling back to server default.
 */
export const maxContentWidthAtom = createHashAtomWithDefault(
  'maxContentWidth',
  maxContentWidthDefaultAtom,
)

/**
 * Default layout: persists whether horizontal (row) or vertical (column) dashboard layout is used in URL hash, falling back to server default.
 */
export const defaultLayoutAtom = createHashAtomWithDefault(
  'defaultLayout',
  defaultLayoutDefaultAtom,
)

/**
 * Hidden service states: persists which service states (e.g., running, stopped) are hidden from view in URL hash, falling back to server default.
 */
export const hiddenServiceStatesAtom = createHashAtomWithDefault(
  'hiddenServiceStates',
  hiddenServiceStatesDefaultAtom,
)

/**
 * Timezone: persists the timezone used for displaying timestamps in URL hash, falling back to server default.
 */
export const timeZoneAtom = createHashAtomWithDefault(
  'timeZone',
  timeZoneDefaultAtom,
)

/**
 * Locale: persists the language/locale setting for UI text and formatting in URL hash, falling back to server default.
 */
export const localeAtom = createHashAtomWithDefault('locale', localeDefaultAtom)

/**
 * Welcome message visibility: controls whether the welcome message is shown on the dashboard.
 */
export const showWelcomeMessageAtom = atom(true)

/**
 * Network requests counter: tracks the number of pending network requests for displaying a loading indicator.
 */
export const networkRequestsAtom = atom(0)

/**
 * Base URL default: mirrors the current pathname as a fallback base URL for reset functionality.
 */
export const baseUrlDefaultAtom = atomWithHash(
  'baseUrlDefault',
  window.location.pathname,
)
