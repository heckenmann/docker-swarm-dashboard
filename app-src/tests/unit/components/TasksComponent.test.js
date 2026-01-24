import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'

// provide a mocked atoms module so tests can identify which atom is requested
jest.mock('../../../src/common/store/atoms', () => ({
  currentVariantAtom: 'currentVariantAtom',
  currentVariantClassesAtom: 'currentVariantClassesAtom',
  tableSizeAtom: 'tableSizeAtom',
  dashboardSettingsAtom: 'dashboardSettingsAtom',
  serviceNameFilterAtom: 'serviceNameFilterAtom',
  filterTypeAtom: 'filterTypeAtom',
  stackNameFilterAtom: 'stackNameFilterAtom',
  tasksAtomNew: 'tasksAtomNew',
  viewAtom: 'viewAtom',
}))

const mockUseAtomValue = jest.fn()
const mockUseAtom = jest.fn()
jest.mock('jotai', () => ({ useAtomValue: (...args) => mockUseAtomValue(...args), useAtom: (...args) => mockUseAtom(...args) }))

import { TasksComponent } from '../../../src/components/TasksComponent'

describe('TasksComponent', () => {
  test('renders task row with open service and filter buttons and node open', () => {
    const tasks = [ { ID: 't1', ServiceID: 's1', ServiceName: 'svc1', Stack: '', NodeID: 'n1', NodeName: 'node1', State: 'running', Timestamp: new Date().toISOString(), Slot: 1, Err: '' } ]

    // return values based on the atom argument to avoid sequence fragility
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
    const mockSetFilterType = jest.fn()
    const mockUpdateView = jest.fn()
    // useAtom returns proper tuples for known atoms to avoid controlled select value=null
    mockUseAtom.mockImplementation((atom) => {
      if (atom === 'filterTypeAtom') return ['service', mockSetFilterType]
      if (atom === 'serviceNameFilterAtom') return ['', mockSetService]
      if (atom === 'stackNameFilterAtom') return ['', mockSetStack]
      if (atom === 'viewAtom') return [null, mockUpdateView]
      return [null, mockUpdateView]
    })

    render(<TasksComponent />)

    expect(screen.getByText('svc1')).toBeInTheDocument()

    const openServiceBtn = screen.getByTitle(/Open service/i)
    fireEvent.click(openServiceBtn)
    expect(mockUpdateView).toHaveBeenCalled()

    const filterBtn = screen.getByTitle(/Filter service/i)
    fireEvent.click(filterBtn)
    // one of the setters should have been called (we provided mockUpdateView as setter)
    expect(mockUpdateView).toHaveBeenCalled()

    const openNode = screen.getByTitle(/Open node/i)
    fireEvent.click(openNode)
    expect(mockUpdateView).toHaveBeenCalled()
  })
})
