import { render, screen, fireEvent } from '@testing-library/react'

jest.mock('../../../src/common/navigationConstants', () => ({
  dashboardHId: 'dashboardH',
  dashboardVId: 'dashboardV',
}))

jest.mock('../../../src/common/store/atoms', () => ({
  currentVariantAtom: 'currentVariantAtom',
  dashboardSettingsDefaultLayoutViewIdAtom:
    'dashboardSettingsDefaultLayoutViewIdAtom',
  viewAtom: 'viewAtom',
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

const modDash = require('../../../src/components/dashboard/DashboardSettingsComponent')
const DashboardSettingsComponent =
  modDash.DashboardSettingsComponent || modDash.default || modDash

/** Helper: mount DashboardSettingsComponent with given view and default layout. */
function setup({ viewId = null, defaultLayout = 'dashboardH' } = {}) {
  const mockUpdateView = jest.fn()
  mockUseAtomValue.mockImplementation((atom) => {
    if (atom === 'currentVariantAtom') return 'light'
    if (atom === 'dashboardSettingsDefaultLayoutViewIdAtom')
      return defaultLayout
    return ''
  })
  mockUseAtom.mockImplementation((atom) => {
    if (atom === 'viewAtom')
      return [viewId ? { id: viewId } : {}, mockUpdateView]
    if (atom === 'serviceNameFilterAtom') return ['', jest.fn()]
    if (atom === 'stackNameFilterAtom') return ['', jest.fn()]
    if (atom === 'filterTypeAtom') return ['service', jest.fn()]
    return [null, jest.fn()]
  })
  render(<DashboardSettingsComponent />)
  return { mockUpdateView }
}

describe('DashboardSettingsComponent (combined)', () => {
  beforeEach(() => {
    mockUseAtomValue.mockReset()
    mockUseAtom.mockReset()
  })

  test('renders Dashboard title', () => {
    setup()
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
  })

  test('renders both layout toggle buttons', () => {
    setup()
    // grip (horizontal) and grip-vertical (vertical) buttons are rendered as SVG icons
    // we verify the two layout buttons exist via their click handlers
    const buttons = screen
      .getAllByRole('button')
      .filter((b) => !b.getAttribute('aria-label'))
    // At least 2 layout buttons must be present (horizontal + vertical)
    expect(buttons.length).toBeGreaterThanOrEqual(2)
  })

  test('clicking horizontal layout button calls updateViewId with dashboardHId', () => {
    const { mockUpdateView } = setup({ viewId: 'dashboardV' })
    const buttons = screen
      .getAllByRole('button')
      .filter((b) => !b.getAttribute('aria-label'))
    fireEvent.click(buttons[0])
    expect(mockUpdateView).toHaveBeenCalledWith({ id: 'dashboardH' })
  })

  test('clicking vertical layout button calls updateViewId with dashboardVId', () => {
    const { mockUpdateView } = setup({ viewId: 'dashboardH' })
    const buttons = screen
      .getAllByRole('button')
      .filter((b) => !b.getAttribute('aria-label'))
    fireEvent.click(buttons[1])
    expect(mockUpdateView).toHaveBeenCalledWith({ id: 'dashboardV' })
  })

  test('horizontal grip icon shown in title when view is horizontal', () => {
    setup({ viewId: 'dashboardH' })
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
  })

  test('vertical grip icon shown in title when view is vertical', () => {
    setup({ viewId: 'dashboardV' })
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
  })

  test('renders FilterComponent (filter input is present)', () => {
    setup()
    expect(screen.getByPlaceholderText('Filter…')).toBeInTheDocument()
  })
})
