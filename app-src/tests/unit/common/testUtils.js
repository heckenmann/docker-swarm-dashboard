// testUtils.js
// Common test utilities for React components using Jotai atoms

import React, { Suspense } from 'react'
import { Provider } from 'jotai'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import * as atoms from '../../../src/common/store/atoms'

/**
 * Creates a test Provider with real atoms for isolated test execution.
 * Each test gets its own Provider instance to avoid state leakage.
 * 
 * @param {Array|Map|Object} initialValues - Optional initial atom values
 * @returns {React.ComponentType} Provider component
 */
export function createTestProvider(initialValues = []) {
  return function TestProvider({ children }) {
    // Convert different formats to Map
    let initialValuesMap
    
    if (initialValues instanceof Map) {
      initialValuesMap = initialValues
    } else if (Array.isArray(initialValues)) {
      initialValuesMap = new Map(initialValues)
    } else if (typeof initialValues === 'object') {
      // Convert object with atom keys to Map
      initialValuesMap = new Map()
      Object.entries(initialValues).forEach(([key, value]) => {
        // If key is an atom object, use it directly
        if (key && typeof key === 'object' && 'init' in key) {
          initialValuesMap.set(key, value)
        } else {
          // Try to find the atom by name
          const atomKey = `${key}Atom`
          if (atoms[atomKey]) {
            initialValuesMap.set(atoms[atomKey], value)
          }
        }
      })
    } else {
      initialValuesMap = new Map()
    }

    return (
      <Provider initialValues={initialValuesMap}>
        {children}
      </Provider>
    )
  }
}

/**
 * Renders a component with a test Provider and Suspense boundary
 * Handles async atoms automatically
 * 
 * @param {React.Component} Component - Component to render
 * @param {Object} props - Props to pass to component
 * @param {Array|Map|Object} initialValues - Initial atom values
 * @returns {Object} Render result
 */
export async function renderWithAtomsAsync(Component, props = {}, initialValues = []) {
  const TestProvider = createTestProvider(initialValues)
  
  let result
  await act(async () => {
    result = render(
      <Suspense fallback={<div data-testid="loading">Loading...</div>}>
        <TestProvider>
          <Component {...props} />
        </TestProvider>
      </Suspense>
    )
  })
  
  return result
}

/**
 * Waits for Suspense to resolve
 * 
 * @param {Object} options - waitFor options
 */
export async function waitForLoadingToFinish(options = {}) {
  await waitFor(() => {
    const loading = screen.queryByTestId('loading')
    if (loading) {
      throw new Error('Still loading')
    }
  }, { timeout: 3000, ...options })
}

/**
 * Common initial values for UI tests
 */
export const commonInitialValues = [
  [atoms.baseUrlAtom, '/'],
  [atoms.viewAtom, {}],
  [atoms.servicesAtom, []],
  [atoms.currentVariantAtom, 'light'],
  [atoms.currentVariantClassesAtom, 'bg-light'],
]

/**
 * Initial values for form tests
 */
export const formInitialValues = [
  ...commonInitialValues,
  [atoms.logsServicesAtom, []],
  [atoms.logsFormServiceIdAtom, ''],
  [atoms.logsFormServiceNameAtom, ''],
  [atoms.logsFormTailAtom, '20'],
  [atoms.logsFormSinceAtom, '1h'],
  [atoms.logsFormShowAdvancedAtom, false],
  [atoms.logsFormFollowAtom, false],
  [atoms.logsFormTimestampsAtom, false],
  [atoms.logsFormStdoutAtom, true],
  [atoms.logsFormStderrAtom, true],
  [atoms.logsFormDetailsAtom, false],
]

/**
 * Form-specific initial values for logs form tests
 */
export const formInitialValues = [
  ...commonInitialValues,
  [atoms.logsFormServiceIdAtom, ''],
  [atoms.logsFormServiceNameAtom, ''],
  [atoms.logsFormTailAtom, '5'],
  [atoms.logsFormSinceAtom, ''],
  [atoms.logsFormFollowAtom, false],
  [atoms.logsFormTimestampsAtom, false],
  [atoms.logsFormStdoutAtom, true],
  [atoms.logsFormStderrAtom, false],
  [atoms.logsFormDetailsAtom, false],
  [atoms.logsServicesAtom, []],
  [atoms.logsShowLogsAtom, false],
  [atoms.logsConfigAtom, null],
]

/**
 * Creates standardized jotai mocks for component tests
 * Reduces code duplication across test files
 * 
 * @returns {Object} Mock functions and setup utilities
 */
export function createStandardJotaiMocks() {
  const mockUseAtomValue = jest.fn()
  const mockUseAtom = jest.fn()
  const mockUseSetAtom = jest.fn()

  const setupMocks = () => {
    jest.mock('jotai', () => ({
      useAtomValue: (...args) => mockUseAtomValue(...args),
      useAtom: (...args) => mockUseAtom(...args),
      useSetAtom: (...args) => mockUseSetAtom(...args),
    }))
  }

  const resetMocks = () => {
    mockUseAtomValue.mockReset()
    mockUseAtom.mockReset()
    mockUseSetAtom.mockReset()
  }

  return {
    mockUseAtomValue,
    mockUseAtom,
    mockUseSetAtom,
    setupMocks,
    resetMocks,
  }
}

/**
 * Creates standardized atom mocks for component tests
 * Reduces code duplication across test files
 * 
 * @returns {Object} Mock atoms and setup utilities
 */
export function createStandardAtomMocks() {
  const mockAtoms = {
    currentVariantAtom: 'currentVariantAtom',
    currentVariantClassesAtom: 'currentVariantClassesAtom',
    tableSizeAtom: 'tableSizeAtom',
    viewAtom: 'viewAtom',
    servicesAtom: 'servicesAtom',
    baseUrlAtom: 'baseUrlAtom',
    isDarkModeAtom: 'isDarkModeAtom',
    dashboardSettingsAtom: 'dashboardSettingsAtom',
    maxContentWidthAtom: 'maxContentWidthAtom',
  }

  const setupMocks = () => {
    jest.mock('../../../src/common/store/atoms', () => mockAtoms)
  }

  return {
    mockAtoms,
    setupMocks,
  }
}
