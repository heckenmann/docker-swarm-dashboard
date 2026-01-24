import React from 'react'
import { render, screen } from '@testing-library/react'

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

describe('TasksComponent filtering branches', () => {
  test('serviceNameFilter excludes non-matching tasks', () => {
    const tasks = [
      { ID: 't1', ServiceName: 'keep', Stack: '', NodeName: 'n1', NodeID: 'n1', State: 'running', Timestamp: new Date().toISOString(), Slot: 1, Err: '' },
      { ID: 't2', ServiceName: 'drop', Stack: '', NodeName: 'n2', NodeID: 'n2', State: 'running', Timestamp: new Date().toISOString(), Slot: 1, Err: '' },
    ]

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
          return 'keep'
        case 'stackNameFilterAtom':
          return ''
        case 'tasksAtomNew':
          return tasks
        default:
          return ''
      }
    })

    mockUseAtom.mockImplementation((atom) => {
      if (atom === 'serviceNameFilterAtom') return ['keep', jest.fn()]
      if (atom === 'stackNameFilterAtom') return ['', jest.fn()]
      if (atom === 'filterTypeAtom') return ['service', jest.fn()]
      return [null, jest.fn()]
    })

    render(<TasksComponent />)
    expect(screen.getByText('keep')).toBeInTheDocument()
    expect(screen.queryByText('drop')).toBeNull()
  })

  test('stackNameFilter excludes non-matching tasks', () => {
    const tasks = [
      { ID: 't3', ServiceName: 's1', Stack: 'match', NodeName: 'n1', NodeID: 'n1', State: 'running', Timestamp: new Date().toISOString(), Slot: 1, Err: '' },
      { ID: 't4', ServiceName: 's2', Stack: 'other', NodeName: 'n2', NodeID: 'n2', State: 'running', Timestamp: new Date().toISOString(), Slot: 1, Err: '' },
    ]

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
          return 'match'
        case 'tasksAtomNew':
          return tasks
        default:
          return ''
      }
    })

    mockUseAtom.mockImplementation((atom) => {
      if (atom === 'serviceNameFilterAtom') return ['', jest.fn()]
      if (atom === 'stackNameFilterAtom') return ['match', jest.fn()]
      if (atom === 'filterTypeAtom') return ['stack', jest.fn()]
      return [null, jest.fn()]
    })

    render(<TasksComponent />)
    expect(screen.getByText('s1')).toBeInTheDocument()
    expect(screen.queryByText('s2')).toBeNull()
  })
})
