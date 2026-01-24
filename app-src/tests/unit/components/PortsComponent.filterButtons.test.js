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

describe('PortsComponent filters/buttons', () => {
  test('renders filter buttons only when service/stack present and clicking sets atoms', () => {
    const ports = [
      {
        PublishedPort: 1000,
        TargetPort: 2000,
        Protocol: 'tcp',
        PublishMode: 'ingress',
        ServiceName: 'svc-a',
        ServiceID: 'sid-a',
        Stack: 'stack-a',
      },
      {
        PublishedPort: 1001,
        TargetPort: 2001,
        Protocol: 'tcp',
        PublishMode: 'ingress',
        ServiceName: '',
        ServiceID: '',
        Stack: '',
      },
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
          return ''
        case 'portsAtom':
          return ports
        default:
          return ''
      }
    })

    const mockSetService = jest.fn()
    const mockSetStack = jest.fn()
    const mockSetType = jest.fn()
    const mockUpdateView = jest.fn()
    mockUseAtom.mockImplementation((atom) => {
      if (atom === 'serviceNameFilterAtom') return ['', mockSetService]
      if (atom === 'stackNameFilterAtom') return ['', mockSetStack]
      if (atom === 'filterTypeAtom') return ['', mockSetType]
      if (atom === 'viewAtom') return [null, mockUpdateView]
      return [null, jest.fn()]
    })

    render(<PortsComponent />)
    const svcFilter = screen.getByTitle(/Filter service:/i)
    fireEvent.click(svcFilter)
    expect(mockSetService).toHaveBeenCalledWith('svc-a')
    expect(mockSetType).toHaveBeenCalledWith('service')

    const stackFilter = screen.getByTitle(/Filter stack:/i)
    fireEvent.click(stackFilter)
    expect(mockSetStack).toHaveBeenCalledWith('stack-a')
    expect(mockSetService).toHaveBeenCalledWith('')
    expect(mockSetType).toHaveBeenCalledWith('stack')
  })
})
