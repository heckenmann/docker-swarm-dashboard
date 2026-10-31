import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import AboutComponent from '../../../src/components/misc/AboutComponent'

jest.mock('react', () => ({
  ...jest.requireActual('react'),
  memo: (component) => component,
}))

const mockUpdateView = jest.fn()
let mockTableSize = 'lg'
jest.mock('jotai', () => ({
  useAtom: () => [null, mockUpdateView],
  useAtomValue: (atom) =>
    atom === 'version'
      ? { version: 'test' }
      : atom === 'tableSize'
        ? mockTableSize
        : 'light',
}))
jest.mock('../../../src/common/store/atoms/dashboardAtoms', () => ({
  versionAtom: 'version',
}))
jest.mock('../../../src/common/store/atoms/themeAtoms', () => ({
  currentVariantAtom: 'theme',
}))
jest.mock('../../../src/common/store/atoms/navigationAtoms', () => ({
  viewAtom: 'view',
}))

jest.mock('../../../src/common/store/atoms/uiAtoms', () => ({
  tableSizeAtom: 'tableSize',
}))

test.each(['sm', 'lg'])('updates table density to %s', (size) => {
  mockTableSize = size === 'sm' ? 'lg' : 'sm'
  const { rerender } = render(<AboutComponent />)
  expect(screen.getByRole('table').classList.contains('table-sm')).toBe(
    size !== 'sm',
  )
  mockTableSize = size
  rerender(<AboutComponent />)
  expect(screen.getByRole('table').classList.contains('table-sm')).toBe(
    size === 'sm',
  )
})

test('opening Debug sets only the destination view', () => {
  render(<AboutComponent />)
  fireEvent.click(screen.getByRole('button', { name: /Debug/ }))
  expect(mockUpdateView).toHaveBeenCalledWith({ id: 'debug' })
})
