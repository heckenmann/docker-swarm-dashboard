import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'

jest.mock('../../../src/common/store/atoms', () => ({
  currentVariantAtom: 'currentVariantAtom',
  currentVariantClassesAtom: 'currentVariantClassesAtom',
  dashboardSettingsAtom: 'dashboardSettingsAtom',
  serviceNameFilterAtom: 'serviceNameFilterAtom',
  stackNameFilterAtom: 'stackNameFilterAtom',
  filterTypeAtom: 'filterTypeAtom',
  viewAtom: 'viewAtom',
  stacksAtom: 'stacksAtom',
}))

const mockUseAtomValue = jest.fn()
const mockUseAtom = jest.fn()
jest.mock('jotai', () => ({ useAtomValue: (...args) => mockUseAtomValue(...args), useAtom: (...args) => mockUseAtom(...args) }))

import { StacksComponent } from '../../../src/components/StacksComponent'

describe('StacksComponent extra', () => {
  test('filters services by shortName and full ServiceName', () => {
    const stacks = [
      {
        Name: 'st1',
        Services: [
          { ID: 's1', ShortName: 'svc-short', ServiceName: 'svc-full-name', Replication: 1, Created: new Date().toISOString(), Updated: new Date().toISOString() },
          { ID: 's2', ShortName: null, ServiceName: 'another-service', Replication: 1, Created: new Date().toISOString(), Updated: new Date().toISOString() },
        ],
      },
    ]

  // useAtomValue is called for currentVariant, currentVariantClasses, dashboardSettings, service filters and stacks
  // useAtomValue is called for currentVariant, currentVariantClasses, dashboardSettings, service filter, stack filter, stacks
  const values = ['light', 'classes', { locale: 'en', timeZone: 'UTC' }, 'svc-short', '', stacks]
  mockUseAtomValue.mockImplementation(() => values.shift())

    const mockSetService = jest.fn()
    const mockSetStack = jest.fn()
    const mockSetType = jest.fn()
    const mockUpdateView = jest.fn()

    mockUseAtom.mockImplementation((atom) => {
      if (atom === 'serviceNameFilterAtom') return ['svc-short', mockSetService]
      if (atom === 'stackNameFilterAtom') return ['', mockSetStack]
      if (atom === 'filterTypeAtom') return ['service', mockSetType]
      if (atom === 'viewAtom') return [null, mockUpdateView]
      return [null, jest.fn()]
    })

    render(<StacksComponent />)

    // Only the service matching 'svc-short' should be present in the rendered table
    expect(screen.getByText('svc-short')).toBeInTheDocument()
    expect(screen.queryByText('another-service')).toBeNull()

    // Click the filter button for the visible service
  const filterBtn = screen.getByTitle(/Filter service:/i)
    fireEvent.click(filterBtn)
    expect(mockSetService).toHaveBeenCalledWith('svc-short')
    expect(mockSetType).toHaveBeenCalledWith('service')
  })

  test('stack filter button sets stack and clears service filter', () => {
    const stacks = [ { Name: 'stX', Services: [ { ID: 's1', ServiceName: 'svc1', ShortName: null, Replication: 1, Created: new Date().toISOString(), Updated: new Date().toISOString() } ] } ]
    const values = ['light', 'classes', { locale: 'en', timeZone: 'UTC' }, '', '', stacks]
    mockUseAtomValue.mockImplementation(() => values.shift())

    const mockSetService = jest.fn()
    const mockSetStack = jest.fn()
    const mockSetType = jest.fn()
    mockUseAtom.mockImplementation((atom) => {
      if (atom === 'serviceNameFilterAtom') return ['', mockSetService]
      if (atom === 'stackNameFilterAtom') return ['', mockSetStack]
      if (atom === 'filterTypeAtom') return ['', mockSetType]
      return [null, jest.fn()]
    })

    render(<StacksComponent />)

    const stackFilterBtn = screen.getByTitle(/Filter stack:/i)
    fireEvent.click(stackFilterBtn)
    expect(mockSetStack).toHaveBeenCalledWith('stX')
    expect(mockSetService).toHaveBeenCalledWith('')
    expect(mockSetType).toHaveBeenCalledWith('stack')
  })
})
