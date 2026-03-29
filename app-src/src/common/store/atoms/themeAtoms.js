import { atom } from 'jotai'
import {
  createHashAtomWithDefault,
  isDarkModeDefaultAtom,
} from './foundationAtoms'

const a11yDark = {}
const a11yLight = {}

/**
 * Dark mode: persists the dark/light theme preference in URL hash, falling back to server default.
 */
export const isDarkModeAtom = createHashAtomWithDefault(
  'darkMode',
  isDarkModeDefaultAtom,
)

/**
 * Current variant: derives 'dark' or 'light' string from the isDarkModeAtom for use with UI libraries.
 */
export const currentVariantAtom = atom(async (get) => {
  const isDarkMode = await get(isDarkModeAtom)
  return isDarkMode ? 'dark' : 'light'
})

/**
 * Current variant classes: derives Bootstrap CSS classes for the active theme variant.
 */
export const currentVariantClassesAtom = atom(async (get) =>
  (await get(isDarkModeAtom))
    ? 'bg-dark text-light border-secondary'
    : 'bg-light text-dark',
)

/**
 * Current syntax highlighter style: derives the code syntax highlighting style for the active theme.
 */
export const currentSyntaxHighlighterStyleAtom = atom(async (get) =>
  // keep API shape for tests/components — returns an object
  (await get(isDarkModeAtom)) ? a11yDark : a11yLight,
)
