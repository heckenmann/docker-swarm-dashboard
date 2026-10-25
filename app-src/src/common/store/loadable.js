import { atom } from 'jotai'
import { unwrap } from 'jotai/utils'

const loadableAtoms = new WeakMap()
const retainedLoadableAtoms = new WeakMap()
const LOADING = { state: 'loading' }
const keepPreviousValue = (previous) => previous ?? LOADING
const showLoading = () => LOADING

/**
 * Read an atom without suspending, retaining explicit loading and error states.
 * Uses Jotai v3's unwrap utility and caches wrappers by source atom identity.
 *
 * @param {object} sourceAtom - The synchronous or asynchronous source atom.
 * @param {boolean} [keepPreviousData=false] - Retain resolved data during refresh.
 * @returns {object} An atom exposing loading, hasData, or hasError state.
 */
export function loadable(sourceAtom, keepPreviousData = false) {
  const cache = keepPreviousData ? retainedLoadableAtoms : loadableAtoms
  if (cache.has(sourceAtom)) return cache.get(sourceAtom)

  const unwrappedAtom = unwrap(
    sourceAtom,
    keepPreviousData ? keepPreviousValue : showLoading,
  )
  const resultAtom = atom((get) => {
    try {
      const data = get(unwrappedAtom)
      return data === LOADING ? LOADING : { state: 'hasData', data }
    } catch (error) {
      return { state: 'hasError', error }
    }
  })
  cache.set(sourceAtom, resultAtom)
  return resultAtom
}
