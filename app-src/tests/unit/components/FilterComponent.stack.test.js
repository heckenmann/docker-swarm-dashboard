import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'

jest.mock('../../../src/common/store/atoms', () => ({
  currentVariantAtom: 'currentVariantAtom',
  serviceNameFilterAtom: 'serviceNameFilterAtom',
  stackNameFilterAtom: 'stackNameFilterAtom',
  filterTypeAtom: 'filterTypeAtom',
}))

const mockUseAtomValue = jest.fn()
const mockUseAtom = jest.fn()
jest.mock('jotai', () => ({ useAtomValue: (...args) => mockUseAtomValue(...args), useAtom: (...args) => mockUseAtom(...args) }))

import { FilterComponent } from '../../../src/components/FilterComponent'

describe('FilterComponent stack path', () => {
  test('selecting stack and entering value sets stack and clears service', () => {
    mockUseAtomValue.mockImplementation((atom) => {
      if (atom === 'currentVariantAtom') return 'light'
      if (atom === 'serviceNameFilterAtom') return ''
      if (atom === 'stackNameFilterAtom') return ''
      if (atom === 'filterTypeAtom') return 'service'
      return ''
    })

    const mockSetService = jest.fn()
    const mockSetStack = jest.fn()
    const mockSetType = jest.fn()
    mockUseAtom.mockImplementation((atom) => {
      if (atom === 'serviceNameFilterAtom') return ['', mockSetService]
      if (atom === 'stackNameFilterAtom') return ['', mockSetStack]
      if (atom === 'filterTypeAtom') return ['stack', mockSetType]
      return [null, jest.fn()]
    })

  // render with initial filterType set to 'stack'
  render(<FilterComponent />)

  // enter a stack value into the input (lookup by role)
  const input = screen.getByRole('textbox')
  fireEvent.change(input, { target: { value: 'myStack' } })
  // changeFilterValue should call setStackName and clear service name
  expect(mockSetStack).toHaveBeenCalledWith('myStack')
  expect(mockSetService).toHaveBeenCalledWith('')
  })
})
