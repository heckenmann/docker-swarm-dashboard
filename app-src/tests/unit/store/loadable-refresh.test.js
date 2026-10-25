import { atom, createStore } from 'jotai/vanilla'
import { waitFor } from '@testing-library/react'
import { loadable } from '../../../src/common/store/loadable'

// Retaining resolved metrics avoids synchronous loading updates during refresh.
test('retains resolved data during refresh without changing default loading behavior', async () => {
  let resolveInitial
  const source = atom(
    new Promise((resolve) => {
      resolveInitial = resolve
    }),
  )
  const retained = loadable(source, true)
  const normal = loadable(source)
  expect(loadable(source, true)).toBe(retained)
  expect(loadable(source)).toBe(normal)
  expect(retained).not.toBe(normal)
  const store = createStore()
  const unsubscribeRetained = store.sub(retained, () => {})
  const unsubscribeNormal = store.sub(normal, () => {})
  try {
    expect(store.get(retained)).toEqual({ state: 'loading' })
    const first = { available: true, metrics: { memory: { available: 10 } } }
    resolveInitial(first)
    await waitFor(() => {
      expect(store.get(retained)).toEqual({ state: 'hasData', data: first })
    })
    let resolveRefresh
    store.set(
      source,
      new Promise((resolve) => {
        resolveRefresh = resolve
      }),
    )
    expect(store.get(retained)).toEqual({ state: 'hasData', data: first })
    expect(store.get(normal)).toEqual({ state: 'loading' })
    const next = { available: true, metrics: { memory: { available: 20 } } }
    resolveRefresh(next)
    await waitFor(() => {
      expect(store.get(retained)).toEqual({ state: 'hasData', data: next })
      expect(store.get(normal)).toEqual({ state: 'hasData', data: next })
    })
  } finally {
    unsubscribeRetained()
    unsubscribeNormal()
  }
})
