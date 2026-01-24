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

describe('TasksComponent more branches', () => {
  test('task without ServiceName still renders node open button and no service buttons', () => {
    const tasks = [ { ID: 'tX', ServiceName: '', ServiceID: '', Stack: '', NodeID: 'nX', NodeName: 'nodeX', State: 'running', Timestamp: new Date().toISOString(), Slot: 1, Err: '' } ]

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

    mockUseAtom.mockImplementation((atom) => {
      if (atom === 'viewAtom') return [null, jest.fn()]
      if (atom === 'serviceNameFilterAtom') return ['', jest.fn()]
      if (atom === 'stackNameFilterAtom') return ['', jest.fn()]
      if (atom === 'filterTypeAtom') return ['service', jest.fn()]
      return [null, jest.fn()]
    })

    render(<TasksComponent />)
    // Node open button should exist
    const openNode = screen.getByTitle(/Open node/i)
    expect(openNode).toBeInTheDocument()
    // Service open/filter buttons should not exist because ServiceName is empty
    expect(screen.queryByTitle(/Open service/i)).toBeNull()
    expect(screen.queryByTitle(/Filter service/i)).toBeNull()
  })
})
