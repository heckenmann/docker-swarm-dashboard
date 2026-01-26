import { render, screen, fireEvent } from '@testing-library/react'

jest.mock('../../../src/common/store/atoms', () => ({}))

// provide mockable hooks
const mockUseAtomValue = jest.fn()
const mockUseAtom = jest.fn()
jest.mock('jotai', () => ({ useAtomValue: (...args) => mockUseAtomValue(...args), useAtom: (...args) => mockUseAtom(...args) }))


describe('NodesComponent (combined)', () => {
  beforeEach(() => {
    mockUseAtomValue.mockReset()
    mockUseAtom.mockReset()
  })

  test('renders node with search button and leader tooltip', () => {
    const nodes = [
      { ID: 'n1', Hostname: 'node1', Leader: true, State: 'ready', Availability: 'active', StatusAddr: '1.2.3.4' },
    ]

    // return values in sequence (more robust against extra calls)
    const values = ['light', 'classes', 'sm', nodes]
    mockUseAtomValue.mockImplementation(() => values.shift())

    const mockUpdateView = jest.fn()
    mockUseAtom.mockImplementation(() => [null, mockUpdateView])

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
    expect(screen.getByText((content, element) => element.tagName.toLowerCase() === 'span' && element.textContent.trim() === '')).toBeTruthy()
  })

  test('renders node in down state and non-active availability', () => {
    const nodes = [
      { ID: 'n2', Hostname: 'node2', Leader: false, State: 'down', Availability: 'pause', StatusAddr: '2.2.2.2' },
    ]
    const values = ['light', 'classes', 'sm', nodes]
    mockUseAtomValue.mockImplementation(() => values.shift())
    mockUseAtom.mockImplementation(() => [null, jest.fn()])
    render(<NodesComponent />)
    expect(screen.getByText('node2')).toBeInTheDocument()
    // Expect badge text showing 'Down' and availability 'pause'
    expect(screen.getByText('Down')).toBeInTheDocument()
    expect(screen.getByText('pause')).toBeInTheDocument()
  })

  test('renders node with non-ready state badge and IP', () => {
    const nodes = [
      { ID: 'n3', Hostname: 'node3', Leader: false, State: 'unknown', Availability: 'drain', StatusAddr: '3.3.3.3' },
    ]
    const values = ['light', 'classes', 'sm', nodes]
    mockUseAtomValue.mockImplementation(() => values.shift())
    mockUseAtom.mockImplementation(() => [null, jest.fn()])
    render(<NodesComponent />)
    expect(screen.getByText('node3')).toBeInTheDocument()
    expect(screen.getByText('unknown')).toBeInTheDocument()
    expect(screen.getByText('3.3.3.3')).toBeInTheDocument()
  })
})
