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

describe('FilterComponent extra', () => {
  test('shows programmatic service filter and clear button toggles', () => {
    mockUseAtomValue.mockImplementation((atom) => {
      if (atom === 'currentVariantAtom') return 'light'
      if (atom === 'serviceNameFilterAtom') return 'svcA'
      if (atom === 'stackNameFilterAtom') return ''
      if (atom === 'filterTypeAtom') return 'service'
      return ''
    })

    const mockSetService = jest.fn()
    const mockSetStack = jest.fn()
    const mockSetType = jest.fn()
    mockUseAtom.mockImplementation((atom) => {
      if (atom === 'serviceNameFilterAtom') return ['svcA', mockSetService]
      if (atom === 'stackNameFilterAtom') return ['', mockSetStack]
      if (atom === 'filterTypeAtom') return ['service', mockSetType]
      return [null, jest.fn()]
    })

    render(<FilterComponent />)

    const input = screen.getByPlaceholderText(/Filter services by service name/i)
    expect(input.value).toBe('svcA')

    // clear button should be enabled; clicking clears via setter
    const clearBtn = screen.getByRole('button')
    fireEvent.click(clearBtn)
    expect(mockSetService).toHaveBeenCalledWith('')
  })
})
