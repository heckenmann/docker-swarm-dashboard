/**
 * Unit tests for SettingsComponent.
 *
 * Covers:
 * - All setting rows are rendered.
 * - "Centered layout" switch is unchecked when maxContentWidth is 'fluid' (default).
 * - "Centered layout" switch is checked when maxContentWidth is 'centered'.
 * - Toggling the switch calls the setter with the opposite value.
 * - Reset to defaults calls all setters with their default values.
 */

import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'

jest.mock('../../../src/common/store/atoms', () => ({
  baseUrlAtom: 'baseUrlAtom',
  currentVariantAtom: 'currentVariantAtom',
  currentVariantClassesAtom: 'currentVariantClassesAtom',
  isDarkModeAtom: 'isDarkModeAtom',
  maxContentWidthAtom: 'maxContentWidthAtom',
  refreshIntervalAtom: 'refreshIntervalAtom',
  showNavLabelsAtom: 'showNavLabelsAtom',
  tableSizeAtom: 'tableSizeAtom',
  showNamesButtonsAtom: 'showNamesButtonsAtom',
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

jest.mock('@fortawesome/react-fontawesome', () => ({
  FontAwesomeIcon: () => null,
}))
jest.mock('@fortawesome/fontawesome-svg-core', () => ({
  library: { add: () => {} },
}))
jest.mock('@fortawesome/free-solid-svg-icons', () => ({}))

const { SettingsComponent } =
  require('../../../src/components/settings/SettingsComponent')

/**
 * Set up all atom mocks for a SettingsComponent render.
 *
 * @param {object} overrides - atom values to override
 */
function setup(overrides = {}) {

  const defaults = {
    baseUrl: 'http://localhost:3001/',
    isDarkMode: false,
    tableSize: 'sm',
    showNamesButtons: true,
    showNavLabels: false,
    maxContentWidth: 'fluid',
    refreshInterval: false,
  }
  const vals = { ...defaults, ...overrides }

  mockUseAtomValue.mockImplementation((atom) => {
    if (atom === 'currentVariantAtom') return 'light'
    if (atom === 'currentVariantClassesAtom') return ''
    return null
  })

  mockUseAtom.mockImplementation((atom) => {
    if (atom === 'baseUrlAtom') return [vals.baseUrl, jest.fn()]
    if (atom === 'isDarkModeAtom') return [vals.isDarkMode, jest.fn()]
    if (atom === 'tableSizeAtom') return [vals.tableSize, jest.fn()]
    if (atom === 'showNamesButtonsAtom') return [vals.showNamesButtons, jest.fn()]
    if (atom === 'showNavLabelsAtom') return [vals.showNavLabels, jest.fn()]
    if (atom === 'maxContentWidthAtom') return [vals.maxContentWidth, jest.fn()]
    if (atom === 'refreshIntervalAtom') return [vals.refreshInterval, jest.fn()]
    return [null, jest.fn()]
  })
}

/**
 * Set up mocks for a toggle/change test, returning the setter mock for one
 * specific atom so the test can assert it was called correctly.
 *
 * @param {string} atomName - The atom identifier to expose the setter for.
 * @param {*} value - The current value for the atom under test.
 * @returns {jest.Mock} The setter mock for the atom under test.
 */
function setupAtomToggle(atomName, value) {
  const mockSet = jest.fn()
  const atomDefaults = {
    baseUrlAtom: ['http://localhost:3001/', jest.fn()],
    isDarkModeAtom: [false, jest.fn()],
    tableSizeAtom: ['sm', jest.fn()],
    showNamesButtonsAtom: [true, jest.fn()],
    showNavLabelsAtom: [false, jest.fn()],
    maxContentWidthAtom: ['fluid', jest.fn()],
    refreshIntervalAtom: [false, jest.fn()],
  }
  atomDefaults[atomName] = [value, mockSet]
  mockUseAtomValue.mockImplementation((atom) => {
    if (atom === 'currentVariantAtom') return 'light'
    if (atom === 'currentVariantClassesAtom') return ''
    return null
  })
  mockUseAtom.mockImplementation((atom) => atomDefaults[atom] || [null, jest.fn()])
  return mockSet
}

beforeEach(() => {
  mockUseAtomValue.mockReset()
  mockUseAtom.mockReset()
})

test('renders all expected setting rows', () => {
  setup()
  render(<SettingsComponent />)

  expect(screen.getByText('API URL')).toBeInTheDocument()
  expect(screen.getByText(/Interval Refresh/)).toBeInTheDocument()
  expect(screen.getByText('Dark Mode')).toBeInTheDocument()
  expect(screen.getByText('Small tables')).toBeInTheDocument()
  expect(screen.getByText('Show buttons in Names')).toBeInTheDocument()
  expect(screen.getByText('Centered layout')).toBeInTheDocument()
  expect(screen.getByText('Show navigation labels')).toBeInTheDocument()
})

test('centered layout switch is unchecked when maxContentWidth is fluid', () => {
  setup({ maxContentWidth: 'fluid' })
  render(<SettingsComponent />)

  const toggle = screen.getByRole('checkbox', {
    name: 'Toggle centered content width',
  })
  expect(toggle).not.toBeChecked()
})

test('centered layout switch is checked when maxContentWidth is centered', () => {
  setup({ maxContentWidth: 'centered' })
  render(<SettingsComponent />)

  const toggle = screen.getByRole('checkbox', {
    name: 'Toggle centered content width',
  })
  expect(toggle).toBeChecked()
})

test('toggling centered layout switch calls setter with centered when currently fluid', () => {
  const mockSet = jest.fn()
  setup({ maxContentWidth: 'fluid' })
  mockUseAtom.mockImplementation((atom) => {
    if (atom === 'maxContentWidthAtom') return ['fluid', mockSet]
    if (atom === 'baseUrlAtom') return ['http://localhost/', jest.fn()]
    if (atom === 'isDarkModeAtom') return [false, jest.fn()]
    if (atom === 'tableSizeAtom') return ['sm', jest.fn()]
    if (atom === 'showNamesButtonsAtom') return [true, jest.fn()]
    if (atom === 'refreshIntervalAtom') return [false, jest.fn()]
    return [null, jest.fn()]
  })
  render(<SettingsComponent />)

  const toggle = screen.getByRole('checkbox', {
    name: 'Toggle centered content width',
  })
  fireEvent.click(toggle)

  expect(mockSet).toHaveBeenCalledWith('centered')
})

test('toggling centered layout switch calls setter with fluid when currently centered', () => {
  const mockSet = jest.fn()
  setup({ maxContentWidth: 'centered' })
  mockUseAtom.mockImplementation((atom) => {
    if (atom === 'maxContentWidthAtom') return ['centered', mockSet]
    if (atom === 'baseUrlAtom') return ['http://localhost/', jest.fn()]
    if (atom === 'isDarkModeAtom') return [false, jest.fn()]
    if (atom === 'tableSizeAtom') return ['sm', jest.fn()]
    if (atom === 'showNamesButtonsAtom') return [true, jest.fn()]
    if (atom === 'refreshIntervalAtom') return [false, jest.fn()]
    return [null, jest.fn()]
  })
  render(<SettingsComponent />)

  const toggle = screen.getByRole('checkbox', {
    name: 'Toggle centered content width',
  })
  fireEvent.click(toggle)

  expect(mockSet).toHaveBeenCalledWith('fluid')
})

test('reset to defaults calls all setters with default values', () => {
  const setMaxContentWidth = jest.fn()
  const setIsDarkMode = jest.fn()
  const setTableSize = jest.fn()
  const setShowNamesButtons = jest.fn()
  const setShowNavLabels = jest.fn()
  const setBaseUrl = jest.fn()

  mockUseAtomValue.mockImplementation((atom) => {
    if (atom === 'currentVariantAtom') return 'light'
    if (atom === 'currentVariantClassesAtom') return ''
    return null
  })
  mockUseAtom.mockImplementation((atom) => {
    if (atom === 'maxContentWidthAtom') return ['centered', setMaxContentWidth]
    if (atom === 'isDarkModeAtom') return [true, setIsDarkMode]
    if (atom === 'tableSizeAtom') return ['lg', setTableSize]
    if (atom === 'showNamesButtonsAtom') return [false, setShowNamesButtons]
    if (atom === 'showNavLabelsAtom') return [false, setShowNavLabels]
    if (atom === 'baseUrlAtom') return ['http://custom/', setBaseUrl]
    if (atom === 'refreshIntervalAtom') return [true, jest.fn()]
    return [null, jest.fn()]
  })

  render(<SettingsComponent />)
  fireEvent.click(screen.getByRole('button', { name: /reset settings to defaults/i }))

  expect(setIsDarkMode).toHaveBeenCalledWith(false)
  expect(setTableSize).toHaveBeenCalledWith('sm')
  expect(setShowNamesButtons).toHaveBeenCalledWith(true)
  expect(setShowNavLabels).toHaveBeenCalledWith(false)
  expect(setMaxContentWidth).toHaveBeenCalledWith('fluid')
  // computeDefaultBase() falls back to window.location.pathname which is '/' in jsdom
  expect(setBaseUrl).toHaveBeenCalledWith('/')
})

test('showNavLabels switch is unchecked by default', () => {
  setup()
  render(<SettingsComponent />)

  const toggle = screen.getByRole('checkbox', {
    name: 'Toggle navigation labels',
  })
  expect(toggle).not.toBeChecked()
})

test('toggling showNavLabels switch calls setter with false when currently true', () => {
  const mockSet = jest.fn()
  mockUseAtomValue.mockImplementation((atom) => {
    if (atom === 'currentVariantAtom') return 'light'
    if (atom === 'currentVariantClassesAtom') return ''
    return null
  })
  mockUseAtom.mockImplementation((atom) => {
    if (atom === 'showNavLabelsAtom') return [true, mockSet]
    if (atom === 'baseUrlAtom') return ['http://localhost/', jest.fn()]
    if (atom === 'isDarkModeAtom') return [false, jest.fn()]
    if (atom === 'tableSizeAtom') return ['sm', jest.fn()]
    if (atom === 'showNamesButtonsAtom') return [true, jest.fn()]
    if (atom === 'maxContentWidthAtom') return ['fluid', jest.fn()]
    if (atom === 'refreshIntervalAtom') return [false, jest.fn()]
    return [null, jest.fn()]
  })
  render(<SettingsComponent />)

  const toggle = screen.getByRole('checkbox', {
    name: 'Toggle navigation labels',
  })
  fireEvent.click(toggle)

  expect(mockSet).toHaveBeenCalledWith(false)
})

test('toggling showNavLabels switch calls setter with true when currently false', () => {
  const mockSet = setupAtomToggle('showNavLabelsAtom', false)
  render(<SettingsComponent />)

  const toggle = screen.getByRole('checkbox', { name: 'Toggle navigation labels' })
  fireEvent.click(toggle)

  expect(mockSet).toHaveBeenCalledWith(true)
})

test('showNavLabels switch is checked when showNavLabels is true', () => {
  setup({ showNavLabels: true })
  render(<SettingsComponent />)

  const toggle = screen.getByRole('checkbox', { name: 'Toggle navigation labels' })
  expect(toggle).toBeChecked()
})

// ---- API URL ----

test('API URL input renders with current baseUrl value', () => {
  setup({ baseUrl: 'http://myhost:8080/' })
  render(<SettingsComponent />)

  const input = screen.getByRole('textbox', { name: 'API URL' })
  expect(input).toHaveValue('http://myhost:8080/')
})

test('API URL onChange appends trailing slash when missing', () => {
  const mockSet = setupAtomToggle('baseUrlAtom', 'http://localhost:3001/')
  render(<SettingsComponent />)

  const input = screen.getByRole('textbox', { name: 'API URL' })
  fireEvent.change(input, { target: { value: 'http://newhost' } })

  expect(mockSet).toHaveBeenCalledWith('http://newhost/')
})

test('API URL onChange preserves existing trailing slash', () => {
  const mockSet = setupAtomToggle('baseUrlAtom', 'http://localhost:3001/')
  render(<SettingsComponent />)

  const input = screen.getByRole('textbox', { name: 'API URL' })
  fireEvent.change(input, { target: { value: 'http://newhost/' } })

  expect(mockSet).toHaveBeenCalledWith('http://newhost/')
})

// ---- Interval Refresh ----

test('interval refresh switch is unchecked when refreshInterval is false', () => {
  setup({ refreshInterval: false })
  render(<SettingsComponent />)

  const toggle = screen.getByRole('checkbox', { name: 'Toggle auto refresh' })
  expect(toggle).not.toBeChecked()
})

test('interval refresh switch is checked when refreshInterval is true', () => {
  setup({ refreshInterval: true })
  render(<SettingsComponent />)

  const toggle = screen.getByRole('checkbox', { name: 'Toggle auto refresh' })
  expect(toggle).toBeChecked()
})

test('toggling interval refresh switch calls the toggle function', () => {
  const mockToggle = setupAtomToggle('refreshIntervalAtom', false)
  render(<SettingsComponent />)

  const toggle = screen.getByRole('checkbox', { name: 'Toggle auto refresh' })
  fireEvent.click(toggle)

  expect(mockToggle).toHaveBeenCalled()
})

// ---- Dark Mode ----

test('dark mode switch is unchecked when isDarkMode is false', () => {
  setup({ isDarkMode: false })
  render(<SettingsComponent />)

  const toggle = screen.getByRole('checkbox', { name: 'Toggle dark mode' })
  expect(toggle).not.toBeChecked()
})

test('dark mode switch is checked when isDarkMode is true', () => {
  setup({ isDarkMode: true })
  render(<SettingsComponent />)

  const toggle = screen.getByRole('checkbox', { name: 'Toggle dark mode' })
  expect(toggle).toBeChecked()
})

test('toggling dark mode switch calls setter with true when currently false', () => {
  const mockSet = setupAtomToggle('isDarkModeAtom', false)
  render(<SettingsComponent />)

  const toggle = screen.getByRole('checkbox', { name: 'Toggle dark mode' })
  fireEvent.click(toggle)

  expect(mockSet).toHaveBeenCalledWith(true)
})

test('toggling dark mode switch calls setter with false when currently true', () => {
  const mockSet = setupAtomToggle('isDarkModeAtom', true)
  render(<SettingsComponent />)

  const toggle = screen.getByRole('checkbox', { name: 'Toggle dark mode' })
  fireEvent.click(toggle)

  expect(mockSet).toHaveBeenCalledWith(false)
})

// ---- Small tables ----

test('small tables switch is checked when tableSize is sm', () => {
  setup({ tableSize: 'sm' })
  render(<SettingsComponent />)

  const toggle = screen.getByRole('checkbox', { name: 'Toggle compact tables' })
  expect(toggle).toBeChecked()
})

test('small tables switch is unchecked when tableSize is lg', () => {
  setup({ tableSize: 'lg' })
  render(<SettingsComponent />)

  const toggle = screen.getByRole('checkbox', { name: 'Toggle compact tables' })
  expect(toggle).not.toBeChecked()
})

test('toggling small tables switch calls setter with lg when currently sm', () => {
  const mockSet = setupAtomToggle('tableSizeAtom', 'sm')
  render(<SettingsComponent />)

  const toggle = screen.getByRole('checkbox', { name: 'Toggle compact tables' })
  fireEvent.click(toggle)

  expect(mockSet).toHaveBeenCalledWith('lg')
})

test('toggling small tables switch calls setter with sm when currently lg', () => {
  const mockSet = setupAtomToggle('tableSizeAtom', 'lg')
  render(<SettingsComponent />)

  const toggle = screen.getByRole('checkbox', { name: 'Toggle compact tables' })
  fireEvent.click(toggle)

  expect(mockSet).toHaveBeenCalledWith('sm')
})

// ---- Show buttons in Names ----

test('show buttons in names switch is checked when showNamesButtons is true', () => {
  setup({ showNamesButtons: true })
  render(<SettingsComponent />)

  const toggle = screen.getByRole('checkbox', { name: 'Toggle show buttons in names' })
  expect(toggle).toBeChecked()
})

test('show buttons in names switch is unchecked when showNamesButtons is false', () => {
  setup({ showNamesButtons: false })
  render(<SettingsComponent />)

  const toggle = screen.getByRole('checkbox', { name: 'Toggle show buttons in names' })
  expect(toggle).not.toBeChecked()
})

test('toggling show buttons in names calls setter with false when currently true', () => {
  const mockSet = setupAtomToggle('showNamesButtonsAtom', true)
  render(<SettingsComponent />)

  const toggle = screen.getByRole('checkbox', { name: 'Toggle show buttons in names' })
  fireEvent.click(toggle)

  expect(mockSet).toHaveBeenCalledWith(false)
})

test('toggling show buttons in names calls setter with true when currently false', () => {
  const mockSet = setupAtomToggle('showNamesButtonsAtom', false)
  render(<SettingsComponent />)

  const toggle = screen.getByRole('checkbox', { name: 'Toggle show buttons in names' })
  fireEvent.click(toggle)

  expect(mockSet).toHaveBeenCalledWith(true)
})
