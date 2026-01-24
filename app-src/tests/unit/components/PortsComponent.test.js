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

describe('PortsComponent', () => {
  test('renders port row with service open and filter', () => {
    const ports = [ { PublishedPort: 8080, TargetPort: 8080, Protocol: 'tcp', PublishMode: 'ingress', ServiceName: 'svc1', ServiceID: 's1', Stack: 'st1' } ]

  // return values in sequence (more robust against extra calls)
  const values = ['light', 'classes', 'sm', '', '', ports]
  mockUseAtomValue.mockImplementation(() => values.shift())

    const mockUpdateView = jest.fn()
    mockUseAtom.mockImplementation((atom) => {
      if (atom === 'filterTypeAtom') return ['service', mockUpdateView]
      if (atom === 'serviceNameFilterAtom') return ['', mockUpdateView]
      if (atom === 'stackNameFilterAtom') return ['', mockUpdateView]
      if (atom === 'viewAtom') return [null, mockUpdateView]
      return [null, mockUpdateView]
    })

    render(<PortsComponent />)

  // PublishedPort and TargetPort may both contain the same number; assert at least one occurrence
  const matches = screen.getAllByText('8080')
  expect(matches.length).toBeGreaterThan(0)
    const openBtn = screen.getByTitle(/Open service/i)
    fireEvent.click(openBtn)
    expect(mockUpdateView).toHaveBeenCalled()

    const filterBtn = screen.getByTitle(/Filter service/i)
    fireEvent.click(filterBtn)
    expect(mockUpdateView).toHaveBeenCalled()
  })
})
