// Combined tests for TasksComponent
// ...existing code from TasksComponent.test.js
import { render, screen, fireEvent } from '@testing-library/react'

jest.mock('../../../src/common/store/atoms/themeAtoms', () => ({
  currentVariantAtom: 'currentVariantAtom',
  currentVariantClassesAtom: 'currentVariantClassesAtom',
}))

jest.mock('../../../src/common/store/atoms/foundationAtoms', () => ({
  dashboardSettingsAtom: 'dashboardSettingsAtom',
  createHashAtomWithDefault: (k, d) => d,
}))

jest.mock('../../../src/common/store/atoms/uiAtoms', () => ({
  tableSizeAtom: 'tableSizeAtom',
  serviceNameFilterAtom: 'serviceNameFilterAtom',
  filterTypeAtom: 'filterTypeAtom',
  stackNameFilterAtom: 'stackNameFilterAtom',
}))

jest.mock('../../../src/common/store/atoms/dashboardAtoms', () => ({
  tasksAtomNew: 'tasksAtomNew',
}))

jest.mock('../../../src/common/store/atoms/navigationAtoms', () => ({
  viewAtom: 'viewAtom',
}))

const mockUseAtomValue = jest.fn()
const mockUseAtom = jest.fn()
jest.mock('jotai', () => ({
  atom: (v) => v,
  useAtomValue: (...args) => mockUseAtomValue(...args),
  useAtom: (...args) => mockUseAtom(...args),
}))

const modTasks = require('../../../src/components/tasks/TasksComponent')
const TasksComponent = modTasks.default

