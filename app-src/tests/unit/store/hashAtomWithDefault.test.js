/**
 * @jest-environment jsdom
 *
 * Regression tests for createHashAtomWithDefault, exercised against a real
 * Jotai store (no mocks) because the bug they guard against lives in the
 * synchronous/asynchronous nature of the atom itself.
 */

import { atom, createStore } from 'jotai'
import { createHashAtomWithDefault } from '../../../src/common/store/atoms/foundationAtoms'

describe('createHashAtomWithDefault', () => {
  beforeEach(() => {
    window.history.replaceState(null, '', window.location.pathname)
  })

  test('falls back to the server default while no hash value is set', async () => {
    const defaultAtom = atom(async () => 'from-server')
    const hashAtom = createHashAtomWithDefault('probeA', defaultAtom)
    const store = createStore()

    await expect(store.get(hashAtom)).resolves.toBe('from-server')
  })

  test('returns the same pending promise instance on repeated reads', () => {
    const defaultAtom = atom(async () => 'from-server')
    const hashAtom = createHashAtomWithDefault('probeB', defaultAtom)
    const store = createStore()

    // A new promise per read would make consumers suspend over and over.
    expect(store.get(hashAtom)).toBe(store.get(hashAtom))
  })

  test('resolves synchronously once a value has been written', () => {
    const defaultAtom = atom(async () => 'from-server')
    const hashAtom = createHashAtomWithDefault('probeC', defaultAtom)
    const store = createStore()

    store.set(hashAtom, 'ngin')

    // This is the guarantee that keeps keyboard focus alive: an async read
    // would hand out a fresh pending promise on every keystroke, suspending
    // the view and remounting the whole subtree under <Suspense>.
    const value = store.get(hashAtom)
    expect(value).not.toBeInstanceOf(Promise)
    expect(value).toBe('ngin')
  })

  test('persists the value in the URL hash', () => {
    const defaultAtom = atom(async () => 'from-server')
    const hashAtom = createHashAtomWithDefault('probeD', defaultAtom)
    const store = createStore()

    store.set(hashAtom, 'nginx')

    expect(decodeURIComponent(window.location.hash)).toContain('probeD="nginx"')
  })

  test('replaces history entries instead of pushing one per keystroke', () => {
    const defaultAtom = atom(async () => 'from-server')
    const hashAtom = createHashAtomWithDefault('probeE', defaultAtom)
    const store = createStore()

    const initialLength = window.history.length
    for (const value of ['n', 'ng', 'ngi', 'ngin', 'nginx']) {
      store.set(hashAtom, value)
    }

    expect(window.history.length).toBe(initialLength)
  })
})
