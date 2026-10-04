import { atom, createStore } from 'jotai'
import { waitFor } from '@testing-library/react'
import { loadable } from '../../../src/common/store/loadable'

describe('loadable with Jotai v3', () => {
  test.each([undefined, null, false, 0, 'value', { state: 'loading' }])(
    'preserves synchronous data: %p',
    (value) => {
      const store = createStore()
      expect(store.get(loadable(atom(value)))).toEqual({
        state: 'hasData',
        data: value,
      })
    },
  )

  test('reuses wrappers by source identity and keeps stores independent', () => {
    const source = atom(1)
    const wrapped = loadable(source)
    expect(loadable(source)).toBe(wrapped)
    expect(loadable(atom(1))).not.toBe(wrapped)
    const firstStore = createStore()
    const secondStore = createStore()
    firstStore.set(source, 2)
    expect(firstStore.get(wrapped)).toEqual({ state: 'hasData', data: 2 })
    expect(secondStore.get(wrapped)).toEqual({ state: 'hasData', data: 1 })
  })

  test('exposes loading, resolution, refresh, rejection and recovery without suspending', async () => {
    let resolve
    const source = atom(
      new Promise((done) => {
        resolve = done
      }),
    )
    const store = createStore()
    const wrapped = loadable(source)
    const listener = jest.fn()
    const unsubscribe = store.sub(wrapped, listener)
    try {
      expect(store.get(wrapped)).toEqual({ state: 'loading' })
      resolve('first')
      await waitFor(() =>
        expect(store.get(wrapped)).toEqual({ state: 'hasData', data: 'first' }),
      )
      expect(listener).toHaveBeenCalled()

      let reject
      store.set(
        source,
        new Promise((_resolve, fail) => {
          reject = fail
        }),
      )
      expect(store.get(wrapped)).toEqual({ state: 'loading' })
      const error = new Error('Failed to refresh')
      reject(error)
      await waitFor(() =>
        expect(store.get(wrapped)).toEqual({ state: 'hasError', error }),
      )

      store.set(source, Promise.resolve('recovered'))
      await waitFor(() =>
        expect(store.get(wrapped)).toEqual({
          state: 'hasData',
          data: 'recovered',
        }),
      )
    } finally {
      unsubscribe()
    }
  })

  test('captures synchronous errors and recovers after a dependency changes', () => {
    const fails = atom(true)
    const error = new Error('Source failed')
    const source = atom((get) => {
      if (get(fails)) throw error
      return 'recovered'
    })
    const store = createStore()
    const wrapped = loadable(source)
    expect(store.get(wrapped)).toEqual({ state: 'hasError', error })
    store.set(fails, false)
    expect(store.get(wrapped)).toEqual({ state: 'hasData', data: 'recovered' })
  })
})
