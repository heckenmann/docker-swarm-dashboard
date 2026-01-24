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

describe('PortsComponent extra', () => {
  test('renders port row without service/stack buttons when names empty', () => {
    const ports = [ { PublishedPort: 8080, TargetPort: 8080, Protocol: 'tcp', PublishMode: 'ingress', ServiceName: '', ServiceID: '', Stack: '' } ]

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

    const mockUpdateView = jest.fn()
    mockUseAtom.mockImplementation((atom) => {
      if (atom === 'viewAtom') return [null, mockUpdateView]
      if (atom === 'serviceNameFilterAtom') return ['', jest.fn()]
      if (atom === 'stackNameFilterAtom') return ['', jest.fn()]
      if (atom === 'filterTypeAtom') return ['service', jest.fn()]
      return [null, mockUpdateView]
    })

    render(<PortsComponent />)
    expect(screen.getAllByText('8080').length).toBeGreaterThan(0)
    // no open/filter buttons when ServiceName empty
    expect(screen.queryByTitle(/Open service/i)).toBeNull()
    expect(screen.queryByTitle(/Filter service/i)).toBeNull()
    expect(screen.queryByTitle(/Filter stack/i)).toBeNull()
  })

  test('service and stack buttons call setters and updateView', () => {
    const ports = [ { PublishedPort: 9090, TargetPort: 9090, Protocol: 'tcp', PublishMode: 'ingress', ServiceName: 'svcX', ServiceID: 'sX', Stack: 'stX' } ]

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

    const mockUpdateView = jest.fn()
    const mockSetService = jest.fn()
    const mockSetStack = jest.fn()
    const mockSetType = jest.fn()
    mockUseAtom.mockImplementation((atom) => {
      if (atom === 'viewAtom') return [null, mockUpdateView]
      if (atom === 'serviceNameFilterAtom') return ['', mockSetService]
      if (atom === 'stackNameFilterAtom') return ['', mockSetStack]
      if (atom === 'filterTypeAtom') return ['service', mockSetType]
      return [null, mockUpdateView]
    })

    render(<PortsComponent />)

    const openBtn = screen.getByTitle(/Open service/i)
    fireEvent.click(openBtn)
    expect(mockUpdateView).toHaveBeenCalled()

    const svcFilter = screen.getByTitle(/Filter service:/i)
    fireEvent.click(svcFilter)
    expect(mockSetService).toHaveBeenCalledWith('svcX')
    expect(mockSetStack).toHaveBeenCalledWith('')
    expect(mockSetType).toHaveBeenCalledWith('service')

    const stackFilter = screen.getByTitle(/Filter stack:/i)
    fireEvent.click(stackFilter)
    expect(mockSetStack).toHaveBeenCalledWith('stX')
    expect(mockSetService).toHaveBeenCalledWith('')
    expect(mockSetType).toHaveBeenCalledWith('stack')
  })
})
