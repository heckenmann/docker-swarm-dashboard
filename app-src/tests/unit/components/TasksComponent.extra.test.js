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

describe('TasksComponent extra', () => {
  test('stack filter button and open node button work', () => {
    const tasks = [ { ID: 't2', ServiceID: 's2', ServiceName: 'svc2', Stack: 'stack2', NodeID: 'n2', NodeName: 'node2', State: 'running', Timestamp: new Date().toISOString(), Slot: 1, Err: '' } ]

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

    render(<TasksComponent />)
    const stackFilter = screen.getByTitle(/Filter stack:/i)
    fireEvent.click(stackFilter)
    expect(mockSetStack).toHaveBeenCalledWith('stack2')
    expect(mockSetService).toHaveBeenCalledWith('')
    expect(mockSetType).toHaveBeenCalledWith('stack')

    const openNode = screen.getByTitle(/Open node/i)
    fireEvent.click(openNode)
    expect(mockUpdateView).toHaveBeenCalled()
  })
})