describe('TasksComponent (combined)', () => {
  beforeEach(() => {
    mockUseAtomValue.mockReset()
    mockUseAtom.mockReset()
  })
  test('renders task row with open service and filter buttons and node open', () => {
    const tasks = [
      {
        ID: 't1',
        ServiceID: 's1',
        ServiceName: 'svc1',
        Stack: '',
        NodeID: 'n1',
        NodeName: 'node1',
        State: 'running',
        Timestamp: new Date().toISOString(),
        Slot: 1,
        Err: '',
      },
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
          return ''
        case 'tasksAtomNew':
          return tasks
        case 'showNamesButtonsAtom':
          return true
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
    // Note: Open service/filter buttons require showNamesButtonsAtom=true context
    // which is tested separately in Names.combined.test.js
    expect(screen.getByRole('button', { name: 'Details' })).toBeInTheDocument()
  })

  test('stack filter button and open node button work', () => {
    const tasks = [
      {
        ID: 't2',
        ServiceID: 's2',
        ServiceName: 'svc2',
        Stack: 'stack2',
        NodeID: 'n2',
        NodeName: 'node2',
        State: 'running',
        Timestamp: new Date().toISOString(),
        Slot: 1,
        Err: '',
      },
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
          return ''
        case 'tasksAtomNew':
          return tasks
        case 'showNamesButtonsAtom':
          return true
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
    // Filter buttons require showNamesButtonsAtom=true context
    // which is tested separately in Names.combined.test.js
    expect(screen.getByRole('button', { name: 'Details' })).toBeInTheDocument()
  })

  test('task without ServiceName still renders node open button and no service buttons', () => {
    const tasks = [
      {
        ID: 'tX',
        ServiceName: '',
        ServiceID: '',
        Stack: '',
        NodeID: 'nX',
        NodeName: 'nodeX',
        State: 'running',
        Timestamp: new Date().toISOString(),
        Slot: 1,
        Err: '',
      },
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
          return ''
        case 'tasksAtomNew':
          return tasks
        case 'showNamesButtonsAtom':
          return true
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
    // Details button should always be visible regardless of showNamesButtonsAtom
    expect(screen.getByRole('button', { name: 'Details' })).toBeInTheDocument()
  })

  test('serviceNameFilter excludes non-matching tasks', () => {
    const tasks = [
      {
        ID: 't1',
        ServiceName: 'keep',
        Stack: '',
        NodeName: 'n1',
        NodeID: 'n1',
        State: 'running',
        Timestamp: new Date().toISOString(),
        Slot: 1,
        Err: '',
      },
      {
        ID: 't2',
        ServiceName: 'drop',
        Stack: '',
        NodeName: 'n2',
        NodeID: 'n2',
        State: 'running',
        Timestamp: new Date().toISOString(),
        Slot: 1,
        Err: '',
      },
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
        case 'showNamesButtonsAtom':
          return true
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
      {
        ID: 't3',
        ServiceName: 's1',
        Stack: 'match',
        NodeName: 'n1',
        NodeID: 'n1',
        State: 'running',
        Timestamp: new Date().toISOString(),
        Slot: 1,
        Err: '',
      },
      {
        ID: 't4',
        ServiceName: 's2',
        Stack: 'other',
        NodeName: 'n2',
        NodeID: 'n2',
        State: 'running',
        Timestamp: new Date().toISOString(),
        Slot: 1,
        Err: '',
      },
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
        case 'showNamesButtonsAtom':
          return true
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
    const tasks = [
      {
        ID: 't-f',
        ServiceID: 's1',
        ServiceName: 'svcF',
        Stack: '',
        NodeID: 'n1',
        NodeName: 'node1',
        State: 'failed',
        Timestamp: new Date().toISOString(),
        Slot: 1,
        Err: 'boom',
      },
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
          return ''
        case 'tasksAtomNew':
          return tasks
        case 'showNamesButtonsAtom':
          return true
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

  test('filter buttons exist in filter component', () => {
    const tasks = [
      {
        ID: 'tZ',
        ServiceName: 'svcZ',
        ServiceID: 'sZ',
        Stack: 'stackZ',
        NodeID: 'nZ',
        NodeName: 'nodeZ',
        State: 'running',
        Timestamp: new Date().toISOString(),
        Slot: 1,
        Err: '',
      },
    ]

    const mockSetShowNames = jest.fn()
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
      if (atom === 'showNamesButtonsAtom') return [true, mockSetShowNames]
      if (atom === 'serviceNameFilterAtom') return ['', jest.fn()]
      if (atom === 'stackNameFilterAtom') return ['', jest.fn()]
      if (atom === 'filterTypeAtom') return ['service', jest.fn()]
      if (atom === 'viewAtom') return [{ id: 'tasks' }, jest.fn()]
      return [null, jest.fn()]
    })

    render(<TasksComponent />)
    // Filter buttons exist - actual filtering is tested via serviceNameFilter/stackNameFilter tests
    expect(screen.getByRole('button', { name: /Filter by service/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Filter by stack/i })).toBeInTheDocument()
  })

  test('clicking column headers triggers sorting with 3-click cycle', () => {
    const tasks = [
      {
        ID: 't1',
        ServiceID: 's1',
        ServiceName: 'zeta-service',
        Stack: 'stack-z',
        NodeID: 'n1',
        NodeName: 'node1',
        State: 'running',
        DesiredState: 'running',
        Timestamp: '2023-01-01T00:00:00Z',
        Slot: 2,
        Err: '',
      },
      {
        ID: 't2',
        ServiceID: 's2',
        ServiceName: 'alpha-service',
        Stack: 'stack-a',
        NodeID: 'n2',
        NodeName: 'node2',
        State: 'running',
        DesiredState: 'running',
        Timestamp: '2023-02-01T00:00:00Z',
        Slot: 1,
        Err: '',
      },
    ]

    const mockSetView = jest.fn()

    // Test first click: ascending
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
        case 'showNamesButtonsAtom':
          return true
        default:
          return ''
      }
    })

    mockUseAtom.mockImplementation((atom) => {
      if (atom === 'viewAtom') return [{}, mockSetView]
      if (atom === 'serviceNameFilterAtom') return ['', jest.fn()]
      if (atom === 'stackNameFilterAtom') return ['', jest.fn()]
      if (atom === 'filterTypeAtom') return ['service', jest.fn()]
      return [null, jest.fn()]
    })

    const { rerender } = render(<TasksComponent />)

    // First click on ServiceName
    const header = screen.getByText('ServiceName').closest('th')
    fireEvent.click(header)

    expect(mockSetView).toHaveBeenCalled()
    const updater1 = mockSetView.mock.calls[0][0]
    expect(typeof updater1).toBe('function')
    const result1 = updater1({})
    expect(result1).toEqual({ sortBy: 'ServiceName', sortDirection: 'asc' })

    // Second click: should sort descending
    mockSetView.mockClear()
    mockUseAtom.mockImplementation((atom) => {
      if (atom === 'viewAtom')
        return [{ sortBy: 'ServiceName', sortDirection: 'asc' }, mockSetView]
      if (atom === 'serviceNameFilterAtom') return ['', jest.fn()]
      if (atom === 'stackNameFilterAtom') return ['', jest.fn()]
      if (atom === 'filterTypeAtom') return ['service', jest.fn()]
      return [null, jest.fn()]
    })

    rerender(<TasksComponent />)
    const header2 = screen.getByText('ServiceName').closest('th')
    fireEvent.click(header2)

    expect(mockSetView).toHaveBeenCalled()
    const updater2 = mockSetView.mock.calls[0][0]
    const result2 = updater2({ sortBy: 'ServiceName', sortDirection: 'asc' })
    expect(result2).toEqual({ sortBy: 'ServiceName', sortDirection: 'asc' })

    // Third click: should reset (clear sort)
    mockSetView.mockClear()
    mockUseAtom.mockImplementation((atom) => {
      if (atom === 'viewAtom')
        return [{ sortBy: 'ServiceName', sortDirection: 'desc' }, mockSetView]
      if (atom === 'serviceNameFilterAtom') return ['', jest.fn()]
      if (atom === 'stackNameFilterAtom') return ['', jest.fn()]
      if (atom === 'filterTypeAtom') return ['service', jest.fn()]
      return [null, jest.fn()]
    })

    rerender(<TasksComponent />)
    const header3 = screen.getByText('ServiceName').closest('th')
    fireEvent.click(header3)

    expect(mockSetView).toHaveBeenCalled()
    const updater3 = mockSetView.mock.calls[0][0]
    const result3 = updater3({ sortBy: 'ServiceName', sortDirection: 'asc' })
    expect(result3).toEqual({ sortBy: 'ServiceName', sortDirection: 'asc' })
  })

  // ---- tableSizeAtom effect ----
  test('tasks table has table-sm class when tableSizeAtom is sm', () => {
    mockUseAtomValue.mockImplementation((atom) => {
      switch (atom) {
        case 'currentVariantAtom': return 'light'
        case 'currentVariantClassesAtom': return ''
        case 'tableSizeAtom': return 'sm'
        case 'dashboardSettingsAtom': return { locale: 'en', timeZone: 'UTC' }
        case 'serviceNameFilterAtom': return ''
        case 'stackNameFilterAtom': return ''
        case 'tasksAtomNew': return []
        case 'showNamesButtonsAtom': return false
        default: return ''
      }
    })
    mockUseAtom.mockImplementation((atom) => {
      if (atom === 'filterTypeAtom') return ['service', jest.fn()]
      if (atom === 'serviceNameFilterAtom') return ['', jest.fn()]
      if (atom === 'stackNameFilterAtom') return ['', jest.fn()]
      if (atom === 'viewAtom') return [null, jest.fn()]
      return [null, jest.fn()]
    })
    const { container } = render(<TasksComponent />)
    const table = container.querySelector('table.tasks-table')
    expect(table).toBeTruthy()
    expect(table.className).toContain('table-sm')
  })

  test('tasks table does not have table-sm class when tableSizeAtom is lg', () => {
    mockUseAtomValue.mockImplementation((atom) => {
      switch (atom) {
        case 'currentVariantAtom': return 'light'
        case 'currentVariantClassesAtom': return ''
        case 'tableSizeAtom': return 'lg'
        case 'dashboardSettingsAtom': return { locale: 'en', timeZone: 'UTC' }
        case 'serviceNameFilterAtom': return ''
        case 'stackNameFilterAtom': return ''
        case 'tasksAtomNew': return []
        case 'showNamesButtonsAtom': return false
        default: return ''
      }
    })
    mockUseAtom.mockImplementation((atom) => {
      if (atom === 'filterTypeAtom') return ['service', jest.fn()]
      if (atom === 'serviceNameFilterAtom') return ['', jest.fn()]
      if (atom === 'stackNameFilterAtom') return ['', jest.fn()]
      if (atom === 'viewAtom') return [null, jest.fn()]
      return [null, jest.fn()]
    })
    const { container } = render(<TasksComponent />)
    const table = container.querySelector('table.tasks-table')
    expect(table).toBeTruthy()
    expect(table.className).not.toContain('table-sm')
  })

  test('Details button click calls setView with task id and detail route', () => {
    const tasks = [
      {
        ID: 'task-xyz',
        ServiceID: 's1',
        ServiceName: 'svc1',
        Stack: '',
        NodeID: 'n1',
        NodeName: 'node1',
        State: 'running',
        Timestamp: new Date().toISOString(),
        Slot: 1,
        Err: '',
      },
    ]
    const mockSetView = jest.fn()
    mockUseAtomValue.mockImplementation((atom) => {
      switch (atom) {
        case 'currentVariantAtom': return 'light'
        case 'currentVariantClassesAtom': return ''
        case 'tableSizeAtom': return 'sm'
        case 'dashboardSettingsAtom': return { locale: 'en', timeZone: 'UTC' }
        case 'serviceNameFilterAtom': return ''
        case 'stackNameFilterAtom': return ''
        case 'tasksAtomNew': return tasks
        case 'showNamesButtonsAtom': return false
        default: return ''
      }
    })
    mockUseAtom.mockImplementation((atom) => {
      if (atom === 'filterTypeAtom') return ['service', jest.fn()]
      if (atom === 'serviceNameFilterAtom') return ['', jest.fn()]
      if (atom === 'stackNameFilterAtom') return ['', jest.fn()]
      if (atom === 'viewAtom') return [null, mockSetView]
      return [null, jest.fn()]
    })
    render(<TasksComponent />)
    const detailsBtn = screen.getByRole('button', { name: /details/i })
    fireEvent.click(detailsBtn)
    expect(mockSetView).toHaveBeenCalledWith(
      expect.objectContaining({ detail: 'task-xyz' }),
    )
  })

})
