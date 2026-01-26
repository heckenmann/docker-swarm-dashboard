// Combined tests for TasksComponent
// ...existing code from TasksComponent.test.js
import { render, screen, fireEvent } from '@testing-library/react'

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

const modTasks = require('../../../src/components/TasksComponent')
const TasksComponent = modTasks.TasksComponent || modTasks.default || modTasks

describe('TasksComponent (combined)', () => {
  beforeEach(() => {
    mockUseAtomValue.mockReset()
    mockUseAtom.mockReset()
  })
  test('renders task row with open service and filter buttons and node open', () => {
    const tasks = [ { ID: 't1', ServiceID: 's1', ServiceName: 'svc1', Stack: '', NodeID: 'n1', NodeName: 'node1', State: 'running', Timestamp: new Date().toISOString(), Slot: 1, Err: '' } ]

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
    expect(mockUpdateView).toHaveBeenCalled()

    const openNode = screen.getByTitle(/Open node/i)
    fireEvent.click(openNode)
    expect(mockUpdateView).toHaveBeenCalled()
  })

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
    const openNode = screen.getByTitle(/Open node/i)
    expect(openNode).toBeInTheDocument()
    expect(screen.queryByTitle(/Open service/i)).toBeNull()
    expect(screen.queryByTitle(/Filter service/i)).toBeNull()
  })

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

  test('renders failed task row with table-danger class', () => {
    const tasks = [ { ID: 't-f', ServiceID: 's1', ServiceName: 'svcF', Stack: '', NodeID: 'n1', NodeName: 'node1', State: 'failed', Timestamp: new Date().toISOString(), Slot: 1, Err: 'boom' } ]

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
    expect(screen.getByText('boom')).toBeInTheDocument()
    const errorCell = screen.getByText('boom')
    expect(errorCell.closest('tr').className).toContain('table-danger')
  })

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
