import React from 'react'
import { act, fireEvent, render, screen } from '@testing-library/react'
import { atom, createStore, Provider } from 'jotai'

jest.mock('../../../src/common/store/atoms/navigationAtoms', () => ({
  viewAtom: require('jotai').atom({}),
}))
jest.mock('../../../src/common/store/atoms/dashboardAtoms', () => {
  const { atom } = require('jotai')
  const {
    viewAtom,
  } = require('../../../src/common/store/atoms/navigationAtoms')
  const requestAtom = atom(Promise.resolve(null))
  const source = atom(async (get) => {
    get(viewAtom)
    return get(requestAtom)
  })
  return {
    requestAtom,
    configsAtom: source,
    secretsAtom: source,
    configDetailAtom: source,
    secretDetailAtom: source,
  }
})
jest.mock('../../../src/common/store/atoms/uiAtoms', () => {
  const { atom } = require('jotai')
  return {
    localeAtom: atom('en-US'),
    timeZoneAtom: atom('UTC'),
    tableSizeAtom: atom('sm'),
    stackNameFilterAtom: atom(''),
  }
})
jest.mock('../../../src/common/store/atoms/themeAtoms', () => ({
  currentVariantAtom: require('jotai').atom('light'),
}))
jest.mock(
  '../../../src/components/common/DSDCard',
  () =>
    function Card({ title, headerActions, body, children }) {
      return (
        <section>
          <h2>{title}</h2>
          {headerActions}
          {body}
          {children}
        </section>
      )
    },
)
jest.mock('../../../src/components/shared/names/ServiceName', () => () => null)

const { viewAtom } = require('../../../src/common/store/atoms/navigationAtoms')
const {
  requestAtom,
} = require('../../../src/common/store/atoms/dashboardAtoms')
const Inventory =
  require('../../../src/components/resources/ResourceInventoryComponent').default
const Details =
  require('../../../src/components/resources/DetailsResourceComponent').default
const resource = (
  id,
  content = { status: 'available', value: 'old payload' },
) => ({
  id,
  name: id,
  labels: {},
  consumers: [],
  usage: 'unused',
  content,
})
const deferred = () => {
  let resolve, reject
  const promise = new Promise((yes, no) => {
    resolve = yes
    reject = no
  })
  return { promise, resolve, reject }
}
const mount = (Component, kind, data, view = { id: kind }) => {
  const store = createStore()
  store.set(viewAtom, view)
  store.set(requestAtom, Promise.resolve(data))
  render(
    <Provider store={store}>
      <Component kind={kind} />
    </Provider>,
  )
  return store
}

it.each(['configs', 'secrets'])(
  'keeps the %s table mounted during refresh',
  async (kind) => {
    const data = { resources: [resource('example')], usageKnown: true }
    const store = mount(Inventory, kind, data)
    const link = await screen.findByRole('button', { name: 'example' })
    const table = screen.getByRole('table')
    const next = deferred()
    act(() => {
      store.set(requestAtom, next.promise)
    })
    expect(screen.getByRole('table')).toBe(table)
    expect(link).toBeInTheDocument()
    await act(async () => {
      next.resolve({ ...data, resources: [resource('updated')] })
    })
    expect(
      await screen.findByRole('button', { name: 'updated' }),
    ).toBeInTheDocument()
  },
)

it('retains code controls during refresh and hides the previous resource on navigation', async () => {
  const store = mount(Details, 'configs', resource('first'), {
    id: 'configsDetail',
    detail: 'first',
  })
  const pre = await screen.findByLabelText('Config payload')
  fireEvent.change(screen.getByLabelText('Code language'), {
    target: { value: 'yaml' },
  })
  pre.scrollTop = 120
  const refresh = deferred()
  act(() => {
    store.set(requestAtom, refresh.promise)
  })
  expect(screen.getByLabelText('Config payload')).toBe(pre)
  expect(screen.getByLabelText('Code language')).toHaveValue('yaml')
  expect(pre.scrollTop).toBe(120)
  await act(async () => {
    refresh.resolve(resource('first'))
  })
  expect(screen.getByLabelText('Config payload')).toBe(pre)
  expect(pre.scrollTop).toBe(120)
  const navigation = deferred()
  act(() => {
    store.set(requestAtom, navigation.promise)
    store.set(viewAtom, { id: 'configsDetail', detail: 'second' })
  })
  expect(screen.queryByLabelText('Config payload')).not.toBeInTheDocument()
  expect(screen.queryByText('old payload')).not.toBeInTheDocument()
  await act(async () => {
    navigation.resolve(
      resource('second', { status: 'available', value: 'new payload' }),
    )
  })
  expect(await screen.findByLabelText('Config payload')).toHaveTextContent(
    'new payload',
  )
  expect(screen.getByLabelText('Code language')).toHaveValue('auto')
})

it.each(['hidden', 'error'])(
  'removes retained content when refresh resolves to %s',
  async (outcome) => {
    const store = mount(Details, 'configs', resource('first'), {
      id: 'configsDetail',
      detail: 'first',
    })
    await screen.findByLabelText('Config payload')
    const next = deferred()
    act(() => {
      store.set(requestAtom, next.promise)
    })
    await act(async () => {
      if (outcome === 'error') next.reject(new Error('unavailable'))
      else next.resolve(resource('first', { status: 'hidden' }))
    })
    expect(screen.queryByLabelText('Config payload')).not.toBeInTheDocument()
    expect(screen.queryByText('old payload')).not.toBeInTheDocument()
    expect(
      screen.getByText(
        outcome === 'error'
          ? /Failed to load resource details/
          : /Content is hidden/,
      ),
    ).toBeInTheDocument()
  },
)

jest.mock(
  '../../../src/components/shared/names/EntityName',
  () => require('../mocks/MockEntityName').default,
)
