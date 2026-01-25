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

describe('FilterComponent (combined)', () => {
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
    expect(mockSetType).toHaveBeenCalledWith('stack')
    expect(mockSetService).toHaveBeenCalledWith('')
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

    const clearBtn = screen.getByRole('button')
    fireEvent.click(clearBtn)
    expect(mockSetService).toHaveBeenCalledWith('')
  })

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

    render(<FilterComponent />)
    const input = screen.getByRole('textbox')
    fireEvent.change(input, { target: { value: 'myStack' } })
    expect(mockSetStack).toHaveBeenCalledWith('myStack')
    expect(mockSetService).toHaveBeenCalledWith('')
  })
})
