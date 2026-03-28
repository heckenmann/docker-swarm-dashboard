import { atom } from 'jotai'
import {
  createHashAtomWithDefault,
  isDarkModeDefaultAtom,
} from './foundationAtoms'

const a11yDark = {}
const a11yLight = {}

// Dark mode setting
export const isDarkModeAtom = createHashAtomWithDefault(
  'darkMode',
  isDarkModeDefaultAtom,
)

// Derived variant string ('dark' or 'light')
export const currentVariantAtom = atom((get) =>
  get(isDarkModeAtom) ? 'dark' : 'light',
)

// Derived variant CSS classes
export const currentVariantClassesAtom = atom((get) =>
  get(isDarkModeAtom)
    ? 'bg-dark text-light border-secondary'
    : 'bg-light text-dark',
)

// Syntax highlighter style (derived from dark mode)
export const currentSyntaxHighlighterStyleAtom = atom((get) =>
  // keep API shape for tests/components — returns an object
  get(isDarkModeAtom) ? a11yDark : a11yLight,
)
