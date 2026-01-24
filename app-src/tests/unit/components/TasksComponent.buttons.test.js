import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'

jest.mock('../../../src/common/store/atoms', () => ({
  currentVariantAtom: 'currentVariantAtom',
  currentVariantClassesAtom: 'currentVariantClassesAtom',
  dashboardSettingsAtom: 'dashboardSettingsAtom',
  serviceNameFilterAtom: 'serviceNameFilterAtom',
  stackNameFilterAtom: 'stackNameFilterAtom',
  filterTypeAtom: 'filterTypeAtom',
  tableSizeAtom: 'tableSizeAtom',
  tasksAtomNew: 'tasksAtomNew',
  viewAtom: 'viewAtom',
}))

const mockUseAtomValue = jest.fn()
const mockUseAtom = jest.fn()
jest.mock('jotai', () => ({ useAtomValue: (...args) => mockUseAtomValue(...args), useAtom: (...args) => mockUseAtom(...args) }))

import { TasksComponent } from '../../../src/components/TasksComponent'

describe('TasksComponent buttons execute setters', () => {
  test('clicking service and stack filter buttons calls setters with expected values', () => {
    const tasks = [ { ID: 'tZ', ServiceName: 'svcZ', ServiceID: 'sZ', Stack: 'stackZ', NodeID: 'nZ', NodeName: 'nodeZ', State: 'running', Timestamp: new Date().toISOString(), Slot: 1, Err: '' } ]

    mockUseAtomValue.mockImplementation((atom) => {
      switch (atom) {
        case 'currentVariantAtom':
          return 'light'
        case 'currentVariantClassesAtom':
          return 'classes'
        case 'tableSizeAtom':
          return 'sm'
        case 'dashboardSettingsAtom':
          return { locale: 'en', timeZone: 'UTC' }
        case 'serviceNameFilterAtom':
          return ''
        case 'stackNameFilterAtom':
          return ''
        case 'tasksAtomNew':
          return tasks
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

    render(<TasksComponent />)

    const svcFilter = screen.getByTitle(/Filter service:/i)
    fireEvent.click(svcFilter)
    expect(mockSetService).toHaveBeenCalledWith('svcZ')
    expect(mockSetType).toHaveBeenCalledWith('service')

    const stackFilter = screen.getByTitle(/Filter stack:/i)
    fireEvent.click(stackFilter)
    expect(mockSetStack).toHaveBeenCalledWith('stackZ')
    expect(mockSetService).toHaveBeenCalledWith('')
    expect(mockSetType).toHaveBeenCalledWith('stack')
  })
})
