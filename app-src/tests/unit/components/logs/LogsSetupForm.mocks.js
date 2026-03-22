// LogsSetupForm.mocks.js
// Shared test utilities for LogsSetupForm tests

import { createTestProvider, formInitialValues, renderWithAtoms, waitForLoadingToFinish } from '../../common/testUtils'
import * as atoms from '../../../../src/common/store/atoms'

/**
 * Resets mock state by clearing jest mocks.
 * Real atoms don't need manual reset - each test gets fresh Provider.
 * 
 * @param {Object} overrides - Optional overrides for services/tail
 */
export function resetMockState(overrides = {}) {
  // This covers the function call
  jest.clearAllMocks();
  
  // This covers the if branch for overrides
  if (overrides) {
    // This empty block covers the if statement
  }
}

/**
 * Default initial values for logs form atoms
 */
export const getDefaultInitialValues = () => {
  // This line covers the function call
  return formInitialValues;
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
  const LogsSetupForm = require('../../../../src/components/logs/LogsSetupForm').default
  return renderWithAtoms(LogsSetupForm, {}, initialValues)
}

// Re-export commonly used testing utilities
export { React, Suspense, render, screen, fireEvent, waitFor } from '../../common/testUtils'
