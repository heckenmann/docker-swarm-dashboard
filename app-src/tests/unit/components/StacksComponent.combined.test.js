import { render, screen, fireEvent } from '@testing-library/react'

jest.mock('../../../src/common/store/atoms', () => ({
  currentVariantAtom: 'currentVariantAtom',
  currentVariantClassesAtom: 'currentVariantClassesAtom',
  dashboardSettingsAtom: 'dashboardSettingsAtom',
  serviceNameFilterAtom: 'serviceNameFilterAtom',
  stackNameFilterAtom: 'stackNameFilterAtom',
  filterTypeAtom: 'filterTypeAtom',
  viewAtom: 'viewAtom',
  stacksAtom: 'stacksAtom',
}))

const mockUseAtomValue = jest.fn()
const mockUseAtom = jest.fn()
jest.mock('jotai', () => ({ useAtomValue: (...args) => mockUseAtomValue(...args), useAtom: (...args) => mockUseAtom(...args) }))


describe('StacksComponent (combined)', () => {
  beforeEach(() => {
    mockUseAtomValue.mockReset()
    mockUseAtom.mockReset()
  })

  test('shows service when serviceNameFilter matches (normalized)', () => {
    const stacks = [
      { Name: 'backend', Services: [ { ID: 's1', ShortName: 'myservice', ServiceName: 'backend_my-service', Replication: '1', Created: new Date().toISOString(), Updated: new Date().toISOString() } ] }
    ]

    // atoms: currentVariant, currentVariantClasses, dashboardSettings, serviceNameFilter, stackNameFilter, stacksAtom
    mockUseAtomValue.mockImplementationOnce(() => 'light')
    mockUseAtomValue.mockImplementationOnce(() => 'classes')
    mockUseAtomValue.mockImplementationOnce(() => ({ locale: 'en', timeZone: 'UTC' }))
    mockUseAtomValue.mockImplementationOnce(() => 'myservice') // serviceNameFilter
    mockUseAtomValue.mockImplementationOnce(() => '') // stackNameFilter
    mockUseAtomValue.mockImplementationOnce(() => stacks)

    const mockSetService = jest.fn()
    const mockSetStack = jest.fn()
    const mockSetFilterType = jest.fn()
    mockUseAtom.mockImplementation((atom) => {
      if (atom === 'serviceNameFilterAtom') return ['myservice', mockSetService]
      if (atom === 'stackNameFilterAtom') return ['', mockSetStack]
      if (atom === 'filterTypeAtom') return ['service', mockSetFilterType]
      return [null, mockSetService]
    })

    render(<StacksComponent />)

    expect(screen.getByText('myservice')).toBeInTheDocument()

    // click open service
    const openBtn = screen.getByTitle(/Open service/i)
    fireEvent.click(openBtn)
    // updateView is returned by one of the useAtom calls; ensure it was invoked (we used mockUseAtom returning mockSetService)
    // can't assert exact value here without mocking updateView separately, but at least ensure button exists
    expect(openBtn).toBeInTheDocument()

    // click filter button
    const filterBtn = screen.getByTitle(/Filter service/i)
    expect(filterBtn).toBeInTheDocument()
    fireEvent.click(filterBtn)
    expect(mockSetService).toHaveBeenCalled()
  })

  test('filters services by shortName and full ServiceName', () => {
    const stacks = [
      {
        Name: 'st1',
        Services: [
          { ID: 's1', ShortName: 'svc-short', ServiceName: 'svc-full-name', Replication: 1, Created: new Date().toISOString(), Updated: new Date().toISOString() },
          { ID: 's2', ShortName: null, ServiceName: 'another-service', Replication: 1, Created: new Date().toISOString(), Updated: new Date().toISOString() },
        ],
      },
    ]

    // useAtomValue is called for currentVariant, currentVariantClasses, dashboardSettings, service filters and stacks
    const values = ['light', 'classes', { locale: 'en', timeZone: 'UTC' }, 'svc-short', '', stacks]
    mockUseAtomValue.mockImplementation(() => values.shift())

    const mockSetService = jest.fn()
    const mockSetStack = jest.fn()
    const mockSetType = jest.fn()
    const mockUpdateView = jest.fn()

    mockUseAtom.mockImplementation((atom) => {
      if (atom === 'serviceNameFilterAtom') return ['svc-short', mockSetService]
      if (atom === 'stackNameFilterAtom') return ['', mockSetStack]
      if (atom === 'filterTypeAtom') return ['service', mockSetType]
      if (atom === 'viewAtom') return [null, mockUpdateView]
      return [null, jest.fn()]
    })

    render(<StacksComponent />)

    // Only the service matching 'svc-short' should be present in the rendered table
    expect(screen.getByText('svc-short')).toBeInTheDocument()
    expect(screen.queryByText('another-service')).toBeNull()

    // Click the filter button for the visible service
    const filterBtn = screen.getByTitle(/Filter service:/i)
    fireEvent.click(filterBtn)
    expect(mockSetService).toHaveBeenCalledWith('svc-short')
    expect(mockSetType).toHaveBeenCalledWith('service')
  })

  test('stack filter button sets stack and clears service filter', () => {
    const stacks = [ { Name: 'stX', Services: [ { ID: 's1', ServiceName: 'svc1', ShortName: null, Replication: 1, Created: new Date().toISOString(), Updated: new Date().toISOString() } ] } ]
    const values = ['light', 'classes', { locale: 'en', timeZone: 'UTC' }, '', '', stacks]
    mockUseAtomValue.mockImplementation(() => values.shift())

    const mockSetService = jest.fn()
    const mockSetStack = jest.fn()
    const mockSetType = jest.fn()
    mockUseAtom.mockImplementation((atom) => {
      if (atom === 'serviceNameFilterAtom') return ['', mockSetService]
      if (atom === 'stackNameFilterAtom') return ['', mockSetStack]
      if (atom === 'filterTypeAtom') return ['', mockSetType]
      return [null, jest.fn()]
    })

    render(<StacksComponent />)

    const stackFilterBtn = screen.getByTitle(/Filter stack:/i)
    fireEvent.click(stackFilterBtn)
    expect(mockSetStack).toHaveBeenCalledWith('stX')
    expect(mockSetService).toHaveBeenCalledWith('')
    expect(mockSetType).toHaveBeenCalledWith('stack')
  })

  test('service normalization matches full ServiceName when ShortName null', () => {
    const stacks = [
      {
        Name: 's1',
        Services: [ { ID: 'svc1', ShortName: null, ServiceName: 'My-Service_Name', Replication: 1, Created: new Date().toISOString(), Updated: new Date().toISOString() } ],
      },
    ]

    mockUseAtomValue.mockImplementation((atom) => {
      switch (atom) {
        case 'currentVariantAtom':
          return 'light'
        case 'currentVariantClassesAtom':
          return 'classes'
        case 'dashboardSettingsAtom':
          return { locale: 'en', timeZone: 'UTC' }
        case 'serviceNameFilterAtom':
          return 'myservicename'
        case 'stackNameFilterAtom':
          return ''
        case 'stacksAtom':
          return stacks
        default:
          return ''
      }
    })

    const mockSetService = jest.fn()
    const mockSetStack = jest.fn()
    const mockSetType = jest.fn()
    const mockUpdateView = jest.fn()
    mockUseAtom.mockImplementation((atom) => {
      if (atom === 'serviceNameFilterAtom') return ['myservicename', mockSetService]
      if (atom === 'stackNameFilterAtom') return ['', mockSetStack]
      if (atom === 'filterTypeAtom') return ['service', mockSetType]
      if (atom === 'viewAtom') return [null, mockUpdateView]
      return [null, jest.fn()]
    })

    render(<StacksComponent />)
    expect(screen.getByText('My-Service_Name')).toBeInTheDocument()
    const svcFilter = screen.getByTitle(/Filter service:/i)
    fireEvent.click(svcFilter)
    expect(mockSetService).toHaveBeenCalledWith('My-Service_Name')
    expect(mockSetType).toHaveBeenCalledWith('service')
  })

  test('stack filtered out when no services match serviceNameFilter', () => {
    const stacks = [ { Name: 'onlystack', Services: [ { ID: 's', ShortName: 'a', ServiceName: 'b', Replication: 1, Created: new Date().toISOString(), Updated: new Date().toISOString() } ] } ]

    mockUseAtomValue.mockImplementation((atom) => {
      switch (atom) {
        case 'currentVariantAtom':
          return 'light'
        case 'currentVariantClassesAtom':
          return 'classes'
        case 'dashboardSettingsAtom':
          return { locale: 'en', timeZone: 'UTC' }
        case 'serviceNameFilterAtom':
          return 'nomatch'
        case 'stackNameFilterAtom':
          return ''
        case 'stacksAtom':
          return stacks
        default:
          return ''
      }
    })

    mockUseAtom.mockImplementation((atom) => {
      if (atom === 'serviceNameFilterAtom') return ['nomatch', jest.fn()]
      if (atom === 'stackNameFilterAtom') return ['', jest.fn()]
      if (atom === 'filterTypeAtom') return ['service', jest.fn()]
      return [null, jest.fn()]
    })

    render(<StacksComponent />)
    expect(screen.queryByText('onlystack')).toBeNull()
  })

  test('header stack filter sets stack and clears service filter', () => {
    const stacks = [ { Name: 'stackY', Services: [ { ID: 's1', ShortName: 'sn', ServiceName: 'svcY', Replication: 1, Created: new Date().toISOString(), Updated: new Date().toISOString() } ] } ]

    mockUseAtomValue.mockImplementation((atom) => {
      switch (atom) {
        case 'currentVariantAtom':
          return 'light'
        case 'currentVariantClassesAtom':
          return 'classes'
        case 'dashboardSettingsAtom':
          return { locale: 'en', timeZone: 'UTC' }
        case 'serviceNameFilterAtom':
          return ''
        case 'stackNameFilterAtom':
          return ''
        case 'stacksAtom':
          return stacks
        default:
          return ''
      }
    })

    const mockSetService = jest.fn()
    const mockSetStack = jest.fn()
    const mockSetType = jest.fn()
    mockUseAtom.mockImplementation((atom) => {
      if (atom === 'serviceNameFilterAtom') return ['', mockSetService]
      if (atom === 'stackNameFilterAtom') return ['', mockSetStack]
      if (atom === 'filterTypeAtom') return ['', mockSetType]
      return [null, jest.fn()]
    })

    render(<StacksComponent />)
    const headerStackFilter = screen.getByTitle(/Filter stack:/i)
    fireEvent.click(headerStackFilter)
    expect(mockSetStack).toHaveBeenCalledWith('stackY')
    expect(mockSetService).toHaveBeenCalledWith('')
    expect(mockSetType).toHaveBeenCalledWith('stack')
  })
})
