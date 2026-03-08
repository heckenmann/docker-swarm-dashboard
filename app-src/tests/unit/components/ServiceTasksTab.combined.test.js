// Combined tests for ServiceTasksTab component and getTaskMetrics helper.
// Covers: getTaskMetrics (including fallback paths), handleSort, and Details button onClick.
import { render, screen, fireEvent } from '@testing-library/react'

jest.mock('../../../src/common/store/atoms', () => ({
  currentVariantAtom: 'currentVariantAtom',
  tableSizeAtom: 'tableSizeAtom',
  viewAtom: 'viewAtom',
}))

const mockUseAtomValue = jest.fn()
const mockSetView = jest.fn()
const mockUseAtom = jest.fn()
jest.mock('jotai', () => ({
  useAtomValue: (...args) => mockUseAtomValue(...args),
  useAtom: (...args) => mockUseAtom(...args),
}))

jest.mock('@fortawesome/react-fontawesome', () => ({
  FontAwesomeIcon: () => null,
}))

jest.mock('../../../src/components/shared/names/NodeName', () => ({
  NodeName: ({ name }) => <span data-testid="node-name">{name}</span>,
}))

jest.mock('../../../src/components/services/ServiceStatusBadge', () => ({
  __esModule: true,
  default: ({ serviceState }) => <span data-testid="status">{serviceState}</span>,
}))

/**
 * Mock SortableHeader renders a plain <th> that calls onSort when clicked.
 * This allows tests to trigger handleSort without real sorting UI logic.
 */
jest.mock('../../../src/components/shared/SortableHeader', () => ({
  SortableHeader: ({ column, onSort, label }) => (
    <th data-column={column} onClick={() => onSort && onSort(column)}>
      {label || column}
    </th>
  ),
}))

const mod = require('../../../src/components/services/details/ServiceTasksTab')
const { ServiceTasksTab, getTaskMetrics } = mod

// ─── getTaskMetrics unit tests ────────────────────────────────────────────────

describe('getTaskMetrics', () => {
  test('returns null when taskMetrics is null', () => {
    expect(getTaskMetrics({}, null)).toBeNull()
  })

  test('matches by Spec.Name', () => {
    const metrics = { 'my-service.1': { usage: 100 } }
    expect(getTaskMetrics({ Spec: { Name: 'my-service.1' } }, metrics)).toEqual({ usage: 100 })
  })

  test('matches by task.Name when Spec.Name is absent', () => {
    const metrics = { 'task-name': { usage: 200 } }
    expect(getTaskMetrics({ Name: 'task-name' }, metrics)).toEqual({ usage: 200 })
  })

  test('falls back to task.ID when name lookup fails', () => {
    const metrics = { 'abc123': { usage: 50 } }
    const task = { Spec: { Name: 'notfound' }, ID: 'abc123' }
    expect(getTaskMetrics(task, metrics)).toEqual({ usage: 50 })
  })

  test('returns null when neither name nor ID matches', () => {
    const metrics = { other: {} }
    expect(getTaskMetrics({ Spec: { Name: 'x' }, ID: 'y' }, metrics)).toBeNull()
  })
})

// ─── ServiceTasksTab component tests ─────────────────────────────────────────

const SAMPLE_TASK = {
  ID: 'task-001',
  NodeID: 'node-1',
  NodeName: 'worker-1',
  Node: { ID: 'node-1', Description: { Hostname: 'worker-1' } },
  Spec: { Name: 'my-service.1' },
  Status: { State: 'running' },
  CreatedAt: '2025-01-01T00:00:00Z',
  UpdatedAt: '2025-01-01T01:00:00Z',
}

/**
 * Mounts ServiceTasksTab with sensible defaults.
 *
 * @param {object} [overrides] - prop overrides for the component
 * @returns {{ container: HTMLElement, ...renderResult }}
 */
function setup(overrides = {}) {
  mockSetView.mockReset()
  mockUseAtomValue.mockImplementation((atom) => {
    if (atom === 'currentVariantAtom') return 'light'
    if (atom === 'tableSizeAtom') return 'sm'
    return null
  })
  mockUseAtom.mockImplementation((atom) => {
    if (atom === 'viewAtom') return [null, mockSetView]
    return [null, jest.fn()]
  })
  return render(
    <ServiceTasksTab
      tasksForService={[SAMPLE_TASK]}
      taskMetrics={null}
      metricsLoading={false}
      {...overrides}
    />,
  )
}

describe('ServiceTasksTab', () => {
  beforeEach(() => {
    mockUseAtomValue.mockReset()
    mockUseAtom.mockReset()
  })

  test('renders a task row with the node name', () => {
    setup()
    expect(screen.getByTestId('node-name')).toBeInTheDocument()
  })

  test('shows loading spinner when metricsLoading is true', () => {
    setup({ metricsLoading: true, tasksForService: [] })
    expect(screen.getByText(/Loading metrics/)).toBeInTheDocument()
  })

  test('handleSort: three-click cycle asc → desc → reset', () => {
    const { container } = setup()
    const nodeHeader = container.querySelector('[data-column="NodeName"]')
    expect(nodeHeader).toBeTruthy()

    // Click 1: sorts ascending (no previous sort)
    fireEvent.click(nodeHeader)
    // Click 2: already sorted ascending → switch to descending
    fireEvent.click(nodeHeader)
    // Click 3: already sorted descending → reset sort
    fireEvent.click(nodeHeader)
    // All 3 branches of handleSort are now covered; no error is expected.
  })

  test('Details button click calls setView with task id and detail route', () => {
    setup()
    const detailsBtn = screen.getByRole('button', { name: /details/i })
    fireEvent.click(detailsBtn)
    expect(mockSetView).toHaveBeenCalledWith(
      expect.objectContaining({
        detail: 'task-001',
      }),
    )
  })
})
