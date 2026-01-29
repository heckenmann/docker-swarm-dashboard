import { render, screen, fireEvent } from '@testing-library/react'

jest.mock('../../../src/common/store/atoms', () => ({
  currentVariantAtom: 'currentVariantAtom',
  currentVariantClassesAtom: 'currentVariantClassesAtom',
  tableSizeAtom: 'tableSizeAtom',
  showNamesButtonsAtom: 'showNamesButtonsAtom',
  viewAtom: 'viewAtom',
  nodesAtomNew: 'nodesAtomNew',
}))

// provide mockable hooks
const mockUseAtomValue = jest.fn()
const mockUseAtom = jest.fn()
jest.mock('jotai', () => ({
  useAtomValue: (...args) => mockUseAtomValue(...args),
  useAtom: (...args) => mockUseAtom(...args),
}))

const modNodes = require('../../../src/components/NodesComponent')
const NodesComponent = modNodes.NodesComponent || modNodes.default || modNodes

describe('NodesComponent (combined)', () => {
  beforeEach(() => {
    mockUseAtomValue.mockReset()
    mockUseAtom.mockReset()
  })

  test('renders node with search button and leader tooltip', () => {
    const nodes = [
      {
        ID: 'n1',
        Hostname: 'node1',
        Leader: true,
        State: 'ready',
        Availability: 'active',
        StatusAddr: '1.2.3.4',
      },
    ]

    // return values in sequence (more robust against extra calls)
    const values = ['light', 'classes', 'sm', nodes]
    mockUseAtomValue.mockImplementation((atom) => {
      if (atom === 'showNamesButtonsAtom') return true
      return values.shift()
    })

    const mockUpdateView = jest.fn()
    mockUseAtom.mockImplementation((atom) => {
      if (atom === 'viewAtom') return [{}, mockUpdateView]
      return [null, mockUpdateView]
    })

    render(<NodesComponent />)

    expect(screen.getByText('node1')).toBeInTheDocument()
    const searchBtn = screen.getByTitle(/Open node/i)
    expect(searchBtn).toBeInTheDocument()

    fireEvent.click(searchBtn)
    // updateView is a functional updater; ensure it was called and produces expected new state
    expect(mockUpdateView).toHaveBeenCalled()
    const updater = mockUpdateView.mock.calls[0][0]
    expect(typeof updater).toBe('function')
    expect(updater({})).toEqual({ id: 'nodesDetail', detail: 'n1' })

    // tooltip exists in DOM as title is provided via OverlayTrigger; ensure the star span is present
    expect(
      screen.getByText(
        (content, element) =>
          element.tagName.toLowerCase() === 'span' &&
          element.textContent.trim() === '',
      ),
    ).toBeTruthy()
  })

  test('renders node in down state and non-active availability', () => {
    const nodes = [
      {
        ID: 'n2',
        Hostname: 'node2',
        Leader: false,
        State: 'down',
        Availability: 'pause',
        StatusAddr: '2.2.2.2',
      },
    ]
    const values = ['light', 'classes', 'sm', nodes]
    mockUseAtomValue.mockImplementation((atom) => {
      if (atom === 'showNamesButtonsAtom') return true
      return values.shift()
    })
    mockUseAtom.mockImplementation((atom) => {
      if (atom === 'viewAtom') return [{}, jest.fn()]
      return [null, jest.fn()]
    })
    render(<NodesComponent />)
    expect(screen.getByText('node2')).toBeInTheDocument()
    // Expect badge text showing 'Down' and availability 'pause'
    expect(screen.getByText('Down')).toBeInTheDocument()
    expect(screen.getByText('pause')).toBeInTheDocument()
  })

  test('renders node with non-ready state badge and IP', () => {
    const nodes = [
      {
        ID: 'n3',
        Hostname: 'node3',
        Leader: false,
        State: 'unknown',
        Availability: 'drain',
        StatusAddr: '3.3.3.3',
      },
    ]
    const values = ['light', 'classes', 'sm', nodes]
    mockUseAtomValue.mockImplementation((atom) => {
      if (atom === 'showNamesButtonsAtom') return true
      return values.shift()
    })
    mockUseAtom.mockImplementation((atom) => {
      if (atom === 'viewAtom') return [{}, jest.fn()]
      return [null, jest.fn()]
    })
    render(<NodesComponent />)
    expect(screen.getByText('node3')).toBeInTheDocument()
    expect(screen.getByText('unknown')).toBeInTheDocument()
    expect(screen.getByText('3.3.3.3')).toBeInTheDocument()
  })

  test('clicking column headers triggers sorting with 3-click cycle', () => {
    const nodes = [
      {
        ID: 'n1',
        Hostname: 'zeta',
        Role: 'worker',
        Leader: false,
        State: 'ready',
        Availability: 'active',
        StatusAddr: '1.1.1.1',
      },
      {
        ID: 'n2',
        Hostname: 'alpha',
        Role: 'manager',
        Leader: true,
        State: 'ready',
        Availability: 'active',
        StatusAddr: '2.2.2.2',
      },
    ]

    const mockSetView = jest.fn()

    // Test first click: ascending
    mockUseAtomValue.mockImplementation((atom) => {
      if (atom === 'showNamesButtonsAtom') return true
      if (atom === 'nodesAtomNew') return nodes
      if (atom === 'currentVariantAtom') return 'light'
      if (atom === 'currentVariantClassesAtom') return 'classes'
      if (atom === 'tableSizeAtom') return 'sm'
      return null
    })

    mockUseAtom.mockImplementation((atom) => {
      if (atom === 'viewAtom') return [{}, mockSetView]
      return [null, jest.fn()]
    })

    const { rerender } = render(<NodesComponent />)

    const hostnameHeader = screen.getByText('Node').closest('th')
    fireEvent.click(hostnameHeader)

    expect(mockSetView).toHaveBeenCalled()
    const updater1 = mockSetView.mock.calls[0][0]
    expect(typeof updater1).toBe('function')
    const result1 = updater1({})
    expect(result1).toEqual({ sortBy: 'Hostname', sortDirection: 'asc' })

    // Test second click: descending
    mockSetView.mockClear()
    mockUseAtom.mockImplementation((atom) => {
      if (atom === 'viewAtom')
        return [{ sortBy: 'Hostname', sortDirection: 'asc' }, mockSetView]
      return [null, jest.fn()]
    })

    rerender(<NodesComponent />)
    const hostnameHeader2 = screen.getByText('Node').closest('th')
    fireEvent.click(hostnameHeader2)

    expect(mockSetView).toHaveBeenCalled()
    const updater2 = mockSetView.mock.calls[0][0]
    const result2 = updater2({ sortBy: 'Hostname', sortDirection: 'asc' })
    expect(result2).toEqual({ sortBy: 'Hostname', sortDirection: 'desc' })

    // Test third click: reset
    mockSetView.mockClear()
    mockUseAtom.mockImplementation((atom) => {
      if (atom === 'viewAtom')
        return [{ sortBy: 'Hostname', sortDirection: 'desc' }, mockSetView]
      return [null, jest.fn()]
    })

    rerender(<NodesComponent />)
    const hostnameHeader3 = screen.getByText('Node').closest('th')
    fireEvent.click(hostnameHeader3)

    expect(mockSetView).toHaveBeenCalled()
    const updater3 = mockSetView.mock.calls[0][0]
    const result3 = updater3({ sortBy: 'Hostname', sortDirection: 'desc' })
    expect(result3).toEqual({ sortBy: null, sortDirection: 'asc' })
  })
})
