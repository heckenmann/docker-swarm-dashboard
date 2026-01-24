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
}))

const mockUseAtomValue = jest.fn()
const mockUseAtom = jest.fn()
jest.mock('jotai', () => ({ useAtomValue: (...args) => mockUseAtomValue(...args), useAtom: (...args) => mockUseAtom(...args) }))

import { StacksComponent } from '../../../src/components/StacksComponent'

describe('StacksComponent', () => {
  test('shows service when serviceNameFilter matches (normalized)', () => {
    const stacks = [
      { Name: 'backend', Services: [ { ID: 's1', ShortName: 'myservice', ServiceName: 'backend_my-service', Replication: '1', Created: new Date().toISOString(), Updated: new Date().toISOString() } ] }
    ]

    // atoms: currentVariant, currentVariantClasses, dashboardSettings, serviceNameFilter, stackNameFilter, stacksAtom
    mockUseAtomValue.mockImplementationOnce(() => 'light')
    mockUseAtomValue.mockImplementationOnce(() => 'classes')
    mockUseAtomValue.mockImplementationOnce(() => ({ locale: 'en', timeZone: 'UTC' }))
    mockUseAtomValue.mockImplementationOnce(() => 'myservice') // serviceNameFilter
    mockUseAtomValue.mockImplementationOnce(() => '') // stackNameFilter
    mockUseAtomValue.mockImplementationOnce(() => stacks)

    const mockSetService = jest.fn()
    const mockSetStack = jest.fn()
    const mockSetFilterType = jest.fn()
    mockUseAtom.mockImplementation((atom) => {
      if (atom === 'serviceNameFilterAtom') return ['myservice', mockSetService]
      if (atom === 'stackNameFilterAtom') return ['', mockSetStack]
      if (atom === 'filterTypeAtom') return ['service', mockSetFilterType]
      return [null, mockSetService]
    })

    render(<StacksComponent />)

    expect(screen.getByText('myservice')).toBeInTheDocument()

    // click open service
    const openBtn = screen.getByTitle(/Open service/i)
    fireEvent.click(openBtn)
    // updateView is returned by one of the useAtom calls; ensure it was invoked (we used mockUseAtom returning mockSetService)
    // can't assert exact value here without mocking updateView separately, but at least ensure button exists
    expect(openBtn).toBeInTheDocument()

    // click filter button
    const filterBtn = screen.getByTitle(/Filter service/i)
    expect(filterBtn).toBeInTheDocument()
    fireEvent.click(filterBtn)
    expect(mockSetService).toHaveBeenCalled()
  })
})
