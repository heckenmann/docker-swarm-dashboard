import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'

let mockSize = 'sm'
let mockVariant = 'light'
const mockSetView = jest.fn()
jest.mock('jotai', () => ({
  useAtom: () => [null, mockSetView],
  useAtomValue: (atom) => (atom === 'size' ? mockSize : mockVariant),
}))
jest.mock('../../../src/common/store/atoms/navigationAtoms', () => ({
  viewAtom: 'view',
}))
jest.mock('../../../src/common/store/atoms/uiAtoms', () => ({
  tableSizeAtom: 'size',
}))
jest.mock('../../../src/common/store/atoms/themeAtoms', () => ({
  currentVariantAtom: 'variant',
}))
const ServiceResourcesTab =
  require('../../../src/components/services/details/ServiceResourcesTab').default

beforeEach(() => {
  mockSetView.mockReset()
  mockSize = 'sm'
  mockVariant = 'light'
})

it.each(['configs', 'secrets'])(
  'opens %s detail by ID and displays mount metadata',
  (kind) => {
    const prefix = kind === 'configs' ? 'Config' : 'Secret'
    const references = [
      {
        [prefix + 'ID']: 'resource-id',
        [prefix + 'Name']: 'resource-name',
        File: { Name: '/etc/target', UID: '1000', GID: '1001', Mode: 288 },
      },
    ]
    render(<ServiceResourcesTab kind={kind} references={references} />)
    expect(screen.getByText('/etc/target')).toBeInTheDocument()
    expect(screen.getByText('1000')).toBeInTheDocument()
    expect(screen.getByText('1001')).toBeInTheDocument()
    expect(screen.getByText('0440')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'resource-name' }))
    expect(mockSetView).toHaveBeenCalledWith({
      id: kind + 'Detail',
      detail: 'resource-id',
    })
  },
)
it('shows empty references and removes old links after refresh', () => {
  const { rerender } = render(
    <ServiceResourcesTab kind="configs" references={[{ ConfigID: 'c1' }]} />,
  )
  expect(screen.getByRole('button', { name: 'c1' })).toBeInTheDocument()
  rerender(<ServiceResourcesTab kind="configs" />)
  expect(screen.queryByRole('button', { name: 'c1' })).not.toBeInTheDocument()
  expect(
    screen.getByText('No configs linked to this service.'),
  ).toBeInTheDocument()
})
it('handles runtime targets, missing IDs and multiple mounts of one resource', () => {
  render(
    <ServiceResourcesTab
      kind="configs"
      references={[
        null,
        { ConfigID: 'c1', Runtime: {} },
        { ConfigID: 'c1', File: { Name: '/second', Mode: 0 } },
        { ConfigName: 'missing-id' },
        {},
      ]}
    />,
  )
  expect(screen.getByText('Runtime target')).toBeInTheDocument()
  expect(screen.getByText('/second')).toBeInTheDocument()
  expect(screen.getAllByRole('button', { name: 'c1' })).toHaveLength(2)
  expect(screen.getByText('0000')).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'missing-id' })).toBeDisabled()
  expect(
    screen.getByRole('button', { name: 'Unknown resource' }),
  ).toBeDisabled()
})
it('uses the global density and theme', () => {
  const references = [{ SecretID: 's1' }]
  const { rerender } = render(
    <ServiceResourcesTab kind="secrets" references={references} />,
  )
  expect(screen.getByRole('table')).toHaveClass('table-sm', 'table-light')
  mockSize = 'lg'
  mockVariant = 'dark'
  rerender(<ServiceResourcesTab kind="secrets" references={references} />)
  expect(screen.getByRole('table')).not.toHaveClass('table-sm')
  expect(screen.getByRole('table')).toHaveClass('table-dark')
})

it('sorts names and numeric modes with the standard reset cycle', () => {
  render(
    <ServiceResourcesTab
      kind="configs"
      references={[
        { ConfigID: 'z', ConfigName: 'Zulu', File: { Mode: 292 } },
        { ConfigID: 'a', ConfigName: 'Alpha', File: { Mode: 256 } },
      ]}
    />,
  )
  const order = () =>
    screen
      .getAllByRole('row')
      .slice(1)
      .map((row) => row.querySelector('button').textContent)
  const nameHeader = screen.getByRole('button', { name: /Sort by Name/ })
  fireEvent.click(nameHeader)
  expect(order()).toEqual(['Alpha', 'Zulu'])
  fireEvent.click(nameHeader)
  expect(nameHeader).toHaveAttribute('aria-sort', 'descending')
  fireEvent.keyDown(nameHeader, { key: 'Enter' })
  expect(nameHeader).toHaveAttribute('aria-sort', 'none')
  expect(order()).toEqual(['Zulu', 'Alpha'])
  fireEvent.click(screen.getByRole('button', { name: /Sort by Mode/ }))
  expect(order()).toEqual(['Alpha', 'Zulu'])
  const table = screen.getByRole('table')
  expect(table).toHaveClass('table-striped', 'table-bordered', 'mb-0')
  expect(table.closest('.card').querySelector('.card-body')).toBeNull()
})

// Resource navigation is exercised independently through the shared name component.
jest.mock('../../../src/components/shared/names/ResourceName', () => ({ name, id, kind }) => {
  const [, setView] = require('jotai').useAtom(require('../../../src/common/store/atoms/navigationAtoms').viewAtom)
  return <button disabled={!id} onClick={() => setView({ id: kind + 'Detail', detail: id })}>{name}</button>
})
