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

describe('TasksComponent small branch tests', () => {
  test('clicking service and node open buttons sets view and filters', async () => {
    const tasks = [
      {
        ID: 't1',
        Timestamp: new Date().toISOString(),
        State: 'running',
        DesiredState: 'running',
        ServiceName: 'svc1',
        ServiceID: 'sid1',
        Slot: 1,
        Stack: 'st1',
        NodeName: 'node1',
        NodeID: 'nid1',
        Err: '',
      },
    ]

    mockUseAtomValue.mockImplementation((atom) => {
      switch (atom) {
        case 'currentVariantAtom':
          return 'light'
        case 'currentVariantClassesAtom':
          return 'cls'
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
    const svcOpen = await screen.findByTitle('Open service: svc1')
    const nodeOpen = await screen.findByTitle('Open node: node1')
    expect(svcOpen).toBeInTheDocument()
    expect(nodeOpen).toBeInTheDocument()

    const svcFilter = await screen.findByTitle('Filter service: svc1')
    fireEvent.click(svcFilter)
    expect(mockSetService).toHaveBeenCalledWith('svc1')
    expect(mockSetType).toHaveBeenCalledWith('service')

    fireEvent.click(nodeOpen)
    expect(mockUpdateView).toHaveBeenCalled()
  })

  test('failed task row gets table-danger class', async () => {
    const tasks = [
      {
        ID: 't-err',
        Timestamp: new Date().toISOString(),
        State: 'failed',
        DesiredState: 'shutdown',
        ServiceName: 'svcerr',
        ServiceID: 'siderr',
        Slot: 2,
        Stack: 'sterr',
        NodeName: 'nodeerr',
        NodeID: 'niderr',
        Err: 'boom',
      },
    ]

    mockUseAtomValue.mockImplementation((atom) => {
      switch (atom) {
        case 'currentVariantAtom':
          return 'light'
        case 'currentVariantClassesAtom':
          return 'cls'
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

    mockUseAtom.mockImplementation((atom) => {
      if (atom === 'serviceNameFilterAtom') return ['', jest.fn()]
      if (atom === 'stackNameFilterAtom') return ['', jest.fn()]
      if (atom === 'filterTypeAtom') return ['', jest.fn()]
      return [null, jest.fn()]
    })

    const { container } = render(<TasksComponent />)
    // the failed row should have table-danger class
    const row = container.querySelector('tr.table-danger')
    expect(row).toBeTruthy()
  })
})
