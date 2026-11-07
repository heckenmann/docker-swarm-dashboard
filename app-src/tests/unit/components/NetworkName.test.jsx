import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { createStore, Provider } from 'jotai'

jest.mock('../../../src/common/store/atoms/navigationAtoms', () => ({
  viewAtom: require('jotai').atom({}),
}))
jest.mock('../../../src/common/store/atoms/uiAtoms', () => {
  const { atom } = require('jotai')
  return {
    showNamesButtonsAtom: atom(true),
    serviceNameFilterAtom: atom(''),
    stackNameFilterAtom: atom(''),
    filterTypeAtom: atom('service'),
  }
})
const NetworkName =
  require('../../../src/components/shared/names/NetworkName').default
const { viewAtom } = require('../../../src/common/store/atoms/navigationAtoms')
const {
  showNamesButtonsAtom,
} = require('../../../src/common/store/atoms/uiAtoms')
it('opens network details through the standard action with no stale navigation data', () => {
  const store = createStore()
  store.set(viewAtom, { id: 'servicesDetail', detail: 'old', sortBy: 'old' })
  render(
    <Provider store={store}>
      <NetworkName name="shared" id="network-id" />
    </Provider>,
  )
  expect(screen.getAllByRole('button')).toHaveLength(1)
  fireEvent.click(screen.getByRole('button', { name: 'Open network: shared' }))
  expect(store.get(viewAtom)).toEqual({
    id: 'networksDetail',
    detail: 'network-id',
  })
})
it('honors the global entity-action setting', () => {
  const store = createStore()
  store.set(showNamesButtonsAtom, false)
  render(
    <Provider store={store}>
      <NetworkName name="shared" id="network-id" />
    </Provider>,
  )
  expect(screen.getByText('shared')).toBeInTheDocument()
  expect(screen.queryByRole('button')).not.toBeInTheDocument()
})
