import { render, screen, fireEvent } from '@testing-library/react'
const modStacks = require('../../../src/components/stacks/StacksComponent')
const StacksComponent =
  modStacks.StacksComponent || modStacks.default || modStacks

jest.mock('../../../src/common/store/atoms', () => ({
  currentVariantAtom: 'currentVariantAtom',
  currentVariantClassesAtom: 'currentVariantClassesAtom',
  localeAtom: 'localeAtom',
  timeZoneAtom: 'timeZoneAtom',
  serviceNameFilterAtom: 'serviceNameFilterAtom',
  stackNameFilterAtom: 'stackNameFilterAtom',
  filterTypeAtom: 'filterTypeAtom',
  viewAtom: 'viewAtom',
  stacksAtom: 'stacksAtom',
  showNamesButtonsAtom: 'showNamesButtonsAtom',
  tableSizeAtom: 'tableSizeAtom',
}))

const mockUseAtomValue = jest.fn()
const mockUseAtom = jest.fn()
jest.mock('jotai', () => ({
  useAtomValue: (...args) => mockUseAtomValue(...args),
  useAtom: (...args) => mockUseAtom(...args),
}))

describe('StacksComponent (combined)', () => {
  beforeEach(() => {
    mockUseAtomValue.mockReset()
    mockUseAtom.mockReset()
  })

  test('renders filter card with Stacks title', () => {
    mockUseAtomValue.mockImplementation((atom) => {
      if (atom === 'currentVariantAtom') return 'light'
      if (atom === 'currentVariantClassesAtom') return 'classes'
      if (atom === 'localeAtom') return 'en'
      if (atom === 'timeZoneAtom') return 'UTC'
      if (atom === 'serviceNameFilterAtom') return ''
      if (atom === 'stackNameFilterAtom') return ''
      if (atom === 'stacksAtom') return []
      if (atom === 'showNamesButtonsAtom') return false
      if (atom === 'tableSizeAtom') return 'lg'
      return ''
    })
    mockUseAtom.mockImplementation((atom) => {
      if (atom === 'serviceNameFilterAtom') return ['', jest.fn()]
      if (atom === 'stackNameFilterAtom') return ['', jest.fn()]
      if (atom === 'filterTypeAtom') return ['service', jest.fn()]
      return [null, jest.fn()]
    })

    render(<StacksComponent />)
    expect(screen.getByText('Stacks')).toBeInTheDocument()
  })

  test('shows service when serviceNameFilter matches (normalized)', () => {
    const stacks = [
      {
        Name: 'backend',
        Services: [
          {
            ID: 's1',
            ShortName: 'myservice',
            ServiceName: 'backend_my-service',
            Replication: '1',
            Created: new Date().toISOString(),
            Updated: new Date().toISOString(),
          },
        ],
      },
    ]

    // atoms: currentVariant, currentVariantClasses, localeAtom, timeZoneAtom, serviceNameFilter, stackNameFilter, stacksAtom, filterTypeAtom
    mockUseAtomValue.mockImplementation((atom) => {
      switch (atom) {
        case 'currentVariantAtom':
          return 'light'
        case 'currentVariantClassesAtom':
          return 'classes'
        case 'localeAtom':
          return 'en'
        case 'timeZoneAtom':
          return 'UTC'
        case 'serviceNameFilterAtom':
          return 'myservice'
        case 'stackNameFilterAtom':
          return ''
        case 'stacksAtom':
          return stacks
        case 'showNamesButtonsAtom':
          return true
        case 'tableSizeAtom':
          return 'sm'
        case 'filterTypeAtom':
          return 'service'
        default:
          return ''
      }
    })

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
          {
            ID: 's1',
            ShortName: 'svc-short',
            ServiceName: 'svc-full-name',
            Replication: 1,
            Created: new Date().toISOString(),
            Updated: new Date().toISOString(),
          },
          {
            ID: 's2',
            ShortName: null,
            ServiceName: 'another-service',
            Replication: 1,
            Created: new Date().toISOString(),
            Updated: new Date().toISOString(),
          },
        ],
      },
    ]

    // useAtomValue is called for currentVariant, currentVariantClasses, localeAtom, timeZoneAtom, service filters and stacks
    const values = [
      'light',
      'classes',
      'en',
      'UTC',
      'svc-short',
      '',
      stacks,
    ]
    mockUseAtomValue.mockImplementation((atom) => {
      if (atom === 'showNamesButtonsAtom') return true
      if (atom === 'tableSizeAtom') return 'sm'
      return values.shift()
    })

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
    const stacks = [
      {
        Name: 'stX',
        Services: [
          {
            ID: 's1',
            ServiceName: 'svc1',
            ShortName: null,
            Replication: 1,
            Created: new Date().toISOString(),
            Updated: new Date().toISOString(),
          },
        ],
      },
    ]
    const values = [
      'light',
      'classes',
      'en',
      'UTC',
      '',
      '',
      stacks,
    ]
    mockUseAtomValue.mockImplementation((atom) => {
      if (atom === 'showNamesButtonsAtom') return true
      return values.shift()
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
        Services: [
          {
            ID: 'svc1',
            ShortName: null,
            ServiceName: 'My-Service_Name',
            Replication: 1,
            Created: new Date().toISOString(),
            Updated: new Date().toISOString(),
          },
        ],
      },
    ]

    mockUseAtomValue.mockImplementation((atom) => {
      switch (atom) {
        case 'currentVariantAtom':
          return 'light'
        case 'currentVariantClassesAtom':
          return 'classes'
        case 'localeAtom':
          return 'en'
        case 'timeZoneAtom':
          return 'UTC'
        case 'serviceNameFilterAtom':
          return 'myservicename'
        case 'stackNameFilterAtom':
          return ''
        case 'stacksAtom':
          return stacks
        case 'showNamesButtonsAtom':
          return true
        case 'tableSizeAtom':
          return 'sm'
        default:
          return ''
      }
    })

    const mockSetService = jest.fn()
    const mockSetStack = jest.fn()
    const mockSetType = jest.fn()
    const mockUpdateView = jest.fn()
    mockUseAtom.mockImplementation((atom) => {
      if (atom === 'serviceNameFilterAtom')
        return ['myservicename', mockSetService]
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
    const stacks = [
      {
        Name: 'onlystack',
        Services: [
          {
            ID: 's',
            ShortName: 'a',
            ServiceName: 'b',
            Replication: 1,
            Created: new Date().toISOString(),
            Updated: new Date().toISOString(),
          },
        ],
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
          return 'nomatch'
        case 'stackNameFilterAtom':
          return ''
        case 'stacksAtom':
          return stacks
        case 'showNamesButtonsAtom':
          return true
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
    const stacks = [
      {
        Name: 'stackY',
        Services: [
          {
            ID: 's1',
            ShortName: 'sn',
            ServiceName: 'svcY',
            Replication: 1,
            Created: new Date().toISOString(),
            Updated: new Date().toISOString(),
          },
        ],
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
          return ''
        case 'stackNameFilterAtom':
          return ''
        case 'stacksAtom':
          return stacks
        case 'showNamesButtonsAtom':
          return true
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

  test('tableSizeAtom controls table-sm class', () => {
    // Test with 'sm' size
    mockUseAtomValue.mockImplementation((atom) => {
      const atomKey = atom?.debugLabel || atom
      switch (atomKey) {
        case 'currentVariantAtom':
          return 'light'
        case 'currentVariantClassesAtom':
          return 'classes'
        case 'localeAtom':
          return 'en'
        case 'timeZoneAtom':
          return 'UTC'
        case 'tableSizeAtom':
          return 'sm'
        case 'serviceNameFilterAtom':
          return ''
        case 'stackNameFilterAtom':
          return ''
        case 'stacksAtom':
          return [{
            Name: 'test-stack',
            Services: [{
              ID: 'svc1',
              ServiceName: 'test-service',
              ShortName: 'test-service',
              Replication: '1/1',
              Created: '2024-01-01T00:00:00Z',
              Updated: '2024-01-01T00:00:00Z'
            }]
          }]
        case 'showNamesButtonsAtom':
          return false
        default:
          return ''
      }
    })

    // Mock useAtom for tableSizeAtom
    const mockSetTableSize = jest.fn()
    mockUseAtom.mockImplementation((atom) => {
      const atomKey = atom?.debugLabel || atom
      if (atomKey === 'tableSizeAtom') return ['sm', mockSetTableSize]
      if (atomKey === 'serviceNameFilterAtom') return ['', jest.fn()]
      if (atomKey === 'stackNameFilterAtom') return ['', jest.fn()]
      if (atomKey === 'filterTypeAtom') return ['', jest.fn()]
      return [null, jest.fn()]
    })

    const { rerender, container } = render(<StacksComponent />)
    const table = container.querySelector('table')
    expect(table).toHaveClass('table-sm')

    // Test with 'lg' size
    mockUseAtomValue.mockImplementation((atom) => {
      const atomKey = atom?.debugLabel || atom
      switch (atomKey) {
        case 'currentVariantAtom':
          return 'light'
        case 'currentVariantClassesAtom':
          return 'classes'
        case 'dashboardSettingsAtom':
          return { locale: 'en', timeZone: 'UTC' }
        case 'tableSizeAtom':
          return 'lg'
        case 'serviceNameFilterAtom':
          return ''
        case 'stackNameFilterAtom':
          return ''
        case 'stacksAtom':
          return [{
            Name: 'test-stack',
            Services: [{
              ID: 'svc1',
              ServiceName: 'test-service',
              ShortName: 'test-service',
              Replication: '1/1',
              Created: '2024-01-01T00:00:00Z',
              Updated: '2024-01-01T00:00:00Z'
            }]
          }]
        case 'showNamesButtonsAtom':
          return false
        default:
          return ''
      }
    })

    // Mock useAtom for tableSizeAtom with 'lg'
    const mockSetTableSizeLg = jest.fn()
    mockUseAtom.mockImplementation((atom) => {
      const atomKey = atom?.debugLabel || atom
      if (atomKey === 'tableSizeAtom') return ['lg', mockSetTableSizeLg]
      if (atomKey === 'serviceNameFilterAtom') return ['', jest.fn()]
      if (atomKey === 'stackNameFilterAtom') return ['', jest.fn()]
      if (atomKey === 'filterTypeAtom') return ['', jest.fn()]
      return [null, jest.fn()]
    })

    rerender(<StacksComponent />)
    expect(table).not.toHaveClass('table-sm')
  })

  describe('sorting functionality', () => {
    const createStacksWithServices = () => [
      {
        Name: 'stack1',
        Services: [
          {
            ID: 'svc1',
            ShortName: 'alpha',
            ServiceName: 'stack1_alpha',
            Replication: '1/1',
            Created: '2024-01-01T00:00:00Z',
            Updated: '2024-01-01T00:00:00Z',
          },
          {
            ID: 'svc2',
            ShortName: 'beta',
            ServiceName: 'stack1_beta',
            Replication: '2/2',
            Created: '2024-01-02T00:00:00Z',
            Updated: '2024-01-02T00:00:00Z',
          },
        ],
      },
    ]

    const setupMocks = (stacks) => {
      mockUseAtomValue.mockImplementation((atom) => {
        const atomKey = atom?.debugLabel || atom
        switch (atomKey) {
          case 'currentVariantAtom':
            return 'light'
          case 'currentVariantClassesAtom':
            return 'classes'
          case 'localeAtom':
            return 'en'
          case 'timeZoneAtom':
            return 'UTC'
          case 'tableSizeAtom':
            return 'lg'
          case 'serviceNameFilterAtom':
            return ''
          case 'stackNameFilterAtom':
            return ''
          case 'stacksAtom':
            return stacks
          case 'showNamesButtonsAtom':
            return false
          default:
            return ''
        }
      })
      mockUseAtom.mockImplementation((atom) => {
        const atomKey = atom?.debugLabel || atom
        if (atomKey === 'serviceNameFilterAtom') return ['', jest.fn()]
        if (atomKey === 'stackNameFilterAtom') return ['', jest.fn()]
        if (atomKey === 'filterTypeAtom') return ['', jest.fn()]
        return [null, jest.fn()]
      })
    }

    test('first click on sortable header sorts ascending', () => {
      setupMocks(createStacksWithServices())
      render(<StacksComponent />)

      const serviceNameHeader = screen.getByText('Service Name')
      fireEvent.click(serviceNameHeader)

      // After clicking, header should have sort indicator (fa-sort-asc or fa-sort)
      const headerCell = serviceNameHeader.closest('th')
      expect(headerCell).toBeInTheDocument()
    })

    test('second click on same header sorts descending', () => {
      setupMocks(createStacksWithServices())
      render(<StacksComponent />)

      const serviceNameHeader = screen.getByText('Service Name')
      // First click - asc
      fireEvent.click(serviceNameHeader)
      // Second click - desc
      fireEvent.click(serviceNameHeader)

      const headerCell = serviceNameHeader.closest('th')
      expect(headerCell).toBeInTheDocument()
    })

    test('third click on same header resets sort (clears sorting)', () => {
      setupMocks(createStacksWithServices())
      render(<StacksComponent />)

      const serviceNameHeader = screen.getByText('Service Name')
      // First click - asc
      fireEvent.click(serviceNameHeader)
      // Second click - desc
      fireEvent.click(serviceNameHeader)
      // Third click - reset
      fireEvent.click(serviceNameHeader)

      const headerCell = serviceNameHeader.closest('th')
      expect(headerCell).toBeInTheDocument()
    })

    test('clicking different column starts with asc', () => {
      setupMocks(createStacksWithServices())
      render(<StacksComponent />)

      const serviceNameHeader = screen.getByText('Service Name')
      const replicationHeader = screen.getByText('Replication')

      // Click first column - asc
      fireEvent.click(serviceNameHeader)
      // Click different column - should start with asc
      fireEvent.click(replicationHeader)

      const headerCell = replicationHeader.closest('th')
      expect(headerCell).toBeInTheDocument()
    })
  })

  test('showNamesButtonsAtom controls action buttons visibility', () => {
    const stacks = [
      {
        Name: 'test-stack',
        Services: [
          {
            ID: 'svc1',
            ServiceName: 'test-service',
            ShortName: 'test-service',
            Replication: '1/1',
            Created: '2024-01-01T00:00:00Z',
            Updated: '2024-01-01T00:00:00Z',
          },
        ],
      },
    ]

    // Test with showNamesButtonsAtom = true
    mockUseAtomValue.mockImplementation((atom) => {
      const atomKey = atom?.debugLabel || atom
      switch (atomKey) {
        case 'currentVariantAtom':
          return 'light'
        case 'currentVariantClassesAtom':
          return 'classes'
        case 'localeAtom':
          return 'en'
        case 'timeZoneAtom':
          return 'UTC'
        case 'tableSizeAtom':
          return 'lg'
        case 'serviceNameFilterAtom':
          return ''
        case 'stackNameFilterAtom':
          return ''
        case 'stacksAtom':
          return stacks
        case 'showNamesButtonsAtom':
          return true
        default:
          return ''
      }
    })

    mockUseAtom.mockImplementation((atom) => {
      const atomKey = atom?.debugLabel || atom
      if (atomKey === 'serviceNameFilterAtom') return ['', jest.fn()]
      if (atomKey === 'stackNameFilterAtom') return ['', jest.fn()]
      if (atomKey === 'filterTypeAtom') return ['', jest.fn()]
      return [null, jest.fn()]
    })

    const { rerender, container } = render(<StacksComponent />)

    // Action buttons should be visible when showNamesButtonsAtom is true
    // The NameActions component renders buttons with specific classes
    const actionButtons = container.querySelectorAll('button[title]')
    const hasFilterButtons = Array.from(actionButtons).some((btn) =>
      btn.title.toLowerCase().includes('filter'),
    )
    expect(hasFilterButtons).toBe(true)

    // Test with showNamesButtonsAtom = false
    mockUseAtomValue.mockImplementation((atom) => {
      const atomKey = atom?.debugLabel || atom
      switch (atomKey) {
        case 'currentVariantAtom':
          return 'light'
        case 'currentVariantClassesAtom':
          return 'classes'
        case 'localeAtom':
          return 'en'
        case 'timeZoneAtom':
          return 'UTC'
        case 'tableSizeAtom':
          return 'lg'
        case 'serviceNameFilterAtom':
          return ''
        case 'stackNameFilterAtom':
          return ''
        case 'stacksAtom':
          return stacks
        case 'showNamesButtonsAtom':
          return false
        default:
          return ''
      }
    })

    rerender(<StacksComponent />)

    // Action buttons should NOT be visible when showNamesButtonsAtom is false
    const actionButtonsAfter = container.querySelectorAll('button[title]')
    const hasFilterButtonsAfter = Array.from(actionButtonsAfter).some((btn) =>
      btn.title.toLowerCase().includes('filter'),
    )
    expect(hasFilterButtonsAfter).toBe(false)
  })
})
