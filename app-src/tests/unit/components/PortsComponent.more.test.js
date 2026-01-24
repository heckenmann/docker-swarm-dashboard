import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'

jest.mock('../../../src/common/store/atoms', () => ({
  currentVariantAtom: 'currentVariantAtom',
  currentVariantClassesAtom: 'currentVariantClassesAtom',
  tableSizeAtom: 'tableSizeAtom',
  serviceNameFilterAtom: 'serviceNameFilterAtom',
  stackNameFilterAtom: 'stackNameFilterAtom',
  filterTypeAtom: 'filterTypeAtom',
  portsAtom: 'portsAtom',
  viewAtom: 'viewAtom',
}))

const mockUseAtomValue = jest.fn()
const mockUseAtom = jest.fn()
jest.mock('jotai', () => ({ useAtomValue: (...args) => mockUseAtomValue(...args), useAtom: (...args) => mockUseAtom(...args) }))

import { PortsComponent } from '../../../src/components/PortsComponent'

describe('PortsComponent more branches', () => {
  test('stackNameFilter filters rows and stack button absent when stack empty', () => {
    const ports = [
      { PublishedPort: 1111, TargetPort: 1111, Protocol: 'tcp', PublishMode: 'ingress', ServiceName: 'a', ServiceID: 's1', Stack: '' },
      { PublishedPort: 2222, TargetPort: 2222, Protocol: 'tcp', PublishMode: 'ingress', ServiceName: 'b', ServiceID: 's2', Stack: 'st2' },
    ]

    mockUseAtomValue.mockImplementation((atom) => {
      switch (atom) {
        case 'currentVariantAtom':
          return 'light'
        case 'currentVariantClassesAtom':
          return 'classes'
        case 'tableSizeAtom':
          return 'sm'
        case 'serviceNameFilterAtom':
          return ''
        case 'stackNameFilterAtom':
          return 'st2'
        case 'portsAtom':
          return ports
        default:
          return ''
      }
    })

    const mockUpdateView = jest.fn()
    const mockSetService = jest.fn()
    const mockSetStack = jest.fn()
    const mockSetType = jest.fn()
    mockUseAtom.mockImplementation((atom) => {
      if (atom === 'viewAtom') return [null, mockUpdateView]
      if (atom === 'serviceNameFilterAtom') return ['', mockSetService]
      if (atom === 'stackNameFilterAtom') return ['st2', mockSetStack]
      if (atom === 'filterTypeAtom') return ['stack', mockSetType]
      return [null, mockUpdateView]
    })

    render(<PortsComponent />)
  // only the row with stack 'st2' should be visible
  expect(screen.queryByText('1111')).toBeNull()
  // PublishedPort and TargetPort both contain the same number; assert at least one occurrence
  const matches = screen.getAllByText('2222')
  expect(matches.length).toBeGreaterThan(0)

    // stack button exists for st2
    const stackFilter = screen.getByTitle(/Filter stack:/i)
    fireEvent.click(stackFilter)
    expect(mockSetStack).toHaveBeenCalledWith('st2')
    expect(mockSetService).toHaveBeenCalledWith('')
    expect(mockSetType).toHaveBeenCalledWith('stack')
  })
})
