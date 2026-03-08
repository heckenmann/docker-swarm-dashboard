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
    showNavLabels: true,
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
  expect(setShowNavLabels).toHaveBeenCalledWith(true)
  expect(setMaxContentWidth).toHaveBeenCalledWith('fluid')
})

test('showNavLabels switch is checked by default', () => {
  setup()
  render(<SettingsComponent />)

  const toggle = screen.getByRole('checkbox', {
    name: 'Toggle navigation labels',
  })
  expect(toggle).toBeChecked()
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
