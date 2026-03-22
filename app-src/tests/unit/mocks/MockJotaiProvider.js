import React from 'react'
import { Provider } from 'jotai'

/**
 * MockJotaiProvider - Provides a minimal Jotai context for testing
 * This is a simplified provider that wraps children with Jotai's Provider
 */
export function MockJotaiProvider({ children }) {
  return <Provider>{children}</Provider>
}
