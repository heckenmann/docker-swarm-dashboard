import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { atom, createStore, Provider } from 'jotai'

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
const ResourceName =
  require('../../../src/components/shared/names/ResourceName').default
const { viewAtom } = require('../../../src/common/store/atoms/navigationAtoms')
const {
  showNamesButtonsAtom,
} = require('../../../src/common/store/atoms/uiAtoms')

it.each(['configs', 'secrets'])(
  'opens %s using only the standard detail action',
  (kind) => {
    const store = createStore()
    render(
      <Provider store={store}>
        <ResourceName name="example" id="resource-id" kind={kind} />
      </Provider>,
    )
    const button = screen.getByRole('button', {
      name: `Open ${kind === 'configs' ? 'config' : 'secret'}: example`,
    })
    expect(screen.getAllByRole('button')).toHaveLength(1)
    fireEvent.click(button)
    expect(store.get(viewAtom)).toEqual({
      id: kind + 'Detail',
      detail: 'resource-id',
    })
  },
)
it.each([true, false])(
  'hides actions when the ID is absent or name actions are disabled (%s)',
  (enabled) => {
    const store = createStore()
    store.set(showNamesButtonsAtom, enabled)
    render(
      <Provider store={store}>
        <ResourceName
          name="example"
          id={enabled ? undefined : 'resource-id'}
          kind="configs"
        />
      </Provider>,
    )
    expect(screen.getByText('example')).toBeInTheDocument()
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  },
)
