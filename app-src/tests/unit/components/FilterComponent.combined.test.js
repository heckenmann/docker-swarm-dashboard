import { render, screen, fireEvent } from '@testing-library/react'
const modFilter = require('../../../src/components/shared/FilterComponent')
const FilterComponent =
  modFilter.FilterComponent || modFilter.default || modFilter

// mock atoms module
jest.mock('../../../src/common/store/atoms', () => ({
  currentVariantAtom: 'currentVariantAtom',
  serviceNameFilterAtom: 'serviceNameFilterAtom',
  stackNameFilterAtom: 'stackNameFilterAtom',
  filterTypeAtom: 'filterTypeAtom',
}))

const mockUseAtomValue = jest.fn()
const mockUseAtom = jest.fn()
jest.mock('jotai', () => ({
  useAtomValue: (...args) => mockUseAtomValue(...args),
  useAtom: (...args) => mockUseAtom(...args),
}))

/** Helper: mount FilterComponent with the given atom values. */
function setupFilter({
  serviceFilter = '',
  stackFilter = '',
  filterType = 'service',
} = {}) {
  mockUseAtomValue.mockImplementation((atom) => {
    if (atom === 'currentVariantAtom') return 'light'
    return ''
  })

  const mockSetService = jest.fn()
  const mockSetStack = jest.fn()
  const mockSetType = jest.fn()
  mockUseAtom.mockImplementation((atom) => {
    if (atom === 'serviceNameFilterAtom') return [serviceFilter, mockSetService]
    if (atom === 'stackNameFilterAtom') return [stackFilter, mockSetStack]
    if (atom === 'filterTypeAtom') return [filterType, mockSetType]
    return [null, jest.fn()]
  })

  render(<FilterComponent />)
  return { mockSetService, mockSetStack, mockSetType }
}

describe('FilterComponent (combined)', () => {
  beforeEach(() => {
    mockUseAtomValue.mockReset()
    mockUseAtom.mockReset()
  })

  test('renders default with no filters: Service button active, input empty, clear not rendered', () => {
    setupFilter()

    expect(
      screen.getByRole('button', { name: /filter by service/i }),
    ).toHaveAttribute('aria-pressed', 'true')
    expect(
      screen.getByRole('button', { name: /filter by stack/i }),
    ).toHaveAttribute('aria-pressed', 'false')

    const input = screen.getByPlaceholderText('Filter…')
    expect(input.value).toBe('')

    expect(
      screen.queryByRole('button', { name: /clear filter/i }),
    ).not.toBeInTheDocument()
  })

  test('typing in input calls setServiceNameFilter when filter type is service', () => {
    const { mockSetService } = setupFilter()

    const input = screen.getByPlaceholderText('Filter…')
    fireEvent.change(input, { target: { value: 'svc1' } })
    expect(mockSetService).toHaveBeenCalledWith('svc1')
  })

  test('clicking Stack button clears service filter and sets stack filter', () => {
    const { mockSetService, mockSetStack, mockSetType } = setupFilter({
      serviceFilter: 'svcX',
      filterType: 'service',
    })

    fireEvent.click(screen.getByRole('button', { name: /filter by stack/i }))
    expect(mockSetType).toHaveBeenCalledWith('stack')
    expect(mockSetService).toHaveBeenCalledWith('')
    expect(mockSetStack).toHaveBeenCalledWith('svcX')
  })

  test('clear button is rendered and enabled when filter is active, clicking it clears filters', () => {
    const { mockSetService, mockSetStack } = setupFilter({
      serviceFilter: 'svcX',
      filterType: 'service',
    })

    const clearBtn = screen.getByRole('button', { name: /clear filter/i })
    expect(clearBtn).toBeInTheDocument()
    expect(clearBtn).toBeEnabled()
    fireEvent.click(clearBtn)
    expect(mockSetService).toHaveBeenCalledWith('')
    expect(mockSetStack).toHaveBeenCalledWith('')
  })

  test('Stack button has aria-pressed true when filterType is stack', () => {
    setupFilter({ filterType: 'stack' })

    expect(
      screen.getByRole('button', { name: /filter by stack/i }),
    ).toHaveAttribute('aria-pressed', 'true')
    expect(
      screen.getByRole('button', { name: /filter by service/i }),
    ).toHaveAttribute('aria-pressed', 'false')
  })

  test('shows programmatic service filter value in input, clear button rendered', () => {
    setupFilter({ serviceFilter: 'svcA', filterType: 'service' })

    const input = screen.getByPlaceholderText('Filter…')
    expect(input.value).toBe('svcA')

    expect(
      screen.getByRole('button', { name: /clear filter/i }),
    ).toBeInTheDocument()
  })

  test('clear button calls setter when clicked while filter active', () => {
    const { mockSetService } = setupFilter({
      serviceFilter: 'svcA',
      filterType: 'service',
    })

    const clearBtn = screen.getByRole('button', { name: /clear filter/i })
    fireEvent.click(clearBtn)
    expect(mockSetService).toHaveBeenCalledWith('')
  })

  test('entering value with stack type sets stack filter and clears service', () => {
    const { mockSetService, mockSetStack } = setupFilter({ filterType: 'stack' })

    const input = screen.getByRole('textbox')
    fireEvent.change(input, { target: { value: 'myStack' } })
    expect(mockSetStack).toHaveBeenCalledWith('myStack')
    expect(mockSetService).toHaveBeenCalledWith('')
  })

  test('clearing value does not reset filterType to service', () => {
    // Start with Stack selected and a filter value
    const { mockSetType } = setupFilter({
      stackFilter: 'myStack',
      filterType: 'stack',
    })

    // Reset after mount-time useEffect calls (effect syncs type during initial render)
    mockSetType.mockClear()

    // Clear the filter value via the clear button
    const clearBtn = screen.getByRole('button', { name: /clear filter/i })
    fireEvent.click(clearBtn)

    // setFilterType must NOT have been called during the clear interaction
    expect(mockSetType).not.toHaveBeenCalled()
  })
})
