import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'

jest.mock('../../../src/common/store/atoms', () => ({
  currentVariantAtom: 'currentVariantAtom',
  currentVariantClassesAtom: 'currentVariantClassesAtom',
  dashboardSettingsAtom: 'dashboardSettingsAtom',
  serviceNameFilterAtom: 'serviceNameFilterAtom',
  stackNameFilterAtom: 'stackNameFilterAtom',
  filterTypeAtom: 'filterTypeAtom',
  stacksAtom: 'stacksAtom',
  viewAtom: 'viewAtom',
}))

const mockUseAtomValue = jest.fn()
const mockUseAtom = jest.fn()
jest.mock('jotai', () => ({ useAtomValue: (...args) => mockUseAtomValue(...args), useAtom: (...args) => mockUseAtom(...args) }))

import { StacksComponent } from '../../../src/components/StacksComponent'

describe('StacksComponent more branches', () => {
  test('service normalization matches full ServiceName when ShortName null', () => {
    const stacks = [
      {
        Name: 's1',
        Services: [
          { ID: 'svc1', ShortName: null, ServiceName: 'My-Service_Name', Replication: 1, Created: new Date().toISOString(), Updated: new Date().toISOString() },
        ],
      },
    ]

    mockUseAtomValue.mockImplementation((atom) => {
      switch (atom) {
        case 'currentVariantAtom':
          return 'light'
        case 'currentVariantClassesAtom':
          return 'classes'
        case 'dashboardSettingsAtom':
          return { locale: 'en', timeZone: 'UTC' }
        case 'serviceNameFilterAtom':
          return 'myservicename' // normalized should match
        case 'stackNameFilterAtom':
          return ''
        case 'stacksAtom':
          return stacks
        default:
          return ''
      }
    })

    const mockSetService = jest.fn()
    const mockSetStack = jest.fn()
    const mockSetType = jest.fn()
    const mockUpdateView = jest.fn()
    mockUseAtom.mockImplementation((atom) => {
      if (atom === 'serviceNameFilterAtom') return ['myservicename', mockSetService]
      if (atom === 'stackNameFilterAtom') return ['', mockSetStack]
      if (atom === 'filterTypeAtom') return ['service', mockSetType]
      if (atom === 'viewAtom') return [null, mockUpdateView]
      return [null, jest.fn()]
    })

    render(<StacksComponent />)
    // service name should be displayed (uses ServiceName when ShortName null)
    expect(screen.getByText('My-Service_Name')).toBeInTheDocument()

    // click the service filter button
    const svcFilter = screen.getByTitle(/Filter service:/i)
    fireEvent.click(svcFilter)
    expect(mockSetService).toHaveBeenCalledWith('My-Service_Name')
    expect(mockSetType).toHaveBeenCalledWith('service')
  })

  test('stack filtered out when no services match serviceNameFilter', () => {
    const stacks = [ { Name: 'onlystack', Services: [ { ID: 's', ShortName: 'a', ServiceName: 'b', Replication: 1, Created: new Date().toISOString(), Updated: new Date().toISOString() } ] } ]

    mockUseAtomValue.mockImplementation((atom) => {
      switch (atom) {
        case 'currentVariantAtom':
          return 'light'
        case 'currentVariantClassesAtom':
          return 'classes'
        case 'dashboardSettingsAtom':
          return { locale: 'en', timeZone: 'UTC' }
        case 'serviceNameFilterAtom':
          return 'nomatch'
        case 'stackNameFilterAtom':
          return ''
        case 'stacksAtom':
          return stacks
        default:
          return ''
      }
    })

    mockUseAtom.mockImplementation((atom) => {
      if (atom === 'serviceNameFilterAtom') return ['nomatch', jest.fn()]
      if (atom === 'stackNameFilterAtom') return ['', jest.fn()]
      if (atom === 'filterTypeAtom') return ['service', jest.fn()]
      return [null, jest.fn()]
    })

    render(<StacksComponent />)
    // no stack cards should be rendered because createServicesForStack returns empty
    expect(screen.queryByText('onlystack')).toBeNull()
  })
})
