import { atom } from 'jotai'
import { unwrap } from 'jotai/utils'

const loadableAtoms = new WeakMap()
const LOADING = { state: 'loading' }

/**
 * Read an atom without suspending, retaining explicit loading and error states.
 * Uses Jotai v3's unwrap utility and caches wrappers by source atom identity.
 *
 * @param {object} sourceAtom - The synchronous or asynchronous source atom.
 * @returns {object} An atom exposing loading, hasData, or hasError state.
 */
export function loadable(sourceAtom) {
  if (loadableAtoms.has(sourceAtom)) return loadableAtoms.get(sourceAtom)

  const unwrappedAtom = unwrap(sourceAtom, () => LOADING)
  const resultAtom = atom((get) => {
    try {
      const data = get(unwrappedAtom)
      return data === LOADING ? LOADING : { state: 'hasData', data }
    } catch (error) {
      return { state: 'hasError', error }
    }
  })
  loadableAtoms.set(sourceAtom, resultAtom)
  return resultAtom
}
