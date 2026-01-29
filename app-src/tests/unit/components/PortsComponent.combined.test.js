// Combined tests for PortsComponent
import { render, screen, fireEvent } from '@testing-library/react'

const modPorts = require('../../../src/components/PortsComponent')
const PortsComponent = modPorts.PortsComponent || modPorts.default || modPorts

jest.mock('../../../src/common/store/atoms', () => ({
  currentVariantAtom: 'currentVariantAtom',
  currentVariantClassesAtom: 'currentVariantClassesAtom',
  tableSizeAtom: 'tableSizeAtom',
  serviceNameFilterAtom: 'serviceNameFilterAtom',
  stackNameFilterAtom: 'stackNameFilterAtom',
  filterTypeAtom: 'filterTypeAtom',
  portsAtom: 'portsAtom',
  showNamesButtonsAtom: 'showNamesButtonsAtom',
  viewAtom: 'viewAtom',
}))

const mockUseAtomValue = jest.fn()
const mockUseAtom = jest.fn()
jest.mock('jotai', () => ({
  useAtomValue: (...args) => mockUseAtomValue(...args),
  useAtom: (...args) => mockUseAtom(...args),
}))

describe('PortsComponent (combined)', () => {
  beforeEach(() => {
    mockUseAtomValue.mockReset()
    mockUseAtom.mockReset()
  })
  test('renders port row with service open and filter', () => {
    const ports = [
      {
        PublishedPort: 8080,
        TargetPort: 8080,
        Protocol: 'tcp',
        PublishMode: 'ingress',
        ServiceName: 'svc1',
        ServiceID: 's1',
        Stack: 'st1',
      },
    ]
    const values = ['light', 'classes', 'sm', '', '', ports]
    mockUseAtomValue.mockImplementation((atom) => {
      if (atom === 'showNamesButtonsAtom') return true
      return values.shift()
    })

    const mockUpdateView = jest.fn()
    mockUseAtom.mockImplementation((atom) => {
      if (atom === 'filterTypeAtom') return ['service', mockUpdateView]
      if (atom === 'serviceNameFilterAtom') return ['', mockUpdateView]
      if (atom === 'stackNameFilterAtom') return ['', mockUpdateView]
      if (atom === 'viewAtom') return [null, mockUpdateView]
      return [null, mockUpdateView]
    })

    render(<PortsComponent />)
    const matches = screen.getAllByText('8080')
    expect(matches.length).toBeGreaterThan(0)
    const openBtn = screen.getByTitle(/Open service/i)
    fireEvent.click(openBtn)
    expect(mockUpdateView).toHaveBeenCalled()
    const filterBtn = screen.getByTitle(/Filter service/i)
    fireEvent.click(filterBtn)
    expect(mockUpdateView).toHaveBeenCalled()
  })

  test('renders port row without service/stack buttons when names empty', () => {
    const ports = [
      {
        PublishedPort: 8080,
        TargetPort: 8080,
        Protocol: 'tcp',
        PublishMode: 'ingress',
        ServiceName: '',
        ServiceID: '',
        Stack: '',
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
        case 'serviceNameFilterAtom':
          return ''
        case 'stackNameFilterAtom':
          return ''
        case 'portsAtom':
          return ports
        case 'showNamesButtonsAtom':
          return false
        default:
          return ''
      }
    })

    const mockUpdateView = jest.fn()
    mockUseAtom.mockImplementation((atom) => {
      if (atom === 'viewAtom') return [null, mockUpdateView]
      if (atom === 'serviceNameFilterAtom') return ['', jest.fn()]
      if (atom === 'stackNameFilterAtom') return ['', jest.fn()]
      if (atom === 'filterTypeAtom') return ['service', jest.fn()]
      return [null, mockUpdateView]
    })

    render(<PortsComponent />)
    expect(screen.getAllByText('8080').length).toBeGreaterThan(0)
    expect(screen.queryByTitle(/Open service/i)).toBeNull()
    expect(screen.queryByTitle(/Filter service/i)).toBeNull()
    expect(screen.queryByTitle(/Filter stack/i)).toBeNull()
  })

  test('service and stack buttons call setters and updateView', () => {
    const ports = [
      {
        PublishedPort: 9090,
        TargetPort: 9090,
        Protocol: 'tcp',
        PublishMode: 'ingress',
        ServiceName: 'svcX',
        ServiceID: 'sX',
        Stack: 'stX',
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
        case 'serviceNameFilterAtom':
          return ''
        case 'stackNameFilterAtom':
          return ''
        case 'portsAtom':
          return ports
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

    render(<PortsComponent />)

    const openBtn = screen.getByTitle(/Open service/i)
    fireEvent.click(openBtn)
    expect(mockUpdateView).toHaveBeenCalled()

    const svcFilter = screen.getByTitle(/Filter service:/i)
    fireEvent.click(svcFilter)
    expect(mockSetService).toHaveBeenCalledWith('svcX')
    expect(mockSetStack).toHaveBeenCalledWith('')
    expect(mockSetType).toHaveBeenCalledWith('service')

    const stackFilter = screen.getByTitle(/Filter stack:/i)
    fireEvent.click(stackFilter)
    expect(mockSetStack).toHaveBeenCalledWith('stX')
    expect(mockSetService).toHaveBeenCalledWith('')
    expect(mockSetType).toHaveBeenCalledWith('stack')
  })

  test('stackNameFilter filters rows and stack button absent when stack empty', () => {
    const ports = [
      {
        PublishedPort: 1111,
        TargetPort: 1111,
        Protocol: 'tcp',
        PublishMode: 'ingress',
        ServiceName: 'a',
        ServiceID: 's1',
        Stack: '',
      },
      {
        PublishedPort: 2222,
        TargetPort: 2222,
        Protocol: 'tcp',
        PublishMode: 'ingress',
        ServiceName: 'b',
        ServiceID: 's2',
        Stack: 'st2',
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
        case 'serviceNameFilterAtom':
          return ''
        case 'stackNameFilterAtom':
          return 'st2'
        case 'portsAtom':
          return ports
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
      if (atom === 'stackNameFilterAtom') return ['st2', mockSetStack]
      if (atom === 'filterTypeAtom') return ['stack', mockSetType]
      return [null, mockUpdateView]
    })

    render(<PortsComponent />)
    expect(screen.queryByText('1111')).toBeNull()
    const matches = screen.getAllByText('2222')
    expect(matches.length).toBeGreaterThan(0)

    const stackFilter = screen.getByTitle(/Filter stack:/i)
    fireEvent.click(stackFilter)
    expect(mockSetStack).toHaveBeenCalledWith('st2')
    expect(mockSetService).toHaveBeenCalledWith('')
    expect(mockSetType).toHaveBeenCalledWith('stack')
  })

  test('serviceNameFilter filters rows', () => {
    const ports = [
      {
        PublishedPort: 1,
        TargetPort: 1,
        Protocol: 'tcp',
        PublishMode: 'ingress',
        ServiceName: 'match',
        ServiceID: 's1',
        Stack: 'st1',
      },
      {
        PublishedPort: 2,
        TargetPort: 2,
        Protocol: 'tcp',
        PublishMode: 'ingress',
        ServiceName: 'other',
        ServiceID: 's2',
        Stack: 'st2',
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
        case 'serviceNameFilterAtom':
          return 'match'
        case 'stackNameFilterAtom':
          return ''
        case 'portsAtom':
          return ports
        case 'showNamesButtonsAtom':
          return true
        default:
          return ''
      }
    })

    mockUseAtom.mockImplementation((atom) => {
      if (atom === 'serviceNameFilterAtom') return ['match', jest.fn()]
      if (atom === 'stackNameFilterAtom') return ['', jest.fn()]
      if (atom === 'filterTypeAtom') return ['service', jest.fn()]
      return [null, jest.fn()]
    })

    render(<PortsComponent />)
    expect(screen.queryByText('match')).toBeInTheDocument()
    expect(screen.queryByText('other')).toBeNull()
  })

  test('renders filter buttons only when service/stack present and clicking sets atoms', () => {
    const ports = [
      {
        PublishedPort: 1000,
        TargetPort: 2000,
        Protocol: 'tcp',
        PublishMode: 'ingress',
        ServiceName: 'svc-a',
        ServiceID: 'sid-a',
        Stack: 'stack-a',
      },
      {
        PublishedPort: 1001,
        TargetPort: 2001,
        Protocol: 'tcp',
        PublishMode: 'ingress',
        ServiceName: '',
        ServiceID: '',
        Stack: '',
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
        case 'serviceNameFilterAtom':
          return ''
        case 'stackNameFilterAtom':
          return ''
        case 'portsAtom':
          return ports
        case 'showNamesButtonsAtom':
          return true
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

    render(<PortsComponent />)
    const svcFilter = screen.getByTitle(/Filter service:/i)
    fireEvent.click(svcFilter)
    expect(mockSetService).toHaveBeenCalledWith('svc-a')
    expect(mockSetType).toHaveBeenCalledWith('service')

    const stackFilter = screen.getByTitle(/Filter stack:/i)
    fireEvent.click(stackFilter)
    expect(mockSetStack).toHaveBeenCalledWith('stack-a')
    expect(mockSetService).toHaveBeenCalledWith('')
    expect(mockSetType).toHaveBeenCalledWith('stack')
  })

  test('clicking column headers triggers sorting with 3-click cycle', () => {
    const ports = [
      {
        PublishedPort: 8080,
        TargetPort: 8080,
        Protocol: 'tcp',
        PublishMode: 'ingress',
        ServiceName: 'zeta',
        ServiceID: 's1',
        Stack: 'stack-z',
      },
      {
        PublishedPort: 80,
        TargetPort: 80,
        Protocol: 'tcp',
        PublishMode: 'ingress',
        ServiceName: 'alpha',
        ServiceID: 's2',
        Stack: 'stack-a',
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
        case 'serviceNameFilterAtom':
          return ''
        case 'stackNameFilterAtom':
          return ''
        case 'portsAtom':
          return ports
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

    const { rerender } = render(<PortsComponent />)

    // First click on PublishedPort
    const header = screen.getByText('PublishedPort').closest('th')
    fireEvent.click(header)

    expect(mockSetView).toHaveBeenCalled()
    const updater1 = mockSetView.mock.calls[0][0]
    expect(typeof updater1).toBe('function')
    const result1 = updater1({})
    expect(result1).toEqual({ sortBy: 'PublishedPort', sortDirection: 'asc' })

    // Second click: should sort descending
    mockSetView.mockClear()
    mockUseAtom.mockImplementation((atom) => {
      if (atom === 'viewAtom')
        return [{ sortBy: 'PublishedPort', sortDirection: 'asc' }, mockSetView]
      if (atom === 'serviceNameFilterAtom') return ['', jest.fn()]
      if (atom === 'stackNameFilterAtom') return ['', jest.fn()]
      if (atom === 'filterTypeAtom') return ['service', jest.fn()]
      return [null, jest.fn()]
    })

    rerender(<PortsComponent />)
    const header2 = screen.getByText('PublishedPort').closest('th')
    fireEvent.click(header2)

    expect(mockSetView).toHaveBeenCalled()
    const updater2 = mockSetView.mock.calls[0][0]
    const result2 = updater2({ sortBy: 'PublishedPort', sortDirection: 'asc' })
    expect(result2).toEqual({ sortBy: 'PublishedPort', sortDirection: 'desc' })

    // Third click: should reset (clear sort)
    mockSetView.mockClear()
    mockUseAtom.mockImplementation((atom) => {
      if (atom === 'viewAtom')
        return [{ sortBy: 'PublishedPort', sortDirection: 'desc' }, mockSetView]
      if (atom === 'serviceNameFilterAtom') return ['', jest.fn()]
      if (atom === 'stackNameFilterAtom') return ['', jest.fn()]
      if (atom === 'filterTypeAtom') return ['service', jest.fn()]
      return [null, jest.fn()]
    })

    rerender(<PortsComponent />)
    const header3 = screen.getByText('PublishedPort').closest('th')
    fireEvent.click(header3)

    expect(mockSetView).toHaveBeenCalled()
    const updater3 = mockSetView.mock.calls[0][0]
    const result3 = updater3({ sortBy: 'PublishedPort', sortDirection: 'desc' })
    expect(result3).toEqual({ sortBy: null, sortDirection: 'asc' })
  })
})
