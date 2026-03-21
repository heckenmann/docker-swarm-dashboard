// LogsSetupForm.mocks.test.js
// Tests for test utilities in LogsSetupForm.mocks.js

import { buildInitialValues } from './LogsSetupForm.mocks'
import * as atoms from '../../../../src/common/store/atoms'

describe('LogsSetupForm.mocks', () => {
  describe('buildInitialValues', () => {
    it('handles real atom object with init property', () => {
      const overrides = {
        [atoms.logsFormFollowAtom]: true,
      }
      const initialValues = buildInitialValues(overrides)
      expect(initialValues).toBeInstanceOf(Array)
      expect(initialValues.length).toBeGreaterThan(0)
      // The function should handle atom objects without throwing
      expect(() => buildInitialValues(overrides)).not.toThrow()
    })
  })
})
