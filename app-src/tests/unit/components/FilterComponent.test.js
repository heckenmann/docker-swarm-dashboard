import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'

// mock atoms module
jest.mock('../../../src/common/store/atoms', () => ({
  currentVariantAtom: 'currentVariantAtom',
  serviceNameFilterAtom: 'serviceNameFilterAtom',
  stackNameFilterAtom: 'stackNameFilterAtom',
  filterTypeAtom: 'filterTypeAtom',
}))

const mockUseAtomValue = jest.fn()
const mockUseAtom = jest.fn()
jest.mock('jotai', () => ({
  useAtomValue: (...args) => mockUseAtomValue(...args),
  useAtom: (...args) => mockUseAtom(...args),
}))

import { FilterComponent } from '../../../src/components/FilterComponent'

describe('FilterComponent', () => {
  beforeEach(() => {
    mockUseAtomValue.mockReset()
    mockUseAtom.mockReset()
  })

  test('renders default with no filters and clear disabled', () => {
    mockUseAtomValue.mockImplementation((atom) => {
      switch (atom) {
        case 'currentVariantAtom':
          return 'light'
        case 'serviceNameFilterAtom':
          return ''
        case 'stackNameFilterAtom':
          return ''
        case 'filterTypeAtom':
          return 'service'
        default:
          return ''
      }
    })

    const mockSetService = jest.fn()
    const mockSetStack = jest.fn()
    const mockSetType = jest.fn()
    mockUseAtom.mockImplementation((atom) => {
      switch (atom) {
        case 'serviceNameFilterAtom':
          return ['', mockSetService]
        case 'stackNameFilterAtom':
          return ['', mockSetStack]
        case 'filterTypeAtom':
          return ['service', mockSetType]
        default:
          return [null, jest.fn()]
      }
    })

    render(<FilterComponent />)

    const select = screen.getByRole('combobox')
    expect(select.value).toBe('service')
    const input = screen.getByPlaceholderText(/Filter services by/i)
    expect(input.value).toBe('')
    const btn = screen.getByRole('button')
    expect(btn).toBeDisabled()
  })

  test('typing in input calls setServiceNameFilter when filter type is service', () => {
    mockUseAtomValue.mockImplementation((atom) => {
      switch (atom) {
        case 'currentVariantAtom':
          return 'light'
        case 'serviceNameFilterAtom':
          return ''
        case 'stackNameFilterAtom':
          return ''
        case 'filterTypeAtom':
          return 'service'
        default:
          return ''
      }
    })

    const mockSetService = jest.fn()
    const mockSetStack = jest.fn()
    const mockSetType = jest.fn()
    mockUseAtom.mockImplementation((atom) => {
      switch (atom) {
        case 'serviceNameFilterAtom':
          return ['', mockSetService]
        case 'stackNameFilterAtom':
          return ['', mockSetStack]
        case 'filterTypeAtom':
          return ['service', mockSetType]
        default:
          return [null, jest.fn()]
      }
    })

    render(<FilterComponent />)
    const input = screen.getByPlaceholderText(/Filter services by/i)
    fireEvent.change(input, { target: { value: 'svc1' } })
    expect(mockSetService).toHaveBeenCalledWith('svc1')
  })

  test('changing select to stack clears service filter and sets stack filter', () => {
    // prefill service atom so local state has a value
    mockUseAtomValue.mockImplementation((atom) => {
      switch (atom) {
        case 'currentVariantAtom':
          return 'light'
        case 'serviceNameFilterAtom':
          return 'svcX'
        case 'stackNameFilterAtom':
          return ''
        case 'filterTypeAtom':
          return 'service'
        default:
          return ''
      }
    })

    const mockSetService = jest.fn()
    const mockSetStack = jest.fn()
    const mockSetType = jest.fn()
    mockUseAtom.mockImplementation((atom) => {
      switch (atom) {
        case 'serviceNameFilterAtom':
          return ['svcX', mockSetService]
        case 'stackNameFilterAtom':
          return ['', mockSetStack]
        case 'filterTypeAtom':
          return ['service', mockSetType]
        default:
          return [null, jest.fn()]
      }
    })

    render(<FilterComponent />)
    const select = screen.getByRole('combobox')
    fireEvent.change(select, { target: { value: 'stack' } })

    // changeFilterType should call setFilterType and changeFilterValue which clears service filter and sets stack
    expect(mockSetType).toHaveBeenCalledWith('stack')
    // service setter cleared
    expect(mockSetService).toHaveBeenCalledWith('')
    // since filterValue was 'svcX', stack setter called with the same (now selected) value
    expect(mockSetStack).toHaveBeenCalledWith('svcX')
  })

  test('clear button clears both filters when present', () => {
    mockUseAtomValue.mockImplementation((atom) => {
      switch (atom) {
        case 'currentVariantAtom':
          return 'light'
        case 'serviceNameFilterAtom':
          return 'svcX'
        case 'stackNameFilterAtom':
          return 'stX'
        case 'filterTypeAtom':
          return 'service'
        default:
          return ''
      }
    })

    const mockSetService = jest.fn()
    const mockSetStack = jest.fn()
    const mockSetType = jest.fn()
    mockUseAtom.mockImplementation((atom) => {
      switch (atom) {
        case 'serviceNameFilterAtom':
          return ['svcX', mockSetService]
        case 'stackNameFilterAtom':
          return ['stX', mockSetStack]
        case 'filterTypeAtom':
          return ['service', mockSetType]
        default:
          return [null, jest.fn()]
      }
    })

  render(<FilterComponent />)
  // clear button doesn't have visible text (icon-only), so find by role
  const buttons = screen.getAllByRole('button')
  const clearBtn = buttons.find((b) => b.className && b.className.includes('btn-danger')) || buttons[0]
  expect(clearBtn).toBeEnabled()
  fireEvent.click(clearBtn)
    expect(mockSetService).toHaveBeenCalledWith('')
    expect(mockSetStack).toHaveBeenCalledWith('')
    expect(mockSetType).toHaveBeenCalledWith('service')
  })

  test('filterTypeAtom external change updates select value', () => {
    mockUseAtomValue.mockImplementation((atom) => {
      switch (atom) {
        case 'currentVariantAtom':
          return 'light'
        case 'serviceNameFilterAtom':
          return ''
        case 'stackNameFilterAtom':
          return ''
        case 'filterTypeAtom':
          return 'stack'
        default:
          return ''
      }
    })

    mockUseAtom.mockImplementation((atom) => {
      switch (atom) {
        case 'serviceNameFilterAtom':
          return ['', jest.fn()]
        case 'stackNameFilterAtom':
          return ['', jest.fn()]
        case 'filterTypeAtom':
          return ['stack', jest.fn()]
        default:
          return [null, jest.fn()]
      }
    })

    render(<FilterComponent />)
    const select = screen.getByRole('combobox')
    expect(select.value).toBe('stack')
  })
})
