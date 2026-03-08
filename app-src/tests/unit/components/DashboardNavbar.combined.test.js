// Combined tests for DashboardNavbar
// Verifies that showNavLabelsAtom, maxContentWidthAtom, and currentVariantAtom
// (driven by isDarkModeAtom) correctly affect the rendered output.
import { render, screen } from '@testing-library/react'

jest.mock('../../../src/common/store/atoms', () => ({
  currentVariantAtom: 'currentVariantAtom',
  dashboardSettingsAtom: 'dashboardSettingsAtom',
  dashboardSettingsDefaultLayoutViewIdAtom: 'dashboardSettingsDefaultLayoutViewIdAtom',
  logsConfigAtom: 'logsConfigAtom',
  logsShowLogsAtom: 'logsShowLogsAtom',
  maxContentWidthAtom: 'maxContentWidthAtom',
  refreshIntervalAtom: 'refreshIntervalAtom',
  showNavLabelsAtom: 'showNavLabelsAtom',
  versionAtom: 'versionAtom',
  versionRefreshAtom: 'versionRefreshAtom',
  viewAtom: 'viewAtom',
}))

const mockUseAtomValue = jest.fn()
const mockUseAtom = jest.fn()
jest.mock('jotai', () => ({
  useAtomValue: (...args) => mockUseAtomValue(...args),
  useAtom: (...args) => mockUseAtom(...args),
}))

jest.mock('../../../src/common/store/reducers', () => ({
  RefreshIntervalToggleReducer: () => null,
}))

jest.mock('../../../src/common/navigationConstants', () => ({
  aboutId: 'about',
  dashboardHId: 'dashboardH',
  logsId: 'logs',
  nodesId: 'nodes',
  portsId: 'ports',
  settingsId: 'settings',
  stacksId: 'stacks',
  tasksId: 'tasks',
  timelineId: 'timeline',
  versionUpdateId: 'versionUpdate',
}))

jest.mock('@fortawesome/react-fontawesome', () => ({
  FontAwesomeIcon: () => null,
}))
jest.mock('@fortawesome/fontawesome-svg-core', () => ({
  library: { add: () => {} },
}))
jest.mock('@fortawesome/free-solid-svg-icons', () => ({}))

const modNav = require('../../../src/components/layout/DashboardNavbar')
const DashboardNavbar = modNav.DashboardNavbar || modNav.default || modNav

/**
 * Mount DashboardNavbar with controllable setting atoms.
 *
 * @param {object} [opts]
 * @param {'fluid'|'centered'} [opts.maxContentWidth='fluid']
 * @param {boolean} [opts.showNavLabels=false]
 * @param {string} [opts.currentVariant='light']
 * @returns {{ container: HTMLElement }}
 */
function setup({ maxContentWidth = 'fluid', showNavLabels = false, currentVariant = 'light' } = {}) {
  mockUseAtomValue.mockImplementation((atom) => {
    if (atom === 'currentVariantAtom') return currentVariant
    if (atom === 'maxContentWidthAtom') return maxContentWidth
    if (atom === 'showNavLabelsAtom') return showNavLabels
    if (atom === 'versionAtom') return { version: '1.0.0', updateAvailable: false }
    if (atom === 'logsShowLogsAtom') return false
    if (atom === 'logsConfigAtom') return { follow: false }
    if (atom === 'dashboardSettingsAtom') return { showLogsButton: false, versionCheckEnabled: false }
    if (atom === 'dashboardSettingsDefaultLayoutViewIdAtom') return 'dashboardH'
    return null
  })
  mockUseAtom.mockImplementation((atom) => {
    if (atom === 'refreshIntervalAtom') return [null, jest.fn()]
    if (atom === 'viewAtom') return [{ id: 'dashboardH' }, jest.fn()]
    if (atom === 'versionRefreshAtom') return [0, jest.fn()]
    return [null, jest.fn()]
  })
  return render(<DashboardNavbar />)
}

describe('DashboardNavbar (combined)', () => {
  beforeEach(() => {
    mockUseAtomValue.mockReset()
    mockUseAtom.mockReset()
  })

  test('renders navbar with accessible nav links', () => {
    setup()
    expect(screen.getByRole('button', { name: 'Dashboard' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Stacks' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Nodes' })).toBeInTheDocument()
  })

  // ---- showNavLabelsAtom effect ----

  test('nav link text labels are visible when showNavLabels is true', () => {
    setup({ showNavLabels: true })
    // The nav links render "{showNavLabels && ' Timeline'}" etc. — text content is non-empty
    const timelineLink = screen.getByRole('button', { name: 'Timeline' })
    expect(timelineLink.textContent.trim()).toContain('Timeline')
    const stacksLink = screen.getByRole('button', { name: 'Stacks' })
    expect(stacksLink.textContent.trim()).toContain('Stacks')
    const nodesLink = screen.getByRole('button', { name: 'Nodes' })
    expect(nodesLink.textContent.trim()).toContain('Nodes')
  })

  test('nav link text labels are hidden when showNavLabels is false', () => {
    setup({ showNavLabels: false })
    // Icons render as null (mocked FontAwesomeIcon), so text content is empty
    const timelineLink = screen.getByRole('button', { name: 'Timeline' })
    expect(timelineLink.textContent.trim()).toBe('')
    const stacksLink = screen.getByRole('button', { name: 'Stacks' })
    expect(stacksLink.textContent.trim()).toBe('')
    const nodesLink = screen.getByRole('button', { name: 'Nodes' })
    expect(nodesLink.textContent.trim()).toBe('')
  })

  // ---- maxContentWidthAtom effect ----

  test('navbar uses container-fluid when maxContentWidth is fluid', () => {
    const { container } = setup({ maxContentWidth: 'fluid' })
    expect(container.querySelector('.container-fluid')).toBeTruthy()
  })

  test('navbar uses fixed container when maxContentWidth is centered', () => {
    const { container } = setup({ maxContentWidth: 'centered' })
    expect(container.querySelector('.container-fluid')).toBeNull()
    expect(container.querySelector('.container')).toBeTruthy()
  })

  // ---- isDarkModeAtom effect (via currentVariantAtom) ----

  test('navbar has dark background class when currentVariantAtom is dark', () => {
    const { container } = setup({ currentVariant: 'dark' })
    const nav = container.querySelector('nav')
    expect(nav.className).toContain('bg-dark')
  })

  test('navbar has light background class when currentVariantAtom is light', () => {
    const { container } = setup({ currentVariant: 'light' })
    const nav = container.querySelector('nav')
    expect(nav.className).toContain('bg-light')
  })
})
