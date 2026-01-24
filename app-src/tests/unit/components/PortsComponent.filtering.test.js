import React from 'react'
import { render, screen } from '@testing-library/react'

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

describe('PortsComponent filtering', () => {
  test('serviceNameFilter filters rows', () => {
    const ports = [
      { PublishedPort: 1, TargetPort: 1, Protocol: 'tcp', PublishMode: 'ingress', ServiceName: 'match', ServiceID: 's1', Stack: 'st1' },
      { PublishedPort: 2, TargetPort: 2, Protocol: 'tcp', PublishMode: 'ingress', ServiceName: 'other', ServiceID: 's2', Stack: 'st2' },
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
          return 'match'
        case 'stackNameFilterAtom':
          return ''
        case 'portsAtom':
          return ports
        default:
          return ''
      }
    })

    mockUseAtom.mockImplementation((atom) => {
      if (atom === 'serviceNameFilterAtom') return ['match', jest.fn()]
      if (atom === 'stackNameFilterAtom') return ['', jest.fn()]
      if (atom === 'filterTypeAtom') return ['service', jest.fn()]
      return [null, jest.fn()]
    })

    render(<PortsComponent />)
    expect(screen.queryByText('match')).toBeInTheDocument()
    expect(screen.queryByText('other')).toBeNull()
  })
})
