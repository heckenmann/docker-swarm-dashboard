// LogsSetupForm.mocks.js
// Shared test utilities for LogsSetupForm tests

import React, { Suspense } from 'react'
import { Provider } from 'jotai'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import * as atoms from '../../../../src/common/store/atoms'

// Don't mock atoms - tests need real atoms to set initial values via Provider
// The component is wrapped in Suspense in tests to handle async atoms

/**
 * Creates a fresh Provider with real atoms for isolated test execution.
 * Each test gets its own Provider instance to avoid state leakage.
 * 
 * @param {Array|Map} initialValues - Optional initial atom values as [[atom, value], ...] or Map
 * @returns {React.ComponentType} Provider component
 */
export function createTestProvider(initialValues = []) {
  return function TestProvider({ children }) {
    // Convert array to Map if needed
    const initialValuesMap = Array.isArray(initialValues) 
      ? new Map(initialValues)
      : initialValues
    return (
      <Provider initialValues={initialValuesMap}>
        {children}
      </Provider>
    )
  }
}

/**
 * Default initial values for logs form atoms
 */
export const getDefaultInitialValues = () => [
  [atoms.baseUrlAtom, '/'],
  [atoms.viewAtom, {}],
  [atoms.servicesAtom, []],
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
  [atoms.logsSearchKeywordAtom, ''],
  [atoms.logsFormSinceErrorAtom, false],
  [atoms.logsFormSinceAmountAtom, 1],
  [atoms.logsFormSinceUnitAtom, 'h'],
  [atoms.logsFormSinceIsISOAtom, false],
  [atoms.logsNumberOfLinesAtom, 20],
  [atoms.logsConfigAtom, null],
  [atoms.logsShowLogsAtom, false],
  [atoms.currentVariantAtom, 'light'],
]

/**
 * Resets mock state by clearing jest mocks.
 * Real atoms don't need manual reset - each test gets fresh Provider.
 * 
 * @param {Object} overrides - Optional overrides for services/tail
 */
export function resetMockState(overrides = {}) {
  jest.clearAllMocks()
  // For real atoms, state is isolated per Provider instance
  // No global state to reset
}

/**
 * Helper to build initialValues with common overrides
 * @param {Object} overrides - Key-value pairs to override defaults. 
 *                             Keys can be atom names (e.g., 'logsServices') or 
 *                             atom objects themselves.
 * @returns {Array} initialValues array for Provider
 */
export function buildInitialValues(overrides = {}) {
  const defaults = getDefaultInitialValues()
  const overrideMap = new Map(defaults)

  Object.entries(overrides).forEach(([key, value]) => {
    // Try as atom object first (if key is already an atom)
    if (key && typeof key === 'object' && 'init' in key) {
      overrideMap.set(key, value)
      return
    }

    // Try as atom name (e.g., 'logsServices' -> logsServicesAtom)
    const atomKey = `${key}Atom`
    if (atoms[atomKey]) {
      overrideMap.set(atoms[atomKey], value)
    }
  })

  return Array.from(overrideMap.entries())
}

// Export a helper to render the LogsSetupForm with default mocks
export function renderLogsSetupForm(initialValues = []) {
  const TestProvider = createTestProvider(initialValues)
  const LogsSetupForm = require('../../../../src/components/logs/LogsSetupForm').default
  return render(
    <Suspense fallback={<div data-testid=\"loading\">loading</div>}>
      <TestProvider>
        <LogsSetupForm />
      </TestProvider>
    </Suspense>
  )
}

export async function waitForLoadingToFinish() {
  // Wait for Suspense to resolve - the loading element should disappear
  // and the form content should appear
  await waitFor(() => {
    const loading = screen.queryByTestId('loading')
    if (loading) {
      throw new Error('Still loading')
    }
  }, { timeout: 3000 })
}

// Re-export commonly used testing utilities
export { React, Suspense } from 'react'
export { render, screen, fireEvent, waitFor } from '@testing-library/react'
export { Provider } from 'jotai'
export * as atoms from '../../../../src/common/store/atoms'
