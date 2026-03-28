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

// Refresh interval for auto-refresh
export const refreshIntervalAtom = atomWithHash('refreshInterval', null)

// Table size setting
export const tableSizeAtom = createHashAtomWithDefault(
  'tablesize',
  tableSizeDefaultAtom,
)

// Service name filter
export const serviceNameFilterAtom = createHashAtomWithDefault(
  'serviceNameFilter',
  serviceNameFilterDefaultAtom,
)

// Stack name filter
export const stackNameFilterAtom = createHashAtomWithDefault(
  'stackNameFilter',
  stackNameFilterDefaultAtom,
)

// Which type the filter UI currently uses: 'service' or 'stack'
export const filterTypeAtom = createHashAtomWithDefault(
  'filterType',
  filterTypeDefaultAtom,
)

// Show names buttons setting
export const showNamesButtonsAtom = createHashAtomWithDefault(
  'showNamesButtons',
  showNamesButtonsDefaultAtom,
)

// Show nav labels setting
export const showNavLabelsAtom = createHashAtomWithDefault(
  'showNavLabels',
  showNavLabelsDefaultAtom,
)

// Max content width setting
export const maxContentWidthAtom = createHashAtomWithDefault(
  'maxContentWidth',
  maxContentWidthDefaultAtom,
)

// Default layout setting
export const defaultLayoutAtom = createHashAtomWithDefault(
  'defaultLayout',
  defaultLayoutDefaultAtom,
)

// Hidden service states setting
export const hiddenServiceStatesAtom = createHashAtomWithDefault(
  'hiddenServiceStates',
  hiddenServiceStatesDefaultAtom,
)

// Timezone setting
export const timeZoneAtom = createHashAtomWithDefault(
  'timeZone',
  timeZoneDefaultAtom,
)

// Locale setting
export const localeAtom = createHashAtomWithDefault('locale', localeDefaultAtom)

// Welcome message visibility
export const showWelcomeMessageAtom = atom(true)

// Network requests counter for loading bar
export const networkRequestsAtom = atom(0)

// Base URL default (separate from the main baseUrlAtom for reset purposes)
export const baseUrlDefaultAtom = atomWithHash(
  'baseUrlDefault',
  window.location.pathname,
)
